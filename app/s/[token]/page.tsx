import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { SeniorClient } from "./SeniorClient";

export default async function SeniorPage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  const { token } = params;

  // 1. Resolve token to profile
  const { data: senior } = await supabase
    .from("seniors")
    .select("*")
    .eq("magic_token", token)
    .single();

  if (!senior) {
    return notFound();
  }

  // 2. Pass the senior's data into the Client Component
  return <SeniorClient senior={senior} />;
}
