import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AvatarPayload = {
  text?: unknown;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 1800) : "";
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AvatarPayload;
    const text = cleanText(payload.text);

    if (text.length < 8) {
      return NextResponse.json({ error: "No avatar script was supplied." }, { status: 400 });
    }

    const didKey = process.env.DID_API_KEY;
    const sourceUrl = process.env.DID_SOURCE_URL;

    if (!didKey || !sourceUrl) {
      return NextResponse.json(
        {
          mode: "animated-fallback",
          message: "No avatar video API key configured. The app will use the local animated Krishna avatar."
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const response = await fetch("https://api.d-id.com/talks", {
      method: "POST",
      headers: {
        Authorization: `Basic ${didKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        source_url: sourceUrl,
        script: {
          type: "text",
          input: text,
          provider: {
            type: "microsoft",
            voice_id: process.env.DID_VOICE_ID || "en-US-GuyNeural"
          }
        },
        config: {
          stitch: true,
          fluent: true,
          pad_audio: 0.35
        }
      })
    });

    if (!response.ok) {
      throw new Error("D-ID avatar request failed");
    }

    const data = (await response.json()) as { id?: string; result_url?: string };

    return NextResponse.json(
      {
        mode: "provider",
        talkId: data.id,
        videoUrl: data.result_url || null,
        statusUrl: data.id ? `https://api.d-id.com/talks/${data.id}` : null
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      {
        mode: "animated-fallback",
        message: "Avatar provider was unavailable. The app will use the local animated Krishna avatar."
      },
      { status: 202, headers: { "Cache-Control": "no-store" } }
    );
  }
}
