import { colorMap } from "@/utils/colors";

interface SubContextItem {
  key: string;
  name: string;
}

interface SubContextBarProps {
  items: SubContextItem[];
  activeKey: string;
  color: string;
  onSelect: (key: string) => void;
}

export function SubContextBar({ items, activeKey, color, onSelect }: SubContextBarProps) {
  const colors = colorMap[color] ?? colorMap.slate;

  return (
    <nav
      className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide"
      role="tablist"
      aria-label="Intent topics"
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(item.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ring-1 transition active:scale-[0.97] ${
              isActive ? colors.badgeActive : colors.badge
            }`}
          >
            {item.name}
          </button>
        );
      })}
    </nav>
  );
}
