"use client";

import { diffWords } from "diff";
import { useMemo, useState } from "react";
import { TeacherMessage } from "@/components/TeacherMessage";
import type { TrialResult } from "@/core/loop";
import { rebuildBrief } from "@/core/rebuild";
import { CATEGORIES } from "@/core/types";

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

function Summary({ result, title }: { result: TrialResult; title: string }) {
  const all = result.rounds.flatMap((r) => r.loopholes);
  const counts = CATEGORIES.map((c) => [c, all.filter((l) => l.category === c).length] as const).filter(([, n]) => n > 0);
  return (
    <div className="space-y-4 rounded-3xl border-2 border-accent/30 bg-gradient-to-b from-accent-soft to-surface p-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">⚖️ Verdict in the case of</p>
      <h2 id="verdict-h" className="text-2xl font-semibold">
        {title}
      </h2>
      <div className="flex items-center justify-center gap-4 text-4xl font-bold tabular-nums">
        <span className="text-must">{result.scoreBefore}</span>
        <span aria-hidden className="text-2xl text-muted">→</span>
        <span className="sr-only">to</span>
        <span className="text-ok">{result.scoreAfter}</span>
      </div>
      <p className="text-muted">
        {all.length === 0
          ? "No loopholes found. This brief was already airtight."
          : `${all.length} loophole${all.length === 1 ? "" : "s"} found over ${result.rounds.length} round${result.rounds.length === 1 ? "" : "s"}.`}
      </p>
      {counts.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-2" aria-label="Loopholes by category">
          {counts.map(([c, n]) => (
            <li key={c} className="rounded-full bg-surface px-3 py-1 text-sm">
              {CATEGORY[c]} <span className="font-semibold">×{n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StudentVerdict({ result, title }: { result: TrialResult; title: string }) {
  const all = result.rounds.flatMap((r) => r.loopholes);
  const [selected, setSelected] = useState<Set<string>>(() => {
    const majors = all.filter((l) => l.severity === "major").slice(0, 4);
    return new Set((majors.length ? majors : all.slice(0, 2)).map((l) => l.id));
  });
  if (all.length === 0) return null;
  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-lg font-semibold">Questions to ask your teacher</legend>
        <p className="text-sm text-muted">The court&apos;s patches are only suggestions. Your real teacher decides, so ask. Tick up to 4.</p>
        {all.map((l) => (
          <label key={l.id} className={`flex cursor-pointer gap-3 rounded-2xl border bg-surface p-3 ${selected.has(l.id) ? "border-accent ring-1 ring-accent" : "border-line"}`}>
            <input
              type="checkbox"
              checked={selected.has(l.id)}
              onChange={() =>
                setSelected((s) => {
                  const n = new Set(s);
                  if (n.has(l.id)) n.delete(l.id);
                  else n.add(l.id);
                  return n;
                })
              }
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]"
            />
            <span>
              {l.realQuestion}
              {l.severity === "major" && <span className="ml-2 rounded-full bg-must-soft px-2 py-0.5 text-xs font-medium text-must">Important</span>}
            </span>
          </label>
        ))}
      </fieldset>
      <TeacherMessage title={title} options={all.map((l) => ({ id: l.id, question: l.realQuestion, quote: l.quote }))} selected={selected} />
    </div>
  );
}

function TeacherVerdict({ result }: { result: TrialResult }) {
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"changes" | "clean">("changes");
  const { text, skipped } = useMemo(() => rebuildBrief(result.originalBrief, result.rounds, rejected), [result, rejected]);
  const parts = useMemo(() => diffWords(result.originalBrief, text), [result.originalBrief, text]);
  const patches = result.rounds.flatMap((r) =>
    r.patches.filter((p) => p.applied).map((p) => ({ ...p, round: r.n, loophole: r.loopholes.find((l) => l.id === p.loopholeId)! })),
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the text is visible to copy by hand */
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-3xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Your airtight brief</h3>
          <div role="radiogroup" aria-label="View" className="flex gap-1 rounded-full bg-line/60 p-1 text-sm">
            {(["changes", "clean"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                onClick={() => setView(v)}
                className={`rounded-full px-3 py-1 font-medium ${view === v ? "bg-surface shadow-sm" : "text-muted"}`}
              >
                {v === "changes" ? "Show changes" : "Clean copy"}
              </button>
            ))}
          </div>
        </div>
        <p className="whitespace-pre-wrap rounded-2xl bg-background p-4 leading-relaxed">
          {view === "clean"
            ? text
            : parts.map((p, i) =>
                p.added ? (
                  <ins key={i} className="rounded bg-ok-soft px-0.5 text-ok no-underline">
                    <span className="sr-only">[added: </span>
                    {p.value}
                    <span className="sr-only">]</span>
                  </ins>
                ) : p.removed ? (
                  <del key={i} className="text-must/70">
                    <span className="sr-only">[removed: </span>
                    {p.value}
                    <span className="sr-only">]</span>
                  </del>
                ) : (
                  <span key={i}>{p.value}</span>
                ),
              )}
        </p>
        {skipped.length > 0 && (
          <p className="text-sm text-must">
            {skipped.length} later change{skipped.length === 1 ? "" : "s"} couldn&apos;t be placed because it built on a change you rejected.
          </p>
        )}
        <button type="button" onClick={copy} className="w-full rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-strong">
          {copied ? "Copied ✓" : "Copy final brief"}
        </button>
        <p className="text-xs text-muted">Check the values (word counts, times, sources) match what you want before handing it out.</p>
      </div>

      {patches.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-lg font-semibold">Keep or reject each change</legend>
          {patches.map((p) => {
            const kept = !rejected.has(p.loopholeId);
            return (
              <div key={p.loopholeId} className={`rounded-2xl border p-4 ${kept ? "border-line bg-surface" : "border-dashed border-line bg-background opacity-70"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">{p.ruling}</p>
                    <p className="text-sm text-muted">
                      {p.placement === "append" ? "Adds" : `“${p.loophole.quote}” →`} “{p.patch}”
                    </p>
                  </div>
                  <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={kept}
                      onChange={() =>
                        setRejected((s) => {
                          const n = new Set(s);
                          if (n.has(p.loopholeId)) n.delete(p.loopholeId);
                          else n.add(p.loopholeId);
                          return n;
                        })
                      }
                      className="h-5 w-5 accent-[var(--accent)]"
                    />
                    Keep
                  </label>
                </div>
              </div>
            );
          })}
        </fieldset>
      )}
    </div>
  );
}

export function Verdict({ result, title, mode, onNew }: { result: TrialResult; title: string; mode: "student" | "teacher"; onNew: () => void }) {
  return (
    <section aria-labelledby="verdict-h" className="mx-auto max-w-2xl space-y-6 pt-4">
      <Summary result={result} title={title} />
      {mode === "student" ? <StudentVerdict result={result} title={title} /> : <TeacherVerdict result={result} />}
      <button type="button" onClick={onNew} className="w-full rounded-full border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-soft">
        Start a new trial
      </button>
    </section>
  );
}
