import { useState, useCallback } from "react";
import {
  scenarios,
  intentMeta,
  rescuePhrases,
  type SpeechMode,
  type Scenario,
  type IntentKey,
  type Phrase,
} from "./data/phrases";
import { CategoryGrid } from "./components/CategoryGrid";
import { SubContextBar } from "./components/SubContextBar";
import { PhraseList } from "./components/PhraseList";
import SpeechModeToggle from "./components/SpeechModeToggle";
import RescueModal from "./components/RescueModal";

const intentKeys = Object.keys(intentMeta) as IntentKey[];

type ToastState = { visible: boolean; text: string };

function App() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [activeIntent, setActiveIntent] = useState<IntentKey>("order");
  const [mode, setMode] = useState<SpeechMode>("neutral");
  const [showRescue, setShowRescue] = useState(false);
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
    }
  };

  const handleBack = () => {
    setScenario(null);
    setActiveIntent("order");
  };

  // Get active phrases based on scenario + intent + mode
  const activePhrases: Phrase[] = scenario
    ? scenario.intents[activeIntent]?.[mode] ?? scenario.intents[activeIntent]?.neutral ?? []
    : [];

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-925 dark:text-slate-100">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-slate-50/90 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-925/90">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          {scenario ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              aria-label="Go back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="flex items-center gap-1.5">
                <span aria-hidden>{scenario.emoji}</span>
                {scenario.name}
              </span>
            </button>
          ) : (
            <h1 className="text-lg font-bold tracking-tight">TapHabla</h1>
          )}

          <div className="flex items-center gap-2">
            <SpeechModeToggle current={mode} onChange={setMode} />
            <button
              onClick={() => setShowRescue(true)}
              className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-95"
              aria-label="Emergency phrases"
            >
              SOS
            </button>
          </div>
        </div>

        {/* Intent tabs when a scenario is selected */}
        {scenario && (
          <SubContextBar
            items={intentKeys.map((k) => ({ key: k, name: intentMeta[k].label }))}
            activeKey={activeIntent}
            onSelect={(key) => setActiveIntent(key as IntentKey)}
            color={scenario.color}
          />
        )}
      </header>

      {/* ── Content ── */}
      <main className="mx-auto max-w-lg px-4 pb-24 pt-4">
        {!scenario ? (
          <>
            <p className="mb-4 text-center text-sm text-slate-500 dark:text-slate-400">
              Tap a situation, get the right phrase.
            </p>
            <CategoryGrid
              categories={scenarios.map((s) => ({
                key: s.key,
                name: s.name,
                emoji: s.emoji,
                color: s.color,
              }))}
              onSelect={handleSelectScenario}
            />
            <footer className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600">
              {scenarios.length} scenarios
            </footer>
          </>
        ) : (
          <PhraseList
            phrases={activePhrases}
            color={scenario.color}
            onCopy={copyPhrase}
          />
        )}
      </main>

      {/* ── Toast ── */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 dark:bg-slate-100 dark:text-slate-900 ${
          toast.visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        {toast.text}
      </div>

      {/* ── Rescue Modal ── */}
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

export default App;
