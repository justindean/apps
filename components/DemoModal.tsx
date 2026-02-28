"use client";

import { useState, useRef, useEffect } from "react";

interface DemoModalProps {
  open: boolean;
  onClose: () => void;
}

// Demo content
const SPANISH_TEXT = "Buenas tardes, ¿qué van a tomar? Tenemos especial hoy, pasta con camarones o pollo asado. ¿Les traigo algo de beber?";
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

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setPhase("start");
      setTranscribedText("");
      setShowTranslation(false);
      setIsPlayingResponse(false);
      setWaveformBars(Array(12).fill(0.15));
    } else {
      if (transcriptionIntervalRef.current) clearInterval(transcriptionIntervalRef.current);
      if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transcriptionIntervalRef.current) clearInterval(transcriptionIntervalRef.current);
      if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Speak Spanish text - call directly from click handler for iOS
  const speakSpanish = (text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    utterance.rate = 0.9;
    utterance.volume = 1;
    
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) utterance.voice = spanishVoice;
    
    let ended = false;
    const finish = () => {
      if (!ended) {
        ended = true;
        onEnd?.();
      }
    };
    
    utterance.onend = finish;
    utterance.onerror = finish;
    
    window.speechSynthesis.speak(utterance);
    
    // Fallback timeout
    setTimeout(finish, text.length * 70 + 3000);
  };

  // Start demo
  const startDemo = () => {
    setPhase("listening");
    
    // Speak IMMEDIATELY from click handler (iOS requirement)
    speakSpanish(SPANISH_TEXT);
    
    // Animate waveform
    waveformIntervalRef.current = setInterval(() => {
      setWaveformBars(Array(12).fill(0).map(() => Math.random() * 0.8 + 0.2));
    }, 100);
    
    // Animate transcription
    let charIndex = 0;
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
          setTimeout(() => setPhase("response"), 600);
        }, 300);
      }
    }, CHAR_DELAY);
  };

  // Play response
  const playResponse = () => {
    setIsPlayingResponse(true);
    
    waveformIntervalRef.current = setInterval(() => {
      setWaveformBars(Array(12).fill(0).map(() => Math.random() * 0.7 + 0.3));
    }, 100);
    
    // Speak IMMEDIATELY from click handler (iOS requirement)
    speakSpanish(RESPONSE_SPANISH, () => {
      setIsPlayingResponse(false);
      if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
      setWaveformBars(Array(12).fill(0.1));
      setPhase("done");
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F5F5F4]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-black/8">
        <h1 className="text-[17px] font-bold text-[#111]">Demo</h1>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 hover:bg-black/10"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 text-black/60">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {/* Start screen */}
        {phase === "start" && (
          <div className="flex flex-col items-center justify-center pt-20">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#B5332A]/10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-9 w-9 text-[#B5332A]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
            </div>
            <p className="mt-5 text-[17px] font-bold text-[#111]">Experience TapHabla</p>
            <p className="mt-2 text-center text-[14px] text-black/50 max-w-[260px]">
              Hear a waiter in Spanish and see how to respond.
            </p>
            <button
              onClick={startDemo}
              className="mt-6 flex items-center gap-2 rounded-[10px] bg-[#B5332A] px-7 py-3.5 text-[15px] font-bold text-white active:scale-[0.97]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
              Start Demo
            </button>
          </div>
        )}

        {/* Listening/Response/Done */}
        {phase !== "start" && (
          <>
            {/* Waveform */}
            <div className="flex h-14 items-center justify-center gap-1 mt-4">
              {waveformBars.map((height, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-[#B5332A] transition-all duration-100"
                  style={{ height: `${height * 40}px` }}
                />
              ))}
            </div>

            {/* They Said */}
            <div className="mt-4 rounded-[12px] border border-black/8 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-black/35">They Said</p>
              <p className="mt-2 text-[18px] font-bold leading-[1.35] text-[#111]">
                {transcribedText || "..."}
              </p>
              {showTranslation && (
                <p className="mt-3 text-[15px] leading-[1.5] text-black/50">{ENGLISH_TEXT}</p>
              )}
            </div>

            {/* Response */}
            {(phase === "response" || phase === "done") && (
              <div className="mt-4 rounded-[12px] border-2 border-[#B5332A]/20 bg-[#B5332A]/[0.03] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#B5332A]">Say This</p>
                <p className="mt-2 text-[18px] font-bold leading-[1.35] text-[#111]">{RESPONSE_SPANISH}</p>
                <p className="mt-2 text-[14px] text-black/50">{RESPONSE_ENGLISH}</p>
                
                <button
                  onClick={playResponse}
                  disabled={isPlayingResponse}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] py-3.5 text-[15px] font-bold ${
                    isPlayingResponse ? "bg-[#B5332A]/60 text-white" : "bg-[#B5332A] text-white active:scale-[0.98]"
                  }`}
                >
                  {isPlayingResponse ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                      </svg>
                      Playing...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                      </svg>
                      Tap to Play Response
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-black/8 bg-[#F5F5F4] px-5 py-4">
        <button className="w-full rounded-[10px] bg-[#111] py-4 text-[15px] font-bold text-white active:scale-[0.98]">
          Unlock Trip Pass – $19 • 7 Days
        </button>
      </div>
    </div>
  );
}
