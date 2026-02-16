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
}

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
      ["menu", "carta", "la carta"],
      ["quiere", "quieres", "gusta", "gustaria", "le traigo", "necesita", "desea", "quieren"],
    ],
    section: "Food", phraseIndex: 0, weight: 0.88,
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

  // If we have a match, return it
  if (best && best.score >= 0.35) {
    const sections = fastModePhrasesBySection[mode];
    const section = sections.find((s) => s.label === best!.def.section);
    if (section) {
      const phrase = section.phrases[best.def.phraseIndex] ?? section.phrases[0];
      if (phrase) {
        return {
          confidence: Math.round(best.score * 100) / 100,
          section: best.def.section,
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
