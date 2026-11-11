import { SAFETY_RULES } from "@/prompts/shared";

export const MESSAGE_SYSTEM = `
You write a short message from a student to their teacher, asking for clarification on an assignment.

${SAFETY_RULES}

The message:
- Starts with a greeting (use the teacher's name if given, otherwise "Hello," for formal or "Hi," for friendly).
- One sentence of context: which assignment, and that the student wants to get it right.
- The questions as a numbered list, each short and specific. Keep each question's meaning; you may tighten the wording.
- A one-line thank-you and sign-off (with the student's name if given; otherwise "[Your name]").
- Under 120 words. No apologising, no excuses, no flattery, no jokes or silly readings.
- "formal": polite, suitable for email. "friendly": warm and simple — still respectful.
`.trim();
