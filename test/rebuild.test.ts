import { describe, expect, it } from "vitest";
import { rebuildBrief } from "@/core/rebuild";
import type { Round } from "@/core/types";

const original = "Write about a famous person. Use sources. Due Friday.";
const r1: Round = {
  n: 1,
  briefBefore: original,
  loopholes: [
    { id: "a", quote: "famous person", sillyReading: "s", realQuestion: "q1", category: "scope", severity: "major" },
    { id: "b", quote: "Use sources", sillyReading: "s", realQuestion: "q2", category: "sources", severity: "major" },
    { id: "c", quote: "Write about", sillyReading: "s", realQuestion: "q3", category: "length", severity: "major" },
  ],
  patches: [
    { loopholeId: "a", patch: "historical figure", ruling: "", placement: "replace", applied: true },
    { loopholeId: "b", patch: "Use 3 sources", ruling: "", placement: "replace", applied: true },
    { loopholeId: "c", patch: "Length: 800 words.", ruling: "", placement: "append", applied: true },
  ],
  briefAfter: "",
  scoreBefore: 64,
  scoreAfter: 100,
};
const r2: Round = {
  n: 2,
  briefBefore: "",
  loopholes: [{ id: "d", quote: "historical figure", sillyReading: "s", realQuestion: "q4", category: "scope", severity: "minor" }],
  patches: [{ loopholeId: "d", patch: "real historical figure (not fictional)", ruling: "", placement: "replace", applied: true }],
  briefAfter: "",
  scoreBefore: 96,
  scoreAfter: 100,
};

describe("rebuildBrief", () => {
  it("applies every kept patch across rounds", () => {
    const { text, skipped } = rebuildBrief(original, [r1, r2], new Set());
    expect(text).toBe("Write about a real historical figure (not fictional). Use 3 sources. Due Friday.\nLength: 800 words.");
    expect(skipped).toEqual([]);
  });
  it("leaves rejected patches out", () => {
    const { text } = rebuildBrief(original, [r1], new Set(["b", "c"]));
    expect(text).toBe("Write about a historical figure. Use sources. Due Friday.");
  });
  it("skips a later patch that depended on a rejected one", () => {
    const { text, skipped } = rebuildBrief(original, [r1, r2], new Set(["a"]));
    expect(text).toBe("Write about a famous person. Use 3 sources. Due Friday.\nLength: 800 words.");
    expect(skipped).toEqual(["d"]);
  });
  it("ignores patches that never landed", () => {
    const r = { ...r1, patches: r1.patches.map((p) => (p.loopholeId === "b" ? { ...p, applied: false } : p)) };
    expect(rebuildBrief(original, [r], new Set()).text).toBe("Write about a historical figure. Use sources. Due Friday.\nLength: 800 words.");
  });
});
