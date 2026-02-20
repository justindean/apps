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

/* ── Home category cards (grouped from the 16 scenarios) ── */
const homeCategories = [
  {
    id: "food-drink",
    title: "Food & Drink",
    subtitle: "Ordering, paying, small talk",
    scenarioKeys: ["restaurant", "bar", "coffee", "juices", "drinks", "food", "arrival", "during", "bill", "exit"],
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12" />
      </svg>
    ),
  },
  {
    id: "getting-around",
    title: "Getting Around",
    subtitle: "Taxi, directions, transport",
    scenarioKeys: ["taxi", "transport"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
  },
  {
    id: "places-services",
    title: "Places & Services",
    subtitle: "Hotel, shopping, help",
    scenarioKeys: ["hotel", "shopping", "greetings"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
      </svg>
    ),
  },
  {
    id: "emergency",
    title: "Emergency",
    subtitle: "Medical, urgent",
    scenarioKeys: ["emergency"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286ZM12 15h.008v.008H12V15Z" />
      </svg>
    ),
  },
];

type ToastState = { visible: boolean; text: string };

export default function Page() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [activeIntent, setActiveIntent] = useState<IntentKey>("order");
  const [mode, setMode] = useState<SpeechMode>("neutral");
  const [showRescue, setShowRescue] = useState(false);
  const [showListen, setShowListen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, text: "" });

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
      setExpandedCategory(null);
    }
  };

  const handleBack = () => {
    if (scenario) {
      setScenario(null);
      setActiveIntent("order");
    } else if (showListen) {
      setShowListen(false);
    }
  };

  const handleCategoryTap = (categoryId: string) => {
    const cat = homeCategories.find((c) => c.id === categoryId);
    if (!cat) return;
    // If only one scenario in this category, go directly
    if (cat.scenarioKeys.length === 1) {
      handleSelectScenario(cat.scenarioKeys[0]);
    } else {
      setExpandedCategory(categoryId);
    }
  };

  // Does the active scenario use a conversation flow?
  const hasFlow = scenario?.flowStages && scenario.flowStages.length > 0;

  // Get active phrases based on scenario + intent + mode
  const activePhrases: Phrase[] =
    scenario && !hasFlow
      ? scenario.intents[activeIntent]?.[mode] ?? scenario.intents[activeIntent]?.neutral ?? []
      : [];

  // Get scenarios for expanded category
  const expandedCategoryData = expandedCategory
    ? homeCategories.find((c) => c.id === expandedCategory)
    : null;
  const expandedScenarios = expandedCategoryData
    ? scenarios.filter((s) => expandedCategoryData.scenarioKeys.includes(s.key))
    : [];

  const isHome = !scenario && !showListen;
  const showBackButton = scenario || showListen || expandedCategory;

  return (
    <div className="min-h-dvh bg-[#FAF9F7] text-stone-800 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200/40 bg-[#FAF9F7]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3.5">
          {showBackButton ? (
            <button
              onClick={() => {
                if (scenario) handleBack();
                else if (expandedCategory) setExpandedCategory(null);
                else if (showListen) setShowListen(false);
              }}
              className="flex items-center gap-1.5 text-sm font-semibold text-stone-400 transition hover:text-stone-700"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
              {scenario ? (
                <span>{scenario.name}</span>
              ) : expandedCategory ? (
                <span>{expandedCategoryData?.title}</span>
              ) : (
                <span>Listen</span>
              )}
            </button>
          ) : (
            <h1 className="text-lg font-extrabold tracking-tight text-stone-900">TapHabla</h1>
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
      <main className="mx-auto max-w-lg px-5 pb-28 pt-8">
        {isHome && !expandedCategory ? (
          /* ── HOME SCREEN ── */
          <>
            {/* Hero -- compressed vertical padding */}
            <section className="mb-10 mt-4 text-center">
              <h2 className="text-balance text-[30px] font-extrabold leading-[1.15] tracking-tight text-stone-900">
                Land and go.
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-stone-400">
                {"We\u2019ll handle the Spanish."}
              </p>
            </section>

            {/* Primary: Where are you right now? */}
            <section>
              <h3 className="mb-5 text-[14px] font-bold tracking-wide text-stone-400">
                What are you walking into?
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {homeCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryTap(cat.id)}
                    className="group flex flex-col items-start gap-3.5 rounded-[20px] border border-stone-200/60 bg-white p-5 text-left shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] active:translate-y-px active:scale-[0.98] active:shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
                  >
                    <span className="text-stone-400 transition-colors group-hover:text-stone-600">
                      {cat.icon}
                    </span>
                    <div>
                      <p className="text-[15px] font-bold leading-tight text-stone-900">
                        {cat.title}
                      </p>
                      <p className="mt-1 text-[12px] leading-snug text-stone-500/80">
                        {cat.subtitle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Floating Mic Button -- fixed to bottom center */}
            <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center pb-5 pt-12 pointer-events-none bg-gradient-to-t from-[#FAF9F7] via-[#FAF9F7]/80 to-transparent">
              <p className="mb-3.5 text-[13px] font-bold text-stone-500 pointer-events-auto">
                {"They\u2019re talking? Tap."}
              </p>
              <button
                onClick={() => setShowListen(true)}
                className="pointer-events-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#D94F2A] shadow-[0_6px_28px_-2px_rgba(217,79,42,0.45)] ring-4 ring-[#D94F2A]/10 transition-all duration-200 hover:shadow-[0_8px_36px_-2px_rgba(217,79,42,0.55)] hover:ring-[#D94F2A]/20 active:scale-90 animate-[mic-glow_3s_ease-in-out_infinite]"
                aria-label="Start listening"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-8 w-8 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                </svg>
              </button>
            </div>
          </>
        ) : isHome && expandedCategory ? (
          /* ── EXPANDED CATEGORY: Show sub-scenarios ── */
          <section>
            <h3 className="mb-5 text-[14px] font-bold tracking-wide text-stone-400">
              {"What\u2019s happening?"}
            </h3>
            <div className="flex flex-col gap-2.5">
              {expandedScenarios.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleSelectScenario(s.key)}
                  className="flex items-center gap-4 rounded-2xl border border-stone-200/60 bg-white p-4 text-left shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover active:translate-y-px active:scale-[0.99] active:shadow-card-press"
                >
                  <span className="text-2xl" aria-hidden>{s.emoji}</span>
                  <span className="text-[15px] font-bold text-stone-900">{s.name}</span>
                </button>
              ))}
            </div>
          </section>
        ) : showListen ? (
          /* ── LISTEN MODE ── */
          <ListenPanel mode={mode} onCopy={copyPhrase} onSpeak={() => {}} />
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
