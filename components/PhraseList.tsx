import type { Phrase } from "@/data/phrases";
import { PhraseCard } from "./PhraseCard";
import { colorMap } from "@/utils/colors";

interface PhraseListProps {
  phrases: Phrase[];
  color: string;
  onCopy: (text: string) => void;
}

export function PhraseList({ phrases, color, onCopy }: PhraseListProps) {
  const colors = colorMap[color] ?? colorMap.slate;

  if (phrases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-slate-400 dark:text-slate-500">
          No phrases for this combination yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className={`mb-3 text-xs font-medium ${colors.muted}`}>
        {phrases.length} phrase{phrases.length !== 1 ? "s" : ""}
      </p>
      <section className="flex flex-col gap-3 pb-8" role="list" aria-label="Phrases">
        {phrases.map((phrase) => (
          <PhraseCard
            key={phrase.spanish}
            phrase={phrase}
            color={color}
            onCopy={onCopy}
          />
        ))}
      </section>
    </>
  );
}
