-- FitFive database schema (SQLite)

CREATE TABLE IF NOT EXISTS exercises (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  category          TEXT NOT NULL,      -- strength | cardio | plyometrics | stretching | strongman | powerlifting | olympic weightlifting
  equipment         TEXT,
  difficulty        TEXT NOT NULL,      -- beginner | intermediate | advanced
  mechanic          TEXT,               -- compound | isolation
  force             TEXT,               -- push | pull | static
  primary_muscles   TEXT NOT NULL,      -- JSON array
  secondary_muscles TEXT NOT NULL,      -- JSON array
  instructions      TEXT NOT NULL,      -- JSON array of step strings
  tags              TEXT NOT NULL,      -- JSON array, e.g. ["speed","stamina","football"]
  images            TEXT NOT NULL       -- JSON array of relative image paths (may be empty)
);

CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises(name);

CREATE TABLE IF NOT EXISTS profile (
  id               INTEGER PRIMARY KEY CHECK (id = 1),
  name             TEXT NOT NULL DEFAULT 'there',
  goal             TEXT NOT NULL DEFAULT 'lose_weight_football',
  starting_weight_kg REAL,
  goal_weight_kg     REAL,
  match_day        TEXT NOT NULL DEFAULT 'FRI', -- MON..SUN
  match_time       TEXT,
  match_venue      TEXT,
  onboarded        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS weight_entries (
  id         TEXT PRIMARY KEY,
  weight_kg  REAL NOT NULL,
  logged_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plan_days (
  id            TEXT PRIMARY KEY,
  day_of_week   TEXT NOT NULL,   -- MON..SUN
  type          TEXT NOT NULL,   -- strength | speed_agility | stamina | mobility | football | rest
  title         TEXT NOT NULL,
  subtitle      TEXT,
  duration_min  INTEGER,
  sort_order    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS plan_day_exercises (
  id            TEXT PRIMARY KEY,
  plan_day_id   TEXT NOT NULL REFERENCES plan_days(id) ON DELETE CASCADE,
  exercise_id   TEXT NOT NULL REFERENCES exercises(id),
  sort_order    INTEGER NOT NULL,
  sets          INTEGER,
  reps          TEXT,            -- "10", "30s", "20m" etc - free-form target
  rest_seconds  INTEGER
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id            TEXT PRIMARY KEY,
  plan_day_id   TEXT REFERENCES plan_days(id),
  title         TEXT NOT NULL,
  started_at    TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at  TEXT
);

CREATE TABLE IF NOT EXISTS set_logs (
  id            TEXT PRIMARY KEY,
  session_id    TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id   TEXT NOT NULL REFERENCES exercises(id),
  set_number    INTEGER NOT NULL,
  weight_kg     REAL,
  reps          INTEGER,
  distance_m    REAL,
  duration_sec  REAL,
  completed     INTEGER NOT NULL DEFAULT 0,
  logged_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS personal_bests (
  id            TEXT PRIMARY KEY,
  exercise_id   TEXT NOT NULL REFERENCES exercises(id),
  metric        TEXT NOT NULL,   -- "weight_reps" | "distance_time" | "duration"
  value         REAL NOT NULL,
  unit          TEXT NOT NULL,
  detail        TEXT,            -- e.g. "70 kg x 5"
  achieved_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
