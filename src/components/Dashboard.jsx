import { QUESTIONS, TOPICS, CATEGORIES, catColor } from '../lib/questions'
import { statsFor, isDue, streakDays } from '../lib/store'

export default function Dashboard({ store, start, go }) {
  const stats = statsFor(store.attempts)
  const seen = stats.size
  const mastered = [...stats.values()].filter((s) => s.right >= 2 && s.last.exact).length
  const due = QUESTIONS.filter((q) => stats.has(q.id) && isDue(store.srs, q.id)).length
  const unseen = QUESTIONS.length - seen
  const missed = QUESTIONS.filter((q) => stats.get(q.id) && !stats.get(q.id).last.exact).length
  const attempts = store.attempts.length
  const accuracy = attempts ? Math.round((store.attempts.filter((a) => a.exact).length / attempts) * 100) : 0
  const streak = streakDays(store.attempts)

  const weakest = TOPICS
    .map((t) => {
      const rows = t.ids.map((id) => stats.get(id)).filter(Boolean)
      if (rows.length < 3) return null
      const acc = rows.filter((r) => r.last.exact).length / rows.length
      return { ...t, acc, seen: rows.length }
    })
    .filter(Boolean)
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 5)

  return (
    <div className="wrap fade">
      <h2>Board Prep</h2>
      <p className="sub">
        {QUESTIONS.length} questions · {TOPICS.length} topics · {CATEGORIES.length} specialties
      </p>

      <div className="grid g4" style={{ marginBottom: 14 }}>
        <div className="card stat"><div className="n">{seen}<span className="muted" style={{ fontSize: 15 }}>/{QUESTIONS.length}</span></div><div className="l">Questions attempted</div></div>
        <div className="card stat"><div className="n" style={{ color: accuracy >= 70 ? 'var(--ok)' : 'var(--warn)' }}>{accuracy}%</div><div className="l">Lifetime accuracy</div></div>
        <div className="card stat"><div className="n">{mastered}</div><div className="l">Mastered</div></div>
        <div className="card stat"><div className="n">{streak}</div><div className="l">Day streak</div></div>
      </div>

      <div className="grid g2" style={{ marginBottom: 26 }}>
        <button className="card" style={{ textAlign: 'left' }} onClick={() => start.review()} disabled={!due}>
          <h3 style={{ color: due ? 'var(--accent)' : 'var(--fg-3)' }}>Spaced review</h3>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            {due ? `${due} question${due > 1 ? 's' : ''} due today — items you got wrong come back sooner.` : 'Nothing due right now. Answer some questions to build the queue.'}
          </p>
        </button>
        <button className="card" style={{ textAlign: 'left' }} onClick={() => start.fresh()}>
          <h3 style={{ color: 'var(--accent)' }}>Fresh questions</h3>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            {unseen ? `${unseen} you haven't seen yet. 20 at a time, with explanations.` : 'You have seen every question at least once.'}
          </p>
        </button>
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Quick start</h3>
      </div>
      <div className="row" style={{ marginBottom: 30 }}>
        <button className="btn" onClick={() => start.missed()} disabled={!missed}>
          Drill my mistakes{missed ? ` (${missed})` : ''}
        </button>
        <button className="btn" onClick={() => start.flagged()} disabled={!store.flagged.length}>
          Flagged ({store.flagged.length})
        </button>
        <button className="btn" onClick={() => start.mock(50)}>Mock exam · 50 Q</button>
        <button className="btn" onClick={() => go('practice')}>Build a custom set →</button>
      </div>

      {weakest.length > 0 && (
        <>
          <h3>Weakest topics</h3>
          <p className="sub" style={{ marginBottom: 12 }}>Based on your most recent answer for each question.</p>
          {weakest.map((t) => (
            <button key={t.name} className="topic-row" onClick={() => start.topic(t.name)}>
              <span style={{ flex: 1 }}>
                <span className="nm">{t.name}</span>
                <span className="meta">{t.category} · {t.seen} of {t.ids.length} attempted</span>
              </span>
              <div className="bar"><i style={{ width: `${t.acc * 100}%`, background: t.acc < 0.5 ? 'var(--bad)' : t.acc < 0.8 ? 'var(--warn)' : 'var(--ok)' }} /></div>
              <span className="pct">{Math.round(t.acc * 100)}%</span>
            </button>
          ))}
        </>
      )}

      <h3 style={{ marginTop: 30 }}>Coverage by specialty</h3>
      {CATEGORIES.map((c) => {
        const ids = c.topics.flatMap((t) => t.ids)
        const done = ids.filter((id) => stats.has(id)).length
        return (
          <div key={c.name} className="row" style={{ marginBottom: 9 }}>
            <span className="chip dot" style={{ color: catColor(c.name), width: 190, justifyContent: 'flex-start' }}>{c.name}</span>
            <div className="bar" style={{ flex: 1, maxWidth: 420 }}>
              <i style={{ width: `${(done / ids.length) * 100}%`, background: catColor(c.name) }} />
            </div>
            <span className="muted" style={{ fontSize: 12 }}>{done}/{ids.length}</span>
          </div>
        )
      })}

      {store.sessions.length > 0 && (
        <>
          <h3 style={{ marginTop: 34 }}>Recent sessions</h3>
          <div className="card" style={{ padding: 4 }}>
            <table>
              <thead><tr><th>When</th><th>Set</th><th>Mode</th><th className="num">Score</th></tr></thead>
              <tbody>
                {[...store.sessions].reverse().slice(0, 8).map((s, i) => (
                  <tr key={i}>
                    <td className="muted">{new Date(s.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                    <td>{s.label}</td>
                    <td className="muted">{s.mode}</td>
                    <td className="num" style={{ color: s.correct / s.total >= 0.7 ? 'var(--ok)' : 'var(--warn)' }}>
                      {s.correct}/{s.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
