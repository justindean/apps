import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  try {
    const body = await req.json();

    // SAY flow: english + context + tones[] -> 3 tone variants
    if (body.english && body.tones) {
      const { english, context, tones } = body;
      const systemPrompt = `You are a Spanish translation assistant for travelers in Mexico.
The user will tell you what they want to say in English.
You translate it into Mexican Spanish in 3 tones: street (casual/local), neutral (standard polite), formal (respectful/business).
Context: ${context || "general conversation"}.

Return JSON:
{
  "variants": [
    { "tone": "street", "spanish": "...", "english": "...", "pronunciation": "..." },
    { "tone": "neutral", "spanish": "...", "english": "...", "pronunciation": "..." },
    { "tone": "formal", "spanish": "...", "english": "...", "pronunciation": "..." }
  ]
}

Rules:
- spanish: Natural Mexican Spanish. Not textbook.
- english: Brief explanation of what the Spanish literally conveys.
- pronunciation: Phonetic guide for English speakers (optional, include for tricky words).
- Keep it concise and practical. Traveler-friendly.
- If the input is too vague, still give your best guess.`;

      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.3,
          max_tokens: 400,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: english },
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
    }

    // Legacy: systemPrompt + userPrompt flow
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
