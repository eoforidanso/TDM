import re, json
from collections import Counter

recs = json.load(open('stage1.json'))
LETTER_OPT = re.compile(r'^([A-J])[\.\)]\s+(.*)$')

def norm_txt(s):
    s = re.sub(r'\s+', ' ', s).strip()
    return s

STOP = set('a an the of in on for to and or with is are be been was were that this these those it its as at by from not no'.split())

out = []
problems = []
for r in recs:
    stem_all = norm_txt(' '.join(r['stem_lines']))
    # split vignette / question stem: last sentence starting with Which/What/Question/How/etc.
    m = None
    for mm in re.finditer(r'(?:^|(?<=[.?!]) )((?:Question\s*:?\s*)?(?:Which|What|How|Select|Identify|Choose|All of|Regarding|In addition|The best|Based on|Match)\b.*)$', stem_all):
        m = mm
    if m:
        vignette = stem_all[:m.start(1)].strip()
        stem = m.group(1).strip()
    else:
        vignette, stem = '', stem_all
    stem = re.sub(r'^Question\s*:?\s*', '', stem).strip()

    opts = [o for o in r['opts_raw'] if o.strip()]
    lettered = [LETTER_OPT.match(o) for o in opts]
    if opts and all(lettered):
        labels = [x.group(1) for x in lettered]
        texts = [x.group(2).strip() for x in lettered]
    else:
        labels = [str(i+1) for i in range(len(opts))]
        texts = opts

    # parse key
    key = r['key_raw'] or ''
    correct = set()
    # letters
    ls = re.findall(r'\b([A-J])\b(?![a-z])', key)
    ns = re.findall(r'\b(\d{1,2})\b', key)
    if ls and set(ls) <= set(labels):
        correct = set(ls)
    elif ns:
        for n in ns:
            i = int(n) - 1
            if 0 <= i < len(labels): correct.add(labels[i])
    # fall back / cross-check with literal correct-answer block
    lit = set()
    for l in r['literal']:
        lm = LETTER_OPT.match(l)
        cand = lm.group(2).strip() if lm else l.strip()
        for lab, tx in zip(labels, texts):
            if norm_txt(cand).lower()[:45] == norm_txt(tx).lower()[:45]:
                lit.add(lab); break
    # semicolon-separated textual key fragments
    if not correct or (len(correct) < len([f for f in key.split(';') if f.strip()]) and ';' in key):
        frag = set()
        def toks(s):
            return set(w for w in re.findall(r'[a-z0-9]+', s.lower()) if w not in STOP)
        for f in key.split(';'):
            f = norm_txt(re.sub(r'^[0-9A-J][\.\)]\s*', '', f))
            if len(f) < 4: continue
            ft = toks(f)
            if not ft: continue
            best, bl = 0.0, None
            for lab, tx in zip(labels, texts):
                tt = toks(tx)
                if not tt: continue
                sc = len(ft & tt) / min(len(ft), len(tt))
                if sc > best: best, bl = sc, lab
            if bl and best >= 0.7: frag.add(bl)
        if len(frag) >= len(correct): correct = frag or correct
    if not correct and lit: correct = lit
    if lit and correct and lit < correct: correct = lit  # 'Select 3' style truncation
    # if key text embedded like "2. Postherpetic neuralgia" verify
    kt = re.sub(r'^[0-9A-J][\.\)]?\s*', '', key).strip()
    if kt and len(correct) <= 1:
        for lab, tx in zip(labels, texts):
            if norm_txt(kt).lower()[:40] == norm_txt(tx).lower()[:40]:
                correct = {lab}; break

    multi = len(correct) > 1 or bool(re.search(r'select\s+(all|\d|two|three|four|five)|which\s+\w+\s+are\b|Correct Answers', stem + ' ' + (r['key_raw'] or ''), re.I))

    ok = bool(correct) and len(opts) >= 2
    if not ok:
        problems.append((r['idx'], r['header'], stem[:60], key, len(opts)))
    if lit and correct and lit != correct:
        problems.append(('MISMATCH', r['idx'], sorted(correct), sorted(lit)))

    out.append(dict(
        idx=r['idx'], header=r['header'], score=r['score'],
        vignette=vignette, stem=stem,
        labels=labels, options=texts, alpha=bool(opts and all(lettered)),
        correct=sorted(correct), multi=multi,
        key_raw=r['key_raw'], explanation=r['expl'],
    ))

json.dump(out, open('stage2.json','w'), indent=1)
print('total', len(out), 'problems', len(problems))
for p in problems: print(p)
