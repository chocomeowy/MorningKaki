"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";

import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  HeartPulse,
  Mic,
  Phone,
  Pill,
  Play,
  ShieldCheck,
  TrendingUp,
  Loader2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const returnPathKey = "morningkaki:return-path";

interface VoiceLog {
  id: string;
  transcript: string;
  sentimentLabel: string;
  sentimentScore: number;
  timestamp: string | null;
  audioUrl: string | null;
}

interface MoodLog {
  sticker_type: string;
  timestamp: string | null;
}

export function DashboardView({ id }: { id: string }) {
  const [senior, setSenior] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const pageUrl = useMemo(() => {
    return typeof window !== "undefined" ? window.location.origin : "https://morningkaki.vercel.app";
  }, []);

  useEffect(() => {
    const dashboardPath = id && id !== "demo" && id !== "[id]" ? `/dashboard/${id}` : "/dashboard";
    window.localStorage.setItem(returnPathKey, dashboardPath);
  }, [id]);

  useEffect(() => {
    async function loadSenior() {
      if (id && id !== "demo" && id !== "[id]") {
        try {
          const { data, error } = await supabase
            .from("seniors")
            .select("*")
            .eq("id", id)
            .single();
            
          if (error) {
            setLoadError(error.message);
          } else {
            setSenior(data);
          }
        } catch (err) {
          setLoadError(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      } else {
        setLoadError("No senior profile selected yet.");
      }
    }
    loadSenior();
  }, [id]);

  if (!senior) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee]">
        {loadError ? (
          <section className="mx-4 max-w-md rounded-[2rem] bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
            <h1 className="text-2xl font-extrabold">No live dashboard found</h1>
            <p className="mt-3 text-slate-600">{loadError}</p>
          </section>
        ) : (
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-4 lg:grid-cols-[20rem_1fr] lg:px-6">
        <ProfileRail senior={senior} pageUrl={pageUrl} />
        <section className="space-y-5">
          <DashboardHeader />
          <StatusGrid seniorId={senior.id} />
          <Tabs defaultValue="today" className="space-y-5">
            <TabsList className="grid h-12 w-full grid-cols-4 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
              {["today", "trends", "memories", "manage"].map((item) => (
                <TabsTrigger
                  key={item}
                  value={item}
                  className="rounded-xl text-sm font-extrabold capitalize text-slate-500 data-[state=active]:bg-slate-950 data-[state=active]:text-white"
                >
                  {item}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="today" className="space-y-5">
              <TodayPanel seniorId={senior.id} />
            </TabsContent>
            <TabsContent value="trends" className="space-y-5">
              <TrendsPanel seniorId={senior.id} />
            </TabsContent>
            <TabsContent value="memories" className="space-y-5">
              <MemoriesPanel seniorId={senior.id || id} />
            </TabsContent>
            <TabsContent value="manage" className="space-y-5">
              <ManagePanel senior={senior} setSenior={setSenior} />
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </main>
  );
}

function ProfileRail({ senior, pageUrl }: { senior: any; pageUrl: string }) {
  const magicLink = `${pageUrl}/s/${senior.magic_token}`;
  
  const displayLang = senior.primary_language === "zh" ? "Mandarin" 
    : senior.primary_language === "hokkien" ? "Cantonese" 
    : senior.primary_language === "cantonese" ? "Cantonese" 
    : "English";

  return (
    <aside className="rounded-[2rem] bg-slate-950 p-5 text-white lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-amber-200 bg-white">
          {senior.photo_url ? (
            <AvatarImage src={senior.photo_url} className="object-cover" />
          ) : (
            <AvatarFallback className="bg-amber-100 text-xl font-extrabold text-amber-800">
              {senior.nickname?.substring(0, 2).toUpperCase() || "SN"}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <p className="text-2xl font-extrabold truncate max-w-[180px]">{senior.nickname}</p>
          <p className="text-sm font-bold text-slate-400">Last active just now</p>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] bg-white/8 p-4">
        <p className="text-sm font-bold text-slate-400">Magic link (Tap to copy)</p>
        <button 
          onClick={() => navigator.clipboard.writeText(magicLink)}
          className="mt-1 text-left break-all font-mono text-sm text-amber-100 hover:text-amber-300 transition"
        >
          {magicLink.replace("https://", "").replace("http://", "")}
        </button>
      </div>

      <div className="mt-6 space-y-3">
        <RailItem icon={ShieldCheck} label="Senior login" value="Not required" />
        <RailItem icon={Bell} label="Morning greeting" value={senior.morning_time ? senior.morning_time.substring(0,5) : "07:30"} />
        <RailItem icon={Phone} label="Primary language" value={displayLang} />
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-amber-200/20 bg-amber-200/10 p-4">
        <p className="font-extrabold text-amber-100">Quiet monitoring</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Alerts only appear when there is a missed medication streak or repeated low mood.
        </p>
      </div>
    </aside>
  );
}

function DashboardHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div>
        <p className="text-sm font-extrabold uppercase tracking-wide text-amber-600">Caregiver dashboard</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Today&apos;s check-in</h1>
      </div>
      <Badge className="h-9 bg-emerald-50 px-3 text-sm font-extrabold text-emerald-700">
        <CheckCircle2 className="mr-1 h-4 w-4" />
        Live view
      </Badge>
    </header>
  );
}

function StatusGrid({ seniorId }: { seniorId: string }) {
  const [mood, setMood] = useState<MoodLog | null>(null);
  const [medCount, setMedCount] = useState(0);
  const [reminderCount, setReminderCount] = useState(0);
  const [acknowledgedCount, setAcknowledgedCount] = useState(0);
  const [voiceLogs, setVoiceLogs] = useState<VoiceLog[]>([]);

  useEffect(() => {
    async function loadMetrics() {
      const today = new Date().toISOString().split("T")[0];
      const [moodRes, medRes, remRes, voiceRes] = await Promise.all([
        supabase
          .from("mood_logs")
          .select("sticker_type, timestamp")
          .eq("senior_id", seniorId)
          .gte("timestamp", `${today}T00:00:00+08:00`)
          .order("timestamp", { ascending: false })
          .limit(1),
        supabase.from("medications").select("id").eq("senior_id", seniorId),
        supabase.from("reminders").select("id, acknowledged_at").eq("senior_id", seniorId),
        fetch(`/api/voice-logs?seniorId=${encodeURIComponent(seniorId)}`),
      ]);
      const voiceData = await voiceRes.json();

      setMood((moodRes.data?.[0] as MoodLog | undefined) ?? null);
      setMedCount(medRes.data?.length ?? 0);
      setReminderCount(remRes.data?.length ?? 0);
      setAcknowledgedCount(remRes.data?.filter((item) => item.acknowledged_at).length ?? 0);
      setVoiceLogs(voiceData.logs ?? []);
    }

    loadMetrics();
  }, [seniorId]);

  const latestVoice = voiceLogs[0];

  return (
    <div className="grid gap-3 md:grid-cols-5">
      <Metric icon={HeartPulse} label="Mood" value={mood ? formatMood(mood.sticker_type) : "Not checked in"} tone="rose" />
      <Metric icon={Pill} label="Medication" value={`${medCount} active`} tone="blue" />
      <Metric icon={TrendingUp} label="Sentiment" value={latestVoice ? `${latestVoice.sentimentScore} / 100` : "No voice yet"} tone="amber" />
      <Metric icon={Mic} label="Voice logs" value={`${voiceLogs.length} saved`} tone="emerald" />
      <Metric icon={CalendarClock} label="Reminders" value={`${acknowledgedCount} of ${reminderCount} done`} tone="blue" />
    </div>
  );
}

function TodayPanel({ seniorId }: { seniorId: string }) {
  const [meds, setMeds] = useState<any[]>([]);
  const [rems, setRems] = useState<any[]>([]);
  const [voiceLogs, setVoiceLogs] = useState<VoiceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [mRes, rRes, voiceRes] = await Promise.all([
        supabase.from("medications").select("*").eq("senior_id", seniorId),
        supabase.from("reminders").select("*").eq("senior_id", seniorId).gte("remind_at", new Date().toISOString().split('T')[0]),
        fetch(`/api/voice-logs?seniorId=${encodeURIComponent(seniorId)}`),
      ]);
      const voiceData = await voiceRes.json();
      setMeds(mRes.data || []);
      setRems(rRes.data || []);
      setVoiceLogs(voiceData.logs ?? []);
      setLoading(false);
    }
    loadData();
  }, [seniorId]);

  if (loading) return <div className="p-10 text-center"><Loader2 className="mx-auto animate-spin" /></div>;
  const latestVoice = voiceLogs[0];

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <PanelTitle icon={Mic} title="Conversation summary" />
        <p className="mt-4 text-lg leading-relaxed text-slate-700">
          {latestVoice?.transcript || "No voice check-in yet today."}
        </p>
        {latestVoice ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-amber-50 text-amber-700">
              Sentiment: {latestVoice.sentimentLabel}
            </Badge>
            <Badge className="bg-blue-50 text-blue-700">
              Score: {latestVoice.sentimentScore} / 100
            </Badge>
          </div>
        ) : null}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {meds.map(m => (
            <ReminderCard key={m.id} icon={Pill} title={m.name} meta={`Dosage: ${m.dosage || 'Standard'}`} done={m.status === 'Done'} />
          ))}
          {rems.map(r => (
            <ReminderCard key={r.id} icon={CalendarClock} title={r.text} meta={`At ${new Date(r.remind_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`} done={!!r.acknowledged_at} />
          ))}
          {meds.length === 0 && rems.length === 0 && <p className="text-slate-500 italic">No reminders for today.</p>}
        </div>
      </section>
      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <PanelTitle icon={AlertTriangle} title="Alerts" />
        <div className={`mt-4 rounded-2xl p-4 ${getAlertTone(latestVoice).className}`}>
          <p className="font-extrabold">{getAlertTone(latestVoice).title}</p>
          <p className="mt-1 text-sm font-medium">{getAlertTone(latestVoice).body}</p>
        </div>
      </section>
    </div>
  );
}

function ManagePanel({ senior, setSenior }: { senior: any; setSenior: (s: any) => void }) {
  const [isSaving, setIsSaving] = useState(false);
  const [nickname, setNickname] = useState(senior.nickname || "");
  const [morningTime, setMorningTime] = useState(senior.morning_time || "07:30");

  const handleUpdate = async () => {
    setIsSaving(true);
    const { data, error } = await supabase
      .from("seniors")
      .update({ nickname, morning_time: morningTime })
      .eq("id", senior.id)
      .select()
      .single();
    
    if (!error && data) setSenior(data);
    setIsSaving(false);
  };

  return (
    <div className="grid gap-5">
      <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-xl font-extrabold">Senior Profile</h3>
        <div className="mt-6 space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-500">Nickname</label>
            <input 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full h-12 rounded-xl border border-slate-200 px-4 font-bold outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-500">Morning Greeting Time</label>
            <input 
              type="time"
              value={morningTime}
              onChange={(e) => setMorningTime(e.target.value)}
              className="w-full h-12 rounded-xl border border-slate-200 px-4 font-bold outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button 
            onClick={handleUpdate}
            disabled={isSaving}
            className="w-full h-12 bg-slate-950 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 opacity-50 pointer-events-none">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold">Medications & Reminders</h3>
          <Badge>Coming Soon</Badge>
        </div>
        <p className="mt-2 text-sm text-slate-500">Medication editing will be available in the next update.</p>
      </section>
    </div>
  );
}

function TrendsPanel({ seniorId }: { seniorId: string }) {
  const [sentimentData, setSentimentData] = useState<{ day: string; score: number }[]>([]);
  const [reminderData, setReminderData] = useState<{ day: string; adherence: number }[]>([]);

  useEffect(() => {
    async function loadTrends() {
      const [voiceRes, remRes] = await Promise.all([
        fetch(`/api/voice-logs?seniorId=${encodeURIComponent(seniorId)}`),
        supabase
          .from("reminders")
          .select("remind_at, acknowledged_at")
          .eq("senior_id", seniorId)
          .order("remind_at", { ascending: true }),
      ]);
      const voiceData = await voiceRes.json();
      const voiceLogs = (voiceData.logs ?? []) as VoiceLog[];

      setSentimentData(
        voiceLogs
          .filter((log) => log.timestamp)
          .slice(0, 7)
          .reverse()
          .map((log) => ({
            day: formatShortDate(log.timestamp),
            score: log.sentimentScore,
          })),
      );

      const grouped = new Map<string, { total: number; done: number }>();
      (remRes.data ?? []).forEach((reminder) => {
        const day = formatShortDate(reminder.remind_at);
        const current = grouped.get(day) ?? { total: 0, done: 0 };
        grouped.set(day, {
          total: current.total + 1,
          done: current.done + (reminder.acknowledged_at ? 1 : 0),
        });
      });
      setReminderData(
        Array.from(grouped.entries()).map(([day, value]) => ({
          day,
          adherence: value.total > 0 ? Math.round((value.done / value.total) * 100) : 0,
        })),
      );
    }

    loadTrends();
  }, [seniorId]);

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartPanel title="Sentiment score">
        {sentimentData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sentimentData}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={4} dot={{ fill: "#f59e0b", r: 4, stroke: "#fff", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartText text="No voice sentiment yet." />
        )}
      </ChartPanel>
      <ChartPanel title="Reminder adherence">
        {reminderData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reminderData}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="adherence" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartText text="No acknowledged reminders yet." />
        )}
      </ChartPanel>
    </div>
  );
}

function MemoriesPanel({ seniorId }: { seniorId: string }) {
  const [voiceLogs, setVoiceLogs] = useState<VoiceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVoiceLogs() {
      const response = await fetch(`/api/voice-logs?seniorId=${encodeURIComponent(seniorId)}`);
      const data = await response.json();
      setVoiceLogs(data.logs ?? []);
      setLoading(false);
    }

    loadVoiceLogs();
  }, [seniorId]);

  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center justify-between gap-3">
        <PanelTitle icon={Mic} title="Voice memories" />
        <Badge className="bg-purple-50 text-purple-700">Voice Clone · Coming Soon</Badge>
      </div>
      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="py-8 text-center text-slate-500">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          </div>
        ) : null}
        {!loading && voiceLogs.length === 0 ? (
          <p className="py-8 text-center font-medium text-slate-500">No voice memories saved yet.</p>
        ) : null}
        {voiceLogs.map((item) => (
          <div key={item.id} className="flex items-center gap-4 py-4">
            <button
              disabled={!item.audioUrl}
              onClick={() => item.audioUrl ? new Audio(item.audioUrl).play() : undefined}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800 disabled:opacity-40"
            >
              <Play className="ml-1 h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold">
                {formatVoiceDate(item.timestamp)} · {item.sentimentLabel} ({item.sentimentScore}/100)
              </p>
              <p className="truncate text-sm font-medium text-slate-500">{item.transcript}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatVoiceDate(timestamp: string | null) {
  if (!timestamp) return "Saved voice";
  return new Date(timestamp).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(timestamp: string | null) {
  if (!timestamp) return "Unknown";
  return new Date(timestamp).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
  });
}

function formatMood(stickerType: string) {
  const labels: Record<string, string> = {
    energetic: "Energetic",
    tired: "Tired",
    down: "Feeling down",
    grateful: "Grateful",
    confused: "Confused",
  };

  return labels[stickerType] ?? stickerType;
}

function getAlertTone(latestVoice: VoiceLog | undefined) {
  if (!latestVoice) {
    return {
      className: "bg-slate-50 text-slate-700",
      title: "No voice check-in yet",
      body: "The dashboard will update after the senior records a message.",
    };
  }

  if (latestVoice.sentimentLabel === "distressed" || latestVoice.sentimentScore < 35) {
    return {
      className: "bg-red-50 text-red-800",
      title: "Please check in",
      body: "The latest voice sentiment looks distressed.",
    };
  }

  if (latestVoice.sentimentLabel === "low" || latestVoice.sentimentScore < 55) {
    return {
      className: "bg-amber-50 text-amber-800",
      title: "Watch gently",
      body: "The latest voice sentiment is lower than usual.",
    };
  }

  return {
    className: "bg-emerald-50 text-emerald-800",
    title: "No urgent alert",
    body: "The latest voice check-in does not show distress.",
  };
}

function EmptyChartText({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-center font-medium text-slate-500">
      {text}
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }: {
  icon: typeof HeartPulse;
  label: string;
  value: string;
  tone: "rose" | "blue" | "amber" | "emerald";
}) {
  const tones = {
    rose: "bg-rose-50 text-rose-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
    </div>
  );
}

function RailItem({ icon: Icon, label, value }: { icon: typeof Bell; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/8 p-3">
      <Icon className="h-5 w-5 text-amber-200" />
      <div>
        <p className="text-xs font-bold text-slate-400">{label}</p>
        <p className="font-extrabold">{value}</p>
      </div>
    </div>
  );
}

function PanelTitle({ icon: Icon, title }: { icon: typeof Mic; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-amber-600" />
      <h2 className="text-xl font-extrabold">{title}</h2>
    </div>
  );
}

function ReminderCard({ icon: Icon, title, meta, done }: {
  icon: typeof Pill;
  title: string;
  meta: string;
  done?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
      <Icon className={done ? "h-5 w-5 text-emerald-600" : "h-5 w-5 text-slate-500"} />
      <div className="min-w-0 flex-1">
        <p className="font-extrabold">{title}</p>
        <p className="text-sm font-medium text-slate-500">{meta}</p>
      </div>
      <Badge className={done ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}>
        {done ? "Done" : "Pending"}
      </Badge>
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-extrabold">{title}</h2>
      <div className="mt-4 h-72">{children}</div>
    </section>
  );
}
