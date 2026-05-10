"use client";

import type { Dispatch, SetStateAction } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MedicationDraft, ReminderDraft, WizardData } from "../SetupWizard";
import { Label } from "./StepPrimitives";

interface RowEditorProps {
  data: WizardData;
  setData: Dispatch<SetStateAction<WizardData>>;
}

function getSingaporeDateString() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
}

export function MedicationRows({ data, setData }: RowEditorProps) {
  const addMedication = () => {
    setData((p) => ({
      ...p,
      medications: [...p.medications, { id: crypto.randomUUID(), name: "", timing: "Morning after breakfast" }],
    }));
  };

  const updateMedication = (id: string, patch: Partial<MedicationDraft>) => {
    setData((p) => ({
      ...p,
      medications: p.medications.map((med) => med.id === id ? { ...med, ...patch } : med),
    }));
  };

  const removeMedication = (id: string) => {
    setData((p) => ({ ...p, medications: p.medications.filter((med) => med.id !== id) }));
  };

  return (
    <>
      <div className="space-y-3">
        {data.medications.map((med) => (
          <div key={med.id} className="grid gap-3 rounded-3xl border border-blue-100 bg-blue-50 p-4 sm:grid-cols-[1.2fr_1fr_auto]">
            <label>
              <Label>Medicine</Label>
              <input value={med.name} onChange={(e) => updateMedication(med.id, { name: e.target.value })} placeholder="Amlodipine 5mg" className="h-13 w-full rounded-2xl border border-blue-100 bg-white px-4 text-base font-bold outline-none focus:border-blue-300" />
            </label>
            <label>
              <Label>Schedule</Label>
              <input value={med.timing} onChange={(e) => updateMedication(med.id, { timing: e.target.value })} placeholder="Morning after breakfast" className="h-13 w-full rounded-2xl border border-blue-100 bg-white px-4 text-base font-bold outline-none focus:border-blue-300" />
            </label>
            <button type="button" onClick={() => removeMedication(med.id)} aria-label={`Remove ${med.name || "medication"}`} className="flex h-13 items-center justify-center rounded-2xl border border-red-100 bg-white px-4 text-red-600 hover:bg-red-50 sm:self-end">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
      <Button onClick={addMedication} variant="outline" className="h-14 w-full rounded-2xl border-dashed text-base font-bold">
        <Plus className="h-5 w-5" />
        Add another medication manually
      </Button>
    </>
  );
}

export function ReminderRows({ data, setData }: RowEditorProps) {
  const addReminder = () => {
    setData((p) => ({
      ...p,
      reminders: [...p.reminders, { id: crypto.randomUUID(), name: "", date: getSingaporeDateString(), time: "12:00", location: "Home" }],
    }));
  };

  const updateReminder = (id: string, patch: Partial<ReminderDraft>) => {
    setData((p) => ({
      ...p,
      reminders: p.reminders.map((rem) => rem.id === id ? { ...rem, ...patch } : rem),
    }));
  };

  const removeReminder = (id: string) => {
    setData((p) => ({ ...p, reminders: p.reminders.filter((rem) => rem.id !== id) }));
  };

  return (
    <>
      <div className="space-y-3">
        {data.reminders.map((rem) => (
          <div key={rem.id} className="grid gap-3 rounded-3xl border border-purple-100 bg-purple-50 p-4 sm:grid-cols-[1.2fr_0.9fr_0.7fr_1fr_auto]">
            <label>
              <Label>Plan or reminder</Label>
              <input value={rem.name} onChange={(e) => updateReminder(rem.id, { name: e.target.value })} placeholder="Polyclinic checkup" className="h-13 w-full rounded-2xl border border-purple-100 bg-white px-4 text-base font-bold outline-none focus:border-purple-300" />
            </label>
            <label>
              <Label>Date</Label>
              <input type="date" value={rem.date} onChange={(e) => updateReminder(rem.id, { date: e.target.value })} className="h-13 w-full rounded-2xl border border-purple-100 bg-white px-4 text-base font-bold outline-none focus:border-purple-300" />
            </label>
            <label>
              <Label>Time</Label>
              <input type="time" value={rem.time} onChange={(e) => updateReminder(rem.id, { time: e.target.value })} className="h-13 w-full rounded-2xl border border-purple-100 bg-white px-4 text-base font-bold outline-none focus:border-purple-300" />
            </label>
            <label>
              <Label>Location</Label>
              <input value={rem.location} onChange={(e) => updateReminder(rem.id, { location: e.target.value })} placeholder="Home" className="h-13 w-full rounded-2xl border border-purple-100 bg-white px-4 text-base font-bold outline-none focus:border-purple-300" />
            </label>
            <button type="button" onClick={() => removeReminder(rem.id)} aria-label={`Remove ${rem.name || "plan"}`} className="flex h-13 items-center justify-center rounded-2xl border border-red-100 bg-white px-4 text-red-600 hover:bg-red-50 sm:self-end">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={addReminder} className="flex flex-col rounded-3xl border border-amber-100 bg-amber-50 p-5 text-left transition hover:bg-amber-100/50">
        <CalendarDays className="h-7 w-7 text-amber-700" />
        <h4 className="mt-3 text-xl font-extrabold text-amber-950">Custom reminder</h4>
        <p className="mt-1 text-slate-600">Add anything from tai chi class to calling the grandchildren.</p>
        <span className="mt-4 flex h-12 w-fit items-center justify-center rounded-2xl bg-amber-500 px-5 font-bold text-white hover:bg-amber-600">
          Add reminder
        </span>
      </button>
    </>
  );
}
