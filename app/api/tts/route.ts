import { NextResponse } from "next/server";

interface TtsRequest {
  text?: string;
  language?: string;
}

const CANTONESE_VOICE_ID = "cHDwXsKG0qHMNLIjOusN";
const DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "TTS failed";
}

export async function POST(request: Request) {
  try {
    const { text, language } = (await request.json()) as TtsRequest;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    
    if (!elevenLabsKey) {
      return NextResponse.json({ error: "Missing ElevenLabs Key" }, { status: 500 });
    }

    if (!text?.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const voiceId = getVoiceId(language);
    const voiceLanguage = getVoiceLanguage(language);
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.35,
          similarity_boost: 0.75,
          style: 0.85,
          use_speaker_boost: true,
        },
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      throw new Error(`ElevenLabs error: ${errorText}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "X-TTS-Language": voiceLanguage,
        "X-TTS-Voice-Id": voiceId,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getVoiceId(language: string | undefined) {
  if (language === "cantonese" || language === "hokkien") {
    return process.env.ELEVENLABS_CANTONESE_VOICE_ID || CANTONESE_VOICE_ID;
  }

  if (language === "zh") {
    return process.env.ELEVENLABS_CHINESE_VOICE_ID || process.env.ELEVENLABS_CANTONESE_VOICE_ID || CANTONESE_VOICE_ID;
  }

  return process.env.ELEVENLABS_ENGLISH_VOICE_ID || DEFAULT_VOICE_ID;
}

function getVoiceLanguage(language: string | undefined) {
  if (language === "zh" || language === "hokkien" || language === "cantonese") {
    return "zh";
  }

  return "en";
}
