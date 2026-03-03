import fs from "fs";
import path from "path";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID_MILA = process.env.ELEVENLABS_VOICE_ID_MILA || "EXAVITQu4vr4xnSDxMaL";
const VOICE_ID_DANIEL = process.env.ELEVENLABS_VOICE_ID_DANIEL || "onwK4e9ZLuTAKqWW03F9";

const SPANISH_TEXT = "Buenas tardes, ¿qué van a pedir? Hoy tenemos un especial de pasta con camarones o pollo asado. ¿Les puedo traer algo de beber?";
const RESPONSE_SPANISH = "Quiero una cerveza y la pasta con camarones.";

async function generateAudio(text, voiceId, outputPath) {
  console.log(`Generating: ${outputPath}`);
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": ELEVENLABS_API_KEY,
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
    throw new Error(`ElevenLabs API error: ${response.status} ${await response.text()}`);
  }

  const buffer = await response.arrayBuffer();
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`Saved: ${outputPath} (${buffer.byteLength} bytes)`);
}

async function main() {
  if (!ELEVENLABS_API_KEY) {
    console.error("Error: ELEVENLABS_API_KEY not set");
    process.exit(1);
  }

  const publicDir = path.join(process.cwd(), "public", "demo");
  
  await generateAudio(SPANISH_TEXT, VOICE_ID_MILA, path.join(publicDir, "waiter-es.mp3"));
  await generateAudio(RESPONSE_SPANISH, VOICE_ID_DANIEL, path.join(publicDir, "response-es.mp3"));
  
  console.log("Done! Audio files generated in public/demo/");
}

main().catch(console.error);
