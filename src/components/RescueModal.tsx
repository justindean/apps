import { useEffect, useRef } from 'react'
import { rescuePhrases } from '../data/phrases'

interface RescueModalProps {
  open: boolean
  onClose: () => void
  onCopy: (text: string) => void
}

export function RescueModal({ open, onClose, onCopy }: RescueModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Quick rescue phrases"
    >
      <div className="w-full max-w-md animate-slide-up rounded-t-3xl bg-white px-4 pb-8 pt-3 shadow-xl dark:bg-slate-800">
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            They asked me something
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition active:scale-95 dark:bg-slate-700 dark:text-slate-400"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {rescuePhrases.map((p) => (
            <button
              key={p.spanish}
              onClick={() => onCopy(p.spanish)}
              className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-left ring-1 ring-slate-200 transition active:scale-[0.98] dark:bg-slate-700/50 dark:ring-slate-600"
            >
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{p.spanish}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{p.english}</p>
              </div>
              <span className="shrink-0 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white dark:bg-slate-100 dark:text-slate-900">
                Copy
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
