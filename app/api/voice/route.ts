import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_to_bypass_build_error",
});

const voiceBucket = "voice-memories";
const CANTONESE_VOICE_ID = "cHDwXsKG0qHMNLIjOusN";
const DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB";

interface VoiceAiOutput {
  reply?: string;
  sentiment_score?: number;
  sentiment_label?: string;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Voice processing failed";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const seniorId = formData.get("seniorId") as string;
    const nickname = formData.get("nickname") as string || "Ah Gong";
    const language = formData.get("language") as string || "en";
    const shouldPersist = Boolean(seniorId && seniorId !== "demo");

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const recordedAt = new Date();
    const audioPath = shouldPersist
      ? `${seniorId}/${recordedAt.toISOString().replace(/[:.]/g, "-")}.webm`
      : "";

    if (shouldPersist) {
      await ensureVoiceBucket(supabase);
      const { error: uploadError } = await supabase.storage
        .from(voiceBucket)
        .upload(audioPath, audioFile, {
          contentType: audioFile.type || "audio/webm",
          upsert: false,
        });

      if (uploadError) throw uploadError;
    }

    // 1. Transcribe audio using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    const transcript = transcription.text;

    if (!transcript.trim()) {
      return NextResponse.json({ error: "Could not hear any speech" }, { status: 400 });
    }

    // 2. Generate Reply and Sentiment using GPT-5-nano
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content: `You are a warm, caring companion for an elderly person named ${nickname} in Singapore.
          They just spoke to you. Write a short, empathetic, conversational response (1-2 sentences) in ${getReplyLanguage(language)}.
          Also, analyze their sentiment.
          
          You MUST respond in exact JSON format:
          {
            "reply": "Your warm response here",
            "sentiment_score": 85, 
            "sentiment_label": "positive|neutral|low|distressed"
          }`,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 180,
    });

    const aiOutput = JSON.parse(chatResponse.choices[0].message.content || "{}") as VoiceAiOutput;
    const replyText = aiOutput.reply || "I'm always here to listen.";
    const sentimentScore = aiOutput.sentiment_score || 50;
    const sentimentLabel = aiOutput.sentiment_label || "neutral";

    // 3. Synthesize Voice with ElevenLabs
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

    // 4. Save the log to Supabase
    if (shouldPersist) {
      await supabase.from("voice_logs").insert({
        senior_id: seniorId,
        transcript: transcript,
        sentiment_label: sentimentLabel,
        sentiment_score: sentimentScore,
        audio_url: audioPath,
        timestamp: recordedAt.toISOString(),
      });
    }

    // 5. Return the audio to play on the frontend!
    if (audioBuffer) {
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "X-Transcript": encodeURIComponent(transcript),
          "X-Reply": encodeURIComponent(replyText)
        },
      });
    } else {
      // Fallback if ElevenLabs is missing or failed
      return NextResponse.json({
        transcript,
        reply: replyText,
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

function getReplyLanguage(language: string) {
  if (language === "zh") return "Mandarin Chinese";
  if (language === "cantonese" || language === "hokkien") {
    return "Traditional Chinese with natural Cantonese phrasing";
  }

  return "English";
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
