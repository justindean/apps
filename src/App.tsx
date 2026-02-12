import { useMemo, useState } from 'react'
import { phraseContexts, type ContextKey } from './data/phrases'

type ToastState = {
  visible: boolean
  text: string
}

function App() {
  const [selectedContext, setSelectedContext] = useState<ContextKey | null>(null)
  const [toast, setToast] = useState<ToastState>({ visible: false, text: '' })

  const activeContext = useMemo(
    () => phraseContexts.find((context) => context.key === selectedContext) ?? null,
    [selectedContext]
  )

  const copyPhrase = async (phrase: string) => {
    try {
      await navigator.clipboard.writeText(phrase)
      setToast({ visible: true, text: 'Copied' })
    } catch {
      setToast({ visible: true, text: 'Copy failed' })
    }

    window.setTimeout(() => {
      setToast({ visible: false, text: '' })
    }, 1200)
  }

  if (!activeContext) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <div className="mx-auto max-w-md">
          <h1 className="text-4xl font-bold tracking-tight">TapHabla</h1>
          <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
            Tap a situation. Get the right phrases fast.
          </p>

          <section className="mt-6 grid grid-cols-2 gap-3">
            {phraseContexts.map((context) => (
              <button
                key={context.key}
                onClick={() => setSelectedContext(context.key)}
                className="flex h-24 flex-col items-center justify-center rounded-2xl bg-white px-2 text-center text-lg font-semibold shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-[0.99] dark:bg-slate-800 dark:ring-slate-700"
              >
                <span className="mb-1 text-2xl" aria-hidden>
                  {context.emoji}
                </span>
                {context.name}
              </button>
            ))}
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-md">
        <button
          onClick={() => setSelectedContext(null)}
          className="mb-4 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
        >
          ← Back
        </button>

        <h2 className="text-3xl font-bold tracking-tight">{activeContext.emoji} {activeContext.name}</h2>

        <section className="mt-4 space-y-3 pb-8">
          {activeContext.phrases.map((phrase) => (
            <article
              key={phrase.spanish}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
            >
              <p className="text-xl font-semibold leading-tight">{phrase.spanish}</p>
              {phrase.hint ? (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{phrase.hint}</p>
              ) : null}
              <button
                onClick={() => copyPhrase(phrase.spanish)}
                className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
              >
                Copy
              </button>
            </article>
          ))}
        </section>
      </div>

      {toast.visible ? (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900">
          {toast.text}
        </div>
      ) : null}
    </main>
  )
}

export default App
