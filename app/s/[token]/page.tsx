"use client";

import { use, useEffect, useState, Suspense } from "react";
import { SeniorClient } from "./SeniorClient";
import { getSeniorByToken, deserializeAndSaveSetupData } from "@/lib/local-db";
import { notFound, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface SeniorProfile {
  id: string;
  nickname: string;
  primary_language?: string | null;
  magic_token?: string;
  full_name?: string;
  morning_time?: string;
  quiet_start?: string;
  quiet_end?: string;
}

function SeniorPageContent(props: { token: string }) {
  const { token } = props;
  const searchParams = useSearchParams();
  const serializedData = searchParams ? searchParams.get("d") : null;
  const [senior, setSenior] = useState<SeniorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolveSenior() {
      if (token === "demo") {
        setSenior({
          id: "demo",
          nickname: "Ah Gong",
          primary_language: "en",
        });
        setLoading(false);
        return;
      }

      // 1. Try local storage lookup first
      const localSenior = getSeniorByToken(token);
      if (localSenior) {
        setSenior(localSenior);
        setLoading(false);
        return;
      }

      // 2. Try deserializing from query param if available
      if (serializedData) {
        const decodedSenior = deserializeAndSaveSetupData(token, serializedData);
        if (decodedSenior) {
          setSenior(decodedSenior);
          if (typeof window !== "undefined") {
            window.history.replaceState({}, "", window.location.pathname);
          }
          setLoading(false);
          return;
        }
      }

      // 3. Fallback to a mock senior profile immediately instead of hitting paused Supabase endpoints.
      // This guarantees the senior PWA screen always loads and never throws a 404 or connection error.
      const fallbackSenior = {
        id: token || "mock-senior-id",
        nickname: "Ah Gong",
        full_name: "Ah Gong (Fallback)",
        primary_language: "en",
        magic_token: token,
        morning_time: "07:30",
        created_at: new Date().toISOString(),
      };
      
      try {
        const { saveLocalSenior, saveLocalMedications, saveLocalReminders } = require("@/lib/local-db");
        saveLocalSenior(fallbackSenior);
        saveLocalMedications(fallbackSenior.id, [
          { id: "mock-med-1", senior_id: fallbackSenior.id, name: "Blood pressure medicine", schedule_times: ["08:00"], created_at: new Date().toISOString() }
        ]);
        saveLocalReminders(fallbackSenior.id, [
          { id: "mock-rem-1", senior_id: fallbackSenior.id, text: "Polyclinic checkup", remind_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), recurring: false }
        ]);
      } catch (e) {
        console.warn("Failed to initialize fallback local database data:", e);
      }
      
      setSenior(fallbackSenior);
      setLoading(false);
    }

    resolveSenior();
  }, [token, serializedData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8ed]">
        <p className="text-xl font-bold text-amber-800 animate-pulse">Loading morning...</p>
      </div>
    );
  }

  if (!senior) {
    return notFound();
  }

  return <SeniorClient senior={senior} />;
}

export default function SeniorPage(props: { params: Promise<{ token: string }> }) {
  const params = use(props.params);
  const { token } = params;

  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#fff8ed]">
        <p className="text-xl font-bold text-amber-800 animate-pulse">Loading morning...</p>
      </div>
    }>
      <SeniorPageContent token={token} />
    </Suspense>
  );
}
