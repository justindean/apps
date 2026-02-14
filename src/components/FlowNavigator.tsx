import { useState, useRef, useCallback, useEffect } from "react";
import type { FlowStage, Phrase, StuckQuestion, SpeechMode } from "../data/phrases";
import { flowUtilityPhrases } from "../data/phrases";

interface FlowNavigatorProps {
  stages: FlowStage[];
  color: string;
  onCopy: (text: string) => void;
  mode: SpeechMode;
}

function speakPhrase(text: string) {
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-MX";
    u.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
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

/* ── Helper: replace placeholder in a string (case-insensitive, first match) ── */
function replaceVariable(text: string, placeholder: string, value: string): string {
  const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return text.replace(regex, value);
}

/* ── Primary Action Card ── */
function ActionCard({
  phrase,
  onCopy,
}: {
  phrase: Phrase;
  onCopy: (t: string) => void;
}) {
  // Per-variable selection state: map of variable label -> selected option (or null for default)
  const [selections, setSelections] = useState<Record<string, string>>({});

  // Compute the displayed Spanish text with variable replacements applied
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
    <div className="flex w-full flex-col rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-800">
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
        <p className="text-xs leading-snug text-stone-500 dark:text-stone-400">
          {phrase.english}
        </p>
        <p className="font-mono text-[10px] leading-snug text-stone-400 dark:text-stone-500">
          {phrase.pronunciation}
        </p>
        <div className="mt-1 flex w-full items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#D94F2A] dark:text-[#E8734F]">
            <VolumeIcon size={12} />
            Tap to speak
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

      {/* ── Variable chip row ── */}
      {phrase.variables && phrase.variables.length > 0 && (
        <div className="flex items-center gap-1.5 border-t border-stone-100 px-3.5 py-2 dark:border-stone-700/60">
          {phrase.variables.map((v) => (
            <div key={v.label} className="flex items-center gap-1 overflow-x-auto">
              <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                {v.label}:
              </span>
              {v.options.map((opt) => {
                const isActive = (selections[v.label] ?? v.placeholder).toLowerCase() === opt.toLowerCase();
                return (
                  <button
                    key={opt}
                    onClick={() =>
                      setSelections((prev) => ({ ...prev, [v.label]: opt }))
                    }
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

/* ── Highlight the variable word in displayed Spanish ── */
function renderHighlightedSpanish(
  text: string,
  variables: NonNullable<Phrase["variables"]>,
  selections: Record<string, string>,
) {
  // Find the currently active variable word to highlight
  const activeWords = variables.map(
    (v) => selections[v.label] ?? v.placeholder,
  );

  // Build regex to match any active word (case-insensitive)
  const pattern = activeWords
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
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

/* ── Stuck Q&A Section ── */
function StuckSection({ questions }: { questions: StuckQuestion[] }) {
  const [open, setOpen] = useState(false);

  if (questions.length === 0) return null;

  return (
    <section className="mt-5">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl bg-amber-50 px-4 py-3 text-left transition active:scale-[0.99] dark:bg-amber-900/20"
        aria-expanded={open}
        aria-controls="stuck-section"
      >
        <span className="text-xs font-medium text-amber-700/70 dark:text-amber-400/70">
          They might reply... (optional)
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-amber-600 transition-transform dark:text-amber-400 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div id="stuck-section" className="mt-3 flex flex-col gap-4">
          {questions.map((q) => (
            <div key={q.question}>
              <p className="mb-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  {`"${q.question}"`}
                </span>
                {" "}
                <span className="text-stone-400 dark:text-stone-500">
                  {q.questionEnglish}
                </span>
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
    </section>
  );
}

/* ── Quick Helper Pill ── */
function HelperPill({ phrase }: { phrase: Phrase }) {
  return (
    <button
      onClick={() => speakPhrase(phrase.spanish)}
      className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1.5 text-left transition active:scale-[0.97] dark:bg-stone-800"
    >
      <VolumeIcon size={11} />
      <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
        {phrase.spanish}
      </span>
      <span className="text-[10px] text-stone-400 dark:text-stone-500">
        {phrase.english}
      </span>
    </button>
  );
}

export function FlowNavigator({ stages, color: _color, onCopy, mode }: FlowNavigatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  const stage = stages[currentIndex];
  const isLast = currentIndex === stages.length - 1;

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= stages.length) return;
      setCurrentIndex(index);
    },
    [stages.length],
  );

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentIndex]);

  return (
    <div className="flex flex-col gap-0 pb-24">
      {/* ── Progress Bar ── */}
      <nav
        ref={topRef}
        className="mb-4 flex items-center gap-0"
        aria-label="Conversation progress"
      >
        {stages.map((s, i) => {
          const isActive = i === currentIndex;
          const isDone = i < currentIndex;
          return (
            <div key={s.key} className="flex flex-1 items-center">
              <button
                onClick={() => goTo(i)}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                  isActive
                    ? "bg-[#D94F2A] text-white shadow-md shadow-[#D94F2A]/25 ring-2 ring-[#D94F2A]/30"
                    : isDone
                      ? "bg-[#D94F2A]/15 text-[#D94F2A] dark:bg-[#D94F2A]/25 dark:text-[#E8734F]"
                      : "bg-stone-200 text-stone-400 dark:bg-stone-700 dark:text-stone-500"
                }`}
                aria-label={`Step ${i + 1}: ${s.name}`}
                aria-current={isActive ? "step" : undefined}
              >
                {isDone ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </button>
              {i < stages.length - 1 && (
                <div
                  className={`h-0.5 flex-1 transition-colors ${
                    isDone
                      ? "bg-[#D94F2A]/30 dark:bg-[#D94F2A]/40"
                      : "bg-stone-200 dark:bg-stone-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Step Header ── */}
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D94F2A]">
          Step {currentIndex + 1} of {stages.length}
        </p>
        <h2 className="mt-0.5 text-xl font-bold text-stone-900 dark:text-stone-100">
          {stage.name}
        </h2>
        <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
          {stage.subtitle}
        </p>
      </div>

      {/* ── 10-card Action Grid (2-col) ── */}
      <div className="grid grid-cols-2 gap-3">
        {stage.primaryPhrasesByTone[mode].map((phrase) => (
          <ActionCard key={phrase.spanish} phrase={phrase} onCopy={onCopy} />
        ))}
      </div>

      {/* ── If you get stuck (collapsed accordion) ── */}
      <StuckSection questions={stage.stuckQuestions} />

      {/* ── Quick Helpers (always pinned) ── */}
      <section className="mt-5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500">
          Quick helpers
        </p>
        <div className="flex flex-wrap gap-2">
          {flowUtilityPhrases.map((phrase) => (
            <HelperPill key={phrase.spanish} phrase={phrase} />
          ))}
        </div>
      </section>

      {/* ── Sticky Bottom Nav ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/80 bg-white/95 backdrop-blur-md dark:border-stone-700/80 dark:bg-stone-900/95">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <button
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="rounded-xl px-3 py-2.5 text-sm font-medium text-stone-500 transition active:scale-[0.96] disabled:opacity-30 dark:text-stone-400"
            aria-label="Previous step"
          >
            Back
          </button>

          <span className="text-xs font-semibold text-stone-400 dark:text-stone-500">
            {stage.name}
          </span>

          {isLast ? (
            <span className="px-3 py-2.5 text-sm font-semibold text-stone-300 dark:text-stone-600">
              Done
            </span>
          ) : (
            <button
              onClick={() => goTo(currentIndex + 1)}
              className="flex items-center gap-1.5 rounded-xl bg-[#D94F2A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.96]"
              aria-label={`Next step: ${stages[currentIndex + 1]?.name}`}
            >
              Next
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
