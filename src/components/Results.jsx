import { useState } from 'react'
import { catColor } from '../lib/questions'

export default function Results({ session, picked, checked, store, onExit }) {
  const { questions, label } = session
  const [open, setOpen] = useState(null)
  const right = questions.filter((q) => checked[q.id]?.exact).length
  const pct = Math.round((right / questions.length) * 100)

  const byTopic = new Map()
  for (const q of questions) {
    if (!byTopic.has(q.topic)) byTopic.set(q.topic, { name: q.topic, category: q.category, n: 0, ok: 0 })
    const t = byTopic.get(q.topic)
    t.n += 1
    if (checked[q.id]?.exact) t.ok += 1
  }
  const topics = [...byTopic.values()].sort((a, b) => a.ok / a.n - b.ok / b.n)
  const missed = questions.filter((q) => !checked[q.id]?.exact)

  const tone = pct >= 80 ? 'var(--ok)' : pct >= 60 ? 'var(--warn)' : 'var(--bad)'

  return (
    <div className="wrap fade">
      <h2>Session complete</h2>
      <p className="sub">{label}</p>

      <div className="grid g4" style={{ marginBottom: 22 }}>
        <div className="card stat"><div className="n" style={{ color: tone }}>{pct}%</div><div className="l">Score</div></div>
        <div className="card stat"><div className="n">{right}/{questions.length}</div><div className="l">Correct</div></div>
        <div className="card stat"><div className="n">{missed.length}</div><div className="l">To review</div></div>
        <div className="card stat"><div className="n">{topics.length}</div><div className="l">Topics covered</div></div>
      </div>

      {topics.length > 1 && (
        <div className="card" style={{ marginBottom: 22 }}>
          <h3>By topic</h3>
          {topics.map((t) => (
            <div key={t.name} className="row" style={{ marginBottom: 8 }}>
              <span style={{ flex: 1, fontSize: 13.5 }}>{t.name}</span>
              <div className="bar" style={{ width: 130 }}>
                <i style={{ width: `${(t.ok / t.n) * 100}%`, background: catColor(t.category) }} />
              </div>
              <span className="pct muted" style={{ fontSize: 12, width: 46, textAlign: 'right' }}>{t.ok}/{t.n}</span>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ marginTop: 26 }}>Review {missed.length ? `— ${missed.length} missed` : '— all correct'}</h3>
      {(missed.length ? missed : questions).map((q) => {
        const r = checked[q.id]
        const yours = picked[q.id] || []
        const isOpen = open === q.id
        return (
          <div key={q.id} className="card" style={{ marginBottom: 8, padding: '12px 14px' }}>
            <button
              className="row"
              onClick={() => setOpen(isOpen ? null : q.id)}
              style={{ background: 'none', border: 0, padding: 0, width: '100%', textAlign: 'left' }}
            >
              <span style={{ color: r?.exact ? 'var(--ok)' : 'var(--bad)', fontWeight: 700, width: 16 }}>
                {r?.exact ? '✓' : '✗'}
              </span>
              <span style={{ flex: 1, fontSize: 13.5 }}>{q.stem.slice(0, 110)}{q.stem.length > 110 ? '…' : ''}</span>
              <span className="chip">{q.topic}</span>
              <span className="muted" style={{ fontSize: 16 }}>{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && (
              <div className="fade" style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                {(q.vignette || q.sharedCase) && <div className="case">{q.vignette || q.sharedCase}</div>}
                {q.options.map((o) => {
                  const ok = q.correctSet.has(o.label)
                  const mine = yours.includes(o.label)
                  return (
                    <div key={o.label} className={`opt ${ok ? 'right' : mine ? 'wrong' : ''}`} style={{ cursor: 'default' }}>
                      <span className="k">{o.label}</span>
                      <span>{o.text}</span>
                      {mine && <span className="mark muted">your pick</span>}
                    </div>
                  )
                })}
                <div className="expl">
                  <h4>Explanation</h4>
                  {q.explanation.map((p, n) => <p key={n}>{p}</p>)}
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div className="actions">
        <button className="btn primary" onClick={onExit}>Back to dashboard</button>
        {missed.length > 0 && (
          <button className="btn" onClick={() => session.retry(missed)}>Redo the {missed.length} missed</button>
        )}
      </div>
    </div>
  )
}
