export const colorMap: Record<string, {
  card: string
  ring: string
  muted: string
  badge: string
  badgeActive: string
  accent: string
}> = {
  amber: {
    card: 'bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100',
    ring: 'ring-amber-200 dark:ring-amber-800/50',
    muted: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-700/50',
    badgeActive: 'bg-amber-600 text-white ring-amber-700 dark:bg-amber-500 dark:text-amber-950 dark:ring-amber-400',
    accent: 'bg-amber-600 text-white dark:bg-amber-500 dark:text-amber-950',
  },
  rose: {
    card: 'bg-rose-50 text-rose-950 dark:bg-rose-950/40 dark:text-rose-100',
    ring: 'ring-rose-200 dark:ring-rose-800/50',
    muted: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:ring-rose-700/50',
    badgeActive: 'bg-rose-600 text-white ring-rose-700 dark:bg-rose-500 dark:text-rose-950 dark:ring-rose-400',
    accent: 'bg-rose-600 text-white dark:bg-rose-500 dark:text-rose-950',
  },
  sky: {
    card: 'bg-sky-50 text-sky-950 dark:bg-sky-950/40 dark:text-sky-100',
    ring: 'ring-sky-200 dark:ring-sky-800/50',
    muted: 'text-sky-600 dark:text-sky-400',
    badge: 'bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:ring-sky-700/50',
    badgeActive: 'bg-sky-600 text-white ring-sky-700 dark:bg-sky-500 dark:text-sky-950 dark:ring-sky-400',
    accent: 'bg-sky-600 text-white dark:bg-sky-500 dark:text-sky-950',
  },
  orange: {
    card: 'bg-orange-50 text-orange-950 dark:bg-orange-950/40 dark:text-orange-100',
    ring: 'ring-orange-200 dark:ring-orange-800/50',
    muted: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:ring-orange-700/50',
    badgeActive: 'bg-orange-600 text-white ring-orange-700 dark:bg-orange-500 dark:text-orange-950 dark:ring-orange-400',
    accent: 'bg-orange-600 text-white dark:bg-orange-500 dark:text-orange-950',
  },
  emerald: {
    card: 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100',
    ring: 'ring-emerald-200 dark:ring-emerald-800/50',
    muted: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-700/50',
    badgeActive: 'bg-emerald-600 text-white ring-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 dark:ring-emerald-400',
    accent: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950',
  },
  indigo: {
    card: 'bg-indigo-50 text-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-100',
    ring: 'ring-indigo-200 dark:ring-indigo-800/50',
    muted: 'text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-100 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:ring-indigo-700/50',
    badgeActive: 'bg-indigo-600 text-white ring-indigo-700 dark:bg-indigo-500 dark:text-indigo-950 dark:ring-indigo-400',
    accent: 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-indigo-950',
  },
  red: {
    card: 'bg-red-50 text-red-950 dark:bg-red-950/40 dark:text-red-100',
    ring: 'ring-red-200 dark:ring-red-800/50',
    muted: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 ring-red-200 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-700/50',
    badgeActive: 'bg-red-600 text-white ring-red-700 dark:bg-red-500 dark:text-red-950 dark:ring-red-400',
    accent: 'bg-red-600 text-white dark:bg-red-500 dark:text-red-950',
  },
  teal: {
    card: 'bg-teal-50 text-teal-950 dark:bg-teal-950/40 dark:text-teal-100',
    ring: 'ring-teal-200 dark:ring-teal-800/50',
    muted: 'text-teal-600 dark:text-teal-400',
    badge: 'bg-teal-100 text-teal-700 ring-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:ring-teal-700/50',
    badgeActive: 'bg-teal-600 text-white ring-teal-700 dark:bg-teal-500 dark:text-teal-950 dark:ring-teal-400',
    accent: 'bg-teal-600 text-white dark:bg-teal-500 dark:text-teal-950',
  },
  violet: {
    card: 'bg-violet-50 text-violet-950 dark:bg-violet-950/40 dark:text-violet-100',
    ring: 'ring-violet-200 dark:ring-violet-800/50',
    muted: 'text-violet-600 dark:text-violet-400',
    badge: 'bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:ring-violet-700/50',
    badgeActive: 'bg-violet-600 text-white ring-violet-700 dark:bg-violet-500 dark:text-violet-950 dark:ring-violet-400',
    accent: 'bg-violet-600 text-white dark:bg-violet-500 dark:text-violet-950',
  },
  lime: {
    card: 'bg-lime-50 text-lime-950 dark:bg-lime-950/40 dark:text-lime-100',
    ring: 'ring-lime-200 dark:ring-lime-800/50',
    muted: 'text-lime-600 dark:text-lime-400',
    badge: 'bg-lime-100 text-lime-700 ring-lime-200 dark:bg-lime-900/40 dark:text-lime-300 dark:ring-lime-700/50',
    badgeActive: 'bg-lime-600 text-white ring-lime-700 dark:bg-lime-500 dark:text-lime-950 dark:ring-lime-400',
    accent: 'bg-lime-600 text-white dark:bg-lime-500 dark:text-lime-950',
  },
  stone: {
    card: 'bg-stone-50 text-stone-950 dark:bg-stone-800 dark:text-stone-100',
    ring: 'ring-stone-200 dark:ring-stone-700',
    muted: 'text-stone-500 dark:text-stone-400',
    badge: 'bg-stone-100 text-stone-700 ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-600',
    badgeActive: 'bg-[#D94F2A] text-white ring-[#D94F2A] dark:bg-[#E8734F] dark:text-white dark:ring-[#E8734F]',
    accent: 'bg-[#D94F2A] text-white dark:bg-[#E8734F] dark:text-white',
  },
  slate: {
    card: 'bg-slate-50 text-slate-950 dark:bg-slate-800 dark:text-slate-100',
    ring: 'ring-slate-200 dark:ring-slate-700',
    muted: 'text-slate-500 dark:text-slate-400',
    badge: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600',
    badgeActive: 'bg-slate-900 text-white ring-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:ring-slate-300',
    accent: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
  },
}
