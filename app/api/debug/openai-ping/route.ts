import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { text, usage } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: "ping",
      system: "Reply with exactly: OK",
      temperature: 0,
      maxOutputTokens: 5,
    });

    return NextResponse.json({
      ok: true,
      model: "gpt-4o-mini",
      reply: text,
      usage: {
        prompt_tokens: usage?.promptTokens ?? 0,
        completion_tokens: usage?.completionTokens ?? 0,
        total_tokens: usage?.totalTokens ?? 0,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ping failed";
    console.error("openai-ping error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
