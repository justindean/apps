import { NextResponse } from "next/server";

export async function GET() {
  const key =
    process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { ok: false, error: "No API key set (checked AI_GATEWAY_API_KEY and OPENAI_API_KEY)" },
      { status: 500 }
    );
  }

  const isGateway = !key.startsWith("sk-");
  const baseUrl = isGateway
    ? "https://api.vercel.ai/v1"
    : "https://api.openai.com/v1";
  const model = isGateway ? "openai/gpt-4o-mini" : "gpt-4o-mini";

  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 5,
        messages: [
          { role: "system", content: "Reply with exactly: OK" },
          { role: "user", content: "ping" },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json(
        { ok: false, error: `OpenAI ${resp.status}: ${errText.slice(0, 200)}` },
        { status: resp.status }
      );
    }

    const data = (await resp.json()) as {
      model?: string;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
      choices?: { message?: { content?: string } }[];
    };

    const usage = data.usage ?? {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };
    const reply = data.choices?.[0]?.message?.content ?? "(no reply)";

    return NextResponse.json({
      ok: true,
      model: data.model,
      reply,
      usage,
      keyPrefix: `${key.slice(0, 7)}...${key.slice(-4)}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ping failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
