import type { SpeechMode } from "@/data/phrases";

const labels: Record<SpeechMode, { label: string; short: string }> = {
  street: { label: "Street", short: "Casual everyday Spanish" },
  neutral: { label: "Neutral", short: "Standard polite Spanish" },
  formal: { label: "Formal", short: "Business / respectful" },
};

const modes: SpeechMode[] = ["street", "neutral", "formal"];

interface Props {
  current: SpeechMode;
  onChange: (m: SpeechMode) => void;
}

export default function SpeechModeToggle({ current, onChange }: Props) {
  return (
    <div className="flex items-center gap-0.5 rounded-xl bg-stone-200/50 p-1 backdrop-blur-sm dark:bg-stone-800/50">
      {modes.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          title={labels[m].short}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 ease-out ${
            current === m
              ? "bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-stone-100"
              : "text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
          }`}
        >
          {labels[m].label}
        </button>
      ))}
    </div>
  );
}
