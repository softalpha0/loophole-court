import { describe, expect, it } from "vitest";
import { highlightSegments } from "@/core/highlight";

const brief = "Write about a famous person. Use sources. Due Friday.";

describe("highlightSegments", () => {
  it("marks each quote in order and keeps all the text", () => {
    const segs = highlightSegments(brief, [
      { id: "b", quote: "Due Friday" },
      { id: "a", quote: "famous person" },
    ]);
    expect(segs.map((s) => s.text).join("")).toBe(brief);
    expect(segs.filter((s) => s.markId).map((s) => [s.markId, s.text])).toEqual([
      ["a", "famous person"],
      ["b", "Due Friday"],
    ]);
  });
  it("skips quotes that aren't in the text and overlapping ones", () => {
    const segs = highlightSegments(brief, [
      { id: "a", quote: "a famous person" },
      { id: "b", quote: "famous" },
      { id: "c", quote: "10 sources" },
    ]);
    expect(segs.filter((s) => s.markId).map((s) => s.markId)).toEqual(["a"]);
  });
  it("returns the whole text when there is nothing to mark", () => {
    expect(highlightSegments(brief, [])).toEqual([{ text: brief }]);
  });
});
