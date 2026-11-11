# PRD — Loophole Court

> **Two AIs argue over your assignment until it's airtight.** A cheeky **Student Lawyer** finds every loophole in an assignment brief ("Write about a famous person" → "My cat. Very famous on our street."). A **Teacher** patches each one. They go back and forth, live, until the brief is clear. Students walk away with the exact questions to ask; teachers walk away with a brief nobody can misread.

| | |
|---|---|
| **Hackathon** | IceHacks 2026 (CodeStarters, Devpost) — tracker HK-017 |
| **Tracks (opt into all; one win max)** | **Best AI Hack** (main: usefulness, technical depth, polish, smart use of tools, impact) · Best Deployed/Shipped App (public URL, reliability, completeness, docs) · Best Design & UX (usability, polish, accessibility, consistency) · Overall |
| **Judged on (equal)** | Technical execution · Creativity & originality · Impact & usefulness · Design & UX · Presentation |
| **Prizes** | No cash — sponsor credits, subscriptions, scholarships |
| **Hacking window** | Nov 8–15. All app code written in this window; libraries/templates credited. |
| **Deadline** | Sun Nov 15, 6:00 PM PT = **Mon Nov 16, 03:00 Lagos** |
| **Our target** | **Submit Sat Nov 14, 21:00 Lagos** (Epic AI MegaJam runs Nov 12–15) |
| **Team** | softalpha0, solo · eligibility: students 13+ |

**Instruction to the coding agent:** read `CLAUDE.md` and this file. Explain your plan in plain language and wait for approval. Build in the order of §7. Deploy as soon as one full court session works. Test, commit, then move on.

---

## 1. Why this can win

- **Creative:** a courtroom of AI agents arguing over homework instructions — funny, visual, memorable.
- **Real problem:** unclear assignment instructions are a top cause of student stress and of lost marks; teachers rarely see the ambiguity until 30 students misread the brief.
- **Technical depth:** two agents with opposing goals in a loop, structured outputs, a scoring function, live streaming, vision input, shareable report images.
- **Fits the judges:** the same organiser's previous hackathon (FireHacks) rewarded quirky names + agents doing real work (Wingman, Roadkill, Interactive Presence).
- **Checked (Nov 11):** no tool found that finds loopholes in an assignment brief to clarify it. Nearby but different: teacher-side "clear directions" generators, generic task splitters, and teachers' hidden prompt traps to catch AI cheating.

## 2. Done statement

> "Anyone opens the live link, pastes or photographs an assignment brief, and presses **Start trial**. The Student Lawyer and the Teacher argue live in a courtroom view: each loophole quotes the brief, shows the silly reading and the real question behind it; the Teacher patches it. In under a minute the **Airtight Score** climbs from, say, 34 to 92, and the verdict gives students a ready-to-send message for their teacher, gives teachers a patched brief with every change highlighted, and offers a shareable Loophole Report card."

## 3. The court session

```
Brief ──► Student Lawyer (round 1) ──► loopholes[]
             ▲                              │
             │                              ▼
   patched brief ◄──────────── Teacher patches each loophole
             │
             └──► repeat (max 3 rounds) until no "major" loopholes or score ≥ 90
                                        │
                                        ▼
                     Verdict: score before → after, questions, patched brief, report card
```

**Student Lawyer** (agent 1) — reads the brief like a mischievous lawyer.
For each loophole returns: `quote` (exact words from the brief), `sillyReading` (the absurd but technically-allowed interpretation, one line, funny), `realQuestion` (the genuine question a student should ask), `category` (length · format · sources · scope · deadline · collaboration · grading · definitions), `severity` (major / minor).

**Teacher** (agent 2) — patches each loophole with the smallest clear change: `patch` (new wording for that clause) and `ruling` (one short line, in a teacher's voice, e.g. "Objection sustained. 800–1,000 words.").

**Re-examination** — the Lawyer reads the patched brief; only new or unresolved loopholes count. Max 3 rounds.

**Airtight Score** (computed in code, not by the model): `100 − 12 × open major − 4 × open minor`, floor 0. Shown before and after.

**Rules for the agents:**
- Silly readings must be **obviously absurd and harmless**. Never suggest real cheating (AI-written work, copying, fake sources, plagiarism, getting someone else to do it). These are filtered in code and in the prompt.
- Every loophole must quote the brief exactly; loopholes without a matching quote are dropped.
- The Teacher never changes what the assignment is about — only makes it clearer.
- In **Student mode** the patches are suggestions; the output is the **questions to ask the teacher** (the real teacher decides).

## 4. Modes

| | Student mode | Teacher mode |
|---|---|---|
| Who | Student who got a vague brief | Teacher before handing a brief out |
| Main output | **"Ask your teacher" message** (2–4 most important questions, polite, formal/friendly toggle) | **Patched brief** with every change highlighted; accept/reject each patch; copy final brief |
| Shared | Loophole Report card | Loophole Report card + "before/after" brief |

## 5. Screens

1. **Home:** big title, one-line pitch, input box (paste, upload photo/PDF), 3 sample briefs ("Famous person essay", "Science project", "History presentation"), mode toggle.
2. **Courtroom:** two avatars (Lawyer, Teacher) and a judge's bench; arguments stream in as speech bubbles; each loophole is a card with quote highlighted in the brief beside it; the Airtight Score gauge animates as patches land; gavel sound on each ruling (mutable).
3. **Verdict:** score before → after, loophole count by category, the student message or the patched brief, buttons: Copy, Share report, Start a new trial.
4. **Report card** (shareable image + link): brief title, score before/after, the 3 funniest silly readings, "Tried in Loophole Court".

Design: playful courtroom theme (wood/gold accent on a clean background), big readable type, mobile-first, accessible (contrast, focus states, reduced-motion option, captions instead of sound).

## 6. MoSCoW

**Must (in order):**
- M1 **Brief input:** paste text; upload image (vision model reads printed or handwritten sheets) or PDF (pdf.js text). 3 sample briefs.
- M2 **Student Lawyer agent:** structured loopholes (Zod-validated), quote-checked against the brief, cheating-filter.
- M3 **Teacher agent:** patches + rulings; build patched brief.
- M4 **Court loop** (max 3 rounds) + **Airtight Score** function with unit tests.
- M5 **Courtroom UI** with live streaming of each turn.
- M6 **Verdict screen:** Student message (copy, tone toggle) and Teacher patched brief (diff highlight, accept/reject, copy).
- M7 **Deployed** on Vercel, rate-limited API, works on a phone, private-window tested.

**Should:**
- S1 **Shareable Loophole Report** card (OG image via `@vercel/og`, data encoded in the link — no database).
- S2 History of past trials on the device (localStorage) with delete.
- S3 Gavel/sound effects + reduced-motion and mute options.

**Could:** "Appeal" button (ask the Lawyer to try harder) · other languages · rubric upload to find loopholes between brief and rubric.
**Won't:** accounts, storing briefs on a server, writing assignments, real cheating advice.

## 7. Schedule (Lagos time)

| When | Work | Gate |
|---|---|---|
| **Wed Nov 11, now → 19:00** | Setup, M1, M2, M3, M4 (logic + tests), basic page; **first deploy** | A sample brief goes through the full loop on the live URL with a score |
| Thu Nov 12, evening (2 h) | M5 courtroom UI with streaming, M6 verdict | Looks like a courtroom; both modes produce output |
| Fri Nov 13, evening (2 h) | M7 polish (phone, rate limit, errors), S1 report card, S2 if time. **Feature freeze 22:00** | Works on a phone; share card renders |
| **Sat Nov 14** | Record video (§10), Devpost write-up, final README, **submit by 21:00** | Devpost confirmation |
| Sun Nov 15 | Buffer (MegaJam submission day) | — |

Stuck 30 minutes → simplify, or ask Claude with a screenshot.

## 8. Tech

- **Next.js (App Router) + TypeScript + Tailwind**, deployed on **Vercel** (mention DeployXA if used).
- **AI:** one model with vision and structured output (Claude via `ANTHROPIC_API_KEY`, or OpenAI via `OPENAI_API_KEY`), called from server routes; responses streamed to the page (Vercel AI SDK or server-sent events).
- **Validation:** Zod schemas for `Loophole`, `Patch`, `Round`. Invalid output → retry once → friendly error.
- **Quote check:** normalise whitespace/case; drop loopholes whose `quote` isn't in the current brief.
- **Cheating filter:** keyword + model self-check on `sillyReading`; drop anything about AI-writing, copying, buying, fake citations, or someone else doing the work.
- **Score:** pure function in `src/core/score.ts` with Vitest tests.
- **Diff:** `diff` (jsdiff) for the patched brief highlight.
- **Rate limit:** per-IP limit on API routes (e.g. 10 trials/hour) so the public link can't drain the key.
- **Storage:** none on the server; localStorage for history; share links carry compressed data.

```ts
type Loophole = { id: string; quote: string; sillyReading: string; realQuestion: string;
  category: 'length'|'format'|'sources'|'scope'|'deadline'|'collaboration'|'grading'|'definitions';
  severity: 'major'|'minor' };
type Patch = { loopholeId: string; patch: string; ruling: string };
type Round = { n: number; loopholes: Loophole[]; patches: Patch[]; briefAfter: string; score: number };
```

**Repo layout**
```
loophole-court/
  app/            page.tsx (home), court/page.tsx, api/lawyer, api/teacher, api/report (OG image)
  src/core/       score.ts, quote-check.ts, filter.ts, loop.ts   ← pure functions + tests
  src/prompts/    lawyer.ts, teacher.ts
  samples/        3 sample briefs (written by us)
  test/
```

## 9. Submission (Devpost — all required)

- **Demo video** (public YouTube, ≤ 3 min) — no working link = not judged.
- **Write-up:** what it does · how we built it · challenges · what we learned · what's next.
- **Code + live link:** public GitHub repo and the Vercel URL.
- **Built with:** Next.js, TypeScript, Tailwind, Vercel, Claude/OpenAI (vision + structured output), Zod, pdf.js, jsdiff, @vercel/og, Vitest, Claude Code (AI coding assistant). Credit every library/template.
- **AI disclosure:** built with Claude Code; the app runs two AI agents. Be ready to explain every part.
- **Tracks:** Best AI Hack, Best Deployed/Shipped App, Best Design & UX.
- **Tagline:** "Two AIs argue over your assignment until it's airtight."

## 10. Demo video (aim 2:15)

| Time | Show |
|---|---|
| 0:00–0:15 | Brief on screen: "Write about a famous person. Use sources. Due Friday." Lawyer bubble: "My cat. Very famous on our street." Gavel. Title. |
| 0:15–0:35 | The problem: unclear briefs → stress, wrong work, lost marks; teachers only find out after grading |
| 0:35–1:20 | Live trial: 5 loopholes, Teacher patches, score 34 → 92 |
| 1:20–1:40 | Student verdict: message to the teacher, copy |
| 1:40–2:00 | Teacher mode: patched brief with highlights; share report card |
| 2:00–2:15 | How it's built (two agents, loop, score), live link |

## 11. Risks

| Risk | Fallback |
|---|---|
| Agents produce real cheating ideas | Prompt rules + code filter + quote check; sample briefs tested before recording |
| Loop is slow | Stream every turn; cap 3 rounds; small max tokens per turn |
| No AI credits | Use whichever key works; keep calls small; samples cached for the demo |
| Photo reading fails | Paste path always works |
| MegaJam overlap | Musts M1–M4 + deploy today; Shoulds optional |
| Judges can't open it | Test the live URL in a private window and on a phone; "Try a sample" needs no upload |
