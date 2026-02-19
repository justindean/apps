import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY environment variable" },
      { status: 500 }
    );
  }

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

    const whisperResp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: outForm,
    });

    if (!whisperResp.ok) {
      const errText = await whisperResp.text();
      console.error("Whisper error:", whisperResp.status, errText.slice(0, 200));
      return NextResponse.json(
        { error: `Whisper ${whisperResp.status}: ${errText.slice(0, 200)}` },
        { status: whisperResp.status }
      );
    }

    const data = await whisperResp.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Transcription failed";
    console.error("Transcribe error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
