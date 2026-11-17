"""Append the ten specialty question sets in tools/specialties/*.md to the bank.

Run from this directory:  python3 add_specialties.py
Re-running is safe: questions from earlier runs (ids >= FIRST_ID) are replaced.
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).parent
BANK = HERE.parent / "src" / "data" / "questions.json"
FIRST_ID = 300

# file stem -> (category, topic for each question; one topic or a per-question rule)
SETS = {
    "Endocrinology": ("Endocrinology", "Endocrinology"),
    "Urology": ("Urology", "Urology"),
    "Musculoskeletal": ("Musculoskeletal", "Musculoskeletal"),
    "Dermatology": ("Dermatology", "Dermatology"),
    "Rheumatology": ("Rheumatology", "Rheumatology"),
    "Allergy and Immunology": ("Allergy & Immunology", "Allergy & Immunology"),
    "Communication and Professionalism": ("Professionalism", "Communication & Professionalism"),
    "Nephrology and Genitourinary": ("Nephrology & GU", "Nephrology & Genitourinary"),
    # questions 1-6 hematology, 7-10 palliative care
    "Hematology and Palliative Care": ("Hematology & Palliative", lambda n: "Hematology" if n <= 6 else "Palliative Care"),
    "Oncology": ("Oncology", "Oncology"),
}

Q_RE = re.compile(r"\*\*(\d+)\.\*\* ([^\n]+)\n\n((?:- [A-E]\. [^\n]+\n)+)")
A_RE = re.compile(r"\*\*(\d+)\. ([A-E]) — (.+?)\.\*\* ([^\n]+)")
# The question sentence: the last sentence that starts with one of these words.
ASK_RE = re.compile(r'(?:^|(?<=[.?!] )|(?<=[.?!]" ))' r"((?:Which|What|When|How|Before|If|Besides)\b[^.?!]*(?:\?|\.)?)\s*$")


def split_stem(text):
    m = ASK_RE.search(text)
    if not m or m.start(1) == 0:
        return "", text
    return text[: m.start(1)].strip(), m.group(1).strip()


def parse(path):
    name = re.sub(r"^\d+\s+", "", path.stem)
    category, topic = SETS[name]
    body, answers = path.read_text().split("## Answers and explanations")
    qs = {}
    for m in Q_RE.finditer(body):
        opts = [re.sub(r"^- [A-E]\. ", "", l) for l in m.group(3).strip().split("\n")]
        qs[int(m.group(1))] = {"text": m.group(2).strip(), "options": opts}
    for m in A_RE.finditer(answers):
        q = qs[int(m.group(1))]
        q["correct"] = m.group(2)
        q["explanation"] = [f"{m.group(3)}.", m.group(4).strip()]
    assert len(qs) == 10 and all("correct" in q and len(q["options"]) == 5 for q in qs.values()), path
    out = []
    for n in sorted(qs):
        q = qs[n]
        vignette, stem = split_stem(q["text"])
        out.append({
            "topic": topic(n) if callable(topic) else topic,
            "category": category,
            "vignette": vignette,
            "sharedCase": "",
            "stem": stem,
            "options": [{"label": l, "text": t} for l, t in zip("ABCDE", q["options"])],
            "correct": [q["correct"]],
            "multi": False,
            "explanation": q["explanation"],
            "priorCorrect": None,
            "supplied": False,
        })
    return out


def main():
    bank = [q for q in json.loads(BANK.read_text()) if q["id"] < FIRST_ID]
    new = [q for p in sorted((HERE / "specialties").glob("*.md")) for q in parse(p)]
    for i, q in enumerate(new):
        bank.append({"id": FIRST_ID + i, **q})
    BANK.write_text(json.dumps(bank, indent=1))
    print(f"{len(new)} specialty questions added; bank now {len(bank)}")


if __name__ == "__main__":
    main()
