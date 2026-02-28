"use client";

import { useState, useRef } from "react";

interface DemoModalProps {
  open: boolean;
  onClose: () => void;
}

export function DemoModal({ open, onClose }: DemoModalProps) {
  const [listenPlayed, setListenPlayed] = useState(false);
  const [isPlayingListen, setIsPlayingListen] = useState(false);
  const [isPlayingSay, setIsPlayingSay] = useState(false);
  
  const listenAudioRef = useRef<HTMLAudioElement | null>(null);
  const sayAudioRef = useRef<HTMLAudioElement | null>(null);

  if (!open) return null;

  const handlePlayListen = () => {
    // Create audio element directly in click handler (required for iOS)
    const audio = new Audio("/demo/listen-es.mp3");
    listenAudioRef.current = audio;
    
    setIsPlayingListen(true);
    
    audio.onended = () => {
      setIsPlayingListen(false);
      setListenPlayed(true);
    };
    
    audio.onerror = () => {
      setIsPlayingListen(false);
      setListenPlayed(true);
    };
    
    audio.play().catch(() => {
      setIsPlayingListen(false);
      setListenPlayed(true);
    });
  };

  const handlePlaySay = () => {
    if (!listenPlayed) return;
    
    // Create audio element directly in click handler (required for iOS)
    const audio = new Audio("/demo/reply-es.mp3");
    sayAudioRef.current = audio;
    
    setIsPlayingSay(true);
    
    audio.onended = () => {
      setIsPlayingSay(false);
    };
    
    audio.onerror = () => {
      setIsPlayingSay(false);
    };
    
    audio.play().catch(() => {
      setIsPlayingSay(false);
    });
  };

  const handleClose = () => {
    // Stop any playing audio
    if (listenAudioRef.current) {
      listenAudioRef.current.pause();
      listenAudioRef.current = null;
    }
    if (sayAudioRef.current) {
      sayAudioRef.current.pause();
      sayAudioRef.current = null;
    }
    setListenPlayed(false);
    setIsPlayingListen(false);
    setIsPlayingSay(false);
    onClose();
  };

  const isPlaying = isPlayingListen || isPlayingSay;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-[90%] max-w-[360px] rounded-[16px] bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-black/50 transition-colors hover:bg-black/10"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <h2 className="text-[18px] font-bold text-[#111]">Restaurant Demo</h2>
        <p className="mt-2 text-[14px] text-black/50">
          Hear a waiter speak, then practice your response.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col gap-4">
          {/* PLAY LISTEN */}
          <button
            onClick={handlePlayListen}
            disabled={isPlaying}
            className={`flex h-14 items-center justify-center rounded-[10px] text-[15px] font-bold transition-all ${
              isPlayingListen
                ? "bg-[#B5332A] text-white"
                : isPlaying
                ? "bg-black/10 text-black/30 cursor-not-allowed"
                : "bg-[#B5332A] text-white active:scale-[0.98]"
            }`}
          >
            {isPlayingListen ? "Playing..." : "PLAY LISTEN"}
          </button>

          {/* PLAY SAY */}
          <button
            onClick={handlePlaySay}
            disabled={!listenPlayed || isPlaying}
            className={`flex h-14 items-center justify-center rounded-[10px] text-[15px] font-bold transition-all ${
              isPlayingSay
                ? "bg-[#111] text-white"
                : !listenPlayed || isPlaying
                ? "bg-black/10 text-black/30 cursor-not-allowed"
                : "bg-[#111] text-white active:scale-[0.98]"
            }`}
          >
            {isPlayingSay ? "Playing..." : "PLAY SAY"}
          </button>
        </div>

        {/* Hint */}
        {!listenPlayed && !isPlaying && (
          <p className="mt-4 text-center text-[12px] text-black/40">
            Tap PLAY LISTEN first to hear the waiter
          </p>
        )}
        {listenPlayed && !isPlaying && (
          <p className="mt-4 text-center text-[12px] text-black/40">
            Now tap PLAY SAY to hear your response
          </p>
        )}
      </div>
    </div>
  );
}
