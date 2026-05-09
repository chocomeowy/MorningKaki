import { NextResponse } from "next/server";
import { getMorningDesign } from "@/lib/morning-designs";

interface MorningRequest {
  designId?: string;
  nickname?: string;
  language?: "en" | "zh";
  weather?: string;
}

export async function POST(request: Request) {
  const body = await readBody(request);
  const design = getMorningDesign(body.designId ?? null);
  const nickname = body.nickname?.trim() || "Ah Gong";
  const weather = body.weather?.trim() || "sunny";
  const greeting = body.language === "zh" ? `早上好，${nickname}` : `Good morning, ${nickname}`;

  return NextResponse.json({
    greeting,
    imageUrl: design.heroImage ?? "/morning_illustration.png",
    designId: design.id,
    prompt: buildPrompt({
      designPrompt: design.promptStyle,
      nickname,
      weather,
    }),
    generatedForDate: new Date().toISOString().slice(0, 10),
    demoMode: true,
  });
}

async function readBody(request: Request): Promise<MorningRequest> {
  try {
    return (await request.json()) as MorningRequest;
  } catch {
    return {};
  }
}

function buildPrompt({
  designPrompt,
  nickname,
  weather,
}: {
  designPrompt: string;
  nickname: string;
  weather: string;
}) {
  return [
    designPrompt,
    `Personalise for ${nickname}.`,
    `Weather context: ${weather} Singapore morning.`,
    "Use large readable multilingual text, cheerful health blessing, and no small dense copy.",
    "Output one landscape WhatsApp-friendly good morning card.",
  ].join(" ");
}
