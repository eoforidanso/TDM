import { useCallback, useEffect, useState } from 'react'
import { QUESTIONS, BY_ID } from './lib/questions'
import { useStore, statsFor, isDue } from './lib/store'
import Dashboard from './components/Dashboard'
import Practice from './components/Practice'
import Browse from './components/Browse'
import Progress from './components/Progress'
import Quiz from './components/Quiz'

const shuffled = (a) => [...a].sort(() => Math.random() - 0.5)

export default function App() {
  const store = useStore()
  const [view, setView] = useState('home')
  const [session, setSession] = useState(null)

  useEffect(() => {
    document.documentElement.dataset.theme = store.settings.theme
  }, [store.settings.theme])

  const begin = useCallback((questions, mode, label) => {
    if (!questions.length) return
    setSession({
      // A fresh key remounts Quiz, so a re-run starts from a clean slate.
      key: `${Date.now()}-${label}`,
      questions, mode, label,
      retry: (qs) => begin(qs, 'tutor', `Redo · ${label}`),
    })
  }, [])

  const start = {
    topic: (name) => begin(shuffled(QUESTIONS.filter((q) => q.topic === name)), 'tutor', name),
    fresh: () => {
      const stats = statsFor(store.attempts)
      const pool = QUESTIONS.filter((q) => !stats.has(q.id))
      begin(shuffled(pool.length ? pool : QUESTIONS).slice(0, 20), 'tutor', 'Fresh questions')
    },
    review: () => {
      const stats = statsFor(store.attempts)
      const pool = QUESTIONS.filter((q) => stats.has(q.id) && isDue(store.srs, q.id))
        .sort((a, b) => (store.srs[a.id]?.due ?? 0) - (store.srs[b.id]?.due ?? 0))
      begin(pool.slice(0, 25), 'tutor', 'Spaced review')
    },
    missed: () => {
      const stats = statsFor(store.attempts)
      const pool = QUESTIONS.filter((q) => stats.get(q.id) && !stats.get(q.id).last.exact)
      begin(shuffled(pool), 'tutor', 'Mistake drill')
    },
    flagged: () => begin(store.flagged.map((id) => BY_ID.get(id)).filter(Boolean), 'tutor', 'Flagged questions'),
    mock: (n) => begin(shuffled(QUESTIONS).slice(0, n), 'exam', `Mock exam · ${n} questions`),
  }

  if (session) {
    return (
      <div className="app">
        <div className="main">
          <Quiz key={session.key} session={session} store={store} onExit={() => { setSession(null); setView('home') }} />
        </div>
      </div>
    )
  }

  const stats = statsFor(store.attempts)
  const due = QUESTIONS.filter((q) => stats.has(q.id) && isDue(store.srs, q.id)).length
  const missedCount = QUESTIONS.filter((q) => stats.get(q.id) && !stats.get(q.id).last.exact).length

  const nav = [
    ['home', 'Dashboard', null],
    ['practice', 'Build a set', null],
    ['browse', 'Question bank', QUESTIONS.length],
    ['progress', 'Progress', null],
  ]

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <h1>Board Prep</h1>
          <p>{QUESTIONS.length} clinical questions</p>
        </div>

        {nav.map(([k, l, badge]) => (
          <button key={k} className={`nav-btn ${view === k ? 'active' : ''}`} onClick={() => setView(k)}>
            {l}{badge != null && <span className="badge">{badge}</span>}
          </button>
        ))}

        <div className="nav-sep">Jump in</div>
        <button className="nav-btn" onClick={start.review} disabled={!due}>
          Spaced review{due > 0 && <span className="badge">{due}</span>}
        </button>
        <button className="nav-btn" onClick={start.missed} disabled={!missedCount}>
          Mistake drill{missedCount > 0 && <span className="badge">{missedCount}</span>}
        </button>
        <button className="nav-btn" onClick={start.flagged} disabled={!store.flagged.length}>
          Flagged{store.flagged.length > 0 && <span className="badge">{store.flagged.length}</span>}
        </button>
        <button className="nav-btn" onClick={() => start.mock(50)}>Mock exam</button>

        <div className="spacer" />
        <button
          className="nav-btn"
          onClick={() => store.setSettings({ theme: store.settings.theme === 'dark' ? 'light' : 'dark' })}
        >
          {store.settings.theme === 'dark' ? 'Light theme' : 'Dark theme'}
        </button>
      </aside>

      <main className="main">
        {view === 'home' && <Dashboard store={store} start={start} go={setView} />}
        {view === 'practice' && <Practice store={store} onStart={begin} />}
        {view === 'browse' && <Browse store={store} onStart={begin} />}
        {view === 'progress' && <Progress store={store} start={start} />}
      </main>
    </div>
  )
}
