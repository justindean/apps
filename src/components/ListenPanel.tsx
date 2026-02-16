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
type SpeechRecognitionInstance = InstanceType<typeof window.SpeechRecognition> & {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

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
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

type ListenState = "idle" | "listening" | "processing";

interface ListenPanelProps {
  mode: SpeechMode;
  onCopy: (text: string) => void;
  onSpeak: (phrase: Phrase) => void;
}

export function ListenPanel({ mode, onCopy, onSpeak }: ListenPanelProps) {
  const [state, setState] = useState<ListenState>("idle");
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [match, setMatch] = useState<IntentMatch | null>(null);
  const [altPhrases, setAltPhrases] = useState<Phrase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTextRef = useRef("");

  // Check browser support on mount
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  const processTranscript = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const intentMatch = classifyIntent(text, mode);
      setMatch(intentMatch);
      if (intentMatch) {
        setAltPhrases(getSectionPhrases(intentMatch.section, mode));
      } else {
        setAltPhrases([]);
      }
    },
    [mode],
  );

  const startListening = useCallback(() => {
    setError(null);
    setInterimText("");
    setFinalText("");
    setMatch(null);
    setAltPhrases([]);
    finalTextRef.current = "";

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SR();
    recognition.lang = "es-MX";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        finalTextRef.current = final;
        setFinalText(final);
        setInterimText("");
        // Process immediately on each final result so user gets live feedback
        processTranscript(final);
      } else {
        setInterimText(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech" and "aborted" are normal when user stops
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(event.error === "not-allowed"
        ? "Microphone access denied. Please allow microphone permissions."
        : `Recognition error: ${event.error}`);
      setState("idle");
    };

    recognition.onend = () => {
      // If we have accumulated text, do a final classification pass
      if (finalTextRef.current.trim()) {
        setState("processing");
        processTranscript(finalTextRef.current);
        // Brief delay so the user sees "Processing" before results
        setTimeout(() => setState("idle"), 300);
      } else if (state === "listening") {
        setState("idle");
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setState("listening");
    } catch {
      setError("Could not start speech recognition.");
    }
  }, [mode, processTranscript, state]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    // onend handler will set state to processing → idle
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
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

  const isActive = state === "listening" || state === "processing";
  const displayText = finalText || interimText;
  const isInterim = !finalText && !!interimText;

  // Unsupported browser
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
    <div className="flex flex-col gap-4">
      {/* ── Mic Button ── */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={isActive ? stopListening : startListening}
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
          {state === "listening" ? (
            <StopIcon size={24} />
          ) : (
            <MicIcon size={28} />
          )}
        </button>

        <p className="text-[13px] font-medium text-stone-400 dark:text-stone-500">
          {state === "idle" && !displayText && "Tap to listen"}
          {state === "listening" && "Listening... tap to stop"}
          {state === "processing" && "Processing..."}
          {state === "idle" && displayText && "Tap to listen again"}
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 dark:bg-red-950/30">
          <p className="text-center text-[12px] font-medium text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* ── Live Transcript ── */}
      {displayText && (
        <div className="animate-fade-in rounded-2xl border border-stone-200/60 bg-gradient-to-b from-white to-warm-50 p-4 shadow-card-elevated card-highlight dark:border-stone-700/40 dark:from-stone-800/90 dark:to-stone-800/70">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone-400/70 dark:text-stone-500/60">
            They said
          </p>
          <p className={`text-[17px] font-extrabold leading-tight text-stone-900 dark:text-stone-50 ${isInterim ? "opacity-60" : ""}`}>
            {`\u201C${displayText}\u201D`}
          </p>
          {isInterim && (
            <p className="mt-1 text-[10px] text-stone-400 dark:text-stone-500">Still listening...</p>
          )}
        </div>
      )}

      {/* ── Suggested Response ── */}
      {match && (
        <div className="animate-fade-in">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400/70 dark:text-stone-500/60">
            Say this
          </p>

          {/* Primary suggestion */}
          <button
            onClick={() => handleSuggestedPhrase(match.phrase)}
            className="group relative flex w-full flex-col overflow-hidden rounded-[18px] border-2 border-[#D94F2A]/30 bg-gradient-to-b from-white to-warm-50 p-4 text-left shadow-card-elevated card-highlight transition-all duration-150 active:translate-y-px active:shadow-card-press dark:border-[#E8734F]/30 dark:from-stone-800/90 dark:to-stone-800/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <p className="text-[19px] font-extrabold leading-tight tracking-[0.01em] text-stone-900 dark:text-stone-50">
                  {match.phrase.spanish}
                </p>
                <p className="mt-1.5 text-[13px] leading-snug text-stone-400 dark:text-stone-500">
                  {match.phrase.english}
                </p>
                <p className="mt-1 font-mono text-[10.5px] leading-snug tracking-tight text-stone-300 dark:text-stone-600">
                  {match.phrase.pronunciation}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#D94F2A] px-3 py-1.5 text-white shadow-md shadow-[#D94F2A]/25 dark:bg-[#E8734F] dark:shadow-[#E8734F]/20">
                <WaveformIcon size={12} />
                <span className="text-[11px] font-extrabold">Speak</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                {Math.round(match.confidence * 100)}% match
              </span>
              <span className="text-[10px] text-stone-400 dark:text-stone-500">
                {match.section}
              </span>
            </div>
          </button>

          {/* Alternative phrases from same section */}
          {altPhrases.length > 1 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400/60 dark:text-stone-500/50">
                Or try
              </p>
              <div className="flex flex-wrap gap-2">
                {altPhrases
                  .filter((p) => p.spanish !== match.phrase.spanish)
                  .map((phrase) => (
                    <button
                      key={phrase.spanish}
                      onClick={() => handleSuggestedPhrase(phrase)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-stone-200/60 bg-gradient-to-b from-white to-warm-50 px-3 py-1.5 shadow-sm transition-all duration-150 active:scale-[0.96] active:shadow-none dark:border-stone-700/40 dark:from-stone-800/90 dark:to-stone-800/70"
                    >
                      <VolumeIcon size={10} />
                      <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">{phrase.spanish}</span>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500">{phrase.english}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── No match state ── */}
      {displayText && !match && !isInterim && state === "idle" && (
        <div className="animate-fade-in rounded-xl bg-amber-50/60 px-4 py-3 text-center dark:bg-amber-900/15">
          <p className="text-[12px] font-medium text-amber-700/70 dark:text-amber-400/60">
            {"Didn't catch a match. Try listening again or switch to Fast mode."}
          </p>
        </div>
      )}
    </div>
  );
}
