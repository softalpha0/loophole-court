import type { Loophole } from "./types";

/** Airtight Score: 100 − 12 × open major − 4 × open minor, never below 0. Computed in code, not by the AI. */
export function airtightScore(open: Pick<Loophole, "severity">[]): number {
  const majors = open.filter((l) => l.severity === "major").length;
  const minors = open.length - majors;
  return Math.max(0, 100 - 12 * majors - 4 * minors);
}

/** The trial stops early once the brief is good enough. */
export function isAirtight(open: Pick<Loophole, "severity">[]): boolean {
  return airtightScore(open) >= 90 && !open.some((l) => l.severity === "major");
}
