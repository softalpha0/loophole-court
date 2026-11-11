import { describe, expect, it } from "vitest";
import { isHarmless } from "@/core/filter";

describe("cheating filter", () => {
  it.each([
    "My cat. Very famous on our street.",
    "A 1-word essay: 'Napoleon.' Short, but technically about a famous person.",
    "I'll hand it in on Friday... in the year 2090.",
    "Sources: my own memory, which is a very reliable source of things I remember.",
  ])("keeps harmless silly reading: %s", (t) => expect(isHarmless(t)).toBe(true));

  it.each([
    "Just ask ChatGPT to write it.",
    "Let an AI write the whole thing.",
    "Copy it from Wikipedia word for word.",
    "Pay someone online to do it.",
    "Buy an essay from a website.",
    "Make up fake sources that sound real.",
    "Get my older sister to write it for me.",
    "Plagiarise last year's winner.",
  ])("drops cheating idea: %s", (t) => expect(isHarmless(t)).toBe(false));
});
