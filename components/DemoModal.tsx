"use client";

import { useState, useEffect, useRef } from "react";

interface DemoModalProps {
  open: boolean;
  onClose: () => void;
}

// Demo content
const SPANISH_TEXT = "Buenas tardes, qué van a pedir? Tenemos un especial hoy, pasta con camarones o pollo asado. Les puedo traer algo de beber?";
const ENGLISH_TEXT = "Good afternoon, what will you have? We have a special today, pasta with shrimp or roasted chicken. Can I bring you something to drink?";
const RESPONSE_SPANISH = "Quiero una cerveza y la pasta con camarones.";
const RESPONSE_ENGLISH = "I want a beer and the pasta with shrimp.";
const CHAR_DELAY = 45;

export function DemoModal({ open, onClose }: DemoModalProps) {
  const [phase, setPhase] = useState<"start" | "listening" | "response" | "done">("start");
  const [transcribedText, setTranscribedText] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(12).fill(0.15));

  const transcriptionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper to speak Spanish text - called directly from click handlers for iOS compatibility
  const speakSpanish = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    utterance.rate = 0.85;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    let hasEnded = false;
    const finish = () => {
      if (!hasEnded) {
        hasEnded = true;
        onEnd?.();
      }
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    window.speechSynthesis.speak(utterance);

    // Fallback timeout
    setTimeout(finish, text.length * 80 + 2000);
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setPhase("start");
      setTranscribedText("");
      setShowTranslation(false);
      setIsPlayingResponse(false);
      setWaveformBars(Array(12).fill(0.15));
    } else {
      // Cleanup when closing
      if (transcriptionIntervalRef.current) {
        clearInterval(transcriptionIntervalRef.current);
        transcriptionIntervalRef.current = null;
      }
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
        waveformIntervalRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transcriptionIntervalRef.current) clearInterval(transcriptionIntervalRef.current);
      if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  // Start demo - called directly from button click for iOS audio compatibility
  const startDemo = () => {
    setPhase("listening");
    setWaveformBars(Array(12).fill(0).map(() => Math.random() * 0.3 + 0.1));

    // Play Spanish audio DIRECTLY from click handler (required for iOS)
    speakSpanish(SPANISH_TEXT);

    let charIndex = 0;

    // Animate waveform
    waveformIntervalRef.current = setInterval(() => {
      setWaveformBars(Array(12).fill(0).map(() => Math.random() * 0.8 + 0.2));
    }, 100);

    // Animate transcription
    transcriptionIntervalRef.current = setInterval(() => {
      if (charIndex < SPANISH_TEXT.length) {
        setTranscribedText(SPANISH_TEXT.slice(0, charIndex + 1));
        charIndex++;
      } else {
        if (transcriptionIntervalRef.current) clearInterval(transcriptionIntervalRef.current);
        if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
        setWaveformBars(Array(12).fill(0.1));

        setTimeout(() => {
          setShowTranslation(true);
          setTimeout(() => setPhase("response"), 800);
        }, 400);
      }
    }, CHAR_DELAY);
  };

  // Play response - called directly from button click for iOS audio compatibility
  const playResponse = () => {
    setIsPlayingResponse(true);

    waveformIntervalRef.current = setInterval(() => {
      setWaveformBars(Array(12).fill(0).map(() => Math.random() * 0.7 + 0.3));
    }, 100);

    // Play Spanish response DIRECTLY from click handler (required for iOS)
    speakSpanish(RESPONSE_SPANISH, () => {
      setIsPlayingResponse(false);
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
        waveformIntervalRef.current = null;
      }
      setWaveformBars(Array(12).fill(0.1));
      setPhase("done");
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-black/8 px-5 py-4">
        <h1 className="text-[18px] font-bold text-[#111]">Demo</h1>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 text-black/60">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {/* Start screen */}
        {phase === "start" && (
          <div className="flex flex-col items-center justify-center pt-16">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#B5332A]/10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-10 w-10 text-[#B5332A]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
            </div>
            <p className="mt-6 text-center text-[18px] font-bold text-[#111]">Experience TapHabla</p>
            <p className="mt-2 max-w-[260px] text-center text-[14px] text-black/50">{"Hear a waiter's question in Spanish and see how to respond."}</p>
            <button onClick={startDemo} className="mt-8 flex items-center gap-2 rounded-[10px] bg-[#B5332A] px-8 py-4 text-[15px] font-bold text-white transition-all active:scale-[0.97]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
              Start Demo
            </button>
          </div>
        )}

        {/* Waveform - show during listening/response */}
        {phase !== "start" && (
          <div className="flex h-16 items-center justify-center gap-1">
            {waveformBars.map((height, i) => (
              <div key={i} className="w-1 rounded-full bg-[#B5332A] transition-all duration-100" style={{ height: `${height * 48}px` }} />
            ))}
          </div>
        )}

        {/* They Said card */}
        {phase !== "start" && (
          <div className="mt-4 rounded-[12px] border border-black/8 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-black/40">They Said</p>
            <p className="mt-2 text-[20px] font-bold leading-[1.3] text-[#111]">{transcribedText || "..."}<span className="animate-pulse">|</span></p>
            {showTranslation && <p className="mt-3 text-[15px] leading-[1.5] text-black/50">{ENGLISH_TEXT}</p>}
          </div>
        )}

        {/* Response card */}
        {(phase === "response" || phase === "done") && (
          <div className="mt-4 rounded-[12px] border-2 border-[#B5332A]/20 bg-[#B5332A]/[0.03] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#B5332A]">Say This</p>
            <p className="mt-2 text-[20px] font-bold leading-[1.3] text-[#111]">{RESPONSE_SPANISH}</p>
            <p className="mt-2 text-[14px] leading-[1.5] text-black/50">{RESPONSE_ENGLISH}</p>
            <button
              onClick={playResponse}
              disabled={isPlayingResponse}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] py-3.5 text-[14px] font-bold transition-all ${
                isPlayingResponse ? "bg-[#B5332A]/60 text-white" : "bg-[#B5332A] text-white active:scale-[0.98]"
              }`}
            >
              {isPlayingResponse ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                  </svg>
                  Playing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                  </svg>
                  Tap to Play Response
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-black/8 bg-white p-5">
        <button className="w-full rounded-[10px] bg-[#111] py-4 text-[15px] font-bold text-white transition-all active:scale-[0.98]">
          Unlock Trip Pass – $19 • 7 Days
        </button>
      </div>
    </div>
  );
}
