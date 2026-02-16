/**
 * Restaurant intent classification for Listen mode
 *
 * Intent-first approach: every transcript is mapped to one of ~25 restaurant
 * intents. Each intent returns:
 *   - theySaidEnglish  (clear English meaning)
 *   - intent           (machine-readable key)
 *   - confidence        (0–1)
 *   - best reply        (Phrase from our dataset)
 *   - section           (dataset section for alternatives)
 *
 * NEVER returns null — if uncertain, returns a CLARIFY fallback with a
 * Spanish clarifying question so the user always has something to say.
 */

import type { Phrase, SpeechMode } from "./phrases";
import { fastModePhrasesBySection } from "./phrases";

export interface IntentMatch {
  confidence: number;
  section: string;
  intent: string;
  phrase: Phrase;
  theySaidEnglish: string;
}

// ── Intent definitions ──────────────────────────────────────────────────

interface IntentDef {
  intent: string;
  theySaidEnglish: string;
  /** Keyword groups. Each group is a set of synonyms; matching any word in a group counts as 1 group hit. More group hits = higher confidence. */
  triggerGroups: string[][];
  section: string;
  phraseIndex: number;
  weight: number;
  /** Hard-coded allowed reply indices within the section. If set, only these indices are allowed as primary + alts. */
  allowedReplies?: number[];
}

/**
 * Intent → allowed reply indices within its section.
 * This prevents e.g. OFFER_MENU from suggesting "Esto, por favor" (a Food/ordering reply).
 */
const INTENT_REPLY_CONSTRAINTS: Record<string, { section: string; allowedIndices: number[] }> = {
  // Arrival
  HOW_MANY:            { section: "Arrival", allowedIndices: [0, 1, 2] },
  WELCOME:             { section: "Arrival", allowedIndices: [0, 1, 2] },
  INSIDE_OUTSIDE:      { section: "Arrival", allowedIndices: [0, 1, 2] },
  THIS_TABLE_OK:       { section: "Arrival", allowedIndices: [0, 1] },
  WAIT_TIME:           { section: "Arrival", allowedIndices: [0, 1, 2, 3, 4] },
  // Drinks
  DRINK_ASK:           { section: "Drinks", allowedIndices: [0, 1, 2] },
  DRINK_WATER:         { section: "Drinks", allowedIndices: [0, 1, 2] },
  DRINK_REFILL:        { section: "Drinks", allowedIndices: [0, 1, 2] },
  DRINK_BEER:          { section: "Drinks", allowedIndices: [0, 1, 2] },
  // Menu — dedicated section for OFFER_MENU (0=Yes, 1=No, 2=Bring menu, 3=English menu)
  OFFER_MENU:          { section: "Menu", allowedIndices: [0, 1, 2, 3] },
  // Food
  READY_TO_ORDER:      { section: "Food", allowedIndices: [0, 1, 2] },
  SPICE_ASK:           { section: "Food", allowedIndices: [0, 1, 2] },
  SHARE_ASK:           { section: "Food", allowedIndices: [0, 1, 2] },
  FOOD_SUGGEST:        { section: "Food", allowedIndices: [0, 1, 2] },
  ANYTHING_ELSE:       { section: "Food", allowedIndices: [0, 1, 2] },
  HOW_IS_EVERYTHING:   { section: "Arrival", allowedIndices: [0, 1] },
  // Bill
  BRING_CHECK:         { section: "Bill", allowedIndices: [0, 1, 2] },
  HOW_PAY:             { section: "Bill", allowedIndices: [0, 1, 2] },
  TOGETHER_OR_SEPARATE:{ section: "Bill", allowedIndices: [0, 1, 2] },
  CHANGE:              { section: "Bill", allowedIndices: [0, 1, 2] },
  // Tip
  TIP_ASK:             { section: "Tip", allowedIndices: [0, 1, 2, 3] },
  TIP_PERCENT:         { section: "Tip", allowedIndices: [0, 1] },
  RECEIPT_ASK:         { section: "Tip", allowedIndices: [4, 5] },
  TOTAL_AMOUNT:        { section: "Tip", allowedIndices: [4, 0, 1] },
  CASH_OR_CARD:        { section: "Tip", allowedIndices: [2, 3] },
};

const intents: IntentDef[] = [
  // ── ARRIVAL ─────────────────────────────────────────────
  {
    intent: "HOW_MANY",
    theySaidEnglish: "How many people?",
    triggerGroups: [
      ["cuantos", "cuantas"],
      ["son", "personas", "para cuantos", "mesa para"],
    ],
    section: "Arrival", phraseIndex: 0, weight: 0.92,
  },
  {
    intent: "WELCOME",
    theySaidEnglish: "Welcome! Come on in.",
    triggerGroups: [
      ["bienvenido", "bienvenida", "bienvenidos"],
      ["hola", "buenas", "buenas tardes", "buenas noches", "pase", "pasen", "adelante"],
    ],
    section: "Arrival", phraseIndex: 1, weight: 0.7,
  },
  {
    intent: "INSIDE_OUTSIDE",
    theySaidEnglish: "Inside or outside?",
    triggerGroups: [
      ["adentro", "dentro", "interior", "salon"],
      ["afuera", "fuera", "exterior", "terraza", "jardin"],
    ],
    section: "Arrival", phraseIndex: 2, weight: 0.92,
  },
  {
    intent: "THIS_TABLE_OK",
    theySaidEnglish: "Is this table okay?",
    triggerGroups: [
      ["esta mesa", "esta bien", "les parece", "aqui esta", "le gusta esta"],
    ],
    section: "Arrival", phraseIndex: 1, weight: 0.82,
  },
  {
    intent: "WAIT_TIME",
    theySaidEnglish: "There will be a wait.",
    triggerGroups: [
      ["espera", "esperar", "lista de espera"],
      ["minutos", "momento", "tarda", "lleno", "no hay mesa", "ocupado"],
    ],
    section: "Arrival", phraseIndex: 4, weight: 0.85,
  },

  // ── OFFER MENU ──────────────────────────────────────────
  {
    intent: "OFFER_MENU",
    theySaidEnglish: "Would you like a menu?",
    triggerGroups: [
      ["menu", "carta", "la carta", "carta de comida", "para comer"],
      ["quiere", "quieres", "gusta", "gustaria", "le traigo", "te traigo", "necesita", "desea", "quieren"],
    ],
    section: "Menu", phraseIndex: 0, weight: 0.92,
  },

  // ── DRINKS ──────────────────────────────────────────────
  {
    intent: "DRINK_ASK",
    theySaidEnglish: "What would you like to drink?",
    triggerGroups: [
      ["tomar", "beber", "bebida"],
      ["algo de tomar", "para tomar", "que les traigo", "les ofrezco", "desea tomar", "quiere tomar", "van a tomar"],
    ],
    section: "Drinks", phraseIndex: 0, weight: 0.92,
  },
  {
    intent: "DRINK_WATER",
    theySaidEnglish: "Would you like water?",
    triggerGroups: [
      ["agua"],
      ["natural", "mineral", "con gas", "sin gas"],
    ],
    section: "Drinks", phraseIndex: 1, weight: 0.82,
  },
  {
    intent: "DRINK_REFILL",
    theySaidEnglish: "Would you like another one?",
    triggerGroups: [
      ["otra", "otro", "mas", "mismo", "misma", "repito"],
      ["le traigo otra", "quiere otra", "una mas"],
    ],
    section: "Drinks", phraseIndex: 2, weight: 0.85,
  },
  {
    intent: "DRINK_BEER",
    theySaidEnglish: "What beer would you like?",
    triggerGroups: [
      ["cerveza", "chela", "cervezas"],
      ["clara", "oscura", "de barril", "que cerveza"],
    ],
    section: "Drinks", phraseIndex: 0, weight: 0.8,
  },

  // ── FOOD ────────────────────────────────────────────────
  {
    intent: "READY_TO_ORDER",
    theySaidEnglish: "Are you ready to order?",
    triggerGroups: [
      ["ordenar", "pedir", "orden"],
      ["listo", "listos", "ya saben", "les tomo", "van a pedir", "que desean", "van a ordenar"],
    ],
    section: "Food", phraseIndex: 0, weight: 0.92,
  },
  {
    intent: "SPICE_ASK",
    theySaidEnglish: "Is spicy okay?",
    triggerGroups: [
      ["picante", "picoso", "chile", "enchilado"],
      ["salsa", "pica", "con chile", "le pone salsa"],
    ],
    section: "Food", phraseIndex: 1, weight: 0.88,
  },
  {
    intent: "SHARE_ASK",
    theySaidEnglish: "Would you like to share?",
    triggerGroups: [
      ["compartir", "para compartir", "para los dos", "entre los dos", "a la mitad"],
    ],
    section: "Food", phraseIndex: 2, weight: 0.82,
  },
  {
    intent: "FOOD_SUGGEST",
    theySaidEnglish: "I recommend this one.",
    triggerGroups: [
      ["recomiendo", "especialidad", "le sugiero", "lo mas pedido", "plato del dia", "especial", "popular"],
    ],
    section: "Food", phraseIndex: 0, weight: 0.7,
  },
  {
    intent: "ANYTHING_ELSE",
    theySaidEnglish: "Anything else?",
    triggerGroups: [
      ["algo mas", "necesita", "necesitan", "otra cosa", "desea algo mas", "falta algo", "le traigo algo"],
    ],
    section: "Food", phraseIndex: 0, weight: 0.65,
  },
  {
    intent: "HOW_IS_EVERYTHING",
    theySaidEnglish: "How is everything?",
    triggerGroups: [
      ["todo bien", "le gusta", "les gusta", "que tal", "como esta", "como va", "les gusto", "satisfecho"],
    ],
    section: "Arrival", phraseIndex: 1, weight: 0.55,
  },

  // ── BILL / PAYMENT ──────────────────────────────────────
  {
    intent: "BRING_CHECK",
    theySaidEnglish: "Here is the check.",
    triggerGroups: [
      ["cuenta", "su cuenta", "aqui esta la cuenta"],
      ["total", "son", "pesos"],
    ],
    section: "Bill", phraseIndex: 0, weight: 0.88,
  },
  {
    intent: "HOW_PAY",
    theySaidEnglish: "How would you like to pay?",
    triggerGroups: [
      ["pagar", "cobrar", "forma de pago", "metodo de pago"],
      ["efectivo", "tarjeta", "terminal", "como va a pagar"],
    ],
    section: "Bill", phraseIndex: 0, weight: 0.85,
  },
  {
    intent: "TOGETHER_OR_SEPARATE",
    theySaidEnglish: "Together or separate checks?",
    triggerGroups: [
      ["junto", "juntos", "separado", "separada", "dividir", "separar"],
      ["una sola", "dividimos", "separar la cuenta"],
    ],
    section: "Bill", phraseIndex: 1, weight: 0.88,
  },
  {
    intent: "CHANGE",
    theySaidEnglish: "Here is your change.",
    triggerGroups: [
      ["cambio", "vuelta", "su cambio", "aqui tiene", "le debo"],
    ],
    section: "Bill", phraseIndex: 0, weight: 0.7,
  },

  // ── TIP ─────────────────────────────────────────────────
  {
    intent: "TIP_ASK",
    theySaidEnglish: "Would you like to add a tip?",
    triggerGroups: [
      ["propina", "servicio"],
      ["agregar", "dejar", "gusta agregar", "le pongo", "le agrego", "desea dejar", "con cuanto"],
    ],
    section: "Tip", phraseIndex: 0, weight: 0.92,
  },
  {
    intent: "TIP_PERCENT",
    theySaidEnglish: "Add 10%?",
    triggerGroups: [
      ["diez", "quince", "veinte"],
      ["por ciento", "porcentaje", "el 10", "el 15", "el 20"],
    ],
    section: "Tip", phraseIndex: 0, weight: 0.9,
  },
  {
    intent: "RECEIPT_ASK",
    theySaidEnglish: "Do you need a receipt?",
    triggerGroups: [
      ["recibo", "factura", "ticket", "comprobante", "nota"],
      ["necesita", "requiere", "le doy", "quiere"],
    ],
    section: "Tip", phraseIndex: 5, weight: 0.85,
  },
  {
    intent: "TOTAL_AMOUNT",
    theySaidEnglish: "The total is...",
    triggerGroups: [
      ["total", "total con", "queda en", "serian"],
      ["propina", "servicio"],
    ],
    section: "Tip", phraseIndex: 4, weight: 0.8,
  },
  {
    intent: "CASH_OR_CARD",
    theySaidEnglish: "Cash or card?",
    triggerGroups: [
      ["efectivo", "tarjeta"],
      ["o tarjeta", "o efectivo", "como paga", "forma de pago"],
    ],
    section: "Tip", phraseIndex: 2, weight: 0.88,
  },
];

// ── Fallback "clarify" phrases — never show blank ───────────────────────

const CLARIFY_PHRASES: Record<SpeechMode, Phrase[]> = {
  street: [
    { spanish: "Que dijo?", english: "What did you say?", pronunciation: "keh DEE-hoh" },
    { spanish: "Otra vez?", english: "Again?", pronunciation: "OH-trah vehs" },
    { spanish: "No entendi.", english: "I didn't get that.", pronunciation: "noh ehn-tehn-DEE" },
  ],
  neutral: [
    { spanish: "Perdone, que dijo?", english: "Sorry, what did you say?", pronunciation: "pehr-DOH-neh, keh DEE-hoh" },
    { spanish: "Me puede repetir?", english: "Can you repeat that?", pronunciation: "meh PWEH-deh reh-peh-TEER" },
    { spanish: "No entendi, disculpe.", english: "I didn't understand, sorry.", pronunciation: "noh ehn-tehn-DEE, dees-KOOL-peh" },
  ],
  formal: [
    { spanish: "Disculpe, podria repetir?", english: "Excuse me, could you repeat?", pronunciation: "dees-KOOL-peh, poh-DREE-ah reh-peh-TEER" },
    { spanish: "Perdone, no le entendi.", english: "Sorry, I didn't catch that.", pronunciation: "pehr-DOH-neh, noh leh ehn-tehn-DEE" },
    { spanish: "Me lo podria decir de nuevo?", english: "Could you say that again?", pronunciation: "meh loh poh-DREE-ah deh-SEER deh NWEH-voh" },
  ],
};

// ── Normalizer ──────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,!?;:¿¡'"()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Classifier ──────────────────────────────────────────────────────────

export function classifyIntent(
  transcript: string,
  mode: SpeechMode,
): IntentMatch {
  const normed = normalize(transcript);

  let best: { def: IntentDef; score: number } | null = null;

  for (const def of intents) {
    let groupHits = 0;
    let totalWordHits = 0;

    for (const group of def.triggerGroups) {
      let groupMatched = false;
      for (const trigger of group) {
        const normedTrigger = normalize(trigger);
        if (normed.includes(normedTrigger)) {
          groupMatched = true;
          totalWordHits++;
        }
      }
      if (groupMatched) groupHits++;
    }

    if (groupHits === 0) continue;

    // Score rewards hitting more trigger groups (covering more semantic axes)
    const groupRatio = groupHits / def.triggerGroups.length;
    // Bonus for multi-word phrase matches
    const multiWordBonus = totalWordHits > 1 ? 0.08 : 0;
    // Bonus for matching ALL groups
    const fullMatchBonus = groupHits === def.triggerGroups.length ? 0.12 : 0;
    const score = Math.min(1, def.weight * groupRatio + 0.2 + multiWordBonus + fullMatchBonus);

    if (!best || score > best.score) {
      best = { def, score };
    }
  }

  // If we have a match, return it — constrained to allowed replies for the intent
  if (best && best.score >= 0.35) {
    const sections = fastModePhrasesBySection[mode];
    const constraint = INTENT_REPLY_CONSTRAINTS[best.def.intent];
    const sectionLabel = constraint?.section ?? best.def.section;
    const section = sections.find((s) => s.label === sectionLabel);
    if (section) {
      // Use first allowed reply index, falling back to the intent's default phraseIndex
      const allowedIdx = constraint?.allowedIndices?.[0] ?? best.def.phraseIndex;
      const phrase = section.phrases[allowedIdx] ?? section.phrases[0];
      if (phrase) {
        return {
          confidence: Math.round(best.score * 100) / 100,
          section: sectionLabel,
          intent: best.def.intent,
          phrase,
          theySaidEnglish: best.def.theySaidEnglish,
        };
      }
    }
  }

  // FALLBACK — never return null. Show a "Not sure" response with a clarifying question.
  const clarifyPhrases = CLARIFY_PHRASES[mode];
  const phrase = clarifyPhrases[Math.floor(Math.random() * clarifyPhrases.length)];

  return {
    confidence: 0.15,
    section: "Clarify",
    intent: "UNCLEAR",
    phrase,
    theySaidEnglish: "Not sure what they said.",
  };
}

// ── Section phrase getter ───────────────────────────────────────────────

export function getSectionPhrases(sectionLabel: string, mode: SpeechMode): Phrase[] {
  if (sectionLabel === "Clarify") return CLARIFY_PHRASES[mode];
  const sections = fastModePhrasesBySection[mode];
  const section = sections.find((s) => s.label === sectionLabel);
  return section?.phrases ?? [];
}

/**
 * Get allowed reply phrases for a specific intent, constrained to the allowed indices.
 * Returns only the phrases that are valid for this intent.
 */
export function getConstrainedReplies(intent: string, mode: SpeechMode): Phrase[] {
  const constraint = INTENT_REPLY_CONSTRAINTS[intent];
  if (!constraint) return getSectionPhrases("Clarify", mode);

  const sections = fastModePhrasesBySection[mode];
  const section = sections.find((s) => s.label === constraint.section);
  if (!section) return [];

  return constraint.allowedIndices
    .map((idx) => section.phrases[idx])
    .filter((p): p is Phrase => !!p);
}

// ── Reply keys for LLM classification ───────────────────────────────────

/**
 * Build a map of reply keys to their display text (Spanish + English) for
 * sending to the LLM in the classify prompt.
 */
export function getReplyKeys(mode: SpeechMode): Record<string, string> {
  const keys: Record<string, string> = {};
  const sections = fastModePhrasesBySection[mode];
  for (const section of sections) {
    for (let i = 0; i < section.phrases.length; i++) {
      const p = section.phrases[i];
      const key = `${section.label.toUpperCase()}_${i}`;
      keys[key] = `${p.spanish} (${p.english})`;
    }
  }
  // Add clarify keys
  const clarify = CLARIFY_PHRASES[mode];
  for (let i = 0; i < clarify.length; i++) {
    const p = clarify[i];
    keys[`CLARIFY_${i === 0 ? "REPEAT" : i === 1 ? "AGAIN" : "SORRY"}`] = `${p.spanish} (${p.english})`;
  }
  return keys;
}

/**
 * Resolve a reply key back to a Phrase.
 */
function resolveReplyKey(key: string, mode: SpeechMode): Phrase | null {
  // Parse section and index: e.g. "ARRIVAL_0", "DRINKS_2", "CLARIFY_REPEAT"
  if (key.startsWith("CLARIFY_")) {
    const clarify = CLARIFY_PHRASES[mode];
    if (key === "CLARIFY_REPEAT") return clarify[0] ?? null;
    if (key === "CLARIFY_AGAIN") return clarify[1] ?? null;
    if (key === "CLARIFY_SORRY") return clarify[2] ?? null;
    return clarify[0] ?? null;
  }

  const lastUnderscore = key.lastIndexOf("_");
  if (lastUnderscore === -1) return null;

  const sectionKey = key.substring(0, lastUnderscore);
  const idx = parseInt(key.substring(lastUnderscore + 1), 10);
  if (isNaN(idx)) return null;

  const sections = fastModePhrasesBySection[mode];
  const section = sections.find((s) => s.label.toUpperCase() === sectionKey);
  if (!section) return null;

  return section.phrases[idx] ?? section.phrases[0] ?? null;
}

/** Infer section from reply key */
function sectionFromKey(key: string): string {
  if (key.startsWith("CLARIFY_")) return "Clarify";
  const lastUnderscore = key.lastIndexOf("_");
  if (lastUnderscore === -1) return "Clarify";
  const sectionKey = key.substring(0, lastUnderscore);
  // Map back from uppercase key to proper label
  const map: Record<string, string> = {
    ARRIVAL: "Arrival", DRINKS: "Drinks", FOOD: "Food", BILL: "Bill", TIP: "Tip",
  };
  return map[sectionKey] ?? "Clarify";
}

/**
 * Build an IntentMatch from the LLM classification JSON response.
 * Always returns something usable — never null.
 */
export interface LLMClassifyResponse {
  heard_es?: string;
  meaning_en?: string;
  intent?: string;
  confidence?: number;
  best_reply_key?: string;
  alt_reply_keys?: string[];
  clarifying_reply_key?: string;
}

export function buildIntentMatchFromLLM(
  llmResponse: LLMClassifyResponse,
  mode: SpeechMode,
): { match: IntentMatch; altPhrases: Phrase[] } {
  const confidence = Math.min(1, Math.max(0, llmResponse.confidence ?? 0.3));
  const intent = llmResponse.intent ?? "OTHER";
  const meaningEn = llmResponse.meaning_en ?? "Not sure what they said.";

  // Resolve best reply
  const bestKey = llmResponse.best_reply_key ?? "CLARIFY_REPEAT";
  let phrase = resolveReplyKey(bestKey, mode);
  let section = sectionFromKey(bestKey);

  // If couldn't resolve, use clarify
  if (!phrase) {
    phrase = CLARIFY_PHRASES[mode][0];
    section = "Clarify";
  }

  // Resolve alternatives
  const altPhrases: Phrase[] = [];
  const altKeys = llmResponse.alt_reply_keys ?? [];
  for (const altKey of altKeys) {
    const altPhrase = resolveReplyKey(altKey, mode);
    if (altPhrase && altPhrase.spanish !== phrase.spanish) {
      altPhrases.push(altPhrase);
    }
  }

  // If low confidence and we have a clarifying key, add it
  if (confidence < 0.55 && llmResponse.clarifying_reply_key) {
    const clarifyPhrase = resolveReplyKey(llmResponse.clarifying_reply_key, mode);
    if (clarifyPhrase && !altPhrases.find((p) => p.spanish === clarifyPhrase.spanish) && clarifyPhrase.spanish !== phrase.spanish) {
      altPhrases.push(clarifyPhrase);
    }
  }

  return {
    match: {
      confidence,
      section,
      intent,
      phrase,
      theySaidEnglish: meaningEn,
    },
    altPhrases: altPhrases.slice(0, 4),
  };
}
