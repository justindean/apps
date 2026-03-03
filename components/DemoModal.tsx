"use client";

import { useState, useEffect, useRef } from "react";

interface DemoModalProps {
  open: boolean;
  onClose: () => void;
}

// Demo content
const SPANISH_TEXT = "Buenas tardes, ¿qué van a tomar? Tenemos especial hoy, pasta con camarones o pollo asado. ¿Les traigo algo de beber?";
const ENGLISH_TEXT = "Good afternoon, what will you have? We have a special today, pasta with shrimp or roasted chicken. Can I bring you something to drink?";
const RESPONSE_SPANISH = "Quiero una cerveza y la pasta con camarones, por favor.";
const RESPONSE_ENGLISH = "I want a beer and the pasta with shrimp, please.";

const CHAR_DELAY = 45; // ms per character

export function DemoModal({ open, onClose }: DemoModalProps) {
  const [phase, setPhase] = useState<"start" | "listening" | "response" | "done">("start");
  const [transcribedText, setTranscribedText] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [isPlayingListen, setIsPlayingListen] = useState(false);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(12).fill(0.15));
  
  const transcriptionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset when modal opens/closes
  useEffect(() => {
    if (open) {
      setPhase("start");
      setTranscribedText("");
      setShowTranslation(false);
      setIsPlayingListen(false);
      setIsPlayingResponse(false);
      setWaveformBars(Array(12).fill(0.15));
    } else {
      // Cleanup on close
      if (transcriptionIntervalRef.current) clearInterval(transcriptionIntervalRef.current);
      if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transcriptionIntervalRef.current) clearInterval(transcriptionIntervalRef.current);
      if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Waveform animation
  const startWaveform = () => {
    waveformIntervalRef.current = setInterval(() => {
      setWaveformBars(Array(12).fill(0).map(() => Math.random() * 0.8 + 0.2));
    }, 100);
  };

  const stopWaveform = () => {
    if (waveformIntervalRef.current) {
      clearInterval(waveformIntervalRef.current);
      waveformIntervalRef.current = null;
    }
    setWaveformBars(Array(12).fill(0.1));
  };

  // Typing animation
  const startTyping = () => {
    let charIndex = 0;
    transcriptionIntervalRef.current = setInterval(() => {
      if (charIndex < SPANISH_TEXT.length) {
        setTranscribedText(SPANISH_TEXT.slice(0, charIndex + 1));
        charIndex++;
      } else {
        if (transcriptionIntervalRef.current) {
          clearInterval(transcriptionIntervalRef.current);
          transcriptionIntervalRef.current = null;
        }
      }
    }, CHAR_DELAY);
  };

  // Fetch TTS from API
  const fetchTTS = async (text: string, voice: "mila" | "daniel"): Promise<string | null> => {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice }),
      });
      if (!response.ok) return null;
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  };

  // Start demo - called from button click
  const startDemo = async () => {
    setPhase("listening");
    setIsPlayingListen(true);
    startWaveform();
    startTyping();

    // Fetch and play waiter audio
    const blobUrl = await fetchTTS(SPANISH_TEXT, "mila");
    
    if (blobUrl) {
      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        URL.revokeObjectURL(blobUrl);
        finishListening();
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        finishListening();
      };
      
      audio.play().catch(() => finishListening());
    } else {
      // If TTS fails, just wait for typing to finish
      setTimeout(finishListening, SPANISH_TEXT.length * CHAR_DELAY + 500);
    }
  };

  const finishListening = () => {
    if (transcriptionIntervalRef.current) {
      clearInterval(transcriptionIntervalRef.current);
      transcriptionIntervalRef.current = null;
    }
    setTranscribedText(SPANISH_TEXT);
    setIsPlayingListen(false);
    stopWaveform();
    
    setTimeout(() => {
      setShowTranslation(true);
      setTimeout(() => setPhase("response"), 800);
    }, 400);
  };

  // Play response - called from button click
  const playResponse = async () => {
    setIsPlayingResponse(true);
    startWaveform();

    const blobUrl = await fetchTTS(RESPONSE_SPANISH, "daniel");
    
    if (blobUrl) {
      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        URL.revokeObjectURL(blobUrl);
        finishResponse();
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        finishResponse();
      };
      
      audio.play().catch(() => finishResponse());
    } else {
      setTimeout(finishResponse, 2000);
    }
  };

  const finishResponse = () => {
    setIsPlayingResponse(false);
    stopWaveform();
    setPhase("done");
  };

  const handleClose = () => {
    if (transcriptionIntervalRef.current) clearInterval(transcriptionIntervalRef.current);
    if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#FAFAF9]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-[15px] font-bold text-[#111]">Demo</span>
        <button
          onClick={handleClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-black/50 transition hover:bg-black/10"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {/* Start screen */}
        {phase === "start" && (
          <div className="flex flex-col items-center justify-center pt-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#B5332A]/10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-9 w-9 text-[#B5332A]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
            </div>
            <p className="mt-5 text-center text-[17px] font-bold text-[#111]">
              Experience TapHabla
            </p>
            <p className="mt-2 text-center text-[14px] text-black/50 max-w-[280px]">
              Hear a waiter ask you a question in Spanish, then learn how to respond.
            </p>
            <button
              onClick={startDemo}
              className="mt-6 flex items-center gap-2 rounded-[10px] bg-[#B5332A] px-7 py-3.5 text-[15px] font-bold text-white transition-all active:scale-[0.97]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
              Start Demo
            </button>
          </div>
        )}

        {/* Waveform */}
        {phase !== "start" && (
          <div className="flex h-16 items-center justify-center gap-1">
            {waveformBars.map((height, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-[#B5332A] transition-all duration-100"
                style={{ height: `${height * 48}px` }}
              />
            ))}
          </div>
        )}

        {/* They Said card */}
        {phase !== "start" && (
          <div className="mt-4 rounded-[12px] border border-black/8 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-black/35">They Said</p>
            <p className="mt-2 text-[20px] font-bold leading-[1.3] text-[#111]">
              {transcribedText}
              {isPlayingListen && transcribedText.length < SPANISH_TEXT.length && (
                <span className="inline-block w-[2px] h-5 bg-[#B5332A] ml-0.5 animate-pulse" />
              )}
            </p>
            {showTranslation && (
              <p className="mt-3 text-[15px] leading-[1.5] text-black/50">
                {ENGLISH_TEXT}
              </p>
            )}
          </div>
        )}

        {/* Response card */}
        {(phase === "response" || phase === "done") && (
          <div className="mt-4 rounded-[12px] border border-[#B5332A]/20 bg-[#B5332A]/[0.03] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#B5332A]/60">Say This</p>
            <p className="mt-2 text-[20px] font-bold leading-[1.3] text-[#111]">
              {RESPONSE_SPANISH}
            </p>
            <p className="mt-2 text-[14px] text-black/45">
              {RESPONSE_ENGLISH}
            </p>
            
            <button
              onClick={playResponse}
              disabled={isPlayingResponse}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#B5332A] py-3 text-[14px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isPlayingResponse ? (
                <>
                  <svg className="h-5 w-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                  Playing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
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
      <div className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-white/95 px-5 py-4 backdrop-blur-sm">
        <button
          onClick={handleClose}
          className="w-full rounded-[10px] bg-[#111] py-4 text-[15px] font-bold text-white transition-all active:scale-[0.98]"
        >
          Unlock Trip Pass – $19 • 7 Days
        </button>
      </div>
    </div>
  );
}
