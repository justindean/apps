"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { SpeechMode, Phrase } from "@/data/phrases";
import SpeechModeToggle from "@/components/SpeechModeToggle";
import { ListenPanel } from "@/components/ListenPanel";

/* ── Situation chips ── */
const situations = [
  { id: "auto",          label: "Auto",           emoji: "\u2728" },
  { id: "food-drink",    label: "Food",           emoji: "\uD83C\uDF7D" },
  { id: "getting-around", label: "Getting Around", emoji: "\uD83D\uDE95" },
  { id: "places-services", label: "Services",     emoji: "\uD83C\uDFE8" },
  { id: "emergency",     label: "Emergency",      emoji: "\uD83D\uDEA8" },
] as const;

/* ── Translation result type ── */
interface TranslateResult {
  spanish: string;
  pronunciation: string;
  note?: string;
  sourceEnglish: string;
}

type ToastState = { visible: boolean; text: string };

export default function Page() {
  const [mode, setMode] = useState<SpeechMode>("neutral");
  const [toast, setToast] = useState<ToastState>({ visible: false, text: "" });

  // Context chip
  const [activeSituation, setActiveSituation] = useState("auto");

  // Listening overlay
  const [showListen, setShowListen] = useState(false);
  const [autoStartListen, setAutoStartListen] = useState(false);

  // Typing / SAY
  const [typingText, setTypingText] = useState("");
  const [translateResult, setTranslateResult] = useState<TranslateResult | null>(null);
  const [translating, setTranslating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyPhrase = useCallback(async (phrase: string) => {
    try {
      await navigator.clipboard.writeText(phrase);
      setToast({ visible: true, text: "Copied!" });
    } catch {
      setToast({ visible: true, text: "Copy failed" });
    }
    window.setTimeout(() => setToast({ visible: false, text: "" }), 1200);
  }, []);

  // TTS
  const speakSpanish = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "es-MX";
      u.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  }, []);

  // Translate English -> Spanish
  const doTranslate = useCallback(async (english: string) => {
    if (!english.trim()) { setTranslateResult(null); return; }
    setTranslating(true);
    try {
      const resp = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          english: english.trim(),
          tone: mode,
          context: activeSituation === "auto" ? undefined : activeSituation,
        }),
      });
      const data = await resp.json();
      if (data.spanish) {
        setTranslateResult({ ...data, sourceEnglish: english.trim() });
      }
    } catch {
      // Silently fail
    } finally {
      setTranslating(false);
    }
  }, [mode, activeSituation]);

  // Debounced typing
  const handleTyping = useCallback((val: string) => {
    setTypingText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setTranslateResult(null); return; }
    debounceRef.current = setTimeout(() => doTranslate(val), 700);
  }, [doTranslate]);

  // Enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && typingText.trim()) {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      doTranslate(typingText);
    }
  }, [typingText, doTranslate]);

  // Mic tap -- open overlay and auto-start
  const handleMicTap = useCallback(() => {
    setAutoStartListen(true);
    setShowListen(true);
  }, []);

  const contextLabel = activeSituation === "auto" ? undefined :
    situations.find(s => s.id === activeSituation)?.label;

  // Whether we have a SAY result to show
  const hasTranslation = !!translateResult;

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAF9F7] text-stone-800">

      {/* ════════════════════════════════════════════════════════════════
         LISTENING OVERLAY
         ════════════════════════════════════════════════════════════════ */}
      {showListen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#FAF9F7]/95 backdrop-blur-sm">
          {/* Overlay header */}
          <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] pb-2">
            <button
              onClick={() => setShowListen(false)}
              className="flex items-center justify-center rounded-full p-2 text-stone-400 transition hover:text-stone-700 active:scale-95"
              aria-label="Close listening"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
            </button>
            {/* Context + Tone */}
            <div className="flex items-center gap-3">
              {contextLabel && (
                <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold text-stone-500">
                  {contextLabel}
                </span>
              )}
              <SpeechModeToggle current={mode} onChange={setMode} />
            </div>
          </div>

          {/* Listen panel -- auto-starts recording */}
          <div className="flex-1 overflow-y-auto px-5 pb-8">
            <ListenPanel
              mode={mode}
              onCopy={copyPhrase}
              onSpeak={() => {}}
              autoStart={autoStartListen}
              onDidAutoStart={() => setAutoStartListen(false)}
              context={contextLabel}
              onClose={() => setShowListen(false)}
            />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
         HEADER
         ════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 border-b border-stone-200/40 bg-[#FAF9F7]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3">
          <h1 className="text-[20px] font-extrabold tracking-tight text-stone-900">TapHabla</h1>
          <SpeechModeToggle current={mode} onChange={setMode} />
        </div>

        {/* Context pills -- always visible */}
        <div className="mx-auto flex max-w-lg gap-2 overflow-x-auto px-5 pb-3 scrollbar-hide">
          {situations.map((sit) => {
            const isActive = activeSituation === sit.id;
            return (
              <button
                key={sit.id}
                onClick={() => setActiveSituation(sit.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-150 active:scale-95 ${
                  isActive
                    ? "border-[#D94F2A]/25 bg-[#D94F2A]/[0.06] text-[#D94F2A]"
                    : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
                }`}
              >
                <span className="text-[13px]">{sit.emoji}</span>
                {sit.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════
         CENTER -- mic default or translation result
         ════════════════════════════════════════════════════════════════ */}
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5">

        {!hasTranslation ? (
          /* ── Default: Dominant Mic ── */
          <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-24">
            <button
              onClick={handleMicTap}
              className="group flex h-32 w-32 items-center justify-center rounded-full bg-[#D94F2A] shadow-[0_8px_40px_-4px_rgba(217,79,42,0.5)] ring-4 ring-[#D94F2A]/10 transition-all duration-200 hover:shadow-[0_12px_48px_-4px_rgba(217,79,42,0.6)] hover:ring-[#D94F2A]/20 active:scale-90 animate-[mic-glow_3s_ease-in-out_infinite]"
              aria-label="Start listening"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-12 w-12 text-white transition-transform group-hover:scale-105">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            </button>
            <p className="text-[15px] font-medium text-stone-400">
              Tap to listen.
            </p>
          </div>
        ) : (
          /* ── Translation Result Card ── */
          <div className="flex flex-col gap-4 pb-28 pt-6">
            {/* What you said */}
            <div className="rounded-2xl border border-stone-200/60 bg-white p-4">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400/70">You want to say</p>
              <p className="text-[15px] font-semibold text-stone-700">
                {`\u201C${translateResult.sourceEnglish}\u201D`}
              </p>
            </div>

            {/* Say this */}
            <div className="rounded-[20px] border-[2.5px] border-[#D94F2A]/30 bg-gradient-to-b from-white to-[#faf8f6] px-5 py-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400/70">Say this:</p>
              <p className="text-[22px] font-extrabold leading-tight text-stone-900">
                {translateResult.spanish}
              </p>
              {translateResult.pronunciation && (
                <p className="mt-1 font-mono text-[12px] text-stone-400">
                  {translateResult.pronunciation}
                </p>
              )}
              {translateResult.note && (
                <p className="mt-2 text-[12px] text-stone-400/80 italic">
                  {translateResult.note}
                </p>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => speakSpanish(translateResult.spanish)}
                  className="flex items-center gap-2 rounded-full bg-[#D94F2A] px-5 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-[#D94F2A]/25 transition active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h2M6 8v8M10 4v16M14 6v12M18 8v8M22 12h2" />
                  </svg>
                  Speak
                </button>
                <button
                  onClick={() => copyPhrase(translateResult.spanish)}
                  className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-stone-500 transition hover:border-stone-300 active:scale-95"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Clear / Try again */}
            <button
              onClick={() => { setTranslateResult(null); setTypingText(""); }}
              className="self-center text-[13px] font-medium text-stone-400 transition hover:text-stone-600"
            >
              Clear
            </button>
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════════════════════════
         BOTTOM DOCK -- typing input
         ════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200/40 bg-[#FAF9F7]/90 pb-[env(safe-area-inset-bottom,8px)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-5 py-3">
          {/* Small mic button in dock */}
          <button
            onClick={handleMicTap}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D94F2A] text-white shadow-md shadow-[#D94F2A]/20 transition active:scale-90"
            aria-label="Listen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </button>

          {/* Text input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={typingText}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type what you want to say\u2026"
              className="w-full rounded-full border border-stone-200 bg-white px-4 py-2.5 text-[14px] text-stone-800 placeholder:text-stone-400/70 focus:border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-200"
            />
            {translating && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-[#D94F2A]" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 ${
          toast.visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        {toast.text}
      </div>
    </div>
  );
}
