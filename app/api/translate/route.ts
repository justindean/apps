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

    const toneLabel =
      tone === "street" ? "casual / street" :
      tone === "formal" ? "formal / polite" :
      "neutral / standard";

    const contextLine = context ? `Context: the user is in a "${context}" situation.` : "";

    const systemPrompt = `You are a Spanish translation assistant for travelers in Latin America.
Translate the user's English phrase into natural spoken Spanish.
Tone: ${toneLabel}.
${contextLine}

Return JSON:
{
  "spanish": "...",
  "pronunciation": "phonetic guide for English speaker",
  "note": "optional 5-word cultural note or empty string"
}`;

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
