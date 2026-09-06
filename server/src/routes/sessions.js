import { Router } from 'express';
import { db, uid } from '../db.js';
import { exerciseRowToJson } from '../serialize.js';

export const sessionsRouter = Router();

function previousSetsFor(exerciseId, excludeSessionId) {
  return db.prepare(`
    SELECT sl.* FROM set_logs sl
    JOIN workout_sessions ws ON ws.id = sl.session_id
    WHERE sl.exercise_id = ? AND sl.session_id != ? AND sl.completed = 1
    ORDER BY sl.logged_at DESC
    LIMIT 10
  `).all(exerciseId, excludeSessionId || '');
}

function sessionDetail(sessionId) {
  const session = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(sessionId);
  if (!session) return null;

  let planExercises = [];
  if (session.plan_day_id) {
    planExercises = db.prepare(`
      SELECT pde.sort_order, pde.sets, pde.reps, pde.rest_seconds, e.*
      FROM plan_day_exercises pde
      JOIN exercises e ON e.id = pde.exercise_id
      WHERE pde.plan_day_id = ?
      ORDER BY pde.sort_order ASC
    `).all(session.plan_day_id);
  }

  const setLogs = db.prepare('SELECT * FROM set_logs WHERE session_id = ? ORDER BY logged_at ASC').all(sessionId);

  return {
    id: session.id,
    title: session.title,
    startedAt: session.started_at,
    completedAt: session.completed_at,
    exercises: planExercises.map((row) => ({
      ...exerciseRowToJson(row),
      target: { sets: row.sets, reps: row.reps, restSeconds: row.rest_seconds },
      previousSets: previousSetsFor(row.id, sessionId).map((s) => ({
        setNumber: s.set_number, weightKg: s.weight_kg, reps: s.reps,
        distanceM: s.distance_m, durationSec: s.duration_sec, rpe: s.rpe,
      })),
    })),
    setLogs: setLogs.map((s) => ({
      id: s.id, exerciseId: s.exercise_id, setNumber: s.set_number,
      weightKg: s.weight_kg, reps: s.reps, distanceM: s.distance_m,
      durationSec: s.duration_sec, rpe: s.rpe, completed: !!s.completed,
    })),
  };
}

sessionsRouter.post('/', (req, res) => {
  const { planDayId } = req.body;
  const planDay = planDayId ? db.prepare('SELECT * FROM plan_days WHERE id = ?').get(planDayId) : null;

  const id = uid();
  db.prepare('INSERT INTO workout_sessions (id, plan_day_id, title) VALUES (?, ?, ?)')
    .run(id, planDayId || null, planDay ? planDay.title : 'Workout');

  res.status(201).json(sessionDetail(id));
});

sessionsRouter.get('/:id', (req, res) => {
  const detail = sessionDetail(req.params.id);
  if (!detail) return res.status(404).json({ error: 'not_found' });
  res.json(detail);
});

function maybeUpdatePersonalBest(exerciseId, { weightKg, reps, distanceM, durationSec }) {
  let metric, value, unit, detail;
  if (weightKg && reps) {
    metric = 'weight_reps';
    value = weightKg;
    unit = 'kg';
    detail = `${weightKg} kg x ${reps}`;
  } else if (distanceM && durationSec) {
    metric = 'distance_time';
    value = distanceM / durationSec; // m/s, higher is better
    unit = 'm/s';
    detail = `${distanceM} m in ${durationSec}s`;
  } else if (durationSec) {
    metric = 'duration';
    value = durationSec;
    unit = 's';
    detail = `${durationSec}s`;
  } else {
    return;
  }

  const existing = db.prepare('SELECT * FROM personal_bests WHERE exercise_id = ? AND metric = ?').get(exerciseId, metric);
  if (!existing || value > existing.value) {
    if (existing) {
      db.prepare('UPDATE personal_bests SET value = ?, unit = ?, detail = ?, achieved_at = datetime(\'now\') WHERE id = ?')
        .run(value, unit, detail, existing.id);
    } else {
      db.prepare('INSERT INTO personal_bests (id, exercise_id, metric, value, unit, detail) VALUES (?, ?, ?, ?, ?, ?)')
        .run(uid(), exerciseId, metric, value, unit, detail);
    }
  }
}

sessionsRouter.post('/:id/sets', (req, res) => {
  const session = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'not_found' });

  const { exerciseId, setNumber, weightKg = null, reps = null, distanceM = null, durationSec = null, rpe = null, completed = true } = req.body;
  if (!exerciseId || !setNumber) return res.status(400).json({ error: 'exerciseId and setNumber are required' });

  const existing = db.prepare('SELECT id FROM set_logs WHERE session_id = ? AND exercise_id = ? AND set_number = ?')
    .get(session.id, exerciseId, setNumber);

  if (existing) {
    db.prepare(`UPDATE set_logs SET weight_kg=?, reps=?, distance_m=?, duration_sec=?, rpe=?, completed=? WHERE id=?`)
      .run(weightKg, reps, distanceM, durationSec, rpe, completed ? 1 : 0, existing.id);
  } else {
    db.prepare(`INSERT INTO set_logs (id, session_id, exercise_id, set_number, weight_kg, reps, distance_m, duration_sec, rpe, completed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(uid(), session.id, exerciseId, setNumber, weightKg, reps, distanceM, durationSec, rpe, completed ? 1 : 0);
  }

  // A fixed-duration stamina check-in (a 30-minute walk, logged with an RPE)
  // isn't a personal best in any meaningful sense — it's the same target
  // every time. Only track PBs for genuine timed/weighted/distance efforts.
  if (completed && rpe == null) maybeUpdatePersonalBest(exerciseId, { weightKg, reps, distanceM, durationSec });

  res.json(sessionDetail(session.id));
});

sessionsRouter.post('/:id/complete', (req, res) => {
  const session = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'not_found' });
  db.prepare('UPDATE workout_sessions SET completed_at = datetime(\'now\') WHERE id = ?').run(session.id);
  res.json(sessionDetail(session.id));
});

sessionsRouter.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM workout_sessions ORDER BY started_at DESC LIMIT 50').all();
  res.json(rows.map((s) => ({
    id: s.id, planDayId: s.plan_day_id, title: s.title,
    startedAt: s.started_at, completedAt: s.completed_at,
  })));
});
