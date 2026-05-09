import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getMorningDesign } from "@/lib/morning-designs";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const supabaseServer = createServerSupabaseClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_to_bypass_build_error",
});

interface MorningRequest {
  designId?: string;
  nickname?: string;
  language?: "en" | "zh" | "hokkien" | "cantonese" | "ms";
  weather?: string;
  randomTheme?: boolean;
  medicines?: string[];
  reminders?: string[];
  localNews?: string[];
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
    const medicines = normaliseList(body.medicines, "No medicine reminders for this morning.");
    const reminders = normaliseList(body.reminders, "No appointments or reminders today.");
    const localNews = normaliseList(body.localNews, "No local news selected today.");

    const todayDay = new Date().toLocaleDateString('en-SG', { weekday: 'long', timeZone: 'Asia/Singapore' });
    const todayDate = new Date().toLocaleDateString("en-SG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Singapore",
    });

    // 1. Generate the personalized spoken script using GPT-5-nano
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content: [
            "You write spoken scripts for ElevenLabs text-to-speech.",
            "Audience: Singapore seniors.",
            "Tone: [enthusiastic], warm, caring, upbeat, local, and respectful.",
            "Avoid emojis, markdown, bullet points, stage directions, URLs, and hard-to-read symbols.",
            "Keep it concise enough to read aloud in about 45 to 70 seconds.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            `Write one spoken morning script for ${nickname}.`,
            `Language or dialect: ${getLanguageInstruction(language)}.`,
            `Today is ${todayDay}, ${todayDate}.`,
            `Weather: ${weather} in Singapore.`,
            `Medicine reminders: ${medicines.join("; ")}`,
            `Appointments and reminders: ${reminders.join("; ")}`,
            `Local news selected by caregiver: ${localNews.join("; ")}`,
            "Start the script with the literal delivery cue [enthusiastic].",
            "Include these parts naturally: good morning greeting, date/day, weather, medicine reminder, appointment/reminder if any, local news summary, and a kind closing wish.",
            "For Hokkien or Cantonese, write in Chinese text, not English or romanisation, so ElevenLabs can read it with a Chinese-capable voice.",
          ].join("\n"),
        },
      ],
      max_completion_tokens: 260,
    });

    const spokenScript = chatResponse.choices[0].message.content?.trim() || `Good morning, ${nickname}. Today is ${todayDay}, and the weather is ${weather}. Please remember your medicine and have a wonderful day.`;
    const greeting = getDisplayGreeting(language, nickname);

    // 2. Determine today's theme based on profile design setting
    const designThemeMap: Record<string, string> = {
      "heritage-card": "blessing",
      "garden-collage": "gardens",
      "waterfall-calm": "calm"
    };
    
    // Default to blessing if not found, but if randomTheme is true (e.g. for demo generator), pick randomly
    const themeNames = ["blessing", "gardens", "calm"];
    const theme = body.randomTheme 
      ? themeNames[Math.floor(Math.random() * themeNames.length)]
      : designThemeMap[design.id] || "blessing";

    const todayStr = new Date().toISOString().slice(0, 10);
    let imageUrl = `/daily-theme-${theme}.png`; // default fallback
    let imageSource = "static";

    try {
      const { data, error } = await supabaseServer
        .from("daily_images")
        .select("image_url")
        .eq("theme", theme)
        .eq("date_string", todayStr)
        .single();
        
      if (data?.image_url && !error) {
        imageUrl = data.image_url;
        imageSource = "database";
      }
    } catch (e) {
      console.error("Failed to fetch daily image from DB, using fallback", e);
    }

    return NextResponse.json({
      greeting,
      spokenScript,
      weather,
      localNews,
      medicines,
      reminders,
      imageUrl,
      theme,
      imageSource,
      designId: design.id,
      generatedForDate: todayStr,
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

function normaliseList(items: string[] | undefined, fallback: string) {
  const cleaned = (items ?? []).map((item) => item.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned.slice(0, 4) : [fallback];
}

function getDisplayGreeting(language: MorningRequest["language"], nickname: string) {
  if (language === "zh" || language === "hokkien" || language === "cantonese") {
    return `早上好，${nickname}`;
  }

  if (language === "ms") {
    return `Selamat pagi, ${nickname}`;
  }

  return `Good morning, ${nickname}`;
}

function getLanguageInstruction(language: MorningRequest["language"]) {
  if (language === "zh") return "Mandarin Chinese, natural Singapore style";
  if (language === "hokkien") return "Chinese text, with a warm Singapore Hokkien family tone, but written in Chinese characters for ElevenLabs pronunciation";
  if (language === "cantonese") return "Chinese text, with a warm Cantonese family tone, but written in Chinese characters for ElevenLabs pronunciation";
  if (language === "ms") return "Malay as spoken warmly in Singapore";
  return "English with a gentle Singapore tone";
}
