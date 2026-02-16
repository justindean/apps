// Restaurant intent classification for Listen mode
// Maps overheard Spanish phrases → best response phrases from our dataset

import type { Phrase, SpeechMode } from "./phrases";
import { fastModePhrasesBySection } from "./phrases";

export interface IntentMatch {
  confidence: number; // 0-1
  section: string;
  phrase: Phrase;
}

interface IntentPattern {
  /** Keywords/fragments to match against transcribed text (lowercased) */
  patterns: string[];
  /** Which fast-mode section this maps to */
  section: string;
  /** Index within that section's phrases array */
  phraseIndex: number;
  /** Base confidence when matched */
  weight: number;
}

// Intent patterns — maps Spanish phrases a waiter might say to our response phrases
const intentPatterns: IntentPattern[] = [
  // Arrival — waiter greets / asks how many
  { patterns: ["cuantos", "cuántos", "cuantas", "cuántas", "personas", "mesa para"], section: "Arrival", phraseIndex: 0, weight: 0.9 },
  { patterns: ["adentro", "afuera", "dentro", "fuera", "interior", "exterior", "terraza"], section: "Arrival", phraseIndex: 2, weight: 0.85 },
  { patterns: ["espera", "esperar", "minutos", "momento", "lista"], section: "Arrival", phraseIndex: 4, weight: 0.8 },
  { patterns: ["bienvenido", "bienvenida", "buenas", "hola", "pase"], section: "Arrival", phraseIndex: 1, weight: 0.7 },

  // Drinks — waiter asks about drinks
  { patterns: ["tomar", "beber", "bebida", "cerveza", "refresco", "algo de tomar"], section: "Drinks", phraseIndex: 0, weight: 0.9 },
  { patterns: ["agua", "mineral", "natural"], section: "Drinks", phraseIndex: 1, weight: 0.85 },
  { patterns: ["otra", "otro", "mas", "más", "repito", "mismo", "misma"], section: "Drinks", phraseIndex: 2, weight: 0.8 },

  // Food — waiter asks about food order
  { patterns: ["ordenar", "pedir", "orden", "platillo", "plato", "comer", "listo para"], section: "Food", phraseIndex: 0, weight: 0.9 },
  { patterns: ["picante", "picoso", "chile", "salsa", "pica"], section: "Food", phraseIndex: 1, weight: 0.85 },
  { patterns: ["compartir", "para compartir", "para los dos"], section: "Food", phraseIndex: 2, weight: 0.8 },

  // Bill — waiter asks about payment
  { patterns: ["cuenta", "pagar", "cobrar", "total", "efectivo", "tarjeta"], section: "Bill", phraseIndex: 0, weight: 0.9 },
  { patterns: ["junto", "juntos", "una sola", "separado", "separada", "dividir"], section: "Bill", phraseIndex: 1, weight: 0.85 },
  { patterns: ["cambio", "propina", "vuelta"], section: "Bill", phraseIndex: 3, weight: 0.8 },

  // General service
  { patterns: ["algo mas", "algo más", "necesita", "necesitan", "desea", "desean", "ofrece"], section: "Food", phraseIndex: 0, weight: 0.6 },
  { patterns: ["todo bien", "está bien", "le gusta", "les gusta"], section: "Arrival", phraseIndex: 1, weight: 0.5 },
];

/**
 * Classify transcribed Spanish text against our intent patterns
 * and return the best matching response phrase.
 */
export function classifyIntent(
  transcript: string,
  mode: SpeechMode,
): IntentMatch | null {
  const lower = transcript.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const lowerOriginal = transcript.toLowerCase();

  let bestMatch: (IntentPattern & { score: number }) | null = null;

  for (const intent of intentPatterns) {
    let matchCount = 0;
    for (const pattern of intent.patterns) {
      const normalizedPattern = pattern.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (lower.includes(normalizedPattern) || lowerOriginal.includes(pattern)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      // Score: base weight * (matched patterns / total patterns), capped at weight
      const score = Math.min(intent.weight, (matchCount / intent.patterns.length) * intent.weight + 0.2);
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { ...intent, score };
      }
    }
  }

  if (!bestMatch || bestMatch.score < 0.3) return null;

  const sections = fastModePhrasesBySection[mode];
  const section = sections.find((s) => s.label === bestMatch!.section);
  if (!section) return null;

  const phrase = section.phrases[bestMatch.phraseIndex];
  if (!phrase) return null;

  return {
    confidence: bestMatch.score,
    section: bestMatch.section,
    phrase,
  };
}

/**
 * Get all phrases for a section (for showing alternatives)
 */
export function getSectionPhrases(sectionLabel: string, mode: SpeechMode): Phrase[] {
  const sections = fastModePhrasesBySection[mode];
  const section = sections.find((s) => s.label === sectionLabel);
  return section?.phrases ?? [];
}
