import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import webpush from "web-push";

interface PushSendRequest {
  seniorId?: string;
  title?: string;
  body?: string;
  url?: string;
  subscriptions?: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }[];
}

interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to send push notification";
}

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
    const { seniorId, title, body, url, subscriptions: reqSubscriptions } = (await request.json()) as PushSendRequest;

    if (!seniorId) {
      return NextResponse.json({ error: "Missing seniorId" }, { status: 400 });
    }

    let subscriptions: PushSubscriptionRow[] = [];
    let magicToken: string | undefined = undefined;

    // Use subscriptions from request if provided
    if (reqSubscriptions && reqSubscriptions.length > 0) {
      subscriptions = reqSubscriptions.map((sub) => ({
        endpoint: sub.endpoint,
        p256dh: sub.keys?.p256dh || "",
        auth: sub.keys?.auth || "",
      }));
    } else {
      // Get the senior's magic token and subscriptions from Supabase, catch errors gracefully
      try {
        const [{ data: senior }, { data: dbSubscriptions }] = await Promise.all([
          supabase.from('seniors').select('magic_token').eq('id', seniorId).maybeSingle(),
          supabase.from('push_subscriptions').select('*').eq('senior_id', seniorId)
        ]);
        if (senior) magicToken = senior.magic_token;
        if (dbSubscriptions) {
          subscriptions = dbSubscriptions as PushSubscriptionRow[];
        }
      } catch (err) {
        console.warn("Supabase push subscription lookup failed/skipped:", err);
      }
    }

    if (subscriptions.length === 0) {
      return NextResponse.json({ error: "No active push subscriptions found" }, { status: 404 });
    }

    const seniorUrl = magicToken ? `/s/${magicToken}` : "/";

    const payload = JSON.stringify({
      title: title || "🌅 Good morning!",
      body: body || "Your morning is ready.",
      url: url || seniorUrl
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
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
