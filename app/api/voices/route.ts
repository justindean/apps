import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 500 });
  }

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Voices] ElevenLabs error:", response.status, errorText);
      return NextResponse.json({ error: "Failed to fetch voices" }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json({ voices: data.voices || [] });
  } catch (error) {
    console.error("[Voices] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
