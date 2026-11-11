import { describe, expect, it } from "vitest";
import { airtightScore, isAirtight } from "@/core/score";

const major = { severity: "major" as const };
const minor = { severity: "minor" as const };

describe("airtightScore", () => {
  it("is 100 with no open loopholes", () => expect(airtightScore([])).toBe(100));
  it("takes 12 per major and 4 per minor", () => expect(airtightScore([major, major, minor])).toBe(72));
  it("never goes below 0", () => expect(airtightScore(Array(20).fill(major))).toBe(0));
});

describe("isAirtight", () => {
  it("is false while any major is open", () => expect(isAirtight([major])).toBe(false));
  it("is true with two minors (92)", () => expect(isAirtight([minor, minor])).toBe(true));
  it("is false with three minors (88)", () => expect(isAirtight([minor, minor, minor])).toBe(false));
});
