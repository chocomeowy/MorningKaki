"use client";

import { use, useEffect, useState } from "react";
import { SeniorClient } from "./SeniorClient";
import { getSeniorByToken } from "@/lib/local-db";
import { notFound } from "next/navigation";
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

export default function SeniorPage(props: { params: Promise<{ token: string }> }) {
  const params = use(props.params);
  const { token } = params;
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

      // 2. Fallback to Supabase query (catch errors silently)
      try {
        const { data } = await supabase
          .from("seniors")
          .select("*")
          .eq("magic_token", token)
          .single();

        if (data) {
          setSenior(data);
        }
      } catch (err) {
        console.warn("Supabase lookup failed/skipped for token:", token, err);
      } finally {
        setLoading(false);
      }
    }

    resolveSenior();
  }, [token]);

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
