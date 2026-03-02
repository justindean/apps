"use client";

import { useState, useEffect } from "react";

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  preview_url: string;
}

export default function VoicesPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/voices")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setVoices(data.voices || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const playPreview = (voiceId: string, previewUrl: string) => {
    setPlaying(voiceId);
    const audio = new Audio(previewUrl);
    audio.onended = () => setPlaying(null);
    audio.onerror = () => setPlaying(null);
    audio.play().catch(() => setPlaying(null));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-2xl font-bold mb-4">ElevenLabs Voices</h1>
        <p className="text-gray-500">Loading voices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-2xl font-bold mb-4">ElevenLabs Voices</h1>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-2">ElevenLabs Voices</h1>
      <p className="text-gray-500 mb-6">
        Click a voice ID to copy. Use these to set ELEVENLABS_VOICE_ID_DANIEL and ELEVENLABS_VOICE_ID_MILA.
      </p>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm font-mono">
          <strong>Current config:</strong><br />
          VOICE_DANIEL: {process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID_DANIEL || "onwK4e9ZLuTAKqWW03F9 (default)"}<br />
          VOICE_MILA: {process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID_MILA || "EXAVITQu4vr4xnSDxMaL (default)"}
        </p>
      </div>

      <div className="grid gap-4">
        {voices.map((voice) => (
          <div
            key={voice.voice_id}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-lg">{voice.name}</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{voice.category}</span>
              </div>
              <button
                onClick={() => copyToClipboard(voice.voice_id)}
                className="text-sm font-mono text-blue-600 hover:underline mt-1"
              >
                {voice.voice_id}
              </button>
              {Object.keys(voice.labels).length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {Object.entries(voice.labels).map(([key, value]) => (
                    <span key={key} className="text-xs bg-gray-50 px-2 py-0.5 rounded text-gray-600">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => playPreview(voice.voice_id, voice.preview_url)}
              disabled={playing === voice.voice_id}
              className="ml-4 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {playing === voice.voice_id ? "Playing..." : "Preview"}
            </button>
          </div>
        ))}
      </div>

      {voices.length === 0 && (
        <p className="text-gray-500">No voices found. Make sure ELEVENLABS_API_KEY is set.</p>
      )}
    </div>
  );
}
