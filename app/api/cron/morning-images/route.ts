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
    prompt: "Soft watercolour illustration, warm pastel colours, Singapore context, morning sunrise, blooming pink lotus and orchids, doves flying, cosy and cheerful, suitable for elderly audience. Include the words 'Good Morning' and '早安' in beautiful, large, readable golden calligraphy.",
  },
  {
    name: "gardens",
    prompt: "Soft watercolour illustration, warm pastel colours, Singapore context, Gardens by the Bay supertrees at morning sunrise, lush greenery, cosy and cheerful, suitable for elderly audience. Include the words 'Good Morning' and '早安' in elegant white calligraphy.",
  },
  {
    name: "calm",
    prompt: "Soft watercolour illustration, warm pastel colours, Singapore context, calm morning mist over a zen garden with bamboo, cosy and cheerful, suitable for elderly audience. Include the words 'Good Morning' and '早安' in gentle soft-focus calligraphy.",
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
    const generationPromises = themes.map(async (theme) => {
      console.log(`Generating image for theme: ${theme.name}`);
      const imagePrompt = `${theme.prompt} The text should be clear and high contrast for seniors.`;
      
      try {
        const imageResponse = await openai.images.generate({
          model: "gpt-image-2-2026-04-21",
          prompt: imagePrompt,
        });
        
        const imageData = imageResponse.data?.[0];
        let dataUrl = "";

        if (imageData?.url) {
          const imgRes = await fetch(imageData.url);
          if (!imgRes.ok) throw new Error(`Failed to fetch image from OpenAI for ${theme.name}`);
          const buffer = await imgRes.arrayBuffer();
          dataUrl = `data:image/png;base64,${Buffer.from(buffer).toString("base64")}`;
        } else if (imageData?.b64_json) {
          dataUrl = `data:image/png;base64,${imageData.b64_json}`;
        } else {
          throw new Error(`No image data returned for ${theme.name}`);
        }
        
        const { error } = await supabaseServer
          .from("daily_images")
          .upsert({
            theme: theme.name,
            date_string: today,
            image_url: dataUrl
          }, { onConflict: 'theme, date_string' });
          
        if (error) throw error;
        return { theme: theme.name, success: true };
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
