# FitFive

A fitness PWA built around one fixed point in the week: your Friday five-a-side
match. It generates a weekly training plan that tapers into match day, tracks
workouts against a searchable exercise library (with step-by-step instructions),
and logs your weight over time towards a goal.

No Supabase, no backend server to run or pay for — it's a fully static React
PWA that stores everything in the browser (IndexedDB), which is what makes it
deployable for free on GitHub Pages, just like it would be with any static
site. Install it to your phone's home screen and it works offline from then on.

## Stack

- React + Vite, `vite-plugin-pwa` (installable, offline caching of the app shell and the exercise library).
- **Storage: IndexedDB**, in the browser — no server, no database to host. `src/api.js` exposes the same functions a real backend would, so the page components don't know or care that there isn't one.
- Routing is hash-based (`/#/schedule`, not `/schedule`) — deliberately, since GitHub Pages can't rewrite unknown paths back to `index.html` the way a real server can, and a hash route never hits the server at all.

## The trade-off worth knowing

Your workout history, weight log, and personal bests live in that one
browser, on that one device. There's no account and nothing syncs between
your phone and a laptop. Clearing your browser's site data, or switching
phones, loses your history. If that becomes a problem, the fix is either an
export/import feature (happy to add one) or moving back to a real backend
with a proper database — this static version and a server-backed version
are two genuinely different apps under the hood, not a setting to flip.

## Exercise library

Seeded from [free-exercise-db](https://github.com/yuhonas/free-exercise-db)
(public domain, ~870 exercises with instructions, muscle groups, equipment
and difficulty), plus ~14 hand-written speed/agility/conditioning drills
(shuttle sprints, agility ladder patterns, hill sprints, the bleep test, etc.)
that free-exercise-db doesn't cover. Every exercise is tagged `speed`,
`stamina`, `strength` and/or `mobility` so the library and the weekly plan
can filter by training goal, not just muscle group.

`data/exercises-base.json` + `data/exercises-extra.json` are the source
files; `npm run dev`/`npm run build` combine them into `public/exercises.json`
automatically (see `scripts/build-exercise-data.mjs`) — edit the source
files and re-run, don't hand-edit the generated one. Exercise photos link to
GitHub's raw content CDN rather than being bundled, so they need a network
connection the first time (cached for offline after that); everything else
works fully offline once installed.

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

This is a starting point, not a fixed rule — edit `src/lib/plan.js`
(`DEFAULT_PLAN`) to change it: which days you have gym access, which
night your match falls on, exercise selection, anything. It's plain data,
no build step or database migration needed.

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

## Running it locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`). No database
setup, no seed step — the exercise library is static data and your own
data is created the moment you go through onboarding, right there in the
browser.

## Deploying to GitHub Pages

A GitHub Actions workflow (`.github/workflows/deploy.yml`) is already set
up to build and publish the app on every push to `main`. One manual,
one-time step is needed for a brand new repo: in the repo's **Settings →
Pages**, set **Source** to **GitHub Actions** (instead of "Deploy from a
branch"). After that, every push to `main` redeploys automatically — check
the **Actions** tab for progress, and the same Settings → Pages screen for
the live URL (`https://<you>.github.io/Fitness-PWA/`).

The build is already configured for a project-page subpath — if you rename
the repository, update `REPO_NAME` in `vite.config.js` to match.

Once it's live, open it on your phone and use the browser's "Add to Home
Screen" — it installs and behaves like a native app from then on.

## Project layout

```
data/
  exercises-base.json    — free-exercise-db, transformed (see the repo history for the prep script)
  exercises-extra.json   — hand-written speed/agility/conditioning drills
scripts/
  build-exercise-data.mjs — combines the two into public/exercises.json
src/
  lib/
    db.js                — thin IndexedDB wrapper (via the `idb` package)
    exercises.js         — reads/filters the static exercise library
    plan.js              — DEFAULT_PLAN — the weekly plan, as plain data
  api.js                 — same interface a real backend would expose, backed by lib/
  pages/                 — one file per screen (Home, Schedule, Exercise
                            Library/Detail, Workout Session, Progress, Onboarding)
  components/            — shared icons, tab bar, day-type icon mapping
```

## What's not in scope (yet)

- Single user, no accounts — and see "The trade-off worth knowing" above re: where data lives.
- No data export/import yet — worth adding given the above.
- No push notifications for match day or rest timers.
