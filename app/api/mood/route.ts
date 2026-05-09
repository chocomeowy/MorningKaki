import { NextResponse } from "next/server";
import type { MoodStickerId } from "@/lib/mood-stickers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const validMoodIds = new Set<MoodStickerId>([
  "energetic",
  "tired",
  "down",
  "grateful",
  "confused",
]);

interface MoodRequest {
  seniorId?: string;
  stickerType?: MoodStickerId;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MoodRequest;

    if (!body.seniorId || !body.stickerType || !validMoodIds.has(body.stickerType)) {
      return NextResponse.json({ error: "Invalid mood payload" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("mood_logs").insert({
      senior_id: body.seniorId,
      sticker_type: body.stickerType,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save mood" }, { status: 500 });
  }
}
