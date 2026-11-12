export const CATEGORIES = ["length", "format", "sources", "scope", "deadline", "collaboration", "grading", "definitions"] as const;
export type Category = (typeof CATEGORIES)[number];
export type Severity = "major" | "minor";

export type Loophole = {
  id: string;
  quote: string;
  sillyReading: string;
  realQuestion: string;
  category: Category;
  severity: Severity;
};

/** "replace" swaps the quoted words; "append" adds a new line (for things the brief never mentions). */
export type Placement = "replace" | "append";
export type Patch = { loopholeId: string; patch: string; ruling: string; placement: Placement; applied: boolean };

export type Round = {
  n: number;
  briefBefore: string;
  loopholes: Loophole[];
  patches: Patch[];
  briefAfter: string;
  scoreBefore: number; // score of the brief as the Lawyer found it this round
  scoreAfter: number; // score once this round's patches landed
};

export type Mode = "student" | "teacher";
