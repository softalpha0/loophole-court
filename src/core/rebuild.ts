import { applyPatches } from "./patch";
import type { Round } from "./types";

/**
 * Rebuilds the final brief from the original, applying only the patches the
 * teacher kept. Later patches that depended on a rejected one may no longer fit;
 * those are reported as skipped.
 */
export function rebuildBrief(original: string, rounds: Round[], rejected: Set<string>) {
  let text = original;
  const skipped: string[] = [];
  for (const r of rounds) {
    const kept = r.patches.filter((p) => p.applied && !rejected.has(p.loopholeId));
    const inputs = kept.map((p) => ({
      quote: r.loopholes.find((l) => l.id === p.loopholeId)?.quote ?? "",
      patch: p.patch,
      placement: p.placement,
    }));
    const res = applyPatches(text, inputs);
    res.applied.forEach((ok, i) => !ok && skipped.push(kept[i].loopholeId));
    text = res.text;
  }
  return { text, skipped };
}
