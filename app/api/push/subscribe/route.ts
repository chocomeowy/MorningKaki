import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client"; // This is safe for a simple anon insert

export async function POST(request: Request) {
  try {
    const { seniorId, subscription } = await request.json();

    if (!seniorId || !subscription) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabase.from('push_subscriptions').upsert({
      senior_id: seniorId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    }, { onConflict: 'endpoint' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    void error;
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}
