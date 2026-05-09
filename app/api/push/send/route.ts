import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import webpush from "web-push";

// Setup web-push config
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "";

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    'mailto:test@example.com',
    publicVapidKey,
    privateVapidKey
  );
}

export async function POST(request: Request) {
  try {
    const { seniorId, title, body, url } = await request.json();

    if (!seniorId) {
      return NextResponse.json({ error: "Missing seniorId" }, { status: 400 });
    }

    // Get the senior's push subscriptions from Supabase
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('senior_id', seniorId);

    if (error || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: "No active push subscriptions found" }, { status: 404 });
    }

    const payload = JSON.stringify({
      title: title || "🌅 Good morning!",
      body: body || "Your morning is ready.",
      url: url || `/s/demo` // In production, resolve the actual token
    });

    const sendPromises = subscriptions.map((sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };
      return webpush.sendNotification(pushSubscription, payload);
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, count: subscriptions.length });
  } catch (error: any) {
    console.error("Error sending push:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
