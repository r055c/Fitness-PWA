// Combines the exercise source data into one static JSON asset the app
// fetches at runtime. Runs automatically before dev/build (see package.json)
// so data/exercises-extra.json can just be edited and re-run picks it up.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const base = JSON.parse(fs.readFileSync(path.join(root, 'data', 'exercises-base.json'), 'utf8'));
const extra = JSON.parse(fs.readFileSync(path.join(root, 'data', 'exercises-extra.json'), 'utf8'));

const combined = [...base, ...extra];

const outDir = path.join(root, 'public');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'exercises.json'), JSON.stringify(combined));

console.log(`Wrote ${combined.length} exercises to public/exercises.json`);
