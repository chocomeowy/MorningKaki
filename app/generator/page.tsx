"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2, Share2, Sparkles, Sun, BellRing, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function GeneratorPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    imageUrl: string;
    greeting: string;
    theme: string;
  } | null>(null);

  // Push notification state
  const [seniors, setSeniors] = useState<{ id: string; nickname: string; full_name: string }[]>([]);
  const [isSendingPush, setIsSendingPush] = useState<string | null>(null);
  const [pushSentStatus, setPushSentStatus] = useState<string | null>(null);
  const [pushType, setPushType] = useState<"morning" | "medicine">("morning");
  const [delaySeconds, setDelaySeconds] = useState<number>(0);

  // Fetch all seniors for push testing
  const fetchSeniors = async () => {
    const { data } = await supabase.from("seniors").select("id, nickname, full_name").limit(10);
    if (data) setSeniors(data);
  };

  const generateCard = async () => {
    setIsGenerating(true);
    setResult(null);
    try {
      const res = await fetch("/api/morning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: "Ah Gong",
          language: "zh",
          randomTheme: true,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Failed to generate. Check console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const shareToWhatsApp = () => {
    if (!result) return;
    const pageUrl = typeof window !== "undefined" ? window.location.origin : "https://morningkaki.vercel.app";
    
    // We construct the text to be shared via WhatsApp.
    const text = `早安！\n\n${result.greeting}\n\n今天的早安图准备好了：\n${result.imageUrl}\n\n点击这里查看：\n${pageUrl}/s/demo`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const sendPushNotification = async (seniorId: string) => {
    setIsSendingPush(seniorId);
    setPushSentStatus(null);
    
    const title = pushType === "morning" ? "🌅 早安 Good morning!" : "💊 Medication Reminder";
    const body = pushType === "morning" ? "Your daily morning card is ready. Tap to view." : "It's time to take your medication (Amlodipine 5mg).";

    const executePush = async () => {
      try {
        const res = await fetch("/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seniorId, title, body }),
        });
        const data = await res.json();
        if (res.ok) {
          setPushSentStatus(seniorId);
          setTimeout(() => setPushSentStatus(null), 3000);
        } else {
          alert("Failed to send push: " + data.error);
        }
      } catch (error) {
        console.error(error);
        alert("Error sending push notification.");
      } finally {
        setIsSendingPush(null);
      }
    };

    if (delaySeconds > 0) {
      // Simulate scheduling for the demo by waiting in the browser
      setTimeout(executePush, delaySeconds * 1000);
    } else {
      executePush();
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf7ef] p-6 text-slate-900 md:p-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-amber-900">
            Morning Card Generator
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Demo tool to manually generate today's daily greeting & image
          </p>
        </header>

        <div className="rounded-[2rem] border border-amber-100 bg-white p-6 shadow-xl sm:p-10">
          {!result && !isGenerating ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Sun className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold">Ready to generate</h2>
              <p className="mt-2 max-w-md text-slate-500">
                Click below to call the AI pipeline. It will determine today's theme and generate a localized greeting.
              </p>
              <Button
                onClick={generateCard}
                className="mt-8 h-14 rounded-full bg-amber-500 px-8 text-lg font-bold text-white hover:bg-amber-600"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Today's Card
              </Button>
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
              <p className="mt-6 text-xl font-bold text-amber-900">Painting the morning...</p>
              <p className="mt-2 text-slate-500">Generating image and drafting greeting</p>
            </div>
          ) : result ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-800">
                <Sparkles className="h-4 w-4" />
                Theme applied: {result.theme}
              </div>

              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[1.5rem] bg-slate-100 shadow-md">
                <Image
                  src={result.imageUrl}
                  alt="Generated Card"
                  fill
                  className="object-cover"
                  unoptimized // in case it's a base64 string
                />
              </div>

              <div className="mt-6 rounded-2xl bg-amber-50 p-5">
                <p className="whitespace-pre-wrap text-lg font-bold leading-relaxed text-slate-800">
                  {result.greeting}
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button
                  onClick={shareToWhatsApp}
                  className="h-14 flex-1 rounded-2xl bg-[#25D366] text-lg font-bold text-white hover:bg-[#20bd5a] sm:flex-none sm:px-8"
                >
                  <Share2 className="mr-2 h-5 w-5" />
                  Share to WhatsApp
                </Button>
                <Button
                  onClick={generateCard}
                  variant="outline"
                  className="h-14 flex-1 rounded-2xl border-amber-200 text-lg font-bold text-amber-700 hover:bg-amber-50 sm:flex-none sm:px-8"
                >
                  Generate Another
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Push Notification Tester Section */}
        <div className="mt-8 rounded-[2rem] border border-amber-100 bg-white p-6 shadow-xl sm:p-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                <BellRing className="h-6 w-6 text-amber-500" />
                Test Push Notifications
              </h2>
              <p className="mt-1 text-slate-500">Send a live push notification to a specific senior's device.</p>
            </div>
            <Button onClick={fetchSeniors} variant="outline" className="border-amber-200 text-amber-700">
              Load Seniors
            </Button>
          </div>

          {seniors.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 rounded-xl bg-amber-50 p-4 border border-amber-100">
                <label className="flex items-center gap-2 font-bold text-amber-900">
                  Type:
                  <select 
                    value={pushType} 
                    onChange={(e) => setPushType(e.target.value as "morning" | "medicine")}
                    className="rounded-lg border border-amber-200 px-3 py-1.5 text-sm"
                  >
                    <option value="morning">🌅 Morning Card</option>
                    <option value="medicine">💊 Medicine Reminder</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 font-bold text-amber-900">
                  Delay (Demo Scheduling):
                  <select 
                    value={delaySeconds} 
                    onChange={(e) => setDelaySeconds(Number(e.target.value))}
                    className="rounded-lg border border-amber-200 px-3 py-1.5 text-sm"
                  >
                    <option value={0}>Instant</option>
                    <option value={5}>5 seconds</option>
                    <option value={10}>10 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                  </select>
                </label>
              </div>

              {seniors.map((senior) => (
                <div key={senior.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div>
                    <p className="font-bold text-slate-900">{senior.nickname}</p>
                    <p className="text-sm text-slate-500">{senior.full_name}</p>
                  </div>
                  <Button
                    onClick={() => sendPushNotification(senior.id)}
                    disabled={isSendingPush === senior.id || pushSentStatus === senior.id}
                    className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
                  >
                    {isSendingPush === senior.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : pushSentStatus === senior.id ? (
                      <><CheckCircle2 className="mr-2 h-4 w-4" /> Sent</>
                    ) : (
                      <><BellRing className="mr-2 h-4 w-4" /> {delaySeconds > 0 ? "Schedule Push" : "Send Push"}</>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-6 text-center text-amber-700">
              Click "Load Seniors" to fetch from your database. Make sure the senior has opened their PWA on a device and accepted notification permissions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
