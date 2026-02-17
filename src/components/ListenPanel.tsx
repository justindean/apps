import { useState, useRef, useCallback, useEffect } from "react";
import type { Phrase, SpeechMode } from "../data/phrases";
import { LLM_SYSTEM_PROMPT, validateAndBuildFromLLM, normalizeTranscript } from "../data/restaurantIntents";
import type { ListenMatch, ListenReply, LLMListenResponse } from "../data/restaurantIntents";

/* ── TTS helper ── */
function speakPhrase(text: string) {
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

function StopIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

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
  Arrival: "border-sky-300/60 dark:border-sky-600/40",
  Drinks: "border-amber-300/60 dark:border-amber-600/40",
  Menu: "border-teal-300/60 dark:border-teal-600/40",
  Food: "border-orange-300/60 dark:border-orange-500/40",
  Bill: "border-emerald-300/60 dark:border-emerald-600/40",
  Tip: "border-violet-300/60 dark:border-violet-600/40",
  Clarify: "border-stone-300/60 dark:border-stone-600/40",
  Smalltalk: "border-indigo-300/60 dark:border-indigo-600/40",
  AI: "border-sky-300/60 dark:border-sky-600/40",
};

const sectionBadgeColor: Record<string, string> = {
  Arrival: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
  Drinks: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  Menu: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400",
  Food: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  Bill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  Tip: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
  Clarify: "bg-stone-100 text-stone-600 dark:bg-stone-800/40 dark:text-stone-400",
  Smalltalk: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
  AI: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
};

/* ── Humanized intent labels for badge ── */
const INTENT_LABELS: Record<string, string> = {
  menu_offer: "MENU",
  table_preference: "TABLE",
  party_size: "PARTY",
  greeting: "GREETING",
  order_ready: "ORDER",
  order_items: "ORDER",
  doneness_preference: "STEAK",
  soups_available: "SOUPS",
  drinks_offer: "DRINKS",
  drinks_hot_offer: "HOT DRINKS",
  anything_else: "MORE?",
  check_in_food: "CHECK-IN",
  bill_offer: "BILL",
  payment_method: "PAYMENT",
  tip_service: "TIP",
  receipt: "RECEIPT",
  not_available: "UNAVAILABLE",
  clarification: "CLARIFY",
  smalltalk_origin: "SMALLTALK",
  smalltalk_live_here: "SMALLTALK",
  smalltalk_first_time: "SMALLTALK",
  smalltalk_enjoying: "SMALLTALK",
  ai_understood: "AI",
  unknown: "UNKNOWN",
};

/* ── Convert ListenReply to Phrase (for onSpeak/onCopy compatibility) ── */
function replyToPhrase(r: ListenReply): Phrase {
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
  onCopy: (text: string) => void;
  onSpeak: (phrase: Phrase) => void;
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

/* ═══════════════════════════════════════════════════════════════════════
   ListenPanel
   ═══════════════════════════════════════════════════════════════════════ */
export function ListenPanel({ mode, onCopy, onSpeak }: ListenPanelProps) {
  const [state, setState] = useState<ListenState>("idle");
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [match, setMatch] = useState<ListenMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [llmClassifying, setLlmClassifying] = useState(false);

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
      if (corrected !== rawText) addLog("corrected", `"${rawText}" -> "${corrected}"`);

      // Fire LLM -- the UI shows "Translating..." while this runs
      setLlmClassifying(true);

      (async () => {
        try {
          const resp = await fetch("/_llm/classify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transcript: corrected,
              tone: mode === "formal" ? "Formal" : mode === "street" ? "Street" : "Neutral",
              systemPromptOverride: LLM_SYSTEM_PROMPT,
            }),
          });

          if (!resp.ok) {
            const errText = await resp.text();
            addLog("error", `LLM ${resp.status}: ${errText.slice(0, 100)}`);
            return;
          }

          const data: LLMListenResponse = await resp.json();
          addLog("intent", `[LLM] ${data.intent} conf=${data.confidence} reply=${data.best_reply}`);

          const llmMatch = validateAndBuildFromLLM(data, normalizeTranscript(corrected));

          if (llmMatch.debug?.rejectedReason) {
            addLog("error", `[LLM REJECTED] ${llmMatch.debug.rejectedReason}`);
            return;
          }

          setMatch(llmMatch);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "LLM failed";
          addLog("error", `LLM: ${msg}`);
        } finally {
          setLlmClassifying(false);
        }
      })();
    },
    [mode, addLog],
  );

  /* ═══════════════════════════════════════════════════════════════════���═══
     CAPTURE MODE — fallback: record audio blob -> server Whisper
     ═══════════════════════════════════════════════════════════════════════ */
  const startCapture = useCallback(async () => {
    setError(null);
    setInterimText("");
    setFinalText("");
    setCorrectedText("");
    setMatch(null);

    addLog("capture", "Requesting mic (capture mode)...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: { ideal: 44100 }, echoCancellation: true, noiseSuppression: true },
      });

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
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
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
      setError(`Mic error: ${msg}`);
      addLog("error", msg);
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
    setMatch(null);
    finalTextRef.current = "";

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError("Speech recognition not supported. Try Chrome.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: { ideal: 48000 }, autoGainControl: true, noiseSuppression: true, echoCancellation: true },
      });
      mediaStreamRef.current = stream;

      const track = stream.getAudioTracks()[0];
      if (track) {
        const s = track.getSettings();
        setMicSettings(JSON.stringify(s, null, 2));
        addLog("info", `Mic: ${track.label} sr=${s.sampleRate} ns=${s.noiseSuppression} ec=${s.echoCancellation}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
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
        if (!processedFinalRef.current) {
          processedFinalRef.current = true;
          processTranscript(final);
        }
      } else if (interim) {
        setInterimText(interim);
        addLog("partial", `"${interim}"`);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      addLog("error", `${event.error} ${event.message ?? ""}`);
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(event.error === "not-allowed" ? "Microphone permission denied." : `Error: ${event.error}`);
      setState("idle");
    };

    recognition.onend = () => {
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
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
  const isActive = state === "listening" || state === "recording" || state === "processing";

  /* ── Cleanup ── */
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    };
  }, []);

  const handleReply = useCallback((reply: ListenReply) => {
    speakPhrase(reply.spanish);
    onSpeak(replyToPhrase(reply));
  }, [onSpeak]);

  const displayText = finalText || interimText;
  const isInterim = !finalText && !!interimText;
  const hasResults = !!finalText && (state === "idle" || !!match);

  /* ══════════════════════════���════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════���════════════════ */
  return (
    <div className="flex flex-col gap-5">

      {/* ── Mode indicator + Debug toggle ── */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500">
          {captureMode ? "Capture mode (Whisper)" : "Realtime mode"}{" \u00B7 "}{deviceInfo}
        </p>
        <button
          onClick={() => setShowDebug((p) => !p)}
          className={`rounded-lg p-1.5 transition ${showDebug ? "bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-200" : "text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400"}`}
          aria-label="Toggle debug panel"
        >
          <GearIcon size={16} />
        </button>
      </div>

      {/* ── MIC BUTTON ── */}
      <div className="flex flex-col items-center gap-2.5">
        <button
          onClick={isActive && state !== "processing" ? stopListening : !isActive ? startListening : undefined}
          className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-200 ${
            state === "listening" || state === "recording"
              ? "bg-red-500 text-white shadow-lg shadow-red-500/30 active:scale-95"
              : state === "processing"
                ? "bg-stone-300 text-stone-500 dark:bg-stone-600 dark:text-stone-400"
                : "bg-[#D94F2A] text-white shadow-lg shadow-[#D94F2A]/25 active:scale-95 dark:bg-[#E8734F] dark:shadow-[#E8734F]/20"
          }`}
          disabled={state === "processing"}
          aria-label={isActive ? "Stop listening" : "Start listening"}
        >
          {(state === "listening" || state === "recording") && (
            <span className="absolute inset-0 animate-ping rounded-full bg-red-500/30" />
          )}
          {state === "listening" || state === "recording" ? <StopIcon size={24} /> : <MicIcon size={28} />}
        </button>

        <p className="text-[13px] font-medium text-stone-400 dark:text-stone-500">
          {state === "idle" && !displayText && "Tap to listen"}
          {state === "idle" && displayText && "Tap to listen again"}
          {state === "listening" && "Listening... tap to stop"}
          {state === "recording" && "Recording... tap to stop"}
          {state === "processing" && "Processing..."}
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 dark:bg-red-950/30">
          <p className="text-center text-[12px] font-medium text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* ── THEY SAID ── */}
      {displayText && (
        <div className={`animate-fade-in rounded-2xl border bg-gradient-to-b from-white to-warm-50 p-4 shadow-card-elevated card-highlight dark:from-stone-800/90 dark:to-stone-800/70 ${match ? sectionBorderColor[match.section] ?? "border-stone-200/60 dark:border-stone-700/40" : "border-stone-200/60 dark:border-stone-700/40"}`}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400/70 dark:text-stone-500/60">They said</p>
            {match && match.intent !== "unknown" && !llmClassifying && (
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${sectionBadgeColor[match.section] ?? ""}`}>
                {INTENT_LABELS[match.intent] ?? match.section}
              </span>
            )}
          </div>

          {/* English meaning or translating state */}
          {match && hasResults && !llmClassifying ? (
            <p className="text-[18px] font-extrabold leading-tight text-stone-900 dark:text-stone-50">
              {`\u201C${match.english}\u201D`}
            </p>
          ) : llmClassifying ? (
            <p className="animate-pulse text-[15px] font-bold leading-tight text-sky-600 dark:text-sky-400">
              Translating...
            </p>
          ) : (
            <p className={`text-[15px] font-bold leading-tight text-stone-700 dark:text-stone-300 ${isInterim ? "opacity-50" : ""}`}>
              {state === "processing" ? "Processing audio..." : "Listening..."}
            </p>
          )}

          {/* Spanish heard */}
          <p className={`mt-1.5 text-[13px] leading-snug text-stone-400 dark:text-stone-500 ${isInterim ? "opacity-50" : ""}`}>
            <span className="font-medium text-stone-500/60 dark:text-stone-600">{"Heard: "}</span>
            {`\u201C${displayText}\u201D`}
          </p>

          {correctedText && correctedText !== finalText && hasResults && (
            <p className="mt-1 text-[11px] text-stone-300 dark:text-stone-600">
              {"Corrected: \u201C"}{correctedText}{"\u201D"}
            </p>
          )}
        </div>
      )}

      {/* ── BEST REPLY -- only shown after LLM responds ── */}
      {match && hasResults && !llmClassifying && (
        <div className="animate-fade-in">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400/70 dark:text-stone-500/60">
            {match.section === "Clarify"
              ? "Not sure \u2014 try asking"
              : "Best reply"}
          </p>

          <button
            onClick={() => handleReply(match.bestReply)}
            className={`group relative flex w-full flex-col overflow-hidden rounded-[18px] border-2 bg-gradient-to-b from-white to-warm-50 p-4 text-left shadow-card-elevated card-highlight transition-all duration-150 active:translate-y-px active:shadow-card-press dark:from-stone-800/90 dark:to-stone-800/70 ${sectionBorderColor[match.section] ?? "border-stone-300/60"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <p className="text-[20px] font-extrabold leading-tight tracking-[0.01em] text-stone-900 dark:text-stone-50">
                  {match.bestReply.spanish}
                </p>
                <p className="mt-1 text-[14px] leading-snug text-stone-500 dark:text-stone-400">
                  {match.bestReply.english || match.english}
                </p>
                {match.bestReply.pronunciation && (
                  <p className="mt-1 font-mono text-[11px] leading-snug tracking-tight text-stone-300 dark:text-stone-600">
                    {match.bestReply.pronunciation}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#D94F2A] px-3.5 py-2 text-white shadow-md shadow-[#D94F2A]/25 transition-transform active:scale-95 dark:bg-[#E8734F] dark:shadow-[#E8734F]/20">
                <WaveformIcon size={13} />
                <span className="text-[12px] font-extrabold">Speak</span>
              </div>
            </div>
          </button>

          {/* Copy */}
          <div className="mt-1.5 flex justify-end">
            <button
              onClick={() => onCopy(match.bestReply.spanish)}
              className="rounded-md px-2 py-0.5 text-[10px] font-semibold text-stone-400 transition hover:text-stone-600 active:scale-95 dark:text-stone-500 dark:hover:text-stone-300"
            >
              Copy
            </button>
          </div>

          {/* ── Alternates ── */}
          {match.alternates.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400/60 dark:text-stone-500/50">
                Or say
              </p>
              <div className="flex flex-col gap-2">
                {match.alternates.map((reply) => (
                  <button
                    key={reply.spanish}
                    onClick={() => handleReply(reply)}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/60 bg-gradient-to-b from-white to-warm-50 px-3.5 py-2.5 text-left shadow-sm card-highlight transition-all duration-150 active:scale-[0.98] active:shadow-none dark:border-stone-700/40 dark:from-stone-800/90 dark:to-stone-800/70"
                  >
                    <div className="flex min-w-0 flex-col">
                      <p className="text-[14px] font-bold leading-tight text-stone-800 dark:text-stone-200">
                        {reply.spanish}
                      </p>
                      {reply.english && (
                        <p className="mt-0.5 text-[12px] text-stone-400 dark:text-stone-500">
                          {reply.english}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-stone-400 dark:text-stone-500">
                      <VolumeIcon size={12} />
                      <span className="text-[10px] font-semibold">Speak</span>
                    </div>
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

          {/* System info */}
          <div className="mb-2 border-b border-stone-200/50 pb-2 dark:border-stone-700/30">
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
