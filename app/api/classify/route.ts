import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { transcript, tone, systemPromptOverride } = await req.json();

    const systemPrompt = systemPromptOverride as string;
    const userPrompt = `Transcript: "${transcript}"\nTone: ${tone || "neutral"}`;

    console.log("[v0] classify API called with transcript:", transcript);
    console.log("[v0] classify systemPrompt length:", systemPrompt?.length);

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.2,
      maxOutputTokens: 300,
      providerOptions: {
        openai: { responseFormat: { type: "json_object" } },
      },
    });

    console.log("[v0] classify AI SDK response text:", text.slice(0, 500));

    const parsed = JSON.parse(text);
    console.log("[v0] classify parsed response:", JSON.stringify(parsed).slice(0, 500));
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Classification failed";
    console.error("[v0] classify error:", msg, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
