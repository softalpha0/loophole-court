import { NextResponse } from "next/server";
import { runTrial, type TrialEvent } from "@/core/loop";
import { FriendlyError } from "@/lib/ai";
import { makeAgents, transcribe } from "@/lib/agents";
import { allowRequest, clientIp } from "@/lib/rateLimit";
import { TrialRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 300;

export type StreamEvent =
  | { type: "start"; brief: string; title: string; mode: "student" | "teacher" }
  | { type: "title"; title: string }
  | TrialEvent
  | { type: "error"; message: string };

/**
 * Runs a whole court session and streams each turn to the page as one JSON line
 * (newline-delimited JSON), so the courtroom fills in live.
 */
export async function POST(req: Request) {
  if (!allowRequest(clientIp(req), "trial")) {
    return NextResponse.json({ error: "The court is taking a recess: you've run a lot of trials. Try again in a little while." }, { status: 429 });
  }
  const parsed = TrialRequestSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const tooBig = parsed.error.issues.some((i) => i.code === "too_big");
    return NextResponse.json(
      { error: tooBig ? "That brief is too long or the photo is too big. Try a shorter brief or a smaller photo." : "Add the assignment brief or a photo first." },
      { status: 400 },
    );
  }
  const { text, image, mode } = parsed.data;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        let brief = text?.trim() ?? "";
        let title = "Your assignment";
        if (image) {
          const t = await transcribe(image);
          brief = [brief, t.transcription.trim()].filter(Boolean).join("\n\n");
          title = t.title || title;
        }
        send({ type: "start", brief, title, mode });
        await runTrial(brief, makeAgents((t) => send({ type: "title", title: t })), send);
      } catch (err) {
        if (!(err instanceof FriendlyError)) console.error("[trial]", err);
        send({ type: "error", message: err instanceof FriendlyError ? err.message : "The court hit a problem. Please try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" },
  });
}
