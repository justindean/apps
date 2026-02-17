import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Vercel serverless function: /api/classify
 * Proxies to OpenAI for LLM intent classification.
 * Accepts { transcript, systemPromptOverride } and returns LLMListenResponse JSON.
 *
 * The systemPromptOverride is sent from the client (ListenPanel) and contains
 * the full LLM_SYSTEM_PROMPT from restaurantIntents.ts — this is the single
 * source of truth for the prompt, so this endpoint doesn't need its own copy.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("[classify] ERROR: No OPENAI_API_KEY");
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  try {
    const { transcript, systemPromptOverride } = req.body as {
      transcript: string;
      systemPromptOverride: string;
    };

    if (!transcript) {
      return res.status(400).json({ error: "Missing transcript" });
    }

    console.log(`[classify] Received transcript: "${transcript}"`);

    const systemPrompt = systemPromptOverride;
    const userPrompt = `Transcript: "${transcript}"\nTone: Neutral`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.log(`[classify] OpenAI ERROR: ${resp.status} ${errText.slice(0, 200)}`);
      return res.status(resp.status).json({ error: `OpenAI: ${errText.slice(0, 200)}` });
    }

    const data = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;

    console.log(`[classify] OpenAI response: ${content?.slice(0, 300)}`);

    if (!content) {
      return res.status(500).json({ error: "No response from model" });
    }

    // Return the raw JSON from OpenAI — it should match LLMListenResponse format
    const parsed = JSON.parse(content);
    return res.status(200).json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Classification failed";
    console.log(`[classify] CATCH error: ${msg}`);
    return res.status(500).json({ error: msg });
  }
}
