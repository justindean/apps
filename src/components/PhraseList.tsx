import { useMemo, useState } from 'react'
import type { Category } from '../data/phrases'
import { SubContextBar } from './SubContextBar'
import { PhraseCard } from './PhraseCard'
import { colorMap } from '../utils/colors'

interface PhraseListProps {
  category: Category
  onBack: () => void
  onCopy: (text: string) => void
}

export function PhraseList({ category, onBack, onCopy }: PhraseListProps) {
  const [activeSubKey, setActiveSubKey] = useState(category.subContexts[0]?.key ?? '')
  const colors = colorMap[category.color] ?? colorMap.slate

  const activeSub = useMemo(
    () => category.subContexts.find((s) => s.key === activeSubKey) ?? category.subContexts[0],
    [category, activeSubKey]
  )

  return (
    <>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 -mx-4 bg-slate-50/95 px-4 pb-2 pt-4 backdrop-blur-sm dark:bg-slate-925/95">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition active:scale-[0.95] dark:bg-slate-800 dark:ring-slate-700"
            aria-label="Back to categories"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              <span aria-hidden>{category.emoji}</span>
              <span className="truncate">{category.name}</span>
            </h2>
          </div>
          {/* Future-ready: favorites / AI help */}
          <div className="ml-auto flex gap-1.5">
            <button
              disabled
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 ring-1 ring-slate-200 dark:text-slate-600 dark:ring-slate-700 cursor-not-allowed"
              title="Favorites (coming soon)"
              aria-label="Favorites (coming soon)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
            <button
              disabled
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 ring-1 ring-slate-200 dark:text-slate-600 dark:ring-slate-700 cursor-not-allowed"
              title="AI Help (coming soon)"
              aria-label="AI Help (coming soon)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 6V2H8" />
                <path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z" />
                <path d="M2 12h2" />
                <path d="M9 11v2" />
                <path d="M15 11v2" />
                <path d="M20 12h2" />
              </svg>
            </button>
          </div>
        </div>

        <SubContextBar
          subContexts={category.subContexts}
          activeKey={activeSubKey}
          color={category.color}
          onSelect={setActiveSubKey}
        />
      </div>

      {/* Phrase count */}
      <p className={`mt-3 text-xs font-medium ${colors.muted}`}>
        {activeSub.phrases.length} phrases in {activeSub.name}
      </p>

      {/* Phrase cards */}
      <section className="mt-2 flex flex-col gap-3 pb-8" role="list" aria-label={`${activeSub.name} phrases`}>
        {activeSub.phrases.map((phrase) => (
          <PhraseCard
            key={phrase.spanish}
            phrase={phrase}
            color={category.color}
            onCopy={onCopy}
          />
        ))}
      </section>
    </>
  )
}
