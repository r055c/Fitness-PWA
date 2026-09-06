import { Router } from 'express';
import { db, uid } from '../db.js';

export const weightRouter = Router();

weightRouter.get('/', (req, res) => {
  const { limit = 200 } = req.query;
  const rows = db.prepare('SELECT * FROM weight_entries ORDER BY logged_at ASC LIMIT ?').all(Number(limit));
  res.json(rows.map((r) => ({ id: r.id, weightKg: r.weight_kg, loggedAt: r.logged_at })));
});

weightRouter.post('/', (req, res) => {
  const { weightKg, loggedAt } = req.body;
  if (typeof weightKg !== 'number' || weightKg <= 0) {
    return res.status(400).json({ error: 'weightKg must be a positive number' });
  }
  const id = uid();
  if (loggedAt) {
    db.prepare('INSERT INTO weight_entries (id, weight_kg, logged_at) VALUES (?, ?, ?)').run(id, weightKg, loggedAt);
  } else {
    db.prepare('INSERT INTO weight_entries (id, weight_kg) VALUES (?, ?)').run(id, weightKg);
  }
  const row = db.prepare('SELECT * FROM weight_entries WHERE id = ?').get(id);
  res.status(201).json({ id: row.id, weightKg: row.weight_kg, loggedAt: row.logged_at });
});
