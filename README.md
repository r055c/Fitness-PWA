# FitFive

A fitness PWA built around one fixed point in the week: your Friday five-a-side
match. It generates a weekly training plan that tapers into match day, tracks
workouts against a searchable exercise library (with step-by-step instructions),
and logs your weight over time towards a goal.

No Supabase, no third-party backend — just a small Express API backed by
SQLite (via Node's built-in `node:sqlite`), and a React PWA frontend that
installs to your home screen and works offline.

## Stack

- **Client**: React + Vite, `vite-plugin-pwa` (installable, offline app-shell caching), plain CSS (no framework) matching the mockups' design tokens.
- **Server**: Express + `node:sqlite` (Node's built-in SQLite driver — no native build step, no external DB service).
- **Data**: one process serves both the API and the built client, so it's a single `npm start` away from running anywhere Node runs (a laptop, a Raspberry Pi, a small VPS).

## Exercise library

Seeded from [free-exercise-db](https://github.com/yuhonas/free-exercise-db)
(public domain, ~870 exercises with instructions, muscle groups, equipment
and difficulty), plus ~14 hand-written speed/agility/conditioning drills
(shuttle sprints, agility ladder patterns, hill sprints, the bleep test, etc.)
that free-exercise-db doesn't cover, since those are exactly the kind of
sessions a five-a-side player needs. Every exercise is additionally tagged
`speed`, `stamina`, `strength` and/or `mobility` so the library and the
default plan can filter by training goal, not just muscle group.

Exercise photos and Google Fonts are loaded from the network at runtime
(GitHub's raw content CDN and Google Fonts respectively) — nothing large is
vendored into the repo. Everything else (instructions, muscle data, the
weekly plan, your logged sets and weight) lives in the local SQLite file.

## The weekly plan

The default plan is built for two gym days and a desk job: full-body
strength (not a split — more effective at low weekly frequency) on the
days there's actually gym access, low-impact walking in between rather
than sprint/plyometric work, since that's the wrong starting point at a
higher bodyweight with a sedentary background, and a taper into Friday's
match.

| Day | Session |
| --- | --- |
| Mon | **Full Body Strength A** — gym |
| Tue | Brisk Walk — no gym needed |
| Wed | **Full Body Strength B** — gym |
| Thu | Light Mobility — deload before match, no gym needed |
| Fri | 5-a-side Football |
| Sat | Rest & Recovery |
| Sun | Steady State Walk — no gym needed |

Higher-impact speed/agility drills (shuttle sprints, agility ladder,
hill sprints, box jumps) are still in the exercise library under the
"Speed & Stamina" filter — worth reintroducing once base fitness and
bodyweight have moved, just not the right starting point on day one.

This is a starting point, not a fixed rule — edit `server/src/seed.js`
(`DEFAULT_PLAN`) and re-run `npm run seed` to change it: which days you
have gym access, which night your match falls on, exercise selection,
anything.

## Measuring stamina progress

Weight and workout consistency are tracked automatically, but stamina is
trickier — there's no single number for it. The app handles this by making
the Brisk Walk and Steady State Walk sessions a repeatable test: the
duration is fixed, so after finishing one it asks **"how hard did that
feel?"** (a 1–10 RPE score, the standard perceived-exertion scale). Progress
→ Stamina check-ins then shows that history and calls out the trend —
the same walk scoring a 4/10 where it used to score a 7/10 is direct
evidence your stamina has improved, independent of the scale.

A few other signs worth watching, especially since these aren't (yet) app
features:

- **The talk test** — able to hold more of a conversation at the same walking pace.
- **Recovery** — feeling less wrecked in the second half of Friday's match, or bouncing back faster the day after.
- **Resting heart rate**, if you have any way to check it (phone, watch, or just a manual pulse count first thing in the morning) — a gradual drop over weeks is one of the clearest cardiovascular fitness signals there is.
- A **fixed-route timing check** every couple of weeks — walk the same route at the same effort and see if it gets faster, separate from the in-app RPE score.

4 weeks is enough to see early movement on RPE and the talk test; resting
heart rate and weight tend to need a bit longer to trend clearly.

## Getting started

Requires Node 22.5+ (for `node:sqlite`).

```bash
npm install       # installs both workspaces (client + server)
npm run seed      # creates server/data/app.db and seeds exercises + plan
npm run dev       # runs the API (port 3001) and the Vite dev server together
```

Open the URL Vite prints (typically `http://localhost:5173`). The dev server
proxies `/api` to the Express server, so there's no CORS setup needed.

### Production / self-hosting

```bash
npm run build     # builds the client into client/dist
npm run seed      # first run only
npm start         # single Node process serves the API + the built app on :3001
```

Open `http://localhost:3001` (or your server's address) and "Add to Home
Screen" — it installs like a native app and the app shell works offline.

## Project layout

```
server/
  src/
    schema.sql          — SQLite schema
    db.js               — opens the database, applies the schema
    seed.js             — seeds exercises + the default weekly plan
    seed-data/           — exercise JSON (free-exercise-db + curated extras)
    routes/              — exercises, plan, sessions, weight, profile, progress
    app.js, index.js     — Express app + entrypoint
client/
  src/
    pages/                — one file per screen (Home, Schedule, Exercise
                             Library/Detail, Workout Session, Progress, Onboarding)
    components/           — shared icons, tab bar, day-type icon mapping
    api.js                — fetch wrapper for the server API
```

## What's not in scope (yet)

- Single user, no accounts/auth — this is a personal-use app.
- No push notifications for match day or rest timers.
- Exercise photos are linked from GitHub rather than bundled, so they need a
  network connection to load (the rest of the app works fully offline once cached).
