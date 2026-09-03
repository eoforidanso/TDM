import { useMemo, useState } from 'react'
import { QUESTIONS, TOPICS, CATEGORIES, catColor } from '../lib/questions'
import { statsFor } from '../lib/store'

const SIZES = [10, 20, 30, 50, 0]

export default function Practice({ store, onStart }) {
  const [picked, setPicked] = useState(new Set())
  const [size, setSize] = useState(20)
  const [mode, setMode] = useState('tutor')
  const [filter, setFilter] = useState('all') // all | unseen | missed
  const [shuffle, setShuffle] = useState(true)

  const stats = useMemo(() => statsFor(store.attempts), [store.attempts])

  const toggleTopic = (name) => {
    const n = new Set(picked)
    n.has(name) ? n.delete(name) : n.add(name)
    setPicked(n)
  }
  const toggleCat = (cat) => {
    const names = cat.topics.map((t) => t.name)
    const all = names.every((n) => picked.has(n))
    const n = new Set(picked)
    names.forEach((x) => (all ? n.delete(x) : n.add(x)))
    setPicked(n)
  }

  const pool = useMemo(() => {
    let p = picked.size ? QUESTIONS.filter((q) => picked.has(q.topic)) : QUESTIONS
    if (filter === 'unseen') p = p.filter((q) => !stats.has(q.id))
    if (filter === 'missed') p = p.filter((q) => stats.get(q.id) && !stats.get(q.id).last.exact)
    return p
  }, [picked, filter, stats])

  const go = () => {
    let qs = [...pool]
    if (shuffle) qs.sort(() => Math.random() - 0.5)
    if (size) qs = qs.slice(0, size)
    const label = picked.size === 0 ? 'All topics'
      : picked.size === 1 ? [...picked][0]
        : `${picked.size} topics`
    onStart(qs, mode, label)
  }

  return (
    <div className="wrap fade">
      <h2>Build a set</h2>
      <p className="sub">Pick topics, or leave everything unselected to draw from all {QUESTIONS.length} questions.</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="row" style={{ marginBottom: 14 }}>
          <strong style={{ fontSize: 13 }}>Mode</strong>
          <button className={`btn sm ${mode === 'tutor' ? 'primary' : ''}`} onClick={() => setMode('tutor')}>Tutor</button>
          <button className={`btn sm ${mode === 'exam' ? 'primary' : ''}`} onClick={() => setMode('exam')}>Exam</button>
          <span className="muted" style={{ fontSize: 12 }}>
            {mode === 'tutor' ? 'Answer, see the explanation, move on.' : 'No feedback until the end — closer to the real thing.'}
          </span>
        </div>

        <div className="row" style={{ marginBottom: 14 }}>
          <strong style={{ fontSize: 13 }}>Length</strong>
          {SIZES.map((s) => (
            <button key={s} className={`btn sm ${size === s ? 'primary' : ''}`} onClick={() => setSize(s)}>
              {s || 'All'}
            </button>
          ))}
        </div>

        <div className="row" style={{ marginBottom: 14 }}>
          <strong style={{ fontSize: 13 }}>Draw from</strong>
          {[['all', 'Everything'], ['unseen', 'Not yet seen'], ['missed', 'Previously missed']].map(([k, l]) => (
            <button key={k} className={`btn sm ${filter === k ? 'primary' : ''}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>

        <div className="row">
          <label className="check">
            <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} />
            Shuffle question order
          </label>
        </div>
      </div>

      {CATEGORIES.map((c) => {
        const allOn = c.topics.every((t) => picked.has(t.name))
        return (
          <div key={c.name} style={{ marginBottom: 20 }}>
            <div className="row" style={{ marginBottom: 8 }}>
              <span className="chip dot" style={{ color: catColor(c.name) }}>{c.name}</span>
              <span className="muted" style={{ fontSize: 12 }}>{c.count} questions</span>
              <button className="btn sm ghost" onClick={() => toggleCat(c)}>{allOn ? 'Clear' : 'Select all'}</button>
            </div>
            <div className="grid g3">
              {c.topics.map((t) => {
                const on = picked.has(t.name)
                const done = t.ids.filter((id) => stats.has(id)).length
                return (
                  <button
                    key={t.name}
                    className="card"
                    onClick={() => toggleTopic(t.name)}
                    style={{
                      padding: '10px 12px', textAlign: 'left',
                      borderColor: on ? catColor(c.name) : 'var(--line)',
                      background: on ? `color-mix(in srgb, ${catColor(c.name)} 12%, var(--bg-2))` : 'var(--bg-2)',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 550 }}>{t.name}</div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 3 }}>{done}/{t.ids.length} attempted</div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <div
        className="row card"
        style={{ position: 'sticky', bottom: 16, boxShadow: 'var(--shadow)', marginTop: 24 }}
      >
        <strong>{Math.min(size || pool.length, pool.length)} question{pool.length === 1 ? '' : 's'}</strong>
        <span className="muted" style={{ fontSize: 12.5 }}>
          from a pool of {pool.length}
          {picked.size ? ` · ${picked.size} topic${picked.size > 1 ? 's' : ''}` : ' · all topics'}
        </span>
        <div className="spacer" />
        {picked.size > 0 && <button className="btn sm ghost" onClick={() => setPicked(new Set())}>Clear selection</button>}
        <button className="btn primary" disabled={!pool.length} onClick={go}>Start →</button>
      </div>
    </div>
  )
}
