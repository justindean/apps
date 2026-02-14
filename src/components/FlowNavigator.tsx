import { useState, useRef, useCallback, useEffect } from "react";
import type { FlowStage, Phrase } from "../data/phrases";
import { PhraseCard } from "./PhraseCard";

interface FlowNavigatorProps {
  stages: FlowStage[];
  color: string;
  onCopy: (text: string) => void;
}

export function FlowNavigator({ stages, color, onCopy }: FlowNavigatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSecondary, setShowSecondary] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const stage = stages[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === stages.length - 1;

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= stages.length) return;
      setCurrentIndex(index);
      setShowSecondary(false);
    },
    [stages.length],
  );

  // Scroll hero into view on step change
  useEffect(() => {
    heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentIndex]);

  const speakPhrase = (phrase: Phrase) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(phrase.spanish);
      utterance.lang = "es-MX";
      utterance.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col gap-0 pb-28">
      {/* ── Progress Bar ── */}
      <nav
        className="mb-5 flex items-center gap-0"
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
      <div ref={heroRef} className="mb-4">
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

      {/* ── Hero Phrase Card ── */}
      <article className="rounded-2xl border border-[#D94F2A]/20 bg-gradient-to-br from-[#FDF6F3] to-[#FFF9F7] p-5 shadow-lg shadow-[#D94F2A]/5 dark:border-[#D94F2A]/30 dark:from-stone-800 dark:to-stone-800/80">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#D94F2A]/70">
          Say this now
        </p>
        <p className="mt-2 text-2xl font-bold leading-snug text-stone-900 dark:text-stone-50">
          {stage.primaryPhrase.spanish}
        </p>
        <p className="mt-1.5 text-base text-stone-600 dark:text-stone-300">
          {stage.primaryPhrase.english}
        </p>
        <p className="mt-1 font-mono text-xs text-stone-400 dark:text-stone-500">
          {stage.primaryPhrase.pronunciation}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => speakPhrase(stage.primaryPhrase)}
            className="flex items-center gap-1.5 rounded-xl bg-[#D94F2A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.96]"
            aria-label="Speak phrase aloud"
          >
            <svg
              width="16"
              height="16"
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
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
            Speak
          </button>
          <button
            onClick={() => onCopy(stage.primaryPhrase.spanish)}
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.96] dark:bg-stone-100 dark:text-stone-900"
            aria-label="Copy phrase"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            Copy
          </button>
        </div>
      </article>

      {/* ── Expected Replies ── */}
      {stage.expectedReplies.length > 0 && (
        <section className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500">
            They might reply
          </p>
          <div className="flex flex-col gap-1.5">
            {stage.expectedReplies.map((reply) => (
              <div
                key={reply.spanish}
                className="rounded-xl bg-stone-100 px-4 py-2.5 dark:bg-stone-800"
              >
                <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
                  {reply.spanish}
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  {reply.english}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Secondary Phrases (accordion) ── */}
      {stage.secondaryPhrases.length > 0 && (
        <section className="mt-5">
          <button
            onClick={() => setShowSecondary((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-xl bg-stone-100 px-4 py-3 text-left transition active:scale-[0.99] dark:bg-stone-800"
            aria-expanded={showSecondary}
            aria-controls="secondary-phrases"
          >
            <span className="text-sm font-semibold text-stone-600 dark:text-stone-300">
              Other useful phrases
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
              className={`shrink-0 text-stone-400 transition-transform dark:text-stone-500 ${showSecondary ? "rotate-180" : ""}`}
              aria-hidden
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showSecondary && (
            <div
              id="secondary-phrases"
              className="mt-2 flex flex-col gap-2"
            >
              {stage.secondaryPhrases.map((phrase) => (
                <PhraseCard
                  key={phrase.spanish}
                  phrase={phrase}
                  color={color}
                  onCopy={onCopy}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Sticky Bottom Nav ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/80 bg-white/95 backdrop-blur-md dark:border-stone-700/80 dark:bg-stone-900/95">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <button
            onClick={() => speakPhrase(stage.primaryPhrase)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-600 transition active:scale-[0.96] dark:text-stone-300"
            aria-label="Speak current phrase"
          >
            <svg
              width="18"
              height="18"
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
            Speak
          </button>

          <button
            onClick={() => onCopy(stage.primaryPhrase.spanish)}
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.96] dark:bg-stone-100 dark:text-stone-900"
            aria-label="Copy current phrase"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            Copy
          </button>

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
