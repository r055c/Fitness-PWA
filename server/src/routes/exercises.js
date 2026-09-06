import { Router } from 'express';
import { db } from '../db.js';
import { exerciseRowToJson } from '../serialize.js';

export const exercisesRouter = Router();

exercisesRouter.get('/', (req, res) => {
  const { search = '', category = '', tag = '', equipment = '', difficulty = '' } = req.query;

  let sql = 'SELECT * FROM exercises WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (equipment) {
    sql += ' AND equipment = ?';
    params.push(equipment);
  }
  if (difficulty) {
    sql += ' AND difficulty = ?';
    params.push(difficulty);
  }
  if (tag) {
    sql += ' AND tags LIKE ?';
    params.push(`%"${tag}"%`);
  }

  sql += ' ORDER BY name ASC LIMIT 200';

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(exerciseRowToJson));
});

exercisesRouter.get('/categories', (_req, res) => {
  const rows = db.prepare('SELECT DISTINCT category FROM exercises ORDER BY category').all();
  res.json(rows.map((r) => r.category));
});

exercisesRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json(exerciseRowToJson(row));
});
