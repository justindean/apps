import { colorMap } from "../utils/colors";

interface CategoryItem {
  key: string;
  name: string;
  emoji: string;
  color: string;
}

interface CategoryGridProps {
  categories: CategoryItem[];
  onSelect: (key: string) => void;
}

export function CategoryGrid({ categories, onSelect }: CategoryGridProps) {
  return (
    <section className="mt-2 grid grid-cols-2 gap-3">
      {categories.map((cat) => {
        const colors = colorMap[cat.color] ?? colorMap.slate;
        return (
          <button
            key={cat.key}
            onClick={() => onSelect(cat.key)}
            className={`flex h-24 flex-col items-center justify-center rounded-2xl px-2 text-center font-semibold shadow-sm ring-1 transition active:scale-[0.97] ${colors.card} ${colors.ring}`}
          >
            <span className="mb-1 text-2xl" aria-hidden>
              {cat.emoji}
            </span>
            <span className="text-base leading-tight">{cat.name}</span>
          </button>
        );
      })}
    </section>
  );
}
