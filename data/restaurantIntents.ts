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
  /** All 3 tones for this reply (if available from multi-tone LLM call) */
  tones?: {
    local?: { spanish: string; english: string };
    standard?: { spanish: string; english: string };
    polite?: { spanish: string; english: string };
  };
}

export type ListenMatchSource = "deterministic" | "ai" | "none";
export type RouterPath = "deterministic" | "ai" | "fallback-unknown";

export interface FollowUp {
  spanish: string;
  english: string;
}

export interface AlternateMeaning {
  english: string;
  intent: string;
}

export interface ListenMatch {
  intent: string;
  english: string;
  literalEnglish: string; // word-for-word translation of what was heard
  confidence: number;     // 0–100
  source: ListenMatchSource;
  routerPath: RouterPath;
  evidence: string[];     // exact substrings/keywords found in transcript
  keywords: string[];     // deprecated alias for evidence (backward compat)
  bestReply: ListenReply;
  alternates: ListenReply[];
  followUps: FollowUp[];           // conversation continuations after replying
  alternateMeanings: AlternateMeaning[]; // other possible interpretations (low confidence)
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
  // Food & Drink
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
  // Getting Around
  destination_request: "Transport",
  fare_question: "Transport",
  stop_request: "Transport",
  direction_question: "Transport",
  eta_question: "Transport",
  // Shopping
  price_inquiry: "Shopping",
  size_request: "Shopping",
  availability_check: "Shopping",
  fitting_room: "Shopping",
  bargaining: "Shopping",
  // Medical
  medication_request: "Medical",
  symptom_description: "Medical",
  dosage_question: "Medical",
  pharmacy_availability: "Medical",
  emergency: "Medical",
  // Personal Care
  haircut_request: "PersonalCare",
  styling_preference: "PersonalCare",
  beard_trim: "PersonalCare",
  nail_service: "PersonalCare",
  spa_service: "PersonalCare",
  // General
  clarification: "Clarify",
  ai_understood: "AI",
  unknown: "Clarify",
  general_request: "AI",
  translation_request: "AI",
  // Smalltalk
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
    literalEnglish: "",
    confidence: 0,
    source: "none",
    routerPath: "fallback-unknown",
    evidence: [],
    keywords: [],
    bestReply: fallbackReply,
    alternates: [
      { spanish: "Mas despacio, por favor.", english: "Slower, please.", pronunciation: "mahs dehs-PAH-see-oh, por fah-VOR", isAIGenerated: false },
    ],
    followUps: [],
    alternateMeanings: [],
    section: "Clarify",
    debug: { ...debug, constraintsPassed: false },
  };
}

// ══════════════════════════════════════════════════════════════════════════
//  LLM prompt + response parsing
// ══════════════════════════════════════════════════════════════════════════

// ── Base system prompt (shared across all tones) ────────────────────────

const LLM_BASE_PROMPT = [
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
  '- ONLY use "unknown" if the transcript is truly unintelligible or not restaurant-related.',
  "",
  "REPLY GENERATION:",
  "- Generate replies that DIRECTLY ANSWER the specific question asked.",
  '- DO NOT give generic "Si, por favor" when the question asks for a CHOICE.',
  "- For yes/no questions, yes/no replies are fine.",
  "- Always provide 1 best_reply + 2 alternates, each with English translations.",
  "",
  "FOLLOW-UPS:",
  "- Provide 2-3 follow_ups: practical phrases the user might want to say NEXT in the conversation.",
  "- Follow-ups must be GROUNDED in real Mexican restaurant culture.",
  "- Use SPECIFIC names that people actually say in Mexico, not generic categories:",
  '  - Beers: Modelo, Corona, Tecate, Victoria, Pacifico, Dos Equis, Bohemia, Negra Modelo (NOT "local beers" or "which do you recommend")',
  '  - Meats: res, pollo, cerdo, pastor, bistec, chorizo (NOT generic "what meats do you have")',
  '  - Salsas: roja, verde, habanero (NOT "which salsas")',
  '  - Sides: frijoles, arroz, guacamole, tortillas',
  '- Good follow-ups: "Tienes Modelo?", "Y una orden de guacamole tambien", "Es todo, gracias", "Que cervezas tienen?"',
  '- Bad follow-ups: "Do you have local options?", "Which do you recommend?", "What brands do you carry?"',
  "- Think like a tourist who just wants to order something specific, not browse.",
  "- Keep them short and tone-appropriate.",
  "",
  "ALTERNATE MEANINGS:",
  "- If confidence < 70, provide 1-2 alternate_meanings: other plausible interpretations of what was said.",
  "- Each has an english description and intent. Omit if confidence >= 70.",
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
  "IMPORTANT: Return ALL THREE TONES for best_reply AND each alternate.",
  "The 'local' tone = casual/street Mexican Spanish, 'standard' = neutral polite, 'polite' = formal usted.",
  "{",
  '  "intent": "<one intent>",',
  '  "literal_english": "<word-for-word English translation of the raw Spanish heard>",',
  '  "english": "<natural English interpretation of what they MEANT, correcting for garbled speech>",',
  '  "evidence": ["<token from transcript>"],',
  '  "confidence": 0-100,',
  '  "best_reply_tones": {',
  '    "local": {"spanish": "<casual reply>", "english": "<translation>"},',
  '    "standard": {"spanish": "<neutral reply>", "english": "<translation>"},',
  '    "polite": {"spanish": "<formal reply>", "english": "<translation>"}',
  "  },",
  '  "alternate_tones": [',
  '    {',
  '      "local": {"spanish": "<casual>", "english": "<translation>"},',
  '      "standard": {"spanish": "<neutral>", "english": "<translation>"},',
  '      "polite": {"spanish": "<formal>", "english": "<translation>"}',
  "    },",
  '    {',
  '      "local": {"spanish": "<casual>", "english": "<translation>"},',
  '      "standard": {"spanish": "<neutral>", "english": "<translation>"},',
  '      "polite": {"spanish": "<formal>", "english": "<translation>"}',
  "    }",
  "  ],",
  '  "follow_ups": [',
  '    {"spanish": "<what to say next>", "english": "<translation>"},',
  '    {"spanish": "<what to say next>", "english": "<translation>"}',
  "  ],",
  '  "alternate_meanings": [',
  '    {"english": "<other possible meaning>", "intent": "<intent>"}',
  "  ]",
  "}",
].join("\n");

// ── Tone-specific few-shot examples ─────────────────────────────────────

const TONE_EXAMPLES: Record<string, string> = {
  street: [
    "",
    "TONE: Street / Casual Mexican Spanish. Short, relaxed, slang OK.",
    "Replies should sound like a local -- informal, friendly, minimal words.",
    "Use slang: chela (beer), porfa (please), va/sale (ok), neta (really),",
    "mande? (what?), orale (alright), nomas (just), chido (cool), jale (let's go).",
    "Drop unnecessary words. Never sound like a textbook.",
    "",
    "FEW-SHOT EXAMPLES (match this vibe):",
    "",
    'Waiter: "quieres algo de tomar?"',
    'best_reply: "Una chela, porfa." (A beer, please.)',
    'alternates: "Un agua, va." (A water, sure.) / "Que tienen?" (What do you have?)',
    "",
    'Waiter: "algo mas?"',
    'best_reply: "Nah, estamos bien." (Nah, we\'re good.)',
    'alternates: "Otra ronda, porfa." (Another round, please.) / "Nomas la cuenta." (Just the check.)',
    "",
    'Waiter: "como quieres la carne?"',
    'best_reply: "Al punto, porfa." (Medium, please.)',
    'alternates: "Bien cocida, va." (Well done, sure.) / "Termino medio." (Medium.)',
    "",
    'Waiter: "que tipo de arroz prefieres?"',
    'best_reply: "El blanco, porfa." (White, please.)',
    'alternates: "El rojo, va." (Red, sure.) / "Cual me recomiendas?" (Which one do you recommend?)',
    "",
    'Waiter: "bienvenidos, cuantos son?"',
    'best_reply: "Somos dos." (Two of us.)',
    'alternates: "Nomas yo." (Just me.) / "Tres, porfa." (Three, please.)',
    "",
    'Waiter: "todo bien con su comida?"',
    'best_reply: "Todo chido, gracias." (All good, thanks.)',
    'alternates: "Muy rico, neta." (Really tasty, for real.) / "Si, esta chido." (Yeah, it\'s great.)',
    "",
    'Waiter: "quieres postre?"',
    'best_reply: "Si, que hay?" (Yeah, what\'s there?)',
    'alternates: "Nel, estoy lleno." (Nah, I\'m full.) / "Un cafecito nomas." (Just a coffee.)',
    "",
    'Waiter: "con tarjeta o efectivo?"',
    'best_reply: "Tarjeta, porfa." (Card, please.)',
    'alternates: "Efectivo, va." (Cash, sure.) / "Jala contactless?" (Does contactless work?)',
  ].join("\n"),

  neutral: [
    "",
    "TONE: Neutral / Standard polite Mexican Spanish.",
    "Replies should be friendly, clear, polite but not stiff.",
    "Use 'por favor', 'gracias', standard vocabulary.",
    "Keep it natural -- how a polite tourist would speak.",
    "",
    "FEW-SHOT EXAMPLES (match this vibe):",
    "",
    'Waiter: "quieres algo de tomar?"',
    'best_reply: "Una cerveza, por favor." (A beer, please.)',
    'alternates: "Agua, por favor." (Water, please.) / "Que tienen?" (What do you have?)',
    "",
    'Waiter: "algo mas?"',
    'best_reply: "No, gracias." (No, thanks.)',
    'alternates: "Si, un momento." (Yes, one moment.) / "La cuenta, por favor." (The check, please.)',
    "",
    'Waiter: "como quieres la carne?"',
    'best_reply: "Termino medio, por favor." (Medium, please.)',
    'alternates: "Bien cocida, por favor." (Well done, please.) / "Que me recomienda?" (What do you recommend?)',
    "",
    'Waiter: "que tipo de arroz prefieres?"',
    'best_reply: "Arroz blanco, por favor." (White rice, please.)',
    'alternates: "Arroz rojo, por favor." (Red rice, please.) / "Cual recomienda?" (Which do you recommend?)',
    "",
    'Waiter: "bienvenidos, cuantos son?"',
    'best_reply: "Para dos, por favor." (For two, please.)',
    'alternates: "Para uno, por favor." (For one, please.) / "Somos tres." (We are three.)',
    "",
    'Waiter: "todo bien con su comida?"',
    'best_reply: "Todo bien, gracias." (Everything\'s good, thanks.)',
    'alternates: "Muy rico, gracias." (Very tasty, thanks.) / "Si, esta muy bueno." (Yes, it\'s very good.)',
    "",
    'Waiter: "quieres postre?"',
    'best_reply: "Si, que tiene?" (Yes, what do you have?)',
    'alternates: "No, gracias." (No, thanks.) / "Un cafe, por favor." (A coffee, please.)',
    "",
    'Waiter: "con tarjeta o efectivo?"',
    'best_reply: "Con tarjeta, por favor." (By card, please.)',
    'alternates: "En efectivo." (In cash.) / "Puede ser contactless?" (Can it be contactless?)',
  ].join("\n"),

  formal: [
    "",
    "TONE: Formal / Respectful Mexican Spanish.",
    "Replies should use usted forms, full sentences, polite phrasing.",
    "Use 'por favor', 'si es tan amable', 'seria posible', 'muy amable', 'le agradezco'.",
    "Sound respectful and appreciative -- like a well-mannered guest.",
    "",
    "FEW-SHOT EXAMPLES (match this vibe):",
    "",
    'Waiter: "quieres algo de tomar?"',
    'best_reply: "Una cerveza, si es tan amable." (A beer, if you\'d be so kind.)',
    'alternates: "Agua mineral, por favor." (Mineral water, please.) / "Que nos recomienda?" (What would you recommend?)',
    "",
    'Waiter: "algo mas?"',
    'best_reply: "No, muchas gracias, muy amable." (No, thank you very much, very kind.)',
    'alternates: "Si, un momento por favor." (Yes, one moment please.) / "La cuenta, si es tan amable." (The check, if you\'d be so kind.)',
    "",
    'Waiter: "como quieres la carne?"',
    'best_reply: "Termino medio, por favor, si es tan amable." (Medium, please, if you\'d be so kind.)',
    'alternates: "Tres cuartos, por favor." (Medium-well, please.) / "Que termino me recomienda usted?" (What doneness would you recommend?)',
    "",
    'Waiter: "que tipo de arroz prefieres?"',
    'best_reply: "Arroz blanco, por favor." (White rice, please.)',
    'alternates: "Arroz rojo, si es tan amable." (Red rice, if you\'d be so kind.) / "Cual me recomienda usted?" (Which would you recommend?)',
    "",
    'Waiter: "bienvenidos, cuantos son?"',
    'best_reply: "Buenas noches, somos dos, por favor." (Good evening, we are two, please.)',
    'alternates: "Mesa para uno, si es tan amable." (Table for one, if you\'d be so kind.) / "Somos tres personas." (We are three people.)',
    "",
    'Waiter: "todo bien con su comida?"',
    'best_reply: "Todo excelente, le agradezco mucho." (Everything\'s excellent, I appreciate it very much.)',
    'alternates: "Muy rico, muchas gracias." (Very tasty, many thanks.) / "Estamos muy contentos, gracias." (We are very happy, thank you.)',
    "",
    'Waiter: "quieres postre?"',
    'best_reply: "Si, que nos recomienda usted?" (Yes, what would you recommend?)',
    'alternates: "No, gracias, estamos bien." (No, thank you, we\'re fine.) / "Un cafe, si es tan amable." (A coffee, if you\'d be so kind.)',
    "",
    'Waiter: "con tarjeta o efectivo?"',
    'best_reply: "Con tarjeta, por favor." (By card, please.)',
    'alternates: "En efectivo, si me permite." (In cash, if you\'ll allow me.) / "Seria posible pagar con contactless?" (Would it be possible to pay contactless?)',
  ].join("\n"),
};

/** Build the full system prompt -- includes ALL tone examples since we now get all tones in one call */
export function getLLMSystemPrompt(_tone?: "street" | "neutral" | "formal"): string {
  // Include all tone examples so the LLM knows the style for each
  return LLM_BASE_PROMPT + TONE_EXAMPLES.street + TONE_EXAMPLES.neutral + TONE_EXAMPLES.formal;
}

// Keep for backward compat
export const LLM_SYSTEM_PROMPT = getLLMSystemPrompt();

// ── Parse LLM response ─────────────────────────────────────────────────

/** Per-tone reply set returned by the LLM */
export interface TonedReply {
  spanish: string;
  english: string;
}

export interface LLMListenResponse {
  intent?: string;
  english?: string;
  literal_english?: string;
  evidence?: string[];
  keywords?: string[];
  confidence?: number;
  // ── Single-tone legacy fields (backward compat) ──
  best_reply?: string;
  best_reply_english?: string;
  alternates?: (string | { spanish: string; english: string })[];
  // ── Multi-tone fields (new) ──
  best_reply_tones?: {
    local?: TonedReply;
    standard?: TonedReply;
    polite?: TonedReply;
  };
  alternate_tones?: {
    local?: TonedReply;
    standard?: TonedReply;
    polite?: TonedReply;
  }[];
  follow_ups?: { spanish: string; english: string }[];
  alternate_meanings?: { english: string; intent: string }[];
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
  const literalEnglish = data.literal_english ?? english;
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

  // ── Build best reply with all tones ──
  const toneMap = { street: "local" as const, neutral: "standard" as const, formal: "polite" as const };
  const bt = data.best_reply_tones;
  const hasMultiTone = bt && (bt.local || bt.standard || bt.polite);

  // Pick the "standard" tone as the default display, fall back to legacy fields
  const defaultBestSpanish = bt?.standard?.spanish ?? bt?.local?.spanish ?? bt?.polite?.spanish ?? data.best_reply ?? "Si, por favor.";
  const defaultBestEnglish = bt?.standard?.english ?? bt?.local?.english ?? bt?.polite?.english ?? data.best_reply_english ?? english;

  const bestReply: ListenReply = {
    spanish: defaultBestSpanish,
    english: defaultBestEnglish,
    pronunciation: "",
    isAIGenerated: true,
    tones: hasMultiTone ? {
      local: bt?.local ? { spanish: bt.local.spanish, english: bt.local.english } : undefined,
      standard: bt?.standard ? { spanish: bt.standard.spanish, english: bt.standard.english } : undefined,
      polite: bt?.polite ? { spanish: bt.polite.spanish, english: bt.polite.english } : undefined,
    } : undefined,
  };

  // ── Build alternates with all tones ──
  const altTones = data.alternate_tones;
  let alternates: ListenReply[];
  if (altTones && altTones.length > 0) {
    alternates = altTones.map((at) => {
      const std = at.standard ?? at.local ?? at.polite;
      return {
        spanish: std?.spanish ?? "",
        english: std?.english ?? "",
        pronunciation: "",
        isAIGenerated: true,
        tones: {
          local: at.local ? { spanish: at.local.spanish, english: at.local.english } : undefined,
          standard: at.standard ? { spanish: at.standard.spanish, english: at.standard.english } : undefined,
          polite: at.polite ? { spanish: at.polite.spanish, english: at.polite.english } : undefined,
        },
      };
    }).filter((a) => a.spanish !== bestReply.spanish).slice(0, 2);
  } else {
    // Legacy fallback
    alternates = (data.alternates ?? []).map((alt) => {
      const isObj = typeof alt === "object" && alt !== null;
      return {
        spanish: isObj ? (alt as { spanish: string }).spanish : (alt as string),
        english: isObj ? (alt as { english: string }).english : "",
        pronunciation: "",
        isAIGenerated: true,
      };
    }).filter((a) => a.spanish !== bestReply.spanish).slice(0, 2);
  }

  // Build follow-ups from LLM
  const followUps: FollowUp[] = (data.follow_ups ?? []).map((f) => ({
    spanish: f.spanish,
    english: f.english,
  })).slice(0, 3);

  // Build alternate meanings (only meaningful when confidence < 70)
  const alternateMeanings: AlternateMeaning[] = (data.alternate_meanings ?? []).map((a) => ({
    english: a.english,
    intent: a.intent,
  })).slice(0, 2);

  return {
    intent,
    english,
    literalEnglish,
    confidence: rawConfidence,
    source: "ai",
    routerPath: "ai" as RouterPath,
    evidence: validEvidence,
    keywords: validEvidence,
    bestReply,
    alternates,
    followUps,
    alternateMeanings: rawConfidence < 70 ? alternateMeanings : [],
    section,
    debug: { matchedRule: "llm-primary", constraintsPassed: true },
  };
}
