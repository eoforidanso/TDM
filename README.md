# Board Prep

A study app with 600 clinical questions across 38 topics and 17 specialties.
300 were extracted from `Pipi.pdf`, a 240-page Google Forms export. 300 more
(ids 300–599) are original USMLE Step 2 CK–style questions, thirty each in
endocrinology, urology, musculoskeletal, dermatology, rheumatology, allergy &
immunology, communication & professionalism, nephrology & GU, hematology &
palliative care, and oncology. Their source files are in `tools/specialties/`
(files 01–10 are ids 300–399, files 11–20 are ids 400–599);
`python3 tools/add_specialties.py` (run from `tools/`) rebuilds them into the bank.
These 300 have not been clinically reviewed.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static bundle in dist/
```

No backend. All progress lives in the browser's `localStorage`.

## What it does

**Study modes**

- **Tutor** — answer, see the explanation and why each distractor is wrong, move on.
- **Exam** — no feedback until the end, then a scored report broken down by topic.
- **Spaced review** — an SM-2 style queue. Questions you get right come back at
  growing intervals (1 day, 3 days, then × ease); questions you miss drop straight
  back into today's queue and lose ease.
- **Mistake drill** — every question whose most recent answer was wrong.
- **Flagged** — anything you starred while working through a set.
- **Mock exam** — 50 random questions in exam mode.

**Building a set** — filter by specialty or individual topic, choose length,
and draw from everything / not-yet-seen / previously-missed.

**Question bank** — full-text search over every stem, option and explanation,
with hit highlighting. Any search result set can be turned into a quiz.

**Progress** — per-topic mastery, weakest topics, a three-week activity chart,
specialty coverage, session history, and JSON export of your progress.

**Keyboard** — `A`–`J` or `1`–`9` to pick, `Enter` to check then advance,
`←`/`→` to move between questions, `F` to flag.

## Notes on the questions

- **Multi-select is handled properly.** 149 of the 300 questions ask for several
  answers ("Select 3", "Select ALL that apply"). Grading requires the exact set,
  and partial results are reported as "2 of 4 correct".
- **Option labels follow the source.** Some quizzes label options `A`–`E` and
  others `1`–`10`; explanations reference those labels, so the app keeps whichever
  the source used rather than renumbering.
- **Paired questions keep their case.** 71 questions are follow-ups that share the
  preceding question's vignette. Those are shown with a
  "Case continued from previous question" header — the pairing is inferred, so
  treat that header as a hint rather than gospel.
- **Three questions carry a warning.** Ids 13, 79 and 297 had no answer key
  anywhere in the source PDF. Answers were supplied from standard references and
  are labelled in the UI as such — verify them against your own materials.

`tools/README.md` documents the extraction pipeline and every manual repair.

## Layout

```
src/
  data/questions.json     the extracted question bank
  lib/questions.js        loading, topic grouping, grading, search index
  lib/store.js            localStorage persistence + spaced-repetition scheduling
  components/             Dashboard, Practice, Quiz, Results, Browse, Progress
tools/                    the PDF -> JSON pipeline
```
