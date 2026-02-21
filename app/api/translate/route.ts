import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  try {
    const { english, tone, context } = await req.json();

    if (!english || typeof english !== "string") {
      return NextResponse.json({ error: "Missing english text" }, { status: 400 });
    }

    const toneDesc =
      tone === "street"
        ? "casual/informal street Spanish (tuteo, slang OK)"
        : tone === "formal"
          ? "formal/polite Spanish (usted, respectful)"
          : "standard polite Spanish (neutral register)";

    const contextLine = context ? `Context: the user is in a "${context}" situation.` : "";

    const systemPrompt = `You are a Spanish translation assistant for travelers in Latin America.
Translate the user's English phrase into natural ${toneDesc}.
${contextLine}
Return JSON with exactly these fields:
{
  "spanish": "the translated phrase",
  "pronunciation": "rough phonetic guide for English speakers",
  "literal_back": "literal back-translation to English",
  "alt_spanish": "an alternative way to say the same thing (same tone)",
  "alt_pronunciation": "phonetic guide for the alternative"
}
Be concise. No explanations outside the JSON.`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 250,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: english },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("OpenAI translate error:", resp.status, errText.slice(0, 200));
      return NextResponse.json(
        { error: `OpenAI ${resp.status}: ${errText.slice(0, 200)}` },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Translation failed";
    console.error("translate error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
