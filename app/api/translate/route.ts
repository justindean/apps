import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  try {
    const { english, tone, context } = await req.json();

    if (!english || typeof english !== "string") {
      return NextResponse.json({ error: "Missing 'english' field" }, { status: 400 });
    }

    const toneDesc =
      tone === "street" ? "casual/local slang, tuteo"
        : tone === "formal" ? "formal/polite, usted"
          : "standard neutral polite";

    const contextHint = context ? `The user is in a "${context}" situation.` : "";

    const systemPrompt = `You translate English phrases into Mexican Spanish for a traveler.
Tone: ${toneDesc}. ${contextHint}
Return JSON: { "spanish": "...", "pronunciation": "...", "literal": "..." }
- "spanish": the natural translation
- "pronunciation": simplified phonetic guide for English speakers
- "literal": word-for-word literal back-translation to English
Keep it concise and natural. One sentence max.`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 150,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: english },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
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
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
