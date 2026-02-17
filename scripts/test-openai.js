const key = process.env.OPENAI_API_KEY;
console.log("OPENAI_API_KEY present:", !!key);
if (!key) {
  console.log("No API key found. Checking all env vars with OPENAI:");
  for (const [k, v] of Object.entries(process.env)) {
    if (k.toLowerCase().includes("openai") || k.toLowerCase().includes("api_key")) {
      console.log(`  ${k} = ${v ? v.slice(0, 8) + "..." : "(empty)"}`);
    }
  }
  process.exit(1);
}

console.log(`Key starts with: ${key.slice(0, 7)}`);

const resp = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 300,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You classify Spanish restaurant phrases. Return JSON: { "intent": "ai_understood", "english": "...", "confidence": 85, "best_reply": "...", "alternates": ["...", "..."], "evidence": ["..."] }`
      },
      { role: "user", content: `Transcript: "quieres comida"\nTone: Neutral` },
    ],
  }),
});

console.log("OpenAI status:", resp.status);
if (!resp.ok) {
  const txt = await resp.text();
  console.log("OpenAI error:", txt.slice(0, 300));
  process.exit(1);
}

const data = await resp.json();
const content = data.choices?.[0]?.message?.content;
console.log("OpenAI response content:", content);
