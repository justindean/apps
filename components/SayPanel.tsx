"use client";

import { useState, useRef, useCallback } from "react";

/* ── Types ── */
interface ToneVariant {
  tone: string;
  spanish: string;
  english: string;
  pronunciation: string;
}

interface SayPanelProps {
  context?: string;
  onCopy: (text: string) => void;
  onClose: () => void;
}

/* ── TTS helper ── */
function speakText(text: string) {
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-MX";
    u.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
}

const toneLabels: Record<string, { label: string; desc: string }> = {
  local: { label: "Local", desc: "Casual, street-level" },
  standard: { label: "Standard", desc: "Polite and clear" },
  polite: { label: "Polite", desc: "Formal and respectful" },
};

export function SayPanel({ context, onCopy, onClose }: SayPanelProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<ToneVariant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTranslate = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setVariants([]);

    try {
      const resp = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "say",
          english: trimmed,
          context: context || "auto",
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        setError(`Translation failed (${resp.status})`);
        console.error("[SayPanel] API error:", errText.slice(0, 200));
        return;
      }

      const data = await resp.json();
      if (data.variants && Array.isArray(data.variants)) {
        setVariants(data.variants);
      } else {
        setError("Unexpected response format");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setLoading(false);
    }
  }, [input, loading, context]);

  const handleSpeak = (text: string, idx: number) => {
    setSpeakingIdx(idx);
    speakText(text);
    setTimeout(() => setSpeakingIdx(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FAF9F7]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] pb-3">
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-full p-2 text-stone-400 transition hover:text-stone-700 active:scale-95"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </button>

        <h2 className="text-[16px] font-bold text-stone-900">Say it in Spanish</h2>

        <div className="w-9" />
      </div>

      {/* Input area */}
      <div className="px-5 pb-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to say?"
            className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-[15px] font-medium text-stone-900 placeholder:text-stone-300 focus:border-[#D94F2A]/40 focus:outline-none focus:ring-2 focus:ring-[#D94F2A]/10 transition-colors"
            autoFocus
          />
          <button
            onClick={handleTranslate}
            disabled={!input.trim() || loading}
            className="flex items-center justify-center rounded-2xl bg-[#D94F2A] px-5 py-3.5 text-[14px] font-bold text-white shadow-md shadow-[#D94F2A]/20 transition-all duration-150 hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:shadow-none"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              "Go"
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-[12px] text-stone-400">
          Type when you're not rushed.
        </p>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-5 pb-10">
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-center text-[13px] font-medium text-red-600">
            {error}
          </div>
        )}

        {loading && variants.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D94F2A]/20 border-t-[#D94F2A]" />
            <p className="text-[13px] font-medium text-stone-400">Translating...</p>
          </div>
        )}

        {variants.length > 0 && (
          <div className="flex flex-col gap-3">
            {variants.map((v, i) => {
              const meta = toneLabels[v.tone] ?? { label: v.tone, desc: "" };
              return (
                <div
                  key={v.tone}
                  className="rounded-2xl border border-stone-200/60 bg-gradient-to-b from-white to-stone-50/50 p-4 shadow-sm"
                >
                  {/* Tone label */}
                  <div className="mb-2.5 flex items-center gap-2">
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-stone-400">{meta.desc}</span>
                  </div>

                  {/* Spanish phrase */}
                  <p className="text-[20px] font-extrabold leading-tight text-stone-900">
                    {v.spanish}
                  </p>

                  {/* English back-translation */}
                  <p className="mt-1 text-[14px] text-stone-500">
                    {v.english}
                  </p>

                  {/* Pronunciation */}
                  {v.pronunciation && (
                    <p className="mt-1 font-mono text-[11px] text-stone-300">
                      {v.pronunciation}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleSpeak(v.spanish, i)}
                      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold transition-all active:scale-95 ${
                        speakingIdx === i
                          ? "bg-[#D94F2A] text-white shadow-md shadow-[#D94F2A]/25"
                          : "bg-[#D94F2A]/[0.08] text-[#D94F2A] hover:bg-[#D94F2A]/[0.14]"
                      }`}
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M2 12h2" /><path d="M6 8v8" /><path d="M10 4v16" /><path d="M14 6v12" /><path d="M18 8v8" /><path d="M22 12h2" />
                      </svg>
                      {speakingIdx === i ? "Speaking..." : "Speak"}
                    </button>
                    <button
                      onClick={() => onCopy(v.spanish)}
                      className="flex items-center gap-1 rounded-full bg-stone-100 px-3.5 py-2 text-[12px] font-semibold text-stone-500 transition hover:bg-stone-200 active:scale-95"
                    >
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
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
        {!loading && variants.length === 0 && !error && (
          <div className="flex flex-col items-center pt-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="mb-4 h-12 w-12 text-stone-200">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <p className="text-[15px] font-semibold text-stone-400">
              Type in English, get Spanish.
            </p>
            <p className="mt-1 text-[12px] text-stone-300">
              Three tone variants: local, standard, polite.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
