/**
 * Restaurant intent classification for Listen mode — v3
 *
 * Self-contained intent+reply system. Each intent owns its own set of allowed
 * replies. No cross-referencing `fastModePhrasesBySection`. The classifier
 * returns a `ListenMatch` with the best reply + 2 alternates, and NEVER
 * returns null.
 *
 * LLM fallback uses the exact same intent list + reply sets.
 */

// ── Core types ──────────────────────────────────────────────────────────

export interface ListenReply {
  spanish: string;
  english: string;
  pronunciation: string;
}

export interface ListenMatch {
  intent: string;
  english: string;        // what they meant in English
  confidence: number;     // 0–100
  keywords: string[];     // detected trigger words (for debug)
  bestReply: ListenReply;
  alternates: ListenReply[];
  section: string;        // UI section color key
}

// ── Intent definitions ──────────────────────────────────────────────────

interface IntentDef {
  intent: string;
  englishMeaning: string;
  /** Keyword groups — matching any word in a group counts as 1 hit. More groups hit = higher confidence. */
  triggerGroups: string[][];
  replies: ListenReply[];
  section: string;
  weight: number; // base confidence weight (0–1)
}

// ── Reply sets by intent ────────────────────────────────────────────────
// These are "neutral" tone. The tone-aware versions are generated below.

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
  drinks_offer: [
    { spanish: "Agua, por favor.", english: "Water, please.", pronunciation: "AH-gwah, por fah-VOR" },
    { spanish: "Una cerveza, por favor.", english: "A beer, please.", pronunciation: "OO-nah ser-VEH-sah, por fah-VOR" },
    { spanish: "Nada, gracias.", english: "Nothing, thanks.", pronunciation: "NAH-dah, GRAH-see-ahs" },
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

  // ── Smalltalk ──
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
  drinks_offer: "Drinks",
  anything_else: "Food",
  check_in_food: "Food",
  bill_offer: "Bill",
  payment_method: "Bill",
  tip_service: "Tip",
  receipt: "Tip",
  not_available: "Food",
  clarification: "Clarify",
  unknown: "Clarify",
  smalltalk_origin: "Smalltalk",
  smalltalk_live_here: "Smalltalk",
  smalltalk_first_time: "Smalltalk",
  smalltalk_enjoying: "Smalltalk",
};

// ── Intent definitions with trigger groups ───────────────────────────────

const INTENTS: IntentDef[] = [
  // ── Greeting ──
  {
    intent: "greeting",
    englishMeaning: "Hello! Welcome!",
    triggerGroups: [
      ["hola", "buenas", "buenas tardes", "buenas noches", "bienvenido", "bienvenida", "bienvenidos", "pase", "pasen", "adelante"],
    ],
    replies: REPLY_SETS.greeting,
    section: "Arrival",
    weight: 0.7,
  },

  // ── Party size ──
  {
    intent: "party_size",
    englishMeaning: "How many people?",
    triggerGroups: [
      ["cuantos", "cuantas", "para cuantos", "mesa para"],
      ["son", "personas", "gente", "vienen"],
    ],
    replies: REPLY_SETS.party_size,
    section: "Arrival",
    weight: 0.92,
  },

  // ── Table preference ──
  {
    intent: "table_preference",
    englishMeaning: "Inside or outside?",
    triggerGroups: [
      ["adentro", "dentro", "interior", "salon"],
      ["afuera", "fuera", "exterior", "terraza", "jardin"],
    ],
    replies: REPLY_SETS.table_preference,
    section: "Arrival",
    weight: 0.92,
  },

  // ── Menu offer ──
  {
    intent: "menu_offer",
    englishMeaning: "Would you like a menu?",
    triggerGroups: [
      ["menu", "carta", "la carta"],
      ["quiere", "quieres", "gusta", "gustaria", "le traigo", "te traigo", "necesita", "desea", "quieren"],
    ],
    replies: REPLY_SETS.menu_offer,
    section: "Menu",
    weight: 0.92,
  },

  // ── Drinks offer ──
  {
    intent: "drinks_offer",
    englishMeaning: "What would you like to drink?",
    triggerGroups: [
      ["tomar", "beber", "bebida", "cerveza", "chela"],
      ["algo de tomar", "para tomar", "les traigo", "les ofrezco", "desea tomar", "quiere tomar", "van a tomar"],
    ],
    replies: REPLY_SETS.drinks_offer,
    section: "Drinks",
    weight: 0.92,
  },

  // ── Order ready ──
  {
    intent: "order_ready",
    englishMeaning: "Are you ready to order?",
    triggerGroups: [
      ["ordenar", "pedir", "orden"],
      ["listo", "listos", "ya saben", "les tomo", "van a pedir", "que desean", "van a ordenar"],
    ],
    replies: REPLY_SETS.order_ready,
    section: "Food",
    weight: 0.92,
  },

  // ── Order items (what specifically) ──
  {
    intent: "order_items",
    englishMeaning: "What would you like to have?",
    triggerGroups: [
      ["recomiendo", "especialidad", "le sugiero", "plato del dia", "especial", "popular", "lo mas pedido"],
    ],
    replies: REPLY_SETS.order_items,
    section: "Food",
    weight: 0.7,
  },

  // ── ANYTHING ELSE (critical — "algo mas", "nada mas", "quieres algo mas") ──
  {
    intent: "anything_else",
    englishMeaning: "Would you like anything else?",
    triggerGroups: [
      ["algo mas", "nada mas", "otra cosa", "algo mas para", "falta algo", "le traigo algo", "necesita algo", "necesitan algo", "quieres algo", "quieren algo", "desea algo"],
    ],
    replies: REPLY_SETS.anything_else,
    section: "Food",
    weight: 0.95, // High weight — this is a common trigger
  },

  // ── Check in on food ──
  {
    intent: "check_in_food",
    englishMeaning: "How is everything?",
    triggerGroups: [
      ["todo bien", "que tal", "como esta todo", "como va todo", "les gusto", "todo en orden", "como esta"],
    ],
    replies: REPLY_SETS.check_in_food,
    section: "Food",
    weight: 0.8,
  },

  // ── Bill offer ──
  {
    intent: "bill_offer",
    englishMeaning: "Would you like the check?",
    triggerGroups: [
      ["cuenta", "la cuenta", "su cuenta", "les traigo la cuenta"],
      ["total", "son", "pesos", "cobrar"],
    ],
    replies: REPLY_SETS.bill_offer,
    section: "Bill",
    weight: 0.88,
  },

  // ── Payment method ──
  {
    intent: "payment_method",
    englishMeaning: "How would you like to pay?",
    triggerGroups: [
      ["tarjeta", "efectivo", "terminal", "forma de pago", "metodo de pago", "como va a pagar", "como paga"],
    ],
    replies: REPLY_SETS.payment_method,
    section: "Bill",
    weight: 0.88,
  },

  // ── Tip / service ──
  {
    intent: "tip_service",
    englishMeaning: "Would you like to add a tip?",
    triggerGroups: [
      ["propina", "servicio", "incluimos servicio", "cuanto de propina", "agregar servicio"],
    ],
    replies: REPLY_SETS.tip_service,
    section: "Tip",
    weight: 0.92,
  },

  // ── Receipt ──
  {
    intent: "receipt",
    englishMeaning: "Do you need a receipt?",
    triggerGroups: [
      ["recibo", "factura", "ticket", "comprobante", "nota", "requiere factura"],
    ],
    replies: REPLY_SETS.receipt,
    section: "Tip",
    weight: 0.85,
  },

  // ── Not available ──
  {
    intent: "not_available",
    englishMeaning: "Sorry, that's not available.",
    triggerGroups: [
      ["no hay", "se termino", "no tenemos", "se acabo", "ya no hay", "no queda"],
    ],
    replies: REPLY_SETS.not_available,
    section: "Food",
    weight: 0.85,
  },

  // ── Clarification (they ask you to repeat) ──
  {
    intent: "clarification",
    englishMeaning: "Could you repeat that?",
    triggerGroups: [
      ["repetir", "otra vez", "como dijo", "que dijo", "mande", "perdon"],
    ],
    replies: REPLY_SETS.clarification,
    section: "Clarify",
    weight: 0.7,
  },

  // ── Smalltalk: where are you from? ──
  {
    intent: "smalltalk_origin",
    englishMeaning: "Where are you from?",
    triggerGroups: [
      ["de donde eres", "de donde vienes", "de donde son", "de donde viene", "de donde es"],
    ],
    replies: REPLY_SETS.smalltalk_origin,
    section: "Smalltalk",
    weight: 0.92,
  },

  // ── Smalltalk: do you live here? ──
  {
    intent: "smalltalk_live_here",
    englishMeaning: "Do you live here?",
    triggerGroups: [
      ["vives aqui", "vive aqui", "viven aqui", "vives aca", "radicas aqui"],
    ],
    replies: REPLY_SETS.smalltalk_live_here,
    section: "Smalltalk",
    weight: 0.92,
  },

  // ── Smalltalk: is it your first time? ──
  {
    intent: "smalltalk_first_time",
    englishMeaning: "Is it your first time here?",
    triggerGroups: [
      ["primera vez", "primer vez", "primera visita", "ya habias venido", "habias estado"],
    ],
    replies: REPLY_SETS.smalltalk_first_time,
    section: "Smalltalk",
    weight: 0.92,
  },

  // ── Smalltalk: are you enjoying it? ──
  {
    intent: "smalltalk_enjoying",
    englishMeaning: "Are you enjoying Mexico?",
    triggerGroups: [
      ["te gusta", "te esta gustando", "les gusta", "les esta gustando", "que te parece", "como la estas pasando", "te encanta"],
      ["mexico", "ciudad", "pais", "cdmx", "aqui"],
    ],
    replies: REPLY_SETS.smalltalk_enjoying,
    section: "Smalltalk",
    weight: 0.88,
  },
];

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

// ── Fast-path shortcuts (no AI needed) ──────────────────────────────────

const FAST_PATHS: { pattern: RegExp; intent: string; english: string }[] = [
  { pattern: /\b(algo\s*mas|nada\s*mas|quieres?\s*algo|quieren\s*algo|otra\s*cosa|algo\s*mas\s*para)\b/i, intent: "anything_else", english: "Would you like anything else?" },
  { pattern: /\b(todo\s*bien|como\s*esta\s*todo|que\s*tal|como\s*va)\b/i, intent: "check_in_food", english: "How is everything?" },
  { pattern: /\b(adentro|afuera|terraza|interior|exterior)\b/i, intent: "table_preference", english: "Inside or outside?" },
  { pattern: /\b(cuantos\s*son|para\s*cuantos|mesa\s*para)\b/i, intent: "party_size", english: "How many people?" },
  { pattern: /\b(tarjeta\s*o\s*efectivo|efectivo\s*o\s*tarjeta|como\s*va\s*a\s*pagar)\b/i, intent: "payment_method", english: "Cash or card?" },
  { pattern: /\b(propina|servicio|incluimos\s*servicio)\b/i, intent: "tip_service", english: "Would you like to add a tip?" },
  { pattern: /\b(la\s*cuenta|su\s*cuenta|les\s*traigo\s*la\s*cuenta)\b/i, intent: "bill_offer", english: "Here's the check." },
  { pattern: /\b(no\s*hay|se\s*termino|no\s*tenemos|ya\s*no\s*hay)\b/i, intent: "not_available", english: "Sorry, that's not available." },
  { pattern: /\b(recibo|factura|ticket|comprobante)\b/i, intent: "receipt", english: "Do you need a receipt?" },
  // Smalltalk
  { pattern: /\b(de\s+donde\s+eres|de\s+donde\s+vienes|de\s+donde\s+son|de\s+donde\s+es)\b/i, intent: "smalltalk_origin", english: "Where are you from?" },
  { pattern: /\b(vives?\s+aqui|vives?\s+aca|viven\s+aqui)\b/i, intent: "smalltalk_live_here", english: "Do you live here?" },
  { pattern: /\b(primera\s+vez|primer\s+vez|primera\s+visita)\b/i, intent: "smalltalk_first_time", english: "Is it your first time?" },
  { pattern: /\b(te\s+gusta\s+mexico|te\s+esta\s+gustando|les\s+gusta\s+mexico|como\s+la\s+estas\s+pasando)\b/i, intent: "smalltalk_enjoying", english: "Are you enjoying Mexico?" },
];

// ── Classifier ──────────────────────────────────────────────────────────

export function classifyIntent(transcript: string): ListenMatch {
  const normed = normalize(transcript);

  // ── FAST PATH: regex shortcuts for common phrases ──
  for (const fp of FAST_PATHS) {
    if (fp.pattern.test(normed)) {
      const replies = REPLY_SETS[fp.intent] ?? REPLY_SETS.unknown;
      return {
        intent: fp.intent,
        english: fp.english,
        confidence: 85,
        keywords: [normed.match(fp.pattern)?.[0] ?? ""],
        bestReply: replies[0],
        alternates: replies.slice(1, 3),
        section: INTENT_TO_SECTION[fp.intent] ?? "Clarify",
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
        const normedTrigger = normalize(trigger);
        if (normed.includes(normedTrigger)) {
          groupMatched = true;
          matchedWords.push(trigger);
        }
      }
      if (groupMatched) groupHits++;
    }

    if (groupHits === 0) continue;

    const groupRatio = groupHits / def.triggerGroups.length;
    const multiWordBonus = matchedWords.length > 1 ? 0.08 : 0;
    const fullMatchBonus = groupHits === def.triggerGroups.length ? 0.12 : 0;
    const score = Math.min(1, def.weight * groupRatio + 0.2 + multiWordBonus + fullMatchBonus);

    if (!best || score > best.score) {
      best = { def, score, matchedWords };
    }
  }

  if (best && best.score >= 0.35) {
    const confidence = Math.round(best.score * 100);
    const replies = best.def.replies;
    return {
      intent: best.def.intent,
      english: best.def.englishMeaning,
      confidence,
      keywords: best.matchedWords,
      bestReply: replies[0],
      alternates: replies.slice(1, 3),
      section: best.def.section,
    };
  }

  // ── FALLBACK — unknown ──
  const replies = REPLY_SETS.unknown;
  return {
    intent: "unknown",
    english: "Not sure what they said.",
    confidence: 15,
    keywords: [],
    bestReply: replies[0],
    alternates: replies.slice(1, 3),
    section: "Clarify",
  };
}

// ── Get replies for a specific intent ───────────────────────────────────

export function getRepliesForIntent(intent: string): ListenReply[] {
  return REPLY_SETS[intent] ?? REPLY_SETS.unknown;
}

// ── Build LLM system + user prompts ─────────────────────────────────────

export const LLM_SYSTEM_PROMPT = `You are TapHabla's Listen Mode brain for the Restaurant situation.

Goal: Given a short Spanish transcript (often imperfect), determine:
1) What they likely meant (English)
2) The intent (from a fixed list)
3) The best Spanish reply the user should say (from allowed replies only)
4) 2 alternate replies (from allowed replies only)
5) A match confidence (0-100)
6) A small set of keywords you detected (for debugging)

Rules:
- Output must be VALID JSON only. No extra text.
- Be concise. No explanations.
- Do NOT invent long replies. Keep Spanish replies short and natural for Mexico.
- If transcript is imperfect, infer using restaurant context.
- If intent is clear, choose a reply even if transcript is messy.
- Never pick a reply that doesn't fit the intent.
- Use the provided allowed replies by intent exactly; do not paraphrase them.
- Prefer restaurant-specific intents, BUT you MUST also handle common small-talk questions that happen in restaurants.
- If transcript is a clear personal question (e.g., "De donde eres?"), do NOT return unknown. Use a smalltalk intent.
- If no intent fits, use intent "unknown" and reply "Puede repetir, por favor?"

INTENTS (choose exactly one):
- menu_offer
- table_preference
- party_size
- greeting
- order_ready
- order_items
- drinks_offer
- anything_else   (IMPORTANT: "Quieres algo mas?", "Algo mas?", "Algo mas para tomar/comer?")
- check_in_food    ("Que tal?", "Como esta todo?", "Todo bien?")
- bill_offer       ("La cuenta?", "Les traigo la cuenta?")
- payment_method   ("Tarjeta o efectivo?", "Como va a pagar?")
- tip_service      ("Servicio?", "Propina?", "Incluimos servicio?", "Cuanto de propina?")
- receipt          ("Requiere factura/recibo?")
- not_available    ("No hay", "Se termino", "No tenemos")
- clarification    (they ask you to repeat/confirm)
- smalltalk_origin      ("De donde eres?", "De donde vienes?")
- smalltalk_live_here   ("Vives aqui?", "Vive aqui?")
- smalltalk_first_time  ("Es tu primera vez?", "Primera vez en Mexico?")
- smalltalk_enjoying    ("Te gusta Mexico?", "Te esta gustando?", "Como la estas pasando?")
- unknown

ALLOWED REPLIES BY INTENT (choose best + 2 alternates from the same intent list):

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

drinks_offer:
- "Agua, por favor."
- "Una cerveza, por favor."
- "Nada, gracias."

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

unknown:
- "Puede repetir, por favor?"
- "Mas despacio, por favor."
- "No entiendo, puede decirlo de otra forma?"

OUTPUT JSON SCHEMA:
{
  "intent": "<one intent>",
  "english": "<short natural English meaning>",
  "keywords": ["<keyword1>", "<keyword2>"],
  "confidence": <0-100>,
  "best_reply": "<one allowed reply>",
  "alternates": ["<allowed reply>", "<allowed reply>"]
}`;

export function buildLLMUserPrompt(transcript: string): string {
  return `Transcript: "${transcript}"\nTone: Neutral`;
}

// ── Step 2: Reply Generator prompt (used when intent is already known) ──

/** Build allowed replies section for a specific intent */
function buildAllowedRepliesForIntent(intent: string): string {
  const replies = REPLY_SETS[intent] ?? REPLY_SETS.unknown;
  return replies.map((r) => `- "${r.spanish}"`).join("\n");
}

export function buildReplyGeneratorSystemPrompt(intent: string): string {
  const allowedReplies = buildAllowedRepliesForIntent(intent);
  return `You are TapHabla Reply Generator for Restaurant Listen Mode.

You will be given:
- intent (already determined)
- transcript (Spanish, may be imperfect)
- tone (Street/Neutral/Formal)

Your job:
1) Provide a short English meaning of what they said.
2) Choose the best reply AND 2 alternates FROM THE ALLOWED REPLIES for that intent only.

Hard rules:
- Output valid JSON only.
- Never output "unknown" or "not sure" if intent is not unknown.
- If intent is "${intent}", you MUST pick replies from ${intent} ONLY.
- Keep replies short, natural for Mexico.
- No extra commentary.

ALLOWED REPLIES for ${intent}:
${allowedReplies}

OUTPUT JSON:
{
  "english": "<short English meaning>",
  "best_reply": "<one allowed reply>",
  "alternates": ["<allowed reply>", "<allowed reply>"]
}`;
}

export function buildReplyGeneratorUserPrompt(intent: string, transcript: string, tone: string = "Neutral"): string {
  return `intent: ${intent}\ntranscript: "${transcript}"\ntone: ${tone}`;
}

/** Parse reply generator response into a ListenMatch */
export function buildListenMatchFromReplyGenerator(
  intent: string,
  data: { english?: string; best_reply?: string; alternates?: string[]; error?: string },
  fallbackEnglish: string,
): ListenMatch {
  const english = data.english ?? fallbackEnglish;
  const section = INTENT_TO_SECTION[intent] ?? "Clarify";
  const replies = REPLY_SETS[intent] ?? REPLY_SETS.unknown;

  let bestReply = data.best_reply ? resolveReply(data.best_reply, intent) : null;
  if (!bestReply) bestReply = replies[0];

  const alternates: ListenReply[] = [];
  if (data.alternates) {
    for (const alt of data.alternates) {
      const resolved = resolveReply(alt, intent);
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
    intent,
    english,
    confidence: 90, // High confidence since intent is already known
    keywords: [],
    bestReply,
    alternates: alternates.slice(0, 2),
    section,
  };
}

// ── Parse LLM response back into a ListenMatch ─────────────────────────

export interface LLMListenResponse {
  intent?: string;
  english?: string;
  keywords?: string[];
  confidence?: number;
  best_reply?: string;
  alternates?: string[];
  error?: string;
}

/** Resolve a Spanish reply string back to a ListenReply object */
function resolveReply(spanish: string, intent: string): ListenReply | null {
  const normed = normalize(spanish);
  const replies = REPLY_SETS[intent] ?? REPLY_SETS.unknown;
  for (const r of replies) {
    if (normalize(r.spanish) === normed) return r;
  }
  // Fuzzy: check if the reply starts with the same first 3 words
  const first3 = normed.split(" ").slice(0, 3).join(" ");
  for (const r of replies) {
    if (normalize(r.spanish).startsWith(first3)) return r;
  }
  return null;
}

export function buildListenMatchFromLLM(data: LLMListenResponse): ListenMatch {
  const intent = data.intent ?? "unknown";
  const english = data.english ?? "Not sure what they said.";
  const confidence = Math.max(0, Math.min(100, data.confidence ?? 15));
  const keywords = data.keywords ?? [];
  const section = INTENT_TO_SECTION[intent] ?? "Clarify";
  const replies = REPLY_SETS[intent] ?? REPLY_SETS.unknown;

  // Resolve best reply
  let bestReply = data.best_reply ? resolveReply(data.best_reply, intent) : null;
  if (!bestReply) bestReply = replies[0];

  // Resolve alternates
  const alternates: ListenReply[] = [];
  if (data.alternates) {
    for (const alt of data.alternates) {
      const resolved = resolveReply(alt, intent);
      if (resolved && resolved.spanish !== bestReply.spanish) {
        alternates.push(resolved);
      }
    }
  }
  // Fill alternates from reply set if needed
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
    confidence,
    keywords,
    bestReply,
    alternates: alternates.slice(0, 2),
    section,
  };
}
