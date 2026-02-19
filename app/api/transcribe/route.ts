import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // The Vercel AI Gateway sets AI_GATEWAY_API_KEY automatically
  const key = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) {
    console.error("[v0] No API key found. AI_GATEWAY_API_KEY:", !!process.env.AI_GATEWAY_API_KEY, "OPENAI_API_KEY:", !!process.env.OPENAI_API_KEY);
    return NextResponse.json(
      { error: "Missing API key for Whisper transcription" },
      { status: 500 }
    );
  }

  // Determine if we're using the Vercel AI Gateway or direct OpenAI
  const isGateway = !key.startsWith("sk-");
  const baseUrl = isGateway
    ? "https://api.vercel.ai/v1"
    : "https://api.openai.com/v1";

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) || "es";
    const prompt = (formData.get("prompt") as string) || "";

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const outForm = new FormData();
    outForm.append("file", audioFile, audioFile.name || "audio.webm");
    outForm.append("model", "whisper-1");
    outForm.append("language", language);
    if (prompt) {
      outForm.append("prompt", prompt);
    }

    const whisperResp = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
      },
      body: outForm,
    });

    if (!whisperResp.ok) {
      const errText = await whisperResp.text();
      console.error("[v0] Whisper error:", whisperResp.status, errText.slice(0, 200));
      return NextResponse.json(
        { error: `Whisper ${whisperResp.status}: ${errText.slice(0, 200)}` },
        { status: whisperResp.status }
      );
    }

    const data = await whisperResp.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Transcription failed";
    console.error("[v0] Transcribe error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
