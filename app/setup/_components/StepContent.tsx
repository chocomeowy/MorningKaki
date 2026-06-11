"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Bell,
  ChevronRight,
  Clock3,
  Languages,
  MessageCircle,
  Pill,
  Plus,
  ScanLine,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackgroundDesignPicker } from "./BackgroundDesignPicker";
import { MedicationRows, ReminderRows } from "./EditableSetupRows";
import { useWizard } from "../SetupWizard";
import type { WizardData } from "../SetupWizard";
import { serializeSetupData } from "@/lib/local-db";
import {
  Choice,
  ComingSoon,
  Field,
  Label,
  StepShell,
  TrustStrip,
} from "./StepPrimitives";

export function StepContent({ step }: { step: number }) {
  const context = useWizard();
  if (!context) return null;
  
  if (step === 0) return <ProfileStep data={context.data} setData={context.setData} />;
  if (step === 1) return <MedicationStep data={context.data} setData={context.setData} />;
  if (step === 2) return <ReminderStep data={context.data} setData={context.setData} />;
  if (step === 3) return <TimingStep data={context.data} setData={context.setData} />;
  return <ShareStep data={context.data} />;
}

interface DataStepProps {
  data: WizardData;
  setData: Dispatch<SetStateAction<WizardData>>;
}

function ProfileStep({ data, setData }: DataStepProps) {
  const languages = [
    { label: "English", id: "en" },
    { label: "Mandarin", id: "zh" },
    { label: "Cantonese", id: "cantonese" },
  ];

  return (
    <StepShell
      eyebrow="Step 1"
      title="Start with the person."
      description=""
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" value={data.fullName} onChange={(e) => setData((p) => ({ ...p, fullName: e.target.value }))} />
        <Field label="Preferred nickname" value={data.nickname} onChange={(e) => setData((p) => ({ ...p, nickname: e.target.value }))} />
      </div>
      <div>
        <Label>Primary language</Label>
        <div className="grid grid-cols-2 gap-2">
          {languages.map((item) => (
            <button
              key={item.id}
              onClick={() => setData((p) => ({ ...p, language: item.id }))}
              className={`flex min-h-12 items-center gap-2 rounded-2xl border px-3 text-left font-bold ${data.language === item.id ? "border-amber-300 bg-amber-100 text-amber-950" : "border-slate-200 bg-white text-slate-600"}`}
            >
              <Languages className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <BackgroundDesignPicker />
      <TrustStrip />
    </StepShell>
  );
}

function MedicationStep({ data, setData }: DataStepProps) {
  const handleScan = () => {
    // Hackathon mockup of scanning a medicine
    setTimeout(() => {
      setData((p) => ({
        ...p,
        medications: [...p.medications, { id: crypto.randomUUID(), name: "Lisinopril 10mg", timing: "Evening after dinner" }]
      }));
    }, 500);
  };

  return (
    <StepShell
      eyebrow="Step 2"
      title="Scan first, confirm after."
      description="The AI scan feels useful, but the caregiver stays in control before anything becomes a reminder."
    >
      <button onClick={handleScan} className="flex flex-col rounded-3xl border border-amber-100 bg-amber-50 p-5 text-left transition hover:bg-amber-100/50">
        <ScanLine className="h-7 w-7 text-amber-700" />
        <h4 className="mt-3 text-xl font-extrabold text-amber-950">Scan medication label</h4>
        <p className="mt-1 text-slate-600">Open camera, extract name and dosage, then review.</p>
        <span className="mt-4 flex h-12 w-fit items-center justify-center rounded-2xl bg-amber-500 px-5 font-bold text-white hover:bg-amber-600">
          Scan label
        </span>
      </button>

      <MedicationRows data={data} setData={setData} />
    </StepShell>
  );
}

function ReminderStep({ data, setData }: DataStepProps) {
  return (
    <StepShell
      eyebrow="Step 3"
      title="Make the day feel familiar."
      description="Appointments and custom reminders are written in everyday language so they sound natural when spoken aloud."
    >
      <ReminderRows data={data} setData={setData} />

      <div className="grid gap-3 sm:grid-cols-2">
        <ComingSoon title="HealthBuddy link" />
        <ComingSoon title="Forward clinic SMS" />
      </div>
    </StepShell>
  );
}

function TimingStep({ data, setData }: DataStepProps) {
  const updateTiming = (key: keyof WizardData["timings"], value: string) => {
    setData((p) => ({ ...p, timings: { ...p.timings, [key]: value } }));
  };

  return (
    <StepShell
      eyebrow="Step 4"
      title="Choose when MorningKaki should speak up."
      description="Default timings are already sensible for the demo, with quiet hours clearly visible."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2 font-bold">
            <Bell className="h-5 w-5 text-amber-600" />
            Morning greeting
          </div>
          <input type="time" value={data.timings.morning} onChange={(e) => updateTiming("morning", e.target.value)} className="h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-bold" />
        </label>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2 font-bold">
            <Pill className="h-5 w-5 text-amber-600" />
            Medication reminder
          </div>
          {data.timings.med ? (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input type="time" value={data.timings.med} onChange={(e) => updateTiming("med", e.target.value)} className="h-13 rounded-2xl border border-slate-200 bg-white px-4 text-lg font-bold" />
              <button type="button" onClick={() => updateTiming("med", "")} aria-label="Remove medication reminder time" className="flex h-13 items-center justify-center rounded-2xl border border-red-100 bg-white px-4 text-red-600 hover:bg-red-50">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => updateTiming("med", "08:00")} className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 text-base font-bold text-slate-700">
              <Plus className="h-5 w-5" />
              Add medication reminder time
            </button>
          )}
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <Clock3 className="h-5 w-5 text-amber-600" />
          <p className="font-bold">Quiet hours</p>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <input type="time" value={data.timings.quietStart} onChange={(e) => updateTiming("quietStart", e.target.value)} className="h-13 rounded-2xl border border-slate-200 bg-white px-4 text-lg font-bold" />
          <span className="text-slate-400">to</span>
          <input type="time" value={data.timings.quietEnd} onChange={(e) => updateTiming("quietEnd", e.target.value)} className="h-13 rounded-2xl border border-slate-200 bg-white px-4 text-lg font-bold" />
        </div>
      </div>
      <Choice active icon={ShieldCheck}>
        Ask before push notifications on first open
      </Choice>
    </StepShell>
  );
}

function ShareStep({ data }: { data: WizardData }) {
  // If the component mounts but magicToken isn't set yet (because DB insertion is async), 
  // it might flash empty. We'll use the origin URL if available.
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://morningkaki.vercel.app";
  const finalLink = useMemo(() => {
    if (!data?.magicToken) return `${baseUrl}/s/...`;
    const b64 = serializeSetupData(data);
    return `${baseUrl}/s/${data.magicToken}${b64 ? `?d=${encodeURIComponent(b64)}` : ""}`;
  }, [data, baseUrl]);

  return (
    <StepShell
      eyebrow="Step 5"
      title="Send one gentle link."
      description="The senior opens the magic link once, adds it to the home screen, and comes back every morning."
    >
      {data?.isSaving ? (
        <div className="flex flex-col items-center justify-center py-12 text-amber-600">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
          <p className="mt-4 font-bold">Generating magic link...</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-center">
            <QRCodeSVG value={finalLink} size={132} className="mx-auto rounded-2xl bg-white p-2" />
            <p className="mt-3 text-sm font-bold text-amber-800">QR for in-person setup</p>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-600 break-all">
              {finalLink}
            </div>
            <Button onClick={() => {
              const msg = `Mum, tap this link and add it to your home screen. I'll send you a good morning every day. ${finalLink}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
            }} className="h-14 w-full rounded-2xl bg-[#25D366] text-base font-bold text-white hover:bg-[#20bd5a]">
              <MessageCircle className="h-5 w-5" />
              Send via WhatsApp
            </Button>
            <Link href="/dashboard" className="inline-flex items-center gap-1 font-bold text-amber-700">
              Open caregiver dashboard <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </StepShell>
  );
}
