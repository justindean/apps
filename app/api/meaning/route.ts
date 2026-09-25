import type { NextRequest } from "next/server";

/**
 * PR B — Fast-Meaning lane ("panic lane").
 *
 * Single-purpose endpoint: given the STABLE Spanish transcript the traveler just
 * heard, return a concise, natural English *understanding* as fast as possible.
 * This runs in PARALLEL with /api/classify — it does NOT generate replies, tones,
 * follow-ups, pronunciation, explanations, or any structured metadata. Optimize
 * strictly for time-to-first-trustworthy-English.
 *
 * Model: gpt-6-luna via the OpenAI Responses API, reasoning.effort "none",
 * streaming plain text (no JSON framing). Verified available to this key.
 *
 * If the model is unavailable, we surface the real upstream status/body rather
 * than substituting another model.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "gpt-6-luna";

export async function POST(req: NextRequest) {
  let spanish = "";
  let context = "";
  try {
    const body = await req.json();
    spanish = typeof body?.spanish === "string" ? body.spanish.trim() : "";
    context = typeof body?.context === "string" ? body.context.trim() : "";
  } catch {
    return new Response("Bad request body", { status: 400 });
  }

  if (!spanish) {
    return new Response("Missing 'spanish'", { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("Missing OPENAI_API_KEY", { status: 500 });
  }

  const settingLine = context && context !== "general" ? ` Setting: ${context}.` : "";
  const instructions =
    `You are a real-time interpreter for an English-speaking traveler in Mexico who does not speak Spanish.` +
    settingLine +
    ` Translate the Spanish utterance they just heard into ONE concise, natural English sentence that captures the speaker's actual meaning, not a word-for-word gloss.` +
    ` Output only the English translation — no quotes, no notes, no alternatives, no pronunciation, no explanation.`;

  let upstream: Response;
  try {
    upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        instructions,
        input: spanish,
        reasoning: { effort: "none" },
        max_output_tokens: 80,
        stream: true,
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "upstream fetch failed";
    return new Response(`Meaning upstream unreachable: ${msg}`, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    // Surface the REAL model/availability error — never silently substitute.
    return new Response(
      `Meaning upstream error ${upstream.status} (model ${MODEL}): ${detail.slice(0, 500)}`,
      { status: 502 },
    );
  }

  // Proxy the Responses API SSE stream, forwarding ONLY output_text deltas as
  // plain UTF-8 text so the client parse is trivial (read chunks, append).
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by a blank line.
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const evt of events) {
            for (const line of evt.split("\n")) {
              const trimmed = line.trimStart();
              if (!trimmed.startsWith("data:")) continue;
              const data = trimmed.slice(5).trim();
              if (!data || data === "[DONE]") continue;
              try {
                const json = JSON.parse(data);
                if (
                  typeof json?.type === "string" &&
                  json.type.endsWith("output_text.delta") &&
                  typeof json.delta === "string"
                ) {
                  controller.enqueue(encoder.encode(json.delta));
                }
              } catch {
                // Keepalive / non-JSON line — ignore.
              }
            }
          }
        }
      } catch (err) {
        controller.error(err);
        return;
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
