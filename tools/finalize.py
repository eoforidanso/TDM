import re, json

recs = json.load(open('stage2.json'))

# ---- 1. repair record 13 (options were swallowed by record 14's vignette) ----
r13, r14 = recs[13], recs[14]
lost = ['This resembles neuroleptic malignant syndrome',
        'It is called parkinsonism-hyperpyrexia syndrome',
        'It is caused by abrupt dopaminergic withdrawal',
        'Drug holidays are recommended to prevent dyskinesia',
        'Dopaminergic therapy should be restarted promptly',
        'Hyponatremia may be a risk factor', 'None']
r13['options'] = lost
r13['labels'] = [str(i+1) for i in range(len(lost))]
r13['correct'] = ['1', '2', '3', '5']
r13['multi'] = True
r13['supplied'] = True
r14['vignette'] = ('A 45-year-old woman with chronic neuropathic pain from a traumatic nerve injury has been '
    'stable on morphine controlled-release 60 mg twice daily for the past 6 months with good pain control. '
    'She now reports breakthrough pain occurring 2-3 times per day, each lasting about 30 minutes. '
    'She asks about rescue medication for these episodes.')
r14['stem'] = ('Which one of the following would be the most appropriate rescue dose of morphine for '
    'breakthrough pain? Select 1 or select "None" if none is indicated.')

r13['explanation'] = [
 'Abrupt withdrawal of dopaminergic therapy can precipitate parkinsonism-hyperpyrexia syndrome, which is clinically indistinguishable from neuroleptic malignant syndrome (fever, rigidity, autonomic instability, altered consciousness, raised CK).',
 'Management is prompt reinstatement of dopaminergic therapy plus supportive care.',
 'Drug holidays are NOT recommended — they are precisely what precipitates this syndrome.',
 'Note: the answer key for this item was missing from the source export and has been supplied from standard references.']
recs[79]['explanation'] = [
 'Bupropion has not been linked to a higher rate of congenital malformations, so it may be considered when behavioural measures fail.',
 'Varenicline safety data in pregnancy remain insufficient for routine recommendation.',
 'If NRT is used, removing the patch at bedtime limits fetal nicotine exposure.',
 'NRT is not risk-free, and pharmacotherapy is reserved for women unable to quit with behavioural support alone.',
 'Note: the answer key for this item was missing from the source export and has been supplied from standard references.']
recs[297]['explanation'] = [
 'Sputum eosinophilia with a NEGATIVE methacholine challenge and normal spirometry defines nonasthmatic eosinophilic bronchitis.',
 'Cough-variant asthma would show bronchial hyperresponsiveness (positive methacholine challenge).',
 'It responds well to inhaled corticosteroids.',
 'Note: the answer key for this item was missing from the source export and has been supplied from standard references.']
recs[79]['correct'] = ['1', '3', '5']; recs[79]['multi'] = True; recs[79]['supplied'] = True
recs[297]['correct'] = ['D']; recs[297]['supplied'] = True

# ---- 2. better vignette / stem split ----
SPLIT = re.compile(r'(?<=[.?!])\s+')
LEAD = re.compile(r'^(Question\s*:?\s*)?(Which|What|How|Select|Identify|Choose|Regarding|Most|The most|All of|Based on|In addition)\b', re.I)
for x in recs:
    whole = ' '.join(p for p in [x['vignette'], x['stem']] if p).strip()
    sents = SPLIT.split(whole)
    cut = None
    for i, s in enumerate(sents):
        if s.rstrip().endswith('?') or LEAD.match(s.strip()):
            cut = i
    # walk back over consecutive interrogative lead-ins
    if cut is not None:
        while cut > 0 and LEAD.match(sents[cut-1].strip()) and sents[cut-1].rstrip().endswith('?'):
            cut -= 1
    if cut is None or cut == 0:
        x['vignette'], x['stem'] = '', whole
    else:
        x['vignette'] = ' '.join(sents[:cut]).strip()
        x['stem'] = ' '.join(sents[cut:]).strip()
    x['stem'] = re.sub(r'^Question\s*:?\s*', '', x['stem']).strip()

# ---- 3. topics ----
TOPIC_FIX = [
    (range(0, 4),    'Neuropathic Pain'),
    (range(4, 14),   "Parkinson's Disease"),
    (range(14, 20),  'Neuropathic Pain'),
    (range(20, 30),  'Multiple Sclerosis'),
    (range(30, 40),  'Age-Related Macular Degeneration'),
    (range(100, 110),'Nausea in Adults'),
    (range(110, 120),'Acute Ischemic Stroke'),
]
RENAME = {
    'Insomnia': 'Insomnia', 'Psychoses': 'Psychoses', 'Opioid related disorders': 'Opioid Use Disorder',
    'Smoking cessation': 'Smoking Cessation', 'ADHD': 'ADHD', 'Bipolar disorder': 'Bipolar Disorder',
    'Heart Failure': 'Heart Failure', 'Hypertension': 'Hypertension', 'Stable Angina': 'Stable Angina',
    'Eating disorders': 'Eating Disorders', 'Anxiety disorders': 'Anxiety Disorders',
    'Acute Coronary syndrome': 'Acute Coronary Syndrome',
    'Prevention of Ischemic stroke': 'Secondary Stroke Prevention',
    'Primary Prevention of vascular disease': 'Primary Prevention of Vascular Disease',
    'Supraventricular Tachycardia': 'Supraventricular Tachycardia', 'Syncope': 'Syncope',
    'Venous thromboembolism': 'Venous Thromboembolism',
    'Ventricular tachyarrythmias': 'Ventricular Tachyarrhythmias', 'Dysmenorrhea': 'Dysmenorrhea',
    'Asthma in adults': 'Asthma in Adults', 'Chronic cough in adults': 'Chronic Cough in Adults',
}
for x in recs:
    t = None
    for rng, name in TOPIC_FIX:
        if x['idx'] in rng: t = name; break
    x['topic'] = t or RENAME.get(x['header'], x['header'])

CATEGORY = {
    'Neuropathic Pain': 'Neurology', "Parkinson's Disease": 'Neurology', 'Multiple Sclerosis': 'Neurology',
    'Acute Ischemic Stroke': 'Neurology', 'Secondary Stroke Prevention': 'Neurology',
    'Age-Related Macular Degeneration': 'Ophthalmology',
    'Insomnia': 'Psychiatry', 'Psychoses': 'Psychiatry', 'Opioid Use Disorder': 'Psychiatry',
    'Smoking Cessation': 'Psychiatry', 'ADHD': 'Psychiatry', 'Bipolar Disorder': 'Psychiatry',
    'Eating Disorders': 'Psychiatry', 'Anxiety Disorders': 'Psychiatry',
    'Heart Failure': 'Cardiology', 'Hypertension': 'Cardiology', 'Stable Angina': 'Cardiology',
    'Acute Coronary Syndrome': 'Cardiology', 'Primary Prevention of Vascular Disease': 'Cardiology',
    'Supraventricular Tachycardia': 'Cardiology', 'Syncope': 'Cardiology',
    'Venous Thromboembolism': 'Cardiology', 'Ventricular Tachyarrhythmias': 'Cardiology',
    'Nausea in Adults': 'Gastroenterology', 'Dysmenorrhea': "Women's Health",
    'Asthma in Adults': 'Respirology', 'Chronic Cough in Adults': 'Respirology',
}

# ---- 4. shared case context for paired items ----
REF = re.compile(r'\bthis (patient|complication|diagnosis|therapy|intervention|assessment|stage|setting|condition|episode|drug)\b', re.I)
SELF = re.compile(r'^(Regarding|Which of the following is the standard)', re.I)
for i, x in enumerate(recs):
    x['sharedCase'] = ''
    if x['vignette'] or i == 0: continue
    p = recs[i-1]
    if p['topic'] != x['topic'] or not p['vignette']: continue
    if REF.search(x['stem']) or (x['multi'] and not SELF.match(x['stem'])):
        x['sharedCase'] = p['vignette']

# ---- 5. clean explanations ----
LABELS = re.compile(r'^(Explanation|Rationale|Feedback)\s*:?\s*$', re.I)
for x in recs:
    e = []
    for l in x['explanation']:
        l = l.strip()
        if not l or LABELS.match(l): continue
        l = re.sub(r'^(Explanation|Rationale)\s*:\s*', '', l)
        e.append(l)
    # strip trailing topic-tag artefacts
    if e:
        for tag in (x['topic'], x['header'] or ''):
            if tag and e[-1].endswith(' ' + tag):
                e[-1] = e[-1][:-(len(tag) + 1)].rstrip()
    x['explanation'] = [l for l in e if l]

# ---- 6. emit ----
out = []
for x in recs:
    out.append(dict(
        id=x['idx'], topic=x['topic'], category=CATEGORY.get(x['topic'], 'Other'),
        vignette=x['vignette'], sharedCase=x['sharedCase'], stem=x['stem'],
        options=[dict(label=l, text=t) for l, t in zip(x['labels'], x['options'])],
        correct=x['correct'], multi=bool(x['multi']),
        explanation=x['explanation'],
        priorCorrect=x['score'].startswith('1/'),
        supplied=bool(x.get('supplied')),
    ))
json.dump(out, open('questions.json','w'), indent=1)

from collections import Counter, defaultdict
print('questions', len(out))
print('no explanation:', sum(1 for x in out if not x['explanation']))
print('shared case:', sum(1 for x in out if x['sharedCase']))
print('multi:', sum(1 for x in out if x['multi']))
print('no vignette & no case:', sum(1 for x in out if not x['vignette'] and not x['sharedCase']))
c = defaultdict(list)
for x in out: c[x['category']].append(x['topic'])
for k, v in c.items(): print(f'{k:18} {len(v):3}  {len(set(v))} topics')
