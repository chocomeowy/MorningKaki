"use client";

import type { ChangeEventHandler, ReactNode } from "react";
import {
  Camera,
  HeartHandshake,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function StepShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
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

export function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input value={value} onChange={onChange} className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-lg font-bold outline-none focus:border-amber-400 focus:bg-white" />
    </label>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-2 block text-sm font-bold text-slate-600">{children}</span>;
}

export function UploadTile() {
  return (
    <button className="flex min-h-40 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-amber-200 bg-amber-50 text-center text-amber-900">
      <Camera className="mb-3 h-8 w-8" />
      <span className="font-extrabold">Add face photo</span>
      <span className="mt-1 text-sm text-amber-800/70">Used only for personalisation</span>
    </button>
  );
}

export function Choice({
  active,
  icon: Icon,
  children,
}: {
  active?: boolean;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <button className={`flex min-h-12 items-center gap-2 rounded-2xl border px-3 text-left font-bold ${active ? "border-amber-300 bg-amber-100 text-amber-950" : "border-slate-200 bg-white text-slate-600"}`}>
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

export function TrustStrip() {
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

export function ActionTile({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action: string;
}) {
  return (
    <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
      <Icon className="h-7 w-7 text-amber-700" />
      <h4 className="mt-3 text-xl font-extrabold">{title}</h4>
      <p className="mt-1 text-slate-600">{body}</p>
      <Button className="mt-4 h-12 rounded-2xl bg-amber-500 px-5 font-bold text-white hover:bg-amber-600">
        {action}
      </Button>
    </div>
  );
}

export function ReviewCard({
  title,
  meta,
  accent,
}: {
  title: string;
  meta: string;
  accent: "blue" | "purple";
}) {
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

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <Badge className="mb-3 bg-slate-200 text-slate-700">Coming Soon</Badge>
      <p className="font-extrabold text-slate-700">{title}</p>
    </div>
  );
}

export function TimeBox({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
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
