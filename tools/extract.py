import re, json, bisect

t = open('norm.txt').read()
t = '\n'.join(l for l in t.split('\n') if not re.fullmatch(r'===PAGE \d+===', l.strip()))
lines = t.split('\n')

sc = [i for i, l in enumerate(lines) if re.fullmatch(r'\d+/\d+', l.strip())]
tp = [i for i, l in enumerate(lines) if l.strip().startswith('Total points')]

def header_title(i):
    j = i - 1
    while j >= 0 and not lines[j].strip(): j -= 1
    return lines[j].strip()
HEADERS = [(i, header_title(i)) for i in tp]

EXPL_HINT = re.compile(r'(Option \d|Options \d|Correct Answer|Rationale|Explanation:|✓|Why other|The document states|is incorrect|are incorrect|Any \d from options)')
VIG_START = re.compile(r'^(A|An)\s+\d{1,3}[-\s]?year[-\s]?old|^A (patient|man|woman|\d)|^An? \w+ (patient|man|woman)|^You (are|see)|^Case[: ]', re.I)

def paras(a, b):
    out, cur, st = [], [], None
    for k in range(a, b):
        if lines[k].strip():
            if st is None: st = k
            cur.append(lines[k].strip())
        elif cur:
            out.append((st, k, ' '.join(cur))); cur, st = [], None
    if cur: out.append((st, b, ' '.join(cur)))
    return out

def back_scan(i, floor):
    ps = paras(floor, i)
    if not ps: return i, None
    take = [ps[-1]]; tag = None
    j = len(ps) - 2
    while j >= 0:
        p = ps[j]
        if EXPL_HINT.search(p[2]): break
        if len(p[2]) < 45 and not p[2].endswith(('.', '?', ':')):
            tag = p[2]; break
        take.insert(0, p)
        if VIG_START.match(p[2]): break
        j -= 1
        if len(take) > 6: break
    return take[0][0], tag

END_OPTS = re.compile(r'^(Feedback|Correct answers?)$', re.I)
CORRECT_LINE = re.compile(r'^(?:Correct\s+)?Answers?\s*[:\-]?\s*(.*)$', re.I)
LETTER_OPT = re.compile(r'^([A-J])[\.\)]\s+(.*)$')

def reflow(ls):
    """Re-join hard-wrapped lines into paragraphs/bullets."""
    out = []
    for l in ls:
        l = l.strip()
        if not l:
            continue
        if out and not re.search(r'[.:?!]$', out[-1]) and not re.match(r'^(Why other|Option \d|Options |Rationale|Explanation)', l):
            out[-1] += ' ' + l
        else:
            out.append(l)
    return out

def merge_opts(o):
    if not o: return o
    lettered = sum(1 for x in o if LETTER_OPT.match(x)) >= max(2, len(o)//2)
    out = []
    for x in o:
        cont = False
        if out:
            if lettered:
                cont = not LETTER_OPT.match(x)
            else:
                cont = (x[:1].islower() or not re.search(r'[.)?%\]]$|[a-z0-9)]$', out[-1]) and x[:1].islower())
        if cont: out[-1] += ' ' + x
        else: out.append(x)
    return out

records = []
for n, i in enumerate(sc):
    floor = sc[n-1] if n else 0
    vstart, _ = back_scan(i, floor)
    nxt = sc[n+1] if n + 1 < len(sc) else len(lines)
    bend, tag = back_scan(nxt, i) if n + 1 < len(sc) else (len(lines), None)

    stem_lines = [l.strip() for l in lines[vstart:i] if l.strip()]
    body = lines[i+1:bend]

    # options
    k = 0
    opts_raw = []
    while k < len(body) and not END_OPTS.match(body[k].strip()):
        if body[k].strip(): opts_raw.append(body[k].strip())
        k += 1
    opts_raw = merge_opts(opts_raw)
    # explicit "Correct answer(s)" literal block
    literal = []
    if k < len(body) and body[k].strip().lower().startswith('correct answer'):
        k += 1
        while k < len(body) and body[k].strip().lower() != 'feedback':
            if body[k].strip(): literal.append(body[k].strip())
            k += 1
        literal = merge_opts(literal)
    if k < len(body) and body[k].strip().lower() == 'feedback':
        k += 1
    fb = [l for l in body[k:]]

    # find "Correct Answer: X" inside feedback
    key_raw, expl = None, fb
    for m, l in enumerate(fb):
        mm = CORRECT_LINE.match(l.strip())
        if mm:
            key_raw = mm.group(1).strip()
            rest = fb[m+1:]
            if not key_raw:
                p = 0
                while p < len(rest) and not rest[p].strip(): p += 1
                if p < len(rest) and re.fullmatch(r'[0-9A-J][0-9A-J,;\s and&]*', rest[p].strip()):
                    key_raw = rest[p].strip(); rest = rest[p+1:]
            if len(key_raw) > 25 and not key_raw.endswith('.'):
                while rest and rest[0].strip() and not re.match(r'^(Explanation|Rationale|Why|Feedback|Correct|Answer)\b', rest[0].strip()):
                    key_raw += ' ' + rest[0].strip(); rest = rest[1:]
            expl = rest
            break

    records.append(dict(
        idx=n, score=lines[i].strip(), stem_lines=stem_lines,
        opts_raw=opts_raw, literal=literal, key_raw=key_raw,
        expl=reflow(expl), tag=tag,
        header=[h for h in HEADERS if h[0] < i][-1][1] if any(h[0] < i for h in HEADERS) else None,
    ))

json.dump(records, open('stage1.json','w'), indent=1)
print('records', len(records))
print('no key:', sum(1 for r in records if not r['key_raw']))
from collections import Counter
print(Counter(r['header'] for r in records))
print('tags:', Counter(r['tag'] for r in records if r['tag']).most_common(20))
