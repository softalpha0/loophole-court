"use client";

import type { Loophole, Patch } from "@/core/types";

export type RoundView = {
  n: number;
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

export function ScoreGauge({ score, label }: { score: number; label?: string }) {
  const color = score >= 90 ? "bg-ok" : score >= 60 ? "bg-gold" : "bg-must";
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label ?? "Airtight Score"}</span>
        <span className="text-2xl font-bold tabular-nums">{score}</span>
      </div>
      <div role="meter" aria-label={label ?? "Airtight Score"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} className="h-3 overflow-hidden rounded-full bg-line">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function LoopholeCard({ l, patch }: { l: Loophole; patch?: Patch }) {
  return (
    <li className="animate-rise space-y-2 rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-semibold ${l.severity === "major" ? "bg-must-soft text-must" : "bg-nice-soft text-nice"}`}>
          {l.severity === "major" ? "Major loophole" : "Minor loophole"}
        </span>
        <span className="rounded-full bg-nice-soft px-2 py-0.5 text-nice">{CATEGORY[l.category] ?? l.category}</span>
      </div>
      <blockquote className="border-l-[3px] border-gold pl-3 text-sm italic text-muted">
        <span className="sr-only">The brief says: </span>“{l.quote}”
      </blockquote>
      <div className="flex gap-2">
        <span aria-hidden className="mt-0.5 shrink-0 text-lg">🧑‍⚖️</span>
        <p className="rounded-2xl rounded-tl-sm bg-lawyer-soft px-3 py-2 text-lawyer">
          <span className="sr-only">Student Lawyer: </span>
          {l.sillyReading}
        </p>
      </div>
      <p className="text-sm">
        <span className="font-medium">Real question: </span>
        {l.realQuestion}
      </p>
      {patch && (
        <div className="animate-rise flex gap-2">
          <span aria-hidden className="mt-0.5 shrink-0 text-lg">👩‍🏫</span>
          <div className="rounded-2xl rounded-tl-sm bg-accent-soft px-3 py-2 text-accent-strong">
            <p className="font-semibold">
              <span className="sr-only">Teacher: </span>
              {patch.ruling}
            </p>
            <p className="mt-1 text-sm">
              {patch.applied ? "New wording: " : "Suggested wording (couldn't be placed): "}“{patch.patch}”
            </p>
          </div>
        </div>
      )}
    </li>
  );
}

export function TrialView({ rounds, waitingFor }: { rounds: RoundView[]; waitingFor: "lawyer" | "teacher" | null }) {
  return (
    <div className="space-y-6">
      {rounds.map((r) => (
        <section key={r.n} aria-labelledby={`round-${r.n}`} className="space-y-3">
          <h3 id={`round-${r.n}`} className="flex items-baseline justify-between text-lg font-semibold">
            <span>{r.n === 1 ? "Round 1: Opening arguments" : `Round ${r.n}: Re-examination`}</span>
            <span className="text-sm font-normal text-muted">
              {r.loopholes.length} loophole{r.loopholes.length === 1 ? "" : "s"}
            </span>
          </h3>
          {r.loopholes.length === 0 ? (
            <p className="rounded-2xl bg-ok-soft px-4 py-3 text-ok">The Student Lawyer finds no more loopholes. 🔒</p>
          ) : (
            <ul className="space-y-3">
              {r.loopholes.map((l) => (
                <LoopholeCard key={l.id} l={l} patch={r.patches?.find((p) => p.loopholeId === l.id)} />
              ))}
            </ul>
          )}
          {r.dropped > 0 && (
            <p className="text-xs text-muted">
              Objection overruled: {r.dropped} argument{r.dropped === 1 ? "" : "s"} thrown out (not quoted from the brief, a repeat, or not allowed in this court).
            </p>
          )}
        </section>
      ))}
      <div aria-live="polite" className="min-h-6">
        {waitingFor && (
          <p className="animate-pulse text-center text-muted">
            {waitingFor === "lawyer" ? "🧑‍⚖️ The Student Lawyer is reading the brief…" : "👩‍🏫 The Teacher is drafting rulings…"}
          </p>
        )}
      </div>
    </div>
  );
}
