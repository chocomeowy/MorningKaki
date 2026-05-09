"use client";

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

const trendData = [
  { day: "Mon", mood: 82, meds: 100 },
  { day: "Tue", mood: 86, meds: 100 },
  { day: "Wed", mood: 70, meds: 50 },
  { day: "Thu", mood: 89, meds: 100 },
  { day: "Fri", mood: 76, meds: 100 },
  { day: "Sat", mood: 94, meds: 100 },
  { day: "Sun", mood: 88, meds: 100 },
];

const memories = [
  { date: "Today", mood: "😊", text: "I met Uncle Tan at the Kopitiam after breakfast.", time: "0:45" },
  { date: "Yesterday", mood: "😴", text: "The weather was very hot, so I stayed home.", time: "1:12" },
  { date: "Monday", mood: "❤️", text: "My grandson came to visit after school.", time: "2:05" },
];

export function DashboardView() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-4 lg:grid-cols-[20rem_1fr] lg:px-6">
        <ProfileRail />
        <section className="space-y-5">
          <DashboardHeader />
          <StatusGrid />
          <Tabs defaultValue="today" className="space-y-5">
            <TabsList className="grid h-12 w-full grid-cols-3 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
              {["today", "trends", "memories"].map((item) => (
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
              <TodayPanel />
            </TabsContent>
            <TabsContent value="trends" className="space-y-5">
              <TrendsPanel />
            </TabsContent>
            <TabsContent value="memories" className="space-y-5">
              <MemoriesPanel />
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </main>
  );
}

function ProfileRail() {
  return (
    <aside className="rounded-[2rem] bg-slate-950 p-5 text-white lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-amber-200">
          <AvatarImage src="/placeholder-avatar.jpg" />
          <AvatarFallback className="bg-amber-100 text-lg font-extrabold text-amber-800">AG</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-2xl font-extrabold">Ah Gong</p>
          <p className="text-sm font-bold text-slate-400">Last active 07:45 AM</p>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] bg-white/8 p-4">
        <p className="text-sm font-bold text-slate-400">Magic link</p>
        <p className="mt-1 break-all font-mono text-sm text-amber-100">morningkaki.vercel.app/s/demo</p>
      </div>

      <div className="mt-6 space-y-3">
        <RailItem icon={ShieldCheck} label="Senior login" value="Not required" />
        <RailItem icon={Bell} label="Morning greeting" value="07:30 AM" />
        <RailItem icon={Phone} label="Primary language" value="English" />
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
        All clear
      </Badge>
    </header>
  );
}

function StatusGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Metric icon={HeartPulse} label="Mood" value="Energetic 😊" tone="rose" />
      <Metric icon={Pill} label="Medication" value="1 of 2 done" tone="blue" />
      <Metric icon={TrendingUp} label="Sentiment" value="88 / 100" tone="amber" />
      <Metric icon={Mic} label="Voice logs" value="3 saved" tone="emerald" />
    </div>
  );
}

function TodayPanel() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <PanelTitle icon={Mic} title="Conversation summary" />
        <p className="mt-4 text-lg leading-relaxed text-slate-700">
          Ah Gong said he slept well and plans to meet Uncle Tan for kopi after breakfast.
          He took his morning blood pressure medicine without prompting.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ReminderCard icon={Pill} title="Blood pressure meds" meta="Acknowledged at 08:10 AM" done />
          <ReminderCard icon={CalendarClock} title="Polyclinic checkup" meta="Upcoming at 02:00 PM" />
        </div>
      </section>
      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <PanelTitle icon={AlertTriangle} title="Alerts" />
        <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-emerald-800">
          <p className="font-extrabold">No action needed</p>
          <p className="mt-1 text-sm font-medium">Mood and adherence look stable today.</p>
        </div>
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-amber-900">
          <p className="font-extrabold">Next reminder</p>
          <p className="mt-1 text-sm font-medium">Polyclinic checkup at 2:00 PM.</p>
        </div>
      </section>
    </div>
  );
}

function TrendsPanel() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartPanel title="Sentiment score">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="#f59e0b"
              strokeWidth={4}
              dot={{ fill: "#f59e0b", r: 4, stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>
      <ChartPanel title="Medication adherence">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trendData}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="meds" fill="#2563eb" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  );
}

function MemoriesPanel() {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center justify-between gap-3">
        <PanelTitle icon={Mic} title="Voice memories" />
        <Badge className="bg-purple-50 text-purple-700">Voice Clone · Coming Soon</Badge>
      </div>
      <div className="divide-y divide-slate-100">
        {memories.map((item) => (
          <div key={item.date} className="flex items-center gap-4 py-4">
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800">
              <Play className="ml-1 h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold">{item.date} {item.mood}</p>
              <p className="truncate text-sm font-medium text-slate-500">{item.text}</p>
            </div>
            <span className="text-sm font-bold text-slate-400">{item.time}</span>
          </div>
        ))}
      </div>
    </section>
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
