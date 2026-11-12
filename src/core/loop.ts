import { isHarmless } from "./filter";
import { applyPatches } from "./patch";
import { quoteIsInSource } from "./quote-check";
import { airtightScore, isAirtight } from "./score";
import type { Category, Loophole, Patch, Placement, Round, Severity } from "./types";

/** What the AI agents return before our code checks it. */
export type RawLoophole = { quote: string; sillyReading: string; realQuestion: string; category: Category; severity: Severity };
export type RawPatch = { loopholeId: string; patch: string; ruling: string; placement?: Placement };

export type Agents = {
  lawyer: (brief: string, round: number, previous: Round[]) => Promise<RawLoophole[]>;
  teacher: (brief: string, loopholes: Loophole[]) => Promise<RawPatch[]>;
};

export type TrialEvent =
  | { type: "lawyer"; round: number; loopholes: Loophole[]; score: number; dropped: number }
  | { type: "teacher"; round: number; patches: Patch[]; briefAfter: string; score: number }
  | { type: "done"; result: TrialResult };

export type TrialResult = {
  originalBrief: string;
  finalBrief: string;
  rounds: Round[];
  scoreBefore: number;
  scoreAfter: number;
  openLoopholes: Loophole[];
};

const MAX_PER_ROUND = [8, 5, 5];

/** A loophole must point at specific words, not most of the brief. */
export function isFocusedQuote(quote: string, brief: string): boolean {
  const q = quote.trim().length;
  const b = brief.trim().length;
  return q <= 200 && !(q > 40 && q > 0.6 * b);
}

export function questionKey(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Keep only loopholes that quote the brief exactly, are harmless, and aren't repeats
 * (repeats = asked twice this round, or already patched in an earlier round).
 */
export function cleanLoopholes(raw: RawLoophole[], brief: string, round: number, patchedQuestions: Set<string>) {
  const kept: Loophole[] = [];
  const thisRound = new Set<string>();
  for (const l of raw) {
    if (kept.length >= (MAX_PER_ROUND[round - 1] ?? 5)) break;
    if (!l.quote?.trim() || !l.sillyReading?.trim() || !l.realQuestion?.trim()) continue;
    if (!quoteIsInSource(l.quote, brief) || !isFocusedQuote(l.quote, brief)) continue;
    if (!isHarmless(l.sillyReading) || !isHarmless(l.quote + " " + l.sillyReading)) continue;
    const key = questionKey(l.realQuestion);
    if (patchedQuestions.has(key) || thisRound.has(key)) continue;
    thisRound.add(key);
    kept.push({ ...l, quote: l.quote.trim(), id: `r${round}-${kept.length + 1}` });
  }
  return { kept, dropped: raw.length - kept.length };
}

/**
 * The court session: Lawyer finds loopholes, Teacher patches them, repeat on the
 * patched brief until airtight or 3 rounds. Every step is reported through `emit`.
 */
export async function runTrial(
  brief: string,
  agents: Agents,
  emit: (e: TrialEvent) => void = () => {},
  maxRounds = 3,
): Promise<TrialResult> {
  const rounds: Round[] = [];
  const patchedQuestions = new Set<string>();
  let current = brief;
  let open: Loophole[] = [];

  for (let n = 1; n <= maxRounds; n++) {
    const raw = await agents.lawyer(current, n, rounds);
    const { kept, dropped } = cleanLoopholes(raw, current, n, patchedQuestions);
    const scoreBefore = airtightScore(kept);
    emit({ type: "lawyer", round: n, loopholes: kept, score: scoreBefore, dropped });

    if (kept.length === 0) {
      open = [];
      break;
    }

    const rawPatches = await agents.teacher(current, kept);
    const byId = new Map(rawPatches.map((p) => [p.loopholeId, p]));
    const ordered = kept.map((l) => ({ loophole: l, raw: byId.get(l.id) }));
    const { text, applied } = applyPatches(
      current,
      ordered.map((o) => ({ quote: o.loophole.quote, patch: o.raw?.patch ?? "", placement: o.raw?.placement ?? "replace" })),
    );
    const patches: Patch[] = ordered
      .filter((o) => o.raw)
      .map((o) => ({
        loopholeId: o.loophole.id,
        patch: o.raw!.patch.trim(),
        ruling: o.raw!.ruling.trim(),
        placement: o.raw!.placement ?? "replace",
        applied: applied[kept.indexOf(o.loophole)],
      }));
    open = kept.filter((_, i) => !applied[i]);
    kept.forEach((l, i) => applied[i] && patchedQuestions.add(questionKey(l.realQuestion)));
    const scoreAfter = airtightScore(open);
    rounds.push({ n, briefBefore: current, loopholes: kept, patches, briefAfter: text, scoreBefore, scoreAfter });
    emit({ type: "teacher", round: n, patches, briefAfter: text, score: scoreAfter });
    current = text;

    if (isAirtight(kept)) break; // what was left was only small stuff, now patched
  }

  const result: TrialResult = {
    originalBrief: brief,
    finalBrief: current,
    rounds,
    scoreBefore: rounds[0]?.scoreBefore ?? 100,
    scoreAfter: rounds.length ? airtightScore(open) : 100,
    openLoopholes: open,
  };
  emit({ type: "done", result });
  return result;
}
