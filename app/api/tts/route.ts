import { NextResponse } from "next/server";

export const runtime = "nodejs";

type TtsPayload = { text?: unknown };

function safeText(v: unknown) {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, 3500) : "";
}

async function elevenLabsSpeech(text: string): Promise<Response | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) return null;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": apiKey },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2",
        voice_settings: { stability: 0.72, similarity_boost: 0.72, style: 0.24, use_speaker_boost: true }
      })
    }
  );
  if (!res.ok) throw new Error(`ElevenLabs error: ${res.status}`);
  return new Response(await res.arrayBuffer(), {
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "audio/mpeg", "Cache-Control": "no-store" }
  });
}

async function openAiSpeech(text: string): Promise<Response | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL ?? "tts-1",
      voice: process.env.OPENAI_TTS_VOICE ?? "onyx",
      input: text
    })
  });
  if (!res.ok) throw new Error(`OpenAI TTS error: ${res.status}`);
  return new Response(await res.arrayBuffer(), {
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "audio/mpeg", "Cache-Control": "no-store" }
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TtsPayload;
    const text = safeText(payload.text);

    if (text.length < 8) {
      return NextResponse.json({ error: "No text supplied." }, { status: 400 });
    }

    // Try ElevenLabs → OpenAI → browser fallback
    const elevenlabs = await elevenLabsSpeech(text).catch(() => null);
    if (elevenlabs) return elevenlabs;

    const openai = await openAiSpeech(text).catch(() => null);
    if (openai) return openai;

    // Signal client to use browser SpeechSynthesis
    return NextResponse.json(
      { mode: "browser-speech", message: "No server TTS key configured." },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[tts] Unexpected error:", err);
    return NextResponse.json(
      { mode: "browser-speech", message: "Server TTS unavailable." },
      { status: 202, headers: { "Cache-Control": "no-store" } }
    );
  }
}
