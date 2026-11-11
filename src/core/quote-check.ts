/**
 * Every loophole must quote the brief exactly. These helpers find a quote in the
 * brief while ignoring case, spacing and curly-vs-straight quotes, and return
 * WHERE it is so a patch can replace exactly those words.
 */

const CHAR_MAP: Record<string, string> = {
  "‘": "'", "’": "'", "‛": "'", "`": "'", "´": "'",
  "“": '"', "”": '"', "‟": '"',
  "–": "-", "—": "-", "−": "-",
};

function normChar(c: string): string {
  return (CHAR_MAP[c] ?? c).toLowerCase();
}

function trimQuote(q: string): string {
  return q.trim().replace(/^["'“”‘’]+/, "").replace(/["'“”‘’]+$/, "").replace(/[.…]+$/, "").trim();
}

/** Position of `quote` inside `source`, or null if it isn't really there. */
export function findSpan(source: string, quote: string): { start: number; end: number } | null {
  const q = trimQuote(quote);
  if (q.length < 2) return null;
  const exact = source.indexOf(q);
  if (exact >= 0) return { start: exact, end: exact + q.length };

  // Build a normalised copy of the source, remembering where each character came from.
  const map: number[] = [];
  let norm = "";
  let lastSpace = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (/\s/.test(ch)) {
      if (!lastSpace) {
        norm += " ";
        map.push(i);
      }
      lastSpace = true;
    } else {
      norm += normChar(ch);
      map.push(i);
      lastSpace = false;
    }
  }
  const nq = [...q.replace(/\s+/g, " ")].map(normChar).join("");
  const at = norm.indexOf(nq);
  if (at < 0) return null;
  return { start: map[at], end: map[at + nq.length - 1] + 1 };
}

export function quoteIsInSource(quote: string, source: string): boolean {
  return findSpan(source, quote) !== null;
}
