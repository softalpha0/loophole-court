import { describe, expect, it } from "vitest";
import { applyPatches, isReasonablePatch } from "@/core/patch";

const brief = "Write about a famous person. Use sources. Due Friday.";

describe("applyPatches", () => {
  it("replaces exactly the quoted words", () => {
    const r = applyPatches(brief, [{ quote: "Use sources", patch: "Use at least 3 sources (books or news sites)" }]);
    expect(r.text).toBe("Write about a famous person. Use at least 3 sources (books or news sites). Due Friday.");
    expect(r.applied).toEqual([true]);
  });
  it("applies several patches in order", () => {
    const r = applyPatches(brief, [
      { quote: "famous person", patch: "historical or public figure" },
      { quote: "Due Friday", patch: "Due Friday 14 Nov by 9am on Google Classroom" },
    ]);
    expect(r.text).toBe("Write about a historical or public figure. Use sources. Due Friday 14 Nov by 9am on Google Classroom.");
    expect(r.applied).toEqual([true, true]);
  });
  it("skips a patch whose words are gone", () => {
    const r = applyPatches(brief, [
      { quote: "Use sources. Due Friday", patch: "Use 3 sources. Due 14 Nov" },
      { quote: "Due Friday", patch: "Due Monday" },
    ]);
    expect(r.applied).toEqual([true, false]);
  });
  it("skips empty or huge patches", () => {
    expect(isReasonablePatch("Use sources", "")).toBe(false);
    expect(isReasonablePatch("Use sources", "x".repeat(500))).toBe(false);
    expect(applyPatches(brief, [{ quote: "Use sources", patch: "  " }]).applied).toEqual([false]);
  });
});

describe("append patches", () => {
  it("adds a new line at the end instead of touching the quoted words", () => {
    const r = applyPatches("English – Essay\nWrite about a famous person.", [
      { quote: "English – Essay", patch: "Length: 800–1,000 words.", placement: "append" },
      { quote: "English – Essay", patch: "Format: typed, double-spaced.", placement: "append" },
    ]);
    expect(r.text).toBe("English – Essay\nWrite about a famous person.\nLength: 800–1,000 words.\nFormat: typed, double-spaced.");
    expect(r.applied).toEqual([true, true]);
  });
  it("mixes replace and append", () => {
    const r = applyPatches(brief, [
      { quote: "Use sources", patch: "Use at least 3 sources", placement: "replace" },
      { quote: "Write about", patch: "Work alone.", placement: "append" },
    ]);
    expect(r.text).toBe("Write about a famous person. Use at least 3 sources. Due Friday.\nWork alone.");
  });
  it("rejects an over-long appended line", () => {
    expect(isReasonablePatch("x", "y".repeat(300), "append")).toBe(false);
  });
});
