import { useState } from "react";
import type { FlowStage } from "../data/phrases";
import { PhraseCard } from "./PhraseCard";
import { colorMap } from "../utils/colors";

interface FlowNavigatorProps {
  stages: FlowStage[];
  color: string;
  onCopy: (text: string) => void;
}

const stageNumber = (index: number) => String(index + 1);

export function FlowNavigator({ stages, color, onCopy }: FlowNavigatorProps) {
  const [openStage, setOpenStage] = useState<string | null>(null);
  const colors = colorMap[color] ?? colorMap.slate;

  const toggle = (key: string) => {
    setOpenStage((prev) => (prev === key ? null : key));
  };

  return (
    <section className="flex flex-col gap-2" aria-label="Conversation flow">
      <p className={`mb-1 text-xs font-medium ${colors.muted}`}>
        Follow the flow step by step
      </p>
      {stages.map((stage, i) => {
        const isOpen = openStage === stage.key;
        const isDone = openStage !== null && stages.findIndex((s) => s.key === openStage) > i;
        return (
          <div key={stage.key} className="flex gap-3">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => toggle(stage.key)}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 transition ${
                  isOpen
                    ? colors.badgeActive
                    : isDone
                      ? "bg-slate-200 text-slate-500 ring-slate-300 dark:bg-slate-700 dark:text-slate-400 dark:ring-slate-600"
                      : "bg-white text-slate-400 ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700"
                }`}
                aria-expanded={isOpen}
                aria-controls={`flow-${stage.key}`}
              >
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  stageNumber(i)
                )}
              </button>
              {i < stages.length - 1 && (
                <div
                  className={`w-0.5 flex-1 transition-colors ${
                    isDone
                      ? "bg-slate-300 dark:bg-slate-600"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              )}
            </div>

            {/* Stage content */}
            <div className="flex-1 pb-3">
              <button
                onClick={() => toggle(stage.key)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition active:scale-[0.99] ${
                  isOpen
                    ? `${colors.card} ring-1 ${colors.ring}`
                    : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                }`}
              >
                <span className={`text-sm font-semibold ${isOpen ? "" : isDone ? "text-slate-400 dark:text-slate-500" : ""}`}>
                  {stage.name}
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
                  className={`shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isOpen && (
                <div
                  id={`flow-${stage.key}`}
                  className="mt-2 flex flex-col gap-2"
                >
                  {stage.phrases.map((phrase) => (
                    <PhraseCard
                      key={phrase.spanish}
                      phrase={phrase}
                      color={color}
                      onCopy={onCopy}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
