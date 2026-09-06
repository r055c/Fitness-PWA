import { Router } from 'express';
import { db } from '../db.js';
import { exerciseRowToJson } from '../serialize.js';

export const planRouter = Router();

const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function todayCode(date = new Date()) {
  return DOW[date.getDay()];
}

function loadDayWithExercises(dayRow) {
  const exRows = db.prepare(`
    SELECT pde.sort_order, pde.sets, pde.reps, pde.rest_seconds, e.*
    FROM plan_day_exercises pde
    JOIN exercises e ON e.id = pde.exercise_id
    WHERE pde.plan_day_id = ?
    ORDER BY pde.sort_order ASC
  `).all(dayRow.id);

  return {
    id: dayRow.id,
    day: dayRow.day_of_week,
    type: dayRow.type,
    title: dayRow.title,
    subtitle: dayRow.subtitle,
    durationMin: dayRow.duration_min,
    exercises: exRows.map((row) => ({
      ...exerciseRowToJson(row),
      target: { sets: row.sets, reps: row.reps, restSeconds: row.rest_seconds },
    })),
  };
}

planRouter.get('/', (_req, res) => {
  const days = db.prepare('SELECT * FROM plan_days ORDER BY sort_order ASC').all();
  res.json(days.map(loadDayWithExercises));
});

planRouter.get('/today', (_req, res) => {
  const code = todayCode();
  const day = db.prepare('SELECT * FROM plan_days WHERE day_of_week = ?').get(code);
  if (!day) return res.status(404).json({ error: 'no_plan_for_today' });
  res.json(loadDayWithExercises(day));
});

planRouter.get('/days/:id', (req, res) => {
  const day = db.prepare('SELECT * FROM plan_days WHERE id = ?').get(req.params.id);
  if (!day) return res.status(404).json({ error: 'not_found' });
  res.json(loadDayWithExercises(day));
});
