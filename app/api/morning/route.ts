import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getMorningDesign } from "@/lib/morning-designs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_to_bypass_build_error",
});

interface MorningRequest {
  designId?: string;
  nickname?: string;
  language?: "en" | "zh" | "hokkien" | "cantonese" | "ms";
  weather?: string;
  randomTheme?: boolean;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Morning generation failed";
}

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    const design = getMorningDesign(body.designId ?? null);
    const nickname = body.nickname?.trim() || "Ah Gong";
    const weather = body.weather?.trim() || "sunny";
    const language = body.language || "en";

    const todayDay = new Date().toLocaleDateString('en-SG', { weekday: 'long', timeZone: 'Asia/Singapore' });

    // 1. Generate the personalized greeting text using GPT-5-nano
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content: "You are a warm, caring AI companion for elderly people in Singapore. Speak naturally, kindly, and conversationally. Use a very warm, slightly local Singaporean tone.",
        },
        {
          role: "user",
          content: `Write a morning greeting for ${nickname}. It is currently ${todayDay}. The weather today is ${weather}.
Write it in ${language === 'zh' ? 'Mandarin Chinese' : 'English'}.
The message should be 3 to 4 sentences. 
- Say good morning.
- Mention what day it is today and the weather.
- Wish them a wonderful day ahead.
- Casually mention that you have some interesting news for them today.
Make it sound like a friendly voice message. Do not include emojis, this will be read aloud by text-to-speech.`,
        },
      ],
      max_completion_tokens: 150,
    });

    const greeting = chatResponse.choices[0].message.content?.trim() || `Good morning, ${nickname}!`;

    // 2. Determine today's rotating theme (cycles every day: blessing → gardens → calm)
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
    );
    const themes = [
      {
        name: "blessing",
        prompt:
          "Singapore-style good morning blessing card. Soft pink roses in full bloom, delicate gold and pink lotus flowers, warm morning sunlight, doves flying, heart motifs, pastel pink and gold tones, cheerful and auspicious, highly saturated vibrant watercolour photography style, wide landscape format.",
      },
      {
        name: "gardens",
        prompt:
          "Singapore good morning card featuring Gardens by the Bay supertrees at sunrise with pink and purple sky, lush tropical greenery, lotus pond reflection, warm golden light, vibrant and colourful digital painting, wide landscape format.",
      },
      {
        name: "calm",
        prompt:
          "Serene Singapore good morning card. Calm zen garden with soft morning mist, orchids and tropical flowers, gentle bamboo, warm amber and green tones, birds perched on branches, peaceful elderly-friendly aesthetic, vibrant warm watercolour photography wide landscape format.",
      },
    ];
    
    // If randomTheme is requested (like from the Demo Generator), pick randomly.
    // Otherwise, tie it to the day of the year so all seniors get the same theme that morning.
    const themeIndex = body.randomTheme 
      ? Math.floor(Math.random() * themes.length)
      : dayOfYear % 3;
      
    const theme = themes[themeIndex];

    const imagePrompt = `${theme.prompt} No text overlaid. Suitable for a Singapore elderly senior audience. ${design.promptStyle || ""}`;
    
    let imageUrl = design.heroImage ?? "/morning_illustration.png";
    let imageError: string | null = null;
    
    try {
      const imageResponse = await openai.images.generate({
        model: "gpt-image-2-2026-04-21",
        prompt: imagePrompt,
        n: 1,
        size: "1536x1024",
        quality: "low",
      });
      const generatedImage = imageResponse.data?.[0];
      imageUrl = generatedImage?.url ?? imageUrl;
      if (!generatedImage?.url && generatedImage?.b64_json) {
        imageUrl = `data:image/png;base64,${generatedImage.b64_json}`;
      }
    } catch (imgError: unknown) {
      imageError = getErrorMessage(imgError);
    }

    return NextResponse.json({
      greeting,
      imageUrl,
      theme: theme.name,
      imageSource: imageUrl.startsWith("http") || imageUrl.startsWith("data:") ? "openai" : "static-fallback",
      imageError: process.env.NODE_ENV === "production" ? undefined : imageError,
      designId: design.id,
      prompt: imagePrompt,
      generatedForDate: new Date().toISOString().slice(0, 10),
      demoMode: false,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

async function readBody(request: Request): Promise<MorningRequest> {
  try {
    return (await request.json()) as MorningRequest;
  } catch {
    return {};
  }
}
