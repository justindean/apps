"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { SpeechMode } from "@/data/phrases";

/* -- TTS helper -- */
function speakSpanish(text: string) {
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-MX";
    u.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
}

/* -- Icons -- */
function WaveformIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12h2" /><path d="M6 8v8" /><path d="M10 4v16" /><path d="M14 6v12" /><path d="M18 8v8" /><path d="M22 12h2" />
    </svg>
  );
}

interface ToneVariant {
  tone: string;
  toneLabel: string;
  spanish: string;
  english: string;
  pronunciation?: string;
}

interface SayPanelProps {
  mode: SpeechMode;
  context: string | null;
  onCopy: (text: string) => void;
}

const toneLabels: Record<string, string> = {
  street: "Local",
  neutral: "Standard",
  formal: "Polite",
};

export function SayPanel({ mode, context, onCopy }: SayPanelProps) {
  const [input, setInput] = useState("");
  const [variants, setVariants] = useState<ToneVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const fetchTranslations = useCallback(async (text: string) => {
    if (!text.trim() || text.trim().length < 2) {
      setVariants([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          english: text.trim(),
          context: context ?? "general",
          tones: ["street", "neutral", "formal"],
        }),
      });

      if (!resp.ok) {
        throw new Error(`API error ${resp.status}`);
      }

      const data = await resp.json();

      if (data.variants && Array.isArray(data.variants)) {
        setVariants(data.variants.map((v: ToneVariant) => ({
          ...v,
          toneLabel: toneLabels[v.tone] || v.tone,
        })));
      } else if (data.spanish) {
        // Fallback: single response
        setVariants([{
          tone: mode,
          toneLabel: toneLabels[mode] || mode,
          spanish: data.spanish,
          english: text.trim(),
          pronunciation: data.pronunciation,
        }]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Translation failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [context, mode]);

  const handleInputChange = (val: string) => {
    setInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchTranslations(val);
    }, 600);
  };

  const handleSubmit = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchTranslations(input);
  };

  // Highlight the variant matching current mode
  const modeOrder = [mode, ...["street", "neutral", "formal"].filter((t) => t !== mode)] as string[];

  const sortedVariants = [...variants].sort((a, b) => {
    const aIdx = modeOrder.indexOf(a.tone);
    const bIdx = modeOrder.indexOf(b.tone);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });

  return (
    <div className="flex flex-col gap-5 pt-4">
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="What do you want to say?"
          className="w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-[16px] font-medium text-stone-800 shadow-sm outline-none transition placeholder:text-stone-300 focus:border-[#D94F2A]/30 focus:shadow-[0_0_0_3px_rgba(217,79,42,0.06)] focus:ring-0"
        />
        {input && !loading && (
          <button
            onClick={handleSubmit}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-[#D94F2A] px-3.5 py-2 text-[12px] font-bold text-white transition active:scale-95"
          >
            Translate
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-8">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#D94F2A]/40" />
          <p className="text-[14px] font-medium text-stone-400 animate-pulse">Translating...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3">
          <p className="text-center text-[12px] font-medium text-red-600">{error}</p>
        </div>
      )}

      {/* Tone variant cards */}
      {!loading && sortedVariants.length > 0 && (
        <div className="flex flex-col gap-3">
          {sortedVariants.map((v, i) => {
            const isPreferred = v.tone === mode;
            return (
              <div
                key={`${v.tone}-${i}`}
                className={`rounded-[20px] border bg-gradient-to-b from-white to-stone-50/50 p-5 transition-all ${
                  isPreferred
                    ? "border-[#D94F2A]/25 shadow-[0_2px_16px_-4px_rgba(217,79,42,0.1)]"
                    : "border-stone-200/60 shadow-sm"
                }`}
              >
                {/* Tone label */}
                <div className="mb-3 flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isPreferred
                      ? "bg-[#D94F2A]/[0.08] text-[#D94F2A]"
                      : "bg-stone-100 text-stone-400"
                  }`}>
                    {v.toneLabel}
                  </span>
                  {isPreferred && (
                    <span className="text-[10px] font-medium text-stone-400">Selected tone</span>
                  )}
                </div>

                {/* Spanish phrase */}
                <p className={`text-[20px] font-extrabold leading-tight text-stone-900 ${isPreferred ? "" : "text-[18px]"}`}>
                  {v.spanish}
                </p>

                {/* English explanation */}
                <p className="mt-1.5 text-[13px] leading-snug text-stone-500">
                  {v.english}
                </p>

                {/* Pronunciation */}
                {v.pronunciation && (
                  <p className="mt-1 font-mono text-[11px] text-stone-300">
                    {v.pronunciation}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2.5">
                  <button
                    onClick={() => speakSpanish(v.spanish)}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold transition active:scale-95 ${
                      isPreferred
                        ? "bg-[#D94F2A] text-white shadow-md shadow-[#D94F2A]/20"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    <WaveformIcon size={13} />
                    Speak
                  </button>
                  <button
                    onClick={() => onCopy(v.spanish)}
                    className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2 text-[12px] font-bold text-stone-500 transition hover:border-stone-300 active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                    </svg>
                    Copy
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && variants.length === 0 && !input && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="h-10 w-10 text-stone-200">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
          <p className="text-[14px] font-medium text-stone-300">
            Type what you want to say in English.
          </p>
          <p className="text-[12px] text-stone-300/70">
            {"We\u2019ll give you the Spanish in 3 tones."}
          </p>
        </div>
      )}
    </div>
  );
}
