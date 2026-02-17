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

// ── Reply sets by intent ────────────────────────────────────────────────

const REPLY_SETS: Record<string, ListenReply[]> = {
  menu_offer: [
    { spanish: "Si, por favor.", english: "Yes, please.", pronunciation: "see, por fah-VOR" },
    { spanish: "No, gracias.", english: "No, thanks.", pronunciation: "noh, GRAH-see-ahs" },
    { spanish: "Me trae el menu, por favor?", english: "Can you bring the menu, please?", pronunciation: "meh TRAH-eh el meh-NOO, por fah-VOR" },
    { spanish: "Tiene menu en ingles?", english: "Do you have an English menu?", pronunciation: "tee-EH-neh meh-NOO ehn een-GLEHS" },
  ],
  table_preference: [
    { spanish: "Adentro, por favor.", english: "Inside, please.", pronunciation: "ah-DEHN-troh, por fah-VOR" },
    { spanish: "Afuera, por favor.", english: "Outside, please.", pronunciation: "ah-FWEH-rah, por fah-VOR" },
    { spanish: "Donde sea, esta bien.", english: "Anywhere is fine.", pronunciation: "DOHN-deh SEH-ah, ehs-TAH bee-EHN" },
    { spanish: "Aqui esta bien.", english: "Here is fine.", pronunciation: "ah-KEE ehs-TAH bee-EHN" },
  ],
  party_size: [
    { spanish: "Para uno, por favor.", english: "For one, please.", pronunciation: "PAH-rah OO-noh, por fah-VOR" },
    { spanish: "Para dos, por favor.", english: "For two, please.", pronunciation: "PAH-rah dohs, por fah-VOR" },
    { spanish: "Para tres, por favor.", english: "For three, please.", pronunciation: "PAH-rah trehs, por fah-VOR" },
    { spanish: "Para cuatro, por favor.", english: "For four, please.", pronunciation: "PAH-rah KWAH-troh, por fah-VOR" },
  ],
  greeting: [
    { spanish: "Hola.", english: "Hi.", pronunciation: "OH-lah" },
    { spanish: "Buenas.", english: "Hello.", pronunciation: "BWEH-nahs" },
    { spanish: "Hola, que tal?", english: "Hi, how's it going?", pronunciation: "OH-lah, keh tahl" },
  ],
  order_ready: [
    { spanish: "Si, ya.", english: "Yes, ready.", pronunciation: "see, yah" },
    { spanish: "Un momento, por favor.", english: "One moment, please.", pronunciation: "oon moh-MEHN-toh, por fah-VOR" },
    { spanish: "Todavia no.", english: "Not yet.", pronunciation: "toh-dah-VEE-ah noh" },
  ],
  order_items: [
    { spanish: "Quiero esto, por favor.", english: "I'd like this, please.", pronunciation: "kee-EH-roh EHS-toh, por fah-VOR" },
    { spanish: "Para mi, esto.", english: "This one for me.", pronunciation: "PAH-rah mee, EHS-toh" },
    { spanish: "Me recomienda algo?", english: "Can you recommend something?", pronunciation: "meh reh-koh-mee-EHN-dah AHL-goh" },
  ],
  doneness_preference: [
    { spanish: "Termino medio, por favor.", english: "Medium, please.", pronunciation: "TEHR-mee-noh MEH-dee-oh, por fah-VOR" },
    { spanish: "Tres cuartos, por favor.", english: "Medium-well, please.", pronunciation: "trehs KWAHR-tohs, por fah-VOR" },
    { spanish: "Bien cocido, por favor.", english: "Well done, please.", pronunciation: "bee-EHN koh-SEE-doh, por fah-VOR" },
    { spanish: "Poco hecho, por favor.", english: "Rare, please.", pronunciation: "POH-koh EH-choh, por fah-VOR" },
    { spanish: "Que me recomienda?", english: "What do you recommend?", pronunciation: "keh meh reh-koh-mee-EHN-dah" },
  ],
  drinks_offer: [
    { spanish: "Agua, por favor.", english: "Water, please.", pronunciation: "AH-gwah, por fah-VOR" },
    { spanish: "Un jugo, por favor.", english: "A juice, please.", pronunciation: "oon HOO-goh, por fah-VOR" },
    { spanish: "Una cerveza, por favor.", english: "A beer, please.", pronunciation: "OO-nah ser-VEH-sah, por fah-VOR" },
    { spanish: "Si, por favor.", english: "Yes, please.", pronunciation: "see, por fah-VOR" },
    { spanish: "Nada, gracias.", english: "Nothing, thanks.", pronunciation: "NAH-dah, GRAH-see-ahs" },
  ],
  drinks_hot_offer: [
    { spanish: "Cafe, por favor.", english: "Coffee, please.", pronunciation: "kah-FEH, por fah-VOR" },
    { spanish: "Te, por favor.", english: "Tea, please.", pronunciation: "teh, por fah-VOR" },
    { spanish: "Agua, por favor.", english: "Water, please.", pronunciation: "AH-gwah, por fah-VOR" },
    { spanish: "No, gracias.", english: "No, thanks.", pronunciation: "noh, GRAH-see-ahs" },
  ],
  soups_available: [
    { spanish: "Que sopas tiene?", english: "What soups do you have?", pronunciation: "keh SOH-pahs tee-EH-neh" },
    { spanish: "Que sopa recomienda?", english: "Which soup do you recommend?", pronunciation: "keh SOH-pah reh-koh-mee-EHN-dah" },
    { spanish: "Una sopa, por favor.", english: "A soup, please.", pronunciation: "OO-nah SOH-pah, por fah-VOR" },
    { spanish: "No, gracias.", english: "No, thanks.", pronunciation: "noh, GRAH-see-ahs" },
  ],
  anything_else: [
    { spanish: "No, gracias.", english: "No, thanks.", pronunciation: "noh, GRAH-see-ahs" },
    { spanish: "Nada mas, gracias.", english: "Nothing else, thanks.", pronunciation: "NAH-dah mahs, GRAH-see-ahs" },
    { spanish: "Si, un momento.", english: "Yes, one moment.", pronunciation: "see, oon moh-MEHN-toh" },
    { spanish: "Si, quiero otra cosa.", english: "Yes, I'd like something else.", pronunciation: "see, kee-EH-roh OH-trah KOH-sah" },
  ],
  check_in_food: [
    { spanish: "Todo bien, gracias.", english: "Everything's great, thanks.", pronunciation: "TOH-doh bee-EHN, GRAH-see-ahs" },
    { spanish: "Muy rico, gracias.", english: "Very tasty, thanks.", pronunciation: "mwee REE-koh, GRAH-see-ahs" },
    { spanish: "Esta bien, gracias.", english: "It's fine, thanks.", pronunciation: "ehs-TAH bee-EHN, GRAH-see-ahs" },
  ],
  bill_offer: [
    { spanish: "La cuenta, por favor.", english: "The check, please.", pronunciation: "lah KWEHN-tah, por fah-VOR" },
    { spanish: "Si, por favor.", english: "Yes, please.", pronunciation: "see, por fah-VOR" },
    { spanish: "Todavia no, gracias.", english: "Not yet, thanks.", pronunciation: "toh-dah-VEE-ah noh, GRAH-see-ahs" },
  ],
  payment_method: [
    { spanish: "Con tarjeta, por favor.", english: "By card, please.", pronunciation: "kohn tar-HEH-tah, por fah-VOR" },
    { spanish: "En efectivo, por favor.", english: "In cash, please.", pronunciation: "ehn eh-fehk-TEE-voh, por fah-VOR" },
    { spanish: "Puede ser contactless?", english: "Can it be contactless?", pronunciation: "PWEH-deh sehr kohn-TAHK-lehs" },
  ],
  tip_service: [
    { spanish: "Si, con propina, por favor.", english: "Yes, with tip, please.", pronunciation: "see, kohn proh-PEE-nah, por fah-VOR" },
    { spanish: "No, gracias.", english: "No, thanks.", pronunciation: "noh, GRAH-see-ahs" },
    { spanish: "Ya incluye servicio?", english: "Does it already include service?", pronunciation: "yah een-KLOO-yeh ser-VEE-see-oh" },
  ],
  receipt: [
    { spanish: "Si, por favor.", english: "Yes, please.", pronunciation: "see, por fah-VOR" },
    { spanish: "No, gracias.", english: "No, thanks.", pronunciation: "noh, GRAH-see-ahs" },
    { spanish: "Me da el recibo?", english: "Can I get the receipt?", pronunciation: "meh dah el reh-SEE-boh" },
  ],
  not_available: [
    { spanish: "Ok, gracias.", english: "Ok, thanks.", pronunciation: "oh-KAY, GRAH-see-ahs" },
    { spanish: "Entonces, que me recomienda?", english: "Then what do you recommend?", pronunciation: "ehn-TOHN-sehs, keh meh reh-koh-mee-EHN-dah" },
    { spanish: "Tiene otra opcion?", english: "Do you have another option?", pronunciation: "tee-EH-neh OH-trah ohp-see-OHN" },
  ],
  clarification: [
    { spanish: "Puede repetir, por favor?", english: "Can you repeat, please?", pronunciation: "PWEH-deh reh-peh-TEER, por fah-VOR" },
    { spanish: "Mas despacio, por favor.", english: "Slower, please.", pronunciation: "mahs dehs-PAH-see-oh, por fah-VOR" },
    { spanish: "No entiendo, puede decirlo de otra forma?", english: "I don't understand, can you say it differently?", pronunciation: "noh ehn-tee-EHN-doh, PWEH-deh deh-SEER-loh deh OH-trah FOR-mah" },
  ],
  unknown: [
    { spanish: "Puede repetir, por favor?", english: "Can you repeat, please?", pronunciation: "PWEH-deh reh-peh-TEER, por fah-VOR" },
    { spanish: "Mas despacio, por favor.", english: "Slower, please.", pronunciation: "mahs dehs-PAH-see-oh, por fah-VOR" },
    { spanish: "No entiendo, puede decirlo de otra forma?", english: "I don't understand, can you say it differently?", pronunciation: "noh ehn-tee-EHN-doh, PWEH-deh deh-SEER-loh deh OH-trah FOR-mah" },
  ],
  smalltalk_origin: [
    { spanish: "Soy de Estados Unidos.", english: "I'm from the US.", pronunciation: "soy deh ehs-TAH-dohs oo-NEE-dohs" },
    { spanish: "Soy de California.", english: "I'm from California.", pronunciation: "soy deh kah-lee-FOR-nee-ah" },
    { spanish: "Soy de Los Angeles.", english: "I'm from Los Angeles.", pronunciation: "soy deh lohs AHN-heh-lehs" },
    { spanish: "Y tu?", english: "And you?", pronunciation: "ee too" },
  ],
  smalltalk_live_here: [
    { spanish: "No, estoy de visita.", english: "No, I'm visiting.", pronunciation: "noh, ehs-TOY deh vee-SEE-tah" },
    { spanish: "Si, vivo aqui.", english: "Yes, I live here.", pronunciation: "see, VEE-voh ah-KEE" },
    { spanish: "Estoy aqui por unos dias.", english: "I'm here for a few days.", pronunciation: "ehs-TOY ah-KEE por OO-nohs DEE-ahs" },
    { spanish: "Y tu?", english: "And you?", pronunciation: "ee too" },
  ],
  smalltalk_first_time: [
    { spanish: "Si, es mi primera vez.", english: "Yes, it's my first time.", pronunciation: "see, ehs mee pree-MEH-rah vehs" },
    { spanish: "No, ya he venido antes.", english: "No, I've been before.", pronunciation: "noh, yah eh veh-NEE-doh AHN-tehs" },
    { spanish: "Vine hace poco.", english: "I came recently.", pronunciation: "VEE-neh AH-seh POH-koh" },
    { spanish: "Me gusta mucho.", english: "I like it a lot.", pronunciation: "meh GOOS-tah MOO-choh" },
  ],
  smalltalk_enjoying: [
    { spanish: "Si, me encanta.", english: "Yes, I love it.", pronunciation: "see, meh ehn-KAHN-tah" },
    { spanish: "Si, esta increible.", english: "Yes, it's incredible.", pronunciation: "see, ehs-TAH een-kreh-EE-bleh" },
    { spanish: "Si, me gusta mucho.", english: "Yes, I like it a lot.", pronunciation: "see, meh GOOS-tah MOO-choh" },
    { spanish: "La comida esta buenisima.", english: "The food is amazing.", pronunciation: "lah koh-MEE-dah ehs-TAH bweh-NEE-see-mah" },
  ],
};

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
  const replies = REPLY_SETS.unknown;
  return {
    intent: "unknown",
    english: "Not sure what they said.",
    confidence: 0,
    source: "none",
    routerPath: "fallback-unknown",
    evidence: [],
    keywords: [],
    bestReply: replies[0],
    alternates: replies.slice(1, 3),
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
  "Your job: figure out what the waiter MEANT, and give the user reply options in Spanish with English translations.",
  "",
  "CORE RULES:",
  "- Output VALID JSON only. No extra text.",
  '- Speech recognition garbles words. "que eres una menu" = "quieres un menu" (do you want a menu).',
  "  Always interpret what a waiter would REALISTICALLY say, not the literal garbled words.",
  "- Keep Spanish replies short, natural Mexican Spanish (under 10 words).",
  "- The user is a beginner -- every reply MUST include an English translation.",
  '- Use a fixed intent when it fits. Use "ai_understood" when the phrase is more specific than any',
  '  fixed intent (e.g. "que tipo de leche prefieres" = asking about milk type, not a generic drink offer).',
  '- ONLY use "unknown" if the transcript is truly unintelligible or not restaurant-related.',
  "",
  "INTENTS (choose exactly one):",
  "- menu_offer",
  "- table_preference",
  "- party_size",
  "- greeting",
  "- order_ready",
  "- order_items",
  '- doneness_preference  (ONLY for meat: "carne", "bistec", "termino", NOT for generic "quieres")',
  '- soups_available      ("sopa", "sopas", "caldo", "consom\u00E9")',
  "- drinks_offer         (ANY drink: leche, jugo, agua, cerveza, refresco, limonada, vino, horchata, etc.)",
  '- drinks_hot_offer     (HOT drinks only: cafe, te, capuchino -- "quieres cafe o te?")',
  '- anything_else        ("algo mas?", "nada mas?")',
  '- check_in_food        ("todo bien?", "como esta todo?")',
  "- bill_offer",
  "- payment_method",
  "- tip_service",
  "- receipt",
  "- not_available",
  "- clarification",
  "- smalltalk_origin",
  "- smalltalk_live_here",
  "- smalltalk_first_time",
  "- smalltalk_enjoying",
  "- ai_understood        (USE THIS when you understand the restaurant context but no fixed intent matches.",
  "                        Generate a natural short Spanish reply. Examples: offering desserts, specific menu",
  '                        items, compliments, restaurant-specific questions like "quieres postre?", "quieres',
  '                        dulces?", "quieres un whopper?", etc.)',
  "- unknown              (ONLY if transcript is truly unintelligible or completely non-restaurant-related)",
  "",
  "ALLOWED REPLIES BY INTENT:",
  "",
  "menu_offer:",
  '- "Si, por favor."',
  '- "No, gracias."',
  '- "Me trae el menu, por favor?"',
  '- "Tiene menu en ingles?"',
  "",
  "table_preference:",
  '- "Adentro, por favor."',
  '- "Afuera, por favor."',
  '- "Donde sea, esta bien."',
  '- "Aqui esta bien."',
  "",
  "party_size:",
  '- "Para uno, por favor."',
  '- "Para dos, por favor."',
  '- "Para tres, por favor."',
  '- "Para cuatro, por favor."',
  "",
  "greeting:",
  '- "Hola."',
  '- "Buenas."',
  '- "Hola, que tal?"',
  "",
  "order_ready:",
  '- "Si, ya."',
  '- "Un momento, por favor."',
  '- "Todavia no."',
  "",
  "order_items:",
  '- "Quiero esto, por favor."',
  '- "Para mi, esto."',
  '- "Me recomienda algo?"',
  "",
  "doneness_preference:",
  '- "Termino medio, por favor."',
  '- "Tres cuartos, por favor."',
  '- "Bien cocido, por favor."',
  '- "Poco hecho, por favor."',
  '- "Que me recomienda?"',
  "",
  "soups_available:",
  '- "Que sopas tiene?"',
  '- "Que sopa recomienda?"',
  '- "Una sopa, por favor."',
  '- "No, gracias."',
  "",
  "drinks_offer:",
  '- "Agua, por favor."',
  '- "Un jugo, por favor."',
  '- "Una cerveza, por favor."',
  '- "Si, por favor."',
  '- "Nada, gracias."',
  "",
  "drinks_hot_offer:",
  '- "Cafe, por favor."',
  '- "Te, por favor."',
  '- "Agua, por favor."',
  '- "No, gracias."',
  "",
  "anything_else:",
  '- "No, gracias."',
  '- "Nada mas, gracias."',
  '- "Si, un momento."',
  '- "Si, quiero otra cosa."',
  "",
  "check_in_food:",
  '- "Todo bien, gracias."',
  '- "Muy rico, gracias."',
  '- "Esta bien, gracias."',
  "",
  "bill_offer:",
  '- "La cuenta, por favor."',
  '- "Si, por favor."',
  '- "Todavia no, gracias."',
  "",
  "payment_method:",
  '- "Con tarjeta, por favor."',
  '- "En efectivo, por favor."',
  '- "Puede ser contactless?"',
  "",
  "tip_service:",
  '- "Si, con propina, por favor."',
  '- "No, gracias."',
  '- "Ya incluye servicio?"',
  "",
  "receipt:",
  '- "Si, por favor."',
  '- "No, gracias."',
  '- "Me da el recibo?"',
  "",
  "not_available:",
  '- "Ok, gracias."',
  '- "Entonces, que me recomienda?"',
  '- "Tiene otra opcion?"',
  "",
  "clarification:",
  '- "Puede repetir, por favor?"',
  '- "Mas despacio, por favor."',
  '- "No entiendo, puede decirlo de otra forma?"',
  "",
  "smalltalk_origin:",
  '- "Soy de Estados Unidos."',
  '- "Soy de California."',
  '- "Soy de Los Angeles."',
  '- "Y tu?"',
  "",
  "smalltalk_live_here:",
  '- "No, estoy de visita."',
  '- "Si, vivo aqui."',
  '- "Estoy aqui por unos dias."',
  '- "Y tu?"',
  "",
  "smalltalk_first_time:",
  '- "Si, es mi primera vez."',
  '- "No, ya he venido antes."',
  '- "Vine hace poco."',
  '- "Me gusta mucho."',
  "",
  "smalltalk_enjoying:",
  '- "Si, me encanta."',
  '- "Si, esta increible."',
  '- "Si, me gusta mucho."',
  '- "La comida esta buenisima."',
  "",
  "ai_understood:",
  "(For ai_understood, you GENERATE the reply -- do NOT use fixed replies. Keep it short, natural Mexican Spanish, under 10 words.)",
  "Examples of ai_understood scenarios:",
  '- "quieres dulces?" -> "Si, por favor." / "No, gracias."',
  '- "quieres postre?" -> "Si, que tiene?" / "No, gracias."',
  '- "quieres un whopper?" -> "Si, por favor." / "No, gracias."',
  '- "esta muy picante" -> "Gracias por avisarme." / "Tiene algo menos picante?"',
  '- "le falta sal?" -> "No, esta bien asi." / "Si, un poco, por favor."',
  "",
  "unknown:",
  '- "Puede repetir, por favor?"',
  '- "Mas despacio, por favor."',
  '- "No entiendo, puede decirlo de otra forma?"',
  "",
  "OUTPUT JSON SCHEMA:",
  "{",
  '  "intent": "<one intent>",',
  '  "english": "<short natural English meaning of what THEY said>",',
  '  "evidence": ["<token from transcript>", "<token from transcript>"],',
  '  "confidence": <0-100>,',
  '  "best_reply": "<one allowed reply in Spanish>",',
  '  "best_reply_english": "<English translation of best_reply>",',
  '  "alternates": [',
  '    {"spanish": "<allowed reply>", "english": "<English translation>"},',
  '    {"spanish": "<allowed reply>", "english": "<English translation>"}',
  "  ]",
  "}",
  "",
  'CRITICAL for replies: The "best_reply_english" and alternate "english" fields must translate the REPLY',
  'itself, not repeat the question. Example: if best_reply is "Leche entera, por favor.", best_reply_english',
  'is "Whole milk, please." -- NOT "What type of milk do you prefer?"',
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

/** Resolve a Spanish reply string back to a ListenReply object from REPLY_SETS */
function resolveReply(spanish: string, intent: string): ListenReply | null {
  const normed = normalizeTranscript(spanish);
  const replies = REPLY_SETS[intent] ?? REPLY_SETS.unknown;
  for (const r of replies) {
    if (normalizeTranscript(r.spanish) === normed) return r;
  }
  const first3 = normed.split(" ").slice(0, 3).join(" ");
  for (const r of replies) {
    if (normalizeTranscript(r.spanish).startsWith(first3)) return r;
  }
  return null;
}

/**
 * Build a ListenMatch from an LLM response.
 * The LLM is the source of truth -- we only do basic sanity checks.
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

  // Helper: parse an alternate entry (supports both string and {spanish, english} formats)
  const parseAlternate = (alt: string | { spanish: string; english: string }): ListenReply => {
    const isObj = typeof alt === "object" && alt !== null;
    return {
      spanish: isObj ? (alt as { spanish: string }).spanish : (alt as string),
      english: isObj ? (alt as { english: string }).english : "",
      pronunciation: "",
      isAIGenerated: true,
    };
  };

  // For ai_understood: use LLM-generated replies directly
  if (intent === "ai_understood") {
    const bestReply: ListenReply = {
      spanish: data.best_reply ?? "Si, por favor.",
      english: data.best_reply_english || english,
      pronunciation: "",
      isAIGenerated: true,
    };
    return {
      intent: "ai_understood",
      english,
      confidence: rawConfidence,
      source: "ai",
      routerPath: "ai" as RouterPath,
      evidence: validEvidence,
      keywords: validEvidence,
      bestReply,
      alternates: (data.alternates ?? []).map(parseAlternate).slice(0, 2),
      section: "AI",
      debug: { matchedRule: "ai-understood", constraintsPassed: true },
    };
  }

  // For fixed intents: resolve replies from REPLY_SETS, with LLM english translations
  const replies = REPLY_SETS[intent] ?? REPLY_SETS.unknown;
  let bestReply = data.best_reply ? resolveReply(data.best_reply, intent) : null;
  if (!bestReply) bestReply = replies[0];
  // Use LLM's english translation for the best reply if available
  if (data.best_reply_english) bestReply = { ...bestReply, english: data.best_reply_english };

  const alternates: ListenReply[] = [];
  if (data.alternates) {
    for (const alt of data.alternates) {
      const altSpanish = typeof alt === "object" && alt !== null ? (alt as { spanish: string }).spanish : (alt as string);
      const altEnglish = typeof alt === "object" && alt !== null ? (alt as { english: string }).english : "";
      const resolved = resolveReply(altSpanish, intent);
      if (resolved && resolved.spanish !== bestReply.spanish) {
        alternates.push(altEnglish ? { ...resolved, english: altEnglish } : resolved);
      }
    }
  }
  // Fill remaining alternates from fixed reply sets
  if (alternates.length < 2) {
    for (const r of replies) {
      if (r.spanish !== bestReply.spanish && !alternates.find((a) => a.spanish === r.spanish)) {
        alternates.push(r);
        if (alternates.length >= 2) break;
      }
    }
  }

  return {
    intent,
    english,
    confidence: rawConfidence,
    source: "ai",
    routerPath: "ai" as RouterPath,
    evidence: validEvidence,
    keywords: validEvidence,
    bestReply,
    alternates: alternates.slice(0, 2),
    section,
    debug: { matchedRule: "ai-validated", constraintsPassed: true },
  };
}
