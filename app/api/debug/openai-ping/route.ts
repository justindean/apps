import { generateText } from "ai";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { text, usage, finishReason } = await generateText({
      model: "openai/gpt-4o-mini",
      temperature: 0,
      maxOutputTokens: 5,
      system: "Reply with exactly: OK",
      prompt: "ping",
    });

    return NextResponse.json({
      ok: true,
      model: "openai/gpt-4o-mini",
      reply: text,
      usage: {
        prompt_tokens: usage?.promptTokens ?? 0,
        completion_tokens: usage?.completionTokens ?? 0,
        total_tokens: usage?.totalTokens ?? 0,
      },
      finishReason,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ping failed";
    console.error("[v0] openai-ping error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
