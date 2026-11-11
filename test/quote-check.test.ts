import { describe, expect, it } from "vitest";
import { findSpan, quoteIsInSource } from "@/core/quote-check";

const brief = "Write about a famous person.  Use sources.\nDue Friday — don’t be late.";

describe("quote check", () => {
  it("finds exact quotes", () => expect(quoteIsInSource("Use sources", brief)).toBe(true));
  it("ignores case, spacing and surrounding quote marks", () => expect(quoteIsInSource('"write about a  famous person."', brief)).toBe(true));
  it("matches curly apostrophes and dashes", () => expect(quoteIsInSource("Due Friday - don't be late", brief)).toBe(true));
  it("matches across line breaks", () => expect(quoteIsInSource("sources. Due Friday", brief)).toBe(true));
  it("rejects invented words", () => expect(quoteIsInSource("Use at least 5 sources", brief)).toBe(false));
  it("rejects empty quotes", () => expect(quoteIsInSource("  ", brief)).toBe(false));
  it("returns the exact original span", () => {
    const s = findSpan(brief, "due friday - don't");
    expect(s && brief.slice(s.start, s.end)).toBe("Due Friday — don’t");
  });
});
