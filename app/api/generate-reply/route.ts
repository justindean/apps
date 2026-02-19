import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { systemPrompt, userPrompt } = await req.json();

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.15,
      maxOutputTokens: 200,
      providerOptions: {
        openai: { responseFormat: { type: "json_object" } },
      },
    });

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Reply generation failed";
    console.error("generate-reply error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
