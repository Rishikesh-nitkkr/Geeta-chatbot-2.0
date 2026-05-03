import { NextResponse } from "next/server";
import { createGuidance, isGreeting } from "@/lib/guidance";
import { getDailyVerse } from "@/lib/guidance";

export const runtime = "nodejs";

type GuidancePayload = {
  query?: unknown;
  situation?: unknown;
};

// Admin notification — saves to server-side file via /api/admin/missing
function notifyAdminMissingQuery(query: string) {
  console.warn("[ADMIN] Low-confidence query:", query.slice(0, 80));
  fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000"}/api/admin/missing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  }).catch(() => { /* non-critical */ });
}


export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL ?? "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export async function POST(request: Request) {
  try {
    let payload: GuidancePayload;
    try {
      payload = (await request.json()) as GuidancePayload;
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }

    const query = typeof payload.query === "string" ? payload.query.trim() : "";
    const situation = typeof payload.situation === "string" ? payload.situation : undefined;

    if (query.length < 2) {
      return NextResponse.json({ error: "Please share a little more." }, { status: 400 });
    }

    if (query.length > 1200) {
      return NextResponse.json({ error: "Please keep your question under 1200 characters." }, { status: 400 });
    }

    // ── Greeting response ────────────────────────────────────────────────────
    if (isGreeting(query)) {
      const verse = getDailyVerse();
      return NextResponse.json({
        query,
        situation: "general",
        verse,
        confidence: 1,
        krishnaGuidance:
          "Hare Krishna! 🙏 I am here, dear seeker. Share what weighs on your heart — your fear, your confusion, your hope — and I will offer you the wisdom of the Bhagavad Gita. Today's divine message is waiting for you below.",
        practicalAdvice: [
          "Type your question or feeling in the box above.",
          "You can also tap an emotion tag to get instant guidance.",
          "Every sincere question deserves a sacred answer."
        ],
        reflectionPrompt: "What brings you here today?",
        audioScript: "Hare Krishna. Welcome, dear seeker. I am here. Share what is in your heart.",
        matchedTags: ["greeting"],
        isLowConfidence: false
      });
    }

    // ── Regular guidance ─────────────────────────────────────────────────────
    const response = createGuidance(query, situation);

    // Fire admin notification for low-confidence queries
    if (response.isLowConfidence) {
      notifyAdminMissingQuery(query);
    }

    return NextResponse.json(response, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (err) {
    console.error("[guidance] Unexpected error:", err);
    return NextResponse.json(
      { error: "Guidance could not be generated. Please try again." },
      { status: 500 }
    );
  }
}
