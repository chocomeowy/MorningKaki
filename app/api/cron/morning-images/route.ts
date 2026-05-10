import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  getSingaporeDateString,
  getStoragePath,
  morningImageBucket,
  morningImageThemes,
} from "@/lib/morning-image-cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const supabaseServer = createServerSupabaseClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_to_bypass_build_error",
});

export async function GET(request: Request) {
  // Check authorization for cron job (Vercel adds this header automatically)
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const today = getSingaporeDateString();
  console.log(`Starting daily image generation for ${today}`);

  try {
    await ensurePublicImageBucket();

    const generationPromises = morningImageThemes.map(async (theme) => {
      console.log(`Generating image for theme: ${theme.name}`);
      const imagePrompt = `${theme.prompt} The text should be clear and high contrast for seniors.`;
      
      try {
        const imageResponse = await openai.images.generate({
          model: "gpt-image-2-2026-04-21",
          prompt: imagePrompt,
        });
        
        const imageData = imageResponse.data?.[0];
        let imageBuffer: ArrayBuffer | Buffer;

        if (imageData?.url) {
          const imgRes = await fetch(imageData.url);
          if (!imgRes.ok) throw new Error(`Failed to fetch image from OpenAI for ${theme.name}`);
          imageBuffer = await imgRes.arrayBuffer();
        } else if (imageData?.b64_json) {
          imageBuffer = Buffer.from(imageData.b64_json, "base64");
        } else {
          throw new Error(`No image data returned for ${theme.name}`);
        }

        const storagePath = getStoragePath(today, theme.name);
        const { error: uploadError } = await supabaseServer.storage
          .from(morningImageBucket)
          .upload(storagePath, imageBuffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabaseServer.storage
          .from(morningImageBucket)
          .getPublicUrl(storagePath);

        const imageUrl = publicUrlData.publicUrl;
        
        const { error } = await supabaseServer
          .from("daily_images")
          .upsert({
            theme: theme.name,
            date_string: today,
            image_url: imageUrl,
            storage_path: storagePath,
          }, { onConflict: 'theme, date_string' });
          
        if (error) throw error;
        return { theme: theme.name, imageUrl, storagePath, success: true };
      } catch (err: any) {
        console.error(`Error generating ${theme.name}:`, err);
        return { theme: theme.name, success: false, error: err.message };
      }
    });
    
    const results = await Promise.all(generationPromises);
    const failures = results.filter(r => !r.success);
    
    if (failures.length > 0) {
      return NextResponse.json({ 
        message: "Partial success", 
        results,
        date: today 
      }, { status: 207 }); // Multi-Status
    }
    
    return NextResponse.json({ success: true, results, date: today });
  } catch (error: any) {
    console.error("Cron job outer failed:", error);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

async function ensurePublicImageBucket() {
  const { error } = await supabaseServer.storage.getBucket(morningImageBucket);
  if (!error) return;

  const { error: createError } = await supabaseServer.storage.createBucket(morningImageBucket, {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/png"],
  });

  if (createError && createError.message !== "The resource already exists") {
    throw createError;
  }
}
