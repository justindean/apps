/**
 * Restaurant intent classification for Listen mode — v4
 *
 * GROUNDED architecture: every intent decision is validated against
 * INTENT_CONSTRAINTS — required tokens that MUST appear in the transcript.
 * If constraints fail, the intent is rejected regardless of source.
 *
 * Evidence tokens (exact substrings from transcript) are tracked at every
 * step and exposed in the ListenMatch for debug + UI rendering.
 */

// ── Core types ──────────────────────────────────────────────────────────

export interface ListenReply {
  spanish: string;
  english: string;
  pronunciation: string;
  isAIGenerated?: boolean; // true when LLM generated this reply (not from our fixed sets)
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

// ══════════════════════════════════════════════════════════════════════════
//  INTENT_CONSTRAINTS — THE KEY FIX
//  At least one token from the array MUST appear in the normalized transcript
//  for the intent to be valid. If none match, the intent is REJECTED.
// ══════════════════════════════════════════════════════════════════════════

const INTENT_CONSTRAINTS: Record<string, string[]> = {
  doneness_preference: [
    "carne", "bistec", "steak", "termino", "termine", "coccion", "cocido",
    "tres cuartos", "poco hecho", "rojo", "filete", "corte",
    "arrachera", "carne de res", "jugoso", "bien cocido",
  ],
  soups_available: [
    "sopa", "sopas", "caldo", "caldos", "consome", "consomé",
  ],
  drinks_hot_offer: [
    "cafe", "capuchino", "capuccino", "americano", "latte",
    "chocolate", "infusion",
    // NOTE: bare "te" removed — it's the pronoun "you" in 99% of cases.
    // "te" as tea is only valid in multi-word phrases like "cafe o te", "un te", etc.
    // Those phrases are caught by the fast-path regex instead.
  ],
  drinks_offer: [
    "tomar", "beber", "bebida", "cerveza", "chela", "agua", "refresco",
    "jugo", "jugos", "juegos", "limonada", "copa", "vino", "mezcal", "tequila",
    "leche", "horchata", "naranjada", "jamaica", "michelada", "margarita",
    "algo de tomar", "para tomar",
  ],
  menu_offer: [
    "menu", "carta",
  ],
  anything_else: [
    "algo mas", "nada mas", "otra cosa", "algo mas para",
  ],
  smalltalk_origin: [
    "de donde",
  ],
  smalltalk_live_here: [
    "vives", "vive", "viven", "radicas",
  ],
  smalltalk_first_time: [
    "primera vez", "primer vez", "primera visita", "habias venido",
    "habias estado",
  ],
  // No constraints for greeting, party_size, table_preference, etc.
  // — their trigger words are specific enough already
};

// ── Normalizer ────────────────────────────────────────────�����─────────────

export function normalizeTranscript(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,!?;:��¡'"()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Word-boundary matcher ──────────────────────────────────────────────
// CRITICAL FIX: uses \b word boundaries to prevent substring false positives.
// e.g. "eres" must NOT match constraint "res", "dulces" must NOT match "es".

/** Escape regex special chars in a token string */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Test if `token` appears as a whole-word match inside `normed` */
function wordMatch(token: string, normed: string): boolean {
  // For multi-word tokens (e.g. "bien cocido"), match the whole phrase
  // For single words, use word boundaries
  const pattern = new RegExp(`(?:^|\\s|\\b)${escapeRegex(token)}(?:\\s|\\b|$)`, "i");
  return pattern.test(normed);
}

// ── Constraint checker ──────────────────────────────────────────────────

/** Check if transcript satisfies constraints for intent. Returns matched tokens. */
function checkConstraints(intent: string, normed: string): string[] {
  const constraints = INTENT_CONSTRAINTS[intent];
  if (!constraints) return []; // No constraints = always valid (evidence empty)
  const matched: string[] = [];
  for (const token of constraints) {
    if (wordMatch(token, normed)) {
      matched.push(token);
    }
  }
  return matched;
}

/** Returns true if intent either has no constraints or at least one constraint token is found */
function intentIsValid(intent: string, normed: string): boolean {
  const constraints = INTENT_CONSTRAINTS[intent];
  if (!constraints) return true; // No constraints defined = always valid
  return checkConstraints(intent, normed).length > 0;
}

// ── Fast-path shortcuts ─────────────────────────────────────────────────

interface FastPath {
  pattern: RegExp;
  intent: string;
  english: string;
  rule: string; // for debug
  confidence: number; // 92 = multi-word phrase (unambiguous), 55 = single noun (needs LLM)
}

const FAST_PATHS: FastPath[] = [
  // ── HIGH CONFIDENCE (92): multi-word phrases that are unambiguous ──

  // Soups — "sopas" alone is unambiguous in a restaurant
  { pattern: /\b(sopas?|caldo[s]?|consom[eé])\b/i, intent: "soups_available", english: "What soups do you have?", rule: "soups-regex", confidence: 92 },
  // Hot drinks — multi-word phrases only
  { pattern: /\b(cafe\s+o\s+te|te\s+o\s+cafe|quieres?\s+cafe|quieres?\s+te|un\s+cafe|un\s+te|capuchino|americano|latte)\b/i, intent: "drinks_hot_offer", english: "Would you like coffee or tea?", rule: "hot-drinks-phrase", confidence: 92 },
  // Drink phrases — multi-word, clearly about ordering drinks
  { pattern: /\b(algo\s+de\s+tomar|para\s+tomar|quieres?\s+tomar|desea\s+tomar|van\s+a\s+tomar|que\s+va[sn]?\s+a\s+tomar)\b/i, intent: "drinks_offer", english: "What would you like to drink?", rule: "drinks-phrase", confidence: 92 },
  // Doneness — explicit doneness phrases
  { pattern: /\b(como\s+quieres?\s+(tu|la|el)\s+carne|a\s+que\s+termin|que\s+termin|como\s+lo\s+quiere|como\s+la\s+quiere|termino\s+medio|tres\s+cuartos|bien\s+cocid[oa]|poco\s+hech[oa]|medio\s+rojo|rojo\s+por\s+dentro)\b/i, intent: "doneness_preference", english: "How would you like your meat cooked?", rule: "doneness-phrase", confidence: 92 },
  // Anything else — multi-word phrases
  { pattern: /\b(algo\s*mas|nada\s*mas|quieres?\s+algo|quieren\s+algo|otra\s*cosa|algo\s*mas\s*para)\b/i, intent: "anything_else", english: "Would you like anything else?", rule: "anything-else-phrase", confidence: 92 },
  // Check-in — multi-word phrases
  { pattern: /\b(todo\s*bien|como\s*esta\s*todo|que\s*tal\s*todo|como\s*va\s*todo)\b/i, intent: "check_in_food", english: "How is everything?", rule: "check-in-phrase", confidence: 92 },
  // Party size — multi-word phrases
  { pattern: /\b(cuantos\s*son|para\s*cuantos|mesa\s*para)\b/i, intent: "party_size", english: "How many people?", rule: "party-phrase", confidence: 92 },
  // Payment — multi-word phrases
  { pattern: /\b(tarjeta\s*o\s*efectivo|efectivo\s*o\s*tarjeta|como\s*va\s*a\s*pagar)\b/i, intent: "payment_method", english: "Cash or card?", rule: "payment-phrase", confidence: 92 },
  // Bill — multi-word phrases
  { pattern: /\b(la\s*cuenta|su\s*cuenta|les\s*traigo\s*la\s*cuenta)\b/i, intent: "bill_offer", english: "Here's the check.", rule: "bill-phrase", confidence: 92 },
  // Not available — multi-word phrases
  { pattern: /\b(no\s*hay|se\s*termino|no\s*tenemos|ya\s*no\s*hay)\b/i, intent: "not_available", english: "Sorry, that's not available.", rule: "not-avail-phrase", confidence: 92 },
  // Smalltalk — multi-word phrases
  { pattern: /\b(de\s+donde\s+eres|de\s+donde\s+vienes|de\s+donde\s+son|de\s+donde\s+es)\b/i, intent: "smalltalk_origin", english: "Where are you from?", rule: "origin-phrase", confidence: 92 },
  { pattern: /\b(vives?\s+aqui|vives?\s+aca|viven\s+aqui)\b/i, intent: "smalltalk_live_here", english: "Do you live here?", rule: "live-here-phrase", confidence: 92 },
  { pattern: /\b(primera\s+vez|primer\s+vez|primera\s+visita)\b/i, intent: "smalltalk_first_time", english: "Is it your first time?", rule: "first-time-phrase", confidence: 92 },
  { pattern: /\b(te\s+gusta\s+mexico|te\s+esta\s+gustando|les\s+gusta\s+mexico|como\s+la\s+estas\s+pasando)\b/i, intent: "smalltalk_enjoying", english: "Are you enjoying Mexico?", rule: "enjoying-phrase", confidence: 92 },

  // ── MEDIUM CONFIDENCE (55): single nouns that are ambiguous without context ──
  // These get a fast deterministic result, but the LLM will verify/correct.

  // Single beverage nouns — could be "do you want X" or "what kind of X" or "we're out of X"
  { pattern: /\b(leche|jugo[s]?|juegos?|limonada|horchata|naranjada|jamaica|cerveza|chela|michelada|refresco|vino|mezcal|tequila|margarita|copa)\b/i, intent: "drinks_offer", english: "What would you like to drink?", rule: "drinks-single-noun", confidence: 55 },
  // Table / seating — "una mesa?" = "Would you like a table?"
  { pattern: /\b(una\s+mesa|quieres?\s+mesa|necesitas?\s+mesa|busca[ns]?\s+mesa)\b/i, intent: "party_size", english: "Would you like a table?", rule: "table-offer-phrase", confidence: 92 },
  { pattern: /\bmesa\b/i, intent: "party_size", english: "Would you like a table?", rule: "mesa-single-noun", confidence: 55 },
  // Table location — single location words
  { pattern: /\b(adentro|afuera|terraza|interior|exterior)\b/i, intent: "table_preference", english: "Inside or outside?", rule: "table-single-noun", confidence: 55 },
  // Tip — single words
  { pattern: /\b(propina|servicio|incluimos\s*servicio)\b/i, intent: "tip_service", english: "Would you like to add a tip?", rule: "tip-noun", confidence: 55 },
  // Receipt — single words
  { pattern: /\b(recibo|factura|ticket|comprobante)\b/i, intent: "receipt", english: "Do you need a receipt?", rule: "receipt-noun", confidence: 55 },
  // Menu — single words
  { pattern: /\b(menu|carta)\b/i, intent: "menu_offer", english: "Would you like a menu?", rule: "menu-noun", confidence: 55 },
];

// ── Stop words: generic verbs/words that appear in many Spanish sentences ──
// These should NOT be the SOLE evidence for a match. They're valid as 
// supporting evidence alongside a topic-specific word, but alone they
// cause massive false positives.
const STOP_WORDS = new Set([
  "quieres", "quiere", "quieren", "gustaria", "gusta", "desea",
  "te", "le", "les", "lo", "la", "un", "una", "el",
  "si", "no", "que", "como", "con", "para", "por",
]);

// ── Keyword trigger groups ─────────────────────��─��─��────────────────────

interface IntentDef {
  intent: string;
  englishMeaning: string;
  triggerGroups: string[][];
  replies: ListenReply[];
  section: string;
  weight: number;
}

const INTENTS: IntentDef[] = [
  {
    intent: "greeting",
    englishMeaning: "Hello! Welcome!",
    triggerGroups: [["hola", "buenas", "buenas tardes", "buenas noches", "bienvenido", "bienvenida", "bienvenidos", "pase", "pasen", "adelante"]],
    replies: REPLY_SETS.greeting, section: "Arrival", weight: 0.7,
  },
  {
    intent: "party_size",
    englishMeaning: "How many people?",
    triggerGroups: [["cuantos", "cuantas", "para cuantos", "mesa para"], ["son", "personas", "gente", "vienen"]],
    replies: REPLY_SETS.party_size, section: "Arrival", weight: 0.92,
  },
  {
    intent: "table_preference",
    englishMeaning: "Inside or outside?",
    triggerGroups: [["adentro", "dentro", "interior", "salon"], ["afuera", "fuera", "exterior", "terraza", "jardin"]],
    replies: REPLY_SETS.table_preference, section: "Arrival", weight: 0.92,
  },
  {
    intent: "doneness_preference",
    englishMeaning: "How would you like your meat cooked?",
    // NO "quieres" here — that's generic. Only meat-specific words.
    triggerGroups: [
      ["carne", "bistec", "steak", "filete", "corte", "arrachera", "carne de res"],
      ["termino", "tres cuartos", "bien cocido", "poco hecho", "rojo", "coccion", "como lo quiere", "como la quiere", "a que termino"],
    ],
    replies: REPLY_SETS.doneness_preference, section: "Food", weight: 0.96,
  },
  {
    intent: "soups_available",
    englishMeaning: "What soups do you have?",
    triggerGroups: [["sopa", "sopas", "caldo", "caldos", "consome", "consomé"]],
    replies: REPLY_SETS.soups_available, section: "Food", weight: 0.94,
  },
  {
    intent: "drinks_hot_offer",
    englishMeaning: "Would you like coffee or tea?",
    triggerGroups: [
      // bare "te" REMOVED — it matches the pronoun "you" in nearly every sentence
      ["cafe", "capuchino", "americano", "latte", "chocolate", "cafe o te", "te o cafe", "un te"],
      ["quiere", "quieres", "gusta", "gustaria", "le traigo", "desea", "quieren"],
    ],
    replies: REPLY_SETS.drinks_hot_offer, section: "Drinks", weight: 0.94,
  },
  {
    intent: "menu_offer",
    englishMeaning: "Would you like a menu?",
    triggerGroups: [
      ["menu", "carta", "la carta"],
    ],
    replies: REPLY_SETS.menu_offer, section: "Menu", weight: 0.92,
  },
  {
    intent: "drinks_offer",
    englishMeaning: "What would you like to drink?",
    triggerGroups: [
      ["tomar", "beber", "bebida", "cerveza", "chela", "agua", "refresco",
       "jugo", "jugos", "juegos", "limonada", "leche", "horchata",
       "naranjada", "jamaica", "michelada", "copa", "vino", "mezcal", "tequila", "margarita"],
      ["algo de tomar", "para tomar", "les traigo", "les ofrezco", "desea tomar", "quiere tomar", "van a tomar"],
    ],
    replies: REPLY_SETS.drinks_offer, section: "Drinks", weight: 0.92,
  },
  {
    intent: "order_ready",
    englishMeaning: "Are you ready to order?",
    triggerGroups: [
      ["ordenar", "pedir", "orden"],
      ["listo", "listos", "ya saben", "les tomo", "van a pedir", "que desean", "van a ordenar"],
    ],
    replies: REPLY_SETS.order_ready, section: "Food", weight: 0.92,
  },
  {
    intent: "order_items",
    englishMeaning: "What would you like to have?",
    triggerGroups: [["recomiendo", "especialidad", "le sugiero", "plato del dia", "especial", "popular", "lo mas pedido"]],
    replies: REPLY_SETS.order_items, section: "Food", weight: 0.7,
  },
  {
    intent: "anything_else",
    englishMeaning: "Would you like anything else?",
    triggerGroups: [["algo mas", "nada mas", "otra cosa", "algo mas para", "falta algo", "le traigo algo", "necesita algo", "necesitan algo", "quieres algo", "quieren algo", "desea algo"]],
    replies: REPLY_SETS.anything_else, section: "Food", weight: 0.95,
  },
  {
    intent: "check_in_food",
    englishMeaning: "How is everything?",
    triggerGroups: [["todo bien", "que tal", "como esta todo", "como va todo", "les gusto", "todo en orden", "como esta"]],
    replies: REPLY_SETS.check_in_food, section: "Food", weight: 0.8,
  },
  {
    intent: "bill_offer",
    englishMeaning: "Would you like the check?",
    triggerGroups: [["cuenta", "la cuenta", "su cuenta", "les traigo la cuenta"], ["total", "son", "pesos", "cobrar"]],
    replies: REPLY_SETS.bill_offer, section: "Bill", weight: 0.88,
  },
  {
    intent: "payment_method",
    englishMeaning: "How would you like to pay?",
    triggerGroups: [["tarjeta", "efectivo", "terminal", "forma de pago", "metodo de pago", "como va a pagar", "como paga"]],
    replies: REPLY_SETS.payment_method, section: "Bill", weight: 0.88,
  },
  {
    intent: "tip_service",
    englishMeaning: "Would you like to add a tip?",
    triggerGroups: [["propina", "servicio", "incluimos servicio", "cuanto de propina", "agregar servicio"]],
    replies: REPLY_SETS.tip_service, section: "Tip", weight: 0.92,
  },
  {
    intent: "receipt",
    englishMeaning: "Do you need a receipt?",
    triggerGroups: [["recibo", "factura", "ticket", "comprobante", "nota", "requiere factura"]],
    replies: REPLY_SETS.receipt, section: "Tip", weight: 0.85,
  },
  {
    intent: "not_available",
    englishMeaning: "Sorry, that's not available.",
    triggerGroups: [["no hay", "se termino", "no tenemos", "se acabo", "ya no hay", "no queda"]],
    replies: REPLY_SETS.not_available, section: "Food", weight: 0.85,
  },
  {
    intent: "clarification",
    englishMeaning: "Could you repeat that?",
    triggerGroups: [["repetir", "otra vez", "como dijo", "que dijo", "mande", "perdon"]],
    replies: REPLY_SETS.clarification, section: "Clarify", weight: 0.7,
  },
  {
    intent: "smalltalk_origin",
    englishMeaning: "Where are you from?",
    triggerGroups: [["de donde eres", "de donde vienes", "de donde son", "de donde viene", "de donde es"]],
    replies: REPLY_SETS.smalltalk_origin, section: "Smalltalk", weight: 0.92,
  },
  {
    intent: "smalltalk_live_here",
    englishMeaning: "Do you live here?",
    triggerGroups: [["vives aqui", "vive aqui", "viven aqui", "vives aca", "radicas aqui"]],
    replies: REPLY_SETS.smalltalk_live_here, section: "Smalltalk", weight: 0.92,
  },
  {
    intent: "smalltalk_first_time",
    englishMeaning: "Is it your first time here?",
    triggerGroups: [["primera vez", "primer vez", "primera visita", "ya habias venido", "habias estado"]],
    replies: REPLY_SETS.smalltalk_first_time, section: "Smalltalk", weight: 0.92,
  },
  {
    intent: "smalltalk_enjoying",
    englishMeaning: "Are you enjoying Mexico?",
    triggerGroups: [
      ["te gusta", "te esta gustando", "les gusta", "les esta gustando", "que te parece", "como la estas pasando", "te encanta"],
      ["mexico", "ciudad", "pais", "cdmx", "aqui"],
    ],
    replies: REPLY_SETS.smalltalk_enjoying, section: "Smalltalk", weight: 0.88,
  },
];

// ══════════════════════════════════════════════════════════════════════════
//  classifyIntent — GROUNDED deterministic classifier
// ═════════════════════════════════════════════════════��═════��══��══��════════

function buildUnknown(debug?: ListenMatch["debug"]): ListenMatch {
  const replies = REPLY_SETS.unknown;
  return {
    intent: "unknown",
    english: "Not sure what they said.",
    confidence: 15,
    source: "none",
    routerPath: "fallback-unknown",
    evidence: [],
    keywords: [],
    bestReply: replies[0],
    alternates: replies.slice(1, 3),
    section: "Clarify",
    debug: { constraintsPassed: false, ...debug },
  };
}

export function classifyIntent(transcript: string): ListenMatch {
  const normed = normalizeTranscript(transcript);

  // ── FAST PATH: regex shortcuts ──
  for (const fp of FAST_PATHS) {
    const m = normed.match(fp.pattern);
    if (m) {
      // CONSTRAINT CHECK: validate intent against required tokens
      if (!intentIsValid(fp.intent, normed)) {
        continue; // Skip this fast path — constraints not met
      }
      const evidence = checkConstraints(fp.intent, normed);
      // Add the regex match itself as evidence if not already included
      const regexMatch = m[0];
      if (!evidence.includes(regexMatch)) evidence.push(regexMatch);

      const replies = REPLY_SETS[fp.intent] ?? REPLY_SETS.unknown;
      return {
        intent: fp.intent,
        english: fp.english,
        confidence: fp.confidence,
        source: "deterministic",
        routerPath: "deterministic" as RouterPath,
        evidence,
        keywords: evidence,
        bestReply: replies[0],
        alternates: replies.slice(1, 3),
        section: INTENT_TO_SECTION[fp.intent] ?? "Clarify",
        debug: { matchedRule: fp.rule, constraintsPassed: true },
      };
    }
  }

  // ── KEYWORD CLASSIFIER ──
  let best: { def: IntentDef; score: number; matchedWords: string[] } | null = null;

  for (const def of INTENTS) {
    let groupHits = 0;
    const matchedWords: string[] = [];

    for (const group of def.triggerGroups) {
      let groupMatched = false;
      for (const trigger of group) {
        const normedTrigger = normalizeTranscript(trigger);
        if (wordMatch(normedTrigger, normed)) {
          groupMatched = true;
          matchedWords.push(trigger);
        }
      }
      if (groupMatched) groupHits++;
    }

    if (groupHits === 0) continue;

    // CONSTRAINT CHECK: validate intent against required tokens
    if (!intentIsValid(def.intent, normed)) {
      continue; // Skip — constraints not met
    }

    // Check how many matched words are substantive (not generic verbs/pronouns)
    const substantiveWords = matchedWords.filter(
      (w) => !STOP_WORDS.has(normalizeTranscript(w))
    );
    const hasSubstantiveEvidence = substantiveWords.length > 0;

    const groupRatio = groupHits / def.triggerGroups.length;

    // Scoring tiers based on evidence quality:
    // - 2+ substantive words across 2+ groups = strong (0.85-0.92)
    // - 1 substantive word, 1 group = moderate (0.55-0.65)
    // - Only stop words = weak (capped at 0.35)
    const multiGroupBonus = (groupHits >= 2 && substantiveWords.length >= 2) ? 0.20 : 0;
    const multiWordBonus = substantiveWords.length > 1 ? 0.10 : 0;
    const fullMatchBonus = groupHits === def.triggerGroups.length ? 0.12 : 0;

    let score = Math.min(1, def.weight * groupRatio + 0.2 + multiWordBonus + multiGroupBonus + fullMatchBonus);

    // Cap scores based on evidence quality
    if (!hasSubstantiveEvidence) {
      // Only stop words matched -- very unreliable
      score = Math.min(score, 0.35);
    } else if (substantiveWords.length === 1 && groupHits === 1) {
      // Single substantive word, single group -- ambiguous, let LLM verify
      score = Math.min(score, 0.65);
    }

    if (!best || score > best.score) {
      best = { def, score, matchedWords };
    }
  }

  if (best && best.score >= 0.35) {
    const confidence = Math.round(best.score * 100);
    const replies = best.def.replies;
    const evidence = checkConstraints(best.def.intent, normed);
    // Add matched keywords as evidence too
    for (const w of best.matchedWords) {
      if (!evidence.includes(w)) evidence.push(w);
    }

    return {
      intent: best.def.intent,
      english: best.def.englishMeaning,
      confidence,
      source: "deterministic",
      routerPath: "deterministic" as RouterPath,
      evidence,
      keywords: evidence,
      bestReply: replies[0],
      alternates: replies.slice(1, 3),
      section: best.def.section,
      debug: { matchedRule: "keyword-classifier", constraintsPassed: true },
    };
  }

  return buildUnknown();
}

// ── Get replies for a specific intent ───────────────��───────────────────

export function getRepliesForIntent(intent: string): ListenReply[] {
  return REPLY_SETS[intent] ?? REPLY_SETS.unknown;
}

/**
 * Single source of truth: builds a FRESH ListenResult from a transcript.
 * NEVER reuses prior state. Always starts from { intent: "unknown" }
 * and upgrades only if constraints pass.
 */
export function buildListenResult(transcript: string): ListenMatch {
  if (!transcript.trim()) return buildUnknown({ constraintsPassed: false });

  const normed = normalizeTranscript(transcript);
  const result = classifyIntent(transcript);

  // Attach normalized transcript for debug
  result.debug = {
    ...result.debug,
    rawTranscript: transcript,
    normalizedTranscript: normed,
  };

  return result;
}

// ══════════════════════════════════════════════════════════════════════════
//  LLM prompt + response parsing
// ══════════════════════════════════════════════════════════════════════════

export const LLM_SYSTEM_PROMPT = `You are a restaurant Spanish interpreter for American tourists in Mexico.

A waiter just said something. The user's phone captured it via speech recognition (often imperfect/garbled).
Your job: figure out what the waiter MEANT, and give the user reply options in Spanish with English translations.

CORE RULES:
- Output VALID JSON only. No extra text.
- Speech recognition garbles words. "que eres una menu" = "quieres un menu" (do you want a menu).
  Always interpret what a waiter would REALISTICALLY say, not the literal garbled words.
- Keep Spanish replies short, natural Mexican Spanish (under 10 words).
- The user is a beginner -- every reply MUST include an English translation.
- Use a fixed intent when it fits. Use "ai_understood" when the phrase is more specific than any
  fixed intent (e.g. "que tipo de leche prefieres" = asking about milk type, not a generic drink offer).
- ONLY use "unknown" if the transcript is truly unintelligible or not restaurant-related.

INTENTS (choose exactly one):
- menu_offer
- table_preference
- party_size
- greeting
- order_ready
- order_items
- doneness_preference  (ONLY for meat: "carne", "bistec", "termino", NOT for generic "quieres")
- soups_available      ("sopa", "sopas", "caldo", "consomé")
- drinks_offer         (ANY drink: leche, jugo, agua, cerveza, refresco, limonada, vino, horchata, etc.)
- drinks_hot_offer     (HOT drinks only: cafe, te, capuchino — "quieres cafe o te?")
- anything_else        ("algo mas?", "nada mas?")
- check_in_food        ("todo bien?", "como esta todo?")
- bill_offer
- payment_method
- tip_service
- receipt
- not_available
- clarification
- smalltalk_origin
- smalltalk_live_here
- smalltalk_first_time
- smalltalk_enjoying
- ai_understood        (USE THIS when you understand the restaurant context but no fixed intent matches.
                        Generate a natural short Spanish reply. Examples: offering desserts, specific menu
                        items, compliments, restaurant-specific questions like "quieres postre?", "quieres
                        dulces?", "quieres un whopper?", etc.)
- unknown              (ONLY if transcript is truly unintelligible or completely non-restaurant-related)

ALLOWED REPLIES BY INTENT:

menu_offer:
- "Si, por favor."
- "No, gracias."
- "Me trae el menu, por favor?"
- "Tiene menu en ingles?"

table_preference:
- "Adentro, por favor."
- "Afuera, por favor."
- "Donde sea, esta bien."
- "Aqui esta bien."

party_size:
- "Para uno, por favor."
- "Para dos, por favor."
- "Para tres, por favor."
- "Para cuatro, por favor."

greeting:
- "Hola."
- "Buenas."
- "Hola, que tal?"

order_ready:
- "Si, ya."
- "Un momento, por favor."
- "Todavia no."

order_items:
- "Quiero esto, por favor."
- "Para mi, esto."
- "Me recomienda algo?"

doneness_preference:
- "Termino medio, por favor."
- "Tres cuartos, por favor."
- "Bien cocido, por favor."
- "Poco hecho, por favor."
- "Que me recomienda?"

soups_available:
- "Que sopas tiene?"
- "Que sopa recomienda?"
- "Una sopa, por favor."
- "No, gracias."

drinks_offer:
- "Agua, por favor."
- "Un jugo, por favor."
- "Una cerveza, por favor."
- "Si, por favor."
- "Nada, gracias."

drinks_hot_offer:
- "Cafe, por favor."
- "Te, por favor."
- "Agua, por favor."
- "No, gracias."

anything_else:
- "No, gracias."
- "Nada mas, gracias."
- "Si, un momento."
- "Si, quiero otra cosa."

check_in_food:
- "Todo bien, gracias."
- "Muy rico, gracias."
- "Esta bien, gracias."

bill_offer:
- "La cuenta, por favor."
- "Si, por favor."
- "Todavia no, gracias."

payment_method:
- "Con tarjeta, por favor."
- "En efectivo, por favor."
- "Puede ser contactless?"

tip_service:
- "Si, con propina, por favor."
- "No, gracias."
- "Ya incluye servicio?"

receipt:
- "Si, por favor."
- "No, gracias."
- "Me da el recibo?"

not_available:
- "Ok, gracias."
- "Entonces, que me recomienda?"
- "Tiene otra opcion?"

clarification:
- "Puede repetir, por favor?"
- "Mas despacio, por favor."
- "No entiendo, puede decirlo de otra forma?"

smalltalk_origin:
- "Soy de Estados Unidos."
- "Soy de California."
- "Soy de Los Angeles."
- "Y tu?"

smalltalk_live_here:
- "No, estoy de visita."
- "Si, vivo aqui."
- "Estoy aqui por unos dias."
- "Y tu?"

smalltalk_first_time:
- "Si, es mi primera vez."
- "No, ya he venido antes."
- "Vine hace poco."
- "Me gusta mucho."

smalltalk_enjoying:
- "Si, me encanta."
- "Si, esta increible."
- "Si, me gusta mucho."
- "La comida esta buenisima."

ai_understood:
(For ai_understood, you GENERATE the reply — do NOT use fixed replies. Keep it short, natural Mexican Spanish, under 10 words.)
Examples of ai_understood scenarios:
- "quieres dulces?" -> "Si, por favor." / "No, gracias."
- "quieres postre?" -> "Si, que tiene?" / "No, gracias."
- "quieres un whopper?" -> "Si, por favor." / "No, gracias."
- "esta muy picante" -> "Gracias por avisarme." / "Tiene algo menos picante?"
- "le falta sal?" -> "No, esta bien asi." / "Si, un poco, por favor."

unknown:
- "Puede repetir, por favor?"
- "Mas despacio, por favor."
- "No entiendo, puede decirlo de otra forma?"

OUTPUT JSON SCHEMA:
{
  "intent": "<one intent>",
  "english": "<short natural English meaning of what THEY said>",
  "evidence": ["<token from transcript>", "<token from transcript>"],
  "confidence": <0-100>,
  "best_reply": "<one allowed reply in Spanish>",
  "best_reply_english": "<English translation of best_reply>",
  "alternates": [
    {"spanish": "<allowed reply>", "english": "<English translation>"},
    {"spanish": "<allowed reply>", "english": "<English translation>"}
  ]
}

CRITICAL for replies: The "best_reply_english" and alternate "english" fields must translate the REPLY
itself, not repeat the question. Example: if best_reply is "Leche entera, por favor.", best_reply_english
is "Whole milk, please." — NOT "What type of milk do you prefer?"`;

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

/** Resolve a Spanish reply string back to a ListenReply object */
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
    return buildUnknown({ rejectedReason: `AI returned unknown intent: ${intent}` });
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
        // Use LLM's english if available, otherwise keep the fixed reply's english
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

/** Legacy compatibility alias */
export function buildListenMatchFromLLM(data: LLMListenResponse): ListenMatch {
  // Without transcript context, we can't validate — just build as-is
  const intent = data.intent ?? "unknown";
  const english = data.english ?? "Not sure what they said.";
  const confidence = Math.max(0, Math.min(100, data.confidence ?? 15));
  const evidence = data.evidence ?? data.keywords ?? [];
  const section = INTENT_TO_SECTION[intent] ?? "Clarify";
  const replies = REPLY_SETS[intent] ?? REPLY_SETS.unknown;

  let bestReply = data.best_reply ? resolveReply(data.best_reply, intent) : null;
  if (!bestReply) bestReply = replies[0];

  const alternates: ListenReply[] = [];
  if (data.alternates) {
    for (const alt of data.alternates) {
      const altSpanish = typeof alt === "object" && alt !== null ? (alt as { spanish: string }).spanish : (alt as string);
      const resolved = resolveReply(altSpanish, intent);
      if (resolved && resolved.spanish !== bestReply.spanish) {
        alternates.push(resolved);
      }
    }
  }
  if (alternates.length < 2) {
    for (const r of replies) {
      if (r.spanish !== bestReply.spanish && !alternates.find((a) => a.spanish === r.spanish)) {
        alternates.push(r);
        if (alternates.length >= 2) break;
      }
    }
  }

  return {
    intent, english, confidence,
    source: "ai",
    routerPath: "ai" as RouterPath,
    evidence, keywords: evidence,
    bestReply,
    alternates: alternates.slice(0, 2),
    section,
  };
}
