"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { SpeechMode, Phrase } from "@/data/phrases";
import SpeechModeToggle from "@/components/SpeechModeToggle";
import { ListenPanel } from "@/components/ListenPanel";

/* ── Context pills ── */
const contexts = [
  { id: "auto", label: "Auto" },
  { id: "food", label: "Food" },
  { id: "getting-around", label: "Getting Around" },
  { id: "services", label: "Services" },
  { id: "emergency", label: "Emergency" },
] as const;

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

/* ── Types ── */
interface TranslateResult {
  spanish: string;
  pronunciation: string;
  literal_back: string;
  alt_spanish?: string;
  alt_pronunciation?: string;
}

interface HistoryEntry {
  id: number;
  mode: "listen" | "say";
  input: string;
  output: string;
  timestamp: number;
}

type ToastState = { visible: boolean; text: string };

export default function Page() {
  const [mode, setMode] = useState<SpeechMode>("neutral");
  const [activeContext, setActiveContext] = useState("auto");
  const [toast, setToast] = useState<ToastState>({ visible: false, text: "" });

  // Listening overlay
  const [showListening, setShowListening] = useState(false);
  const [autoStartListen, setAutoStartListen] = useState(false);

  // SAY input
  const [sayInput, setSayInput] = useState("");
  const [sayLoading, setSayLoading] = useState(false);
  const [sayResult, setSayResult] = useState<TranslateResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const historyIdRef = useRef(0);

  // Listen result forwarded from ListenPanel
  const [listenResult, setListenResult] = useState<{
    transcript: string;
    english: string;
    reply: string;
    replyEnglish: string;
  } | null>(null);

  const copyPhrase = useCallback(async (phrase: string) => {
    try {
      await navigator.clipboard.writeText(phrase);
      setToast({ visible: true, text: "Copied!" });
    } catch {
      setToast({ visible: true, text: "Copy failed" });
    }
    window.setTimeout(() => setToast({ visible: false, text: "" }), 1200);
  }, []);

  const contextLabel = contexts.find((c) => c.id === activeContext)?.label ?? "Auto";

  /* ── SAY: translate English to Spanish ── */
  const translateSay = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setSayResult(null);
        return;
      }
      setSayLoading(true);
      try {
        const resp = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            english: text.trim(),
            tone: mode,
            context: activeContext === "auto" ? undefined : contextLabel,
          }),
        });
        if (!resp.ok) {
          setSayResult(null);
          return;
        }
        const data: TranslateResult = await resp.json();
        setSayResult(data);

        // Add to history
        historyIdRef.current += 1;
        setHistory((prev) =>
          [
            {
              id: historyIdRef.current,
              mode: "say" as const,
              input: text.trim(),
              output: data.spanish,
              timestamp: Date.now(),
            },
            ...prev,
          ].slice(0, 10)
        );
      } catch {
        setSayResult(null);
      } finally {
        setSayLoading(false);
      }
    },
    [mode, activeContext, contextLabel]
  );

  /* ── Debounced input handler ── */
  const handleSayInput = useCallback(
    (value: string) => {
      setSayInput(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!value.trim()) {
        setSayResult(null);
        return;
      }
      debounceRef.current = setTimeout(() => {
        translateSay(value);
      }, 600);
    },
    [translateSay]
  );

  const handleSayKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        translateSay(sayInput);
      }
    },
    [sayInput, translateSay]
  );

  /* ── Mic tap: open overlay + autoStart ── */
  const handleMicTap = useCallback(() => {
    setAutoStartListen(true);
    setShowListening(true);
  }, []);

  /* ── Close listening overlay ── */
  const handleCloseListening = useCallback(() => {
    setShowListening(false);
    setAutoStartListen(false);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAF9F7] text-stone-800">
      {/* ════════════════════════════════════════════════════════════════
         LISTENING OVERLAY
         ════════════════════════════════════════════════════════════════ */}
      {showListening && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#FAF9F7]/95 backdrop-blur-sm">
          {/* Overlay top bar */}
          <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] pb-2">
            <button
              onClick={handleCloseListening}
              className="flex items-center justify-center rounded-full p-2 text-stone-400 transition hover:text-stone-700 active:scale-95"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Context + Tone in overlay */}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold text-stone-500">
                {contextLabel}
              </span>
              <SpeechModeToggle current={mode} onChange={setMode} />
            </div>

            <div className="w-9" />
          </div>

          {/* ListenPanel fills the overlay */}
          <div className="flex-1 overflow-y-auto px-5 pb-8">
            <ListenPanel
              mode={mode}
              onCopy={copyPhrase}
              onSpeak={() => {}}
              autoStart={autoStartListen}
              onDidAutoStart={() => setAutoStartListen(false)}
              context={activeContext === "auto" ? undefined : contextLabel}
              onClose={handleCloseListening}
            />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
         HISTORY SHEET
         ════════════════════════════════════════════════════════════════ */}
      {showHistory && (
        <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-3xl bg-white px-5 pb-8 pt-5 shadow-xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-stone-700">Recent</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-[12px] font-semibold text-stone-400 hover:text-stone-600"
              >
                Close
              </button>
            </div>
            {history.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-stone-400">No interactions yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-xl border border-stone-200/60 bg-stone-50 px-4 py-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                      {h.mode === "listen" ? "Heard" : "Said"}
                    </p>
                    <p className="mt-1 text-[14px] font-semibold text-stone-700">{h.input}</p>
                    <p className="mt-0.5 text-[13px] text-stone-500">{h.output}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
         HEADER
         ════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 border-b border-stone-200/40 bg-[#FAF9F7]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3">
          <h1 className="text-[20px] font-extrabold tracking-tight text-stone-900">TapHabla</h1>

          <div className="flex items-center gap-3">
            <SpeechModeToggle current={mode} onChange={setMode} />
            <button
              onClick={() => setShowHistory(true)}
              className="rounded-full p-1.5 text-stone-400 transition hover:text-stone-600 active:scale-95"
              aria-label="History"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Context pills */}
        <div className="scrollbar-hide mx-auto flex max-w-lg gap-2 overflow-x-auto px-5 pb-3">
          {contexts.map((ctx) => (
            <button
              key={ctx.id}
              onClick={() => setActiveContext(ctx.id)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-150 active:scale-95 ${
                activeContext === ctx.id
                  ? "border-[#D94F2A]/30 bg-[#D94F2A]/[0.07] text-[#D94F2A]"
                  : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
              }`}
            >
              {ctx.label}
            </button>
          ))}
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════
         RESULT CANVAS
         ════════════════════════════════════════════════════════════════ */}
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-32 pt-6">
        {!sayResult && !listenResult ? (
          /* ── Empty state ── */
          <div className="flex flex-1 flex-col items-center justify-center">
            <p className="text-[20px] font-bold text-stone-300">Ready.</p>
          </div>
        ) : sayResult ? (
          /* ── SAY result cards ── */
          <div className="flex flex-col gap-4">
            {/* What you typed */}
            <div className="rounded-2xl border border-stone-200/60 bg-white p-4">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                You want to say
              </p>
              <p className="text-[16px] font-semibold text-stone-700">{sayInput}</p>
            </div>

            {/* Primary translation */}
            <button
              onClick={() => speakPhrase(sayResult.spanish)}
              className="group rounded-[20px] border-[2.5px] border-[#D94F2A]/30 bg-white px-5 py-5 text-left shadow-[0_4px_24px_-4px_rgba(217,79,42,0.1)] transition-all duration-150 active:translate-y-px active:shadow-sm"
            >
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Say this
              </p>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <p className="text-[22px] font-extrabold leading-tight text-stone-900">
                    {sayResult.spanish}
                  </p>
                  {sayResult.pronunciation && (
                    <p className="mt-1 font-mono text-[11px] text-stone-400">
                      {sayResult.pronunciation}
                    </p>
                  )}
                  {sayResult.literal_back && (
                    <p className="mt-1.5 text-[13px] text-stone-500">
                      {sayResult.literal_back}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#D94F2A] px-4 py-2.5 text-white shadow-md shadow-[#D94F2A]/25 transition-transform group-active:scale-95">
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M2 12h2" /><path d="M6 8v8" /><path d="M10 4v16" /><path d="M14 6v12" /><path d="M18 8v8" /><path d="M22 12h2" />
                  </svg>
                  <span className="text-[13px] font-extrabold">Speak</span>
                </div>
              </div>
            </button>

            {/* Alternative */}
            {sayResult.alt_spanish && (
              <button
                onClick={() => speakPhrase(sayResult.alt_spanish!)}
                className="rounded-2xl border border-stone-200/60 bg-white px-4 py-3.5 text-left transition-all duration-150 active:scale-[0.98]"
              >
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  Or say
                </p>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col">
                    <p className="text-[15px] font-bold text-stone-800">{sayResult.alt_spanish}</p>
                    {sayResult.alt_pronunciation && (
                      <p className="mt-0.5 font-mono text-[10px] text-stone-400">
                        {sayResult.alt_pronunciation}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-stone-400">
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                    <span className="text-[10px] font-semibold">Speak</span>
                  </div>
                </div>
              </button>
            )}

            {/* Copy button */}
            <div className="flex justify-center">
              <button
                onClick={() => copyPhrase(sayResult.spanish)}
                className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-stone-400 transition hover:text-stone-600 active:scale-95"
              >
                Copy to clipboard
              </button>
            </div>
          </div>
        ) : null}
      </main>

      {/* ════════════════════════════════════════════════════════════════
         BOTTOM INPUT DOCK (always visible)
         ════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200/40 bg-[#FAF9F7]/95 pb-[env(safe-area-inset-bottom,8px)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          {/* Mic button */}
          <button
            onClick={handleMicTap}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#D94F2A] text-white shadow-lg shadow-[#D94F2A]/25 transition-all duration-150 active:scale-90"
            aria-label="Start listening"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </button>

          {/* Text input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={sayInput}
              onChange={(e) => handleSayInput(e.target.value)}
              onKeyDown={handleSayKeyDown}
              placeholder="Type what you want to say..."
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-[14px] text-stone-800 placeholder-stone-400 outline-none transition-colors focus:border-stone-300 focus:ring-2 focus:ring-stone-200/50"
            />
            {sayLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-[#D94F2A]" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 ${
          toast.visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        {toast.text}
      </div>
    </div>
  );
}
