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
    <div className="flex items-center gap-px rounded-md bg-stone-100/80 p-px dark:bg-stone-800/40">
      {modes.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          title={labels[m].short}
          className={`rounded-[5px] px-2 py-0.5 text-[10px] font-bold transition-all duration-150 ${
            current === m
              ? "bg-white text-stone-700 shadow-sm dark:bg-stone-700 dark:text-stone-100"
              : "text-stone-400 hover:text-stone-500 dark:text-stone-500 dark:hover:text-stone-300"
          }`}
        >
          {labels[m].label}
        </button>
      ))}
    </div>
  );
}
