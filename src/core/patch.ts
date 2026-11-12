import { findSpan } from "./quote-check";
import type { Placement } from "./types";

export type PatchInput = { quote: string; patch: string; placement?: Placement };

/** Longest a patch may be compared with the words it replaces (keeps the Teacher to small clarifications). */
const MAX_GROWTH = 320;
/** Longest a whole new line may be. */
const MAX_APPEND = 220;

export function isReasonablePatch(quote: string, patch: string, placement: Placement = "replace"): boolean {
  const p = patch.trim();
  if (!p) return false;
  return placement === "append" ? p.length <= MAX_APPEND : p.length <= quote.trim().length + MAX_GROWTH;
}

/**
 * Applies patches one by one: "replace" swaps the exact words it quotes (skipped if
 * those words are gone); "append" adds the patch as a new line at the end.
 */
export function applyPatches(brief: string, patches: PatchInput[]): { text: string; applied: boolean[] } {
  let text = brief;
  const applied = patches.map((p) => {
    const placement = p.placement ?? "replace";
    if (!isReasonablePatch(p.quote, p.patch, placement)) return false;
    if (placement === "append") {
      text = `${text.trimEnd()}\n${p.patch.trim()}`;
      return true;
    }
    const span = findSpan(text, p.quote);
    if (!span) return false;
    text = text.slice(0, span.start) + p.patch.trim() + text.slice(span.end);
    return true;
  });
  return { text, applied };
}
