import { useState, useRef, useCallback, useEffect } from "react";
import type { Phrase, SpeechMode } from "../data/phrases";
import { classifyIntent, getSectionPhrases, getReplyKeys, buildIntentMatchFromLLM } from "../data/restaurantIntents";
import type { IntentMatch, LLMClassifyResponse } from "../data/restaurantIntents";

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
function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone Safari";
  if (/iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iPad Safari";
  if (/Android/.test(ua)) return "Android";
  if (/Chrome/.test(ua)) return "Chrome Desktop";
  if (/Firefox/.test(ua)) return "Firefox";
  return "Unknown browser";
}

/* ── Spanish corrections ── */
const CORRECTIONS: [RegExp, string][] = [
  [/\ba fuera\b/gi, "afuera"],
  [/\ba dentro\b/gi, "adentro"],
  [/\ba dent?ro? o a ?fuera?\b/gi, "adentro o afuera"],
  [/\bafuera? o ?a ?dent?ro?\b/gi, "afuera o adentro"],
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

/* ── Restaurant hotwords for grammar hints ── */
const RESTAURANT_HINTS = [
  "afuera", "adentro", "mesa", "cuenta", "propina", "servicio",
  "cerveza", "agua", "menu", "ordenar", "tarjeta", "efectivo",
  "recibo", "picante", "chile", "salsa", "tomar", "beber",
  "pedir", "separado", "junto", "pesos", "cambio", "terraza",
];

/* ── Section colors ── */
const sectionBorderColor: Record<string, string> = {
  Arrival: "border-sky-300/60 dark:border-sky-600/40",
  Drinks: "border-amber-300/60 dark:border-amber-600/40",
  Food: "border-orange-300/60 dark:border-orange-500/40",
  Bill: "border-emerald-300/60 dark:border-emerald-600/40",
  Tip: "border-violet-300/60 dark:border-violet-600/40",
  Clarify: "border-stone-300/60 dark:border-stone-600/40",
};

const sectionBadgeColor: Record<string, string> = {
  Arrival: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
  Drinks: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  Food: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  Bill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  Tip: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
  Clarify: "bg-stone-100 text-stone-600 dark:bg-stone-800/40 dark:text-stone-400",
};

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
  const [llmClassifying, setLlmClassifying] = useState(false);

  // Mode detection
  const [captureMode] = useState(() => isIOSSafari());
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

  const addLog = useCallback((type: DebugLog["type"], text: string) => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    setDebugLogs((prev) => [...prev.slice(-60), { time, type, text }]);
  }, []);

  /* ── Process transcript (shared by both modes) ── */
  /* PASS 1: Fast deterministic keyword matching
     PASS 2: If confidence < 0.6, fire LLM classifier in background to refine */
  const processTranscript = useCallback(
    (rawText: string) => {
      if (!rawText.trim()) return;

      const corrected = correctSpanish(rawText);
      setCorrectedText(corrected);
      if (corrected !== rawText) addLog("corrected", `"${rawText}" -> "${corrected}"`);

      // ── PASS 1: Deterministic keyword classifier ──
      const keywordMatch = classifyIntent(corrected, mode);
      setMatch(keywordMatch);
      addLog("intent", `[keyword] ${keywordMatch.intent} [${keywordMatch.section}] conf=${keywordMatch.confidence}`);

      const all = getSectionPhrases(keywordMatch.section, mode);
      setAltPhrases(all.filter((p) => p.spanish !== keywordMatch.phrase.spanish).slice(0, 4));

      // ── PASS 2: LLM classifier if keyword match is uncertain ──
      if (keywordMatch.confidence < 0.6) {
        addLog("info", `Low confidence (${keywordMatch.confidence}), running LLM classifier...`);
        setLlmClassifying(true);

        const replyKeys = getReplyKeys(mode);

        fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: corrected, replyKeys }),
        })
          .then((r) => r.json())
          .then((data: LLMClassifyResponse & { error?: string }) => {
            if (data.error) {
              addLog("error", `LLM: ${data.error}`);
              // Keep keyword match -- it's still better than nothing
              return;
            }

            addLog("intent", `[LLM] ${data.intent} conf=${data.confidence} reply=${data.best_reply_key}`);
            addLog("info", `[LLM] meaning: "${data.meaning_en}"`);

            const llmResult = buildIntentMatchFromLLM(data, mode);

            // Only upgrade if LLM is more confident or keyword was UNCLEAR
            if (
              keywordMatch.intent === "UNCLEAR" ||
              (data.confidence ?? 0) > keywordMatch.confidence
            ) {
              setMatch(llmResult.match);
              if (llmResult.altPhrases.length > 0) {
                setAltPhrases(llmResult.altPhrases);
              }
              addLog("info", `[LLM] Upgraded from keyword (${keywordMatch.intent} ${keywordMatch.confidence}) to LLM (${llmResult.match.intent} ${llmResult.match.confidence})`);
            } else {
              addLog("info", `[LLM] Kept keyword match (higher confidence)`);
            }
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : "LLM classify failed";
            addLog("error", `LLM: ${msg}`);
            // Keep the keyword match
          })
          .finally(() => setLlmClassifying(false));
      }
    },
    [mode, addLog],
  );

  /* ═══════════════════════════════════════════════════════════════════════
     CAPTURE MODE — iOS Safari: record audio blob -> server Whisper
     ═══════════════════════════════════════════════════════════════════════ */
  const startCapture = useCallback(async () => {
    setError(null);
    setInterimText("");
    setFinalText("");
    setCorrectedText("");
    setMatch(null);
    setAltPhrases([]);

    addLog("capture", "Requesting mic (capture mode)...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: { ideal: 44100 }, echoCancellation: true, noiseSuppression: true },
      });

      // Log mic settings
      const track = stream.getAudioTracks()[0];
      if (track) {
        const s = track.getSettings();
        setMicSettings(JSON.stringify(s, null, 2));
        addLog("info", `Mic: ${track.label} sr=${s.sampleRate}`);
      }

      // Determine best supported mime type
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

        try {
          const form = new FormData();
          form.append("audio", blob, `audio.${mimeType.includes("mp4") ? "mp4" : "webm"}`);
          form.append("model", "whisper-1");
          form.append("language", "es");
          form.append("prompt", "Conversacion en restaurante mexicano: menu, cerveza, cuenta, propina, adentro, afuera, mesa, tarjeta, efectivo.");

          const resp = await fetch("/api/transcribe", { method: "POST", body: form });
          const data = await resp.json();

          if (data.error) {
            addLog("error", data.error);
            setError(data.error);
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

      mediaRecorderRef.current = recorder;
      recorder.start(250); // chunk every 250ms
      setState("recording");
      addLog("capture", "Recording started (10s max)");

      // Auto-stop after 12 seconds
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

  /* ═══════════════════════════════════════════════════════════════════════
     REALTIME MODE — Chrome/desktop: SpeechRecognition streaming
     ═══════════════════════════════════════════════════════════════════════ */
  const startRealtime = useCallback(async () => {
    setError(null);
    setInterimText("");
    setFinalText("");
    setCorrectedText("");
    setMatch(null);
    setAltPhrases([]);
    finalTextRef.current = "";

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError("Speech recognition not supported. Try Chrome.");
      return;
    }

    // Request mic with quality constraints
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

      if (final) {
        finalTextRef.current = final;
        setFinalText(final);
        setInterimText("");
        processTranscript(final);
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
      addLog("info", "Listening (es-MX, realtime)");
    } catch {
      setError("Could not start recognition.");
    }
  }, [processTranscript, addLog]);

  const stopRealtime = useCallback(() => {
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
    };
  }, []);

  const handleSuggestedPhrase = useCallback((phrase: Phrase) => {
    speakPhrase(phrase.spanish);
    onSpeak(phrase);
  }, [onSpeak]);

  const displayText = finalText || interimText;
  const isInterim = !finalText && !!interimText;
  const hasResults = !!finalText && (state === "idle" || !!match);

  /* ═════════════════════════════════════════════════════════════════════
     RENDER
     ═════════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col gap-5">

      {/* ── Mode indicator + Debug toggle ── */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500">
          {captureMode ? "Capture mode (iOS)" : "Realtime mode"}{" \u00B7 "}{deviceInfo}
        </p>
        <button
          onClick={() => setShowDebug((p) => !p)}
          className={`rounded-lg p-1.5 transition ${showDebug ? "bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-200" : "text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400"}`}
          aria-label="Toggle debug panel"
        >
          <GearIcon size={16} />
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MIC BUTTON
          ══════════════════════════════════════════════════════════════════ */}
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

        {captureMode && state === "recording" && (
          <p className="text-[11px] text-stone-300 dark:text-stone-600">Auto-stops after 12 seconds</p>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 dark:bg-red-950/30">
          <p className="text-center text-[12px] font-medium text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          THEY SAID — English meaning first, Spanish heard underneath
          ══════════════════════════════════════════════════════════════════ */}
      {displayText && (
        <div className={`animate-fade-in rounded-2xl border bg-gradient-to-b from-white to-warm-50 p-4 shadow-card-elevated card-highlight dark:from-stone-800/90 dark:to-stone-800/70 ${match ? sectionBorderColor[match.section] ?? "border-stone-200/60 dark:border-stone-700/40" : "border-stone-200/60 dark:border-stone-700/40"}`}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400/70 dark:text-stone-500/60">They said</p>
            {match && match.section !== "Clarify" && (
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${sectionBadgeColor[match.section] ?? ""}`}>
                {match.section}
              </span>
            )}
          </div>

          {/* English meaning */}
          {match && hasResults ? (
            <p className="text-[18px] font-extrabold leading-tight text-stone-900 dark:text-stone-50">
              {`\u201C${match.theySaidEnglish}\u201D`}
            </p>
          ) : (
            <p className={`text-[15px] font-bold leading-tight text-stone-700 dark:text-stone-300 ${isInterim ? "opacity-50" : ""}`}>
              {state === "processing" ? "Interpreting..." : "Listening..."}
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

          {/* Confidence + LLM status */}
          {match && hasResults && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${match.confidence >= 0.6 ? "bg-emerald-400" : match.confidence >= 0.4 ? "bg-amber-400" : "bg-stone-300"}`} />
                <span className={`text-[10px] font-semibold ${match.confidence >= 0.6 ? "text-emerald-600 dark:text-emerald-400" : match.confidence >= 0.4 ? "text-amber-600 dark:text-amber-400" : "text-stone-400"}`}>
                  {match.confidence >= 0.6 ? "Strong match" : match.confidence >= 0.4 ? "Likely match" : "Best guess"}
                </span>
              </div>
              {llmClassifying && (
                <span className="animate-pulse text-[10px] font-medium text-sky-500 dark:text-sky-400">Refining...</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          BEST REPLY — always shown when we have results (never blank)
          ══════════════════════════════════════════════════════════════════ */}
      {match && hasResults && (
        <div className="animate-fade-in">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400/70 dark:text-stone-500/60">
            {match.section === "Clarify"
              ? "Not sure \u2014 try asking"
              : match.confidence < 0.5
                ? `Sounds like ${match.section.toLowerCase()} \u2014 try saying`
                : "Say this"}
          </p>

          <button
            onClick={() => handleSuggestedPhrase(match.phrase)}
            className={`group relative flex w-full flex-col overflow-hidden rounded-[18px] border-2 bg-gradient-to-b from-white to-warm-50 p-4 text-left shadow-card-elevated card-highlight transition-all duration-150 active:translate-y-px active:shadow-card-press dark:from-stone-800/90 dark:to-stone-800/70 ${sectionBorderColor[match.section] ?? "border-stone-300/60"}`}
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
          </button>

          {/* Copy */}
          <div className="mt-1.5 flex justify-end">
            <button
              onClick={() => onCopy(match.phrase.spanish)}
              className="rounded-md px-2 py-0.5 text-[10px] font-semibold text-stone-400 transition hover:text-stone-600 active:scale-95 dark:text-stone-500 dark:hover:text-stone-300"
            >
              Copy
            </button>
          </div>

          {/* ── Alternative phrases ── */}
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

      {/* ═══════════════════════════════════════���══════════════════════════
          DEBUG PANEL
          ══════════════════════════════════════════════════════════════════ */}
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
            <p><span className="text-stone-400">iOS Safari: </span>{isIOSSafari() ? "Yes" : "No"}</p>
            <p><span className="text-stone-400">UA: </span>{navigator.userAgent.slice(0, 100)}</p>
          </div>

          {/* Mic settings */}
          {micSettings && (
            <div className="mb-2 border-b border-stone-200/50 pb-2 dark:border-stone-700/30">
              <p className="font-bold text-stone-600 dark:text-stone-300">Mic Track:</p>
              <pre className="whitespace-pre-wrap text-[9px]">{micSettings}</pre>
            </div>
          )}

          {/* Transcript + intent summary */}
          {(finalText || correctedText || match) && (
            <div className="mb-2 border-b border-stone-200/50 pb-2 dark:border-stone-700/30">
              <p className="font-bold text-stone-600 dark:text-stone-300">Last Result:</p>
              {finalText && <p><span className="text-stone-400">Raw: </span>{`"${finalText}"`}</p>}
              {correctedText && correctedText !== finalText && <p><span className="text-amber-500">Corrected: </span>{`"${correctedText}"`}</p>}
              {match && <p><span className="text-sky-500">Intent: </span>{match.intent} [{match.section}] conf={match.confidence}</p>}
              {match && <p><span className="text-sky-500">English: </span>{match.theySaidEnglish}</p>}
              {match && <p><span className="text-emerald-500">Reply: </span>{match.phrase.spanish} ({match.phrase.english})</p>}
            </div>
          )}

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
