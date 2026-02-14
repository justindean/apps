import { useState, useRef, useCallback, useEffect } from "react";
import type { FlowStage, Phrase, StuckQuestion, SpeechMode } from "../data/phrases";
import { flowUtilityPhrases, fastModePhrasesBySection } from "../data/phrases";

interface FlowNavigatorProps {
  stages: FlowStage[];
  color: string;
  onCopy: (text: string) => void;
  mode: SpeechMode;
}

type ViewMode = "fast" | "full";

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

/* ── Waveform icon ── */
function WaveformIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12h2" />
      <path d="M6 8v8" />
      <path d="M10 4v16" />
      <path d="M14 6v12" />
      <path d="M18 8v8" />
      <path d="M22 12h2" />
    </svg>
  );
}

/* ── Volume icon ── */
function VolumeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

/* ── Chevron icon ── */
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* ── Bolt icon ── */
function BoltIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

/* ── Helper: replace placeholder in a string ── */
function replaceVariable(text: string, placeholder: string, value: string): string {
  const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return text.replace(regex, value);
}

/* ── Highlight variable word in displayed Spanish ── */
function renderHighlightedSpanish(
  text: string,
  variables: NonNullable<Phrase["variables"]>,
  selections: Record<string, string>,
) {
  const activeWords = variables.map((v) => selections[v.label] ?? v.placeholder);
  const pattern = activeWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const regex = new RegExp(`(${pattern})`, "i");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span
            key={i}
            className="rounded bg-[#D94F2A]/10 px-0.5 text-[#D94F2A] dark:bg-[#D94F2A]/20 dark:text-[#E8734F]"
          >
            {part.toUpperCase()}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   Fast Mode Card — large tap target, commercial polish
   ═══════════════════════════════════════════════════════ */
function FastCard({ phrase, onCopy }: { phrase: Phrase; onCopy: (t: string) => void }) {
  return (
    <div className="flex flex-col rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md dark:border-stone-700/60 dark:bg-stone-800/90 dark:shadow-none">
      <button
        onClick={() => speakPhrase(phrase.spanish)}
        className="flex w-full flex-col items-start gap-1.5 p-4 text-left transition active:scale-[0.97]"
      >
        <p className="text-[17px] font-bold leading-tight text-stone-900 dark:text-stone-50">
          {phrase.spanish}
        </p>
        <p className="text-[13px] leading-snug text-stone-500 dark:text-stone-400">
          {phrase.english}
        </p>
        <p className="font-mono text-[11px] leading-snug text-stone-400/80 dark:text-stone-500/80">
          {phrase.pronunciation}
        </p>
        <div className="mt-2 flex w-full items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#D94F2A] dark:text-[#E8734F]">
            <WaveformIcon size={13} />
            Tap to Speak
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(phrase.spanish);
            }}
            className="rounded-lg bg-stone-100 px-2.5 py-1 text-[10px] font-semibold text-stone-500 transition active:scale-95 dark:bg-stone-700 dark:text-stone-400"
            aria-label={`Copy: ${phrase.spanish}`}
          >
            Copy
          </button>
        </div>
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Fast Mode View — grouped by section with large cards
   ═══════════════════════════════════════════════════════ */
function FastModeView({ mode, onCopy }: { mode: SpeechMode; onCopy: (t: string) => void }) {
  const sections = fastModePhrasesBySection[mode];

  return (
    <div className="flex flex-col gap-6 pb-28 pt-3">
      {sections.map((section) => (
        <div key={section.label}>
          <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            {section.label}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {section.phrases.map((phrase) => (
              <FastCard key={phrase.spanish} phrase={phrase} onCopy={onCopy} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Action Card — one phrase in the full-mode grid
   ═══════════════════════════════════════════════════════ */
function ActionCard({ phrase, onCopy }: { phrase: Phrase; onCopy: (t: string) => void }) {
  const [selections, setSelections] = useState<Record<string, string>>({});

  let displaySpanish = phrase.spanish;
  if (phrase.variables) {
    for (const v of phrase.variables) {
      const selected = selections[v.label];
      if (selected && selected.toLowerCase() !== v.placeholder.toLowerCase()) {
        displaySpanish = replaceVariable(displaySpanish, v.placeholder, selected);
      }
    }
  }

  return (
    <div className="flex w-full flex-col rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] dark:border-stone-700/60 dark:bg-stone-800/90 dark:shadow-none">
      <button
        onClick={() => speakPhrase(displaySpanish)}
        className="flex w-full flex-col items-start gap-1 p-3.5 text-left transition active:scale-[0.97]"
      >
        <p className="text-[15px] font-bold leading-tight text-stone-900 dark:text-stone-50">
          {phrase.variables && phrase.variables.length > 0
            ? renderHighlightedSpanish(displaySpanish, phrase.variables, selections)
            : displaySpanish}
          {phrase.isTemplate && (
            <span className="ml-1.5 inline-block rounded bg-stone-100 px-1 py-0.5 align-middle text-[9px] font-semibold uppercase tracking-wide text-stone-400 dark:bg-stone-700 dark:text-stone-500">
              fill-in
            </span>
          )}
        </p>
        <p className="text-xs leading-snug text-stone-500 dark:text-stone-400">{phrase.english}</p>
        <p className="font-mono text-[10px] leading-snug text-stone-400 dark:text-stone-500">
          {phrase.pronunciation}
        </p>
        <div className="mt-1 flex w-full items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#D94F2A] dark:text-[#E8734F]">
            <WaveformIcon size={12} />
            Tap to Speak
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(displaySpanish);
            }}
            className="rounded-lg bg-stone-100 px-2 py-1 text-[10px] font-semibold text-stone-600 transition active:scale-95 dark:bg-stone-700 dark:text-stone-300"
            aria-label={`Copy: ${displaySpanish}`}
          >
            Copy
          </button>
        </div>
      </button>

      {phrase.variables && phrase.variables.length > 0 && (
        <div className="flex items-center gap-1.5 border-t border-stone-100 px-3.5 py-2 dark:border-stone-700/60">
          {phrase.variables.map((v) => (
            <div key={v.label} className="flex items-center gap-1 overflow-x-auto">
              {v.options.map((opt) => {
                const isActive =
                  (selections[v.label] ?? v.placeholder).toLowerCase() === opt.toLowerCase();
                return (
                  <button
                    key={opt}
                    onClick={() => setSelections((prev) => ({ ...prev, [v.label]: opt }))}
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition ${
                      isActive
                        ? "bg-[#D94F2A] text-white"
                        : "bg-stone-100 text-stone-500 active:bg-stone-200 dark:bg-stone-700 dark:text-stone-400"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Stuck Q&A Section
   ═══════════════════════════════════════════════════════ */
function StuckSection({ questions }: { questions: StuckQuestion[] }) {
  const [open, setOpen] = useState(false);
  if (questions.length === 0) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between rounded-xl bg-amber-50 px-3.5 py-2.5 text-left transition active:scale-[0.99] dark:bg-amber-900/20"
        aria-expanded={open}
      >
        <span className="text-xs font-medium text-amber-700/70 dark:text-amber-400/70">
          If they ask...
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="mt-2.5 flex flex-col gap-3.5">
          {questions.map((q) => (
            <div key={q.question}>
              <p className="mb-1.5 text-xs text-stone-500 dark:text-stone-400">
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  {`"${q.question}"`}
                </span>{" "}
                <span className="text-stone-400 dark:text-stone-500">{q.questionEnglish}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {q.replies.map((r) => (
                  <button
                    key={r.spanish}
                    onClick={() => speakPhrase(r.spanish)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-left transition active:scale-[0.96] dark:border-amber-700/50 dark:bg-stone-800"
                  >
                    <VolumeIcon size={11} />
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                      {r.spanish}
                    </span>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500">
                      {r.pronunciation}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Collapsible Section for one stage (Full Mode)
   ═══════════════════════════════════════════════════════ */
function StageSection({
  stage,
  mode,
  onCopy,
  open,
  onToggle,
  sectionRef,
}: {
  stage: FlowStage;
  mode: SpeechMode;
  onCopy: (t: string) => void;
  open: boolean;
  onToggle: () => void;
  sectionRef: (el: HTMLElement | null) => void;
}) {
  const phrases = stage.primaryPhrasesByTone[mode];

  return (
    <section ref={sectionRef} className="scroll-mt-28">
      <button
        onClick={onToggle}
        className="group flex w-full items-center justify-between rounded-2xl bg-stone-50 px-4 py-3.5 text-left transition active:scale-[0.99] dark:bg-stone-800/60"
        aria-expanded={open}
      >
        <div className="flex flex-col">
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">{stage.name}</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">{stage.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-stone-200/60 px-2 py-0.5 text-[10px] font-semibold text-stone-500 dark:bg-stone-700/60 dark:text-stone-400">
            {phrases.length}
          </span>
          <ChevronIcon open={open} />
        </div>
      </button>

      {open && (
        <div className="mt-3 flex flex-col">
          <div className="grid grid-cols-2 gap-3">
            {phrases.map((phrase) => (
              <ActionCard key={phrase.spanish} phrase={phrase} onCopy={onCopy} />
            ))}
          </div>
          <StuckSection questions={stage.stuckQuestions} />
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   Quick Help — pinned helper pills
   ═══════════════════════════════════════════════════════ */
function QuickHelp() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-hide">
      {flowUtilityPhrases.map((p) => (
        <button
          key={p.spanish}
          onClick={() => speakPhrase(p.spanish)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 shadow-sm transition active:scale-[0.96] dark:border-stone-700 dark:bg-stone-800"
        >
          <VolumeIcon size={11} />
          <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
            {p.spanish}
          </span>
          <span className="text-[10px] text-stone-400 dark:text-stone-500">{p.english}</span>
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Section Nav — sticky tab bar with section names
   ═══════════════════════════════════════════════════════ */
function SectionNav({
  stages,
  activeKey,
  onSelect,
}: {
  stages: FlowStage[];
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const left = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left, behavior: "smooth" });
    }
  }, [activeKey]);

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-hide"
    >
      {stages.map((s) => {
        const isActive = s.key === activeKey;
        return (
          <button
            key={s.key}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSelect(s.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              isActive
                ? "bg-[#D94F2A] text-white shadow-sm"
                : "bg-stone-100 text-stone-500 active:bg-stone-200 dark:bg-stone-800 dark:text-stone-400"
            }`}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Sticky Bottom Mode Toggle
   ═══════════════════════════════════════════════════════ */
function ModeToggle({ viewMode, onToggle }: { viewMode: ViewMode; onToggle: (m: ViewMode) => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-0.5 rounded-full border border-stone-200/80 bg-white/95 p-1 shadow-lg shadow-stone-900/10 backdrop-blur-md dark:border-stone-700/60 dark:bg-stone-900/95 dark:shadow-stone-950/30">
        <button
          onClick={() => onToggle("fast")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition ${
            viewMode === "fast"
              ? "bg-[#D94F2A] text-white shadow-sm"
              : "text-stone-500 active:bg-stone-100 dark:text-stone-400 dark:active:bg-stone-800"
          }`}
        >
          <BoltIcon size={14} />
          FAST MODE
        </button>
        <button
          onClick={() => onToggle("full")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition ${
            viewMode === "full"
              ? "bg-[#D94F2A] text-white shadow-sm"
              : "text-stone-500 active:bg-stone-100 dark:text-stone-400 dark:active:bg-stone-800"
          }`}
        >
          FULL MODE
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FlowNavigator — opens in Fast Mode by default
   ═══════════════════════════════════════════════════════ */
export function FlowNavigator({ stages, color: _color, onCopy, mode }: FlowNavigatorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("fast");
  const [activeKey, setActiveKey] = useState(stages[0]?.key ?? "");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    stages.forEach((s, i) => { init[s.key] = i === 0; });
    return init;
  });
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const isScrollingTo = useRef(false);

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleNavSelect = useCallback(
    (key: string) => {
      setActiveKey(key);
      setOpenSections((prev) => ({ ...prev, [key]: true }));
      requestAnimationFrame(() => {
        const el = sectionRefs.current[key];
        if (el) {
          isScrollingTo.current = true;
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => {
            isScrollingTo.current = false;
          }, 600);
        }
      });
    },
    [],
  );

  // Track which section is in view as user scrolls (Full Mode)
  useEffect(() => {
    if (viewMode !== "full") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingTo.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const key = entry.target.getAttribute("data-stage-key");
            if (key) setActiveKey(key);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );

    for (const el of Object.values(sectionRefs.current)) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [stages, viewMode]);

  return (
    <div className="flex flex-col gap-0">
      {/* ── Pinned bar: Quick Help + Section Nav (Full Mode only) ── */}
      <div className="sticky top-[57px] z-20 -mx-4 border-b border-stone-200/60 bg-[#FFFAF7]/95 px-4 pb-2 pt-2 backdrop-blur-md dark:border-stone-800/60 dark:bg-stone-950/95">
        <QuickHelp />
        {viewMode === "full" && (
          <div className="mt-2">
            <SectionNav stages={stages} activeKey={activeKey} onSelect={handleNavSelect} />
          </div>
        )}
      </div>

      {/* ── Main content area ── */}
      {viewMode === "fast" ? (
        <FastModeView mode={mode} onCopy={onCopy} />
      ) : (
        <div className="mt-4 flex flex-col gap-6 pb-28">
          {stages.map((stage) => (
            <StageSection
              key={stage.key}
              stage={stage}
              mode={mode}
              onCopy={onCopy}
              open={!!openSections[stage.key]}
              onToggle={() => toggleSection(stage.key)}
              sectionRef={(el) => {
                if (el) {
                  el.setAttribute("data-stage-key", stage.key);
                  sectionRefs.current[stage.key] = el;
                }
              }}
            />
          ))}
        </div>
      )}

      {/* ── Sticky bottom mode toggle ── */}
      <ModeToggle viewMode={viewMode} onToggle={setViewMode} />
    </div>
  );
}
