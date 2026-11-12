import { findSpan } from "./quote-check";

export type Segment = { text: string; markId?: string };

/**
 * Splits a brief into plain and highlighted pieces, one highlight per quote.
 * Overlapping quotes keep the first one found; quotes not in the text are skipped.
 */
export function highlightSegments(text: string, marks: { id: string; quote: string }[]): Segment[] {
  const spans: { start: number; end: number; id: string }[] = [];
  for (const m of marks) {
    const s = findSpan(text, m.quote);
    if (!s) continue;
    if (spans.some((o) => s.start < o.end && o.start < s.end)) continue;
    spans.push({ ...s, id: m.id });
  }
  spans.sort((a, b) => a.start - b.start);
  const out: Segment[] = [];
  let pos = 0;
  for (const s of spans) {
    if (s.start > pos) out.push({ text: text.slice(pos, s.start) });
    out.push({ text: text.slice(s.start, s.end), markId: s.id });
    pos = s.end;
  }
  if (pos < text.length) out.push({ text: text.slice(pos) });
  return out;
}
