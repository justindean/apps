import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { english, tone = "neutral", context } = await req.json();

    if (!english || typeof english !== "string" || english.trim().length === 0) {
      return NextResponse.json({ error: "Missing english text" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const toneGuide: Record<string, string> = {
      casual: "Use casual, street-level Mexican Spanish. Informal tu form. Short and natural.",
      neutral: "Use standard polite Mexican Spanish. Usted form where appropriate.",
      formal: "Use formal, respectful Mexican Spanish. Always usted. Business-appropriate.",
    };

    const systemPrompt = `You are a Spanish translation assistant for travelers in Mexico.
Translate the user's English into natural Mexican Spanish.
${toneGuide[tone] || toneGuide.neutral}
${context ? `Context: the user is in a ${context} situation.` : ""}

Respond in JSON:
{
  "spanish": "the translation",
  "pronunciation": "phonetic guide for English speakers",
  "english": "the original English (cleaned up)"
}

Only respond with valid JSON. No markdown. No explanation.`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 200,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: english.trim() },
        ],
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      return NextResponse.json({ error: `OpenAI error: ${resp.status}`, details: errBody }, { status: 502 });
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";

    const cleaned = raw.replace(/```json\s*/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      spanish: parsed.spanish || "",
      pronunciation: parsed.pronunciation || "",
      english: parsed.english || english.trim(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
