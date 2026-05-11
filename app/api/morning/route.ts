import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_to_bypass_build_error",
});

const MORNING_SCRIPT_MODEL = "gpt-5.4-mini";
const MORNING_SCRIPT_FALLBACK_MODEL = "gpt-5-nano";

interface MorningRequest {
  designId?: string;
  nickname?: string;
  language?: "en" | "zh" | "hokkien" | "cantonese";
  weather?: string;
  randomTheme?: boolean;
  medicines?: string[];
  reminders?: string[];
  localNews?: string[];
}

interface MorningMessage {
  role: "system" | "user";
  content: string;
}

const CNA_RSS_URL = "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=10416";
const NEA_2_HOUR_FORECAST_URL = "https://api.data.gov.sg/v1/environment/2-hour-weather-forecast";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Morning generation failed";
}

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    const nickname = body.nickname?.trim() || "Ah Gong";
    const weather = await getSingaporeWeather(body.weather);
    const language = body.language || "en";
    const medicines = normaliseList(body.medicines, "No medicine reminders for this morning.");
    const reminders = normaliseList(body.reminders, "No appointments or reminders today.");
    const localNews = await getSingaporeNews(body.localNews);

    const todayDay = new Date().toLocaleDateString('en-SG', { weekday: 'long', timeZone: 'Asia/Singapore' });
    const todayDate = new Date().toLocaleDateString("en-SG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Singapore",
    });

    // 1. Generate the personalized spoken script, with nano fallback if unavailable.
    const messages: MorningMessage[] = [
        {
          role: "system",
          content: [
            "You write spoken scripts for ElevenLabs text-to-speech.",
            "Audience: Singapore seniors.",
            "Tone: enthusiastic, warm, caring, upbeat, local, and respectful.",
            "Factual accuracy is more important than sounding polished.",
            "Avoid emojis, markdown, bullet points, stage directions, URLs, and hard-to-read symbols.",
            "Do not include bracketed delivery cues like [enthusiastic], and do not say the word enthusiastic aloud.",
            "Keep it concise enough to read aloud in about 75 to 100 seconds.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            `Write one spoken morning script for ${nickname}.`,
            `Use the senior nickname exactly as written: ${nickname}. Do not translate, romanise, or rename it.`,
            `Language or dialect: ${getLanguageInstruction(language)}.`,
            `Today is ${todayDay}, ${todayDate}.`,
            `Weather: ${weather} in Singapore.`,
            `Medicine reminders: ${medicines.join("; ")}`,
            `Appointments and reminders: ${reminders.join("; ")}`,
            `Local news from Channel NewsAsia RSS: ${localNews.join("; ")}`,
            "Include these parts naturally: good morning greeting, date/day, NEA weather, medicine reminder, appointment/reminder if any, at least three local news summaries when available, and a kind closing wish.",
            "Do not say vague lines like 'there is local news' or 'I have news'. State the actual news plainly and gently.",
            "Do not invent appointment locations, clinics, documents, symptoms, or medicine instructions beyond the provided reminders.",
            "For appointments and reminders, repeat only the provided reminder text and time. Do not add what to bring, where to go, or medical advice unless it is explicitly provided.",
            "For news, preserve names and offices accurately. PM Wong means Lawrence Wong, not Lee Hsien Loong. If a Chinese name is uncertain, keep the English name.",
            "Keep Singapore place names like Toa Payoh, CNA, NEA, Canvas, IMDA, and CSA exactly as written.",
            "For Cantonese, write in Traditional Chinese text with natural Hong Kong or Singapore Cantonese phrasing, not English or romanisation.",
            "If the language or dialect is Mandarin or Cantonese, every sentence must be Chinese text. Translate medicine, weather, reminders, and local news into Chinese. Do not leave English words except the senior nickname and uncertain proper names.",
          ].join("\n"),
        },
      ];
    const generatedScript = await createMorningScript(messages);
    const spokenScript = sanitizeSpokenScript(generatedScript) || getFallbackSpokenScript({
      language,
      nickname,
      todayDay,
      weather,
      medicines,
      reminders,
      localNews,
    });
    const greeting = getDisplayGreeting(language, nickname);

    return NextResponse.json({
      greeting,
      spokenScript,
      weather,
      localNews,
      medicines,
      reminders,
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

async function getSingaporeWeather(providedWeather: string | undefined) {
  try {
    const response = await fetch(NEA_2_HOUR_FORECAST_URL, { next: { revalidate: 900 } });
    if (!response.ok) throw new Error("NEA weather fetch failed");

    const data = (await response.json()) as {
      items?: { forecasts?: { area: string; forecast: string }[] }[];
    };
    const forecasts = data.items?.[0]?.forecasts ?? [];
    const preferredForecast =
      forecasts.find((item) => item.area === "Toa Payoh") ??
      forecasts.find((item) => item.area === "City") ??
      forecasts[0];

    if (preferredForecast) {
      return `NEA forecast for ${preferredForecast.area}: ${preferredForecast.forecast}`;
    }
  } catch {
    // Fall back to caregiver/app-provided weather if NEA is unavailable.
  }

  return providedWeather?.trim() || "NEA forecast unavailable; use a gentle sunny Singapore morning fallback";
}

async function getSingaporeNews(providedNews: string[] | undefined) {
  try {
    const response = await fetch(CNA_RSS_URL, { next: { revalidate: 1200 } });
    if (!response.ok) throw new Error("CNA RSS fetch failed");

    const xml = await response.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
    const headlines = items
      .map((item) => {
        const title = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1]
          ?? item.match(/<title>([\s\S]*?)<\/title>/)?.[1]
          ?? "";
        const description = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1]
          ?? item.match(/<description>([\s\S]*?)<\/description>/)?.[1]
          ?? "";
        const cleanedTitle = decodeXml(title);
        const cleanedDescription = decodeXml(description).replace(/\s+/g, " ");
        return cleanedDescription ? `${cleanedTitle}: ${cleanedDescription}` : cleanedTitle;
      })
      .filter(Boolean)
      .slice(0, 5);

    if (headlines.length > 0) return headlines;
  } catch {
    // Fall back to caregiver-selected or app-provided items if CNA is unavailable.
  }

  return normaliseList(providedNews, "No local news selected today.");
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function sanitizeSpokenScript(script: string | undefined) {
  return script
    ?.replace(/\[\s*enthusiastic\s*\]/gi, "")
    .replace(/^\s*\[[^\]]+\]\s*/g, "")
    .replace(/李显龙总理|李显龙|王瑞杰（Lawrence Wong）|王瑞杰/g, "Lawrence Wong")
    .replace(/财政部长兼副总理Lawrence Wong|副总理Lawrence Wong/g, "PM Lawrence Wong")
    .replace(/，请准时出门，带好您的身份证和医疗卡/g, "，请按提醒的时间安排")
    .replace(/，带好您的身份证和医疗卡/g, "")
    .replace(/大巴窩|大巴窑|大巴窯/g, "Toa Payoh")
    .replace(/東北季風過來，|东北季风过来，/g, "")
    .trim();
}

function getDisplayGreeting(language: MorningRequest["language"], nickname: string) {
  if (language === "zh" || language === "hokkien" || language === "cantonese") {
    return `早上好，${nickname}`;
  }

  return `Good morning, ${nickname}`;
}

function getLanguageInstruction(language: MorningRequest["language"]) {
  if (language === "zh") return "Mandarin Chinese, natural Singapore style";
  if (language === "hokkien") return "Legacy dialect selection; write Cantonese-style Traditional Chinese text because the app now uses the Cantonese voice.";
  if (language === "cantonese") return "Cantonese-style Traditional Chinese text, warm and natural for Singapore seniors. Do not use English or romanised Cantonese.";
  return "English with a gentle Singapore tone";
}

async function createMorningScript(messages: MorningMessage[]) {
  const input = messages.map((message) => `${message.role.toUpperCase()}:\n${message.content}`).join("\n\n");

  try {
    const response = await openai.responses.create({
      model: MORNING_SCRIPT_MODEL,
      input,
      max_output_tokens: 8000,
      reasoning: { effort: "minimal" },
      text: { verbosity: "high" },
    });

    return response.output_text?.trim();
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    if (errorMessage.includes("does not have access") || errorMessage.includes("model_not_found")) {
      const response = await openai.responses.create({
        model: MORNING_SCRIPT_FALLBACK_MODEL,
        input,
        max_output_tokens: 8000,
        reasoning: { effort: "minimal" },
        text: { verbosity: "high" },
      });

      return response.output_text?.trim();
    }

    throw error;
  }
}

function getFallbackSpokenScript({
  language,
  nickname,
  todayDay,
  weather,
  medicines,
  reminders,
  localNews,
}: {
  language: MorningRequest["language"];
  nickname: string;
  todayDay: string;
  weather: string;
  medicines: string[];
  reminders: string[];
  localNews: string[];
}) {
  if (language === "zh" || language === "hokkien" || language === "cantonese") {
    return [
      `早上好，${nickname}。今天是${getChineseWeekday(todayDay)}，新加坡天气${getChineseWeather(weather)}。`,
      `记得照家人安排，按时吃药。`,
      `今天如果有预约或提醒，慢慢来，不用着急。`,
      `本地有一些生活消息，等一下可以看看。祝你今天开心、平安、身体健康。`,
    ].join("");
  }

  return [
    `Good morning, ${nickname}. Today is ${todayDay}, and the weather in Singapore is ${weather}. `,
    `Please remember your medicine: ${medicines.join(", ")}. `,
    `Your reminders today: ${reminders.join(", ")}. `,
    `Local news: ${localNews.join(", ")}. Have a bright and healthy day.`,
  ].join("");
}

function getChineseWeekday(weekday: string) {
  const weekdays: Record<string, string> = {
    Monday: "星期一",
    Tuesday: "星期二",
    Wednesday: "星期三",
    Thursday: "星期四",
    Friday: "星期五",
    Saturday: "星期六",
    Sunday: "星期日",
  };

  return weekdays[weekday] ?? weekday;
}

function getChineseWeather(weather: string) {
  const lowerWeather = weather.toLowerCase();
  if (lowerWeather.includes("sunny")) return "晴朗，大约二十八度";
  if (lowerWeather.includes("rain")) return "有雨，出门要小心";
  if (lowerWeather.includes("cloud")) return "多云";
  if (lowerWeather.includes("hot")) return "比较热，记得喝水";
  return "不错";
}
