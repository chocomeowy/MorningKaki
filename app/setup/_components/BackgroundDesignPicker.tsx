"use client";

import { useState } from "react";
import { Check, ImageIcon } from "lucide-react";
import {
  defaultMorningDesign,
  morningDesigns,
  morningDesignStorageKey,
  type MorningDesignId,
} from "@/lib/morning-designs";

export function BackgroundDesignPicker() {
  const [selected, setSelected] = useState<MorningDesignId>(() => {
    if (typeof window === "undefined") {
      return defaultMorningDesign.id;
    }
    const saved = window.localStorage.getItem(morningDesignStorageKey);
    if (saved && morningDesigns.some((design) => design.id === saved)) {
      return saved as MorningDesignId;
    }
    return defaultMorningDesign.id;
  });

  function chooseDesign(id: MorningDesignId) {
    setSelected(id);
    window.localStorage.setItem(morningDesignStorageKey, id);
  }

  return (
    <section className="rounded-3xl border border-amber-100 bg-amber-50/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-amber-700" />
        <div>
          <p className="font-extrabold text-slate-900">Daily card background</p>
          <p className="text-sm font-medium text-slate-500">Choose the look for tomorrow morning.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {morningDesigns.map((design) => {
          const isActive = selected === design.id;
          return (
            <button
              key={design.id}
              onClick={() => chooseDesign(design.id)}
              className={`rounded-2xl border bg-white p-2 text-left transition ${
                isActive ? "border-amber-400 ring-4 ring-amber-100" : "border-slate-200"
              }`}
            >
              <div className={`relative h-20 rounded-xl ${design.previewClassName}`}>
                <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.95),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(244,63,94,.55),transparent_20%),radial-gradient(circle_at_50%_85%,rgba(234,179,8,.55),transparent_22%)]" />
                <span className="absolute bottom-2 left-2 rounded-md bg-white/85 px-2 py-1 text-xs font-black text-amber-900">
                  早安
                </span>
                {isActive && (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </div>
              <p className="mt-2 font-extrabold text-slate-900">{design.shortName}</p>
              <p className="mt-1 text-xs font-medium leading-snug text-slate-500">{design.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
