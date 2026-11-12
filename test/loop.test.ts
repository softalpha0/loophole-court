import { describe, expect, it, vi } from "vitest";
import { runTrial, type Agents, type RawLoophole, type TrialEvent } from "@/core/loop";

const BRIEF = "Write about a famous person. Use sources. Due Friday.";
const L = (quote: string, severity: "major" | "minor" = "major", silly = "My cat. Very famous on our street."): RawLoophole => ({
  quote, severity, sillyReading: silly, realQuestion: `What does "${quote}" mean?`, category: "scope",
});

/** Teacher that patches every loophole by appending a clarification. */
const patchAll: Agents["teacher"] = async (_b, ls) =>
  ls.map((l) => ({ loopholeId: l.id, patch: `${l.quote} (clarified)`, ruling: "Objection sustained." }));

describe("runTrial", () => {
  it("raises the score as the Teacher patches loopholes", async () => {
    const lawyer = vi.fn<Agents["lawyer"]>()
      .mockResolvedValueOnce([L("famous person"), L("Use sources"), L("Due Friday", "minor")])
      .mockResolvedValueOnce([]);
    const r = await runTrial(BRIEF, { lawyer, teacher: patchAll });
    expect(r.scoreBefore).toBe(100 - 12 * 2 - 4);
    expect(r.scoreAfter).toBe(100);
    expect(r.finalBrief).toContain("famous person (clarified)");
    expect(lawyer).toHaveBeenCalledTimes(2);
    expect(lawyer.mock.calls[1][0]).toBe(r.rounds[0].briefAfter); // round 2 reads the patched brief
  });

  it("never runs more than 3 rounds", async () => {
    let i = 0;
    const lawyer: Agents["lawyer"] = async (b) => [{ ...L(b.split(" ").slice(0, 2).join(" ")), realQuestion: `Question ${i++}?` }];
    const r = await runTrial(BRIEF, { lawyer, teacher: patchAll });
    expect(r.rounds.length).toBe(3);
  });

  it("stops early when only small things remain", async () => {
    const lawyer = vi.fn<Agents["lawyer"]>().mockResolvedValue([L("Due Friday", "minor")]);
    const r = await runTrial(BRIEF, { lawyer, teacher: patchAll });
    expect(r.rounds.length).toBe(1);
    expect(lawyer).toHaveBeenCalledTimes(1);
  });

  it("drops loopholes with invented quotes or cheating ideas", async () => {
    const events: TrialEvent[] = [];
    const lawyer = vi.fn<Agents["lawyer"]>()
      .mockResolvedValueOnce([L("Use at least 10 sources"), L("Use sources", "major", "Just copy it from Wikipedia."), L("famous person")])
      .mockResolvedValue([]);
    await runTrial(BRIEF, { lawyer, teacher: patchAll }, (e) => events.push(e));
    const first = events.find((e) => e.type === "lawyer");
    expect(first && first.type === "lawyer" && first.loopholes.map((l) => l.quote)).toEqual(["famous person"]);
    expect(first && first.type === "lawyer" && first.dropped).toBe(2);
  });

  it("keeps unpatched loopholes open, and lets the Lawyer raise them again", async () => {
    const lawyer = vi.fn<Agents["lawyer"]>()
      .mockResolvedValueOnce([L("famous person"), L("Use sources")])
      .mockResolvedValue([L("Use sources")]); // re-raised because it's still unclear
    // This Teacher refuses to patch "Use sources".
    const teacher: Agents["teacher"] = async (_b, ls) =>
      ls.filter((l) => l.quote !== "Use sources").map((l) => ({ loopholeId: l.id, patch: "historical figure", ruling: "Sustained." }));
    const r = await runTrial(BRIEF, { lawyer, teacher });
    expect(r.rounds.length).toBe(3);
    expect(r.openLoopholes.map((l) => l.quote)).toEqual(["Use sources"]);
    expect(r.scoreAfter).toBe(88);
  });

  it("doesn't count an already-patched question twice", async () => {
    const lawyer = vi.fn<Agents["lawyer"]>()
      .mockResolvedValueOnce([L("famous person")])
      .mockResolvedValueOnce([{ ...L("Use sources"), realQuestion: 'What does "famous person" mean?' }])
      .mockResolvedValue([]);
    const events: TrialEvent[] = [];
    await runTrial(BRIEF, { lawyer, teacher: patchAll }, (e) => events.push(e));
    const second = events.filter((e) => e.type === "lawyer")[1];
    expect(second.type === "lawyer" && second.loopholes.length).toBe(0);
  });

  it("emits lawyer, teacher and done events in order", async () => {
    const events: string[] = [];
    const lawyer = vi.fn<Agents["lawyer"]>().mockResolvedValueOnce([L("famous person")]).mockResolvedValue([]);
    await runTrial(BRIEF, { lawyer, teacher: patchAll }, (e) => events.push(`${e.type}`));
    expect(events).toEqual(["lawyer", "teacher", "lawyer", "done"]);
  });

  it("handles a brief with no loopholes", async () => {
    const r = await runTrial(BRIEF, { lawyer: async () => [], teacher: patchAll });
    expect(r.scoreBefore).toBe(100);
    expect(r.scoreAfter).toBe(100);
    expect(r.rounds).toEqual([]);
  });
});

describe("quote focus", () => {
  it("drops a loophole that quotes (almost) the whole brief", async () => {
    const { isFocusedQuote } = await import("@/core/loop");
    const brief = "English – Essay\nWrite about a famous person. Use sources. Due Friday.";
    expect(isFocusedQuote("Write about a famous person. Use sources. Due Friday.", brief)).toBe(false);
    expect(isFocusedQuote("Write about a famous person", brief)).toBe(true);
    expect(isFocusedQuote("Essay", brief)).toBe(true);
  });

  it("lands append patches in the loop and reports their placement", async () => {
    const lawyer = vi.fn<Agents["lawyer"]>().mockResolvedValueOnce([{ ...L("Write about"), category: "length" }]).mockResolvedValue([]);
    const teacher: Agents["teacher"] = async (_b, ls) => [{ loopholeId: ls[0].id, patch: "Length: 800–1,000 words.", ruling: "Sustained.", placement: "append" }];
    const r = await runTrial(BRIEF, { lawyer, teacher });
    expect(r.finalBrief).toBe(`${BRIEF}\nLength: 800–1,000 words.`);
    expect(r.rounds[0].patches[0]).toMatchObject({ placement: "append", applied: true });
  });
});
