import type { SpeechMode } from "@/data/phrases";

const labels: Record<SpeechMode, { label: string; short: string }> = {
  street: { label: "Local", short: "Casual everyday Spanish" },
  neutral: { label: "Standard", short: "Standard polite Spanish" },
  formal: { label: "Polite", short: "Business / respectful" },
};

const modes: SpeechMode[] = ["street", "neutral", "formal"];

interface Props {
  current: SpeechMode;
  onChange: (m: SpeechMode) => void;
}

export default function SpeechModeToggle({ current, onChange }: Props) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-stone-100 p-0.5 dark:bg-stone-800/50">
      {modes.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          title={labels[m].short}
          className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all duration-150 ${
            current === m
              ? "bg-white text-stone-800 shadow-sm dark:bg-stone-700 dark:text-stone-100"
              : "text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
          }`}
        >
          {labels[m].label}
        </button>
      ))}
    </div>
  );
}
