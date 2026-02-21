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

/* ── Context chips ── */
const contexts = [
  { id: "food-drink", label: "Food & Drink", scenarioKeys: ["restaurant", "bar", "coffee", "juices", "drinks", "food", "arrival", "during", "bill", "exit"] },
  { id: "getting-around", label: "Getting Around", scenarioKeys: ["taxi", "transport"] },
  { id: "shopping", label: "Shopping", scenarioKeys: ["shopping"] },
  { id: "medical", label: "Medical", scenarioKeys: ["emergency"] },
] as const;

type ActiveDrawer = null | "listen" | "say";
type ToastState = { visible: boolean; text: string };

interface TranslateResult {
  spanish: string;
  pronunciation: string;
  english: string;
}

export default function Page() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [activeIntent, setActiveIntent] = useState<IntentKey>("order");
  const [mode, setMode] = useState<SpeechMode>("neutral");
  const [showRescue, setShowRescue] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, text: "" });

  // Drawer
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>(null);
  const [autoStartListen, setAutoStartListen] = useState(false);

  // Context
  const [activeContext, setActiveContext] = useState<string | null>(null);

  // SAY state
  const [sayInput, setSayInput] = useState("");
  const [sayResult, setSayResult] = useState<TranslateResult | null>(null);
  const [sayLoading, setSayLoading] = useState(false);
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

  const closeDrawer = () => {
    setActiveDrawer(null);
    setAutoStartListen(false);
  };

  const openListen = () => {
    setAutoStartListen(true);
    setActiveDrawer("listen");
  };

  const openSay = () => {
    setActiveDrawer("say");
  };

  const toggleContext = (id: string) => {
    setActiveContext((prev) => (prev === id ? null : id));
  };

  const activeContextData = activeContext
    ? contexts.find((c) => c.id === activeContext)
    : null;

  // SAY translation
  const doTranslate = useCallback(async (text: string) => {
    if (!text.trim()) { setSayResult(null); return; }
    setSayLoading(true);
    try {
      const toneMap: Record<SpeechMode, string> = { street: "casual", neutral: "neutral", formal: "formal" };
      const resp = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          english: text.trim(),
          tone: toneMap[mode],
          context: activeContextData?.label,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setSayResult(data);
      }
    } catch { /* silent */ }
    setSayLoading(false);
  }, [mode, activeContextData]);

  const handleSayInput = (value: string) => {
    setSayInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doTranslate(value), 600);
  };

  const handleSaySubmit = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    doTranslate(sayInput);
  };

  // Speak TTS
  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "es-MX";
      u.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  };

  // English voice capture for SAY
  const startEnglishCapture = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0]?.[0]?.transcript;
      if (transcript) {
        setSayInput(transcript);
        doTranslate(transcript);
      }
    };
    recognition.start();
  };

  // Scenario flow
  const hasFlow = scenario?.flowStages && scenario.flowStages.length > 0;
  const activePhrases: Phrase[] =
    scenario && !hasFlow
      ? scenario.intents[activeIntent]?.[mode] ?? scenario.intents[activeIntent]?.neutral ?? []
      : [];
  const isHome = !scenario;

  return (
    <div className="min-h-dvh bg-[#FAF9F7] text-stone-800">

      {/* ══════════════════════════════════════════════════════════════
         BOTTOM DRAWER -- LISTEN
         ══════════════════════════════════════════════════════════════ */}
      {activeDrawer === "listen" && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl bg-[#FAF9F7] shadow-2xl animate-slide-up">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-stone-300/50" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <button
                onClick={closeDrawer}
                className="text-[14px] font-bold text-stone-400 transition hover:text-stone-600 active:scale-95"
              >
                Done
              </button>
              {activeContextData && (
                <span className="rounded-full bg-stone-100 px-3 py-0.5 text-[11px] font-bold text-stone-500">
                  {activeContextData.label}
                </span>
              )}
              <div className="w-10" />
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-10">
              <ListenPanel
                mode={mode}
                onCopy={copyPhrase}
                onSpeak={() => {}}
                autoStart={autoStartListen}
                onDidAutoStart={() => setAutoStartListen(false)}
                context={activeContextData?.label}
                onClose={closeDrawer}
              />
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
         BOTTOM DRAWER -- SAY
         ══════════════════════════════════════════════════════════════ */}
      {activeDrawer === "say" && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl bg-[#FAF9F7] shadow-2xl animate-slide-up">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-stone-300/50" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <button
                onClick={closeDrawer}
                className="text-[14px] font-bold text-stone-400 transition hover:text-stone-600 active:scale-95"
              >
                Done
              </button>
              <span className="text-[15px] font-extrabold text-stone-700">Say it right</span>
              <div className="w-10" />
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-10">
              {/* Input */}
              <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-stone-300 focus-within:shadow-md">
                <input
                  type="text"
                  value={sayInput}
                  onChange={(e) => handleSayInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaySubmit()}
                  placeholder="What do you want to say?"
                  className="flex-1 bg-transparent text-[15px] text-stone-800 placeholder:text-stone-300 outline-none"
                  autoFocus
                />
                <button
                  onClick={startEnglishCapture}
                  className="shrink-0 rounded-full p-2 text-stone-300 transition hover:text-[#D94F2A] active:scale-90"
                  aria-label="Speak in English"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                  </svg>
                </button>
              </div>

              {/* Translation result */}
              {sayLoading && (
                <div className="mt-5 flex items-center gap-2 px-1">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D94F2A]/40" />
                  <span className="text-[13px] font-medium text-stone-400">Translating...</span>
                </div>
              )}
              {sayResult && !sayLoading && (
                <div className="mt-5 animate-fade-in">
                  <p className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-stone-400">Say this</p>
                  <div className="rounded-xl border border-stone-200/60 bg-white p-5 shadow-sm">
                    <p className="text-[22px] font-extrabold leading-tight text-stone-900">{sayResult.spanish}</p>
                    <p className="mt-1.5 text-[14px] text-stone-500">{sayResult.english}</p>
                    {sayResult.pronunciation && (
                      <p className="mt-1 font-mono text-[11px] text-stone-300">{sayResult.pronunciation}</p>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => speakText(sayResult.spanish)}
                        className="flex items-center gap-1.5 rounded-full bg-[#D94F2A] px-5 py-2.5 text-[13px] font-bold text-white shadow-sm shadow-[#D94F2A]/20 transition active:scale-95"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h2M6 8v8M10 4v16M14 6v12M18 8v8M22 12h2" />
                        </svg>
                        Speak
                      </button>
                      <button
                        onClick={() => copyPhrase(sayResult.spanish)}
                        className="rounded-full border border-stone-200 px-4 py-2.5 text-[13px] font-semibold text-stone-500 transition hover:border-stone-300 active:scale-95"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
         HEADER
         ══════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 border-b border-stone-200/40 bg-[#FAF9F7]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3">
          {scenario ? (
            <button onClick={handleBack} className="flex items-center gap-1.5 text-sm font-semibold text-stone-400 transition hover:text-stone-700" aria-label="Go back">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
              <span>{scenario.name}</span>
            </button>
          ) : (
            <h1 className="text-[22px] font-extrabold tracking-tight text-stone-900">TapHabla</h1>
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

      {/* ══════════════════════════════════════════════════════════════
         MAIN
         ══════════════════════════════════════════════════════════════ */}
      <main className="mx-auto max-w-lg px-5 pb-28 pt-6">
        {isHome ? (
          <div className="flex flex-col">
            {/* Tagline */}
            <section className="mb-8 mt-2 text-center">
              <h2 className="text-[42px] font-extrabold leading-[1] tracking-tight text-stone-900">
                {"Land. Go."}
              </h2>
            </section>

            {/* PRIMARY: Listen -- dominates the screen */}
            <button
              onClick={openListen}
              className="group mb-4 flex w-full items-center gap-5 rounded-2xl bg-[#D94F2A] px-6 py-6 shadow-lg shadow-[#D94F2A]/20 transition-all duration-150 hover:shadow-xl hover:shadow-[#D94F2A]/25 active:scale-[0.98]"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-7 w-7 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[20px] font-extrabold tracking-tight text-white">LISTEN</p>
                <p className="mt-0.5 text-[13px] font-medium text-white/70">Catch what they said.</p>
              </div>
            </button>

            {/* SECONDARY: Say -- ghost button */}
            <button
              onClick={openSay}
              className="mb-10 flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 px-5 py-3 text-[15px] font-bold text-stone-600 transition-all duration-150 hover:border-stone-400 hover:bg-stone-50 active:scale-[0.98]"
            >
              {"Say it right"}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-stone-400">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Context chips */}
            <section>
              <p className="mb-3 text-[14px] font-bold text-stone-700">Where are you?</p>
              <div className="flex flex-wrap gap-2">
                {contexts.map((ctx) => {
                  const isActive = activeContext === ctx.id;
                  return (
                    <button
                      key={ctx.id}
                      onClick={() => toggleContext(ctx.id)}
                      className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-150 active:scale-95 ${
                        isActive
                          ? "border-stone-700 bg-stone-800 text-white"
                          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                      }`}
                    >
                      {ctx.label}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        ) : hasFlow && scenario?.flowStages ? (
          <FlowNavigator stages={scenario.flowStages} color={scenario.color} onCopy={copyPhrase} mode={mode} />
        ) : (
          <PhraseList phrases={activePhrases} color={scenario?.color ?? "stone"} onCopy={copyPhrase} />
        )}
      </main>

      {/* Toast */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 ${
          toast.visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        {toast.text}
      </div>

      {showRescue && (
        <RescueModal phrases={rescuePhrases} onCopy={copyPhrase} onClose={() => setShowRescue(false)} />
      )}
    </div>
  );
}
