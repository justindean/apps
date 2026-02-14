import type { SpeechMode } from "../data/phrases";

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
    <div className="flex items-center gap-1 rounded-lg bg-slate-200/80 p-1 dark:bg-slate-800/80">
      {modes.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          title={labels[m].short}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
            current === m
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          {labels[m].label}
        </button>
      ))}
    </div>
  );
}
