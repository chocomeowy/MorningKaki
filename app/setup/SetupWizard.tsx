"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  Bell,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gift,
  HeartHandshake,
  Languages,
  LockKeyhole,
  MessageCircle,
  Pill,
  Plus,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const steps = [
  { label: "Loved one", icon: UserRound },
  { label: "Medication", icon: Pill },
  { label: "Reminders", icon: CalendarDays },
  { label: "Timing", icon: Bell },
  { label: "Send link", icon: Gift },
] as const;

const magicLink = "https://morningkaki.vercel.app/s/demo";

export function SetupWizard() {
  const [step, setStep] = useState(0);
  const completion = useMemo(() => ((step + 1) / steps.length) * 100, [step]);
  const isLastStep = step === steps.length - 1;

  return (
    <main className="min-h-screen bg-[#fbf7ef] text-slate-900">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-4 md:grid-cols-[0.9fr_1.1fr] md:px-8 md:py-8">
        <GiftPanel />

        <section className="flex min-h-[calc(100vh-2rem)] flex-col rounded-[2rem] border border-amber-100 bg-white shadow-[0_20px_80px_rgba(120,72,12,0.12)] md:min-h-[calc(100vh-4rem)]">
          <WizardHeader step={step} completion={completion} />
          <StepRail step={step} setStep={setStep} />
          <div className="flex-1 px-5 py-6 sm:px-8">
            <StepContent step={step} />
          </div>
          <WizardFooter
            isLastStep={isLastStep}
            step={step}
            setStep={setStep}
          />
        </section>
      </div>
    </main>
  );
}

function GiftPanel() {
  return (
    <aside className="relative hidden overflow-hidden rounded-[2rem] bg-[#2f2118] p-7 text-white md:block">
      <div className="absolute inset-0 opacity-40">
        <Image src="/morning_illustration.png" alt="" fill className="object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#2f2118] via-[#2f2118]/92 to-[#7c4a13]/70" />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <Badge className="mb-5 h-8 bg-amber-200 px-3 text-sm font-bold text-amber-950">
            Caregiver setup
          </Badge>
          <h1 className="max-w-sm text-4xl font-extrabold leading-tight">
            Set up a morning your loved one can trust.
          </h1>
          <p className="mt-4 max-w-sm text-lg leading-relaxed text-amber-50/85">
            A warm daily companion, configured like a gift instead of a form.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-white/15 bg-white/12 p-4 backdrop-blur">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-200 text-amber-950">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold">Senior preview</p>
              <p className="text-sm text-amber-50/70">No login, just one tap</p>
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-amber-50 p-4 text-slate-900">
            <p className="text-sm font-bold text-amber-700">07:30 AM</p>
            <p className="mt-1 text-2xl font-extrabold">Good morning, Ah Gong!</p>
            <p className="mt-3 text-sm text-slate-600">
              Blood pressure meds after breakfast. Polyclinic at 2:00 PM.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function WizardHeader({ step, completion }: { step: number; completion: number }) {
  return (
    <header className="border-b border-slate-100 px-5 py-5 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-amber-700">
            <Sparkles className="h-4 w-4" />
            {Math.round(completion)}% ready
          </div>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {steps[step].label}
          </h2>
        </div>
        <Badge variant="outline" className="h-8 border-emerald-200 bg-emerald-50 px-3 text-emerald-700">
          <LockKeyhole className="mr-1 h-3.5 w-3.5" />
          Draft saved
        </Badge>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-amber-100">
        <div
          className="h-full rounded-full bg-amber-500 transition-all duration-300"
          style={{ width: `${completion}%` }}
        />
      </div>
    </header>
  );
}

function StepRail({
  step,
  setStep,
}: {
  step: number;
  setStep: (value: number) => void;
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-slate-100 px-5 py-3 sm:px-8">
      {steps.map((item, index) => {
        const Icon = item.icon;
        const isDone = index < step;
        const isActive = index === step;

        return (
          <button
            key={item.label}
            onClick={() => setStep(index)}
            className={`flex min-w-fit items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition ${
              isActive
                ? "border-amber-300 bg-amber-100 text-amber-900"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            <span className={`flex h-7 w-7 items-center justify-center rounded-full ${isDone ? "bg-emerald-500 text-white" : "bg-white"}`}>
              {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function StepContent({ step }: { step: number }) {
  if (step === 0) return <ProfileStep />;
  if (step === 1) return <MedicationStep />;
  if (step === 2) return <ReminderStep />;
  if (step === 3) return <TimingStep />;
  return <ShareStep />;
}

function ProfileStep() {
  return (
    <StepShell
      eyebrow="Step 1"
      title="Start with the person, not the paperwork."
      description="Keep the first screen light: enough detail to make the senior view feel personal immediately."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" value="Lim Chee Seng" />
        <Field label="Preferred nickname" value="Ah Gong" />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_1.25fr]">
        <UploadTile />
        <div>
          <Label>Primary language</Label>
          <div className="grid grid-cols-2 gap-2">
            {["English", "Mandarin", "Hokkien", "Malay"].map((item, index) => (
              <Choice key={item} active={index === 0} icon={Languages}>
                {item}
              </Choice>
            ))}
          </div>
        </div>
      </div>
      <TrustStrip />
    </StepShell>
  );
}

function MedicationStep() {
  return (
    <StepShell
      eyebrow="Step 2"
      title="Scan first, confirm after."
      description="The AI scan feels useful, but the caregiver stays in control before anything becomes a reminder."
    >
      <ActionTile icon={ScanLine} title="Scan medication label" body="Open camera, extract name and dosage, then review." action="Scan label" />
      <ReviewCard title="Amlodipine 5mg" meta="Morning after breakfast" accent="blue" />
      <Button variant="outline" className="h-14 w-full rounded-2xl border-dashed text-base font-bold">
        <Plus className="h-5 w-5" />
        Add another medication
      </Button>
    </StepShell>
  );
}

function ReminderStep() {
  return (
    <StepShell
      eyebrow="Step 3"
      title="Make the day feel familiar."
      description="Appointments and custom reminders are written in everyday language so they sound natural when spoken aloud."
    >
      <ReviewCard title="Polyclinic checkup" meta="Tomorrow, 2:00 PM at Toa Payoh Polyclinic" accent="purple" />
      <ActionTile icon={CalendarDays} title="Custom reminder" body="Add anything from tai chi class to calling the grandchildren." action="Add reminder" />
      <div className="grid gap-3 sm:grid-cols-2">
        <ComingSoon title="HealthBuddy link" />
        <ComingSoon title="Forward clinic SMS" />
      </div>
    </StepShell>
  );
}

function TimingStep() {
  return (
    <StepShell
      eyebrow="Step 4"
      title="Choose when MorningKaki should speak up."
      description="Default timings are already sensible for the demo, with quiet hours clearly visible."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TimeBox label="Morning greeting" value="07:30" icon={Bell} />
        <TimeBox label="Medication reminder" value="08:00" icon={Pill} />
      </div>
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <Clock3 className="h-5 w-5 text-amber-600" />
          <p className="font-bold">Quiet hours</p>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <input type="time" defaultValue="21:00" className="h-13 rounded-2xl border border-slate-200 bg-white px-4 text-lg font-bold" />
          <span className="text-slate-400">to</span>
          <input type="time" defaultValue="07:00" className="h-13 rounded-2xl border border-slate-200 bg-white px-4 text-lg font-bold" />
        </div>
      </div>
      <Choice active icon={ShieldCheck}>Ask before push notifications on first open</Choice>
    </StepShell>
  );
}

function ShareStep() {
  return (
    <StepShell
      eyebrow="Step 5"
      title="Send one gentle link."
      description="The senior opens the magic link once, adds it to the home screen, and comes back every morning."
    >
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-center">
          <QRCodeSVG value={magicLink} size={132} className="mx-auto rounded-2xl bg-white p-2" />
          <p className="mt-3 text-sm font-bold text-amber-800">QR for in-person setup</p>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-600">
            {magicLink}
          </div>
          <Button className="h-14 w-full rounded-2xl bg-[#25D366] text-base font-bold text-white hover:bg-[#20bd5a]">
            <MessageCircle className="h-5 w-5" />
            Send via WhatsApp
          </Button>
          <Link href="/dashboard/demo" className="inline-flex items-center gap-1 font-bold text-amber-700">
            Open caregiver dashboard <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </StepShell>
  );
}

function StepShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <p className="text-sm font-extrabold uppercase tracking-wide text-amber-600">{eyebrow}</p>
        <h3 className="mt-2 text-3xl font-extrabold leading-tight text-slate-950">{title}</h3>
        <p className="mt-3 text-base leading-relaxed text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input defaultValue={value} className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-lg font-bold outline-none focus:border-amber-400 focus:bg-white" />
    </label>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-sm font-bold text-slate-600">{children}</span>;
}

function UploadTile() {
  return (
    <button className="flex min-h-40 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-amber-200 bg-amber-50 text-center text-amber-900">
      <Camera className="mb-3 h-8 w-8" />
      <span className="font-extrabold">Add face photo</span>
      <span className="mt-1 text-sm text-amber-800/70">Used only for personalisation</span>
    </button>
  );
}

function Choice({ active, icon: Icon, children }: { active?: boolean; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <button className={`flex min-h-12 items-center gap-2 rounded-2xl border px-3 text-left font-bold ${active ? "border-amber-300 bg-amber-100 text-amber-950" : "border-slate-200 bg-white text-slate-600"}`}>
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function TrustStrip() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <MiniProof icon={HeartHandshake} text="No senior login" />
      <MiniProof icon={ShieldCheck} text="Caregiver confirms" />
      <MiniProof icon={Smartphone} text="Home screen ready" />
    </div>
  );
}

function MiniProof({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-600">
      <Icon className="h-4 w-4 text-amber-600" />
      {text}
    </div>
  );
}

function ActionTile({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action: string }) {
  return (
    <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
      <Icon className="h-7 w-7 text-amber-700" />
      <h4 className="mt-3 text-xl font-extrabold">{title}</h4>
      <p className="mt-1 text-slate-600">{body}</p>
      <Button className="mt-4 h-12 rounded-2xl bg-amber-500 px-5 font-bold text-white hover:bg-amber-600">{action}</Button>
    </div>
  );
}

function ReviewCard({ title, meta, accent }: { title: string; meta: string; accent: "blue" | "purple" }) {
  const styles = accent === "blue" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700";
  return (
    <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div>
        <p className="text-lg font-extrabold">{title}</p>
        <p className="text-sm text-slate-500">{meta}</p>
      </div>
      <Badge className={`${styles} h-8 border-none px-3`}>Review</Badge>
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <Badge className="mb-3 bg-slate-200 text-slate-700">Coming Soon</Badge>
      <p className="font-extrabold text-slate-700">{title}</p>
    </div>
  );
}

function TimeBox({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <label className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 font-bold text-slate-600">
        <Icon className="h-5 w-5 text-amber-600" />
        {label}
      </div>
      <input type="time" defaultValue={value} className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-lg font-bold" />
    </label>
  );
}

function WizardFooter({
  isLastStep,
  step,
  setStep,
}: {
  isLastStep: boolean;
  step: number;
  setStep: (value: number) => void;
}) {
  return (
    <footer className="sticky bottom-0 flex items-center justify-between gap-3 rounded-b-[2rem] border-t border-slate-100 bg-white/90 px-5 py-4 backdrop-blur sm:px-8">
      <Button
        onClick={() => setStep(Math.max(step - 1, 0))}
        disabled={step === 0}
        variant="ghost"
        className="h-12 rounded-2xl px-4 text-base font-bold"
      >
        <ChevronLeft className="h-5 w-5" />
        Back
      </Button>
      <Button
        onClick={() => setStep(Math.min(step + 1, steps.length - 1))}
        className="h-12 rounded-2xl bg-slate-950 px-5 text-base font-bold text-white hover:bg-slate-800"
      >
        {isLastStep ? "Finish setup" : "Continue"}
        <ChevronRight className="h-5 w-5" />
      </Button>
    </footer>
  );
}
