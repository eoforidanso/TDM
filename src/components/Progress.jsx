import { useMemo } from 'react'
import { QUESTIONS, TOPICS, catColor } from '../lib/questions'
import { statsFor } from '../lib/store'

export default function Progress({ store, start }) {
  const stats = useMemo(() => statsFor(store.attempts), [store.attempts])

  const rows = TOPICS.map((t) => {
    const done = t.ids.filter((id) => stats.has(id))
    const right = done.filter((id) => stats.get(id).last.exact).length
    return { ...t, done: done.length, right, acc: done.length ? right / done.length : null }
  })

  // last 21 days of activity
  const days = []
  for (let i = 20; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const end = d.getTime() + 86400000
    const a = store.attempts.filter((x) => x.at >= d.getTime() && x.at < end)
    days.push({ d, n: a.length, ok: a.filter((x) => x.exact).length })
  }
  const peak = Math.max(1, ...days.map((x) => x.n))

  return (
    <div className="wrap fade">
      <h2>Progress</h2>
      <p className="sub">Mastery is scored from your most recent answer to each question.</p>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Last three weeks</h3>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 90, marginTop: 12 }}>
          {days.map((x, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}
              title={`${x.d.toLocaleDateString()} — ${x.n} answered, ${x.ok} correct`}>
              <div style={{ height: `${(x.n / peak) * 100}%`, background: 'var(--bg-3)', borderRadius: '3px 3px 0 0', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ height: x.n ? `${(x.ok / x.n) * 100}%` : 0, background: 'var(--ok)', borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 8, fontSize: 11.5 }}>
          <span className="muted">21 days ago</span><div className="spacer" />
          <span className="chip dot" style={{ color: 'var(--ok)' }}>correct</span>
          <span className="chip dot" style={{ color: 'var(--fg-3)' }}>attempted</span>
          <div className="spacer" /><span className="muted">today</span>
        </div>
      </div>

      <h3>All topics</h3>
      {rows.map((t) => (
        <button key={t.name} className="topic-row" onClick={() => start.topic(t.name)}>
          <span className="chip dot" style={{ color: catColor(t.category), flex: '0 0 auto', width: 24, padding: 0, border: 0, background: 'none' }} />
          <span style={{ flex: 1 }}>
            <span className="nm">{t.name}</span>
            <span className="meta">{t.category} · {t.done}/{t.ids.length} attempted</span>
          </span>
          <div className="bar">
            <i style={{
              width: `${(t.acc ?? 0) * 100}%`,
              background: t.acc === null ? 'var(--fg-3)' : t.acc < 0.5 ? 'var(--bad)' : t.acc < 0.8 ? 'var(--warn)' : 'var(--ok)',
            }} />
          </div>
          <span className="pct">{t.acc === null ? '—' : `${Math.round(t.acc * 100)}%`}</span>
        </button>
      ))}

      <div className="card" style={{ marginTop: 28 }}>
        <h3>Data</h3>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          Everything is stored in this browser only — {store.attempts.length} answers logged across {store.sessions.length} sessions.
        </p>
        <div className="row">
          <button className="btn sm" onClick={() => {
            const blob = new Blob([JSON.stringify({ attempts: store.attempts, srs: store.srs, sessions: store.sessions, flagged: store.flagged }, null, 2)], { type: 'application/json' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = 'board-prep-progress.json'
            a.click()
          }}>Export progress</button>
          <button className="btn sm" onClick={() => {
            if (confirm('Erase all progress, flags and review scheduling? This cannot be undone.')) store.resetAll()
          }}>Reset everything</button>
        </div>
      </div>
    </div>
  )
}
