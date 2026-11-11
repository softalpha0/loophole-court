"use client";

import { useId, useState } from "react";
import { postJson } from "@/lib/api";
export type SavedMessage = { subject: string; body: string; tone: "formal" | "friendly" };
export type MessageQuestion = { id: string; question: string; quote?: string };

type Tone = "formal" | "friendly";

export function TeacherMessage({
  title,
  options,
  selected,
  saved,
  onChange,
}: {
  title: string;
  options: MessageQuestion[];
  selected: Set<string>;
  saved?: SavedMessage;
  onChange?: (m: SavedMessage) => void;
}) {
  const [tone, setTone] = useState<Tone>(saved?.tone ?? "formal");
  const [teacherName, setTeacherName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [subject, setSubject] = useState(saved?.subject ?? "");
  const [body, setBody] = useState(saved?.body ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const ids = { teacher: useId(), student: useId(), body: useId() };

  const questions = options.filter((u) => selected.has(u.id));

  async function generate(withTone: Tone = tone) {
    if (questions.length === 0) {
      setError("Tick at least one question above to ask about.");
      return;
    }
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const msg = await postJson<{ subject: string; body: string }>("/api/message", {
        title,
        tone: withTone,
        questions: questions.map((q) => ({ question: q.question, quote: q.quote })),
        teacherName: teacherName.trim() || undefined,
        studentName: studentName.trim() || undefined,
      });
      setSubject(msg.subject);
      setBody(msg.body);
      onChange?.({ subject: msg.subject, body: msg.body, tone: withTone });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  // Changing tone after a message exists rewrites it in the new tone.
  function pickTone(t: Tone) {
    if (t === tone) return;
    setTone(t);
    if (body) void generate(t);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Couldn't copy automatically — select the text and copy it yourself.");
    }
  }

  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <section aria-labelledby="msg-h" className="space-y-4 rounded-3xl border border-line bg-surface p-5 sm:p-6">
      <div>
        <h3 id="msg-h" className="text-lg font-semibold">
          Ask your teacher
        </h3>
        <p className="text-sm text-muted">
          A short, polite message with {questions.length || "your"} question{questions.length === 1 ? "" : "s"}. You can
          edit it before sending.
        </p>
      </div>

      <div role="radiogroup" aria-label="Tone" className="flex gap-1 rounded-full bg-line/60 p-1">
        {(["formal", "friendly"] as Tone[]).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={tone === t}
            disabled={busy}
            onClick={() => pickTone(t)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
              tone === t ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={ids.teacher} className="block text-sm font-medium">
            Teacher&apos;s name <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id={ids.teacher}
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            maxLength={80}
            placeholder="e.g. Mrs Okafor"
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base focus:border-accent focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={ids.student} className="block text-sm font-medium">
            Your name <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id={ids.student}
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            maxLength={80}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {!body && (
        <button
          type="button"
          onClick={() => generate()}
          disabled={busy || questions.length === 0}
          className="w-full rounded-full bg-accent px-6 py-3.5 font-semibold text-white transition hover:bg-accent-strong disabled:opacity-60"
        >
          {busy ? "Writing your message…" : "Write my message"}
        </button>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-must-soft px-4 py-3 text-sm text-must">
          {error}
        </p>
      )}

      {body && (
        <div className="space-y-3" aria-busy={busy}>
          <label htmlFor={ids.body} className="block text-sm font-medium">
            Your message {subject && <span className="font-normal text-muted">— subject: {subject}</span>}
          </label>
          <textarea
            id={ids.body}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              onChange?.({ subject, body: e.target.value, tone });
            }}
            rows={10}
            className={`w-full resize-y rounded-2xl border border-line bg-background p-4 text-base leading-relaxed focus:border-accent focus:outline-none ${
              busy ? "opacity-50" : ""
            }`}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={copy}
              className="flex-1 rounded-full bg-accent px-5 py-3 font-semibold text-white transition hover:bg-accent-strong"
            >
              {copied ? "Copied ✓" : "Copy message"}
            </button>
            <a
              href={mailto}
              className="flex-1 rounded-full border border-accent px-5 py-3 text-center font-semibold text-accent transition hover:bg-accent-soft"
            >
              Open in email
            </a>
            <button
              type="button"
              onClick={() => generate()}
              disabled={busy}
              className="rounded-full px-5 py-3 font-medium text-muted hover:text-foreground disabled:opacity-60"
            >
              {busy ? "Rewriting…" : "Rewrite"}
            </button>
          </div>
          <p aria-live="polite" className="sr-only">
            {copied ? "Message copied" : ""}
          </p>
        </div>
      )}
    </section>
  );
}
