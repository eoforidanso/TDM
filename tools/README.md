# Extraction pipeline

`Pipi.pdf` is a 240-page export of 30 Google Forms quizzes. These scripts turn it
into `src/data/questions.json`. Run them in order, from this directory:

```bash
pip install pypdf
python3 pdf_to_text.py ../../Pipi.pdf   # -> norm.txt
python3 extract.py                      # -> stage1.json  (raw blocks)
python3 build.py                        # -> stage2.json  (options + answer keys)
python3 finalize.py                     # -> questions.json
cp questions.json ../src/data/
```

## What each stage does

**`pdf_to_text.py`** — text extraction plus ligature repair. The PDF encodes
`ti`, `fi`, `ff`, `ft`, `fl`, `ffi`, `tt`, `tti` and `tf` as single private-use
glyphs, so `Ques Ɵon` has to become `Question` before anything else can match.

**`extract.py`** — finds question boundaries. Each item is anchored on its score
line (`1/1`, `0/1`); the parser then walks forward for the options and feedback,
and backward for the vignette and stem, stopping at explanation markers
(`Option 3`, `Rationale`, `Why other`, `✓`, …).

**`build.py`** — normalises options and resolves the answer key. The source
states keys five different ways: `Correct Answer: D`, `Correct Answer: 2. <text>`,
`Correct Answers: 1, 3, 5, 7`, `Answer: C. <text>`, and a semicolon-separated
list of answer *texts* that wraps across lines. Text keys are matched back to
options by token overlap, then cross-checked against the "Correct answer" block
Google Forms prints when the answer was wrong.

**`finalize.py`** — topics, case pairing and the manual repairs (below).

## Manual repairs

Two quiz headers were lost in the export (their title line merged into the
previous page's text), so questions 20–39 and 100–119 are assigned to
**Multiple Sclerosis / Age-Related Macular Degeneration** and **Nausea in Adults /
Acute Ischemic Stroke** by index. The export also interleaves the Neuropathic
Pain set around the Parkinson's set, which is corrected the same way.

Three items (ids 13, 79, 297) reached the end of the export with **no feedback
block at all** — the source contains no answer key for them. Answers and
explanations were supplied from standard references and are flagged
`"supplied": true`, which the app surfaces as a warning on the question.

## Verification built into the pipeline

`build.py` reports any question where the key cannot be resolved, and
`finalize.py` cross-checks the number of correct answers against the count the
stem asks for (`Select 3`, `Select ALL`). One genuine source inconsistency
survives: Smoking Cessation id 77 says "Select 3" but its key lists four
answers — the key is kept as written.
