/**
 * Restaurant intent data for Listen mode — v5 (LLM-primary)
 *
 * Architecture: The LLM is the sole classifier. This file provides:
 * - Types (ListenMatch, ListenReply, LLMListenResponse)
 * - Reply sets for fixed intents (used by validateAndBuildFromLLM)
 * - Section mapping for UI colors
 * - The LLM system prompt
 * - validateAndBuildFromLLM to build a ListenMatch from LLM JSON
 */

// ── Core types ──────────────────────────────────────────────────────────

export interface ListenReply {
  spanish: string;
  english: string;
  pronunciation: string;
  isAIGenerated?: boolean;
}

export type ListenMatchSource = "deterministic" | "ai" | "none";
export type RouterPath = "deterministic" | "ai" | "fallback-unknown";

export interface ListenMatch {
  intent: string;
  english: string;
  confidence: number;     // 0–100
  source: ListenMatchSource;
  routerPath: RouterPath;
  evidence: string[];     // exact substrings/keywords found in transcript
  keywords: string[];     // deprecated alias for evidence (backward compat)
  bestReply: ListenReply;
  alternates: ListenReply[];
  section: string;
  debug?: {
    matchedRule?: string;
    rejectedReason?: string;
    constraintsPassed?: boolean;
    rawTranscript?: string;
    normalizedTranscript?: string;
  };
}



// ── Section mapping for UI colors ───────────────────────────────────────

const INTENT_TO_SECTION: Record<string, string> = {
  menu_offer: "Menu",
  table_preference: "Arrival",
  party_size: "Arrival",
  greeting: "Arrival",
  order_ready: "Food",
  order_items: "Food",
  doneness_preference: "Food",
  soups_available: "Food",
  drinks_offer: "Drinks",
  drinks_hot_offer: "Drinks",
  anything_else: "Food",
  check_in_food: "Food",
  bill_offer: "Bill",
  payment_method: "Bill",
  tip_service: "Tip",
  receipt: "Tip",
  not_available: "Food",
  clarification: "Clarify",
  ai_understood: "AI",
  unknown: "Clarify",
  smalltalk_origin: "Smalltalk",
  smalltalk_live_here: "Smalltalk",
  smalltalk_first_time: "Smalltalk",
  smalltalk_enjoying: "Smalltalk",
};

// ── Utilities ───────────────────────────────────────────────────────────

export function normalizeTranscript(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,!?;:\u00BF\u00A1'"()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wordMatch(token: string, normed: string): boolean {
  const pattern = new RegExp(`(?:^|\\s|\\b)${escapeRegex(token)}(?:\\s|\\b|$)`, "i");
  return pattern.test(normed);
}

function buildUnknown(debug?: ListenMatch["debug"]): ListenMatch {
  const fallbackReply: ListenReply = { spanish: "Puede repetir, por favor?", english: "Can you repeat, please?", pronunciation: "PWEH-deh reh-peh-TEER, por fah-VOR", isAIGenerated: false };
  return {
    intent: "unknown",
    english: "Not sure what they said.",
    confidence: 0,
    source: "none",
    routerPath: "fallback-unknown",
    evidence: [],
    keywords: [],
    bestReply: fallbackReply,
    alternates: [
      { spanish: "Mas despacio, por favor.", english: "Slower, please.", pronunciation: "mahs dehs-PAH-see-oh, por fah-VOR", isAIGenerated: false },
    ],
    section: "Clarify",
    debug: { ...debug, constraintsPassed: false },
  };
}

// ══════════════════════════════════════════════════════════════════════════
//  LLM prompt + response parsing
// ══════════════════════════════════════════════════════════════════════════

export const LLM_SYSTEM_PROMPT = [
  "You are a restaurant Spanish interpreter for American tourists in Mexico.",
  "",
  "A waiter just said something. The user's phone captured it via speech recognition (often imperfect/garbled).",
  "Your job: figure out what the waiter MEANT, and give the user the best reply options.",
  "",
  "CORE RULES:",
  "- Output VALID JSON only. No extra text.",
  '- Speech recognition garbles words. "que eres una menu" = "quieres un menu" (do you want a menu).',
  "  Always interpret what a waiter would REALISTICALLY say, not the literal garbled words.",
  "- The user is a BEGINNER in Spanish. Every reply MUST have an English translation.",
  "- Keep Spanish replies short, natural Mexican Spanish (under 10 words).",
  '- ONLY use "unknown" if the transcript is truly unintelligible or not restaurant-related.',
  "",
  "REPLY GENERATION:",
  "- Generate replies that DIRECTLY ANSWER the specific question asked.",
  '- Example: "que tipo de carne prefieres?" -> replies should be specific meat types:',
  '  "Pollo, por favor." (Chicken), "Res, por favor." (Beef), "Cerdo, por favor." (Pork)',
  '- Example: "que tipo de leche prefieres?" -> specific milk types:',
  '  "Entera, por favor." (Whole), "Descremada, por favor." (Skim), "De almendra." (Almond)',
  '- DO NOT give generic "Si, por favor" when the question asks for a CHOICE.',
  "- For yes/no questions, yes/no replies are fine.",
  "- Always provide 1 best_reply + 2 alternates, each with English translations.",
  "",
  "INTENTS (choose exactly one):",
  "- menu_offer, table_preference, party_size, greeting, order_ready, order_items",
  "- doneness_preference, soups_available, drinks_offer, drinks_hot_offer",
  "- anything_else, check_in_food, bill_offer, payment_method, tip_service, receipt",
  "- not_available, clarification",
  "- smalltalk_origin, smalltalk_live_here, smalltalk_first_time, smalltalk_enjoying",
  "- ai_understood  (use when you understand but no fixed intent fits perfectly)",
  "- unknown  (ONLY if truly unintelligible)",
  "",
  "OUTPUT JSON:",
  "{",
  '  "intent": "<one intent>",',
  '  "english": "<short natural English meaning of what THEY said>",',
  '  "evidence": ["<token from transcript>"],',
  "  \"confidence\": 0-100,",
  '  "best_reply": "<contextual Spanish reply>",',
  '  "best_reply_english": "<English translation of best_reply>",',
  '  "alternates": [',
  '    {"spanish": "<reply>", "english": "<translation>"},',
  '    {"spanish": "<reply>", "english": "<translation>"}',
  "  ]",
  "}",
].join("\n");

// ── Parse LLM response ─────────────────────────────────────────────────

export interface LLMListenResponse {
  intent?: string;
  english?: string;
  evidence?: string[];
  keywords?: string[];
  confidence?: number;
  best_reply?: string;
  best_reply_english?: string;
  alternates?: (string | { spanish: string; english: string })[];
  error?: string;
}

/**
 * Build a ListenMatch from an LLM response.
 * ALL replies come from the LLM -- no static reply sets.
 */
export function validateAndBuildFromLLM(
  data: LLMListenResponse,
  normalizedTranscript: string,
): ListenMatch {
  const intent = data.intent ?? "unknown";
  const english = data.english ?? "Not sure what they said.";
  const rawConfidence = Math.max(0, Math.min(100, data.confidence ?? 15));
  const aiEvidence = data.evidence ?? data.keywords ?? [];

  // Sanity check: is intent in our allowed list?
  const section = INTENT_TO_SECTION[intent];
  if (!section) {
    return buildUnknown({ rejectedReason: "AI returned unknown intent: " + intent });
  }

  // Validate evidence tokens appear in transcript
  const validEvidence: string[] = [];
  for (const token of aiEvidence) {
    const normedToken = normalizeTranscript(token);
    if (wordMatch(normedToken, normalizedTranscript)) {
      validEvidence.push(token);
    }
  }

  // Build best reply from LLM
  const bestReply: ListenReply = {
    spanish: data.best_reply ?? "Si, por favor.",
    english: data.best_reply_english || english,
    pronunciation: "",
    isAIGenerated: true,
  };

  // Build alternates from LLM
  const alternates: ListenReply[] = (data.alternates ?? []).map((alt) => {
    const isObj = typeof alt === "object" && alt !== null;
    return {
      spanish: isObj ? (alt as { spanish: string }).spanish : (alt as string),
      english: isObj ? (alt as { english: string }).english : "",
      pronunciation: "",
      isAIGenerated: true,
    };
  }).filter((a) => a.spanish !== bestReply.spanish).slice(0, 2);

  return {
    intent,
    english,
    confidence: rawConfidence,
    source: "ai",
    routerPath: "ai" as RouterPath,
    evidence: validEvidence,
    keywords: validEvidence,
    bestReply,
    alternates,
    section,
    debug: { matchedRule: "llm-primary", constraintsPassed: true },
  };
}
