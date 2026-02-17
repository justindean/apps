// Test which API keys are available in the environment
const keys = [
  'AI_GATEWAY_API_KEY',
  'OPENAI_API_KEY',
  'VERCEL_AI_GATEWAY_API_KEY',
];

console.log("=== Environment Variable Check ===");
for (const key of keys) {
  const val = process.env[key];
  if (val) {
    console.log(`${key}: SET (starts with "${val.slice(0, 10)}...", length=${val.length})`);
  } else {
    console.log(`${key}: NOT SET`);
  }
}

// Try a direct AI Gateway call
const gatewayKey = process.env.AI_GATEWAY_API_KEY;
if (gatewayKey) {
  console.log("\n=== Testing AI Gateway ===");
  fetch("https://api.vercel.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gatewayKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      temperature: 0,
      max_tokens: 10,
      messages: [
        { role: "system", content: "Reply with exactly: OK" },
        { role: "user", content: "ping" },
      ],
    }),
  })
    .then(async (r) => {
      const text = await r.text();
      console.log(`AI Gateway status: ${r.status}`);
      console.log(`AI Gateway response: ${text.slice(0, 300)}`);
    })
    .catch((e) => console.log("AI Gateway fetch error:", e.message));
} else {
  console.log("\nAI_GATEWAY_API_KEY not available, skipping gateway test");
  
  // Try direct OpenAI as fallback test
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    console.log("\n=== Testing OpenAI Direct (expected to fail with quota error) ===");
    console.log("Key starts with:", openaiKey.slice(0, 7));
  }
}
