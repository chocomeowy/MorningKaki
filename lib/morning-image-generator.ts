import OpenAI from "openai";
import {
  getMorningImageTheme,
  getSingaporeDateString,
  getStoragePath,
  morningImageBucket,
  type MorningImageTheme,
} from "@/lib/morning-image-cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_to_bypass_build_error",
});

export interface GeneratedMorningImage {
  imageUrl: string;
  theme: MorningImageTheme;
  dateString: string;
  storagePath: string;
}

export async function generateAndCacheMorningImage(themeName: MorningImageTheme): Promise<GeneratedMorningImage> {
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

  return {
    imageUrl,
    theme: theme.name,
    dateString,
    storagePath,
  };
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
