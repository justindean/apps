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

const CHAR_DELAY = 45; // ms per character for typing animation

export function DemoModal({ open, onClose }: DemoModalProps) {
  const [phase, setPhase] = useState<"start" | "listening" | "response" | "done">("start");
  const [transcribedText, setTranscribedText] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [isPlayingListen, setIsPlayingListen] = useState(false);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(12).fill(0.15));
  const [audioLoaded, setAudioLoaded] = useState(false);
  
  const transcriptionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waiterAudioRef = useRef<HTMLAudioElement | null>(null);
  const responseAudioRef = useRef<HTMLAudioElement | null>(null);
  const waiterBlobUrlRef = useRef<string | null>(null);
  const responseBlobUrlRef = useRef<string | null>(null);

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

  // Preload audio when modal opens
  useEffect(() => {
    if (open) {
      setPhase("start");
      setTranscribedText("");
      setShowTranslation(false);
      setIsPlayingListen(false);
      setIsPlayingResponse(false);
      setWaveformBars(Array(12).fill(0.15));
      setAudioLoaded(false);
      
      // Preload both audio files in parallel
      const preloadAudio = async () => {
        const [waiterUrl, responseUrl] = await Promise.all([
          fetchTTS(SPANISH_TEXT, "mila"),
          fetchTTS(RESPONSE_SPANISH, "daniel"),
        ]);
        
        if (waiterUrl) {
          waiterBlobUrlRef.current = waiterUrl;
          const audio = new Audio(waiterUrl);
          audio.preload = "auto";
          waiterAudioRef.current = audio;
        }
        
        if (responseUrl) {
          responseBlobUrlRef.current = responseUrl;
          const audio = new Audio(responseUrl);
          audio.preload = "auto";
          responseAudioRef.current = audio;
        }
        
        setAudioLoaded(true);
      };
      
      preloadAudio();
    } else {
      // Cleanup on close
      if (transcriptionIntervalRef.current) clearInterval(transcriptionIntervalRef.current);
      if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
      if (waiterAudioRef.current) {
        waiterAudioRef.current.pause();
        waiterAudioRef.current = null;
      }
      if (responseAudioRef.current) {
        responseAudioRef.current.pause();
        responseAudioRef.current = null;
      }
      if (waiterBlobUrlRef.current) {
        URL.revokeObjectURL(waiterBlobUrlRef.current);
        waiterBlobUrlRef.current = null;
      }
      if (responseBlobUrlRef.current) {
        URL.revokeObjectURL(responseBlobUrlRef.current);
        responseBlobUrlRef.current = null;
      }
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transcriptionIntervalRef.current) clearInterval(transcriptionIntervalRef.current);
      if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
      if (waiterAudioRef.current) waiterAudioRef.current.pause();
      if (responseAudioRef.current) responseAudioRef.current.pause();
      if (waiterBlobUrlRef.current) URL.revokeObjectURL(waiterBlobUrlRef.current);
      if (responseBlobUrlRef.current) URL.revokeObjectURL(responseBlobUrlRef.current);
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

  // Start demo - plays preloaded audio instantly
  const startDemo = () => {
    const audio = waiterAudioRef.current;
    if (!audio) return;
    
    setPhase("listening");
    setIsPlayingListen(true);
    startWaveform();
    
    audio.onended = () => finishListening();
    audio.onerror = () => finishListening();
    
    // Play audio and start typing together for sync
    audio.currentTime = 0;
    audio.play().catch(() => finishListening());
    
    // Small delay to sync with iOS audio latency
    setTimeout(startTyping, 150);
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

  // Play response - plays preloaded audio instantly
  const playResponse = () => {
    const audio = responseAudioRef.current;
    if (!audio) return;
    
    setIsPlayingResponse(true);
    startWaveform();
    
    audio.onended = () => finishResponse();
    audio.onerror = () => finishResponse();
    
    audio.currentTime = 0;
    audio.play().catch(() => finishResponse());
  };

  const finishResponse = () => {
    setIsPlayingResponse(false);
    stopWaveform();
    setPhase("done");
  };

  const handleClose = () => {
    if (transcriptionIntervalRef.current) clearInterval(transcriptionIntervalRef.current);
    if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
    if (waiterAudioRef.current) waiterAudioRef.current.pause();
    if (responseAudioRef.current) responseAudioRef.current.pause();
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
              disabled={!audioLoaded}
              className={`mt-6 flex items-center gap-2 rounded-[10px] px-7 py-3.5 text-[15px] font-bold text-white transition-all active:scale-[0.97] ${
                audioLoaded ? "bg-[#B5332A]" : "bg-[#B5332A]/50 cursor-wait"
              }`}
            >
              {audioLoaded ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                  </svg>
                  Start Demo
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading Audio...
                </>
              )}
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
