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

/* ── Section color identities ── */
const sectionColors: Record<string, { bar: string; barDark: string; bg: string; bgDark: string }> = {
  arrival: { bar: "bg-sky-400", barDark: "dark:bg-sky-500", bg: "bg-sky-50", bgDark: "dark:bg-sky-950/20" },
  drinks:  { bar: "bg-amber-400", barDark: "dark:bg-amber-500", bg: "bg-amber-50", bgDark: "dark:bg-amber-950/20" },
  food:    { bar: "bg-orange-300", barDark: "dark:bg-orange-400", bg: "bg-orange-50", bgDark: "dark:bg-orange-950/20" },
  during:  { bar: "bg-rose-300", barDark: "dark:bg-rose-400", bg: "bg-rose-50", bgDark: "dark:bg-rose-950/20" },
  bill:    { bar: "bg-emerald-400", barDark: "dark:bg-emerald-500", bg: "bg-emerald-50", bgDark: "dark:bg-emerald-950/20" },
  exit:    { bar: "bg-stone-300", barDark: "dark:bg-stone-500", bg: "bg-stone-50", bgDark: "dark:bg-stone-800/40" },
};

const sectionColorForLabel: Record<string, { bar: string; barDark: string }> = {
  Arrival: { bar: "bg-sky-400", barDark: "dark:bg-sky-500" },
  Drinks:  { bar: "bg-amber-400", barDark: "dark:bg-amber-500" },
  Food:    { bar: "bg-orange-300", barDark: "dark:bg-orange-400" },
  Bill:    { bar: "bg-emerald-400", barDark: "dark:bg-emerald-500" },
};

function getSectionColor(key: string) {
  return sectionColors[key] ?? sectionColors.exit;
}

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

/* ── Icons ── */
function WaveformIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12h2" /><path d="M6 8v8" /><path d="M10 4v16" /><path d="M14 6v12" /><path d="M18 8v8" /><path d="M22 12h2" />
    </svg>
  );
}

function VolumeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function BoltIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function ListIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

/* ── Variable helpers ── */
function replaceVariable(text: string, placeholder: string, value: string): string {
  const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return text.replace(regex, value);
}

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
          <span key={i} className="rounded bg-[#D94F2A]/10 px-0.5 text-[#D94F2A] dark:bg-[#D94F2A]/20 dark:text-[#E8734F]">{part.toUpperCase()}</span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   Recent Phrases Strip
   ═══════════════════════════════════════════════════════ */
function RecentStrip({ phrases, onCopy }: { phrases: Phrase[]; onCopy: (t: string) => void }) {
  if (phrases.length === 0) return null;
  return (
    <div className="mb-1">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400/70 dark:text-stone-500/70">Recent</p>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {phrases.map((p) => (
          <button
            key={p.spanish}
            onClick={() => { speakPhrase(p.spanish); onCopy(p.spanish); }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#D94F2A]/20 bg-[#D94F2A]/5 px-3 py-1.5 transition active:scale-[0.96] dark:border-[#E8734F]/20 dark:bg-[#E8734F]/5"
          >
            <VolumeIcon size={10} />
            <span className="text-[11px] font-semibold text-[#D94F2A] dark:text-[#E8734F]">{p.spanish}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Speak Pill Button — hero action with glow
   ═══════════════════════════════════════════════════════ */
function SpeakPill({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative mt-2 inline-flex items-center gap-1.5 self-start rounded-full bg-[#D94F2A] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-md shadow-[#D94F2A]/25 transition active:scale-95 dark:bg-[#E8734F] dark:shadow-[#E8734F]/20"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#D94F2A]/20 dark:bg-[#E8734F]/20" style={{ animationDuration: "2.5s" }} />
      <WaveformIcon size={13} />
      Speak
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   Fast Mode Card — section color bar + premium polish
   ═══════════════════════════════════════════════════════ */
function FastCard({
  phrase,
  onCopy,
  barColor,
  onSpeak,
}: {
  phrase: Phrase;
  onCopy: (t: string) => void;
  barColor: string;
  onSpeak: (p: Phrase) => void;
}) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.04)] transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] active:shadow-sm dark:border-stone-700/60 dark:bg-stone-800/90 dark:shadow-none dark:hover:border-stone-600/80">
      {/* Color identity bar */}
      <div className={`h-1 w-full ${barColor}`} />

      <button
        onClick={() => { speakPhrase(phrase.spanish); onSpeak(phrase); }}
        className="flex w-full flex-col items-start p-4 text-left"
      >
        <p className="text-[17px] font-extrabold leading-tight tracking-[0.02em] text-stone-900 dark:text-stone-50">
          {phrase.spanish}
        </p>
        <p className="mt-1.5 text-[13px] leading-snug text-stone-400 dark:text-stone-500">
          {phrase.english}
        </p>
        <p className="mt-1 font-mono text-[10.5px] leading-snug tracking-tight text-stone-300 dark:text-stone-600">
          {phrase.pronunciation}
        </p>
        <SpeakPill onClick={() => { speakPhrase(phrase.spanish); onSpeak(phrase); }} />
      </button>

      {/* Copy */}
      <div className="flex items-center justify-end border-t border-stone-100 px-3 py-1.5 dark:border-stone-700/50">
        <button
          onClick={(e) => { e.stopPropagation(); onCopy(phrase.spanish); }}
          className="rounded-md px-2 py-0.5 text-[10px] font-semibold text-stone-400 transition hover:text-stone-600 active:scale-95 dark:text-stone-500 dark:hover:text-stone-300"
          aria-label={`Copy: ${phrase.spanish}`}
        >
          Copy
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Fast Mode View — sections with color identity
   ═══════════════════════════════════════════════════════ */
function FastModeView({
  mode,
  onCopy,
  onSpeak,
  recentPhrases,
}: {
  mode: SpeechMode;
  onCopy: (t: string) => void;
  onSpeak: (p: Phrase) => void;
  recentPhrases: Phrase[];
}) {
  const sections = fastModePhrasesBySection[mode];

  return (
    <div className="flex flex-col gap-5 pb-28 pt-3">
      {/* Header microcopy */}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">Restaurant</h2>
        <p className="text-[13px] text-stone-400 dark:text-stone-500">Speak instantly. No typing.</p>
      </div>

      {/* Recent strip */}
      <RecentStrip phrases={recentPhrases} onCopy={onCopy} />

      {/* Sections */}
      {sections.map((section) => {
        const sc = sectionColorForLabel[section.label] ?? { bar: "bg-stone-300", barDark: "dark:bg-stone-500" };
        return (
          <div key={section.label}>
            <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              {section.label}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {section.phrases.map((phrase) => (
                <FastCard
                  key={phrase.spanish}
                  phrase={phrase}
                  onCopy={onCopy}
                  barColor={`${sc.bar} ${sc.barDark}`}
                  onSpeak={onSpeak}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Action Card — full-mode with section color bar
   ═══════════════════════════════════════════════════════ */
function ActionCard({
  phrase,
  onCopy,
  barColor,
  onSpeak,
}: {
  phrase: Phrase;
  onCopy: (t: string) => void;
  barColor: string;
  onSpeak: (p: Phrase) => void;
}) {
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
    <div className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.04)] transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] active:shadow-sm dark:border-stone-700/60 dark:bg-stone-800/90 dark:shadow-none dark:hover:border-stone-600/80">
      {/* Color identity bar */}
      <div className={`h-1 w-full ${barColor}`} />

      <button
        onClick={() => { speakPhrase(displaySpanish); onSpeak(phrase); }}
        className="flex w-full flex-col items-start p-3.5 text-left"
      >
        <p className="text-[15px] font-extrabold leading-tight tracking-[0.02em] text-stone-900 dark:text-stone-50">
          {phrase.variables && phrase.variables.length > 0
            ? renderHighlightedSpanish(displaySpanish, phrase.variables, selections)
            : displaySpanish}
          {phrase.isTemplate && (
            <span className="ml-1.5 inline-block rounded bg-stone-100 px-1 py-0.5 align-middle text-[9px] font-semibold uppercase tracking-wide text-stone-400 dark:bg-stone-700 dark:text-stone-500">
              fill-in
            </span>
          )}
        </p>
        <p className="mt-1 text-[12px] leading-snug text-stone-400 dark:text-stone-500">{phrase.english}</p>
        <p className="mt-0.5 font-mono text-[10px] leading-snug tracking-tight text-stone-300 dark:text-stone-600">
          {phrase.pronunciation}
        </p>
        <SpeakPill onClick={() => { speakPhrase(displaySpanish); onSpeak(phrase); }} />
      </button>

      {/* Copy row */}
      <div className="flex items-center justify-end border-t border-stone-100 px-3 py-1.5 dark:border-stone-700/50">
        <button
          onClick={(e) => { e.stopPropagation(); onCopy(displaySpanish); }}
          className="rounded-md px-2 py-0.5 text-[10px] font-semibold text-stone-400 transition hover:text-stone-600 active:scale-95 dark:text-stone-500 dark:hover:text-stone-300"
          aria-label={`Copy: ${displaySpanish}`}
        >
          Copy
        </button>
      </div>

      {phrase.variables && phrase.variables.length > 0 && (
        <div className="flex items-center gap-1.5 border-t border-stone-100 px-3.5 py-2 dark:border-stone-700/60">
          {phrase.variables.map((v) => (
            <div key={v.label} className="flex items-center gap-1 overflow-x-auto">
              {v.options.map((opt) => {
                const isActive = (selections[v.label] ?? v.placeholder).toLowerCase() === opt.toLowerCase();
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
        className="flex w-full items-center justify-between rounded-xl bg-amber-50/80 px-3.5 py-2.5 text-left transition active:scale-[0.99] dark:bg-amber-900/20"
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
                <span className="font-semibold text-stone-700 dark:text-stone-300">{`"${q.question}"`}</span>{" "}
                <span className="text-stone-400 dark:text-stone-500">{q.questionEnglish}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {q.replies.map((r) => (
                  <button
                    key={r.spanish}
                    onClick={() => speakPhrase(r.spanish)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-left shadow-sm transition active:scale-[0.96] dark:border-amber-700/50 dark:bg-stone-800"
                  >
                    <VolumeIcon size={11} />
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">{r.spanish}</span>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500">{r.pronunciation}</span>
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
  onSpeak,
}: {
  stage: FlowStage;
  mode: SpeechMode;
  onCopy: (t: string) => void;
  open: boolean;
  onToggle: () => void;
  sectionRef: (el: HTMLElement | null) => void;
  onSpeak: (p: Phrase) => void;
}) {
  const phrases = stage.primaryPhrasesByTone[mode];
  const sc = getSectionColor(stage.key);

  return (
    <section ref={sectionRef} className="scroll-mt-28">
      <button
        onClick={onToggle}
        className={`group flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left transition active:scale-[0.99] ${sc.bg} ${sc.bgDark}`}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className={`h-8 w-1 rounded-full ${sc.bar} ${sc.barDark}`} />
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">{stage.name}</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">{stage.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-stone-500 dark:bg-stone-700/60 dark:text-stone-400">
            {phrases.length}
          </span>
          <ChevronIcon open={open} />
        </div>
      </button>

      {open && (
        <div className="mt-3 flex flex-col">
          <div className="grid grid-cols-2 gap-3">
            {phrases.map((phrase) => (
              <ActionCard
                key={phrase.spanish}
                phrase={phrase}
                onCopy={onCopy}
                barColor={`${sc.bar} ${sc.barDark}`}
                onSpeak={onSpeak}
              />
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
          <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">{p.spanish}</span>
          <span className="text-[10px] text-stone-400 dark:text-stone-500">{p.english}</span>
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Section Nav — sticky tab bar
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
    <div ref={scrollRef} className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-hide">
      {stages.map((s) => {
        const isActive = s.key === activeKey;
        const sc = getSectionColor(s.key);
        return (
          <button
            key={s.key}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSelect(s.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              isActive
                ? `${sc.bar} ${sc.barDark} text-white shadow-sm`
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
   Premium Glass Mode Toggle
   ═══════════════════════════════════════════════════════ */
function ModeToggle({ viewMode, onToggle }: { viewMode: ViewMode; onToggle: (m: ViewMode) => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-2xl border border-white/30 bg-white/80 p-1.5 shadow-xl shadow-stone-900/15 backdrop-blur-xl dark:border-stone-600/40 dark:bg-stone-900/80 dark:shadow-stone-950/40">
        <button
          onClick={() => onToggle("fast")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold tracking-wide transition-all duration-200 ${
            viewMode === "fast"
              ? "bg-[#D94F2A] text-white shadow-md shadow-[#D94F2A]/30"
              : "text-stone-400 hover:text-stone-600 active:bg-stone-100 dark:text-stone-500 dark:hover:text-stone-300 dark:active:bg-stone-800"
          }`}
        >
          <BoltIcon size={15} />
          FAST
        </button>
        <button
          onClick={() => onToggle("full")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold tracking-wide transition-all duration-200 ${
            viewMode === "full"
              ? "bg-[#D94F2A] text-white shadow-md shadow-[#D94F2A]/30"
              : "text-stone-400 hover:text-stone-600 active:bg-stone-100 dark:text-stone-500 dark:hover:text-stone-300 dark:active:bg-stone-800"
          }`}
        >
          <ListIcon size={15} />
          FULL
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
  const [recentPhrases, setRecentPhrases] = useState<Phrase[]>([]);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const isScrollingTo = useRef(false);

  const addRecent = useCallback((phrase: Phrase) => {
    setRecentPhrases((prev) => {
      const filtered = prev.filter((p) => p.spanish !== phrase.spanish);
      return [phrase, ...filtered].slice(0, 3);
    });
  }, []);

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleNavSelect = useCallback((key: string) => {
    setActiveKey(key);
    setOpenSections((prev) => ({ ...prev, [key]: true }));
    requestAnimationFrame(() => {
      const el = sectionRefs.current[key];
      if (el) {
        isScrollingTo.current = true;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => { isScrollingTo.current = false; }, 600);
      }
    });
  }, []);

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
        <FastModeView mode={mode} onCopy={onCopy} onSpeak={addRecent} recentPhrases={recentPhrases} />
      ) : (
        <div className="mt-4 flex flex-col gap-6 pb-28">
          {/* Full mode header */}
          <div className="flex flex-col gap-0.5">
            <h2 className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">Restaurant</h2>
            <p className="text-[13px] text-stone-400 dark:text-stone-500">All phrases by stage</p>
          </div>

          <RecentStrip phrases={recentPhrases} onCopy={onCopy} />

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
              onSpeak={addRecent}
            />
          ))}
        </div>
      )}

      {/* ── Premium glass mode toggle ── */}
      <ModeToggle viewMode={viewMode} onToggle={setViewMode} />
    </div>
  );
}
