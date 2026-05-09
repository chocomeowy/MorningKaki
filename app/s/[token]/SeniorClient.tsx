"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  BellRing,
  CalendarClock,
  Check,
  ImageIcon,
  Mic,
  Pill,
  Share2,
  Sun,
  Volume2,
} from "lucide-react";
import {
  defaultMorningDesign,
  getMorningDesign,
  morningDesignStorageKey,
  type MorningDesign,
} from "@/lib/morning-designs";

const copy = {
  en: {
    greeting: (name: string) => `Good morning, ${name}`,
    subcopy: "Saturday, 9 May · Sunny 28°C",
    listen: "Tap to talk",
    today: "Today",
    news: "Local news",
    share: "Share morning",
    moodPrompt: "How are you feeling?",
    reply: "Morning is ready. I will read it aloud.",
    stickers: [
      { id: "energetic", emoji: "😊", label: "Energetic" },
      { id: "tired", emoji: "😴", label: "Tired" },
      { id: "down", emoji: "🌧️", label: "Down" },
      { id: "grateful", emoji: "❤️", label: "Grateful" },
      { id: "confused", emoji: "😕", label: "Confused" },
    ],
    reminders: [
      { time: "08:00", title: "Blood pressure medicine", icon: Pill, status: "Ready" },
      { time: "14:00", title: "Polyclinic checkup", icon: CalendarClock, status: "Later" },
    ],
    newsItems: [
      "CDC vouchers can now be used at more nearby supermarkets.",
      "New sheltered walkway opens near Toa Payoh MRT this week.",
    ],
  },
  zh: {
    greeting: (name: string) => `早上好，${name}`,
    subcopy: "5月9日 星期六 · 晴朗 28°C",
    listen: "按这里说话",
    today: "今天",
    news: "本地新闻",
    share: "分享早安",
    moodPrompt: "今天感觉怎样？",
    reply: "早晨内容准备好了，我会读给你听。",
    stickers: [
      { id: "energetic", emoji: "😊", label: "精神好" },
      { id: "tired", emoji: "😴", label: "很累" },
      { id: "down", emoji: "🌧️", label: "心情差" },
      { id: "grateful", emoji: "❤️", label: "感恩" },
      { id: "confused", emoji: "😕", label: "不明白" },
    ],
    reminders: [
      { time: "08:00", title: "吃高血压药", icon: Pill, status: "准备好" },
      { time: "14:00", title: "去综合诊所看医生", icon: CalendarClock, status: "稍后" },
    ],
    newsItems: [
      "CDC购物券现在可以在更多附近超市使用。",
      "大巴窑地铁站附近新的有盖走道本周开放。",
    ],
  },
};

export function SeniorClient({ senior }: { senior: any }) {
  const defaultLang = senior.primary_language === "zh" ? "zh" : "en";
  const [language, setLanguage] = useState<"en" | "zh">(defaultLang);
  const [selectedMood, setSelectedMood] = useState("energetic");
  const [design] = useState<MorningDesign>(() => {
    if (typeof window === "undefined") {
      return defaultMorningDesign;
    }
    return getMorningDesign(window.localStorage.getItem(morningDesignStorageKey));
  });

  const content = copy[language];

  useEffect(() => {
    async function registerPush() {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;

          // Helper to convert VAPID key to Uint8Array
          const urlBase64ToUint8Array = (base64String: string) => {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding)
              .replace(/-/g, '+')
              .replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
              outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
          };

          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
          
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey)
          });
          
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seniorId: senior.id, subscription })
          });
        } catch (err) {
          console.error("Push registration failed", err);
        }
      }
    }
    
    registerPush();
  }, [senior.id]);

  return (
    <main className="min-h-screen bg-[#fff8ed] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <header className="flex items-center justify-between px-5 pb-3 pt-4">
          <div>
            <p className="text-2xl font-extrabold tracking-tight text-amber-800">MorningKaki</p>
            <p className="text-lg font-bold text-slate-500">{content.reply}</p>
            <button 
              id="test-push-btn"
              onClick={async () => {
                await fetch('/api/push/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    seniorId: senior.id,
                    title: "Test Push",
                    body: "This is a test notification."
                  })
                });
              }}
              className="mt-2 rounded bg-amber-500 px-3 py-1 text-sm font-bold text-white"
            >
              Test Push
            </button>
          </div>
          <div className="flex rounded-full border border-amber-200 bg-white p-1 shadow-sm">
            {(["en", "zh"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setLanguage(item)}
                className={`min-h-10 rounded-full px-4 text-lg font-extrabold ${
                  language === item ? "bg-amber-500 text-white" : "text-amber-800"
                }`}
              >
                {item === "en" ? "EN" : "中"}
              </button>
            ))}
          </div>
        </header>

        <section className="px-4">
          <MorningCard design={design} content={content} nickname={senior.nickname} />
        </section>

        <section className="mt-4 grid grid-cols-[1fr_auto] gap-3 px-4">
          <button className="flex min-h-24 items-center justify-center gap-4 rounded-[1.75rem] bg-slate-950 px-5 text-left text-white shadow-lg shadow-slate-950/15 active:scale-[0.98]">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
              <Mic className="h-8 w-8" />
            </span>
            <span className="text-2xl font-extrabold">{content.listen}</span>
          </button>
          <button className="flex min-h-24 w-24 flex-col items-center justify-center rounded-[1.75rem] bg-[#25D366] text-white shadow-lg shadow-green-500/20">
            <Share2 className="h-8 w-8" />
            <span className="mt-1 text-lg font-bold leading-tight">{content.share}</span>
          </button>
        </section>

        <section className="mt-5 px-4">
          <p className="mb-3 text-xl font-extrabold">{content.moodPrompt}</p>
          <div className="grid grid-cols-5 gap-2">
            {content.stickers.map((sticker) => (
              <button
                key={sticker.id}
                onClick={() => setSelectedMood(sticker.id)}
                className={`min-h-24 rounded-[1.35rem] border bg-white p-2 text-center shadow-sm ${
                  selectedMood === sticker.id ? "border-amber-400 ring-4 ring-amber-100" : "border-amber-100"
                }`}
              >
                <span className="block text-4xl">{sticker.emoji}</span>
                <span className="mt-1 block text-lg font-extrabold leading-tight text-slate-600">{sticker.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5 space-y-3 px-4">
          <SectionTitle title={content.today} icon={BellRing} />
          {content.reminders.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex min-h-20 items-center gap-4 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-amber-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-extrabold">{item.title}</p>
                  <p className="text-base font-bold text-slate-500">{item.time}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-lg font-extrabold text-emerald-700">
                  {item.status}
                </span>
              </div>
            );
          })}
        </section>

        <section className="mt-5 space-y-3 px-4 pb-8">
          <SectionTitle title={content.news} icon={Volume2} />
          {content.newsItems.map((item) => (
            <button key={item} className="flex w-full items-center gap-4 rounded-[1.5rem] bg-white p-4 text-left shadow-sm ring-1 ring-amber-100">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <Volume2 className="h-6 w-6" />
              </span>
              <span className="text-lg font-bold leading-snug">{item}</span>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}

function MorningCard({
  design,
  content,
  nickname,
}: {
  design: MorningDesign;
  content: (typeof copy)["en"];
  nickname: string;
}) {
  if (design.heroImage) {
    return (
      <div className="relative h-[38vh] min-h-72 overflow-hidden rounded-[2rem] bg-amber-200 shadow-[0_18px_60px_rgba(147,92,14,0.16)]">
        <Image
          src={design.heroImage}
          alt="Generated good morning card"
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          priority
          className="object-cover"
        />
        <div className="absolute inset-x-3 bottom-3 rounded-[1.5rem] bg-white/90 p-3 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2 text-lg font-extrabold text-amber-700">
            <Sun className="h-5 w-5" />
            {content.subcopy}
          </div>
          <p className="mt-1 text-2xl font-black leading-tight text-slate-950">{content.greeting(nickname)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-[38vh] min-h-72 overflow-hidden rounded-[2rem] ${design.previewClassName} shadow-[0_18px_60px_rgba(147,92,14,0.16)]`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,.9),transparent_22%),radial-gradient(circle_at_80%_18%,rgba(244,63,94,.5),transparent_18%),radial-gradient(circle_at_28%_86%,rgba(234,179,8,.55),transparent_18%)]" />
      <div className="absolute inset-x-4 top-4 rounded-2xl bg-white/75 p-3 text-center shadow-sm backdrop-blur">
        <p className="text-3xl font-black tracking-wide text-amber-700">GOOD MORNING</p>
        <p className="text-5xl font-black text-red-700">早安</p>
      </div>
      <div className="absolute bottom-20 left-5 rounded-2xl bg-white/80 px-4 py-3 text-xl font-black text-emerald-800 shadow-sm">
        Live happy, age well
      </div>
      <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-base font-black text-slate-700 shadow-sm">
        <ImageIcon className="h-5 w-5 text-amber-700" />
        {design.shortName}
      </div>
    </div>
  );
}

function SectionTitle({ title, icon: Icon }: { title: string; icon: typeof Check }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-amber-700" />
      <h2 className="text-xl font-extrabold">{title}</h2>
    </div>
  );
}
