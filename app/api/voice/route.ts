import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const voiceBucket = "voice-memories";
const CANTONESE_VOICE_ID = "cHDwXsKG0qHMNLIjOusN";
const DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Voice processing failed";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const seniorId = formData.get("seniorId") as string;
    const nickname = (formData.get("nickname") as string) || "Ah Gong";
    const language = (formData.get("language") as string) || "en";
    const shouldPersist = Boolean(seniorId && seniorId !== "demo");

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const recordedAt = new Date();
    let audioPath = "";

    if (shouldPersist) {
      try {
        audioPath = `${seniorId}/${recordedAt.toISOString().replace(/[:.]/g, "-")}.webm`;
        await ensureVoiceBucket(supabase);
        const { error: uploadError } = await supabase.storage
          .from(voiceBucket)
          .upload(audioPath, audioFile, {
            contentType: audioFile.type || "audio/webm",
            upsert: false,
          });

        if (uploadError) throw uploadError;
      } catch (err) {
        console.warn("Supabase voice upload failed/skipped:", err);
        audioPath = ""; // reset audio path if upload failed
      }
    }

    // 1. In showcase mode, we bypass OpenAI Whisper and LLM completion to use 0 tokens.
    // We select a high-fidelity warm mock transcript and reply based on the senior's language.
    let transcript = "Good morning! Just checking in.";
    let replyText = `Good morning, ${nickname}! It is so wonderful to hear your voice. I hope you have a beautiful and peaceful day today! ❤️`;
    let sentimentScore = 95;
    let sentimentLabel = "positive";

    if (language === "zh") {
      transcript = "早上好！我来打个卡。";
      replyText = `早上好，${nickname}！听到您的声音真高兴。祝您今天心情愉快，平安健康！❤️`;
    } else if (language === "cantonese" || language === "hokkien") {
      transcript = "早晨！我嚟打個卡。";
      replyText = `早晨，${nickname}！聽到您嘅聲音真係好開心。祝您今日開開心心，身體健康！❤️`;
    }

    // 2. Synthesize Voice with ElevenLabs
    let audioBuffer: ArrayBuffer | null = null;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    
    if (elevenLabsKey) {
      const voiceId = getVoiceId(language);
      const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": elevenLabsKey,
        },
        body: JSON.stringify({
          text: replyText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.35,
            similarity_boost: 0.75,
            style: 0.85,
            use_speaker_boost: true,
          },
        }),
      });

      if (ttsResponse.ok) {
        audioBuffer = await ttsResponse.arrayBuffer();
      }
    }

    // 3. Save the log to Supabase (keeps dashboard/memories interactive!)
    if (shouldPersist) {
      try {
        await supabase.from("voice_logs").insert({
          senior_id: seniorId,
          transcript: transcript,
          sentiment_label: sentimentLabel,
          sentiment_score: sentimentScore,
          audio_url: audioPath,
          timestamp: recordedAt.toISOString(),
        });
      } catch (err) {
        console.warn("Supabase voice log insert failed/skipped:", err);
      }
    }

    // 4. Return the audio to play on the frontend!
    if (audioBuffer) {
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "X-Transcript": encodeURIComponent(transcript),
          "X-Reply": encodeURIComponent(replyText),
          "X-Sentiment-Label": sentimentLabel,
          "X-Sentiment-Score": String(sentimentScore),
        },
      });
    } else {
      // Fallback if ElevenLabs is missing or failed
      return NextResponse.json({
        transcript,
        reply: replyText,
        sentimentLabel,
        sentimentScore,
        error: "Voice synthesis failed, check ElevenLabs key."
      });
    }

  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

async function ensureVoiceBucket(supabase: ReturnType<typeof createServerSupabaseClient>) {
  const { error } = await supabase.storage.getBucket(voiceBucket);
  if (!error) return;

  const { error: createError } = await supabase.storage.createBucket(voiceBucket, {
    public: false,
    fileSizeLimit: "25MB",
    allowedMimeTypes: ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/ogg"],
  });

  if (createError && createError.message !== "The resource already exists") {
    throw createError;
  }
}

function getVoiceId(language: string) {
  if (language === "cantonese" || language === "hokkien") {
    return process.env.ELEVENLABS_CANTONESE_VOICE_ID || CANTONESE_VOICE_ID;
  }

  if (language === "zh") {
    return process.env.ELEVENLABS_CHINESE_VOICE_ID || process.env.ELEVENLABS_CANTONESE_VOICE_ID || CANTONESE_VOICE_ID;
  }

  return process.env.ELEVENLABS_ENGLISH_VOICE_ID || DEFAULT_VOICE_ID;
}
