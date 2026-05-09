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

    // 2. Generate the morning illustration using DALL-E 3
    const imagePrompt = `Soft watercolour illustration, warm pastel colours, Singapore context, ${weather} morning, cosy and cheerful, no text, suitable for elderly audience. ${design.promptStyle || ''}`;
    
    let imageUrl = design.heroImage ?? "/morning_illustration.png";
    let imageError: string | null = null;
    
    try {
      const imageResponse = await openai.images.generate({
        model: "gpt-image-1",
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
