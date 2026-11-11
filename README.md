# Loophole Court ⚖️

**Two AIs argue over your assignment until it's airtight.**

A cheeky **Student Lawyer** finds every loophole in an assignment brief. A **Teacher** patches each one. They go back and forth, live, until nobody can misread it.

> **Brief:** "Write about a famous person."
> **Student Lawyer:** "My cat. Very famous on our street."
> **Teacher:** "Objection sustained. A historical or public figure, approved by me by Monday."

![Loophole Court](docs/screenshots/trial.gif)
_Add a GIF of a live trial._

- **Live app:** _add link_ — try a sample brief, no upload needed
- **Demo video:** _add link_
- Built solo at **IceHacks 2026**.

---

## The problem

"Use sources." How many? Which kind? "Due Friday." 9 AM or midnight? Unclear instructions are one of the biggest causes of homework stress, and students often only learn what was expected when the grade comes back. Teachers rarely see the gaps until 30 students read the brief 30 different ways.

## How it works

1. **Paste or photograph** an assignment brief (or pick a sample).
2. **The trial begins.** The Student Lawyer quotes each unclear part, shows the silly-but-technically-allowed reading, and the real question behind it.
3. **The Teacher patches it.** Each ruling makes the brief clearer without changing the task.
4. **Re-examination.** The Lawyer checks the patched brief again, up to 3 rounds.
5. **Verdict.** Watch the **Airtight Score** climb, then:
   - **Students** get a short, polite message with the questions to ask their teacher.
   - **Teachers** get the patched brief with every change highlighted.
6. **Share** the Loophole Report card.

Loophole Court never writes assignments and never suggests real cheating. The silly readings are just that: silly.

## Features

_Mark honestly what works in the submitted version._

| Feature | Status |
|---|---|
| Paste, photo or PDF input + sample briefs | ⬜ |
| Student Lawyer agent (quoted loopholes) | ⬜ |
| Teacher agent (patches and rulings) | ⬜ |
| Multi-round trial with Airtight Score | ⬜ |
| Live courtroom view | ⬜ |
| Student verdict: message to your teacher | ⬜ |
| Teacher verdict: patched brief with highlights | ⬜ |
| Shareable Loophole Report card | ⬜ |
| Trial history on your device | ⬜ |

## How it's built

- Two AI agents with opposite goals in a loop, using structured output validated with Zod.
- Every loophole must quote the brief exactly, or it's thrown out.
- A code filter blocks anything that looks like real cheating advice.
- The **Airtight Score** is calculated in code from the open loopholes (major −12, minor −4), not guessed by the model.

**Built with:** Next.js · TypeScript · Tailwind CSS · Vercel · Claude (Anthropic, vision + structured output) · Zod · pdf.js · jsdiff · Vitest

**AI disclosure:** built with the help of an AI coding assistant (Claude Code). The app itself runs two AI agents.

## Privacy

No accounts. Briefs are sent to the AI model to run the trial and are not stored by Loophole Court. Your trial history stays in your browser, and you can delete it.

## Run it locally

```bash
git clone https://github.com/softalpha0/loophole-court.git
cd loophole-court
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
npm test        # 37 tests for the score, quote check, cheating filter, patches and court loop
```

## What's next

Rubric vs brief loopholes · class-wide Teacher mode · more languages.

## Credits

| Library / template | Used for |
|---|---|
| [create-next-app](https://nextjs.org) (Next.js 15) | Project template and framework |
| [Tailwind CSS](https://tailwindcss.com) | Styling |
| [@anthropic-ai/sdk](https://github.com/anthropics/anthropic-sdk-typescript) | Calling Claude |
| [Zod](https://zod.dev) | Checking every AI answer |
| [pdf.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`) | Reading PDFs in the browser |
| [jsdiff](https://github.com/kpdecker/jsdiff) (`diff`) | Highlighting changes in the patched brief |
| [Vitest](https://vitest.dev) | Tests |
| [Geist](https://vercel.com/font) | Font |

Parts of the input, AI-calling and rate-limit code come from my own earlier project [Ask First](https://github.com/softalpha0/Ask-First), written during this same hackathon week.

## Team

[softalpha0](https://github.com/softalpha0) — solo builder

## Contributors

| | Role |
|---|---|
| [softalpha0](https://github.com/softalpha0) | Idea, product, design decisions, testing |
| [Claude](https://claude.com/claude-code) (Claude Code, AI coding assistant) | Pair-programmed the code under softalpha0's direction |

## License

[MIT](./LICENSE)
