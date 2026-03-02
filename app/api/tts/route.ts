import { NextRequest, NextResponse } from "next/server";

const VOICE_IDS = {
  daniel: process.env.ELEVENLABS_VOICE_ID_DANIEL || "onwK4e9ZLuTAKqWW03F9", // Default Daniel voice
  mila: process.env.ELEVENLABS_VOICE_ID_MILA || "EXAVITQu4vr4xnSDxMaL", // Default Mila voice (Bella as fallback)
} as const;

export async function POST(request: NextRequest) {
  try {
    const { text, voice } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const voiceKey = voice === "daniel" ? "daniel" : "mila";
    const voiceId = VOICE_IDS[voiceKey];

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TTS] ElevenLabs error:", response.status, errorText);
      return NextResponse.json({ error: "TTS generation failed" }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("[TTS] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
