import { useMemo, useState } from 'react'
import { QUESTIONS, TOPICS, haystack, catColor } from '../lib/questions'

const INDEX = QUESTIONS.map((q) => ({ q, hay: haystack(q) }))

export default function Browse({ store, onStart }) {
  const [term, setTerm] = useState('')
  const [topic, setTopic] = useState('')
  const [open, setOpen] = useState(null)

  const hits = useMemo(() => {
    const t = term.trim().toLowerCase()
    return INDEX.filter(({ q, hay }) => (!topic || q.topic === topic) && (!t || hay.includes(t))).map((x) => x.q)
  }, [term, topic])

  return (
    <div className="wrap wide fade">
      <h2>Question bank</h2>
      <p className="sub">Search every stem, option and explanation. Open one to read it with the answer shown.</p>

      <div className="row" style={{ marginBottom: 18 }}>
        <input
          type="search"
          placeholder="Search — e.g. amiodarone, wearing off, lithium levels…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          style={{ flex: 1, minWidth: 260 }}
        />
        <select value={topic} onChange={(e) => setTopic(e.target.value)} style={{ width: 240 }}>
          <option value="">All topics</option>
          {TOPICS.map((t) => <option key={t.name} value={t.name}>{t.name} ({t.ids.length})</option>)}
        </select>
        <button className="btn" disabled={!hits.length} onClick={() => onStart(hits, 'tutor', term ? `Search: ${term}` : topic || 'Browse')}>
          Quiz these {hits.length}
        </button>
      </div>

      <p className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>{hits.length} question{hits.length === 1 ? '' : 's'}</p>

      {hits.map((q) => {
        const isOpen = open === q.id
        return (
          <div key={q.id} className="card" style={{ marginBottom: 7, padding: '11px 14px' }}>
            <button
              onClick={() => setOpen(isOpen ? null : q.id)}
              className="row"
              style={{ background: 'none', border: 0, padding: 0, width: '100%', textAlign: 'left' }}
            >
              <span className="chip dot" style={{ color: catColor(q.category), flex: '0 0 auto' }}>{q.topic}</span>
              <span style={{ flex: 1, fontSize: 13.5 }}>
                <Highlight text={q.stem} term={term} />
              </span>
              {store.flagged.includes(q.id) && <span style={{ color: 'var(--warn)' }}>★</span>}
              <svg
                className="chevron"
                width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"
                style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}
              >
                <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isOpen && (
              <div className="fade" style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                {(q.vignette || q.sharedCase) && (
                  <div className="case">
                    {q.sharedCase && <span className="tag">Case continued from previous question</span>}
                    <Highlight text={q.vignette || q.sharedCase} term={term} />
                  </div>
                )}
                {q.options.map((o) => (
                  <div key={o.label} className={`opt ${q.correctSet.has(o.label) ? 'right' : ''}`} style={{ cursor: 'default' }}>
                    <span className="k">{o.label}</span>
                    <span><Highlight text={o.text} term={term} /></span>
                  </div>
                ))}
                <div className="expl">
                  <h4>Explanation</h4>
                  {q.explanation.map((p, n) => <p key={n}><Highlight text={p} term={term} /></p>)}
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="btn sm ghost" onClick={() => store.toggleFlag(q.id)}>
                    {store.flagged.includes(q.id) ? '★ Unflag' : '☆ Flag'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {!hits.length && <div className="empty"><div className="big">🔍</div>Nothing matches that search.</div>}
    </div>
  )
}

function Highlight({ text, term }) {
  const t = term.trim()
  if (!t || t.length < 2) return text
  const parts = text.split(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'))
  return parts.map((p, i) => (p.toLowerCase() === t.toLowerCase() ? <mark key={i}>{p}</mark> : p))
}
