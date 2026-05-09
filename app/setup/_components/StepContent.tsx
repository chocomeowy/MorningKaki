"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  Languages,
  MessageCircle,
  Pill,
  Plus,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { setupMagicLink } from "../setup-data";
import { BackgroundDesignPicker } from "./BackgroundDesignPicker";
import {
  ActionTile,
  Choice,
  ComingSoon,
  Field,
  Label,
  ReviewCard,
  StepShell,
  TimeBox,
  TrustStrip,
  UploadTile,
} from "./StepPrimitives";

export function StepContent({ step }: { step: number }) {
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
      <BackgroundDesignPicker />
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
      <ActionTile
        icon={ScanLine}
        title="Scan medication label"
        body="Open camera, extract name and dosage, then review."
        action="Scan label"
      />
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
      <ReviewCard
        title="Polyclinic checkup"
        meta="Tomorrow, 2:00 PM at Toa Payoh Polyclinic"
        accent="purple"
      />
      <ActionTile
        icon={CalendarDays}
        title="Custom reminder"
        body="Add anything from tai chi class to calling the grandchildren."
        action="Add reminder"
      />
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
      <Choice active icon={ShieldCheck}>
        Ask before push notifications on first open
      </Choice>
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
          <QRCodeSVG value={setupMagicLink} size={132} className="mx-auto rounded-2xl bg-white p-2" />
          <p className="mt-3 text-sm font-bold text-amber-800">QR for in-person setup</p>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-600">
            {setupMagicLink}
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
