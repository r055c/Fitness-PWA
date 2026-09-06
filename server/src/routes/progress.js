import { Router } from 'express';
import { db } from '../db.js';

export const progressRouter = Router();

function dateOnly(d) {
  return d.toISOString().slice(0, 10);
}

function computeStreak(sessionDates) {
  const days = new Set(sessionDates);
  let streak = 0;
  const cursor = new Date();
  // if nothing logged today yet, still count backwards from yesterday
  if (!days.has(dateOnly(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dateOnly(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

progressRouter.get('/summary', (_req, res) => {
  const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get();

  const weightRows = db.prepare('SELECT weight_kg, logged_at FROM weight_entries ORDER BY logged_at ASC').all();
  const weightSeries = weightRows.map((r) => ({ weightKg: r.weight_kg, loggedAt: r.logged_at }));
  const currentWeight = weightSeries.at(-1)?.weightKg ?? profile.starting_weight_kg ?? null;

  const completedSessions = db.prepare(`
    SELECT started_at, completed_at FROM workout_sessions WHERE completed_at IS NOT NULL ORDER BY started_at ASC
  `).all();
  const sessionDates = completedSessions.map((s) => s.started_at.slice(0, 10));

  const streakDays = computeStreak(sessionDates);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const sessionsThisWeek = completedSessions.filter((s) => new Date(s.started_at) >= weekAgo).length;

  // Last 56 days consistency, oldest first, grouped in rows of 7 for a heatmap.
  const since = new Date();
  since.setDate(since.getDate() - 55);
  const counts = new Map();
  for (const s of completedSessions) {
    const d = s.started_at.slice(0, 10);
    counts.set(d, (counts.get(d) || 0) + 1);
  }
  const consistency = [];
  for (let i = 0; i < 56; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = dateOnly(d);
    consistency.push({ date: key, count: counts.get(key) || 0 });
  }

  const staminaLogRows = db.prepare(`
    SELECT sl.logged_at, sl.duration_sec, sl.distance_m, sl.rpe, e.name AS exercise_name
    FROM set_logs sl
    JOIN exercises e ON e.id = sl.exercise_id
    WHERE sl.completed = 1 AND sl.rpe IS NOT NULL AND e.tags LIKE '%"stamina"%'
    ORDER BY sl.logged_at ASC
  `).all();

  const staminaLog = staminaLogRows.map((r) => ({
    loggedAt: r.logged_at, exerciseName: r.exercise_name,
    durationSec: r.duration_sec, distanceM: r.distance_m, rpe: r.rpe,
  }));

  let staminaTrend = null;
  if (staminaLog.length >= 4) {
    const half = Math.max(1, Math.floor(staminaLog.length / 2));
    const earlyAvg = staminaLog.slice(0, half).reduce((s, l) => s + l.rpe, 0) / half;
    const recentCount = staminaLog.length - half;
    const recentAvg = staminaLog.slice(half).reduce((s, l) => s + l.rpe, 0) / recentCount;
    staminaTrend = { earlyAvgRpe: +earlyAvg.toFixed(1), recentAvgRpe: +recentAvg.toFixed(1) };
  }

  const personalBests = db.prepare(`
    SELECT pb.*, e.name AS exercise_name FROM personal_bests pb
    JOIN exercises e ON e.id = pb.exercise_id
    ORDER BY pb.achieved_at DESC
    LIMIT 20
  `).all().map((r) => ({
    id: r.id, exerciseId: r.exercise_id, exerciseName: r.exercise_name,
    metric: r.metric, value: r.value, unit: r.unit, detail: r.detail, achievedAt: r.achieved_at,
  }));

  res.json({
    startingWeightKg: profile.starting_weight_kg,
    currentWeightKg: currentWeight,
    goalWeightKg: profile.goal_weight_kg,
    weightSeries,
    streakDays,
    sessionsThisWeek,
    consistency,
    staminaLog: staminaLog.slice(-20).reverse(),
    staminaTrend,
    personalBests,
  });
});
