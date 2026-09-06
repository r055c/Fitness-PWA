import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { IconClose, IconCheck, IconSprintFigure } from '../components/Icons.jsx';
import './WorkoutSession.css';

function parseTargetMode(reps) {
  if (!reps) return 'reps-only';
  if (/^\d+(\.\d+)?$/.test(reps)) return 'weight-reps';
  if (/^\d+(\.\d+)?s$/.test(reps)) return 'duration';
  if (/^\d+(\.\d+)?m$/.test(reps)) return 'distance';
  return 'reps-only';
}

function numFrom(reps) {
  const m = reps && reps.match(/^([\d.]+)/);
  return m ? Number(m[1]) : null;
}

function fmtClock(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function WorkoutSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [exIndex, setExIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(1);
  const [fields, setFields] = useState({ weightKg: '', reps: '', distanceM: '', durationSec: '' });
  const [doneSets, setDoneSets] = useState({}); // `${exerciseId}-${setNumber}` -> logged values
  const [resting, setResting] = useState(false);
  const [restLeft, setRestLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    api.getSession(sessionId).then((s) => {
      setSession(s);
      const seeded = {};
      s.setLogs.forEach((log) => {
        seeded[`${log.exerciseId}-${log.setNumber}`] = log;
      });
      setDoneSets(seeded);
    });
  }, [sessionId]);

  const ex = session?.exercises[exIndex];
  const mode = ex ? parseTargetMode(ex.target.reps) : 'weight-reps';
  const totalSets = ex?.target.sets || 1;

  useEffect(() => {
    if (!ex) return;
    const prev = ex.previousSets.find((p) => p.setNumber === setIndex) || ex.previousSets[0];
    if (mode === 'weight-reps') {
      setFields({ weightKg: prev?.weightKg ?? '', reps: prev?.reps ?? numFrom(ex.target.reps) ?? '', distanceM: '', durationSec: '' });
    } else if (mode === 'duration') {
      setFields({ weightKg: '', reps: '', distanceM: '', durationSec: prev?.durationSec ?? numFrom(ex.target.reps) ?? '' });
    } else if (mode === 'distance') {
      setFields({ weightKg: '', reps: '', distanceM: numFrom(ex.target.reps) ?? '', durationSec: prev?.durationSec ?? '' });
    } else {
      setFields({ weightKg: '', reps: '', distanceM: '', durationSec: '' });
    }
  }, [exIndex, setIndex, ex, mode]);

  useEffect(() => {
    if (!resting) return;
    if (restLeft <= 0) {
      setResting(false);
      return;
    }
    timerRef.current = setTimeout(() => setRestLeft((s) => s - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [resting, restLeft]);

  if (!session || !ex) return <div className="spinner-wrap">Loading…</div>;

  const key = `${ex.id}-${setIndex}`;
  const isLastSetOfExercise = setIndex >= totalSets;
  const isLastExercise = exIndex >= session.exercises.length - 1;
  const nextEx = session.exercises[exIndex + 1];

  async function handleCompleteSet() {
    const payload = { exerciseId: ex.id, setNumber: setIndex, completed: true };
    if (mode === 'weight-reps') { payload.weightKg = Number(fields.weightKg) || null; payload.reps = Number(fields.reps) || null; }
    if (mode === 'duration') { payload.durationSec = Number(fields.durationSec) || null; }
    if (mode === 'distance') { payload.distanceM = Number(fields.distanceM) || null; payload.durationSec = Number(fields.durationSec) || null; }

    await api.logSet(session.id, payload);
    setDoneSets((prev) => ({ ...prev, [key]: payload }));

    if (isLastSetOfExercise && isLastExercise) {
      await api.completeSession(session.id);
      navigate('/', { replace: true });
      return;
    }

    if (isLastSetOfExercise) {
      setExIndex((i) => i + 1);
      setSetIndex(1);
    } else {
      setSetIndex((n) => n + 1);
      if (ex.target.restSeconds) {
        setRestLeft(ex.target.restSeconds);
        setResting(true);
      }
    }
  }

  function fieldLabel() {
    if (mode === 'weight-reps') return ['Kg', 'Reps'];
    if (mode === 'duration') return ['Time (s)'];
    if (mode === 'distance') return ['Dist.', 'Time (s)'];
    return [];
  }

  return (
    <div className="page">
      <div className="ws-topbar">
        <button className="ws-close" onClick={() => navigate('/')}><IconClose /></button>
        <div className="ws-mid">{session.title}</div>
        <div className="ws-progress-n">{exIndex + 1} / {session.exercises.length}</div>
      </div>
      <div className="ws-top-track"><div className="ws-top-fill" style={{ width: `${((exIndex) / session.exercises.length) * 100}%` }} /></div>

      <div className="scroll">
        <div className="ws-tag-row">
          <span className="tag">{ex.primaryMuscles.slice(0, 2).join(' · ') || ex.category}</span>
          <span className="tag" style={{ background: 'var(--gray-soft)', color: 'var(--text)' }}>{ex.equipment || 'bodyweight'}</span>
        </div>
        <div className="ws-ex-title">{ex.name}</div>

        <div className="ws-placeholder">
          {ex.images[0] ? <img src={ex.images[0]} alt={ex.name} /> : <IconSprintFigure />}
        </div>

        {mode === 'reps-only' ? (
          doneSets[key] ? (
            <div className="simple-complete">
              <span className="big-check"><IconCheck stroke="var(--green-dark)" /></span>
              <div className="wsub">Set {setIndex} of {totalSets} logged</div>
            </div>
          ) : (
            <div className="simple-complete">
              <div className="wsub">Target: {ex.target.reps || `set ${setIndex} of ${totalSets}`}</div>
            </div>
          )
        ) : (
          <div className="set-table">
            <div className="set-head">
              <span>Set</span><span>Previous</span>
              {fieldLabel().map((l) => <span key={l}>{l}</span>)}
              {fieldLabel().length === 1 && <span />}
              <span></span>
            </div>
            {Array.from({ length: totalSets }, (_, i) => i + 1).map((n) => {
              const logged = doneSets[`${ex.id}-${n}`];
              const isActive = n === setIndex && !logged;
              const prevSet = ex.previousSets.find((p) => p.setNumber === n);
              return (
                <div key={n} className={`set-row${isActive ? ' active' : ''}`} style={{ gridTemplateColumns: mode === 'duration' ? '34px 1fr 62px 34px' : undefined }}>
                  <span className="set-num">{n}</span>
                  <span className="prev">
                    {mode === 'weight-reps' && prevSet ? `${prevSet.weightKg ?? '—'} kg × ${prevSet.reps ?? '—'}` : ''}
                    {mode === 'duration' && prevSet ? `${prevSet.durationSec ?? '—'}s` : ''}
                    {mode === 'distance' && prevSet ? `${prevSet.distanceM ?? '—'} m · ${prevSet.durationSec ?? '—'}s` : ''}
                    {!prevSet && '—'}
                  </span>
                  {n === setIndex && !logged ? (
                    mode === 'weight-reps' ? (
                      <>
                        <input className="field-val" type="number" value={fields.weightKg} onChange={(e) => setFields((f) => ({ ...f, weightKg: e.target.value }))} />
                        <input className="field-val" type="number" value={fields.reps} onChange={(e) => setFields((f) => ({ ...f, reps: e.target.value }))} />
                      </>
                    ) : mode === 'duration' ? (
                      <input className="field-val" type="number" value={fields.durationSec} onChange={(e) => setFields((f) => ({ ...f, durationSec: e.target.value }))} />
                    ) : (
                      <>
                        <input className="field-val" type="number" value={fields.distanceM} onChange={(e) => setFields((f) => ({ ...f, distanceM: e.target.value }))} />
                        <input className="field-val" type="number" value={fields.durationSec} onChange={(e) => setFields((f) => ({ ...f, durationSec: e.target.value }))} />
                      </>
                    )
                  ) : (
                    <>
                      <span className="field-val" style={{ border: 'none', background: 'none' }}>
                        {logged ? (mode === 'weight-reps' ? logged.weightKg : mode === 'duration' ? logged.durationSec : logged.distanceM) ?? '—' : '—'}
                      </span>
                      {mode !== 'duration' && (
                        <span className="field-val" style={{ border: 'none', background: 'none' }}>
                          {logged ? (mode === 'weight-reps' ? logged.reps : logged.durationSec) ?? '—' : '—'}
                        </span>
                      )}
                    </>
                  )}
                  <span className={`check ${logged ? 'done' : 'pending'}`}>{logged && <IconCheck />}</span>
                </div>
              );
            })}
          </div>
        )}

        {resting && (
          <div className="rest-card">
            <div>
              <div className="rest-label">Resting</div>
              <div className="rest-time">{fmtClock(restLeft)}</div>
            </div>
            <button className="skip" onClick={() => setResting(false)}>Skip</button>
          </div>
        )}

        {nextEx && (
          <div className="next-strip">
            <div className="next-thumb"><IconSprintFigure width={18} height={18} /></div>
            <div className="next-info"><div className="l">Up next</div><div className="n">{nextEx.name}</div></div>
          </div>
        )}
      </div>

      <div className="ws-bottom">
        <button className="btn" onClick={handleCompleteSet}>
          {isLastSetOfExercise && isLastExercise ? 'Finish workout' : mode === 'reps-only' ? 'Complete set' : 'Complete set'}
        </button>
      </div>
    </div>
  );
}
