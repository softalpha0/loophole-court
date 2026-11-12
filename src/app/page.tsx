"use client";

import { useRef, useState } from "react";
import { BriefInput, type BriefPayload } from "@/components/BriefInput";
import { Verdict } from "@/components/Verdict";
import { Bench, BriefPanel, RoundLog, type RoundView } from "@/components/Courtroom";
import type { TrialResult } from "@/core/loop";
import { streamTrial } from "@/lib/trialClient";

type Phase = "input" | "trial" | "verdict";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("input");
  const [mode, setMode] = useState<"student" | "teacher">("student");
  const [title, setTitle] = useState("Your assignment");
  const [brief, setBrief] = useState("");
  const [rounds, setRounds] = useState<RoundView[]>([]);
  const [waitingFor, setWaitingFor] = useState<"lawyer" | "teacher" | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [result, setResult] = useState<TrialResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const briefRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  async function start(payload: BriefPayload) {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setMode(payload.mode);
    setPhase("trial");
    setRounds([]);
    setResult(null);
    setScore(null);
    setError(null);
    setWaitingFor("lawyer");
    setBrief(payload.text ?? "");
    briefRef.current = payload.text ?? "";
    setActiveId(null);
    requestAnimationFrame(() => topRef.current?.focus());
    try {
      await streamTrial(
        payload,
        (e) => {
          switch (e.type) {
            case "start":
              setBrief(e.brief);
              briefRef.current = e.brief;
              setTitle(e.title);
              break;
            case "title":
              setTitle(e.title);
              break;
            case "lawyer":
              setRounds((rs) => [
                ...rs,
                { n: e.round, briefBefore: briefRef.current, loopholes: e.loopholes, lawyerScore: e.score, dropped: e.dropped },
              ]);
              setScore((s) => (s === null ? e.score : s));
              setWaitingFor(e.loopholes.length ? "teacher" : null);
              break;
            case "teacher":
              setRounds((rs) => rs.map((r) => (r.n === e.round ? { ...r, patches: e.patches, scoreAfter: e.score, briefAfter: e.briefAfter } : r)));
              briefRef.current = e.briefAfter;
              setScore(e.score);
              setWaitingFor("lawyer");
              break;
            case "done": {
              setWaitingFor(null);
              setResult(e.result);
              setScore(e.result.scoreAfter);
              setPhase("verdict");
              break;
            }
            case "error":
              setWaitingFor(null);
              setError(e.message);
              break;
          }
        },
        ac.signal,
      );
    } catch (err) {
      setWaitingFor(null);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function reset() {
    abortRef.current?.abort();
    setPhase("input");
    setError(null);
    window.scrollTo({ top: 0 });
  }


  return (
    <main className={`mx-auto w-full px-4 pb-10 pt-8 sm:px-6 sm:pt-12 ${phase === "input" ? "max-w-2xl" : "max-w-5xl"}`}>
      <header className="mb-8 flex items-center justify-between">
        <button type="button" onClick={reset} className="flex items-center gap-2 text-left" aria-label="Loophole Court home">
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-lg text-white">
            ⚖️
          </span>
          <span className="text-lg font-semibold">Loophole Court</span>
        </button>
        {phase !== "input" && (
          <button type="button" onClick={reset} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-accent">
            New trial
          </button>
        )}
      </header>

      {phase === "input" ? (
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Two AIs argue over your assignment <span className="text-accent">until it&apos;s airtight.</span>
            </h1>
            <p className="text-lg text-muted">
              A cheeky Student Lawyer finds every loophole. A Teacher patches each one. You get the questions to ask, or a brief nobody can misread.
            </p>
            <div className="rounded-2xl border border-line bg-surface p-4 text-sm">
              <p>
                <span className="font-medium">Brief:</span> “Write about a famous person.”
              </p>
              <p className="text-lawyer">
                <span className="font-medium">🧑‍⚖️ Student Lawyer:</span> “My cat. Very famous on our street.”
              </p>
              <p className="text-accent-strong">
                <span className="font-medium">👩‍🏫 Teacher:</span> “Objection sustained. A historical or public figure.”
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-line bg-surface/70 p-5 shadow-sm sm:p-6">
            <BriefInput onSubmit={start} busy={false} />
          </div>
          <p className="text-center text-sm text-muted">
            Loophole Court never writes assignments and never suggests real cheating. The silly readings are just that: silly.
          </p>
        </div>
      ) : (
        <div ref={topRef} tabIndex={-1} className="space-y-6 focus:outline-none">
          <div className="space-y-1">
            <p className="text-sm font-medium uppercase tracking-wide text-accent">{mode === "student" ? "Student mode" : "Teacher mode"} · The case of</p>
            <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
          </div>

          <Bench score={score} before={result?.scoreBefore} waitingFor={waitingFor} />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
            <div className="space-y-3 lg:sticky lg:top-40">
              {(() => {
                // Show the latest round with arguments; once the Lawyer rests, keep showing the last patched brief.
                const withArgs = rounds.filter((r) => r.loopholes.length > 0);
                const last = withArgs[withArgs.length - 1];
                if (!last) return brief ? <BriefPanel text={brief} marks={[]} tone="loophole" activeId={null} onPick={() => {}} /> : null;
                const patched = !!last.briefAfter;
                const marks = patched
                  ? (last.patches ?? [])
                      .filter((p) => p.applied)
                      .map((p) => ({ id: p.loopholeId, quote: p.patch, label: String(last.loopholes.findIndex((l) => l.id === p.loopholeId) + 1) }))
                  : last.loopholes.map((l, i) => ({ id: l.id, quote: l.quote, label: String(i + 1) }));
                return (
                  <BriefPanel
                    text={patched ? last.briefAfter! : last.briefBefore}
                    marks={marks}
                    tone={patched ? "patched" : "loophole"}
                    activeId={activeId}
                    onPick={(id) => {
                      setActiveId(id);
                      document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  />
                );
              })()}
              <p className="text-xs text-muted">Tap a highlight to jump to its argument. Hover or focus an argument to find it in the brief.</p>
            </div>

            <div className="space-y-6">
              {rounds.map((r) => (
                <RoundLog key={r.n} round={r} activeId={activeId} onActive={setActiveId} />
              ))}
              {rounds.length === 0 && !error && (
                <p className="animate-pulse rounded-2xl border border-dashed border-line p-6 text-center text-muted">All rise. The court is now in session…</p>
              )}
            </div>
          </div>

          {error && (
            <div role="alert" className="space-y-3 rounded-2xl bg-must-soft px-4 py-3 text-must">
              <p>{error}</p>
              <button type="button" onClick={reset} className="rounded-full bg-surface px-4 py-2 text-sm font-semibold text-foreground">
                Back to the start
              </button>
            </div>
          )}

          {phase === "verdict" && result && <Verdict result={result} title={title} mode={mode} onNew={reset} />}
        </div>
      )}
    </main>
  );
}
