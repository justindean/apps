const key = process.env.OPENAI_API_KEY;
console.log("OPENAI_API_KEY exists:", !!key);
console.log("Key prefix:", key ? key.slice(0, 10) + "..." : "N/A");

async function testClassify() {
  const transcript = "quieres comida";
  const systemPrompt = `You are a restaurant Spanish classifier. Given a transcript, return JSON with:
- intent: what they're asking about
- english: English translation
- confidence: 0-100
- best_reply: a short Spanish reply
- alternates: 2 alternate replies
- evidence: words from transcript that support your classification

Return VALID JSON only.`;

  console.log("\n--- Test 1: Simple OpenAI ping ---");
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 10,
        messages: [
          { role: "system", content: "Reply with exactly: OK" },
          { role: "user", content: "ping" },
        ],
      }),
    });
    console.log("Status:", resp.status);
    const data = await resp.json();
    if (resp.ok) {
      console.log("Response:", data.choices?.[0]?.message?.content);
      console.log("PING SUCCESS!");
    } else {
      console.log("Error:", JSON.stringify(data).slice(0, 300));
    }
  } catch (e) {
    console.log("Fetch error:", e.message);
  }

  console.log("\n--- Test 2: Classify 'quieres comida' ---");
  try {
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
          { role: "system", content: systemPrompt },
          { role: "user", content: `Transcript: "${transcript}"` },
        ],
      }),
    });
    console.log("Status:", resp.status);
    const data = await resp.json();
    if (resp.ok) {
      const content = data.choices?.[0]?.message?.content;
      console.log("LLM Response:", content);
      console.log("CLASSIFY SUCCESS!");
    } else {
      console.log("Error:", JSON.stringify(data).slice(0, 300));
    }
  } catch (e) {
    console.log("Fetch error:", e.message);
  }
}

testClassify();
