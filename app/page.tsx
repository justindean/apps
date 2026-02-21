"use client";

import { useState, useCallback } from "react";
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

/* ── Situation chips ── */
const situations = [
  { id: "food-drink", label: "Food", emoji: "\uD83C\uDF7D", scenarioKeys: ["restaurant", "bar", "coffee", "juices", "drinks", "food", "arrival", "during", "bill", "exit"] },
  { id: "getting-around", label: "Getting Around", emoji: "\uD83D\uDE95", scenarioKeys: ["taxi", "transport"] },
  { id: "places-services", label: "Services", emoji: "\uD83C\uDFE8", scenarioKeys: ["hotel", "shopping", "greetings"] },
  { id: "emergency", label: "Emergency", emoji: "\uD83D\uDEA8", scenarioKeys: ["emergency"] },
] as const;

type ToastState = { visible: boolean; text: string };

export default function Page() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [activeIntent, setActiveIntent] = useState<IntentKey>("order");
  const [mode, setMode] = useState<SpeechMode>("neutral");
  const [showRescue, setShowRescue] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, text: "" });

  // Listen overlay
  const [showListen, setShowListen] = useState(false);

  // Situation chip
  const [activeSituation, setActiveSituation] = useState<string | null>(null);

  // Nudge state -- pulse chips once when mic opened with no situation
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

  const handleMicTap = () => {
    if (!activeSituation) {
      setNudgeChips(true);
      setTimeout(() => setNudgeChips(false), 1200);
    }
    setShowListen(true);
  };

  const toggleSituation = (id: string) => {
    setActiveSituation((prev) => (prev === id ? null : id));
  };

  const activeSituationData = activeSituation
    ? situations.find((s) => s.id === activeSituation)
    : null;

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
         LISTENING OVERLAY -- full-screen modal
         ════════════════════════════════════════════════════════════════ */}
      {showListen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#FAF9F7]">
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

            {/* Context pill (if situation set) */}
            {activeSituationData && (
              <div className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5">
                <span className="text-[12px]">{activeSituationData.emoji}</span>
                <span className="text-[11px] font-semibold text-stone-500">
                  {activeSituationData.label}
                </span>
                <button
                  onClick={() => setActiveSituation(null)}
                  className="ml-0.5 text-stone-400 transition hover:text-stone-600"
                  aria-label="Clear context"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                  </svg>
                </button>
              </div>
            )}

            {/* Gear */}
            <div className="w-9" />
          </div>

          {/* Nudge if no situation */}
          {!activeSituation && (
            <p className="px-5 text-center text-[12px] font-medium text-stone-400/80">
              Pick a situation for smarter results.
            </p>
          )}

          {/* Listen panel content */}
          <div className="flex-1 overflow-y-auto px-5 pb-8">
            <ListenPanel mode={mode} onCopy={copyPhrase} onSpeak={() => {}} />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
         MAIN APP
         ════════════════════════════════════════════════════════════════ */}

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200/40 bg-[#FAF9F7]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3.5">
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
            <h1 className="text-[20px] font-extrabold tracking-tight text-stone-900">TapHabla</h1>
          )}

          <SpeechModeToggle current={mode} onChange={setMode} />
        </div>

        {/* Intent tabs when a non-flow scenario is selected */}
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
          /* ── HOME SCREEN ── */
          <div className="flex min-h-[calc(100dvh-140px)] flex-col items-center justify-center">
            {/* Hero */}
            <section className="mb-10 text-center">
              <h2 className="text-[40px] font-extrabold leading-[1.05] tracking-tight text-stone-900">
                {"Land. Go."}
              </h2>
              <p className="mt-3 text-[17px] leading-relaxed text-stone-400">
                {"We\u2019ll handle the Spanish."}
              </p>
              <p className="mt-2 text-[13px] text-stone-300">
                Works instantly. No signup.
              </p>
            </section>

            {/* Primary: Large Mic Button */}
            <button
              onClick={handleMicTap}
              className="group flex h-28 w-28 items-center justify-center rounded-full bg-[#D94F2A] shadow-[0_8px_40px_-4px_rgba(217,79,42,0.5)] ring-4 ring-[#D94F2A]/10 transition-all duration-200 hover:shadow-[0_12px_48px_-4px_rgba(217,79,42,0.6)] hover:ring-[#D94F2A]/20 active:scale-90 animate-[mic-glow_3s_ease-in-out_infinite]"
              aria-label="Start listening"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-11 w-11 text-white transition-transform group-hover:scale-105">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            </button>

            {/* Situation chips -- always visible */}
            <section className="mt-14 w-full text-center">
              <p className="mb-4 text-[13px] font-medium text-stone-400">
                {"What\u2019s the situation?"}
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {situations.map((sit) => {
                  const isActive = activeSituation === sit.id;
                  return (
                    <button
                      key={sit.id}
                      onClick={() => toggleSituation(sit.id)}
                      className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold transition-all duration-200 active:scale-95 ${
                        isActive
                          ? "border-[#D94F2A]/30 bg-[#D94F2A]/[0.06] text-[#D94F2A] shadow-sm shadow-[#D94F2A]/10"
                          : `border-stone-200 bg-white text-stone-600 hover:border-stone-300 ${nudgeChips ? "animate-[chip-nudge_0.4s_ease-in-out]" : ""}`
                      }`}
                    >
                      <span className="text-[14px]">{sit.emoji}</span>
                      {sit.label}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        ) : hasFlow && scenario?.flowStages ? (
          /* ── FLOW NAVIGATOR ── */
          <FlowNavigator
            stages={scenario.flowStages}
            color={scenario.color}
            onCopy={copyPhrase}
            mode={mode}
          />
        ) : (
          /* ── PHRASE LIST ── */
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

      {/* Rescue Modal */}
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
