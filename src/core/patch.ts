import { findSpan } from "./quote-check";

export type PatchInput = { quote: string; patch: string };

/** Longest a patch may be compared with the words it replaces (keeps the Teacher to small clarifications). */
const MAX_GROWTH = 320;

export function isReasonablePatch(quote: string, patch: string): boolean {
  const p = patch.trim();
  return p.length > 0 && p.length <= quote.trim().length + MAX_GROWTH;
}

/**
 * Applies patches one by one: each replaces the exact words it quotes.
 * A patch whose words are no longer in the brief (e.g. already changed) is skipped.
 */
export function applyPatches(brief: string, patches: PatchInput[]): { text: string; applied: boolean[] } {
  let text = brief;
  const applied = patches.map((p) => {
    if (!isReasonablePatch(p.quote, p.patch)) return false;
    const span = findSpan(text, p.quote);
    if (!span) return false;
    text = text.slice(0, span.start) + p.patch.trim() + text.slice(span.end);
    return true;
  });
  return { text, applied };
}
