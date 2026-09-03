import { useCallback, useEffect, useRef, useState } from 'react'
import { grade } from '../lib/questions'
import Results from './Results'

export default function Quiz({ session, store, onExit }) {
  const { questions, mode, label } = session // mode: 'tutor' | 'exam'
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState({}) // qid -> [labels]
  const [checked, setChecked] = useState({}) // qid -> result
  const [done, setDone] = useState(false)
  const startedAt = useRef(Date.now())
  const qStart = useRef(Date.now())

  const q = questions[i]
  const sel = picked[q?.id] || []

  // Keyboard handlers fire faster than React re-renders, so read the live
  // picks/results through refs rather than through the render closure.
  const pickedRef = useRef(picked)
  const checkedRef = useRef(checked)
  pickedRef.current = picked
  checkedRef.current = checked
  const result = checked[q?.id]
  const isLast = i === questions.length - 1

  useEffect(() => { qStart.current = Date.now() }, [i])

  const toggle = useCallback((label) => {
    if (result) return
    setPicked((p) => {
      const cur = p[q.id] || []
      if (q.multi) {
        return { ...p, [q.id]: cur.includes(label) ? cur.filter((x) => x !== label) : [...cur, label] }
      }
      return { ...p, [q.id]: cur[0] === label ? [] : [label] }
    })
  }, [q, result])

  const submit = useCallback(() => {
    const live = pickedRef.current[q.id] || []
    if (!live.length || checkedRef.current[q.id]) return
    const r = grade(q, live)
    setChecked((c) => ({ ...c, [q.id]: r }))
    store.recordAnswer(q, r, mode, Date.now() - qStart.current)
  }, [q, store, mode])

  const finish = useCallback((answers) => {
    const correct = questions.filter((x) => answers[x.id]?.exact).length
    store.endSession({
      at: Date.now(), mode, label, total: questions.length, correct,
      ms: Date.now() - startedAt.current,
    })
    setDone(true)
  }, [questions, store, mode, label])

  const gradeAll = useCallback(() => {
    const all = {}
    for (const x of questions) {
      const r = grade(x, pickedRef.current[x.id] || [])
      all[x.id] = r
      store.recordAnswer(x, r, mode, 0)
    }
    setChecked(all)
    finish(all)
  }, [questions, store, mode, finish])

  const next = useCallback(() => {
    if (mode === 'exam') {
      // Exam mode defers grading to the end.
      if (isLast) {
        gradeAll()
      } else setI((n) => n + 1)
      return
    }
    if (!checkedRef.current[q.id]) return submit()
    if (isLast) finish(checkedRef.current)
    else setI((n) => n + 1)
  }, [mode, isLast, q, submit, finish, gradeAll])

  // keyboard: letter/number keys pick, Enter advances
  useEffect(() => {
    const onKey = (e) => {
      if (done || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const k = e.key.toUpperCase()
      const hit = q.options.find((o) => o.label === k)
      if (hit) {
        e.preventDefault()
        // Otherwise a later Enter would also "click" the focused option.
        if (document.activeElement?.classList.contains('opt')) document.activeElement.blur()
        toggle(hit.label)
        return
      }
      if (e.key === 'Enter') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft' && i > 0) setI(i - 1)
      if (e.key === 'ArrowRight' && !isLast && (mode === 'exam' || result)) setI(i + 1)
      if (k === 'F') store.toggleFlag(q.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [q, toggle, next, done, i, isLast, mode, result, store])

  if (done) {
    return <Results session={session} picked={picked} checked={checked} store={store} onExit={onExit} />
  }

  const answeredCount = Object.keys(mode === 'exam' ? picked : checked).length
  // Only single-character labels have a keyboard shortcut ("10" has no single key).
  const typable = q.options.filter((o) => o.label.length === 1)
  const keyRange = typable.length > 1 ? [typable[0].label, typable.at(-1).label] : null
  const flagged = store.flagged.includes(q.id)
  const showFeedback = mode === 'tutor' && !!result

  return (
    <>
      <div className="qhead">
        <button className="btn sm ghost" onClick={onExit}>← Exit</button>
        <span className="counter">{i + 1} / {questions.length}</span>
        <div className="bar"><i style={{ width: `${(answeredCount / questions.length) * 100}%`, background: 'var(--accent)' }} /></div>
        <span className="chip">{label}</span>
        <div className="spacer" />
        <button className="btn sm ghost" onClick={() => store.toggleFlag(q.id)} title="Flag for later (F)">
          {flagged ? '★ Flagged' : '☆ Flag'}
        </button>
      </div>

      <div className="wrap fade" key={q.id}>
        <div className="row" style={{ marginBottom: 14 }}>
          <span className="chip dot" style={{ color: 'var(--fg-2)' }}>{q.topic}</span>
          {q.multi && <span className="chip">Multiple answers · pick {q.required}</span>}
          {q.supplied && <span className="chip" style={{ color: 'var(--warn)' }}>Key supplied by editor</span>}
        </div>

        {(q.vignette || q.sharedCase) && (
          <div className="case">
            {q.sharedCase && <span className="tag">Case continued from previous question</span>}
            {q.vignette || q.sharedCase}
          </div>
        )}

        <p className="stem">{q.stem}</p>

        {q.options.map((o) => {
          const isPicked = sel.includes(o.label)
          const reveal = showFeedback
          const isRight = q.correctSet.has(o.label)
          let cls = 'opt'
          if (reveal && isRight) cls += ' right'
          else if (reveal && isPicked) cls += ' wrong'
          else if (isPicked) cls += ' picked'
          return (
            <button key={o.label} className={cls} disabled={!!result} onClick={() => toggle(o.label)}>
              <span className="k">{o.label}</span>
              <span>{o.text}</span>
              {reveal && isRight && <span className="mark" style={{ color: 'var(--ok)' }}>correct</span>}
              {reveal && isPicked && !isRight && <span className="mark" style={{ color: 'var(--bad)' }}>your pick</span>}
            </button>
          )
        })}

        {showFeedback && (
          <div className={`expl ${result.exact ? 'ok' : 'bad'} fade`}>
            <h4 style={{ color: result.exact ? 'var(--ok)' : 'var(--bad)' }}>
              {result.exact
                ? '✓ Correct'
                : q.multi
                  ? `✗ ${result.hits} of ${q.correct.length} correct${result.extra ? `, ${result.extra} incorrect pick${result.extra > 1 ? 's' : ''}` : ''}`
                  : '✗ Incorrect'}
              {' — answer: '}{q.correct.join(', ')}
            </h4>
            {q.explanation.map((p, n) => <p key={n}>{p}</p>)}
            {q.supplied && (
              <div className="note">
                The source PDF did not include a key for this item; the answer above was supplied
                from standard references. Verify against your own materials.
              </div>
            )}
          </div>
        )}

        <div className="actions">
          <button className="btn ghost sm" disabled={i === 0} onClick={() => setI(i - 1)}>← Prev</button>
          <button className="btn primary" onClick={next} disabled={mode === 'tutor' && !result && !sel.length}>
            {mode === 'exam'
              ? (isLast ? 'Finish exam' : 'Next →')
              : result ? (isLast ? 'See results' : 'Next question →') : 'Check answer'}
          </button>
          <span className="muted" style={{ fontSize: 12 }}>
            {keyRange && (
              <>
                <span className="kbd">{keyRange[0]}</span>–<span className="kbd">{keyRange[1]}</span> pick{'  '}
              </>
            )}
            <span className="kbd">↵</span> {result || mode === 'exam' ? 'next' : 'check'}
          </span>
          {mode === 'exam' && (
            <>
              <div className="spacer" />
              <button className="btn sm ghost" onClick={gradeAll}>End &amp; score</button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
