import raw from '../data/questions.json'

export const QUESTIONS = raw.map((q) => ({
  ...q,
  correctSet: new Set(q.correct),
  // How many answers the stem asks for, when it says so explicitly.
  required: requiredCount(q),
}))

function requiredCount(q) {
  const m = /Select\s+(\d+|ONE|TWO|THREE|FOUR|FIVE|SIX|ALL|NONE)\b/i.exec(q.stem)
  if (!m) return q.correct.length
  const w = m[1].toUpperCase()
  const words = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, SIX: 6 }
  if (w === 'ALL' || w === 'NONE') return q.correct.length
  return words[w] ?? Number(w)
}

export const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]))

export const TOPICS = (() => {
  const m = new Map()
  for (const q of QUESTIONS) {
    if (!m.has(q.topic)) m.set(q.topic, { name: q.topic, category: q.category, ids: [] })
    m.get(q.topic).ids.push(q.id)
  }
  return [...m.values()].sort((a, b) =>
    a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
  )
})()

export const CATEGORIES = (() => {
  const m = new Map()
  for (const t of TOPICS) {
    if (!m.has(t.category)) m.set(t.category, { name: t.category, topics: [], count: 0 })
    const c = m.get(t.category)
    c.topics.push(t)
    c.count += t.ids.length
  }
  return [...m.values()].sort((a, b) => b.count - a.count)
})()

export const CATEGORY_COLORS = {
  Cardiology: '#e0566b',
  Psychiatry: '#8b6fd4',
  Neurology: '#3f8fd0',
  Respirology: '#2fa08a',
  Ophthalmology: '#d9922f',
  Gastroenterology: '#c2703f',
  "Women's Health": '#cf5fa0',
  Endocrinology: '#b9a033',
  Urology: '#4f9fb8',
  Musculoskeletal: '#9a7b5c',
  Dermatology: '#d07a8e',
  Rheumatology: '#6c7fd8',
  'Allergy & Immunology': '#5fae5a',
  Professionalism: '#7a8fa6',
  'Nephrology & GU': '#3aa3a3',
  'Hematology & Palliative': '#c9584f',
  Oncology: '#a56bc0',
  Other: '#8a8f98',
}

export const catColor = (c) => CATEGORY_COLORS[c] || CATEGORY_COLORS.Other

/** Grade a submitted answer. Multi-select gets partial credit for reporting. */
export function grade(q, picked) {
  const chosen = new Set(picked)
  const hits = [...chosen].filter((l) => q.correctSet.has(l)).length
  const misses = q.correct.length - hits
  const extra = chosen.size - hits
  const exact = misses === 0 && extra === 0
  const partial = q.correct.length ? Math.max(0, (hits - extra) / q.correct.length) : 0
  return { exact, partial, hits, misses, extra }
}

/** Plain-text blob used by the search box. */
export function haystack(q) {
  return [q.topic, q.vignette, q.sharedCase, q.stem, ...q.options.map((o) => o.text), ...q.explanation]
    .join(' ')
    .toLowerCase()
}
