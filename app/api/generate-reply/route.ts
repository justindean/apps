import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  try {
    const body = await req.json();

    // ── SAY mode: English -> 3 Spanish tone variants ──
    if (body.mode === "say") {
      const { english, context } = body;
      if (!english || typeof english !== "string") {
        return NextResponse.json({ error: "Missing 'english' field" }, { status: 400 });
      }

      const contextHint = context && context !== "auto"
        ? `The user is in a ${context} situation (e.g. restaurant, taxi, hotel, emergency). Tailor phrasing accordingly.`
        : "No specific situation context -- produce general-purpose translations.";

      const systemPrompt = `You are a Spanish translation assistant for English-speaking travelers in Latin America.
Given an English phrase, produce exactly 3 Spanish translations in different tones.

${contextHint}

Return JSON with this exact shape:
{
  "variants": [
    { "tone": "local", "spanish": "...", "english": "...", "pronunciation": "..." },
    { "tone": "standard", "spanish": "...", "english": "...", "pronunciation": "..." },
    { "tone": "polite", "spanish": "...", "english": "...", "pronunciation": "..." }
  ]
}

Rules:
- "local" = casual street-level Latin American Spanish (tú form, slang OK)
- "standard" = clear polite Spanish (usted or tú depending on context)
- "polite" = formal respectful Spanish (usted, full sentences)
- "english" = back-translation showing what the Spanish actually says
- "pronunciation" = phonetic guide for English speakers (approximate)
- Keep translations natural and actually useful, not textbook-stiff
- Return ONLY the JSON object, nothing else`;

      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.3,
          max_tokens: 500,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Translate to Spanish: "${english}"` },
          ],
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error("OpenAI SAY error:", resp.status, errText.slice(0, 200));
        return NextResponse.json(
          { error: `OpenAI ${resp.status}: ${errText.slice(0, 200)}` },
          { status: resp.status }
        );
      }

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    }

    // ── Original LISTEN mode: systemPrompt + userPrompt passthrough ──
    const { systemPrompt, userPrompt } = body;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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
      console.error("OpenAI generate-reply error:", resp.status, errText.slice(0, 200));
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
    const msg = err instanceof Error ? err.message : "Reply generation failed";
    console.error("generate-reply error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
