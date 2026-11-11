import { NextResponse } from "next/server";
import { askClaude, FriendlyError } from "@/lib/ai";
import { MESSAGE_SYSTEM } from "@/lib/prompts";
import { allowRequest, clientIp } from "@/lib/rateLimit";
import { AiMessageSchema, MessageRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (!allowRequest(clientIp(req), "message")) {
      throw new FriendlyError("You've made a lot of requests. Take a short break and try again in a few minutes.", 429);
    }
    const body = MessageRequestSchema.safeParse(await req.json().catch(() => null));
    if (!body.success) {
      throw new FriendlyError("Pick at least one question to ask first.", 400);
    }
    const { title, tone, questions, studentName, teacherName } = body.data;

    const prompt = [
      `Assignment: ${title}`,
      `Tone: ${tone}`,
      `Teacher's name: ${teacherName?.trim() || "(not given)"}`,
      `Student's name: ${studentName?.trim() || "(not given)"}`,
      "Questions to ask:",
      ...questions.map((q, i) => `${i + 1}. ${q.question}${q.quote ? ` (the brief says: "${q.quote}")` : ""}`),
    ].join("\n");

    const msg = await askClaude({
      schema: AiMessageSchema,
      system: MESSAGE_SYSTEM,
      content: [{ type: "text", text: prompt }],
      effort: "low",
      maxTokens: 4000,
    });
    return NextResponse.json(msg);
  } catch (err) {
    const e = err instanceof FriendlyError ? err : new FriendlyError("Something went wrong. Please try again.");
    if (!(err instanceof FriendlyError)) console.error("[message]", err);
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
}
