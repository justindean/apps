/**
 * Exact-match session cache for /api/classify responses.
 * Sits at the network boundary only. No similarity matching.
 */

const MAX = 50;

interface CacheEntry {
  key: string;
  json: Record<string, unknown>;
  ts: number;
}

const entries: CacheEntry[] = [];

function makeKey(scenario: string, tone: string, transcript: string): string {
  var norm = transcript.toLowerCase().trim().replace(/\s+/g, " ");
  return scenario + "|" + tone + "|" + norm;
}

/**
 * Wraps a fetch call to /api/classify with an exact-match cache.
 * Returns the JSON body with an extra `cached: boolean` field.
 * Does NOT change the shape of the response otherwise.
 */
export async function cachedClassify(
  scenario: string,
  tone: string,
  transcript: string,
  fetchBody: Record<string, unknown>,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; status: number; text: string }> {
  if (!transcript.trim()) {
    return { ok: false, status: 0, text: "empty transcript" };
  }

  var key = makeKey(scenario, tone, transcript);

  // Exact lookup
  var hit = entries.find(function (e) { return e.key === key; });
  if (hit) {
    console.log("[v0] CACHE HIT", key);
    return { ok: true, data: Object.assign({}, hit.json, { cached: true }) };
  }

  console.log("[v0] CACHE MISS", key);

  // Network call
  var resp = await fetch("/api/classify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fetchBody),
  });

  if (!resp.ok) {
    var errText = await resp.text();
    return { ok: false, status: resp.status, text: errText };
  }

  var data = await resp.json();

  // Store in cache
  var idx = entries.findIndex(function (e) { return e.key === key; });
  if (idx >= 0) entries.splice(idx, 1);
  entries.push({ key: key, json: data, ts: Date.now() });
  while (entries.length > MAX) entries.shift();

  return { ok: true, data: Object.assign({}, data, { cached: false }) };
}
