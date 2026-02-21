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
    <div className="flex items-center gap-px rounded-md bg-black/[0.04] p-px">
      {modes.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          title={labels[m].short}
          className={`rounded-[5px] px-2 py-0.5 text-[10px] font-bold transition-all duration-100 ${
            current === m
              ? "bg-white text-black shadow-sm"
              : "text-black/30 hover:text-black/50"
          }`}
        >
          {labels[m].label}
        </button>
      ))}
    </div>
  );
}
