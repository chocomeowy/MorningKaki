import { NextResponse } from "next/server";

interface TtsRequest {
  text?: string;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "TTS failed";
}

export async function POST(request: Request) {
  try {
    const { text } = (await request.json()) as TtsRequest;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    
    if (!elevenLabsKey) {
      return NextResponse.json({ error: "Missing ElevenLabs Key" }, { status: 500 });
    }

    if (!text?.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const voiceId = "pNInz6obpgDQGcFmaJgB"; // Adam voice
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
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
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
