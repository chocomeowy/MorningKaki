"use client";

import { useState } from "react";
import Image from "next/image";
import { Mic, Volume2, Share2, Sun } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SeniorPage() {
  const [language, setLanguage] = useState<"en" | "zh">("en");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const t = {
    en: {
      greeting: "Good morning, Ah Gong!",
      weather: "Sunny 28°C",
      tapToTalk: "TAP TO TALK",
      today: "TODAY",
      news: "LOCAL NEWS",
      share: "Share to Family",
      stickers: [
        { id: "energetic", emoji: "😊", label: "Energetic" },
        { id: "tired", emoji: "😴", label: "Tired" },
        { id: "down", emoji: "🌧️", label: "Down" },
        { id: "grateful", emoji: "❤️", label: "Grateful" },
        { id: "confused", emoji: "😕", label: "Confused" },
      ],
      reminders: [
        { time: "08:00 AM", title: "Blood Pressure Meds", type: "medication" },
        { time: "02:00 PM", title: "Polyclinic Appointment", type: "appointment" },
      ],
      newsItems: [
        {
          title: "New hawker centre opening in your neighbourhood next month.",
          source: "CNA",
        },
        {
          title: "CDC vouchers can now be used at more local supermarkets.",
          source: "Straits Times",
        },
      ],
    },
    zh: {
      greeting: "早上好，阿公！",
      weather: "晴朗 28°C",
      tapToTalk: "按住说话",
      today: "今天日程",
      news: "本地新闻",
      share: "分享给家人",
      stickers: [
        { id: "energetic", emoji: "😊", label: "精神好" },
        { id: "tired", emoji: "😴", label: "很累" },
        { id: "down", emoji: "🌧️", label: "心情差" },
        { id: "grateful", emoji: "❤️", label: "感恩" },
        { id: "confused", emoji: "😕", label: "不明白" },
      ],
      reminders: [
        { time: "早上 08:00", title: "吃高血压药", type: "medication" },
        { time: "下午 02:00", title: "去综合诊所看医生", type: "appointment" },
      ],
      newsItems: [
        {
          title: "下个月你家附近将新开一家小贩中心。",
          source: "CNA",
        },
        {
          title: "CDC购物券现在可以在更多本地超市使用了。",
          source: "Straits Times",
        },
      ],
    },
  };

  const content = t[language];

  return (
    <div className="min-h-screen bg-amber-50 pb-10 font-sans text-lg text-slate-800 selection:bg-amber-200">
      {/* 1. App Bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-bold text-amber-700 tracking-tight">MorningKaki</h1>
        <div className="flex bg-amber-100 rounded-full p-1 border border-amber-200">
          <button
            onClick={() => setLanguage("en")}
            className={`px-4 py-1 rounded-full text-lg font-medium transition-colors ${
              language === "en" ? "bg-white text-amber-900 shadow-sm" : "text-amber-700/70"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("zh")}
            className={`px-4 py-1 rounded-full text-lg font-medium transition-colors ${
              language === "zh" ? "bg-white text-amber-900 shadow-sm" : "text-amber-700/70"
            }`}
          >
            中
          </button>
        </div>
      </header>

      {/* 2. Illustration */}
      <div className="w-full relative h-[40vh] bg-amber-100">
        <Image
          src="/morning_illustration.png"
          alt="Morning Illustration"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-amber-50 to-transparent bottom-0 h-1/3 mt-auto" />
      </div>

      <main className="px-6 -mt-8 relative z-10 flex flex-col gap-8">
        {/* 3. Greeting */}
        <div className="text-center bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-amber-100">
          <h2 className="text-4xl font-extrabold text-slate-800 mb-2 leading-tight">
            {content.greeting}
          </h2>
          <div className="flex items-center justify-center gap-2 text-amber-700 font-medium text-xl mt-3">
            <span>{new Date().toLocaleDateString(language === "en" ? "en-SG" : "zh-CN", { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sun className="w-6 h-6 text-orange-500" />
              {content.weather}
            </span>
          </div>
        </div>

        {/* 4. Tap to Talk Button */}
        <button className="w-full py-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all text-white rounded-[2rem] shadow-xl shadow-orange-500/20 flex flex-col items-center justify-center gap-3 border-4 border-white">
          <div className="bg-white/20 p-4 rounded-full">
            <Mic className="w-12 h-12" />
          </div>
          <span className="text-2xl font-bold tracking-wide">{content.tapToTalk}</span>
        </button>

        {/* 5. Mood Stickers */}
        <section>
          <div className="flex justify-between items-center bg-white p-3 rounded-[2rem] shadow-sm border border-amber-100 overflow-x-auto gap-2 no-scrollbar">
            {content.stickers.map((sticker) => (
              <button
                key={sticker.id}
                onClick={() => setSelectedMood(sticker.id)}
                className={`flex flex-col items-center gap-1 p-2 min-w-[70px] rounded-2xl transition-all ${
                  selectedMood === sticker.id
                    ? "bg-amber-100 scale-110 shadow-sm border border-amber-200"
                    : "hover:bg-amber-50 opacity-80"
                }`}
              >
                <span className="text-4xl filter drop-shadow-sm">{sticker.emoji}</span>
                <span className={`text-sm font-medium ${selectedMood === sticker.id ? 'text-amber-900' : 'text-slate-500'}`}>{sticker.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 6. Today Section */}
        <section>
          <h3 className="text-2xl font-bold text-slate-800 mb-4 px-2">{content.today}</h3>
          <div className="flex flex-col gap-4">
            {content.reminders.map((reminder, idx) => (
              <Card key={idx} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardContent className="p-0 flex items-stretch">
                  <div className={`w-3 ${reminder.type === 'medication' ? 'bg-blue-400' : 'bg-purple-400'}`} />
                  <div className="p-5 flex-1 flex flex-col justify-center">
                    <span className="text-amber-600 font-bold text-lg mb-1">{reminder.time}</span>
                    <span className="text-xl font-semibold text-slate-800">{reminder.title}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 7. News Section */}
        <section>
          <h3 className="text-2xl font-bold text-slate-800 mb-4 px-2">{content.news}</h3>
          <div className="flex flex-col gap-4">
            {content.newsItems.map((news, idx) => (
              <Card key={idx} className="border-amber-100 shadow-sm bg-white rounded-3xl overflow-hidden group">
                <CardContent className="p-5 flex gap-4 items-start">
                  <button className="mt-1 flex-shrink-0 bg-amber-100 text-amber-700 p-3 rounded-full hover:bg-amber-200 active:scale-95 transition-all">
                    <Volume2 className="w-8 h-8" />
                  </button>
                  <div className="flex-1">
                    <p className="text-xl font-medium text-slate-800 leading-snug mb-2">{news.title}</p>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-sm">{news.source}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 8. Share Button */}
        <Button size="lg" className="w-full mt-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full h-16 text-xl font-bold shadow-lg shadow-green-500/20 gap-3">
          <Share2 className="w-6 h-6" />
          {content.share}
        </Button>
      </main>
    </div>
  );
}
