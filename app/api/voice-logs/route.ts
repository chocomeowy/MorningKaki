import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const voiceBucket = "voice-memories";

interface VoiceLogRow {
  id: string;
  transcript: string | null;
  sentiment_label: string | null;
  sentiment_score: number | null;
  audio_url: string | null;
  timestamp: string | null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to load voice logs";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seniorId = searchParams.get("seniorId");

    if (!seniorId) {
      return NextResponse.json({ error: "Missing seniorId" }, { status: 400 });
    }

    if (seniorId === "demo") {
      return NextResponse.json({ logs: getDemoVoiceLogs() });
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("voice_logs")
      .select("id, transcript, sentiment_label, sentiment_score, audio_url, timestamp")
      .eq("senior_id", seniorId)
      .order("timestamp", { ascending: false })
      .limit(20);

    if (error) throw error;

    const logs = await Promise.all(
      ((data ?? []) as VoiceLogRow[]).map(async (log) => ({
        id: log.id,
        transcript: log.transcript ?? "",
        sentimentLabel: log.sentiment_label ?? "neutral",
        sentimentScore: log.sentiment_score ?? 50,
        timestamp: log.timestamp,
        audioUrl: await getSignedAudioUrl(supabase, log.audio_url),
      })),
    );

    return NextResponse.json({ logs });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

async function getSignedAudioUrl(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  audioPath: string | null,
) {
  if (!audioPath) return null;
  if (audioPath.startsWith("http")) return audioPath;

  const { data, error } = await supabase.storage
    .from(voiceBucket)
    .createSignedUrl(audioPath, 60 * 60);

  return error ? null : data.signedUrl;
}

function getDemoVoiceLogs() {
  return [
    {
      id: "demo-voice-1",
      transcript: "I slept well and I am going to meet Uncle Tan for kopi after breakfast.",
      sentimentLabel: "positive",
      sentimentScore: 88,
      timestamp: new Date().toISOString(),
      audioUrl: null,
    },
  ];
}
