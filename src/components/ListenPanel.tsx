import { useState, useRef, useCallback, useEffect } from "react";
import type { Phrase, SpeechMode } from "../data/phrases";
import { classifyIntent, getSectionPhrases } from "../data/restaurantIntents";
import type { IntentMatch } from "../data/restaurantIntents";

/* ── TTS helper (duplicated for self-containment) ── */
function speakPhrase(text: string) {
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-MX";
    u.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
}

/* ── Icons ── */
function MicIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function StopIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

function VolumeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
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

type ListenState = "idle" | "connecting" | "listening" | "processing";

interface ListenPanelProps {
  mode: SpeechMode;
  onCopy: (text: string) => void;
  onSpeak: (phrase: Phrase) => void;
}

export function ListenPanel({ mode, onCopy, onSpeak }: ListenPanelProps) {
  const [state, setState] = useState<ListenState>("idle");
  const [transcript, setTranscript] = useState("");
  const [match, setMatch] = useState<IntentMatch | null>(null);
  const [altPhrases, setAltPhrases] = useState<Phrase[]>([]);
  const [error, setError] = useState<string | null>(null);

  // WebRTC refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript("");
    setMatch(null);
    setAltPhrases([]);
    setState("connecting");

    try {
      // 1. Get ephemeral token
      const tokenRes = await fetch("/api/realtime-token");
      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        throw new Error(err.error || `Token request failed (${tokenRes.status})`);
      }
      const tokenData = await tokenRes.json();
      const ephemeralKey = tokenData.client_secret?.value;
      if (!ephemeralKey) throw new Error("No ephemeral key returned");

      // 2. Get microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 3. Create WebRTC peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Add mic track
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Create data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      let fullTranscript = "";

      dc.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);

          // Accumulate transcription
          if (msg.type === "response.audio_transcript.delta" || msg.type === "conversation.item.input_audio_transcription.delta") {
            const delta = msg.delta || "";
            fullTranscript += delta;
            setTranscript(fullTranscript);
          }

          // Final transcription
          if (
            msg.type === "conversation.item.input_audio_transcription.completed" ||
            msg.type === "response.audio_transcript.done"
          ) {
            const finalText = msg.transcript || fullTranscript;
            setTranscript(finalText);

            // Classify intent
            const intentMatch = classifyIntent(finalText, mode);
            setMatch(intentMatch);
            if (intentMatch) {
              setAltPhrases(getSectionPhrases(intentMatch.section, mode));
            }
            setState("idle");
          }

          // Handle errors
          if (msg.type === "error") {
            setError(msg.error?.message || "Realtime API error");
            setState("idle");
          }
        } catch {
          // Ignore non-JSON messages
        }
      };

      dc.onopen = () => {
        setState("listening");
        // Configure session for input transcription
        dc.send(JSON.stringify({
          type: "session.update",
          session: {
            input_audio_transcription: {
              model: "whisper-1",
            },
          },
        }));
      };

      dc.onclose = () => {
        if (state === "listening") setState("idle");
      };

      // 4. Create and set local SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 5. Send SDP to OpenAI Realtime API
      const sdpRes = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      if (!sdpRes.ok) throw new Error(`SDP exchange failed (${sdpRes.status})`);

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setError(message);
      setState("idle");
      cleanup();
    }
  }, [mode, cleanup, state]);

  const stopListening = useCallback(() => {
    setState("processing");
    // Brief delay to let any final transcription come through
    setTimeout(() => {
      cleanup();
      setState("idle");
    }, 500);
  }, [cleanup]);

  const handleSuggestedPhrase = useCallback((phrase: Phrase) => {
    speakPhrase(phrase.spanish);
    onSpeak(phrase);
    onCopy(phrase.spanish);
  }, [onSpeak, onCopy]);

  const isActive = state === "listening" || state === "connecting" || state === "processing";

  return (
    <div className="flex flex-col gap-4">
      {/* ── Mic Button ── */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={isActive ? stopListening : startListening}
          className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-200 ${
            state === "listening"
              ? "bg-red-500 text-white shadow-lg shadow-red-500/30 active:scale-95"
              : state === "connecting" || state === "processing"
              ? "bg-stone-300 text-stone-500 dark:bg-stone-600 dark:text-stone-400"
              : "bg-[#D94F2A] text-white shadow-lg shadow-[#D94F2A]/25 active:scale-95 dark:bg-[#E8734F] dark:shadow-[#E8734F]/20"
          }`}
          disabled={state === "connecting" || state === "processing"}
          aria-label={isActive ? "Stop listening" : "Start listening"}
        >
          {/* Pulsing ring when listening */}
          {state === "listening" && (
            <span className="absolute inset-0 animate-ping rounded-full bg-red-500/30" />
          )}
          {state === "listening" ? (
            <StopIcon size={24} />
          ) : (
            <MicIcon size={28} className={state === "connecting" ? "animate-pulse" : ""} />
          )}
        </button>

        <p className="text-[13px] font-medium text-stone-400 dark:text-stone-500">
          {state === "idle" && !transcript && "Tap to listen"}
          {state === "connecting" && "Connecting..."}
          {state === "listening" && "Listening..."}
          {state === "processing" && "Processing..."}
          {state === "idle" && transcript && "Tap to listen again"}
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-center dark:bg-red-950/30">
          <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* ── Live Transcript ── */}
      {transcript && (
        <div className="animate-fade-in rounded-2xl border border-stone-200/60 bg-gradient-to-b from-white to-warm-50 p-4 shadow-card-elevated card-highlight dark:border-stone-700/40 dark:from-stone-800/90 dark:to-stone-800/70">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone-400/70 dark:text-stone-500/60">
            They said
          </p>
          <p className="text-[17px] font-extrabold leading-tight text-stone-900 dark:text-stone-50">
            {`"${transcript}"`}
          </p>
        </div>
      )}

      {/* ── Suggested Response ── */}
      {match && (
        <div className="animate-fade-in">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400/70 dark:text-stone-500/60">
            Say this
          </p>

          {/* Primary suggestion */}
          <button
            onClick={() => handleSuggestedPhrase(match.phrase)}
            className="group relative flex w-full flex-col overflow-hidden rounded-[18px] border-2 border-[#D94F2A]/30 bg-gradient-to-b from-white to-warm-50 p-4 text-left shadow-card-elevated card-highlight transition-all duration-150 active:translate-y-px active:shadow-card-press dark:border-[#E8734F]/30 dark:from-stone-800/90 dark:to-stone-800/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <p className="text-[19px] font-extrabold leading-tight tracking-[0.01em] text-stone-900 dark:text-stone-50">
                  {match.phrase.spanish}
                </p>
                <p className="mt-1.5 text-[13px] leading-snug text-stone-400 dark:text-stone-500">
                  {match.phrase.english}
                </p>
                <p className="mt-1 font-mono text-[10.5px] leading-snug tracking-tight text-stone-300 dark:text-stone-600">
                  {match.phrase.pronunciation}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#D94F2A] px-3 py-1.5 text-white shadow-md shadow-[#D94F2A]/25 dark:bg-[#E8734F] dark:shadow-[#E8734F]/20">
                <WaveformIcon size={12} />
                <span className="text-[11px] font-extrabold">Speak</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                {Math.round(match.confidence * 100)}% match
              </span>
              <span className="text-[10px] text-stone-400 dark:text-stone-500">
                {match.section}
              </span>
            </div>
          </button>

          {/* Alternative phrases from same section */}
          {altPhrases.length > 1 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400/60 dark:text-stone-500/50">
                Or try
              </p>
              <div className="flex flex-wrap gap-2">
                {altPhrases
                  .filter((p) => p.spanish !== match.phrase.spanish)
                  .map((phrase) => (
                    <button
                      key={phrase.spanish}
                      onClick={() => handleSuggestedPhrase(phrase)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-stone-200/60 bg-gradient-to-b from-white to-warm-50 px-3 py-1.5 shadow-sm transition-all duration-150 active:scale-[0.96] active:shadow-none dark:border-stone-700/40 dark:from-stone-800/90 dark:to-stone-800/70"
                    >
                      <VolumeIcon size={10} />
                      <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">{phrase.spanish}</span>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500">{phrase.english}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── No match state ── */}
      {transcript && !match && state === "idle" && (
        <div className="animate-fade-in rounded-xl bg-amber-50/60 px-4 py-3 text-center dark:bg-amber-900/15">
          <p className="text-[12px] font-medium text-amber-700/70 dark:text-amber-400/60">
            Could not match a response. Try listening again or use the phrases above.
          </p>
        </div>
      )}
    </div>
  );
}
