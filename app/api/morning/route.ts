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

    // 1. Generate the personalized greeting text using GPT-5-nano
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content: "You are a warm, caring AI companion for elderly people in Singapore. Keep your responses to a single, short, cheerful sentence.",
        },
        {
          role: "user",
          content: `Write a short morning greeting for ${nickname}. The weather today is ${weather}. Write it in ${language === 'zh' ? 'Mandarin Chinese' : 'English'}. Include a friendly emoji.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 60,
    });

    const greeting = chatResponse.choices[0].message.content?.trim() || `Good morning, ${nickname}!`;

    // 2. Generate the morning illustration using DALL-E 3
    const imagePrompt = `Soft watercolour illustration, warm pastel colours, Singapore context, ${weather} morning, cosy and cheerful, no text, suitable for elderly audience. ${design.promptStyle || ''}`;
    
    let imageUrl = design.heroImage ?? "/morning_illustration.png";
    
    try {
      const imageResponse = await openai.images.generate({
        model: "gpt-image-2",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
      });
      imageUrl = imageResponse.data?.[0]?.url ?? imageUrl;
    } catch (imgError: unknown) {
      void imgError;
    }

    return NextResponse.json({
      greeting,
      imageUrl,
      imageSource: imageUrl.startsWith("http") ? "openai" : "static-fallback",
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
