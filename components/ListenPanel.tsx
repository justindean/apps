import { useState, useRef, useCallback, useEffect } from "react";
import type { Phrase, SpeechMode } from "@/data/phrases";
import { validateAndBuildFromLLM, normalizeTranscript } from "@/data/restaurantIntents";
import type { ListenMatch, ListenReply, LLMListenResponse } from "@/data/restaurantIntents";
import { getContextSystemPrompt, labelToContextKey, type ContextKey } from "@/data/contextPrompts";

/* ── TTS Cache & Prefetch ── */
type AudioStatus = "idle" | "loading" | "ready" | "error";
interface AudioCacheEntry {
  status: AudioStatus;
  blobUrl?: string;
  promise?: Promise<string | null>;
}
const ttsCache = new Map<string, AudioCacheEntry>();

// Prefetch audio for a phrase - returns immediately, loads in background
function prefetchTTS(text: string, voice: "daniel" | "mila" = "daniel"): void {
  const cacheKey = `${voice}:${text}`;
  if (ttsCache.has(cacheKey)) return; // Already cached or loading
  
  const entry: AudioCacheEntry = { status: "loading" };
  const fetchPromise = fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("TTS failed");
      return res.blob();
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      entry.status = "ready";
      entry.blobUrl = blobUrl;
      return blobUrl;
    })
    .catch(() => {
      entry.status = "error";
      return null;
    });
  
  entry.promise = fetchPromise;
  ttsCache.set(cacheKey, entry);
}

// Get current status of TTS for a phrase
function getTTSStatus(text: string, voice: "daniel" | "mila" = "daniel"): AudioStatus {
  const cacheKey = `${voice}:${text}`;
  return ttsCache.get(cacheKey)?.status ?? "idle";
}

// Get blob URL if ready
function getTTSBlobUrl(text: string, voice: "daniel" | "mila" = "daniel"): string | null {
  const cacheKey = `${voice}:${text}`;
  const entry = ttsCache.get(cacheKey);
  return entry?.status === "ready" ? entry.blobUrl ?? null : null;
}

// Play audio - uses cached blob if available, otherwise browser TTS fallback
let currentAudio: HTMLAudioElement | null = null;
function speakPhrase(text: string, voice: "daniel" | "mila" = "daniel") {
  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  window.speechSynthesis?.cancel();
  
  const blobUrl = getTTSBlobUrl(text, voice);
  if (blobUrl) {
    const audio = new Audio(blobUrl);
    currentAudio = audio;
    audio.play().catch(() => {
      // Fallback to browser TTS if play fails
      browserTTS(text);
    });
  } else {
    // No cached audio - use browser TTS and trigger prefetch for next time
    browserTTS(text);
    prefetchTTS(text, voice);
  }
}

function browserTTS(text: string) {
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-MX";
    u.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
}

/* ── Icons ── */
function MicIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

// StopIcon removed -- active listening state uses MicIcon

function VolumeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function WaveformIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12h2" /><path d="M6 8v8" /><path d="M10 4v16" /><path d="M14 6v12" /><path d="M18 8v8" /><path d="M22 12h2" />
    </svg>
  );
}

function GearIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

/* ── SpeechRecognition type shim ── */
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  grammars?: unknown;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognitionInstance };
    webkitSpeechRecognition: { new(): SpeechRecognitionInstance };
    SpeechGrammarList: { new(): { addFromString(s: string, w: number): void } };
    webkitSpeechGrammarList: { new(): { addFromString(s: string, w: number): void } };
  }
}

/* ── Device detection ── */
function hasSpeechRecognition(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
  if (isIOS && isSafari) return "iPhone/iPad Safari";
  if (/Android/.test(ua)) return "Android";
  if (/Chrome/.test(ua)) return "Chrome Desktop";
  if (/Firefox/.test(ua)) return "Firefox";
  return "Unknown browser";
}

/* ── Spanish corrections ── */
const CORRECTIONS: [RegExp, string][] = [
  [/\ba fuera\b/gi, "afuera"],
  [/\ba dentro\b/gi, "adentro"],
  [/\bquienes? son\b/gi, "cuantos son"],
  [/\bla quenta\b/gi, "la cuenta"],
  [/\bsu quenta\b/gi, "su cuenta"],
  [/\bser[vb]esa\b/gi, "cerveza"],
  [/\bser[vb]esas\b/gi, "cervezas"],
  [/\bpro?pina?\b/gi, "propina"],
  [/\bser[vb]i[cs]io\b/gi, "servicio"],
  [/\btar[gj]eta\b/gi, "tarjeta"],
  [/\befe[ck]tivo\b/gi, "efectivo"],
  [/\bres[ie]bo\b/gi, "recibo"],
  [/\bfa[ck]tura\b/gi, "factura"],
  [/\bpi[ck]ante\b/gi, "picante"],
  [/\bme ?nu\b/gi, "menu"],
  [/\borde[nm]ar\b/gi, "ordenar"],
];

function correctSpanish(raw: string): string {
  let corrected = raw;
  for (const [pattern, replacement] of CORRECTIONS) {
    corrected = corrected.replace(pattern, replacement);
  }
  return corrected;
}

/* ── Instant word-by-word Spanish-to-English dictionary ── */
const ES_EN: Record<string, string> = {
  // question words
  que: "what", cual: "which", como: "how", donde: "where", cuando: "when",
  cuanto: "how much", cuantos: "how many", cuantas: "how many", quien: "who",
  // common verbs
  quiere: "want", quieres: "do you want", quieren: "do you want",
  desea: "would you like", deseas: "would you like",
  prefiere: "prefer", prefieres: "do you prefer", prefieren: "do you prefer",
  gusta: "like", gustaria: "would like",
  tiene: "have", tenemos: "we have", hay: "there is",
  esta: "is", estan: "are", es: "is", son: "are",
  tomar: "drink", beber: "drink", comer: "eat", pedir: "order", ordenar: "order",
  necesita: "need", necesitas: "do you need",
  puede: "can", puedo: "I can", le: "you", les: "you all",
  traer: "bring", traigo: "I bring", servir: "serve",
  recomienda: "recommend", recomendar: "recommend",
  probar: "try",
  // restaurant nouns
  mesa: "table", silla: "chair", menu: "menu", carta: "menu",
  cuenta: "check", propina: "tip", servicio: "service", recibo: "receipt",
  factura: "invoice", cambio: "change", pesos: "pesos",
  comida: "food", bebida: "drink", postre: "dessert", entrada: "appetizer",
  plato: "dish", platillo: "dish", orden: "order",
  carne: "meat", pollo: "chicken", res: "beef", cerdo: "pork", pescado: "fish",
  camarones: "shrimp", bistec: "steak", filete: "fillet",
  arroz: "rice", frijoles: "beans", ensalada: "salad",
  sopa: "soup", caldo: "broth", tacos: "tacos", tortilla: "tortilla",
  pan: "bread", queso: "cheese", salsa: "sauce", chile: "chili",
  agua: "water", cerveza: "beer", vino: "wine", cafe: "coffee", te: "tea",
  jugo: "juice", leche: "milk", refresco: "soda", limonada: "lemonade",
  tequila: "tequila", mezcal: "mezcal", horchata: "horchata",
  copa: "glass", vaso: "glass", botella: "bottle", jarra: "pitcher",
  // food adjectives
  picante: "spicy", caliente: "hot", frio: "cold", grande: "large", chico: "small",
  dulce: "sweet", rico: "tasty", bueno: "good", fresco: "fresh",
  bien: "well", cocido: "cooked", crudo: "raw", medio: "medium",
  blanco: "white", rojo: "red", negro: "black", verde: "green", integral: "whole grain",
  // common phrases
  por: "please/for", favor: "please", gracias: "thanks", de: "of", el: "the", la: "the",
  los: "the", las: "the", un: "a", una: "a", su: "your", algo: "something",
  mas: "more", nada: "nothing", todo: "everything", otra: "another", otro: "another",
  tipo: "type", clase: "kind", especial: "special", del: "of the", dia: "day",
  hoy: "today", primero: "first", segundo: "second",
  // greetings & small talk
  hola: "hello", buenas: "hello", bienvenido: "welcome", bienvenidos: "welcome",
  noches: "evening", tardes: "afternoon", dias: "morning",
  primera: "first", vez: "time", visita: "visit", vives: "do you live",
  // seating
  adentro: "inside", afuera: "outside", terraza: "terrace",
  personas: "people",
  // payment
  tarjeta: "card", efectivo: "cash", pagar: "pay",
};

function quickTranslate(spanish: string): string {
  const words = spanish.toLowerCase()
    .replace(/[?!.,;:]/g, "")
    .replace(/\u00e9/g, "e").replace(/\u00e1/g, "a").replace(/\u00ed/g, "i")
    .replace(/\u00f3/g, "o").replace(/\u00fa/g, "u").replace(/\u00f1/g, "n")
    .split(/\s+/)
    .filter(Boolean);
  const translated = words.map(w => ES_EN[w] ?? w);
  // Capitalize first word
  if (translated.length > 0) {
    translated[0] = translated[0].charAt(0).toUpperCase() + translated[0].slice(1);
  }
  return translated.join(" ");
}

/* ── Restaurant hotwords for grammar hints ── */
const RESTAURANT_HINTS = [
  "afuera", "adentro", "mesa", "cuenta", "propina", "servicio",
  "cerveza", "agua", "menu", "ordenar", "tarjeta", "efectivo",
  "recibo", "picante", "chile", "salsa", "tomar", "beber",
  "pedir", "separado", "junto", "pesos", "cambio", "terraza",
  "algo mas", "nada mas", "todo bien",
];

/* ── Section colors ── */
const sectionBorderColor: Record<string, string> = {
  // Food & Drink
  Arrival: "border-sky-300/60 dark:border-sky-600/40",
  Drinks: "border-amber-300/60 dark:border-amber-600/40",
  Menu: "border-teal-300/60 dark:border-teal-600/40",
  Food: "border-orange-300/60 dark:border-orange-500/40",
  Bill: "border-emerald-300/60 dark:border-emerald-600/40",
  Tip: "border-violet-300/60 dark:border-violet-600/40",
  // Getting Around
  Transport: "border-blue-300/60 dark:border-blue-600/40",
  // Shopping
  Shopping: "border-pink-300/60 dark:border-pink-600/40",
  // Medical
  Medical: "border-red-300/60 dark:border-red-600/40",
  // Personal Care
  PersonalCare: "border-purple-300/60 dark:border-purple-600/40",
  // General
  Clarify: "border-stone-300/60 dark:border-stone-600/40",
  Smalltalk: "border-indigo-300/60 dark:border-indigo-600/40",
  AI: "border-sky-300/60 dark:border-sky-600/40",
};

// sectionBadgeColor removed -- confidence dot replaced badge pills

// INTENT_LABELS removed -- section badge replaced by confidence dot

/* ── Get tone-specific text from a ListenReply (instant, no LLM call) ── */
const TONE_KEY_MAP: Record<string, "local" | "standard" | "polite"> = {
  street: "local", neutral: "standard", formal: "polite",
};

function getReplyForTone(reply: ListenReply, tone: string): { spanish: string; english: string } {
  const key = TONE_KEY_MAP[tone] ?? "standard";
  if (reply.tones?.[key]) {
    return reply.tones[key]!;
  }
  // Fallback: try any available tone, then default fields
  if (reply.tones) {
    const fallback = reply.tones.standard ?? reply.tones.local ?? reply.tones.polite;
    if (fallback) return fallback;
  }
  return { spanish: reply.spanish, english: reply.english };
}

/* ── Convert ListenReply to Phrase (for onSpeak/onCopy compatibility) ── */
function replyToPhrase(r: ListenReply, tone?: string): Phrase {
  if (tone) {
    const toned = getReplyForTone(r, tone);
    return { spanish: toned.spanish, english: toned.english, pronunciation: r.pronunciation };
  }
  return { spanish: r.spanish, english: r.english, pronunciation: r.pronunciation };
}

/* ── Types ── */
type ListenState = "idle" | "listening" | "recording" | "processing";

interface DebugLog {
  time: string;
  type: "partial" | "final" | "corrected" | "intent" | "error" | "info" | "capture";
  text: string;
}

interface ListenPanelProps {
  mode: SpeechMode;
  onModeChange?: (mode: SpeechMode) => void;
  onCopy: (text: string) => void;
  onSpeak: (phrase: Phrase) => void;
  autoStart?: boolean;
  onDidAutoStart?: () => void;
  context?: string;
  onClose?: () => void;
  /** Pre-acquired mic stream from the tap handler (keeps Safari gesture chain intact) */
  micStream?: MediaStream | null;
}

/* ── OpenAI Ping Button (requirement F) ── */
function OpenAIPingButton({ addLog }: { addLog: (type: DebugLog["type"], text: string) => void }) {
  const [pingState, setPingState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pingResult, setPingResult] = useState<string>("");

  const handlePing = useCallback(async () => {
    setPingState("loading");
    setPingResult("");
    addLog("info", "Pinging OpenAI...");

    try {
      const resp = await fetch("/api/debug/openai-ping");
      const data = await resp.json();

      if (data.ok) {
        const usage = data.usage ?? {};
        const msg = `OK model=${data.model} prompt=${usage.prompt_tokens} completion=${usage.completion_tokens} total=${usage.total_tokens} key=${data.keyPrefix}`;
        setPingResult(msg);
        setPingState("success");
        addLog("info", `[OpenAI Ping] ${msg}`);
      } else {
        const msg = data.error || "Unknown error";
        setPingResult(msg);
        setPingState("error");
        addLog("error", `[OpenAI Ping] ${msg}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setPingResult(msg);
      setPingState("error");
      addLog("error", `[OpenAI Ping] ${msg}`);
    }
  }, [addLog]);

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handlePing}
        disabled={pingState === "loading"}
        className={`w-fit rounded-md px-2.5 py-1 font-sans text-[10px] font-bold transition ${
          pingState === "loading"
            ? "bg-stone-200 text-stone-400 dark:bg-stone-700 dark:text-stone-500"
            : "bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-900/40 dark:text-sky-400 dark:hover:bg-sky-900/60"
        }`}
      >
        {pingState === "loading" ? "Testing..." : "Test OpenAI"}
      </button>
      {pingResult && (
        <p className={pingState === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>
          {pingResult}
        </p>
      )}
    </div>
  );
}

/* ── Session-level mic manager (survives across component re-mounts) ── */
type MicStatus = "unknown" | "granted" | "granted-before" | "denied";
let _micStatus: MicStatus = "unknown";
let _cachedStream: MediaStream | null = null;

/** Get a mic stream, reusing cached one if still alive */
async function ensureMicStream(constraints: MediaStreamConstraints): Promise<MediaStream> {
  // If we have a cached stream and its tracks are still live, reuse it
  if (_cachedStream) {
    const tracks = _cachedStream.getAudioTracks();
    if (tracks.length > 0 && tracks[0].readyState === "live") {
      return _cachedStream;
    }
    // Stream died, clear it
    _cachedStream = null;
  }
  // Request new stream (will trigger permission prompt only if not yet granted)
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  _micStatus = "granted";
  _cachedStream = stream;
  rememberMicGrant();
  return stream;
}

const MIC_GRANTED_KEY = "taphabla_mic_granted";

/** Check if user has EVER granted mic access on this device (survives refresh) */
function hasEverGrantedMic(): boolean {
  try { return localStorage.getItem(MIC_GRANTED_KEY) === "1"; } catch { return false; }
}

/** Remember that user granted mic access */
function rememberMicGrant() {
  try { localStorage.setItem(MIC_GRANTED_KEY, "1"); } catch { /* noop */ }
}

/** Lightweight permission probe -- does NOT call getUserMedia (avoids Safari re-prompt).
 *  Uses Permissions API on Chrome/Firefox, falls back to localStorage memory on Safari. */
async function probeMicPermission(): Promise<MicStatus> {
  if (_micStatus === "granted") return "granted";
  if (_micStatus === "denied") return "denied";

  // 1. Try Permissions API (Chrome, Firefox -- NOT Safari)
  try {
    const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
    if (result.state === "granted") { _micStatus = "granted"; rememberMicGrant(); return "granted"; }
    if (result.state === "denied") { _micStatus = "denied"; return "denied"; }
    return "unknown"; // "prompt" state
  } catch {
    // Safari: permissions.query not supported for microphone
  }

  // 2. Check if we've cached a live stream from earlier in this page session
  if (_cachedStream) {
    const tracks = _cachedStream.getAudioTracks();
    if (tracks.length > 0 && tracks[0].readyState === "live") {
      _micStatus = "granted";
      return "granted";
    }
  }

  // 3. Check localStorage -- user granted before on this device
  if (hasEverGrantedMic()) {
    return "granted-before";
  }

  return "unknown";
}

/* -----------------------------------------------------------------------
   ListenPanel
   ----------------------------------------------------------------------- */
export function ListenPanel({ mode, onModeChange, onCopy, onSpeak, autoStart, onDidAutoStart, context, onClose, micStream: externalMicStream }: ListenPanelProps) {
  const [state, setState] = useState<ListenState>("idle");
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [instantEnglish, setInstantEnglish] = useState("");
  const [match, setMatch] = useState<ListenMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [llmClassifying, setLlmClassifying] = useState(false);
  const [micStatus, setMicStatus] = useState<MicStatus>(_micStatus);
  const [showMicPreFrame, setShowMicPreFrame] = useState(false);
  const [micJustGranted, setMicJustGranted] = useState(false);
  
  // Audio prefetch state - tracks readiness for UI updates
  const [mainAudioStatus, setMainAudioStatus] = useState<AudioStatus>("idle");
  const [altAudioStatuses, setAltAudioStatuses] = useState<Map<string, AudioStatus>>(new Map());

  // Mode detection
  const [captureMode] = useState(() => !hasSpeechRecognition());
  const [deviceInfo] = useState(() => getDeviceInfo());

  // Debug panel
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [micSettings, setMicSettings] = useState<string>("");

  // Capture mode refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const captureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Realtime mode refs
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const finalTextRef = useRef("");

  // Auto-stop silence detection refs
  const lastTranscriptAtRef = useRef(0);
  const speechStartedRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processedFinalRef = useRef(false); // prevents double processTranscript calls

  const addLog = useCallback((type: DebugLog["type"], text: string) => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    setDebugLogs((prev) => [...prev.slice(-60), { time, type, text }]);
  }, []);

  // Probe mic permission on mount (no prompt triggered)
  useEffect(() => {
    probeMicPermission().then((s) => setMicStatus(s));
  }, []);

  // Prefetch ElevenLabs audio when match changes
  useEffect(() => {
    if (!match?.bestReply) {
      setMainAudioStatus("idle");
      setAltAudioStatuses(new Map());
      return;
    }

    // Get the Spanish text for current tone/mode
    const mainText = getReplyForTone(match.bestReply, mode).spanish;
    
    // Check if already cached
    const existingStatus = getTTSStatus(mainText, "daniel");
    if (existingStatus === "ready") {
      setMainAudioStatus("ready");
    } else if (existingStatus === "loading") {
      setMainAudioStatus("loading");
    } else {
      // Start prefetch
      setMainAudioStatus("loading");
      prefetchTTS(mainText, "daniel");
    }

    // Poll for completion (simple approach - could use event emitter for cleaner code)
    const pollInterval = setInterval(() => {
      const status = getTTSStatus(mainText, "daniel");
      if (status === "ready" || status === "error") {
        setMainAudioStatus(status);
        clearInterval(pollInterval);
      }
    }, 100);

    // Also prefetch alternates in background (don't block UI)
    match.alternates.forEach((alt) => {
      const altText = getReplyForTone(alt, mode).spanish;
      prefetchTTS(altText, "daniel");
    });

    return () => clearInterval(pollInterval);
  }, [match, mode]);

  /* ── Process transcript (shared by both modes) ──
   * Architecture: LLM-only. No deterministic classifier.
   * 1. Show "Heard: X" + "Translating..." immediately
   * 2. LLM responds (~800ms) with intent, translation, and reply options
   * 3. If LLM fails, show error -- no wrong-guess fallback
   */
  const processTranscript = useCallback(
    (rawText: string) => {
      if (!rawText.trim()) return;

      setMatch(null);

      const corrected = correctSpanish(rawText);
      setCorrectedText(corrected);
      setInstantEnglish(quickTranslate(corrected));
      if (corrected !== rawText) addLog("corrected", `"${rawText}" -> "${corrected}"`);

      // ── Cache helpers (sessionStorage primary, localStorage fallback) ──
      const CP = "th_cache_";
      const SP = "th_sig_";
      const TTL = 30 * 60 * 1000; // 30 min
      const MAX = 50;
      const normed = normalizeTranscript(corrected);
      // Cache key includes context so different contexts get different responses
      const contextKey = labelToContextKey(context) ?? "general";
      const exactKey = CP + contextKey + "|" + normed;

      // Safari-safe storage: try sessionStorage, fall back to localStorage
      function cacheGet(key: string): string | null {
        try { const v = sessionStorage.getItem(key); if (v !== null) return v; } catch {}
        try { return localStorage.getItem(key); } catch {}
        return null;
      }
      function cacheSet(key: string, val: string) {
        try { sessionStorage.setItem(key, val); } catch {}
        try { localStorage.setItem(key, val); } catch {}
      }
      function cacheRemove(key: string) {
        try { sessionStorage.removeItem(key); } catch {}
        try { localStorage.removeItem(key); } catch {}
      }
      function cacheKeys(): string[] {
        const found = new Set<string>();
        try { for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); if (k && k.startsWith(CP)) found.add(k); } } catch {}
        try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(CP)) found.add(k); } } catch {}
        return Array.from(found);
      }

      // ── Fuzzy signature for Tier 2 cache ──
      const STOPWORDS = new Set(["un","una","uno","el","la","los","las","de","del","por","para","y","o","que","quieres","quiere","me","te","se","nos","les","lo","al","en","con","su","es","hay","no","si","como","a","mi","tu","mas","muy","eso","esto","esa","esta","ese","este","pero","tambien","ya","le","ser","tiene","puede","favor","aqui"]);
      const KEYWORDS = new Set(["menu","carta","cuenta","agua","cafe","te","cerveza","vino","picante","propina","tarjeta","efectivo","mesa","terminal","bano","reservacion","postre","ensalada","sopa","pollo","carne","pescado","arroz","pan","sal","pimienta","salsa","hielo","limon","leche","azucar","servilleta","cuchillo","tenedor","cuchara","plato","vaso","copa","botella","refresco","jugo","comida","entrada","bebida","especial","alergias","vegetariano","vegano","gluten","mariscos","queso","frijoles","tortilla","tacos","enchiladas","mole","guacamole","chile","cambiar","ordenar","pedir","traer","recomendar","pagar","llevar","separar","dividir","caliente","frio","grande","chico","otra","otro","mas","bien","mal","listo","ocupada","libre","afuera","adentro","bano","emergencia","ayuda","doctor","policia","hospital","perder","robar"]);
      function makeSignature(text: string): string {
        const stripped = text.toLowerCase().trim()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s]/g, "")
          .replace(/\s+/g, " ");
        const tokens = stripped.split(" ").filter((t) => t.length > 1 && !STOPWORDS.has(t));
        // Keep only keyword tokens; if none survive, keep first 2 tokens
        const kws = tokens.filter((t) => KEYWORDS.has(t));
        const sig = kws.length > 0 ? kws.slice(0, 3) : tokens.slice(0, 2);
        return sig.sort().join("|");
      }

      const signature = makeSignature(corrected);
      const sigKey = SP + contextKey + "|" + signature;
      const currentTokens = new Set(corrected.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((t) => t.length > 1));

      // Tier 1: exact-match cache
      let cacheResult: "exact" | "fuzzy" | "miss" = "miss";
      try {
        const raw = cacheGet(exactKey);
        if (raw) {
          const entry = JSON.parse(raw);
          if (entry && entry.ts && Date.now() - entry.ts < TTL && entry.data) {
            addLog("info", "[CACHE EXACT] " + exactKey.slice(CP.length));
            const data: LLMListenResponse = entry.data;
            const llmMatch = validateAndBuildFromLLM(data, normed);
            if (!llmMatch.debug?.rejectedReason) {
              setMatch(llmMatch);
              cacheResult = "exact";
            }
          } else if (entry && entry.ts && Date.now() - entry.ts >= TTL) {
            cacheRemove(exactKey);
          }
        }
      } catch { /* parse error = cache miss */ }

      // Tier 2: fuzzy signature cache (only if exact missed)
      if (cacheResult === "miss" && signature.length > 0) {
        try {
          const raw = cacheGet(sigKey);
          if (raw) {
            const entry = JSON.parse(raw);
            if (entry && entry.ts && Date.now() - entry.ts < TTL && entry.data) {
              // Guardrail: only use if original had high confidence
              const conf = entry.data.confidence;
              // Guardrail: at least one keyword in common
              const cachedKws = (entry.keywords as string[]) || [];
              const hasOverlap = cachedKws.some((k: string) => currentTokens.has(k));
              if (typeof conf === "number" && conf >= 0.75 && hasOverlap) {
                addLog("info", "[CACHE FUZZY] sig=" + signature + " conf=" + conf);
                const data: LLMListenResponse = entry.data;
                const llmMatch = validateAndBuildFromLLM(data, normed);
                if (!llmMatch.debug?.rejectedReason) {
                  setMatch(llmMatch);
                  cacheResult = "fuzzy";
                }
              }
            } else if (entry && entry.ts && Date.now() - entry.ts >= TTL) {
              cacheRemove(sigKey);
            }
          }
        } catch { /* parse error = miss */ }
      }

      addLog("info", "[CACHE] exact=" + exactKey.slice(CP.length) + " sig=" + signature + " result=" + cacheResult);
      if (cacheResult !== "miss") return; // cache served the result

      // Fire LLM -- the UI shows loading placeholder while this runs
      setLlmClassifying(true);
      console.log("[v0] LLM call starting, contextKey:", contextKey, "context prop:", context);

      (async () => {
        try {
          console.log("[v0] Fetching /api/classify with transcript:", corrected.slice(0, 50));
          const resp = await fetch("/api/classify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transcript: corrected,
              tone: "all", // All tones returned in one call
              context: contextKey, // Pass context for logging
              systemPromptOverride: getContextSystemPrompt(contextKey === "general" ? null : contextKey as ContextKey),
            }),
          });

          if (!resp.ok) {
            const errText = await resp.text();
            addLog("error", `LLM ${resp.status}: ${errText.slice(0, 100)}`);
            // Even on API error, show a fallback result with the instant translation
            setMatch({
              intent: "api_error",
              english: instantEnglish || "Translation unavailable",
              literalEnglish: "",
              confidence: 0,
              source: "none",
              routerPath: "fallback-unknown",
              evidence: [],
              keywords: [],
              bestReply: { spanish: "Puede repetir, por favor?", english: "Can you repeat, please?", pronunciation: "", isAIGenerated: false },
              alternates: [],
              followUps: [],
              alternateMeanings: [],
              section: "Clarify",
              debug: { rejectedReason: `API error: ${resp.status}` },
            });
            return;
          }

          const data: LLMListenResponse = await resp.json();
          console.log("[v0] LLM response received:", JSON.stringify(data).slice(0, 200));
          addLog("intent", `[LLM] ${data.intent} conf=${data.confidence} reply=${data.best_reply}`);

          // Store in cache under both exact key and signature key
          try {
            const ts = Date.now();
            const kws = Array.from(currentTokens).filter((t) => KEYWORDS.has(t));
            const exactVal = JSON.stringify({ data, ts });
            cacheSet(exactKey, exactVal);
            // Signature entry includes keywords for guardrail check on read
            if (signature.length > 0) {
              const sigVal = JSON.stringify({ data, ts, keywords: kws });
              cacheSet(sigKey, sigVal);
            }
            // Evict oldest if over limit
            const keys = cacheKeys();
            if (keys.length > MAX) {
              const sorted = keys
                .map((k) => { try { const e = JSON.parse(cacheGet(k) || ""); return { k, ts: e.ts || 0 }; } catch { return { k, ts: 0 }; } })
                .sort((a, b) => a.ts - b.ts);
              while (sorted.length > MAX) {
                const oldest = sorted.shift();
                if (oldest) cacheRemove(oldest.k);
              }
            }
          } catch { /* storage full or unavailable -- ignore */ }

          const llmMatch = validateAndBuildFromLLM(data, normalizeTranscript(corrected));

          if (llmMatch.debug?.rejectedReason) {
            addLog("error", `[LLM REJECTED] ${llmMatch.debug.rejectedReason}`);
            return;
          }

          setMatch(llmMatch);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "LLM failed";
          addLog("error", `LLM: ${msg}`);
          // Show fallback on exception
          setMatch({
            intent: "exception",
            english: instantEnglish || "Translation unavailable",
            literalEnglish: "",
            confidence: 0,
            source: "none",
            routerPath: "fallback-unknown",
            evidence: [],
            keywords: [],
            bestReply: { spanish: "Puede repetir, por favor?", english: "Can you repeat, please?", pronunciation: "", isAIGenerated: false },
            alternates: [],
            followUps: [],
            alternateMeanings: [],
            section: "Clarify",
            debug: { rejectedReason: `Exception: ${msg}` },
          });
        } finally {
          setLlmClassifying(false);
        }
      })();
    },
    [addLog, context],
  );
  // No re-classify effect needed -- all tones are in one LLM response, toggling is instant

  /* ═══════════════════════════════════════════════════════════════════���═══
     CAPTURE MODE — fallback: record audio blob -> server Whisper
     ═══════���═══════════════════════════════════════════════════════════════ */
  const startCapture = useCallback(async () => {
    setError(null);
    setInterimText("");
    setFinalText("");
    setCorrectedText("");
    setInstantEnglish("");
    setMatch(null);

    addLog("capture", "Requesting mic (capture mode)...");

    try {
      const stream = await ensureMicStream({
        audio: { channelCount: 1, sampleRate: { ideal: 44100 }, echoCancellation: true, noiseSuppression: true },
      });
      setMicStatus("granted");

      const track = stream.getAudioTracks()[0];
      if (track) {
        const s = track.getSettings();
        setMicSettings(JSON.stringify(s, null, 2));
        addLog("info", `Mic: ${track.label} sr=${s.sampleRate}`);
      }

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "audio/webm";

      addLog("capture", `Recording: ${mimeType}`);

      chunksRef.current = [];
      // Clone the stream so stopping the recorder doesn't kill our cached mic stream
      const recStream = stream.clone();
      const recorder = new MediaRecorder(recStream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        recStream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        addLog("capture", `Recorded ${(blob.size / 1024).toFixed(1)}KB`);

        if (blob.size < 1000) {
          setError("Recording too short. Try speaking louder.");
          setState("idle");
          return;
        }

        setState("processing");
        setInterimText("Transcribing...");

        const MAX_RETRIES = 3;
        let attempt = 0;
        const transcribe = async (): Promise<void> => {
          attempt++;
          try {
            const form = new FormData();
            form.append("audio", blob, `audio.${mimeType.includes("mp4") ? "mp4" : "webm"}`);
            form.append("model", "whisper-1");
            form.append("language", "es");
            form.append("prompt", "Conversacion en restaurante mexicano: menu, cerveza, cuenta, propina, adentro, afuera, mesa, tarjeta, efectivo, algo mas, nada mas, todo bien.");

            const resp = await fetch("/api/transcribe", { method: "POST", body: form });

            if (resp.status === 429 && attempt < MAX_RETRIES) {
              const wait = attempt * 2000;
              addLog("info", `Rate limited (429). Retrying in ${wait / 1000}s...`);
              setInterimText(`Rate limited. Retrying in ${wait / 1000}s...`);
              await new Promise((r) => setTimeout(r, wait));
              return transcribe();
            }

            const data = await resp.json();

            if (data.error) {
              const isRateLimit = typeof data.error === "string" && (data.error.includes("429") || data.error.toLowerCase().includes("rate"));
              addLog("error", data.error);
              setError(isRateLimit ? "API rate limit hit. Wait a moment and try again." : data.error);
              setState("idle");
              setInterimText("");
              return;
            }

            const transcript = data.transcript || data.text || "";
            addLog("final", `Whisper: "${transcript}"`);
            setFinalText(transcript);
            setInterimText("");
            processTranscript(transcript);
            setState("idle");
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Transcription failed";
            addLog("error", msg);
            setError(msg);
            setState("idle");
            setInterimText("");
          }
        };
        await transcribe();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setState("recording");
      addLog("capture", "Recording started (12s max)");

      captureTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          addLog("capture", "Auto-stop (12s limit)");
          mediaRecorderRef.current.stop();
        }
      }, 12000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("NotAllowedError") || msg.includes("Permission") || msg.includes("denied")) {
        _micStatus = "denied";
        setMicStatus("denied");
      }
      setError(`Mic error: ${msg}`);
      addLog("error", msg);
      setState("idle");
    }
  }, [addLog, processTranscript]);

  const stopCapture = useCallback(() => {
    if (captureTimerRef.current) {
      clearTimeout(captureTimerRef.current);
      captureTimerRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      addLog("capture", "Stopped by user");
    }
  }, [addLog]);

  /* ═══════════════════════��═══════════════════════════════════════════════
     REALTIME MODE — SpeechRecognition streaming
     ═══════════════════════════════════════════════════════════════════════ */
  const startRealtime = useCallback(async () => {
    setError(null);
    setInterimText("");
    setFinalText("");
    setCorrectedText("");
    setInstantEnglish("");
    setMatch(null);
    finalTextRef.current = "";

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError("Speech recognition not supported. Try Chrome.");
      return;
    }

    try {
      const stream = await ensureMicStream({
        audio: { channelCount: 1, sampleRate: { ideal: 48000 }, autoGainControl: true, noiseSuppression: true, echoCancellation: true },
      });
      setMicStatus("granted");
      mediaStreamRef.current = stream;

      const track = stream.getAudioTracks()[0];
      if (track) {
        const s = track.getSettings();
        setMicSettings(JSON.stringify(s, null, 2));
        addLog("info", `Mic: ${track.label} sr=${s.sampleRate} ns=${s.noiseSuppression} ec=${s.echoCancellation}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("NotAllowedError") || msg.includes("Permission") || msg.includes("denied")) {
        _micStatus = "denied";
        setMicStatus("denied");
      }
      setError(`Mic error: ${msg}`);
      addLog("error", msg);
      return;
    }

    const recognition = new SR();
    recognition.lang = "es-MX";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Grammar hints (Chrome)
    const SGL = window.SpeechGrammarList || window.webkitSpeechGrammarList;
    if (SGL) {
      try {
        const gl = new SGL();
        gl.addFromString(`#JSGF V1.0; grammar hints; public <hint> = ${RESTAURANT_HINTS.join(" | ")} ;`, 1);
        recognition.grammars = gl;
        addLog("info", `Grammar hints: ${RESTAURANT_HINTS.length} terms`);
      } catch { /* not supported */ }
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          final += r[0].transcript;
          addLog("final", `"${r[0].transcript}" conf=${(r[0].confidence * 100).toFixed(0)}%`);
        } else {
          interim += r[0].transcript;
        }
      }

      // Track timestamp for silence detection
      lastTranscriptAtRef.current = Date.now();
      if (!speechStartedRef.current && (final || interim)) {
        speechStartedRef.current = true;
      }

      if (final) {
        finalTextRef.current = final;
        setFinalText(final);
        setInterimText("");
        const corrected = correctSpanish(final);
        setCorrectedText(corrected);
        setInstantEnglish(quickTranslate(corrected));
        if (!processedFinalRef.current) {
          processedFinalRef.current = true;
          processTranscript(final);
        }
      } else if (interim) {
        setInterimText(interim);
        // Do NOT translate interim -- only translate final to avoid half-Spanish half-English
        addLog("partial", `"${interim}"`);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      addLog("error", `${event.error} ${event.message ?? ""}`);
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (event.error === "not-allowed") {
        _micStatus = "denied";
        setMicStatus("denied");
      }
      setError(event.error === "not-allowed" ? "Microphone permission denied." : `Error: ${event.error}`);
      setState("idle");
    };

    recognition.onend = () => {
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      // NOTE: Do NOT stop mediaStreamRef tracks here -- we reuse the cached stream
      // Only process on end if we never got a final result during onresult
      if (finalTextRef.current.trim() && !processedFinalRef.current) {
        processedFinalRef.current = true;
        setState("processing");
        processTranscript(finalTextRef.current);
        setTimeout(() => setState("idle"), 200);
      } else {
        setState("idle");
      }
    };

    recognitionRef.current = recognition;
    speechStartedRef.current = false;
    lastTranscriptAtRef.current = 0;
    processedFinalRef.current = false;

    try {
      recognition.start();
      setState("listening");
      addLog("info", "Listening (es-MX, auto-stop 2.2s silence)");

      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = setInterval(() => {
        if (
          speechStartedRef.current &&
          lastTranscriptAtRef.current > 0 &&
          Date.now() - lastTranscriptAtRef.current > 2200
        ) {
          addLog("info", "Auto-stopping (2.2s silence)");
          setInterimText("Auto-stopping...");
          if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
          }
          if (silenceTimerRef.current) {
            clearInterval(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        }
      }, 250);
    } catch {
      setError("Could not start recognition.");
    }
  }, [processTranscript, addLog]);

  const stopRealtime = useCallback(() => {
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  /* ── Unified start/stop ── */
  const startListening = captureMode ? startCapture : startRealtime;
  const stopListening = captureMode ? stopCapture : stopRealtime;

  /* ── If parent passed a pre-acquired mic stream, cache it immediately ── */
  useEffect(() => {
    if (externalMicStream) {
      _cachedStream = externalMicStream;
      _micStatus = "granted";
      setMicStatus("granted");
      rememberMicGrant();
    }
  }, [externalMicStream]);

  /* ── Auto-start ── */
  const autoStartFiredRef = useRef(false);
  useEffect(() => {
    if (autoStart && !autoStartFiredRef.current && state === "idle") {
      autoStartFiredRef.current = true;

      if (externalMicStream) {
        // Stream already acquired in tap handler -- go straight to listening
        setTimeout(() => {
          startListening();
          onDidAutoStart?.();
        }, 80);
      } else {
        // No stream provided -- probe permission and decide
        (async () => {
          const status = await probeMicPermission();
          setMicStatus(status === "granted-before" ? "unknown" : status);

          if (status === "granted" || status === "granted-before") {
            // Already granted or was granted before -- start directly
            setTimeout(() => {
              startListening();
              onDidAutoStart?.();
            }, 120);
          } else if (status === "denied") {
            setError("Mic blocked in settings.");
            onDidAutoStart?.();
          } else {
            // Truly first visit -- show pre-frame
            setShowMicPreFrame(true);
            onDidAutoStart?.();
          }
        })();
      }
    }
  }, [autoStart, state, startListening, onDidAutoStart, externalMicStream]);

  /* ── Handle mic pre-frame "Enable Mic" tap ── */
  const handleEnableMic = useCallback(async () => {
    setShowMicPreFrame(false);
    try {
      await ensureMicStream({
        audio: { channelCount: 1, sampleRate: { ideal: 48000 }, noiseSuppression: true, echoCancellation: true },
      });
      setMicStatus("granted");
      rememberMicGrant();
      setMicJustGranted(true);
      // Brief success confirmation, then start listening
      setTimeout(() => {
        setMicJustGranted(false);
        startListening();
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("NotAllowedError") || msg.includes("Permission") || msg.includes("denied")) {
        _micStatus = "denied";
        setMicStatus("denied");
      }
      setError("Mic access is required to listen. Enable in browser settings.");
    }
  }, [startListening]);

  /* ── Cleanup (recognition only -- mic stream stays alive for session) ── */
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      // Do NOT stop the cached mic stream -- it survives across listens and screen changes
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    };
  }, []);

  const handleReply = useCallback((reply: ListenReply) => {
    speakPhrase(reply.spanish, "daniel");
    onSpeak(replyToPhrase(reply));
  }, [onSpeak]);

  const displayText = finalText || interimText;
  const isInterim = !finalText && !!interimText;
  const hasResults = !!finalText;

  /* ══════════════════════════���══��══════════════��════════════���═══����═════════
     RENDER
     ��═════════════════════════════════════════════════════���═════════════���══ */
  return (
    <div className="flex flex-col gap-5">

      {/* ── Debug toggle (minimal, right-aligned) ── */}
      <div className="flex items-center justify-end -mt-1 -mb-2">
        <button
          onClick={() => setShowDebug((p) => !p)}
          className={`rounded-lg p-1 transition ${showDebug ? "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-200" : "text-stone-200 hover:text-stone-400 dark:text-stone-700 dark:hover:text-stone-500"}`}
          aria-label="Toggle debug panel"
        >
          <GearIcon size={14} />
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════
         MIC PERMISSION PRE-FRAME
         ════════════════════════════════════════════════════════════════ */}
      {showMicPreFrame && (
        <div className="flex flex-col items-center gap-5 py-8 animate-fade-in">
          {/* Mic icon in soft circle */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#B5332A]/8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-10 w-10 text-[#B5332A]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-[18px] font-extrabold text-black">Mic access needed.</p>
            <p className="text-center text-[14px] font-medium leading-snug text-black/40">
              We listen. We translate. Nothing stored.
            </p>
          </div>
          <button
            onClick={handleEnableMic}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#B5332A] py-3.5 text-[15px] font-extrabold text-white shadow-md shadow-[#B5332A]/20 transition-all duration-75 active:scale-[0.97] active:shadow-sm"
          >
            Enable Mic
          </button>
          <button
            onClick={onClose}
            className="text-[13px] font-semibold text-black/35 transition hover:text-black/55"
          >
            Not now
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════���══════════
         MIC JUST GRANTED -- brief success confirmation
         ════════════════════════════════════════════════════════════════ */}
      {micJustGranted && (
        <div className="flex flex-col items-center gap-3 py-10 animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7 text-emerald-500">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-[15px] font-extrabold text-black">{"You\u2019re set."}</p>
        </div>
      )}

      {/* ═══════════����═════════════════��════════��══════��══════════════════
         ACTIVE LISTENING -- full-focus screen
         ════════════════════════════════════════════════════════════════ */}
      {!showMicPreFrame && !micJustGranted && (state === "listening" || state === "recording") && (
        <div className="flex flex-col items-center gap-4 py-4">
          {/* Large pulsing mic */}
          <button
            onClick={stopListening}
            className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[#B5332A] text-white shadow-[0_10px_50px_-10px_rgba(181,51,42,0.5)] transition-transform active:scale-95"
            aria-label="Stop listening"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-[#B5332A]/12" />
            <span className="absolute inset-[-10px] animate-pulse rounded-full border-2 border-[#B5332A]/12" />
            <MicIcon size={36} />
          </button>

          {/* Waveform visualization */}
          <div className="flex items-center justify-center gap-[3px] h-6">
            {[1,2,3,4,5].map((i) => (
              <div
                key={i}
                className="w-[3px] rounded-full bg-[#B5332A]/50"
                style={{
                  animation: `wave-bar-${i} ${0.6 + i * 0.12}s ease-in-out infinite`,
                  height: '12px',
                }}
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <p className="text-[14px] font-extrabold text-black">
              Listening
            </p>
            <p className="text-[12px] font-medium text-black/25">
              Hold it toward them.
            </p>
          </div>

          {/* Live transcript card -- Spanish ONLY while streaming, English only after final */}
          {(interimText || finalText) && (
            <div className="w-full rounded-[8px] border border-black/8 bg-white p-4 animate-fade-in">
              <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-black/25">
                {finalText ? "They said" : "Hearing"}
              </p>
              <p className={`text-[18px] font-extrabold leading-snug text-black ${!finalText ? "opacity-50" : ""}`}>
                {finalText || interimText}
              </p>
              {/* Only show English translation AFTER transcription is finalized -- never partial */}
              {finalText ? (
                instantEnglish && (
                  <p className="mt-1 text-[13px] font-medium leading-snug text-black/45">
                    {instantEnglish}
                  </p>
                )
              ) : (
                <p className="mt-1.5 text-[11px] font-semibold text-black/18">
                  Working.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
         IDLE / PROCESSING — mic button + helper text
         ════════════════════════════════════════════════════════════════ */}
      {!showMicPreFrame && !micJustGranted && state !== "listening" && state !== "recording" && (
        <>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={state !== "processing" ? startListening : undefined}
              className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-150 ${
                state === "processing"
                  ? "bg-black/10 text-black/30"
                  : "bg-[#B5332A] text-white shadow-[0_8px_30px_-6px_rgba(181,51,42,0.45)] active:scale-95"
              }`}
              disabled={state === "processing"}
              aria-label="Start listening"
            >
              <MicIcon size={28} />
            </button>

            {state === "processing" ? (
              <div className="flex flex-col items-center gap-2.5 pt-1">
                <div className="flex gap-1">
                  <div className="h-1.5 w-12 rounded-full animate-shimmer" />
                  <div className="h-1.5 w-8 rounded-full animate-shimmer" style={{ animationDelay: "0.15s" }} />
                </div>
                <p className="text-[12px] font-semibold text-black/25">Working.</p>
              </div>
            ) : (
              <p className="text-center text-[13px] font-semibold leading-snug text-black/30">
                {!displayText && micStatus === "denied" && "Mic blocked."}
                {!displayText && micStatus !== "denied" && "Listen. Respond."}
                {displayText && "Try again."}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-[6px] border border-black/6 bg-black/[0.02] px-4 py-3">
              <p className="text-center text-[14px] font-semibold text-black/60">
                {"Didn\u2019t catch that."}
              </p>
              <button
                onClick={state !== "processing" ? startListening : undefined}
                className="mt-1.5 block w-full text-center text-[13px] font-semibold text-[#B5332A] transition hover:text-[#8E2820]"
              >
                Try again.
              </button>
            </div>
          )}
        </>
      )}

      {/* ── CARD 1: THEY SAID (Spanish + literal English) ── */}
      {(correctedText || finalText) && state !== "listening" && state !== "recording" && (
        <div className="rounded-[8px] border border-black/8 bg-white p-5 animate-result-1">
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-black/30">
            They said
          </p>
          <p className="text-[22px] font-extrabold leading-[1.2] text-black">
            {correctedText || finalText}
          </p>
          {(() => {
            const literalText = (match && !llmClassifying && match.literalEnglish) ? match.literalEnglish : instantEnglish;
            return literalText ? (
              <p className="mt-2 text-[15px] font-medium leading-snug text-black/50">
                {literalText}
              </p>
            ) : null;
          })()}
        </div>
      )}

      {/* ── CARD 2: MEANING (LLM interpretation) ── */}
      {llmClassifying && !isInterim && displayText && state !== "listening" && state !== "recording" && (
        <div className="mt-1 rounded-[8px] border border-black/6 bg-black/[0.015] p-5">
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-black/25">Meaning</p>
          <div className="h-5 w-3/4 rounded animate-shimmer" />
          <div className="mt-2 h-4 w-1/2 rounded animate-shimmer" />
        </div>
      )}
      {match && hasResults && !llmClassifying && (
        <div className="mt-1 rounded-[8px] border border-black/8 bg-white p-5 animate-result-2">
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-black/30">
            {match.confidence < 50 ? "Possibly" : "Meaning"}
          </p>
          <p className="text-[20px] font-extrabold leading-[1.2] text-black">
            {match.english}
          </p>

          {/* Alternate meanings */}
          {match.alternateMeanings.length > 0 && (
            <div className="mt-3 border-t border-black/6 pt-3">
              {match.alternateMeanings.map((alt, i) => (
                <p key={i} className="text-[13px] leading-snug text-black/45">
                  {`\u2022 ${alt.english}`}
                </p>
              ))}
            </div>
          )}

          {/* Context confidence indicator */}
          {context && match.confidence >= 60 && (
            <div className="mt-3 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 text-emerald-500">
                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
              </svg>
              <span className="text-[11px] font-semibold text-emerald-600/80">{context} context detected</span>
            </div>
          )}
        </div>
      )}

      {/* ── BEST REPLY -- staggered reveal ── */}
      {match && hasResults && !llmClassifying && (
        <div className="mt-2 animate-result-3">
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-black/25">
            {"Here\u2019s what to say"}
          </p>

          {(() => {
            const tonedBest = getReplyForTone(match.bestReply, mode);
            return (
              <div className="rounded-[8px] border-2 border-[#B5332A]/12 bg-white p-5">
                <p className="text-[24px] font-extrabold leading-[1.15] text-black">
                  {tonedBest.spanish}
                </p>
                <p className="mt-2 text-[14px] font-medium leading-snug text-black/45">
                  {tonedBest.english || match.english}
                </p>
                {match.bestReply.pronunciation && (
                  <p className="mt-1 font-mono text-[11px] tracking-tight text-black/18">
                    {match.bestReply.pronunciation}
                  </p>
                )}

                {/* Tone selector inside reply card -- instant switch, no LLM call */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-black/25">Tone:</span>
                  <div className="flex items-center gap-px rounded-[4px] border border-black/8 p-px">
                    {(["street", "neutral", "formal"] as const).map((t) => {
                      const toneLabels = { street: "Local", neutral: "Standard", formal: "Polite" };
                      return (
                        <button
                          key={t}
                          onClick={() => onModeChange?.(t)}
                          className={`rounded-[3px] px-2 py-0.5 text-[10px] font-bold transition-all duration-75 ${
                            mode === t
                              ? "bg-[#111] text-white"
                              : "text-black/30 hover:text-black/50"
                          }`}
                        >
                          {toneLabels[t]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Speak button -- speaks the tone-specific text */}
                <button
                  onClick={() => {
                    if (mainAudioStatus === "loading") return; // Don't double-trigger
                    speakPhrase(tonedBest.spanish, "daniel");
                    onSpeak(replyToPhrase(match.bestReply, mode));
                  }}
                  disabled={mainAudioStatus === "loading"}
                  className={`mt-4 flex w-full items-center justify-center gap-2.5 rounded-[8px] py-3.5 text-white shadow-md shadow-[#B5332A]/20 transition-all duration-75 active:scale-[0.97] active:shadow-sm ${
                    mainAudioStatus === "loading" ? "bg-[#B5332A]/70 cursor-wait" : "bg-[#B5332A]"
                  }`}
                >
                  {mainAudioStatus === "loading" ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-[15px] font-extrabold">Preparing audio...</span>
                    </>
                  ) : (
                    <>
                      <WaveformIcon size={16} />
                      <span className="text-[15px] font-extrabold">Say it</span>
                    </>
                  )}
                </button>
              </div>
            );
          })()}

          {/* ── Alternates ── */}
          {match.alternates.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-black/25">
                Or say
              </p>
              <div className="flex flex-col gap-1.5">
                {match.alternates.map((reply, idx) => {
                  const tonedAlt = getReplyForTone(reply, mode);
                  const altStatus = getTTSStatus(tonedAlt.spanish, "daniel");
                  return (
                    <button
                      key={tonedAlt.spanish + idx}
                      onClick={() => { speakPhrase(tonedAlt.spanish, "daniel"); onSpeak(replyToPhrase(reply, mode)); }}
                      className="flex items-center justify-between gap-3 rounded-[6px] border border-black/8 bg-white px-4 py-2.5 text-left transition-all duration-75 active:scale-[0.98] active:bg-black/[0.02]"
                    >
                      <div className="flex min-w-0 flex-col">
                        <p className="text-[14px] font-bold leading-tight text-black">
                          {tonedAlt.spanish}
                        </p>
                        {tonedAlt.english && (
                          <p className="mt-0.5 text-[12px] text-black/40">
                            {tonedAlt.english}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-black/30">
                        <VolumeIcon size={12} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Follow-ups ── */}
          {match.followUps && match.followUps.length > 0 && (
            <div className="mt-3 border-t border-black/6 pt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-black/25">
                Then say
              </p>
              <div className="flex flex-wrap gap-1.5">
                {match.followUps.map((fu, i) => (
                  <button
                    key={i}
                    onClick={() => handleReply({ spanish: fu.spanish, english: fu.english, pronunciation: "", isAIGenerated: true })}
                    className="flex flex-col rounded-[6px] border border-black/8 bg-white px-3 py-2 text-left transition-all duration-75 active:scale-[0.97]"
                  >
                    <p className="text-[12px] font-semibold leading-tight text-black/70">
                      {fu.spanish}
                    </p>
                    <p className="mt-0.5 text-[10px] text-black/35">
                      {fu.english}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DEBUG PANEL ── */}
      {showDebug && (
        <div className="rounded-2xl border border-stone-200/60 bg-stone-50 p-4 text-left font-mono text-[10px] leading-relaxed text-stone-500 dark:border-stone-700/40 dark:bg-stone-900 dark:text-stone-400">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">Debug Panel</span>
            <button onClick={() => setDebugLogs([])} className="font-sans text-[10px] font-semibold text-stone-400 hover:text-stone-600">Clear</button>
          </div>

          {/* Mic + system status */}
          <div className="mb-2 border-b border-stone-200/50 pb-2 dark:border-stone-700/30">
            <p>
              <span className="text-stone-400">Mic: </span>
              <span className={micStatus === "granted" ? "text-emerald-600" : micStatus === "denied" ? "text-red-500" : "text-amber-500"}>
                {micStatus}
              </span>
              {" | "}
              <span className="text-stone-400">Stream: </span>
              {_cachedStream && _cachedStream.getAudioTracks()[0]?.readyState === "live" ? (
                <span className="text-emerald-600">ready</span>
              ) : (
                <span className="text-stone-400">not ready</span>
              )}
              {" | "}
              <span className="text-stone-400">State: </span>
              <span className={state === "listening" || state === "recording" ? "text-red-500" : state === "processing" ? "text-amber-500" : "text-stone-400"}>{state}</span>
            </p>
            <p><span className="text-stone-400">Device: </span>{deviceInfo}</p>
            <p><span className="text-stone-400">Mode: </span>{captureMode ? "Capture (Whisper)" : "Realtime (SpeechRecognition)"}</p>
            <p><span className="text-stone-400">Lang: </span>es-MX</p>
            <p><span className="text-stone-400">SpeechRecognition: </span>{hasSpeechRecognition() ? "Available" : "Unavailable"}</p>
          </div>

          {/* Mic settings */}
          {micSettings && (
            <div className="mb-2 border-b border-stone-200/50 pb-2 dark:border-stone-700/30">
              <p className="font-bold text-stone-600 dark:text-stone-300">Mic Track:</p>
              <pre className="whitespace-pre-wrap text-[9px]">{micSettings}</pre>
            </div>
          )}

          {/* ── STRUCTURED RESULT (requirement A) ── */}
          {match && (
            <div className="mb-2 border-b border-stone-200/50 pb-2 dark:border-stone-700/30">
              <p className="font-bold text-stone-600 dark:text-stone-300">ListenResult:</p>
              <p><span className="text-stone-400">rawTranscript: </span>{match.debug?.rawTranscript ? `"${match.debug.rawTranscript}"` : `"${finalText}"`}</p>
              <p><span className="text-stone-400">normalizedTranscript: </span>{match.debug?.normalizedTranscript ? `"${match.debug.normalizedTranscript}"` : `"${normalizeTranscript(correctedText || finalText)}"`}</p>
              <p><span className="text-sky-500">routerPath: </span><span className={match.routerPath === "fallback-unknown" ? "text-red-500 font-bold" : "text-emerald-500 font-bold"}>{match.routerPath}</span></p>
              <p><span className="text-cyan-500">matchedRuleId: </span>{match.debug?.matchedRule ?? "none"}</p>
              <p><span className="text-violet-500">evidenceTokens: </span>[{match.evidence.join(", ")}]</p>
              <p><span className="text-stone-400">constraintsPassed: </span><span className={match.debug?.constraintsPassed ? "text-emerald-500" : "text-red-500"}>{String(match.debug?.constraintsPassed ?? false)}</span></p>
              <p><span className="text-sky-500">finalIntent: </span><span className="font-bold">{match.intent}</span> [{match.section}]</p>
              <p><span className="text-sky-500">confidence: </span>{match.confidence} <span className="text-stone-400">src={match.source}</span></p>
              {match.debug?.rejectedReason && <p><span className="text-red-500">reasonIfUnknown: </span>{match.debug.rejectedReason}</p>}
              <p><span className="text-emerald-500">bestReply: </span>{match.bestReply.spanish}</p>
            </div>
          )}

          {/* ── OpenAI Ping Test (requirement F) ── */}
          <div className="mb-2 border-b border-stone-200/50 pb-2 dark:border-stone-700/30">
            <p className="mb-1 font-bold text-stone-600 dark:text-stone-300">OpenAI Connectivity:</p>
            <OpenAIPingButton addLog={addLog} />
          </div>

          {/* Event log */}
          <div className="max-h-48 overflow-y-auto scrollbar-hide">
            {debugLogs.length === 0 && <p className="text-stone-400">No events yet.</p>}
            {debugLogs.map((log, i) => (
              <p key={i} className={
                log.type === "error" ? "text-red-500" :
                log.type === "final" ? "text-emerald-600 dark:text-emerald-400" :
                log.type === "corrected" ? "text-amber-600 dark:text-amber-400" :
                log.type === "intent" ? "text-sky-600 dark:text-sky-400" :
                log.type === "capture" ? "text-violet-600 dark:text-violet-400" : ""
              }>
                <span className="text-stone-400">{log.time} </span>
                <span className="font-bold uppercase">[{log.type}] </span>
                {log.text}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
