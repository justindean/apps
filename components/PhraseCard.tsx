import type { Phrase } from '@/data/phrases'
import { colorMap } from '@/utils/colors'

interface PhraseCardProps {
  phrase: Phrase
  color: string
  onCopy: (text: string) => void
}

export function PhraseCard({ phrase, color, onCopy }: PhraseCardProps) {
  const colors = colorMap[color] ?? colorMap.slate

  return (
    <article className="rounded-[18px] bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-card-elevated ring-1 ring-slate-200/60 card-highlight transition-all duration-150 hover:shadow-card-hover hover:-translate-y-0.5 active:translate-y-px active:shadow-card-press dark:from-slate-800 dark:to-slate-800/80 dark:ring-slate-700/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold leading-snug tracking-[0.01em] text-slate-900 dark:text-slate-100">
            {phrase.spanish}
            {phrase.isTemplate ? (
              <span className="ml-2 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 align-middle text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                Fill-in
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {phrase.english}
          </p>
          <p className="mt-1 font-mono text-xs leading-relaxed tracking-tight text-slate-300 dark:text-slate-600">
            {phrase.pronunciation}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <button
            onClick={() => onCopy(phrase.spanish)}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 active:scale-[0.95] ${colors.accent}`}
            aria-label={`Copy: ${phrase.spanish}`}
          >
            Copy
          </button>
          <button
            disabled
            className="rounded-lg px-3 py-2 text-xs font-medium text-slate-300 ring-1 ring-slate-200 dark:text-slate-600 dark:ring-slate-700 cursor-not-allowed"
            aria-label="Voice playback (coming soon)"
            title="Coming soon"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  )
}
