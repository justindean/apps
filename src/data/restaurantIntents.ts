// Restaurant intent classification for Listen mode
// Maps overheard Spanish phrases a waiter might say → best response from our phrase dataset

import type { Phrase, SpeechMode } from "./phrases";
import { fastModePhrasesBySection } from "./phrases";

export interface IntentMatch {
  confidence: number;
  section: string;
  intent: string;
  phrase: Phrase;
  theySaidEnglish: string;   // What they said, in plain English for the user
}

// ── Intent definitions ──────────────────────────────────────────────────
// Each entry maps a set of trigger patterns (words/fragments a waiter says)
// to a section + phrase index in our fast-mode dataset, plus an English
// translation of what the waiter likely meant.

interface IntentDef {
  intent: string;
  /** English summary of what the waiter is saying */
  theySaidEnglish: string;
  /** Keywords to match (lowercased, accent-stripped). More matches = higher score */
  triggers: string[];
  /** Which fast-mode section label this maps to */
  section: string;
  /** Index into that section's phrase array */
  phraseIndex: number;
  /** Base confidence weight (0-1) */
  weight: number;
}

const intents: IntentDef[] = [
  // ── ARRIVAL ─────────────────────────────────────────────
  {
    intent: "HOW_MANY",
    theySaidEnglish: "How many people?",
    triggers: ["cuantos", "cuantas", "personas", "mesa para", "cuantos son", "cuantas personas"],
    section: "Arrival", phraseIndex: 0, weight: 0.92,
  },
  {
    intent: "WELCOME",
    theySaidEnglish: "Welcome, come in.",
    triggers: ["bienvenido", "bienvenida", "bienvenidos", "buenas tardes", "buenas noches", "hola", "pase", "pasen", "adelante"],
    section: "Arrival", phraseIndex: 1, weight: 0.7,
  },
  {
    intent: "INSIDE_OUTSIDE",
    theySaidEnglish: "Inside or outside?",
    triggers: ["adentro", "afuera", "dentro", "fuera", "interior", "exterior", "terraza", "jardin", "salon"],
    section: "Arrival", phraseIndex: 2, weight: 0.88,
  },
  {
    intent: "THIS_TABLE",
    theySaidEnglish: "How about this table?",
    triggers: ["esta mesa", "aqui esta bien", "esta le gusta", "les parece", "esta bien aqui"],
    section: "Arrival", phraseIndex: 1, weight: 0.82,
  },
  {
    intent: "WAIT_TIME",
    theySaidEnglish: "There's a wait.",
    triggers: ["espera", "esperar", "minutos", "momento", "lista de espera", "no hay mesa", "lleno", "ocupado", "tarda"],
    section: "Arrival", phraseIndex: 4, weight: 0.85,
  },

  // ── DRINKS ──────────────────────────────────────────────
  {
    intent: "DRINK_ASK",
    theySaidEnglish: "What would you like to drink?",
    triggers: ["tomar", "beber", "bebida", "algo de tomar", "para tomar", "que les traigo", "les ofrezco", "desea tomar", "quiere tomar", "van a tomar"],
    section: "Drinks", phraseIndex: 0, weight: 0.92,
  },
  {
    intent: "DRINK_WATER",
    theySaidEnglish: "Water?",
    triggers: ["agua", "mineral", "natural", "agua natural", "agua mineral", "con gas", "sin gas"],
    section: "Drinks", phraseIndex: 1, weight: 0.82,
  },
  {
    intent: "DRINK_REFILL",
    theySaidEnglish: "Would you like another one?",
    triggers: ["otra", "otro", "mas", "repito", "mismo", "misma", "le traigo otra", "le traigo otro", "quiere otra", "una mas"],
    section: "Drinks", phraseIndex: 2, weight: 0.85,
  },
  {
    intent: "DRINK_BEER",
    theySaidEnglish: "What beer would you like?",
    triggers: ["cerveza", "chela", "clara", "oscura", "de barril", "que cerveza", "cervezas"],
    section: "Drinks", phraseIndex: 0, weight: 0.8,
  },

  // ── FOOD ────────────────────────────────────────────────
  {
    intent: "READY_TO_ORDER",
    theySaidEnglish: "Are you ready to order?",
    triggers: ["ordenar", "pedir", "orden", "listo", "listos", "listo para", "van a ordenar", "ya saben", "les tomo la orden", "que van a pedir", "que desean", "que les traigo"],
    section: "Food", phraseIndex: 0, weight: 0.92,
  },
  {
    intent: "SPICE_ASK",
    theySaidEnglish: "Spicy okay?",
    triggers: ["picante", "picoso", "chile", "salsa", "pica", "enchilado", "le pone salsa", "con chile"],
    section: "Food", phraseIndex: 1, weight: 0.88,
  },
  {
    intent: "SHARE_ASK",
    theySaidEnglish: "For sharing?",
    triggers: ["compartir", "para compartir", "para los dos", "entre los dos", "a la mitad"],
    section: "Food", phraseIndex: 2, weight: 0.82,
  },
  {
    intent: "FOOD_SUGGEST",
    theySaidEnglish: "I recommend this dish.",
    triggers: ["recomiendo", "especialidad", "le sugiero", "lo mas pedido", "plato del dia", "especial", "popular"],
    section: "Food", phraseIndex: 0, weight: 0.7,
  },
  {
    intent: "ANYTHING_ELSE_FOOD",
    theySaidEnglish: "Anything else?",
    triggers: ["algo mas", "necesita", "necesitan", "ofrece", "le traigo algo", "otra cosa", "desea algo mas", "falta algo"],
    section: "Food", phraseIndex: 0, weight: 0.65,
  },
  {
    intent: "FOOD_HOW_IS_IT",
    theySaidEnglish: "How is everything?",
    triggers: ["todo bien", "esta bien", "le gusta", "les gusta", "que tal", "como esta", "como va", "les gusto", "satisfecho"],
    section: "Arrival", phraseIndex: 1, weight: 0.55,
  },

  // ── BILL / PAYMENT ──────────────────────────────────────
  {
    intent: "BRING_CHECK",
    theySaidEnglish: "Here's the check.",
    triggers: ["cuenta", "aqui esta la cuenta", "su cuenta", "el total", "son", "pesos"],
    section: "Bill", phraseIndex: 0, weight: 0.88,
  },
  {
    intent: "HOW_PAY",
    theySaidEnglish: "How would you like to pay?",
    triggers: ["pagar", "cobrar", "efectivo", "tarjeta", "como va a pagar", "forma de pago", "metodo de pago", "terminal"],
    section: "Bill", phraseIndex: 0, weight: 0.85,
  },
  {
    intent: "SEPARATE_CHECK",
    theySaidEnglish: "Together or separate?",
    triggers: ["junto", "juntos", "una sola", "separado", "separada", "dividir", "dividimos", "separar la cuenta"],
    section: "Bill", phraseIndex: 1, weight: 0.88,
  },
  {
    intent: "CHANGE",
    theySaidEnglish: "Here's your change.",
    triggers: ["cambio", "vuelta", "su cambio", "aqui tiene", "le debo"],
    section: "Bill", phraseIndex: 0, weight: 0.7,
  },

  // ── TIP ─────────────────────────────────────────────────
  {
    intent: "TIP_ASK",
    theySaidEnglish: "Would you like to add a tip?",
    triggers: ["propina", "servicio", "agregar servicio", "dejar propina", "gusta agregar", "le pongo", "le agrego", "desea dejar", "con cuanto", "cuanto desea dejar"],
    section: "Tip", phraseIndex: 0, weight: 0.92,
  },
  {
    intent: "TIP_PERCENT",
    theySaidEnglish: "Add 10%?",
    triggers: ["el diez", "diez por ciento", "quince por ciento", "veinte por ciento", "porcentaje", "el 10", "el 15", "el 20"],
    section: "Tip", phraseIndex: 0, weight: 0.9,
  },
  {
    intent: "TIP_RECEIPT",
    theySaidEnglish: "Do you need a receipt?",
    triggers: ["recibo", "factura", "ticket", "comprobante", "nota", "necesita factura", "requiere factura"],
    section: "Tip", phraseIndex: 5, weight: 0.85,
  },
  {
    intent: "TIP_TOTAL",
    theySaidEnglish: "The total is...",
    triggers: ["total", "total con propina", "total con servicio", "queda en", "serian"],
    section: "Tip", phraseIndex: 4, weight: 0.8,
  },
  {
    intent: "CASH_OR_CARD",
    theySaidEnglish: "Cash or card?",
    triggers: ["efectivo o tarjeta", "como paga", "forma de pago", "tarjeta o efectivo"],
    section: "Tip", phraseIndex: 2, weight: 0.88,
  },
];

// ── Normalizer ──────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // strip accents
    .replace(/[.,!?;:]/g, "")          // strip punctuation
    .trim();
}

// ── Classifier ──────────────────────────────────────────────────────────

export function classifyIntent(
  transcript: string,
  mode: SpeechMode,
): IntentMatch | null {
  const normed = normalize(transcript);
  const original = transcript.toLowerCase();

  let best: { def: IntentDef; score: number } | null = null;

  for (const def of intents) {
    let hits = 0;
    for (const trigger of def.triggers) {
      const normedTrigger = normalize(trigger);
      if (normed.includes(normedTrigger) || original.includes(trigger)) {
        hits++;
      }
    }

    if (hits === 0) continue;

    // Score = weight * (hits/totalTriggers) + bonus for multi-word matches
    const ratio = hits / def.triggers.length;
    const multiWordBonus = def.triggers.some(t => t.includes(" ") && normed.includes(normalize(t))) ? 0.1 : 0;
    const score = Math.min(1, def.weight * ratio + 0.25 + multiWordBonus);

    if (!best || score > best.score) {
      best = { def, score };
    }
  }

  if (!best || best.score < 0.35) return null;

  const sections = fastModePhrasesBySection[mode];
  const section = sections.find((s) => s.label === best!.def.section);
  if (!section) return null;

  const phrase = section.phrases[best.def.phraseIndex];
  if (!phrase) return null;

  return {
    confidence: Math.round(best.score * 100) / 100,
    section: best.def.section,
    intent: best.def.intent,
    phrase,
    theySaidEnglish: best.def.theySaidEnglish,
  };
}

// ── Section phrase getter ───────────────────────────────────────────────

export function getSectionPhrases(sectionLabel: string, mode: SpeechMode): Phrase[] {
  const sections = fastModePhrasesBySection[mode];
  const section = sections.find((s) => s.label === sectionLabel);
  return section?.phrases ?? [];
}
