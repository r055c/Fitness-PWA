import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { exercisesRouter } from './routes/exercises.js';
import { planRouter } from './routes/plan.js';
import { sessionsRouter } from './routes/sessions.js';
import { weightRouter } from './routes/weight.js';
import { profileRouter } from './routes/profile.js';
import { progressRouter } from './routes/progress.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.use(express.json());

  app.use('/api/exercises', exercisesRouter);
  app.use('/api/plan', planRouter);
  app.use('/api/sessions', sessionsRouter);
  app.use('/api/weight', weightRouter);
  app.use('/api/profile', profileRouter);
  app.use('/api/progress', progressRouter);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // In production, serve the built client (npm run build) as static files.
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return app;
}
