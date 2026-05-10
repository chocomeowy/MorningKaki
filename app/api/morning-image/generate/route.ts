import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  getMorningImageTheme,
  getSingaporeDateString,
  getStoragePath,
  getThemeForDesign,
  morningImageBucket,
} from "@/lib/morning-image-cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_to_bypass_build_error",
});

interface GenerateMorningImageRequest {
  designId?: string;
  theme?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as GenerateMorningImageRequest;
    const themeName = body.theme ?? getThemeForDesign(body.designId);
    const theme = getMorningImageTheme(themeName);
    const dateString = getSingaporeDateString();
    const imagePrompt = `${theme.prompt} The text should be clear and high contrast for seniors.`;

    const imageResponse = await openai.images.generate({
      model: "gpt-image-2-2026-04-21",
      prompt: imagePrompt,
    });

    const imageData = imageResponse.data?.[0];
    let imageBuffer: ArrayBuffer | Buffer;

    if (imageData?.url) {
      const imageFetch = await fetch(imageData.url);
      if (!imageFetch.ok) throw new Error("Failed to fetch generated image");
      imageBuffer = await imageFetch.arrayBuffer();
    } else if (imageData?.b64_json) {
      imageBuffer = Buffer.from(imageData.b64_json, "base64");
    } else {
      throw new Error("No image data returned");
    }

    const supabase = createServerSupabaseClient();
    await ensurePublicImageBucket(supabase);

    const storagePath = getStoragePath(dateString, theme.name);
    const { error: uploadError } = await supabase.storage
      .from(morningImageBucket)
      .upload(storagePath, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from(morningImageBucket)
      .getPublicUrl(storagePath);

    const imageUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;
    const { error: cacheError } = await supabase.from("daily_images").upsert({
      theme: theme.name,
      date_string: dateString,
      image_url: imageUrl,
      storage_path: storagePath,
    }, { onConflict: "theme, date_string" });

    if (cacheError) throw cacheError;

    return NextResponse.json({
      imageUrl,
      theme: theme.name,
      dateString,
      storagePath,
      source: "manual",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate replacement image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function ensurePublicImageBucket(supabase: ReturnType<typeof createServerSupabaseClient>) {
  const { error } = await supabase.storage.getBucket(morningImageBucket);
  if (!error) return;

  const { error: createError } = await supabase.storage.createBucket(morningImageBucket, {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/png"],
  });

  if (createError && createError.message !== "The resource already exists") {
    throw createError;
  }
}
