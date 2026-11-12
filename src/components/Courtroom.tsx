"use client";

import { useEffect, useRef, useState } from "react";
import { highlightSegments } from "@/core/highlight";
import type { Loophole, Patch } from "@/core/types";

export type RoundView = {
  n: number;
  briefBefore: string;
  briefAfter?: string;
  loopholes: Loophole[];
  lawyerScore: number;
  dropped: number;
  patches?: Patch[];
  scoreAfter?: number;
};

const CATEGORY: Record<string, string> = {
  length: "Length",
  format: "Format",
  sources: "Sources",
  scope: "Scope",
  deadline: "Deadline",
  collaboration: "Solo or group",
  grading: "Grading",
  definitions: "Definitions",
};

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Number that counts up/down smoothly to its new value. */
function useCountTo(target: number) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(target);
      from.current = target;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 900);
      const v = Math.round(a + (target - a) * (1 - Math.pow(1 - k, 3)));
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return shown;
}

export function Bench({
  score,
  before,
  waitingFor,
}: {
  score: number | null;
  before?: number;
  waitingFor: "lawyer" | "teacher" | null;
}) {
  const shown = useCountTo(score ?? 0);
  const color = (score ?? 0) >= 90 ? "bg-ok" : (score ?? 0) >= 60 ? "bg-gold" : "bg-must";
  const avatar = (who: "lawyer" | "teacher") => {
    const active = waitingFor === who;
    return (
      <div className="flex flex-col items-center gap-1" aria-hidden>
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl transition ${
            who === "lawyer" ? "bg-lawyer-soft" : "bg-accent-soft"
          } ${active ? "animate-pulse ring-4 ring-gold" : ""}`}
        >
          {who === "lawyer" ? "🧑‍💼" : "👩‍🏫"}
        </span>
        <span className={`text-xs font-semibold ${who === "lawyer" ? "text-lawyer" : "text-accent-strong"}`}>
          {who === "lawyer" ? "Student Lawyer" : "Teacher"}
        </span>
      </div>
    );
  };
  return (
    <div className="sticky top-2 z-10 rounded-3xl border-2 border-accent/30 bg-gradient-to-b from-accent-soft to-surface p-3 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-3">
        {avatar("lawyer")}
        <div className="min-w-0 flex-1 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Airtight Score</p>
          <p className="text-4xl font-bold tabular-nums leading-none">
            {score === null ? "–" : shown}
            {before !== undefined && score !== null && before !== score && (
              <span className="ml-2 align-middle text-sm font-medium text-muted">from {before}</span>
            )}
          </p>
          <div
            role="meter"
            aria-label="Airtight Score"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={score ?? 0}
            className="mx-auto mt-2 h-2.5 max-w-48 overflow-hidden rounded-full bg-line"
          >
            <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${score ?? 0}%` }} />
          </div>
        </div>
        {avatar("teacher")}
      </div>
      <p aria-live="polite" className="mt-2 min-h-5 text-center text-sm text-muted">
        {waitingFor === "lawyer" ? "The Student Lawyer is examining the brief…" : waitingFor === "teacher" ? "The Teacher is drafting rulings…" : ""}
      </p>
    </div>
  );
}

export function BriefPanel({
  text,
  marks,
  tone,
  activeId,
  onPick,
}: {
  text: string;
  marks: { id: string; quote: string; label: string }[];
  tone: "loophole" | "patched";
  activeId: string | null;
  onPick: (id: string) => void;
}) {
  const segs = highlightSegments(text, marks);
  const label = new Map(marks.map((m) => [m.id, m.label]));
  return (
    <div className="rounded-3xl border border-line bg-surface p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
        {tone === "patched" ? "Brief after rulings" : "Exhibit A: the brief"}
      </p>
      <p className="whitespace-pre-wrap leading-relaxed">
        {segs.map((s, i) =>
          s.markId ? (
            <mark
              key={i}
              id={`mark-${s.markId}`}
              role="button"
              tabIndex={0}
              aria-label={`${s.text} (argument ${label.get(s.markId)})`}
              onClick={() => onPick(s.markId!)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPick(s.markId!);
                }
              }}
              className={`cursor-pointer rounded px-0.5 transition [box-decoration-break:clone] [-webkit-box-decoration-break:clone] ${
                tone === "patched" ? "bg-ok-soft text-ok" : "bg-gold/25 text-foreground"
              } ${activeId === s.markId ? "outline outline-2 outline-accent" : ""}`}
            >
              {s.text}
              <sup className="ml-0.5 text-[10px] font-bold text-accent">{label.get(s.markId)}</sup>
            </mark>
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
      </p>
    </div>
  );
}

function LoopholeCard({
  l,
  num,
  patch,
  index,
  active,
  onActive,
}: {
  l: Loophole;
  num: number;
  patch?: Patch;
  index: number;
  active: boolean;
  onActive: (id: string | null) => void;
}) {
  const delay = { animationDelay: `${index * 450}ms` };
  return (
    <li
      id={`card-${l.id}`}
      tabIndex={0}
      onMouseEnter={() => onActive(l.id)}
      onFocus={() => onActive(l.id)}
      onMouseLeave={() => onActive(null)}
      className={`animate-rise space-y-2 rounded-2xl border bg-surface p-4 outline-none ${active ? "border-accent ring-1 ring-accent" : "border-line"}`}
      style={delay}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">{num}</span>
        <span className={`rounded-full px-2 py-0.5 font-semibold ${l.severity === "major" ? "bg-must-soft text-must" : "bg-nice-soft text-nice"}`}>
          {l.severity === "major" ? "Major loophole" : "Minor loophole"}
        </span>
        <span className="rounded-full bg-nice-soft px-2 py-0.5 text-nice">{CATEGORY[l.category] ?? l.category}</span>
      </div>
      <blockquote className="border-l-[3px] border-gold pl-3 text-sm italic text-muted">
        <span className="sr-only">The brief says: </span>“{l.quote}”
      </blockquote>
      <div className="flex items-start gap-2">
        <span aria-hidden className="mt-0.5 text-xl">🧑‍💼</span>
        <p className="rounded-2xl rounded-tl-sm bg-lawyer-soft px-3 py-2 text-lawyer">
          <span className="sr-only">Student Lawyer: </span>“{l.sillyReading}”
        </p>
      </div>
      <p className="text-sm">
        <span className="font-medium">The real question: </span>
        {l.realQuestion}
      </p>
      {patch && (
        <div className="animate-rise flex items-start justify-end gap-2" style={{ animationDelay: `${index * 450 + 200}ms` }}>
          <div className="relative rounded-2xl rounded-tr-sm bg-accent-soft px-3 py-2 text-accent-strong">
            <span aria-hidden className="animate-stamp absolute -left-3 -top-3 text-xl" style={{ animationDelay: `${index * 450 + 200}ms` }}>
              🔨
            </span>
            <p className="font-semibold">
              <span className="sr-only">Teacher&apos;s ruling: </span>
              {patch.ruling}
            </p>
            <p className="mt-1 text-sm">
              {patch.applied ? "New wording" : "Suggested wording"}: “{patch.patch}”
            </p>
          </div>
          <span aria-hidden className="mt-0.5 text-xl">👩‍🏫</span>
        </div>
      )}
    </li>
  );
}

export function RoundLog({
  round,
  activeId,
  onActive,
}: {
  round: RoundView;
  activeId: string | null;
  onActive: (id: string | null) => void;
}) {
  return (
    <section aria-labelledby={`round-${round.n}`} className="space-y-3">
      <h3 id={`round-${round.n}`} className="flex items-baseline justify-between text-lg font-semibold">
        <span>{round.n === 1 ? "Round 1 · Opening arguments" : `Round ${round.n} · Re-examination`}</span>
        <span className="text-sm font-normal text-muted">
          {round.loopholes.length} loophole{round.loopholes.length === 1 ? "" : "s"}
        </span>
      </h3>
      {round.loopholes.length === 0 ? (
        <p className="animate-rise rounded-2xl bg-ok-soft px-4 py-3 text-ok">“No further questions, Your Honour.” The Student Lawyer rests. 🔒</p>
      ) : (
        <ol className="space-y-3">
          {round.loopholes.map((l, i) => (
            <LoopholeCard
              key={l.id}
              l={l}
              num={i + 1}
              index={i}
              patch={round.patches?.find((p) => p.loopholeId === l.id)}
              active={activeId === l.id}
              onActive={onActive}
            />
          ))}
        </ol>
      )}
      {round.dropped > 0 && (
        <p className="text-xs text-muted">
          Objection overruled: {round.dropped} argument{round.dropped === 1 ? "" : "s"} thrown out (not quoted from the brief, a repeat, or not allowed in
          this court).
        </p>
      )}
    </section>
  );
}
