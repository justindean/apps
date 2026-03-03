import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const SPANISH_TEXT = "Buenas tardes, ¿qué van a tomar? Tenemos especial hoy, pasta con camarones o pollo asado. ¿Les traigo algo de beber?";
const RESPONSE_SPANISH = "Quiero una cerveza y la pasta con camarones, por favor.";

async function generateTTS(text: string, voiceId: string): Promise<ArrayBuffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

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

  if (!response.ok) return null;
  return response.arrayBuffer();
}

export async function GET() {
  try {
    const milaVoiceId = process.env.ELEVENLABS_VOICE_ID_MILA || "EXAVITQu4vr4xnSDxMaL";
    const danielVoiceId = process.env.ELEVENLABS_VOICE_ID_DANIEL || "onwK4e9ZLuTAKqWW03F9";

    // Generate both audio files
    const [waiterAudio, responseAudio] = await Promise.all([
      generateTTS(SPANISH_TEXT, milaVoiceId),
      generateTTS(RESPONSE_SPANISH, danielVoiceId),
    ]);

    if (!waiterAudio || !responseAudio) {
      return NextResponse.json({ error: "Failed to generate audio" }, { status: 500 });
    }

    // Ensure directory exists
    const publicDir = join(process.cwd(), "public", "demo");
    await mkdir(publicDir, { recursive: true });

    // Write files
    await writeFile(join(publicDir, "waiter-es.mp3"), Buffer.from(waiterAudio));
    await writeFile(join(publicDir, "response-es.mp3"), Buffer.from(responseAudio));

    return NextResponse.json({ 
      success: true, 
      message: "Audio files generated successfully",
      files: ["/demo/waiter-es.mp3", "/demo/response-es.mp3"]
    });
  } catch (error) {
    console.error("[generate-demo-audio] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
