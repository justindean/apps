import type { SubContext } from '../data/phrases'
import { colorMap } from '../utils/colors'

interface SubContextBarProps {
  subContexts: SubContext[]
  activeKey: string
  color: string
  onSelect: (key: string) => void
}

export function SubContextBar({ subContexts, activeKey, color, onSelect }: SubContextBarProps) {
  const colors = colorMap[color] ?? colorMap.slate

  return (
    <nav
      className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
      role="tablist"
      aria-label="Sub-context topics"
    >
      {subContexts.map((sub) => {
        const isActive = sub.key === activeKey
        return (
          <button
            key={sub.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(sub.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ring-1 transition active:scale-[0.97] ${
              isActive ? colors.badgeActive : colors.badge
            }`}
          >
            {sub.name}
          </button>
        )
      })}
    </nav>
  )
}
