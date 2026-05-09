import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const supabaseServer = createServerSupabaseClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_to_bypass_build_error",
});

const themes = [
  {
    name: "blessing",
    prompt: "Soft watercolour illustration, warm pastel colours, Singapore context, morning sunrise, blooming pink lotus and orchids, doves flying, cosy and cheerful, no text, suitable for elderly audience.",
  },
  {
    name: "gardens",
    prompt: "Soft watercolour illustration, warm pastel colours, Singapore context, Gardens by the Bay supertrees at morning sunrise, lush greenery, cosy and cheerful, no text, suitable for elderly audience.",
  },
  {
    name: "calm",
    prompt: "Soft watercolour illustration, warm pastel colours, Singapore context, calm morning mist over a zen garden with bamboo, cosy and cheerful, no text, suitable for elderly audience.",
  }
];

export async function GET(request: Request) {
  // Check authorization for cron job (Vercel adds this header automatically)
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  console.log(`Starting daily image generation for ${today}`);

  try {
    for (const theme of themes) {
      console.log(`Generating image for theme: ${theme.name}`);
      
      const imagePrompt = `${theme.prompt} No text overlaid. Suitable for a Singapore elderly senior audience.`;
      
      const imageResponse = await openai.images.generate({
        model: "gpt-image-2-2026-04-21",
        prompt: imagePrompt,
        n: 1,
        size: "1536x1024",
        quality: "low",
        response_format: "b64_json",
      });
      
      const generatedImage = imageResponse.data?.[0];
      if (generatedImage?.b64_json) {
        const dataUrl = `data:image/png;base64,${generatedImage.b64_json}`;
        
        // Upsert into Supabase
        const { error } = await supabaseServer
          .from("daily_images")
          .upsert({
            theme: theme.name,
            date_string: today,
            image_url: dataUrl
          }, { onConflict: 'theme, date_string' });
          
        if (error) {
          console.error(`Failed to save ${theme.name} to DB:`, error);
        } else {
          console.log(`Successfully saved ${theme.name} to DB`);
        }
      }
    }
    
    return NextResponse.json({ success: true, date: today });
  } catch (error: any) {
    console.error("Cron job failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
