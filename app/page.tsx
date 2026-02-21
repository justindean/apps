"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
import { SayPanel } from "@/components/SayPanel";

const intentKeys = Object.keys(intentMeta) as IntentKey[];

/* -- Context options for bottom sheet -- */
const contexts = [
  { id: "food-drink", label: "Food & Drink", emoji: "\uD83C\uDF7D", scenarioKeys: ["restaurant", "bar", "coffee", "juices", "drinks", "food", "arrival", "during", "bill", "exit"] },
  { id: "getting-around", label: "Getting Around", emoji: "\uD83D\uDE95", scenarioKeys: ["taxi", "transport"] },
  { id: "places-services", label: "Places & Services", emoji: "\uD83C\uDFE8", scenarioKeys: ["hotel", "shopping", "greetings"] },
  { id: "emergency", label: "Emergency", emoji: "\uD83D\uDEA8", scenarioKeys: ["emergency"] },
] as const;

type ActiveView = "home" | "listen" | "say" | "scenario";
type ToastState = { visible: boolean; text: string };

export default function Page() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [activeIntent, setActiveIntent] = useState<IntentKey>("order");
  const [mode, setMode] = useState<SpeechMode>("neutral");
  const [showRescue, setShowRescue] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, text: "" });

  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [activeContext, setActiveContext] = useState<string | null>(null);
  const [showContextSheet, setShowContextSheet] = useState(false);

  // Auto-start listening ref
  const shouldAutoStartRef = useRef(false);

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
      setActiveView("scenario");
    }
  };

  const handleBack = () => {
    if (activeView !== "home") {
      setActiveView("home");
      setScenario(null);
      setActiveIntent("order");
    }
  };

  const handleListenTap = () => {
    shouldAutoStartRef.current = true;
    setActiveView("listen");
  };

  const handleSayTap = () => {
    setActiveView("say");
  };

  const handleSelectContext = (id: string) => {
    setActiveContext(id);
    setShowContextSheet(false);
  };

  const clearContext = () => {
    setActiveContext(null);
  };

  const activeContextData = activeContext
    ? contexts.find((c) => c.id === activeContext)
    : null;

  // Scenario flow check
  const hasFlow = scenario?.flowStages && scenario.flowStages.length > 0;

  const activePhrases: Phrase[] =
    scenario && !hasFlow
      ? scenario.intents[activeIntent]?.[mode] ?? scenario.intents[activeIntent]?.neutral ?? []
      : [];

  return (
    <div className="min-h-dvh bg-[#FAF9F7] text-stone-800">

      {/* ================================================================
         LISTEN FLOW -- full-screen overlay, auto-starts recording
         ================================================================ */}
      {activeView === "listen" && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#FAF9F7]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] pb-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 rounded-full p-2 text-stone-400 transition hover:text-stone-700 active:scale-95"
              aria-label="Back to home"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Context pill */}
            {activeContextData ? (
              <div className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5">
                <span className="text-[12px]">{activeContextData.emoji}</span>
                <span className="text-[11px] font-semibold text-stone-500">{activeContextData.label}</span>
                <button onClick={clearContext} className="ml-0.5 text-stone-400 transition hover:text-stone-600" aria-label="Clear context">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowContextSheet(true)}
                className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-stone-500 transition hover:border-stone-300 active:scale-95"
              >
                Set context
              </button>
            )}

            {/* Tone indicator */}
            <SpeechModeToggle current={mode} onChange={setMode} />
          </div>

          {/* Listen content */}
          <div className="flex-1 overflow-y-auto px-5 pb-8">
            <ListenPanel
              mode={mode}
              onCopy={copyPhrase}
              onSpeak={() => {}}
              autoStart={shouldAutoStartRef.current}
              onDidAutoStart={() => { shouldAutoStartRef.current = false; }}
            />
          </div>
        </div>
      )}

      {/* ================================================================
         SAY FLOW -- full-screen overlay
         ================================================================ */}
      {activeView === "say" && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#FAF9F7]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] pb-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 rounded-full p-2 text-stone-400 transition hover:text-stone-700 active:scale-95"
              aria-label="Back to home"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Context pill */}
            {activeContextData ? (
              <div className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5">
                <span className="text-[12px]">{activeContextData.emoji}</span>
                <span className="text-[11px] font-semibold text-stone-500">{activeContextData.label}</span>
              </div>
            ) : null}

            <SpeechModeToggle current={mode} onChange={setMode} />
          </div>

          {/* Say content */}
          <div className="flex-1 overflow-y-auto px-5 pb-8">
            <SayPanel
              mode={mode}
              context={activeContextData?.label ?? null}
              onCopy={copyPhrase}
            />
          </div>
        </div>
      )}

      {/* ================================================================
         CONTEXT BOTTOM SHEET
         ================================================================ */}
      {showContextSheet && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm" onClick={() => setShowContextSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[61] animate-slide-up rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom,16px)] shadow-xl">
            <div className="mx-auto max-w-lg px-6 pt-6 pb-4">
              <div className="mb-1 flex justify-center">
                <div className="h-1 w-10 rounded-full bg-stone-200" />
              </div>
              <h3 className="mb-5 text-center text-[15px] font-bold text-stone-700">Set the situation</h3>
              <div className="flex flex-col gap-2.5">
                {contexts.map((ctx) => (
                  <button
                    key={ctx.id}
                    onClick={() => handleSelectContext(ctx.id)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all active:scale-[0.98] ${
                      activeContext === ctx.id
                        ? "border-[#D94F2A]/30 bg-[#D94F2A]/[0.04] shadow-sm"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <span className="text-[20px]">{ctx.emoji}</span>
                    <span className={`text-[15px] font-semibold ${activeContext === ctx.id ? "text-[#D94F2A]" : "text-stone-700"}`}>
                      {ctx.label}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setActiveContext(null); setShowContextSheet(false); }}
                className="mt-4 w-full rounded-xl py-2.5 text-center text-[13px] font-semibold text-stone-400 transition hover:text-stone-600"
              >
                Keep on Auto
              </button>
            </div>
          </div>
        </>
      )}

      {/* ================================================================
         MAIN APP (Home + Scenario views)
         ================================================================ */}
      {(activeView === "home" || activeView === "scenario") && (
        <>
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-stone-200/40 bg-[#FAF9F7]/90 backdrop-blur-xl">
            <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3.5">
              {activeView === "scenario" && scenario ? (
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
            {activeView === "scenario" && scenario && !hasFlow && (
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
            {activeView === "home" ? (
              /* -- CONVERSATION DOCK -- */
              <div className="flex min-h-[calc(100dvh-140px)] flex-col items-center pt-8">
                {/* Headline */}
                <section className="mb-10 text-center">
                  <h2 className="text-[38px] font-extrabold leading-[1.05] tracking-tight text-stone-900">
                    {"Land. Go."}
                  </h2>
                  <p className="mt-3 text-[16px] leading-relaxed text-stone-400">
                    {"We\u2019ll handle the Spanish."}
                  </p>
                </section>

                {/* Context Chip */}
                <div className="mb-10">
                  {activeContextData ? (
                    <button
                      onClick={() => setShowContextSheet(true)}
                      className="flex items-center gap-2 rounded-full border border-[#D94F2A]/20 bg-[#D94F2A]/[0.04] px-4 py-2 transition active:scale-95"
                    >
                      <span className="text-[14px]">{activeContextData.emoji}</span>
                      <span className="text-[13px] font-semibold text-[#D94F2A]">{activeContextData.label}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); clearContext(); }}
                        className="ml-1 text-[#D94F2A]/50 transition hover:text-[#D94F2A]"
                        aria-label="Clear context"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                          <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                        </svg>
                      </button>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowContextSheet(true)}
                      className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-[13px] font-semibold text-stone-500 shadow-sm transition hover:border-stone-300 active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.97.633-3.794 1.708-5.278" />
                      </svg>
                      Auto
                    </button>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="flex w-full max-w-xs flex-col gap-4">
                  {/* LISTEN button */}
                  <button
                    onClick={handleListenTap}
                    className="flex items-center justify-center gap-3 rounded-2xl bg-[#D94F2A] px-6 py-5 text-white shadow-[0_4px_24px_-4px_rgba(217,79,42,0.35)] transition-all duration-200 hover:shadow-[0_6px_32px_-4px_rgba(217,79,42,0.45)] active:scale-[0.97] active:shadow-[0_2px_8px_rgba(217,79,42,0.2)]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-7 w-7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                    </svg>
                    <span className="text-[18px] font-extrabold tracking-wide">LISTEN</span>
                  </button>

                  {/* SAY button */}
                  <button
                    onClick={handleSayTap}
                    className="flex items-center justify-center gap-3 rounded-2xl border-2 border-[#D94F2A] bg-white px-6 py-5 text-[#D94F2A] shadow-sm transition-all duration-200 hover:bg-[#D94F2A]/[0.03] hover:shadow-md active:scale-[0.97]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-7 w-7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                    </svg>
                    <span className="text-[18px] font-extrabold tracking-wide">SAY</span>
                  </button>
                </div>

                {/* Trust line */}
                <p className="mt-8 text-[12px] text-stone-300">
                  Works instantly. No signup.
                </p>
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
        </>
      )}

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
