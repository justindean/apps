import { useState, useRef, useCallback, useEffect } from "react";
import type { Phrase, SpeechMode } from "../data/phrases";
import { classifyIntent, getSectionPhrases } from "../data/restaurantIntents";
import type { IntentMatch } from "../data/restaurantIntents";

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
  onaudiostart?: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
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

type ListenState = "idle" | "listening" | "processing";

interface ListenPanelProps {
  mode: SpeechMode;
  onCopy: (text: string) => void;
  onSpeak: (phrase: Phrase) => void;
}

/* ─────────────────────────────────────────────────────────────────────────
   Restaurant hotword list — biases transcription toward these terms
   ───────────────────────────────────────────────────────────────────────── */
const RESTAURANT_HINTS = [
  "afuera", "adentro", "mesa", "cuenta", "propina", "servicio",
  "cerveza", "agua", "menu", "ordenar", "tarjeta", "efectivo",
  "recibo", "firma", "picante", "chile", "salsa", "tomar",
  "beber", "pedir", "separado", "junto", "pesos", "cambio",
  "factura", "terraza", "bienvenido",
];

/* ─────────────────────────────────────────────────────────────────────────
   Second-pass "Spanish correction" — rewrites common STT mishearings
   into the most likely Mexican-Spanish restaurant phrase
   ───────────────────────────────────────────────────────────────────────── */
const CORRECTIONS: [RegExp, string][] = [
  // Common mis-hearings and normalisations
  [/\ba fuera\b/gi, "afuera"],
  [/\ba dentro\b/gi, "adentro"],
  [/\ba dent?ro? o a ?fuera?\b/gi, "adentro o afuera"],
  [/\bafuera? o ?a ?dent?ro?\b/gi, "afuera o adentro"],
  [/\bqui[eé]n?es?\s?s[oó]n\b/gi, "cuantos son"],
  [/\bquienes? son\b/gi, "cuantos son"],
  [/\bcuantos?\s?persona\b/gi, "cuantas personas"],
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
  [/\bpi[ck]oso\b/gi, "picoso"],
  [/\bme ?nu\b/gi, "menu"],
  [/\borde[nm]ar\b/gi, "ordenar"],
  [/\bagua\s*mineral\b/gi, "agua mineral"],
  [/\bagua\s*natural\b/gi, "agua natural"],
  [/\bqueltal\b/gi, "que tal"],
  [/\bque ?tal\b/gi, "que tal"],
  [/\besta bien a ?qu[ií]\b/gi, "esta bien aqui"],
  [/\ble ?gusta?\b/gi, "le gusta"],
  [/\brecomi[e]?ndo\b/gi, "recomiendo"],
  [/\bes ?pecialidad\b/gi, "especialidad"],
  // Google STT sometimes splits "algo de tomar" oddly
  [/\balgo\s*de\s*tom[ae]r\b/gi, "algo de tomar"],
  [/\bvan\s*a\s*tom[ae]r\b/gi, "van a tomar"],
  [/\bvan\s*a\s*ped[ie]r\b/gi, "van a pedir"],
  [/\bvan\s*a\s*orden[ae]r\b/gi, "van a ordenar"],
];

function correctSpanish(raw: string): string {
  let corrected = raw;
  for (const [pattern, replacement] of CORRECTIONS) {
    corrected = corrected.replace(pattern, replacement);
  }
  return corrected;
}

/* ─────────────────────────────────────────────────────────────────────────
   Section color mapping (mirrors FlowNavigator)
   ───────────────────────────────────────────────────────────────────────── */
const sectionBorderColor: Record<string, string> = {
  Arrival: "border-sky-300/60 dark:border-sky-600/40",
  Drinks: "border-amber-300/60 dark:border-amber-600/40",
  Food: "border-orange-300/60 dark:border-orange-500/40",
  Bill: "border-emerald-300/60 dark:border-emerald-600/40",
  Tip: "border-violet-300/60 dark:border-violet-600/40",
};

const sectionBadgeColor: Record<string, string> = {
  Arrival: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
  Drinks: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  Food: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  Bill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  Tip: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
};

/* ─────────────────────────────────────────────────────────────────────────
   Debug panel data
   ───────────────────────────────────────────────────────────────────────── */
interface DebugLog {
  time: string;
  type: "partial" | "final" | "corrected" | "intent" | "error" | "info";
  text: string;
}

/* ═════════════════════════════════════════════════════════════════════════
   ListenPanel
   ═════════════════════════════════════════════════════════════════════════ */
export function ListenPanel({ mode, onCopy, onSpeak }: ListenPanelProps) {
  const [state, setState] = useState<ListenState>("idle");
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [match, setMatch] = useState<IntentMatch | null>(null);
  const [altPhrases, setAltPhrases] = useState<Phrase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  // Audio constraint toggles
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);

  // Debug panel
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [micSettings, setMicSettings] = useState<string>("");
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const finalTextRef = useRef("");

  const addDebugLog = useCallback((type: DebugLog["type"], text: string) => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false, fractionalSecondDigits: 1 } as Intl.DateTimeFormatOptions);
    setDebugLogs((prev) => [...prev.slice(-50), { time, type, text }]);
  }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  const processTranscript = useCallback(
    (rawText: string) => {
      if (!rawText.trim()) return;

      // Second-pass Spanish correction
      const corrected = correctSpanish(rawText);
      setCorrectedText(corrected);
      addDebugLog("corrected", `"${rawText}" → "${corrected}"`);

      // Use corrected text for intent detection
      const intentMatch = classifyIntent(corrected, mode);
      setMatch(intentMatch);

      if (intentMatch) {
        addDebugLog("intent", `${intentMatch.intent} [${intentMatch.section}] conf=${intentMatch.confidence}`);
        const all = getSectionPhrases(intentMatch.section, mode);
        setAltPhrases(all.filter((p) => p.spanish !== intentMatch.phrase.spanish));
      } else {
        addDebugLog("intent", "No match");
        setAltPhrases([]);
      }
    },
    [mode, addDebugLog],
  );

  const startListening = useCallback(async () => {
    setError(null);
    setInterimText("");
    setFinalText("");
    setCorrectedText("");
    setMatch(null);
    setAltPhrases([]);
    finalTextRef.current = "";

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    // Request high-quality audio with constraint toggles
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: { ideal: 48000, min: 44100 },
          sampleSize: { ideal: 16 },
          autoGainControl: true,
          noiseSuppression,
          echoCancellation,
        },
      });
      mediaStreamRef.current = stream;

      // Capture mic track settings for debug
      const track = stream.getAudioTracks()[0];
      if (track) {
        const settings = track.getSettings();
        const settingsStr = JSON.stringify(settings, null, 2);
        setMicSettings(settingsStr);
        addDebugLog("info", `Mic: ${track.label}`);
        addDebugLog("info", `Settings: sampleRate=${settings.sampleRate}, ch=${settings.channelCount}, ns=${settings.noiseSuppression}, ec=${settings.echoCancellation}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Microphone error: ${msg}`);
      addDebugLog("error", msg);
      return;
    }

    const recognition = new SR();
    recognition.lang = "es-MX";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Hotword grammar hints — supported in Chrome via SpeechGrammarList
    const SGL = window.SpeechGrammarList || window.webkitSpeechGrammarList;
    if (SGL) {
      try {
        const grammarList = new SGL();
        const grammar = `#JSGF V1.0; grammar hints; public <hint> = ${RESTAURANT_HINTS.join(" | ")} ;`;
        grammarList.addFromString(grammar, 1);
        recognition.grammars = grammarList;
        addDebugLog("info", `Grammar hints loaded: ${RESTAURANT_HINTS.length} terms`);
      } catch {
        addDebugLog("info", "SpeechGrammarList not fully supported, skipping hints");
      }
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
          addDebugLog("final", `"${result[0].transcript}" conf=${(result[0].confidence * 100).toFixed(0)}%`);
        } else {
          interim += result[0].transcript;
          addDebugLog("partial", `"${result[0].transcript}"`);
        }
      }

      if (final) {
        finalTextRef.current = final;
        setFinalText(final);
        setInterimText("");
        processTranscript(final);
      } else {
        setInterimText(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      addDebugLog("error", `STT error: ${event.error} ${event.message ?? ""}`);
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(
        event.error === "not-allowed"
          ? "Microphone access denied. Please allow microphone permissions."
          : `Recognition error: ${event.error}`,
      );
      setState("idle");
    };

    recognition.onend = () => {
      // Release mic
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }

      if (finalTextRef.current.trim()) {
        setState("processing");
        processTranscript(finalTextRef.current);
        setTimeout(() => setState("idle"), 200);
      } else {
        setState("idle");
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setState("listening");
      addDebugLog("info", "Started listening (es-MX)");
    } catch {
      setError("Could not start speech recognition.");
    }
  }, [processTranscript, noiseSuppression, echoCancellation, addDebugLog]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  const handleSuggestedPhrase = useCallback(
    (phrase: Phrase) => {
      speakPhrase(phrase.spanish);
      onSpeak(phrase);
    },
    [onSpeak],
  );

  // Long-press handler for debug panel
  const handleMicPointerDown = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowDebug((p) => !p);
    }, 800);
  }, []);

  const handleMicPointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const isActive = state === "listening" || state === "processing";
  const displayText = finalText || interimText;
  const isInterim = !finalText && !!interimText;
  const hasResults = !!finalText && state === "idle";

  /* ── Unsupported browser ── */
  if (!supported) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-stone-200 dark:bg-stone-700">
          <MicIcon size={28} className="text-stone-400 dark:text-stone-500" />
        </div>
        <p className="max-w-[260px] text-center text-[13px] text-stone-400 dark:text-stone-500">
          Speech recognition is not available in this browser. Try Chrome or Safari on mobile.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ══════════════════════════════════════════════════════════════════
          AUDIO CONSTRAINT TOGGLES
          ══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-center gap-4">
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={noiseSuppression}
            onChange={(e) => setNoiseSuppression(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-stone-300 accent-[#D94F2A]"
            disabled={isActive}
          />
          <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500">Noise suppression</span>
        </label>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={echoCancellation}
            onChange={(e) => setEchoCancellation(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-stone-300 accent-[#D94F2A]"
            disabled={isActive}
          />
          <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500">Echo cancellation</span>
        </label>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MIC BUTTON (long-press to toggle debug)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col items-center gap-2.5">
        <button
          onClick={isActive ? stopListening : startListening}
          onPointerDown={handleMicPointerDown}
          onPointerUp={handleMicPointerUp}
          onPointerLeave={handleMicPointerUp}
          className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-200 ${
            state === "listening"
              ? "bg-red-500 text-white shadow-lg shadow-red-500/30 active:scale-95"
              : state === "processing"
                ? "bg-stone-300 text-stone-500 dark:bg-stone-600 dark:text-stone-400"
                : "bg-[#D94F2A] text-white shadow-lg shadow-[#D94F2A]/25 active:scale-95 dark:bg-[#E8734F] dark:shadow-[#E8734F]/20"
          }`}
          disabled={state === "processing"}
          aria-label={isActive ? "Stop listening" : "Start listening"}
        >
          {state === "listening" && (
            <span className="absolute inset-0 animate-ping rounded-full bg-red-500/30" />
          )}
          {state === "listening" ? <StopIcon size={24} /> : <MicIcon size={28} />}
        </button>

        <p className="text-[13px] font-medium text-stone-400 dark:text-stone-500">
          {state === "idle" && !displayText && "Tap to listen"}
          {state === "listening" && "Listening... tap to stop"}
          {state === "processing" && "Processing..."}
          {state === "idle" && displayText && "Tap to listen again"}
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ERROR
          ══════════════════════════════════════════════════════════════════ */}
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 dark:bg-red-950/30">
          <p className="text-center text-[12px] font-medium text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          THEY SAID — English first, Spanish underneath
          ══════════════════════════════════════════════════════════════════ */}
      {displayText && (
        <div className={`animate-fade-in rounded-2xl border bg-gradient-to-b from-white to-warm-50 p-4 shadow-card-elevated card-highlight dark:from-stone-800/90 dark:to-stone-800/70 ${match ? sectionBorderColor[match.section] ?? "border-stone-200/60 dark:border-stone-700/40" : "border-stone-200/60 dark:border-stone-700/40"}`}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400/70 dark:text-stone-500/60">
              They said
            </p>
            {match && (
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${sectionBadgeColor[match.section] ?? ""}`}>
                {match.section}
              </span>
            )}
          </div>

          {/* English meaning — large and prominent */}
          {match && hasResults ? (
            <p className="text-[18px] font-extrabold leading-tight text-stone-900 dark:text-stone-50">
              {`\u201C${match.theySaidEnglish}\u201D`}
            </p>
          ) : (
            <p className={`text-[15px] font-bold leading-tight text-stone-700 dark:text-stone-300 ${isInterim ? "opacity-50" : ""}`}>
              Interpreting...
            </p>
          )}

          {/* Original Spanish — smaller, secondary */}
          <p className={`mt-1.5 text-[13px] leading-snug text-stone-400 dark:text-stone-500 ${isInterim ? "opacity-50" : ""}`}>
            <span className="font-medium text-stone-500/60 dark:text-stone-600">{"Heard: "}</span>
            {`\u201C${displayText}\u201D`}
          </p>

          {/* Show correction if different */}
          {correctedText && correctedText !== finalText && hasResults && (
            <p className="mt-1 text-[11px] text-stone-300 dark:text-stone-600">
              {"Corrected: \u201C"}{correctedText}{"\u201D"}
            </p>
          )}

          {isInterim && (
            <p className="mt-1 text-[10px] text-stone-300 dark:text-stone-600">Still listening...</p>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          BEST REPLY — the main response card
          ══════════════════════════════════════════════════════════════════ */}
      {match && hasResults && (
        <div className="animate-fade-in">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400/70 dark:text-stone-500/60">
            Say this
          </p>

          <button
            onClick={() => handleSuggestedPhrase(match.phrase)}
            className={`group relative flex w-full flex-col overflow-hidden rounded-[18px] border-2 bg-gradient-to-b from-white to-warm-50 p-4 text-left shadow-card-elevated card-highlight transition-all duration-150 active:translate-y-px active:shadow-card-press dark:from-stone-800/90 dark:to-stone-800/70 ${sectionBorderColor[match.section] ?? "border-[#D94F2A]/30 dark:border-[#E8734F]/30"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <p className="text-[20px] font-extrabold leading-tight tracking-[0.01em] text-stone-900 dark:text-stone-50">
                  {match.phrase.spanish}
                </p>
                <p className="mt-1 text-[14px] leading-snug text-stone-500 dark:text-stone-400">
                  {match.phrase.english}
                </p>
                <p className="mt-1 font-mono text-[11px] leading-snug tracking-tight text-stone-300 dark:text-stone-600">
                  {match.phrase.pronunciation}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#D94F2A] px-3.5 py-2 text-white shadow-md shadow-[#D94F2A]/25 transition-transform active:scale-95 dark:bg-[#E8734F] dark:shadow-[#E8734F]/20">
                <WaveformIcon size={13} />
                <span className="text-[12px] font-extrabold">Speak</span>
              </div>
            </div>

            {/* Confidence + intent badge */}
            <div className="mt-3 flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full ${match.confidence >= 0.7 ? "bg-emerald-400" : match.confidence >= 0.5 ? "bg-amber-400" : "bg-stone-300"}`} />
              <span className={`text-[10px] font-semibold ${match.confidence >= 0.7 ? "text-emerald-600 dark:text-emerald-400" : match.confidence >= 0.5 ? "text-amber-600 dark:text-amber-400" : "text-stone-400"}`}>
                {match.confidence >= 0.7 ? "Strong match" : match.confidence >= 0.5 ? "Likely match" : "Best guess"}
              </span>
              <span className="text-[9px] text-stone-300 dark:text-stone-600">|</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${sectionBadgeColor[match.section] ?? "bg-stone-100 text-stone-600"}`}>
                {match.intent.replace(/_/g, " ")}
              </span>
            </div>
          </button>

          {/* Copy button */}
          <div className="mt-1.5 flex justify-end">
            <button
              onClick={() => onCopy(match.phrase.spanish)}
              className="rounded-md px-2 py-0.5 text-[10px] font-semibold text-stone-400 transition hover:text-stone-600 active:scale-95 dark:text-stone-500 dark:hover:text-stone-300"
            >
              Copy
            </button>
          </div>

          {/* ── Alternative phrases from same section ── */}
          {altPhrases.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400/60 dark:text-stone-500/50">
                Or try
              </p>
              <div className="flex flex-col gap-2">
                {altPhrases.map((phrase) => (
                  <button
                    key={phrase.spanish}
                    onClick={() => handleSuggestedPhrase(phrase)}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/60 bg-gradient-to-b from-white to-warm-50 px-3.5 py-2.5 text-left shadow-sm card-highlight transition-all duration-150 active:scale-[0.98] active:shadow-none dark:border-stone-700/40 dark:from-stone-800/90 dark:to-stone-800/70"
                  >
                    <div className="flex min-w-0 flex-col">
                      <p className="text-[14px] font-bold leading-tight text-stone-800 dark:text-stone-200">
                        {phrase.spanish}
                      </p>
                      <p className="mt-0.5 text-[12px] text-stone-400 dark:text-stone-500">
                        {phrase.english}
                      </p>
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

      {/* ══════════════════════════════════════════════════════════════════
          NO MATCH — guidance
          ══════════════════════════════════════════════════════════════════ */}
      {finalText && !match && state === "idle" && (
        <div className="animate-fade-in rounded-xl bg-amber-50/60 px-4 py-3 dark:bg-amber-900/15">
          <p className="text-center text-[13px] font-medium text-amber-700/70 dark:text-amber-400/60">
            {"Couldn\u2019t match that to a known phrase. Try listening again or switch to Fast mode for common responses."}
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          DEBUG PANEL — toggle with long-press on mic
          ══════════════════════════════════════════════════════════════════ */}
      {showDebug && (
        <div className="rounded-2xl border border-stone-200/60 bg-stone-50 p-4 text-left font-mono text-[10px] leading-relaxed text-stone-500 dark:border-stone-700/40 dark:bg-stone-900 dark:text-stone-400">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">Debug Panel</span>
            <button onClick={() => { setDebugLogs([]); setMicSettings(""); }} className="font-sans text-[10px] font-semibold text-stone-400 hover:text-stone-600">Clear</button>
          </div>

          {/* Browser + device */}
          <div className="mb-2 border-b border-stone-200/50 pb-2 dark:border-stone-700/30">
            <p><span className="text-stone-400">UA: </span>{navigator.userAgent.slice(0, 80)}...</p>
            <p><span className="text-stone-400">Lang: </span>es-MX (forced)</p>
            <p><span className="text-stone-400">Noise supp: </span>{noiseSuppression ? "ON" : "OFF"}</p>
            <p><span className="text-stone-400">Echo cancel: </span>{echoCancellation ? "ON" : "OFF"}</p>
          </div>

          {/* Mic track settings */}
          {micSettings && (
            <div className="mb-2 border-b border-stone-200/50 pb-2 dark:border-stone-700/30">
              <p className="font-bold text-stone-600 dark:text-stone-300">Mic Track Settings:</p>
              <pre className="whitespace-pre-wrap text-[9px]">{micSettings}</pre>
            </div>
          )}

          {/* Event logs */}
          <div className="max-h-48 overflow-y-auto scrollbar-hide">
            {debugLogs.length === 0 && <p className="text-stone-400">No events yet. Tap mic to start.</p>}
            {debugLogs.map((log, i) => (
              <p key={i} className={log.type === "error" ? "text-red-500" : log.type === "final" ? "text-emerald-600 dark:text-emerald-400" : log.type === "corrected" ? "text-amber-600 dark:text-amber-400" : log.type === "intent" ? "text-sky-600 dark:text-sky-400" : ""}>
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
