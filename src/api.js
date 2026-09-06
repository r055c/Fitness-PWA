// Everything the UI needs, backed by IndexedDB (see lib/db.js) instead of
// a server — this is what makes the app deployable as static files (GitHub
// Pages included). The exercise library and weekly plan are read-only
// static data (lib/exercises.js, lib/plan.js); only profile, weigh-ins,
// sessions/sets and personal bests are user data, kept in the browser.
//
// Function names and return shapes intentionally mirror what used to be a
// real HTTP API, so the page components didn't need to change.
import { getAll, getOne, put, uid } from './lib/db.js';
import { getExercises as queryExercises, getExercise as findExercise, getExerciseMap } from './lib/exercises.js';
import { DEFAULT_PLAN } from './lib/plan.js';

const SERVER_DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const DEFAULT_PROFILE = {
  key: 'profile',
  name: 'there',
  goal: 'lose_weight_football',
  startingWeightKg: null,
  goalWeightKg: null,
  matchDay: 'FRI',
  matchTime: '20:00',
  matchVenue: 'The Sports Dome',
  onboarded: false,
};

function stripKey({ key: _key, ...rest }) {
  return rest;
}

async function getProfile() {
  const row = await getOne('meta', 'profile');
  return stripKey(row || DEFAULT_PROFILE);
}

async function updateProfile(data) {
  const current = await getOne('meta', 'profile') || DEFAULT_PROFILE;
  const updated = { ...current, ...data, key: 'profile' };
  await put('meta', updated);

  if (data.startingWeightKg && !current.startingWeightKg) {
    await put('weightEntries', { id: uid(), weightKg: data.startingWeightKg, loggedAt: new Date().toISOString() });
  }

  return stripKey(updated);
}

async function planWithExercises() {
  const exMap = await getExerciseMap();
  return DEFAULT_PLAN.map((day) => ({
    id: day.day,
    day: day.day,
    type: day.type,
    title: day.title,
    subtitle: day.subtitle,
    durationMin: day.durationMin,
    exercises: day.exercises
      .map((pe) => {
        const ex = exMap.get(pe.exerciseId);
        if (!ex) return null;
        return { ...ex, target: { sets: pe.sets, reps: pe.reps, restSeconds: pe.restSeconds } };
      })
      .filter(Boolean),
  }));
}

async function getPlan() {
  return planWithExercises();
}

async function getToday() {
  const plan = await planWithExercises();
  const code = SERVER_DOW[new Date().getDay()];
  return plan.find((d) => d.day === code) || null;
}

async function getPlanDay(id) {
  const plan = await planWithExercises();
  return plan.find((d) => d.id === id) || null;
}

async function previousSetsFor(exerciseId, excludeSessionId) {
  const all = await getAll('setLogs');
  return all
    .filter((s) => s.exerciseId === exerciseId && s.sessionId !== excludeSessionId && s.completed)
    .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))
    .slice(0, 10);
}

async function sessionDetail(sessionId) {
  const session = await getOne('sessions', sessionId);
  if (!session) return null;

  let planExercises = [];
  if (session.planDayId) {
    const day = await getPlanDay(session.planDayId);
    planExercises = day ? day.exercises : [];
  }

  const allSetLogs = await getAll('setLogs');
  const setLogs = allSetLogs.filter((s) => s.sessionId === sessionId).sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt));

  const exercisesWithHistory = await Promise.all(
    planExercises.map(async (ex) => ({
      ...ex,
      previousSets: (await previousSetsFor(ex.id, sessionId)).map((s) => ({
        setNumber: s.setNumber, weightKg: s.weightKg, reps: s.reps,
        distanceM: s.distanceM, durationSec: s.durationSec, rpe: s.rpe,
      })),
    }))
  );

  return {
    id: session.id,
    title: session.title,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    exercises: exercisesWithHistory,
    setLogs: setLogs.map((s) => ({
      id: s.id, exerciseId: s.exerciseId, setNumber: s.setNumber,
      weightKg: s.weightKg, reps: s.reps, distanceM: s.distanceM,
      durationSec: s.durationSec, rpe: s.rpe, completed: !!s.completed,
    })),
  };
}

async function startSession(planDayId) {
  const day = planDayId ? await getPlanDay(planDayId) : null;
  const id = uid();
  await put('sessions', {
    id, planDayId: planDayId || null, title: day ? day.title : 'Workout',
    startedAt: new Date().toISOString(), completedAt: null,
  });
  return sessionDetail(id);
}

async function getSession(id) {
  return sessionDetail(id);
}

async function maybeUpdatePersonalBest(exerciseId, { weightKg, reps, distanceM, durationSec }) {
  let metric, value, unit, detail;
  if (weightKg && reps) {
    metric = 'weight_reps'; value = weightKg; unit = 'kg'; detail = `${weightKg} kg x ${reps}`;
  } else if (distanceM && durationSec) {
    metric = 'distance_time'; value = distanceM / durationSec; unit = 'm/s'; detail = `${distanceM} m in ${durationSec}s`;
  } else if (durationSec) {
    metric = 'duration'; value = durationSec; unit = 's'; detail = `${durationSec}s`;
  } else {
    return;
  }

  const all = await getAll('personalBests');
  const existing = all.find((pb) => pb.exerciseId === exerciseId && pb.metric === metric);
  if (!existing || value > existing.value) {
    await put('personalBests', {
      id: existing ? existing.id : uid(),
      exerciseId, metric, value, unit, detail,
      achievedAt: new Date().toISOString(),
    });
  }
}

async function logSet(sessionId, data) {
  const { exerciseId, setNumber, weightKg = null, reps = null, distanceM = null, durationSec = null, rpe = null, completed = true } = data;
  if (!exerciseId || !setNumber) throw new Error('exerciseId and setNumber are required');

  await put('setLogs', {
    id: `${sessionId}-${exerciseId}-${setNumber}`,
    sessionId, exerciseId, setNumber, weightKg, reps, distanceM, durationSec, rpe,
    completed: !!completed,
    loggedAt: new Date().toISOString(),
  });

  // A fixed-duration stamina check-in (a walk, logged with an RPE) isn't a
  // personal best in any meaningful sense — it's the same target every
  // time. Only track PBs for genuine timed/weighted/distance efforts.
  if (completed && rpe == null) await maybeUpdatePersonalBest(exerciseId, { weightKg, reps, distanceM, durationSec });

  return sessionDetail(sessionId);
}

async function completeSession(id) {
  const session = await getOne('sessions', id);
  if (!session) throw new Error('not_found');
  await put('sessions', { ...session, completedAt: new Date().toISOString() });
  return sessionDetail(id);
}

async function getWeight() {
  const all = await getAll('weightEntries');
  return all.sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt));
}

async function addWeight(weightKg) {
  if (typeof weightKg !== 'number' || weightKg <= 0) throw new Error('weightKg must be a positive number');
  const entry = { id: uid(), weightKg, loggedAt: new Date().toISOString() };
  await put('weightEntries', entry);
  return entry;
}

function dateOnly(d) {
  return d.toISOString().slice(0, 10);
}

function computeStreak(sessionDates) {
  const days = new Set(sessionDates);
  let streak = 0;
  const cursor = new Date();
  if (!days.has(dateOnly(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dateOnly(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

async function getProgressSummary() {
  const profile = await getProfile();
  const weightEntries = await getWeight();
  const weightSeries = weightEntries.map((r) => ({ weightKg: r.weightKg, loggedAt: r.loggedAt }));
  const currentWeightKg = weightSeries.at(-1)?.weightKg ?? profile.startingWeightKg ?? null;

  const sessions = await getAll('sessions');
  const completedSessions = sessions.filter((s) => s.completedAt).sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));
  const sessionDates = completedSessions.map((s) => s.startedAt.slice(0, 10));

  const streakDays = computeStreak(sessionDates);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const sessionsThisWeek = completedSessions.filter((s) => new Date(s.startedAt) >= weekAgo).length;

  const since = new Date();
  since.setDate(since.getDate() - 55);
  const counts = new Map();
  for (const s of completedSessions) {
    const d = s.startedAt.slice(0, 10);
    counts.set(d, (counts.get(d) || 0) + 1);
  }
  const consistency = [];
  for (let i = 0; i < 56; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = dateOnly(d);
    consistency.push({ date: key, count: counts.get(key) || 0 });
  }

  const exMap = await getExerciseMap();
  const allSetLogs = await getAll('setLogs');
  const staminaLog = allSetLogs
    .filter((s) => s.completed && s.rpe != null && exMap.get(s.exerciseId)?.tags.includes('stamina'))
    .sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt))
    .map((s) => ({
      loggedAt: s.loggedAt, exerciseName: exMap.get(s.exerciseId)?.name ?? 'Exercise',
      durationSec: s.durationSec, distanceM: s.distanceM, rpe: s.rpe,
    }));

  let staminaTrend = null;
  if (staminaLog.length >= 4) {
    const half = Math.max(1, Math.floor(staminaLog.length / 2));
    const earlyAvg = staminaLog.slice(0, half).reduce((sum, l) => sum + l.rpe, 0) / half;
    const recentCount = staminaLog.length - half;
    const recentAvg = staminaLog.slice(half).reduce((sum, l) => sum + l.rpe, 0) / recentCount;
    staminaTrend = { earlyAvgRpe: +earlyAvg.toFixed(1), recentAvgRpe: +recentAvg.toFixed(1) };
  }

  const personalBestRows = await getAll('personalBests');
  const personalBests = personalBestRows
    .sort((a, b) => new Date(b.achievedAt) - new Date(a.achievedAt))
    .slice(0, 20)
    .map((pb) => ({
      id: pb.id, exerciseId: pb.exerciseId, exerciseName: exMap.get(pb.exerciseId)?.name ?? 'Exercise',
      metric: pb.metric, value: pb.value, unit: pb.unit, detail: pb.detail, achievedAt: pb.achievedAt,
    }));

  return {
    startingWeightKg: profile.startingWeightKg,
    currentWeightKg,
    goalWeightKg: profile.goalWeightKg,
    weightSeries,
    streakDays,
    sessionsThisWeek,
    consistency,
    staminaLog: staminaLog.slice(-20).reverse(),
    staminaTrend,
    personalBests,
  };
}

export const api = {
  getProfile,
  updateProfile,
  getPlan,
  getToday,
  getPlanDay,
  getExercises: queryExercises,
  getExercise: findExercise,
  startSession,
  getSession,
  logSet,
  completeSession,
  getWeight,
  addWeight,
  getProgressSummary,
};
