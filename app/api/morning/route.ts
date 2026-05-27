import { NextResponse } from "next/server";

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

    // In showcase mode, we bypass OpenAI script generation completely to use 0 tokens.
    // We construct the spoken script using the high-fidelity local dynamic template.
    const spokenScript = getFallbackSpokenScript({
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

function getDisplayGreeting(language: MorningRequest["language"], nickname: string) {
  if (language === "zh" || language === "hokkien" || language === "cantonese") {
    return `早上好，${nickname}`;
  }

  return `Good morning, ${nickname}`;
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
