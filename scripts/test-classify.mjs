// Quick test: call /api/classify endpoint directly
const BASE_URL = "http://localhost:5173";
const transcript = "quieres comida";

async function test() {
  console.log(`Testing /api/classify with: "${transcript}"`);
  
  try {
    const resp = await fetch(`${BASE_URL}/api/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        systemPromptOverride: "You are a restaurant classifier. Return JSON: {intent, english, evidence, confidence, best_reply, alternates}. If you understand what the waiter said, use intent 'ai_understood' and generate a reply.",
      }),
    });
    
    console.log("Status:", resp.status);
    const text = await resp.text();
    console.log("Response body:", text);
    
    try {
      const json = JSON.parse(text);
      console.log("Parsed JSON:", JSON.stringify(json, null, 2));
    } catch {
      console.log("(not valid JSON)");
    }
  } catch (err) {
    console.log("Fetch error:", err.message);
  }
}

test();
