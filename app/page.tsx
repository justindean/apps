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
      setToast({ visible: true, text: "Copied" });
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
    <div className="min-h-dvh bg-white text-black">

      {/* ══════════════════════════════════════════════════════════════
         BOTTOM SHEET -- LISTEN
         ══════════════════════════════════════════════════════════════ */}
      {activeDrawer === "listen" && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 animate-fade-in"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[95dvh] flex-col rounded-t-[16px] bg-white shadow-[0_-4px_40px_rgba(0,0,0,0.12)] animate-slide-up">
            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="h-[4px] w-9 rounded-full bg-black/10" />
            </div>
            {/* Header row */}
            <div className="flex items-center justify-between px-4 pb-2">
              <div className="w-11">
                {activeContextData && (
                  <span className="rounded-md bg-black/5 px-2 py-0.5 text-[10px] font-bold text-black/45">
                    {activeContextData.label}
                  </span>
                )}
              </div>
              <button
                onClick={closeDrawer}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-black/40 transition hover:bg-black/10 hover:text-black active:scale-90"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
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
            className="fixed inset-0 z-40 bg-black/50 animate-fade-in"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[95dvh] flex-col rounded-t-[16px] bg-white shadow-[0_-4px_40px_rgba(0,0,0,0.12)] animate-slide-up">
            <div className="flex justify-center pt-2 pb-1">
              <div className="h-[4px] w-9 rounded-full bg-black/10" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2">
              <span className="text-[14px] font-extrabold text-black">Say</span>
              <button
                onClick={closeDrawer}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-black/40 transition hover:bg-black/10 hover:text-black active:scale-90"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-10">
              {/* Input */}
              <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 transition-all focus-within:border-black/20 focus-within:bg-white focus-within:shadow-sm">
                <input
                  type="text"
                  value={sayInput}
                  onChange={(e) => handleSayInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaySubmit()}
                  placeholder="What do you want to say?"
                  className="flex-1 bg-transparent text-[15px] text-black placeholder:text-black/30 outline-none"
                  autoFocus
                />
                <button
                  onClick={startEnglishCapture}
                  className="shrink-0 rounded-full p-2 text-black/25 transition hover:text-[#C7402A] active:scale-90"
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
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C7402A]/50" />
                  <span className="text-[13px] font-semibold text-black/30">Translating...</span>
                </div>
              )}
              {sayResult && !sayLoading && (
                <div className="mt-5 animate-fade-in">
                  <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-black/40">Say this</p>
                  <div className="rounded-xl border border-black/8 bg-white p-5">
                    <p className="text-[22px] font-extrabold leading-tight text-black">{sayResult.spanish}</p>
                    <p className="mt-1.5 text-[14px] text-black/50">{sayResult.english}</p>
                    {sayResult.pronunciation && (
                      <p className="mt-1 font-mono text-[11px] text-black/20">{sayResult.pronunciation}</p>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => speakText(sayResult.spanish)}
                        className="flex items-center gap-1.5 rounded-lg bg-[#C7402A] px-4 py-2 text-[13px] font-bold text-white transition active:scale-95"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h2M6 8v8M10 4v16M14 6v12M18 8v8M22 12h2" />
                        </svg>
                        Speak
                      </button>
                      <button
                        onClick={() => copyPhrase(sayResult.spanish)}
                        className="rounded-lg border border-black/10 px-3.5 py-2 text-[13px] font-semibold text-black/50 transition hover:border-black/20 active:scale-95"
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
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-transparent">
        <div className="mx-auto flex max-w-md items-center justify-between px-6 py-2">
          {scenario ? (
            <button onClick={handleBack} className="flex items-center gap-1.5 text-sm font-semibold text-black/40 transition hover:text-black" aria-label="Go back">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
              <span>{scenario.name}</span>
            </button>
          ) : (
            <h1 className="text-[14px] font-extrabold tracking-tight text-[#111]">TapHabla</h1>
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
      <main className="mx-auto max-w-md px-6 pb-16">
        {isHome ? (
          <div className="flex flex-col items-center pt-7">
            {/* Hero command -- staggered entry */}
            <h2 className="text-[48px] font-black uppercase leading-[0.9] -tracking-[0.06em] text-[#111]">
              <span className="inline-block animate-hero-1">Land.</span>{" "}
              <span className="inline-block animate-hero-2">Go.</span>
            </h2>

            {/* THE WEAPON -- breathing mic */}
            <button
              onClick={openListen}
              className="group relative mt-7 flex h-40 w-40 items-center justify-center rounded-full bg-[#C7402A] shadow-[0_12px_60px_-12px_rgba(199,64,42,0.6)] transition-all duration-100 animate-breathe active:scale-[0.96] active:shadow-[0_4px_20px_-4px_rgba(199,64,42,0.35)] active:animate-none"
              aria-label="Listen"
            >
              {/* Soft halo glow */}
              <span className="absolute inset-[-14px] rounded-full bg-[#C7402A]/[0.07] animate-halo" />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="relative h-14 w-14 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            </button>
            <p className="mt-1.5 text-[15px] font-extrabold uppercase tracking-[0.05em] text-[#111]">
              Listen
            </p>
            {/* Ambient intelligence copy -- fades in after 1.5s */}
            <p className="mt-1 text-[12px] font-medium text-black/25 animate-ambient">
              Ready when they are.
            </p>

            {/* Secondary: Say */}
            <button
              onClick={openSay}
              className="mt-5 text-[13px] font-semibold text-black/55 transition-colors hover:text-black/75 active:text-black"
            >
              Or speak instead
            </button>

            {/* Context chips */}
            <section className="mt-5 w-full">
              <p className="mb-2 text-[12px] font-medium text-black/40">Where are you?</p>
              <div className="flex flex-wrap gap-1">
                {contexts.map((ctx) => {
                  const isActive = activeContext === ctx.id;
                  return (
                    <button
                      key={ctx.id}
                      onClick={() => toggleContext(ctx.id)}
                      className={`rounded-md border-[1.5px] px-3 py-1.5 text-[12px] font-semibold transition-all duration-100 active:scale-[0.97] ${
                        isActive
                          ? "border-[#111] bg-[#111] text-white"
                          : "border-black/15 text-black/55 hover:border-black/30"
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
        className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 ${
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
