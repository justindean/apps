import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { transcript, tone, systemPromptOverride } = await req.json();

    const systemPrompt = systemPromptOverride as string;
    const userPrompt = `Transcript: "${transcript}"\nTone: ${tone || "neutral"}`;

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      temperature: 0.2,
      maxOutputTokens: 300,
      providerOptions: {
        openai: { responseFormat: { type: "json_object" } },
      },
      system: systemPrompt,
      prompt: userPrompt,
    });

    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Classification failed";
    console.error("[v0] classify error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
