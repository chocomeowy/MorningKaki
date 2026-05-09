import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_to_bypass_build_error",
});

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
    const confirmWrite = formData.get("confirmWrite") === "true";

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // 1. Transcribe audio using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "gpt-realtime-whisper",
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
          They just spoke to you. Write a short, empathetic, conversational response (1-2 sentences) in ${language === 'zh' ? 'Mandarin Chinese' : 'English'}.
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

    // 3. Synthesize Voice with ElevenLabs (Adam voice)
    let audioBuffer: ArrayBuffer | null = null;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    
    if (elevenLabsKey) {
      const voiceId = "pNInz6obpgDQGcFmaJgB"; // Adam voice
      const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": elevenLabsKey,
        },
        body: JSON.stringify({
          text: replyText,
          model_id: "eleven_multilingual_v2",
        }),
      });

      if (ttsResponse.ok) {
        audioBuffer = await ttsResponse.arrayBuffer();
      }
    }

    // 4. Save the log to Supabase
    if (seniorId) {
      await supabase.from("voice_logs").insert({
        senior_id: seniorId,
        transcript: transcript,
        sentiment_label: sentimentLabel,
        sentiment_score: sentimentScore,
        timestamp: new Date().toISOString(),
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
