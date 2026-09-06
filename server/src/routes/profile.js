import { Router } from 'express';
import { db, uid } from '../db.js';

export const profileRouter = Router();

function toJson(row) {
  return {
    name: row.name,
    goal: row.goal,
    startingWeightKg: row.starting_weight_kg,
    goalWeightKg: row.goal_weight_kg,
    matchDay: row.match_day,
    matchTime: row.match_time,
    matchVenue: row.match_venue,
    onboarded: !!row.onboarded,
  };
}

profileRouter.get('/', (_req, res) => {
  const row = db.prepare('SELECT * FROM profile WHERE id = 1').get();
  res.json(toJson(row));
});

profileRouter.put('/', (req, res) => {
  const { name, goal, startingWeightKg, goalWeightKg, matchDay, matchTime, matchVenue, onboarded } = req.body;
  const current = db.prepare('SELECT * FROM profile WHERE id = 1').get();

  db.prepare(`
    UPDATE profile SET
      name = ?, goal = ?, starting_weight_kg = ?, goal_weight_kg = ?,
      match_day = ?, match_time = ?, match_venue = ?, onboarded = ?
    WHERE id = 1
  `).run(
    name ?? current.name,
    goal ?? current.goal,
    startingWeightKg ?? current.starting_weight_kg,
    goalWeightKg ?? current.goal_weight_kg,
    matchDay ?? current.match_day,
    matchTime ?? current.match_time,
    matchVenue ?? current.match_venue,
    onboarded === undefined ? current.onboarded : (onboarded ? 1 : 0)
  );

  // If a starting weight is set for the first time, log it as the first weight entry.
  if (startingWeightKg && !current.starting_weight_kg) {
    db.prepare('INSERT INTO weight_entries (id, weight_kg) VALUES (?, ?)').run(uid(), startingWeightKg);
  }

  res.json(toJson(db.prepare('SELECT * FROM profile WHERE id = 1').get()));
});
