import { NextRequest, NextResponse } from "next/server";

const VOICE_IDS = {
  daniel: process.env.ELEVENLABS_VOICE_ID_DANIEL || "onwK4e9ZLuTAKqWW03F9", // Default Daniel voice
  mila: process.env.ELEVENLABS_VOICE_ID_MILA || "EXAVITQu4vr4xnSDxMaL", // Default Mila voice (Bella as fallback)
} as const;

const MODEL_ID = "eleven_multilingual_v2";

// In-memory cache for TTS audio (in production, use KV or Redis)
const audioCache = new Map<string, ArrayBuffer>();

// Generate cache key from voice + model + text
async function getCacheKey(voiceId: string, text: string): Promise<string> {
  const data = `${voiceId}|${MODEL_ID}|${text}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

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

    // Check cache first
    const cacheKey = await getCacheKey(voiceId, text);
    const cachedAudio = audioCache.get(cacheKey);
    
    if (cachedAudio) {
      console.log("[TTS] Cache hit:", cacheKey.slice(0, 8));
      return new NextResponse(cachedAudio, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": cachedAudio.byteLength.toString(),
          "X-Cache": "HIT",
        },
      });
    }

    console.log("[TTS] Cache miss, fetching from ElevenLabs:", cacheKey.slice(0, 8));

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
        // Low latency settings
        optimize_streaming_latency: 3, // 0-4, higher = lower latency but lower quality
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TTS] ElevenLabs error:", response.status, errorText);
      return NextResponse.json({ error: "TTS generation failed" }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    
    // Store in cache (limit cache size to prevent memory issues)
    if (audioCache.size < 100) {
      audioCache.set(cacheKey, audioBuffer);
    }

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("[TTS] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
