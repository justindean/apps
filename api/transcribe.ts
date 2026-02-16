/**
 * Vercel Edge Function — transcribe audio via OpenAI Whisper
 * Used by iOS Safari "Capture Mode" where SpeechRecognition is unreliable.
 *
 * Accepts: POST with multipart/form-data containing an "audio" file field
 * Returns: { transcript: string }
 */

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST required" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    if (!audioFile || !(audioFile instanceof Blob)) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Forward to OpenAI Whisper
    const whisperForm = new FormData();
    whisperForm.append("file", audioFile, "audio.webm");
    whisperForm.append("model", "whisper-1");
    whisperForm.append("language", "es");
    whisperForm.append("prompt", "Transcripcion de conversacion en un restaurante mexicano. Palabras comunes: menu, cerveza, cuenta, propina, adentro, afuera, mesa, agua, picante, tarjeta, efectivo, recibo.");

    const whisperResp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    });

    if (!whisperResp.ok) {
      const errText = await whisperResp.text();
      return new Response(JSON.stringify({ error: `Whisper error: ${whisperResp.status}`, detail: errText }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await whisperResp.json();
    return new Response(JSON.stringify({ transcript: result.text ?? "" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
