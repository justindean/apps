import { useCallback, useMemo, useState } from 'react'
import { categories, type CategoryKey } from './data/phrases'
import { CategoryGrid } from './components/CategoryGrid'
import { PhraseList } from './components/PhraseList'

type ToastState = {
  visible: boolean
  text: string
}

function App() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null)
  const [toast, setToast] = useState<ToastState>({ visible: false, text: '' })

  const activeCategory = useMemo(
    () => categories.find((c) => c.key === selectedCategory) ?? null,
    [selectedCategory]
  )

  const copyPhrase = useCallback(async (phrase: string) => {
    try {
      await navigator.clipboard.writeText(phrase)
      setToast({ visible: true, text: 'Copied!' })
    } catch {
      setToast({ visible: true, text: 'Copy failed' })
    }
    window.setTimeout(() => {
      setToast({ visible: false, text: '' })
    }, 1200)
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-925 dark:text-slate-100">
      <div className="mx-auto max-w-md">
        {activeCategory ? (
          <PhraseList
            category={activeCategory}
            onBack={() => setSelectedCategory(null)}
            onCopy={copyPhrase}
          />
        ) : (
          <>
            <header>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                TapHabla
              </h1>
              <p className="mt-2 text-base leading-relaxed text-slate-500 dark:text-slate-400">
                Tap a situation. Get the right Spanish phrases — fast.
              </p>
            </header>

            <CategoryGrid
              categories={categories}
              onSelect={setSelectedCategory}
            />

            <footer className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600">
              {categories.length} categories &middot; {categories.reduce((a, c) => a + c.subContexts.reduce((b, s) => b + s.phrases.length, 0), 0)} phrases
            </footer>
          </>
        )}
      </div>

      {/* Toast notification */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 dark:bg-slate-100 dark:text-slate-900 ${
          toast.visible
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0'
        }`}
      >
        {toast.text}
      </div>
    </main>
  )
}

export default App
