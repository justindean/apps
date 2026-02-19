import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { systemPrompt, userPrompt } = await req.json();

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      temperature: 0.15,
      maxOutputTokens: 200,
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
    const msg = err instanceof Error ? err.message : "Reply generation failed";
    console.error("[v0] generate-reply error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
