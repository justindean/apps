import { useState, useRef, useEffect, useCallback } from "react";
import type { SpeechMode } from "../data/phrases";

/* ── TTS ── */
function speakPhrase(text: string) {
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-MX";
    u.rate = 0.88;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
}

/* ── Icons ── */
function WaveformIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12h2" /><path d="M6 8v8" /><path d="M10 4v16" /><path d="M14 6v12" /><path d="M18 8v8" /><path d="M22 12h2" />
    </svg>
  );
}

function VolumeIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

/* ── Types ── */
interface SayResult {
  spanish: string;
  english: string;
  pronunciation: string;
  alternates?: { spanish: string; english: string; pronunciation: string }[];
}

interface SayPanelProps {
  mode: SpeechMode;
  onClose: () => void;
  onCopy: (text: string) => void;
}

/* ── System prompt for generation ── */
function getGenerationPrompt(tone: SpeechMode): string {
  const toneDesc =
    tone === "street" ? "casual, colloquial, slang-friendly Mexican Spanish"
    : tone === "formal" ? "very polite, respectful, usted-form Mexican Spanish"
    : "polite everyday Mexican Spanish, tu or usted depending on context";

  return [
    "You are a Spanish language assistant for English-speaking travelers in Mexico.",
    "The user will describe IN ENGLISH what they want to say.",
    "Generate natural, spoken " + toneDesc + " for a restaurant scenario.",
    "",
    "Return ONLY valid JSON in this exact format:",
    "{",
    '  "spanish": "the main Spanish phrase",',
    '  "english": "what it means (the user\'s intent restated clearly)",',
    '  "pronunciation": "simplified pronunciation guide for English speakers",',
    '  "alternates": [',
    '    { "spanish": "...", "english": "...", "pronunciation": "..." }',
    "  ]",
    "}",
    "",
    "Rules:",
    "- Keep phrases short and speakable (under 12 words).",
    "- alternates: 1-2 variations maximum, each a meaningfully different way to say it.",
    "- Use Mexican Spanish only.",
    "- Do NOT explain grammar or add notes.",
    "- Do NOT wrap in markdown code blocks.",
    "- pronunciation should use English-friendly phonetics (e.g. \"KWAHN-toh KWEHS-tah\").",
  ].join("\n");
}

/* ═══════════════════════════════════════════════════════════════════════
   SayPanel
   ═══════════════════════════════════════════════════════════════════════ */
export default function SayPanel({ mode, onClose, onCopy }: SayPanelProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SayResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const backdropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toneLabel = mode === "street" ? "Street" : mode === "formal" ? "Formal" : "Neutral";

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          tone: mode,
          systemPromptOverride: getGenerationPrompt(mode),
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        setError("Failed: " + errText.slice(0, 100));
        return;
      }

      const data = await resp.json() as SayResult;
      if (!data.spanish) {
        setError("No Spanish phrase generated. Try rephrasing.");
        return;
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [input, loading, mode]);

  const handleSpeak = useCallback((text: string) => {
    speakPhrase(text);
    onCopy(text);
  }, [onCopy]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="I want to say something"
    >
      <div className="w-full max-w-lg animate-slide-up rounded-t-3xl bg-white px-4 pb-8 pt-3 shadow-glass dark:bg-stone-800">
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-stone-300 dark:bg-stone-600" />

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              I want to say...
            </h3>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:bg-stone-700 dark:text-stone-400">
              {toneLabel}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-all duration-150 active:scale-95 dark:bg-stone-700 dark:text-stone-400"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Input area */}
        <div className="mb-4">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder={'Type in English what you want to say...\ne.g. "Can I get the check please?"'}
            rows={2}
            className="w-full resize-none rounded-2xl border border-stone-200/60 bg-stone-50/50 px-4 py-3 text-[15px] leading-relaxed text-stone-900 placeholder:text-stone-400 focus:border-[#D94F2A]/40 focus:outline-none focus:ring-2 focus:ring-[#D94F2A]/20 dark:border-stone-700/40 dark:bg-stone-900/30 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-[#E8734F]/40 dark:focus:ring-[#E8734F]/20"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
              className="flex items-center gap-2 rounded-full bg-[#D94F2A] px-5 py-2.5 text-[13px] font-bold text-white shadow-md shadow-[#D94F2A]/25 transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:shadow-none dark:bg-[#E8734F] dark:shadow-[#E8734F]/20"
            >
              {loading ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Translating...
                </>
              ) : (
                "Translate"
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 dark:bg-red-950/30">
            <p className="text-center text-[12px] font-medium text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        <div className="max-h-[50dvh] overflow-y-auto">
          {/* Loading placeholder */}
          {loading && !result && (
            <div className="rounded-2xl border border-stone-200/40 bg-gradient-to-b from-white to-stone-50 p-4 dark:border-stone-700/30 dark:from-stone-800/90 dark:to-stone-800/70">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-[#D94F2A]" />
                <p className="animate-pulse text-[14px] font-semibold text-[#D94F2A]">
                  Generating your phrase...
                </p>
              </div>
            </div>
          )}

          {/* Result cards */}
          {result && (
            <div className="flex flex-col gap-4 animate-fade-in">
              {/* Main phrase card */}
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400/70 dark:text-stone-500/60">
                  Say this
                </p>
                <button
                  onClick={() => handleSpeak(result.spanish)}
                  className="group relative flex w-full flex-col overflow-hidden rounded-[18px] border-2 border-[#D94F2A]/30 bg-gradient-to-b from-white to-stone-50 p-4 text-left shadow-card-elevated card-highlight transition-all duration-150 active:translate-y-px active:shadow-card-press dark:border-[#E8734F]/30 dark:from-stone-800/90 dark:to-stone-800/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col">
                      <p className="text-[20px] font-extrabold leading-tight tracking-[0.01em] text-stone-900 dark:text-stone-50">
                        {result.spanish}
                      </p>
                      <p className="mt-1 text-[14px] leading-snug text-stone-500 dark:text-stone-400">
                        {result.english}
                      </p>
                      {result.pronunciation && (
                        <p className="mt-1 font-mono text-[11px] leading-snug tracking-tight text-stone-300 dark:text-stone-600">
                          {result.pronunciation}
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
                    onClick={() => onCopy(result.spanish)}
                    className="rounded-md px-2 py-0.5 text-[10px] font-semibold text-stone-400 transition hover:text-stone-600 active:scale-95 dark:text-stone-500 dark:hover:text-stone-300"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Alternates */}
              {result.alternates && result.alternates.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400/60 dark:text-stone-500/50">
                    Or say
                  </p>
                  <div className="flex flex-col gap-2">
                    {result.alternates.map((alt) => (
                      <button
                        key={alt.spanish}
                        onClick={() => handleSpeak(alt.spanish)}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/60 bg-gradient-to-b from-white to-stone-50 px-3.5 py-2.5 text-left shadow-sm card-highlight transition-all duration-150 active:scale-[0.98] active:shadow-none dark:border-stone-700/40 dark:from-stone-800/90 dark:to-stone-800/70"
                      >
                        <div className="flex min-w-0 flex-col">
                          <p className="text-[14px] font-bold leading-tight text-stone-800 dark:text-stone-200">
                            {alt.spanish}
                          </p>
                          {alt.english && (
                            <p className="mt-0.5 text-[12px] text-stone-400 dark:text-stone-500">
                              {alt.english}
                            </p>
                          )}
                          {alt.pronunciation && (
                            <p className="mt-0.5 font-mono text-[10px] tracking-tight text-stone-300 dark:text-stone-600">
                              {alt.pronunciation}
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

              {/* Try another */}
              <button
                onClick={() => { setResult(null); setInput(""); setTimeout(() => inputRef.current?.focus(), 100); }}
                className="mx-auto rounded-full border border-stone-200/60 px-4 py-2 text-[12px] font-semibold text-stone-500 transition-all duration-150 active:scale-95 dark:border-stone-700/40 dark:text-stone-400"
              >
                Say something else
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
