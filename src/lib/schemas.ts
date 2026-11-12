import { z } from "zod/v4";
import { CATEGORIES } from "@/core/types";

/* What the AI agents must return. Every answer is checked against these. */

export const AiTranscribeSchema = z.object({
  transcription: z.string().describe("The full text of the assignment brief in the photo, word for word"),
  isAssignment: z.boolean().describe("false if the photo is clearly not an assignment or task brief"),
  title: z.string().describe("Short neutral title for the assignment, max 6 words"),
});

export const AiLawyerSchema = z.object({
  title: z.string().describe("Short neutral title for the assignment, max 6 words"),
  isAssignment: z.boolean().describe("false if the text is clearly not an assignment or task brief"),
  loopholes: z.array(
    z.object({
      quote: z.string().describe("The exact words from the brief, copied verbatim, that leave the gap"),
      sillyReading: z.string().describe("One funny, obviously absurd, harmless reading that technically fits the words. Max 20 words."),
      realQuestion: z.string().describe("The genuine question a student should ask the teacher"),
      category: z.enum(CATEGORIES),
      severity: z.enum(["major", "minor"]),
      harmless: z.boolean().describe("true only if the silly reading has nothing to do with cheating, AI tools, copying, buying work, fake sources or someone else doing the work"),
    }),
  ),
});

export const AiTeacherSchema = z.object({
  patches: z.array(
    z.object({
      loopholeId: z.string().describe("The loophole id, exactly as given"),
      placement: z
        .enum(["replace", "append"])
        .describe('"replace" to reword the quoted words; "append" to add a new short line when the brief never mentions the topic (format, length, grading, solo/group…)'),
      patch: z
        .string()
        .describe('For "replace": wording that replaces exactly the quoted words. For "append": one short labelled line, e.g. "Length: 800–1,000 words."'),
      ruling: z.string().describe("One short line in a teacher's voice, courtroom style, e.g. 'Objection sustained. 800–1,000 words.'"),
    }),
  ),
});

export const AiMessageSchema = z.object({
  subject: z.string().describe("Short email subject line"),
  body: z.string().describe("The full message, ready to send"),
});

/* What the browser sends. */

const MAX_TEXT = 12_000;
const MAX_IMAGE_BASE64 = 4_000_000; // ~3 MB image (Vercel caps requests at 4.5 MB)

export const TrialRequestSchema = z
  .object({
    text: z.string().max(MAX_TEXT).optional(),
    image: z
      .object({
        mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
        data: z.string().max(MAX_IMAGE_BASE64),
      })
      .optional(),
    mode: z.enum(["student", "teacher"]).default("student"),
  })
  .refine((v) => (v.text && v.text.trim().length >= 10) || v.image, { message: "Add the assignment brief or a photo first." });

export const MessageRequestSchema = z.object({
  title: z.string().max(200),
  tone: z.enum(["formal", "friendly"]),
  questions: z
    .array(z.object({ question: z.string().max(500), quote: z.string().max(1000).optional() }))
    .min(1)
    .max(6),
  studentName: z.string().max(80).optional(),
  teacherName: z.string().max(80).optional(),
});
