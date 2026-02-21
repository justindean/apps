"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  scenarios,
  intentMeta,
  rescuePhrases,
  type SpeechMode,
  type Scenario,
  type IntentKey,
  type Phrase,
} from "@/data/phrases";
import { SubContextBar } from "@/components/SubContextBar";
import { PhraseList } from "@/components/PhraseList";
import { FlowNavigator } from "@/components/FlowNavigator";
import SpeechModeToggle from "@/components/SpeechModeToggle";
import RescueModal from "@/components/RescueModal";
import { ListenPanel } from "@/components/ListenPanel";

const intentKeys = Object.keys(intentMeta) as IntentKey[];

/* ── TH Logo Mark ── */
function THMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="28" height="28" rx="7" fill="#D94F2A" fillOpacity="0.08" />
      <text x="4" y="20" fontFamily="Inter, system-ui, sans-serif" fontSize="14" fontWeight="800" fill="#D94F2A" letterSpacing="-0.5">
        TH
      </text>
      {/* Subtle waveform line */}
      <path d="M3 24 Q7 22 10 24 Q13 26 16 24 Q19 22 22 24 Q25 26 27 24" stroke="#D94F2A" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.35" />
    </svg>
  );
}

/* ── Ear Icon (Listen) ── */
function EarIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 8.5a6 6 0 0 1 12 0c0 3-2 4.5-2 7.5" />
      <path d="M16 16a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2" />
      <path d="M12 12a2 2 0 0 0 2-2 2 2 0 0 0-2-2" />
    </svg>
  );
}

/* ── Speech Bubble Icon (Say) ── */
function SpeechBubbleIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      {/* Mini waveform inside bubble */}
      <path d="M8 10v0" strokeWidth="2" /><path d="M11 9v2" strokeWidth="2" /><path d="M14 8v4" strokeWidth="2" /><path d="M17 9v2" strokeWidth="2" />
    </svg>
  );
}

/* ── Situations ── */
const situations = [
  { id: "auto", label: "Auto" },
  { id: "general", label: "General" },
  { id: "food-drink", label: "Food", scenarioKeys: ["restaurant", "bar", "coffee", "juices", "drinks", "food", "arrival", "during", "bill", "exit"] },
  { id: "getting-around", label: "Getting Around", scenarioKeys: ["taxi", "transport"] },
  { id: "shopping", label: "Shopping", scenarioKeys: ["shopping"] },
  { id: "places-services", label: "Services", scenarioKeys: ["hotel", "greetings"] },
  { id: "emergency", label: "Emergency", scenarioKeys: ["emergency"] },
] as const;

/* ── SAY translation result type ── */
interface SayResult {
  spanish: string;
  pronunciation: string;
  literal: string;
}

type ToastState = { visible: boolean; text: string };

export default function Page() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [activeIntent, setActiveIntent] = useState<IntentKey>("order");
  const [mode, setMode] = useState<SpeechMode>("neutral");
  const [showRescue, setShowRescue] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, text: "" });

  // Listen overlay
  const [showListen, setShowListen] = useState(false);
  const [autoStartListen, setAutoStartListen] = useState(false);

  // Say mode
  const [showSay, setShowSay] = useState(false);
  const [sayInput, setSayInput] = useState("");
  const [sayResult, setSayResult] = useState<SayResult | null>(null);
  const [sayLoading, setSayLoading] = useState(false);
  const sayDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Context
  const [activeSituation, setActiveSituation] = useState<string>("auto");

  // Nudge state
  const [nudgeChips, setNudgeChips] = useState(false);

  const copyPhrase = useCallback(async (phrase: string) => {
    try {
      await navigator.clipboard.writeText(phrase);
      setToast({ visible: true, text: "Copied!" });
    } catch {
      setToast({ visible: true, text: "Copy failed" });
    }
    window.setTimeout(() => setToast({ visible: false, text: "" }), 1200);
  }, []);

  const handleSelectScenario = (key: string) => {
    const found = scenarios.find((s) => s.key === key);
    if (found) {
      setScenario(found);
      setActiveIntent("order");
    }
  };

  const handleBack = () => {
    if (scenario) {
      setScenario(null);
      setActiveIntent("order");
    }
  };

  const handleListenTap = () => {
    setShowSay(false);
    setAutoStartListen(true);
    setShowListen(true);
  };

  const handleSayTap = () => {
    setShowSay((prev) => !prev);
    setSayResult(null);
    setSayInput("");
  };

  const toggleSituation = (id: string) => {
    setActiveSituation(id);
  };

  const activeSituationData = situations.find((s) => s.id === activeSituation);

  /* ── Say translation via API ── */
  const translateSay = useCallback(async (text: string) => {
    if (!text.trim()) { setSayResult(null); return; }
    setSayLoading(true);
    try {
      const resp = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          english: text.trim(),
          tone: mode,
          context: activeSituation !== "auto" ? activeSituationData?.label : undefined,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setSayResult(data);
      }
    } catch { /* ignore */ }
    setSayLoading(false);
  }, [mode, activeSituation, activeSituationData?.label]);

  /* ── Debounced input handler ── */
  const handleSayInput = (val: string) => {
    setSayInput(val);
    if (sayDebounceRef.current) clearTimeout(sayDebounceRef.current);
    sayDebounceRef.current = setTimeout(() => {
      translateSay(val);
    }, 500);
  };

  /* ── Voice input for Say ── */
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: { results: { [x: string]: { [x: string]: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript;
      setSayInput(transcript);
      translateSay(transcript);
    };
    recognition.start();
  };

  /* ── TTS for Say result ── */
  const speakSayResult = (text: string) => {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "es-MX";
      u.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  };

  // Scenario flow check
  const hasFlow = scenario?.flowStages && scenario.flowStages.length > 0;

  const activePhrases: Phrase[] =
    scenario && !hasFlow
      ? scenario.intents[activeIntent]?.[mode] ?? scenario.intents[activeIntent]?.neutral ?? []
      : [];

  const isHome = !scenario;

  return (
    <div className="min-h-dvh bg-[#FAF9F7] text-stone-800">
      {/* ════════════════════════════════════════════════════════════════
         LISTENING OVERLAY
         ════════════════════════════════════════════════════════════════ */}
      {showListen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#FAF9F7]">
          {/* Overlay header */}
          <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] pb-2">
            <button
              onClick={() => { setShowListen(false); setAutoStartListen(false); }}
              className="flex items-center justify-center rounded-full p-2 text-stone-400 transition hover:text-stone-700 active:scale-95"
              aria-label="Close listening"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
            </button>

            {activeSituationData && activeSituation !== "auto" && (
              <div className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5">
                <span className="text-[11px] font-semibold text-stone-500">
                  {activeSituationData.label}
                </span>
              </div>
            )}

            <div className="w-9" />
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-8">
            <ListenPanel
              mode={mode}
              onCopy={copyPhrase}
              onSpeak={() => {}}
              autoStart={autoStartListen}
              onDidAutoStart={() => setAutoStartListen(false)}
              context={activeSituation !== "auto" ? activeSituationData?.label : undefined}
              onClose={() => { setShowListen(false); setAutoStartListen(false); }}
            />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
         MAIN APP
         ════════════════════════════════════════════════════════════════ */}

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200/40 bg-[#FAF9F7]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3">
          {scenario ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm font-semibold text-stone-400 transition hover:text-stone-700"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
              <span>{scenario.name}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <THMark />
              <h1 className="text-[20px] font-extrabold tracking-tight text-stone-900">TapHabla</h1>
            </div>
          )}

          <SpeechModeToggle current={mode} onChange={setMode} />
        </div>

        {scenario && !hasFlow && (
          <SubContextBar
            items={intentKeys.map((k) => ({ key: k, name: intentMeta[k].label }))}
            activeKey={activeIntent}
            onSelect={(key) => setActiveIntent(key as IntentKey)}
            color={scenario.color}
          />
        )}
      </header>

      {/* Content */}
      <main className="mx-auto max-w-lg px-5 pb-28 pt-6">
        {isHome ? (
          <div className="flex min-h-[calc(100dvh-140px)] flex-col items-center">
            {/* Hero */}
            <section className="mb-10 mt-4 text-center">
              <h2 className="text-[38px] font-extrabold leading-[1.05] tracking-tight text-stone-900">
                {"Land. Go."}
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-stone-400">
                {"We\u2019ll handle the Spanish."}
              </p>
              <p className="mt-1.5 text-[12px] text-stone-300">
                Works instantly. No signup.
              </p>
            </section>

            {/* ── Two Primary Actions ── */}
            <section className="flex w-full max-w-[320px] gap-4">
              {/* LISTEN */}
              <button
                onClick={handleListenTap}
                className="group flex flex-1 flex-col items-center gap-3 rounded-[20px] bg-[#D94F2A] px-4 py-6 text-white shadow-[0_4px_24px_-4px_rgba(217,79,42,0.35)] transition-all duration-200 hover:shadow-[0_6px_32px_-4px_rgba(217,79,42,0.45)] active:scale-[0.97]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform group-hover:scale-105">
                  <EarIcon size={28} />
                </div>
                <div className="text-center">
                  <p className="text-[16px] font-extrabold">Listen</p>
                  <p className="mt-0.5 text-[11px] font-medium text-white/70">Understand them</p>
                </div>
              </button>

              {/* SAY */}
              <button
                onClick={handleSayTap}
                className={`group flex flex-1 flex-col items-center gap-3 rounded-[20px] border-2 px-4 py-6 transition-all duration-200 active:scale-[0.97] ${
                  showSay
                    ? "border-[#D94F2A]/40 bg-[#D94F2A]/[0.04] text-[#D94F2A] shadow-sm"
                    : "border-stone-200 bg-white text-stone-700 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] hover:border-stone-300 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]"
                }`}
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${
                  showSay ? "bg-[#D94F2A]/10" : "bg-stone-100"
                }`}>
                  <SpeechBubbleIcon size={28} />
                </div>
                <div className="text-center">
                  <p className="text-[16px] font-extrabold">Say</p>
                  <p className={`mt-0.5 text-[11px] font-medium ${showSay ? "text-[#D94F2A]/60" : "text-stone-400"}`}>Help me say it</p>
                </div>
              </button>
            </section>

            {/* ── SAY Input Panel (slides in when active) ── */}
            {showSay && (
              <section className="mt-6 w-full animate-fade-in">
                <div className="relative">
                  <input
                    type="text"
                    value={sayInput}
                    onChange={(e) => handleSayInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") translateSay(sayInput); }}
                    placeholder="Type what you want to say in English..."
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 pr-12 text-[15px] text-stone-800 placeholder-stone-300 shadow-sm outline-none transition focus:border-[#D94F2A]/30 focus:ring-2 focus:ring-[#D94F2A]/10"
                    autoFocus
                  />
                  {/* Voice input button inside text field */}
                  <button
                    onClick={handleVoiceInput}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-stone-300 transition hover:text-[#D94F2A] active:scale-90"
                    aria-label="Speak in English"
                    title="Tap to speak English"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    </svg>
                  </button>
                </div>

                {/* Loading */}
                {sayLoading && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-[#D94F2A]/40" />
                    <p className="text-[13px] font-medium text-stone-400">Translating...</p>
                  </div>
                )}

                {/* Say Result Card */}
                {sayResult && !sayLoading && (
                  <div className="mt-4 animate-fade-in rounded-[20px] border-[2px] border-[#D94F2A]/25 bg-gradient-to-b from-white to-stone-50/50 px-5 py-5 shadow-[0_4px_20px_-4px_rgba(217,79,42,0.08)]">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400/70">
                      Say this:
                    </p>
                    <p className="text-[22px] font-extrabold leading-tight text-stone-900">
                      {sayResult.spanish}
                    </p>
                    {sayResult.literal && (
                      <p className="mt-1.5 text-[13px] text-stone-400">
                        {sayResult.literal}
                      </p>
                    )}
                    {sayResult.pronunciation && (
                      <p className="mt-1 font-mono text-[11px] text-stone-300">
                        {sayResult.pronunciation}
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-2.5">
                      <button
                        onClick={() => speakSayResult(sayResult.spanish)}
                        className="flex items-center gap-1.5 rounded-full bg-[#D94F2A] px-4 py-2.5 text-[13px] font-bold text-white shadow-md shadow-[#D94F2A]/20 transition active:scale-95"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h2" /><path d="M6 8v8" /><path d="M10 4v16" /><path d="M14 6v12" /><path d="M18 8v8" /><path d="M22 12h2" /></svg>
                        Speak
                      </button>
                      <button
                        onClick={() => copyPhrase(sayResult.spanish)}
                        className="rounded-full border border-stone-200 bg-white px-4 py-2.5 text-[13px] font-bold text-stone-500 transition hover:border-stone-300 active:scale-95"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ── Context Chips ── */}
            <section className="mt-10 w-full text-center">
              <p className="mb-4 text-[13px] font-medium text-stone-400">
                Choose context for smarter results.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {situations.map((sit) => {
                  const isActive = activeSituation === sit.id;
                  return (
                    <button
                      key={sit.id}
                      onClick={() => toggleSituation(sit.id)}
                      className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-all duration-200 active:scale-95 ${
                        isActive
                          ? "border-[#D94F2A]/30 bg-[#D94F2A]/[0.07] text-[#D94F2A]"
                          : `border-stone-200/80 bg-white text-stone-500 hover:border-stone-300 ${nudgeChips ? "animate-[chip-nudge_0.4s_ease-in-out]" : ""}`
                      }`}
                    >
                      {sit.label}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        ) : hasFlow && scenario?.flowStages ? (
          <FlowNavigator
            stages={scenario.flowStages}
            color={scenario.color}
            onCopy={copyPhrase}
            mode={mode}
          />
        ) : (
          <PhraseList
            phrases={activePhrases}
            color={scenario?.color ?? "stone"}
            onCopy={copyPhrase}
          />
        )}
      </main>

      {/* Toast */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 ${
          toast.visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        {toast.text}
      </div>

      {showRescue && (
        <RescueModal
          phrases={rescuePhrases}
          onCopy={copyPhrase}
          onClose={() => setShowRescue(false)}
        />
      )}
    </div>
  );
}
