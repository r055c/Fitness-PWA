// Seeds the database with the exercise library and a default weekly plan
// built around a Friday match. Safe to re-run: exercises are upserted,
// the plan is replaced each time (session/log history is left untouched).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, uid } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedDataDir = path.join(__dirname, 'seed-data');

function loadExercises() {
  const base = JSON.parse(fs.readFileSync(path.join(seedDataDir, 'exercises-base.json'), 'utf8'));
  const extra = JSON.parse(fs.readFileSync(path.join(seedDataDir, 'exercises-extra.json'), 'utf8'));
  return [...base, ...extra];
}

function seedExercises() {
  const exercises = loadExercises();
  const insert = db.prepare(`
    INSERT INTO exercises (id, name, category, equipment, difficulty, mechanic, force, primary_muscles, secondary_muscles, instructions, tags, images)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, category=excluded.category, equipment=excluded.equipment,
      difficulty=excluded.difficulty, mechanic=excluded.mechanic, force=excluded.force,
      primary_muscles=excluded.primary_muscles, secondary_muscles=excluded.secondary_muscles,
      instructions=excluded.instructions, tags=excluded.tags, images=excluded.images
  `);

  const tx = db.exec.bind(db);
  db.exec('BEGIN');
  try {
    for (const ex of exercises) {
      insert.run(
        ex.id, ex.name, ex.category, ex.equipment, ex.difficulty, ex.mechanic, ex.force,
        JSON.stringify(ex.primaryMuscles), JSON.stringify(ex.secondaryMuscles),
        JSON.stringify(ex.instructions), JSON.stringify(ex.tags), JSON.stringify(ex.images)
      );
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  console.log(`Seeded ${exercises.length} exercises.`);
}

// day: { day, type, title, subtitle, durationMin, exercises: [{ exerciseId, sets, reps, restSeconds }] }
const DEFAULT_PLAN = [
  {
    day: 'MON', type: 'strength', title: 'Full Body Strength', subtitle: 'gym', durationMin: 45,
    exercises: [
      { exerciseId: 'Barbell_Squat', sets: 3, reps: '8', restSeconds: 90 },
      { exerciseId: 'Bent_Over_Barbell_Row', sets: 3, reps: '10', restSeconds: 75 },
      { exerciseId: 'Barbell_Bench_Press_-_Medium_Grip', sets: 3, reps: '8', restSeconds: 90 },
      { exerciseId: 'Plank', sets: 3, reps: '45s', restSeconds: 45 },
      { exerciseId: 'Standing_Dumbbell_Calf_Raise', sets: 3, reps: '15', restSeconds: 45 },
    ],
  },
  {
    day: 'TUE', type: 'speed_agility', title: 'Speed & Agility', subtitle: 'sprints, ladder & cone drills', durationMin: 30,
    exercises: [
      { exerciseId: 'High_Knees', sets: 3, reps: '20s', restSeconds: 30 },
      { exerciseId: 'Agility_Ladder_Icky_Shuffle', sets: 3, reps: 'through', restSeconds: 30 },
      { exerciseId: 'Cone_Weave_Sprints', sets: 4, reps: '1 lap', restSeconds: 45 },
      { exerciseId: 'Shuttle_Sprints_Suicides', sets: 4, reps: '1 rep', restSeconds: 75 },
      { exerciseId: 'Star_Agility_Drill', sets: 3, reps: '1 round', restSeconds: 60 },
    ],
  },
  {
    day: 'WED', type: 'stamina', title: 'Stamina Intervals', subtitle: 'running, builds match-fitness endurance', durationMin: 30,
    exercises: [
      { exerciseId: 'Jump_Rope_Basic_Bounce', sets: 5, reps: '1min', restSeconds: 30 },
      { exerciseId: 'Hill_Sprints', sets: 6, reps: '1 rep', restSeconds: 90 },
      { exerciseId: 'Burpees', sets: 3, reps: '15', restSeconds: 45 },
      { exerciseId: 'Mountain_Climbers', sets: 3, reps: '30s', restSeconds: 30 },
    ],
  },
  {
    day: 'THU', type: 'mobility', title: 'Light Mobility', subtitle: 'deload before match', durationMin: 20,
    exercises: [
      { exerciseId: 'Worlds_Greatest_Stretch', sets: 2, reps: '5 each side', restSeconds: 15 },
      { exerciseId: 'Kneeling_Hip_Flexor', sets: 2, reps: '30s each side', restSeconds: 15 },
      { exerciseId: 'Hamstring_Stretch', sets: 2, reps: '30s each side', restSeconds: 15 },
      { exerciseId: 'Plank', sets: 2, reps: '30s', restSeconds: 30 },
    ],
  },
  {
    day: 'FRI', type: 'football', title: '5-a-side Football', subtitle: '8:00 PM · The Sports Dome', durationMin: 60,
    exercises: [],
  },
  {
    day: 'SAT', type: 'rest', title: 'Rest & Recovery', subtitle: 'stretch or walk, optional', durationMin: null,
    exercises: [],
  },
  {
    day: 'SUN', type: 'strength', title: 'Upper Body Strength', subtitle: 'gym', durationMin: 40,
    exercises: [
      { exerciseId: 'Barbell_Bench_Press_-_Medium_Grip', sets: 4, reps: '8', restSeconds: 90 },
      { exerciseId: 'Pullups', sets: 4, reps: '8', restSeconds: 90 },
      { exerciseId: 'Standing_Dumbbell_Press', sets: 3, reps: '10', restSeconds: 75 },
      { exerciseId: 'Dumbbell_Bicep_Curl', sets: 3, reps: '12', restSeconds: 45 },
      { exerciseId: 'Triceps_Pushdown', sets: 3, reps: '12', restSeconds: 45 },
    ],
  },
];

function seedPlan() {
  const knownIds = new Set(db.prepare('SELECT id FROM exercises').all().map((r) => r.id));

  db.exec('DELETE FROM plan_day_exercises');
  db.exec('DELETE FROM plan_days');

  const insertDay = db.prepare(`
    INSERT INTO plan_days (id, day_of_week, type, title, subtitle, duration_min, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEx = db.prepare(`
    INSERT INTO plan_day_exercises (id, plan_day_id, exercise_id, sort_order, sets, reps, rest_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  DEFAULT_PLAN.forEach((day, dayIndex) => {
    const dayId = uid();
    insertDay.run(dayId, day.day, day.type, day.title, day.subtitle, day.durationMin, dayIndex);
    day.exercises.forEach((ex, exIndex) => {
      if (!knownIds.has(ex.exerciseId)) {
        console.warn(`Warning: plan references unknown exercise id "${ex.exerciseId}" (skipped)`);
        return;
      }
      insertEx.run(uid(), dayId, ex.exerciseId, exIndex, ex.sets, ex.reps, ex.restSeconds);
    });
  });

  console.log(`Seeded default weekly plan (${DEFAULT_PLAN.length} days).`);
}

function seedProfile() {
  const existing = db.prepare('SELECT id FROM profile WHERE id = 1').get();
  if (existing) return;
  db.prepare(`
    INSERT INTO profile (id, name, goal, starting_weight_kg, goal_weight_kg, match_day, match_time, match_venue, onboarded)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, 0)
  `).run('there', 'lose_weight_football', null, null, 'FRI', '20:00', 'The Sports Dome');
  console.log('Seeded default profile.');
}

seedExercises();
seedPlan();
seedProfile();
console.log('Done.');
