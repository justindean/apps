import { NextRequest, NextResponse } from "next/server";

const SPANISH_TEXT = "Buenas tardes, ¿qué van a tomar? Tenemos especial hoy, pasta con camarones o pollo asado. ¿Les traigo algo de beber?";
const RESPONSE_SPANISH = "Quiero una cerveza y la pasta con camarones, por favor.";

async function generateTTS(text: string, voiceId: string): Promise<ArrayBuffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("[generate-demo-audio] No ELEVENLABS_API_KEY");
    return null;
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
      },
    }),
  });

  if (!response.ok) {
    console.error("[generate-demo-audio] ElevenLabs error:", response.status, await response.text());
    return null;
  }
  return response.arrayBuffer();
}

// GET /api/generate-demo-audio?file=waiter or ?file=response
// Returns the audio file directly for download
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file") || "waiter";
    
    const milaVoiceId = process.env.ELEVENLABS_VOICE_ID_MILA || "EXAVITQu4vr4xnSDxMaL";
    const danielVoiceId = process.env.ELEVENLABS_VOICE_ID_DANIEL || "onwK4e9ZLuTAKqWW03F9";

    let audio: ArrayBuffer | null;
    let filename: string;
    
    if (file === "response") {
      audio = await generateTTS(RESPONSE_SPANISH, danielVoiceId);
      filename = "response-es.mp3";
    } else {
      audio = await generateTTS(SPANISH_TEXT, milaVoiceId);
      filename = "waiter-es.mp3";
    }

    if (!audio) {
      return NextResponse.json({ error: "Failed to generate audio" }, { status: 500 });
    }

    // Return the audio file directly for download
    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[generate-demo-audio] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
