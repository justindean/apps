import { useEffect, useRef } from "react";
import type { Phrase } from "../data/phrases";

interface RescueModalProps {
  phrases: Phrase[];
  onClose: () => void;
  onCopy: (text: string) => void;
}

export default function RescueModal({ phrases, onClose, onCopy }: RescueModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Quick rescue phrases"
    >
      <div className="w-full max-w-lg animate-slide-up rounded-t-3xl bg-white px-4 pb-8 pt-3 shadow-glass dark:bg-stone-800">
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-stone-300 dark:bg-stone-600" />

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Quick Rescue Phrases
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-all duration-150 active:scale-95 dark:bg-stone-700 dark:text-stone-400"
            aria-label="Close"
          >
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
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60dvh] overflow-y-auto">
          <div className="flex flex-col gap-2">
            {phrases.map((p) => (
              <button
                key={p.spanish}
                onClick={() => onCopy(p.spanish)}
                className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-left ring-1 ring-stone-200/70 shadow-card transition-all duration-150 active:scale-[0.98] active:shadow-card-press dark:bg-stone-700/50 dark:ring-stone-600/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-stone-900 dark:text-stone-100">
                    {p.spanish}
                  </p>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {p.english}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-red-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm dark:bg-red-500">
                  Copy
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
