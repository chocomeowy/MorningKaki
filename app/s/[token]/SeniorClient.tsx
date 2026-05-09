"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
} from "lucide-react";
import {
  defaultMorningDesign,
  getMorningDesign,
  morningDesignStorageKey,
  type MorningDesign,
} from "@/lib/morning-designs";
import { getMoodStickerSrc, type MoodStickerId } from "@/lib/mood-stickers";
import { supabase } from "@/lib/supabase/client";

interface SeniorProfile {
  id: string;
  nickname: string;
  primary_language?: string | null;
}

interface MorningData {
  greeting: string;
  imageUrl: string;
  spokenScript?: string;
  weather?: string;
  localNews?: string[];
  medicines?: string[];
  reminders?: string[];
}

interface MedicationRow {
  id: string;
  name: string;
  dosage?: string | null;
  schedule_times?: string[] | null;
  status?: string | null;
}

interface ReminderRow {
  id: string;
  text: string;
  remind_at: string;
  acknowledged_at?: string | null;
}

interface MoodChoice {
  id: MoodStickerId;
  label: string;
}

interface LocalizedCopy {
  greeting: (name: string) => string;
  subcopy: string;
  listen: string;
  today: string;
  news: string;
  share: string;
  moodPrompt: string;
  moodSaved: string;
  moodSaving: string;
  moodSaveError: string;
  reply: string;
  stickers: MoodChoice[];
  reminders: {
    time: string;
    title: string;
    icon: typeof Pill;
    status: string;
  }[];
  newsItems: string[];
}

const copy = {
  en: {
    greeting: (name: string) => `Good morning, ${name}`,
    subcopy: "Saturday, 9 May · Sunny 28°C",
    listen: "Tap to talk",
    today: "Today",
    news: "Local news",
    share: "Share morning",
    moodPrompt: "How are you feeling?",
    moodSaved: "Thank you. I saved it.",
    moodSaving: "Saving...",
    moodSaveError: "I could not save that. Please tap again.",
    reply: "Morning is ready. I will read it aloud.",
    stickers: [
      { id: "energetic", label: "Energetic" },
      { id: "tired", label: "Tired" },
      { id: "down", label: "Down" },
      { id: "grateful", label: "Grateful" },
      { id: "confused", label: "Confused" },
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
    moodSaved: "谢谢，已经记录了。",
    moodSaving: "记录中...",
    moodSaveError: "还没记录到，请再按一次。",
    reply: "早晨内容准备好了，我会读给你听。",
    stickers: [
      { id: "energetic", label: "精神好" },
      { id: "tired", label: "很累" },
      { id: "down", label: "心情差" },
      { id: "grateful", label: "感恩" },
      { id: "confused", label: "不明白" },
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
} satisfies Record<"en" | "zh", LocalizedCopy>;

const getMoodStorageKey = (seniorId: string) => {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
  return `morningkaki:mood:${seniorId}:${today}`;
};

function isChineseReadingLanguage(language: string) {
  return language === "zh" || language === "hokkien" || language === "cantonese";
}

function normalizeSeniorLanguage(language: string | null | undefined) {
  if (language === "hokkien") return "cantonese";
  if (language === "ms") return "en";
  return language || "en";
}

export function SeniorClient({ senior }: { senior: SeniorProfile }) {
  const defaultLang = normalizeSeniorLanguage(senior.primary_language);
  const [language, setLanguage] = useState<string>(defaultLang);
  const [selectedMood, setSelectedMood] = useState<MoodStickerId | null>(null);
  const selectedDesignId = useSyncExternalStore(
    subscribeToMorningDesign,
    getStoredMorningDesign,
    getDefaultMorningDesign,
  );
  const design = getMorningDesign(selectedDesignId);
  const [morningData, setMorningData] = useState<MorningData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [moodSaveError, setMoodSaveError] = useState(false);
  const [meds, setMeds] = useState<MedicationRow[]>([]);
  const [rems, setRems] = useState<ReminderRow[]>([]);
  const [contextReady, setContextReady] = useState(false);

  const content = copy[isChineseReadingLanguage(language) ? "zh" : "en"];

  useEffect(() => {
    async function loadData() {
      if (!senior.id) return;
      
      if (senior.id === "demo") {
        setMeds([{ id: "demo-med-1", name: "Blood pressure medicine", status: "Ready", schedule_times: ["08:00"] }]);
        setRems([{ id: "demo-rem-1", text: "Polyclinic checkup", remind_at: new Date().toISOString() }]);
        setContextReady(true);
        return;
      }

      const [mRes, rRes] = await Promise.all([
        supabase.from("medications").select("*").eq("senior_id", senior.id),
        supabase.from("reminders").select("*").eq("senior_id", senior.id).gte("remind_at", new Date().toISOString().split('T')[0]),
      ]);
      setMeds((mRes.data ?? []) as MedicationRow[]);
      setRems((rRes.data ?? []) as ReminderRow[]);
      setContextReady(true);
    }
    loadData();
  }, [senior.id]);

  const todaysReminders = useMemo(
    () => rems.filter((reminder) => new Date(reminder.remind_at).toDateString() === new Date().toDateString()),
    [rems],
  );

  const medicineSummaries = useMemo(
    () => meds.map((medicine) => {
      const time = medicine.schedule_times?.[0]?.substring(0, 5) || "morning";
      const dosage = medicine.dosage ? `, ${medicine.dosage}` : "";
      return `${medicine.name}${dosage} at ${time}`;
    }),
    [meds],
  );

  const reminderSummaries = useMemo(
    () => todaysReminders.map((reminder) => {
      const time = new Date(reminder.remind_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return `${reminder.text} at ${time}`;
    }),
    [todaysReminders],
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const imagePath = morningData?.imageUrl ?? design.heroImage ?? "/morning_illustration.png";
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);
  const handleShare = async () => {
    const origin = pageUrl ? new URL(pageUrl).origin : window.location.origin;
    const shareImageUrl = imagePath.startsWith("data:") ? imagePath : new URL(imagePath, origin).toString();
    const greeting = morningData?.greeting ?? content.greeting(senior.nickname);
    
    const lines = isChineseReadingLanguage(language)
      ? [
          `${greeting}！`,
          content.subcopy,
          "今天的早安：",
          pageUrl,
        ]
      : [
          `${greeting}!`,
          content.subcopy,
          "Today's good morning:",
          pageUrl,
        ];
    const text = lines.join("\n");

    try {
      if (navigator.share) {
        const response = await fetch(shareImageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'morning.jpg', { type: blob.type || 'image/jpeg' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            text: text,
            files: [file],
          });
          return;
        }
      }
    } catch (err) {
      console.warn("Native file share failed", err);
    }

    // Fallback
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleMorningImageReady = useCallback(() => {
    const savedMood = window.localStorage.getItem(getMoodStorageKey(senior.id)) as MoodStickerId | null;
    if (savedMood && validClientMoodIds.has(savedMood)) {
      setSelectedMood(savedMood);
      return;
    }
    setShowMoodModal(true);
  }, [senior.id]);

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
          void err;
        }
      }
    }
    
    registerPush();
  }, [senior.id]);

  useEffect(() => {
    async function generateMorning() {
      if (!contextReady) return;
      setIsGenerating(true);
      try {
        const res = await fetch('/api/morning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname: senior.nickname,
            language: language,
            designId: design.id,
            medicines: medicineSummaries,
            reminders: reminderSummaries,
          })
        });
        if (res.ok) {
          const data = await res.json();
          setMorningData(data);
        }
      } catch (err) {
        void err;
      } finally {
        setIsGenerating(false);
      }
    }
    generateMorning();
  }, [senior.nickname, language, design.id, medicineSummaries, reminderSummaries, contextReady]);

  useEffect(() => {
    const script = morningData?.spokenScript ?? morningData?.greeting;
    if (script && !isGenerating) {
      async function playGreeting() {
        try {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: script, language })
          });
          if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            await audio.play().catch(() => undefined);
          }
        } catch (err) {
          void err;
        }
      }
      playGreeting();
    }
  }, [morningData?.spokenScript, morningData?.greeting, isGenerating, language]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      void err;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsThinking(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      formData.append("seniorId", senior.id);
      formData.append("nickname", senior.nickname);
      formData.append("language", language);

      const res = await fetch("/api/voice", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = audioUrl;
          audioPlayerRef.current.play();
        }
      }
    } catch (err) {
      void err;
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fff8ed] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col">
        <header className="flex items-center justify-between px-5 pb-3 pt-4">
          <div>
            <p className="text-2xl font-extrabold tracking-tight text-amber-800">MorningKaki</p>
          </div>
          <div className="flex rounded-full border border-amber-200 bg-white p-1 shadow-sm">
            {[defaultLang, "en"].filter((v, i, a) => a.indexOf(v) === i).map((item) => (
              <button
                key={item}
                onClick={() => setLanguage(item)}
                className={`min-h-10 rounded-full px-4 text-lg font-extrabold ${
                  language === item ? "bg-amber-500 text-white" : "text-amber-800"
                }`}
              >
                {item === "zh" ? "中" : 
                 item === "cantonese" ? "粤" : 
                 "EN"}
              </button>
            ))}
          </div>
        </header>

        {/* Full-bleed image — no horizontal padding */}
        <section className="w-full">
          <MorningCard 
            design={design} 
            content={content} 
            nickname={senior.nickname} 
            morningData={morningData}
            isGenerating={isGenerating}
            onImageReady={handleMorningImageReady}
          />
        </section>

        <section className="mt-4 grid grid-cols-[1fr_auto] gap-3 px-4">
          <button 
            onPointerDown={startRecording}
            onPointerUp={stopRecording}
            onPointerLeave={stopRecording}
            className={`flex min-h-24 items-center justify-center gap-4 rounded-[1.75rem] px-5 text-left text-white shadow-lg transition-all active:scale-[0.98] select-none ${
              isRecording ? "bg-red-500 animate-pulse ring-4 ring-red-200" :
              isThinking ? "bg-slate-700 animate-pulse" :
              "bg-slate-950 shadow-slate-950/15"
            }`}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
              <Mic className={`h-8 w-8 ${isRecording ? "text-white" : ""}`} />
            </span>
            <span className="text-2xl font-extrabold">
              {isRecording ? "Listening..." : isThinking ? "Thinking..." : content.listen}
            </span>
          </button>
          <button
            onClick={handleShare}
            className="flex min-h-24 w-24 flex-col items-center justify-center rounded-[1.75rem] bg-[#25D366] text-white shadow-lg shadow-green-500/20 active:scale-[0.98]"
          >
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
                onClick={() => saveMood(sticker.id)}
                aria-label={sticker.label}
                className={`min-h-24 rounded-[1.35rem] border bg-white p-2 text-center shadow-sm ${
                  selectedMood === sticker.id ? "border-amber-400 ring-4 ring-amber-100" : "border-amber-100"
                }`}
              >
                <Image
                  src={getMoodStickerSrc(design.id, sticker.id as MoodStickerId)}
                  alt={sticker.label}
                  width={56}
                  height={56}
                  className="mx-auto h-14 w-14"
                />
              </button>
            ))}
          </div>
          {selectedMood ? (
            <p className="mt-3 text-base font-bold text-emerald-700">{content.moodSaved}</p>
          ) : null}
        </section>

        <section className="mt-5 space-y-3 px-4 pb-20">
          <SectionTitle title={content.today} icon={BellRing} />
          {meds.map((m) => (
            <div key={m.id} className="flex min-h-20 items-center gap-4 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-amber-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Pill className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-extrabold">{m.name}</p>
                <p className="text-base font-bold text-slate-500">
                  {m.schedule_times?.[0] ? m.schedule_times[0].substring(0, 5) : "Morning"}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-lg font-extrabold ${m.status === 'Done' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {m.status === 'Done' ? (isChineseReadingLanguage(language) ? '已吃' : 'Done') : (isChineseReadingLanguage(language) ? '准备好' : 'Ready')}
              </span>
            </div>
          ))}
          {todaysReminders.map((r) => (
            <div key={r.id} className="flex min-h-20 items-center gap-4 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-amber-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <CalendarClock className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-extrabold">{r.text}</p>
                <p className="text-base font-bold text-slate-500">
                  {new Date(r.remind_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-lg font-extrabold ${r.acknowledged_at ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {r.acknowledged_at ? (isChineseReadingLanguage(language) ? '已确认' : 'Confirmed') : (isChineseReadingLanguage(language) ? '稍后' : 'Later')}
              </span>
            </div>
          ))}
          {meds.length === 0 && rems.length === 0 && (
            <p className="py-4 text-center text-slate-500 italic">No events scheduled for today.</p>
          )}
        </section>

        <audio ref={audioPlayerRef} className="hidden" />
      </div>
      {showMoodModal ? (
        <MoodModal
          content={content}
          design={design}
          selectedMood={selectedMood}
          isSaving={isSavingMood}
          hasError={moodSaveError}
          onSelect={saveMood}
        />
      ) : null}
    </main>
  );

  async function saveMood(moodId: MoodStickerId) {
    setSelectedMood(moodId);
    setIsSavingMood(true);
    setMoodSaveError(false);
    try {
      const response = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seniorId: senior.id, stickerType: moodId }),
      });

      if (!response.ok) {
        throw new Error("Mood save failed");
      }

      window.localStorage.setItem(getMoodStorageKey(senior.id), moodId);
      setShowMoodModal(false);
    } catch {
      setMoodSaveError(true);
    } finally {
      setIsSavingMood(false);
    }
  }
}

function MorningCard({
  design,
  content,
  nickname,
  morningData,
  isGenerating,
  onImageReady,
}: {
  design: MorningDesign;
  content: (typeof copy)["en"];
  nickname: string;
  morningData: MorningData | null;
  isGenerating: boolean;
  onImageReady: () => void;
}) {
  if (isGenerating) {
    return (
      <div className="flex h-[48vw] min-h-72 max-h-[480px] items-center justify-center bg-amber-100">
        <div className="flex flex-col items-center gap-3 text-amber-700">
          <Sun className="h-8 w-8 animate-spin" />
          <p className="font-extrabold">Painting your morning...</p>
        </div>
      </div>
    );
  }

  const activeImage = morningData?.imageUrl || design.heroImage;
  const activeGreeting = morningData?.greeting || content.greeting(nickname);

  if (activeImage) {
    return (
      <div className="relative w-full" style={{ aspectRatio: '3/2' }}>
        <Image
          src={activeImage}
          alt="Generated good morning card"
          fill
          sizes="100vw"
          priority
          className="object-cover"
          onLoad={onImageReady}
        />
        <div className="absolute inset-x-4 bottom-4 rounded-[1.5rem] bg-white/90 p-4 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2 text-base font-extrabold text-amber-700">
            <Sun className="h-5 w-5 shrink-0" />
            <span className="line-clamp-1">{content.subcopy}</span>
          </div>
          <p className="mt-1 max-h-32 overflow-y-auto text-base font-bold leading-snug text-slate-900">{activeGreeting}</p>
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
      <div className="sr-only">
        <Image src="/morning_illustration.png" alt="" width={1} height={1} onLoad={onImageReady} />
      </div>
    </div>
  );
}

function MoodModal({
  content,
  design,
  selectedMood,
  isSaving,
  hasError,
  onSelect,
}: {
  content: (typeof copy)["en"];
  design: MorningDesign;
  selectedMood: MoodStickerId | null;
  isSaving: boolean;
  hasError: boolean;
  onSelect: (moodId: MoodStickerId) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-5 shadow-2xl">
        <h2 className="text-center text-2xl font-black text-slate-950">{content.moodPrompt}</h2>
        <div className="mt-5 grid grid-cols-5 gap-2">
          {content.stickers.map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              aria-label={sticker.label}
              disabled={isSaving}
              onClick={() => onSelect(sticker.id)}
              className={`flex aspect-square min-h-16 items-center justify-center rounded-2xl border bg-amber-50 p-1.5 transition active:scale-95 disabled:opacity-60 ${
                selectedMood === sticker.id ? "border-amber-400 ring-4 ring-amber-100" : "border-amber-100"
              }`}
            >
              <Image
                src={getMoodStickerSrc(design.id, sticker.id)}
                alt={sticker.label}
                width={72}
                height={72}
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>
        <p className={`mt-4 min-h-6 text-center text-base font-bold ${hasError ? "text-red-600" : "text-emerald-700"}`}>
          {hasError ? content.moodSaveError : isSaving ? content.moodSaving : ""}
        </p>
      </section>
    </div>
  );
}

const validClientMoodIds = new Set<string>([
  "energetic",
  "tired",
  "down",
  "grateful",
  "confused",
]);

function SectionTitle({ title, icon: Icon }: { title: string; icon: typeof Check }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-amber-700" />
      <h2 className="text-xl font-extrabold">{title}</h2>
    </div>
  );
}

function subscribeToMorningDesign(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getStoredMorningDesign() {
  return window.localStorage.getItem(morningDesignStorageKey);
}

function getDefaultMorningDesign() {
  return defaultMorningDesign.id;
}
