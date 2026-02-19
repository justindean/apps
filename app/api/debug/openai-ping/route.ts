import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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
      return NextResponse.json({ ok: false, error: errText.slice(0, 200) }, { status: resp.status });
    }

    const data = await resp.json();
    return NextResponse.json({
      ok: true,
      model: "gpt-4o-mini",
      reply: data.choices?.[0]?.message?.content,
      usage: data.usage,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ping failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
