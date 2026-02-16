import type { VercelRequest, VercelResponse } from "@vercel/node";

const SYSTEM_PROMPT = `You are TapHabla Listen Mode for Restaurants in Mexico.
Your job is to help an English speaker respond immediately.
Given a Spanish transcript (may be imperfect), you MUST:
1. Provide a clear English meaning of what was said.
2. Choose the most likely intent from the allowed list.
3. Choose the best reply from the provided reply keys.
4. Provide 2 alternative reply keys.
If uncertain, choose intent OTHER with low confidence and return a clarifying question reply key.
Never return "no match." Always pick something.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  try {
    const { transcript, replyKeys } = req.body as {
      transcript: string;
      replyKeys: Record<string, string>;
    };

    if (!transcript) {
      return res.status(400).json({ error: "Missing transcript" });
    }

    const replyKeysJson = JSON.stringify(replyKeys, null, 2);

    const userPrompt = `Context: Restaurant in Mexico.
Transcript (Spanish, imperfect): "${transcript}"

Allowed intents:
OFFER_MENU, READY_TO_ORDER, INSIDE_OUTSIDE, HOW_MANY, WAIT_TIME, DRINK_ORDER, DRINK_REFILL, FOOD_ORDER, SPICY_LEVEL, ANYTHING_ELSE, FOOD_SUGGEST, HOW_IS_EVERYTHING, CHECK_PLEASE, PAYMENT_CARD_CASH, TOGETHER_SEPARATE, TIP_OR_SERVICE, RECEIPT, CHANGE, OTHER

Available replies (keys must be used exactly):
${replyKeysJson}

Return JSON only:
{
  "heard_es": "...",
  "meaning_en": "...",
  "intent": "...",
  "confidence": 0.0,
  "best_reply_key": "...",
  "alt_reply_keys": ["...", "..."],
  "clarifying_reply_key": "..."
}

Rules:
- best_reply_key must always be one of the provided keys.
- If intent is OTHER or confidence < 0.55, set clarifying_reply_key to a valid key (e.g. CLARIFY_REPEAT).
- meaning_en should be natural, not word-for-word.`;

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
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: `OpenAI error: ${errText.slice(0, 200)}` });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: "No response from model" });
    }

    const parsed = JSON.parse(content);
    return res.status(200).json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Classification failed";
    return res.status(500).json({ error: msg });
  }
}
