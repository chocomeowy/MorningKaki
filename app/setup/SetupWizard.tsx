"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StepContent } from "./_components/StepContent";
import { setupSteps } from "./setup-data";

export function SetupWizard() {
  const [step, setStep] = useState(0);
  const completion = useMemo(() => ((step + 1) / setupSteps.length) * 100, [step]);
  const isLastStep = step === setupSteps.length - 1;

  return (
    <main className="min-h-screen bg-[#fbf7ef] text-slate-900">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-4 md:grid-cols-[0.9fr_1.1fr] md:px-8 md:py-8">
        <GiftPanel />

        <section className="flex h-[calc(100vh-2rem)] flex-col rounded-[2rem] border border-amber-100 bg-white shadow-[0_20px_80px_rgba(120,72,12,0.12)] md:h-[calc(100vh-4rem)]">
          <WizardHeader step={step} completion={completion} />
          <StepRail step={step} setStep={setStep} />
          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
            <StepContent step={step} />
          </div>
          <WizardFooter isLastStep={isLastStep} step={step} setStep={setStep} />
        </section>
      </div>
    </main>
  );
}

function GiftPanel() {
  return (
    <aside className="relative hidden h-[calc(100vh-4rem)] overflow-hidden rounded-[2rem] bg-[#2f2118] p-7 text-white md:block">
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
            {setupSteps[step].label}
          </h2>
        </div>
        <Badge
          variant="outline"
          className="h-8 border-emerald-200 bg-emerald-50 px-3 text-emerald-700"
        >
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
    <nav className="flex gap-2 overflow-x-auto border-b border-slate-100 px-5 py-3 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-8">
      {setupSteps.map((item, index) => (
        <StepButton
          key={item.label}
          icon={item.icon}
          isActive={index === step}
          isDone={index < step}
          label={item.railLabel}
          onClick={() => setStep(index)}
        />
      ))}
    </nav>
  );
}

function StepButton({
  icon: Icon,
  isActive,
  isDone,
  label,
  onClick,
}: {
  icon: typeof setupSteps[number]["icon"];
  isActive: boolean;
  isDone: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-w-fit items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition sm:min-w-0 sm:justify-center sm:px-2 ${
        isActive
          ? "border-amber-300 bg-amber-100 text-amber-900"
          : "border-slate-200 bg-white text-slate-500"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full ${
          isDone ? "bg-emerald-500 text-white" : "bg-white"
        }`}
      >
        {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </span>
      <span className="truncate">{label}</span>
    </button>
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
    <footer className="flex items-center justify-between gap-3 rounded-b-[2rem] border-t border-slate-100 bg-white px-5 py-4 sm:px-8">
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
        onClick={() => setStep(Math.min(step + 1, setupSteps.length - 1))}
        className="h-12 rounded-2xl bg-slate-950 px-5 text-base font-bold text-white hover:bg-slate-800"
      >
        {isLastStep ? "Finish setup" : "Continue"}
        <ChevronRight className="h-5 w-5" />
      </Button>
    </footer>
  );
}
