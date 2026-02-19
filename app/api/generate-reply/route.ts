import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const key =
    process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

  const isGateway = !key.startsWith("sk-");
  const baseUrl = isGateway
    ? "https://api.vercel.ai/v1"
    : "https://api.openai.com/v1";
  const model = isGateway ? "openai/gpt-4o-mini" : "gpt-4o-mini";

  try {
    const { systemPrompt, userPrompt } = await req.json();

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.15,
        max_tokens: 200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json(
        { error: `LLM: ${errText.slice(0, 200)}` },
        { status: resp.status }
      );
    }

    const data = (await resp.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response from model" }, { status: 500 });
    }

    return new NextResponse(content, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Reply generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
