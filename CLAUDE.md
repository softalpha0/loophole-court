# Project: Loophole Court

Problem: Assignment briefs are full of unclear bits; students stress and lose marks, and teachers only find out after grading.
User: Students with a vague brief (Student mode) and teachers before handing a brief out (Teacher mode).
Done statement: Paste or photograph a brief → a Student Lawyer agent finds loopholes (quoted, with a silly reading and the real question), a Teacher agent patches them, up to 3 rounds; the Airtight Score rises; the verdict gives students a message for their teacher and teachers a patched brief with highlights.
Must-have features (in order): M1 brief input + samples · M2 Lawyer agent · M3 Teacher agent · M4 loop + Airtight Score (tested) · M5 courtroom UI with streaming · M6 verdict (both modes) · M7 deployed, rate-limited, phone-friendly.
Should/Could: see PRD.md §6 — only after every Must works and is deployed.
Tools: Next.js (App Router) + TypeScript + Tailwind, Vercel, one vision + structured-output AI model via server routes, Zod, pdf.js, jsdiff, Vitest.

Rules:
- Full spec in PRD.md. Read it before planning.
- Plan first; wait for my approval before writing code.
- I'm not a developer. Explain in plain language, and explain errors before fixing them.
- Build one feature at a time; tell me how to test it and how to try to break it; commit after each feature that works. Deploy as soon as one full trial works.
- Hackathon rule: all app code is written during the event (Nov 8–15). Credit every library and template in the README.
- Silly readings must be obviously absurd and harmless. Never output real cheating ideas (AI-written work, copying, buying work, fake sources). Filter in the prompt AND in code.
- Every loophole must quote the brief exactly; drop it otherwise. The Teacher only clarifies, never changes what the assignment is about.
- Airtight Score is computed in code (src/core/score.ts), not by the model. Pure functions in src/core have Vitest tests.
- Validate every AI response with Zod; retry once, then show a friendly error. Stream turns to the page.
- API keys only in .env.local; keep .env.example updated; never commit keys. Rate-limit API routes.
- No accounts, no server storage. localStorage for history, with delete.
- Mobile-first, accessible: contrast, focus states, reduced motion, mute.
- Feature freeze: Fri Nov 13, 22:00 Lagos. Submit Sat Nov 14, 21:00 Lagos.
- Add anything important you learn about the project here.

## Learned while building
- Started from Ask First (same author, written Nov 11 during the event): reused input (text/photo/PDF), `src/lib/ai.ts` (Zod structured output via `beta.messages.parse`, 1 retry, friendly errors, server-side refusal fallback), rate limit, teacher message.
- Model from `ANTHROPIC_MODEL` (default `claude-opus-5-5`); `claude-sonnet-5-5` is faster if trials feel slow.
- Core is pure + tested (`npm test`): `src/core/score.ts`, `quote-check.ts` (findSpan returns exact positions), `filter.ts` (cheating regexes), `patch.ts` (replace quoted words; skip if gone or patch too long), `loop.ts` (runTrial with injected agents; max 3 rounds; stops when airtight).
- Repeats: a question counts as a repeat only if it was already PATCHED, or asked twice in the same round; unpatched loopholes may be raised again.
- Final score assumes applied patches closed their loopholes (no extra Lawyer call after round 3).
- `/api/trial` streams newline-delimited JSON events (start, title, lawyer, teacher, done, error); `maxDuration = 300`. Photos are transcribed first (vision), then the loop runs on the text.
- Rate limits: 10 trials/hour/IP (`TRIALS_PER_HOUR`), 20 messages/10 min.
- Commits: author softalpha0 <softonchain@gmail.com> only; Claude credited in README.
