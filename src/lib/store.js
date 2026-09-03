import { useCallback, useEffect, useState } from 'react'

const KEY = 'board-prep:v1'
const DAY = 86400000

const EMPTY = {
  attempts: [],   // { id, at, exact, partial, mode, ms }
  srs: {},        // id -> { ease, interval, due, reps, lapses }
  sessions: [],   // { at, mode, label, total, correct, ms }
  flagged: [],    // question ids
  settings: { theme: 'dark', tutor: true, shuffleOptions: false },
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    return s ? { ...EMPTY, ...s, settings: { ...EMPTY.settings, ...s.settings } } : EMPTY
  } catch {
    return EMPTY
  }
}

let state = load()
const listeners = new Set()

function commit(next) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* quota or private mode — keep going in memory */
  }
  listeners.forEach((fn) => fn(state))
}

export function useStore() {
  const [s, setS] = useState(state)
  useEffect(() => {
    listeners.add(setS)
    return () => listeners.delete(setS)
  }, [])

  const recordAnswer = useCallback((q, result, mode, ms) => {
    const prev = state.srs[q.id] || { ease: 2.5, interval: 0, reps: 0, lapses: 0 }
    const next = schedule(prev, result.exact)
    commit({
      ...state,
      attempts: [...state.attempts, { id: q.id, at: Date.now(), exact: result.exact, partial: result.partial, mode, ms }],
      srs: { ...state.srs, [q.id]: next },
    })
  }, [])

  const endSession = useCallback((session) => {
    commit({ ...state, sessions: [...state.sessions, session].slice(-200) })
  }, [])

  const toggleFlag = useCallback((id) => {
    const has = state.flagged.includes(id)
    commit({ ...state, flagged: has ? state.flagged.filter((x) => x !== id) : [...state.flagged, id] })
  }, [])

  const setSettings = useCallback((patch) => {
    commit({ ...state, settings: { ...state.settings, ...patch } })
  }, [])

  const resetAll = useCallback(() => commit({ ...EMPTY, settings: state.settings }), [])

  return { ...s, recordAnswer, endSession, toggleFlag, setSettings, resetAll }
}

/** SM-2, trimmed down: correct answers grow the interval, misses restart it. */
function schedule(prev, correct) {
  let { ease, interval, reps, lapses } = prev
  if (correct) {
    reps += 1
    ease = Math.min(2.8, ease + 0.1)
    interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(interval * ease)
  } else {
    reps = 0
    lapses += 1
    ease = Math.max(1.3, ease - 0.25)
    interval = 0 // back in today's queue
  }
  return { ease, interval, reps, lapses, due: Date.now() + interval * DAY }
}

export const isDue = (srs, id) => {
  const s = srs[id]
  return !s || s.due <= Date.now()
}

/** Per-question rollup used across the dashboard and topic lists. */
export function statsFor(attempts) {
  const m = new Map()
  for (const a of attempts) {
    if (!m.has(a.id)) m.set(a.id, { seen: 0, right: 0, last: null })
    const s = m.get(a.id)
    s.seen += 1
    if (a.exact) s.right += 1
    s.last = a
  }
  return m
}

export function streakDays(attempts) {
  if (!attempts.length) return 0
  const days = new Set(attempts.map((a) => new Date(a.at).toDateString()))
  let n = 0
  const d = new Date()
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1) // today not started yet is fine
  while (days.has(d.toDateString())) {
    n += 1
    d.setDate(d.getDate() - 1)
  }
  return n
}
