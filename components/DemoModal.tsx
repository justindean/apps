"use client";

import { useState, useRef, useEffect } from "react";

interface DemoModalProps {
  open: boolean;
  onClose: () => void;
}

// Demo content (hardcoded)
const DEMO = {
  spanish: "Buenas tardes, qué van a tomar? Tenemos un especial hoy, pasta con camarones o pollo asado. Puedo traerle algo de beber?",
  english: "Good afternoon, what will you have? We have a special today, pasta with shrimp or roasted chicken. Can I bring you something to drink?",
  replySpanish: "Quiero una cerveza y la pasta con camarones.",
  replyEnglish: "I want a beer and the pasta with shrimp.",
};

/* ── Icons (same as ListenPanel) ── */
function MicIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function WaveformIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12h2" /><path d="M6 8v8" /><path d="M10 4v16" /><path d="M14 6v12" /><path d="M18 8v8" /><path d="M22 12h2" />
    </svg>
  );
}

export function DemoModal({ open, onClose }: DemoModalProps) {
  // Phase: "start" -> "listening" -> "heard" -> "response" -> "done"
  const [phase, setPhase] = useState<"start" | "listening" | "heard" | "response" | "done">("start");
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setPhase("start");
      setIsPlaying(false);
    }
  }, [open]);

  // Cleanup audio on close
  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    onClose();
  };

  // PLAY LISTEN - directly in click handler for iOS
  const handlePlayListen = () => {
    const audio = new Audio("/demo/listen-es.mp3");
    audioRef.current = audio;
    setPhase("listening");
    setIsPlaying(true);

    audio.onended = () => {
      setIsPlaying(false);
      setPhase("heard");
    };
    audio.onerror = () => {
      setIsPlaying(false);
      setPhase("heard");
    };
    audio.play().catch(() => {
      setIsPlaying(false);
      setPhase("heard");
    });
  };

  // PLAY RESPONSE - directly in click handler for iOS
  const handlePlayResponse = () => {
    const audio = new Audio("/demo/reply-es.mp3");
    audioRef.current = audio;
    setPhase("response");
    setIsPlaying(true);

    audio.onended = () => {
      setIsPlaying(false);
      setPhase("done");
    };
    audio.onerror = () => {
      setIsPlaying(false);
      setPhase("done");
    };
    audio.play().catch(() => {
      setIsPlaying(false);
      setPhase("done");
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/8 px-5 py-4">
        <h1 className="text-[15px] font-bold text-[#111]">Demo</h1>
        <button
          onClick={handleClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-black/40 transition-colors hover:bg-black/10"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        
        {/* ══════════════════════════════════════════════════════════════
           START PHASE - Tap to hear what they said
           ══════════════════════════════════════════════════════════════ */}
        {phase === "start" && (
          <div className="flex flex-col items-center gap-5 pt-8">
            {/* Mic icon in soft circle */}
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#B5332A]/8">
              <MicIcon size={40} />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[18px] font-extrabold text-black">Try the demo</p>
              <p className="text-center text-[14px] font-medium leading-snug text-black/40 max-w-[260px]">
                {"Hear a waiter's question in Spanish and see how to respond."}
              </p>
            </div>
            <button
              onClick={handlePlayListen}
              className="mt-4 flex w-full max-w-[280px] items-center justify-center gap-2.5 rounded-[8px] bg-[#B5332A] py-4 text-white shadow-md shadow-[#B5332A]/20 transition-all duration-75 active:scale-[0.97] active:shadow-sm"
            >
              <WaveformIcon size={16} />
              <span className="text-[15px] font-extrabold">Tap to hear what they said</span>
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
           LISTENING PHASE - Playing audio with waveform
           ══════════════════════════════════════════════════════════════ */}
        {phase === "listening" && (
          <div className="flex flex-col items-center gap-4 pt-4">
            {/* Large pulsing mic */}
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[#B5332A] text-white shadow-[0_10px_50px_-10px_rgba(181,51,42,0.5)]">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#B5332A]/12" />
              <span className="absolute inset-[-10px] animate-pulse rounded-full border-2 border-[#B5332A]/12" />
              <MicIcon size={36} />
            </div>

            {/* Waveform visualization */}
            <div className="flex items-center justify-center gap-[3px] h-6">
              {[1,2,3,4,5].map((i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-full bg-[#B5332A]/50"
                  style={{
                    animation: `wave-bar-${i} ${0.6 + i * 0.12}s ease-in-out infinite`,
                    height: '12px',
                  }}
                />
              ))}
            </div>

            <div className="flex flex-col items-center gap-0.5">
              <p className="text-[14px] font-extrabold text-black">Listening</p>
              <p className="text-[12px] font-medium text-black/25">Demo playing...</p>
            </div>

            {/* Live transcript card */}
            <div className="w-full rounded-[8px] border border-black/8 bg-white p-4 animate-fade-in">
              <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-black/25">Hearing</p>
              <p className="text-[18px] font-extrabold leading-snug text-black opacity-50">
                {DEMO.spanish}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-black/18">Working.</p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
           HEARD PHASE - Show transcript + meaning, offer response
           ══════════════════════════════════════════════════════════════ */}
        {(phase === "heard" || phase === "response" || phase === "done") && (
          <div className="flex flex-col gap-4">
            {/* Idle mic button */}
            <div className="flex flex-col items-center gap-2 mb-2">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#B5332A] text-white shadow-[0_8px_30px_-6px_rgba(181,51,42,0.45)]">
                <MicIcon size={28} />
              </div>
              <p className="text-center text-[13px] font-semibold leading-snug text-black/30">
                {phase === "done" ? "Demo complete" : "Try again."}
              </p>
            </div>

            {/* CARD 1: THEY SAID */}
            <div className="rounded-[8px] border border-black/8 bg-white p-5 animate-result-1">
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-black/30">They said</p>
              <p className="text-[22px] font-extrabold leading-[1.2] text-black">{DEMO.spanish}</p>
              <p className="mt-2 text-[15px] font-medium leading-snug text-black/50">{DEMO.english}</p>
            </div>

            {/* CARD 2: MEANING */}
            <div className="rounded-[8px] border border-black/8 bg-white p-5 animate-result-2">
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-black/30">Meaning</p>
              <p className="text-[20px] font-extrabold leading-[1.2] text-black">
                Greeting + menu offer + drink question
              </p>
            </div>

            {/* BEST REPLY */}
            <div className="mt-2 animate-result-3">
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-black/25">
                {"Here's what to say"}
              </p>

              <div className="rounded-[8px] border-2 border-[#B5332A]/12 bg-white p-5">
                <p className="text-[24px] font-extrabold leading-[1.15] text-black">{DEMO.replySpanish}</p>
                <p className="mt-2 text-[14px] font-medium leading-snug text-black/45">{DEMO.replyEnglish}</p>

                {/* Play response button */}
                {phase === "heard" && (
                  <button
                    onClick={handlePlayResponse}
                    className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-[8px] bg-[#B5332A] py-3.5 text-white shadow-md shadow-[#B5332A]/20 transition-all duration-75 active:scale-[0.97] active:shadow-sm"
                  >
                    <WaveformIcon size={16} />
                    <span className="text-[15px] font-extrabold">Tap to hear what you should say</span>
                  </button>
                )}

                {/* Playing state */}
                {phase === "response" && (
                  <div className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-[8px] bg-[#B5332A]/80 py-3.5 text-white">
                    <div className="flex items-center gap-[3px]">
                      {[1,2,3].map((i) => (
                        <div
                          key={i}
                          className="w-[3px] h-3 rounded-full bg-white/80"
                          style={{ animation: `wave-bar-${i} ${0.4 + i * 0.1}s ease-in-out infinite` }}
                        />
                      ))}
                    </div>
                    <span className="text-[15px] font-extrabold">Playing...</span>
                  </div>
                )}

                {/* Done state */}
                {phase === "done" && (
                  <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-[8px] bg-emerald-500/10 py-3.5 text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[15px] font-extrabold">{"You're ready!"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-black/8 px-5 py-4">
        <button
          onClick={handleClose}
          className="flex w-full items-center justify-center rounded-[10px] bg-[#111] py-4 text-[15px] font-bold text-white transition-all active:scale-[0.98]"
        >
          {phase === "done" ? "Try the real app" : "Close demo"}
        </button>
      </div>

      {/* Wave animation keyframes */}
      <style jsx>{`
        @keyframes wave-bar-1 { 0%, 100% { height: 8px; } 50% { height: 20px; } }
        @keyframes wave-bar-2 { 0%, 100% { height: 12px; } 50% { height: 24px; } }
        @keyframes wave-bar-3 { 0%, 100% { height: 16px; } 50% { height: 28px; } }
        @keyframes wave-bar-4 { 0%, 100% { height: 12px; } 50% { height: 22px; } }
        @keyframes wave-bar-5 { 0%, 100% { height: 8px; } 50% { height: 18px; } }
      `}</style>
    </div>
  );
}
