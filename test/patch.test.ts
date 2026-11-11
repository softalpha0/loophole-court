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
