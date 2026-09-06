import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { IconFlame, IconTrophy } from '../components/Icons.jsx';
import './Progress.css';

function buildPath(series, w, h) {
  if (series.length < 2) return null;
  const weights = series.map((p) => p.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const stepX = w / (series.length - 1);
  return series
    .map((p, i) => {
      const x = i * stepX;
      const y = h - ((p.weightKg - min) / range) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function heatColor(count) {
  if (count >= 2) return 'var(--green)';
  if (count === 1) return '#a8dcc4';
  return 'var(--gray-soft)';
}

export function Progress() {
  const [summary, setSummary] = useState(null);
  const [weightInput, setWeightInput] = useState('');

  function reload() {
    api.getProgressSummary().then(setSummary);
  }

  useEffect(reload, []);

  async function handleLogWeight() {
    const v = Number(weightInput);
    if (!v) return;
    await api.addWeight(v);
    setWeightInput('');
    reload();
  }

  if (!summary) return <div className="spinner-wrap">Loading…</div>;

  const { currentWeightKg, startingWeightKg, goalWeightKg, weightSeries, streakDays, consistency, personalBests } = summary;
  const change = startingWeightKg && currentWeightKg ? +(currentWeightKg - startingWeightKg).toFixed(1) : null;
  const path = buildPath(weightSeries.slice(-14), 320, 70);

  return (
    <div className="scroll">
      <div className="title">Progress</div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="chart-head">
          <span className="n">{currentWeightKg != null ? `${currentWeightKg} kg` : '—'}</span>
          <span className="l">current weight</span>
        </div>
        {path ? (
          <svg width="100%" height="90" viewBox="0 0 320 90" style={{ marginTop: 10 }} preserveAspectRatio="none">
            <path d={path} fill="none" stroke="#1f9d6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <div className="wsub" style={{ marginTop: 10 }}>Log a couple of weigh-ins to see your trend.</div>
        )}
        <div className="stats-grid">
          <div className="g-stat"><div className="v">{startingWeightKg ?? '—'} kg</div><div className="k">Starting</div></div>
          <div className="g-stat"><div className="v">{currentWeightKg ?? '—'} kg</div><div className="k">Current</div></div>
          <div className="g-stat"><div className="v" style={{ color: change < 0 ? 'var(--green)' : undefined }}>{change != null ? `${change > 0 ? '+' : ''}${change} kg` : '—'}</div><div className="k">Change</div></div>
        </div>
        <div className="log-weight-row">
          <input type="number" inputMode="decimal" placeholder="Log today's weight (kg)" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} />
          <button onClick={handleLogWeight}>Log</button>
        </div>
        {goalWeightKg && <div className="wsub" style={{ marginTop: 8 }}>Goal: {goalWeightKg} kg</div>}
      </div>

      <div className="section-title"><h2>Workout consistency</h2></div>
      <div className="card heat-card">
        {consistency.map((d) => (
          <div key={d.date} className="heat-cell" style={{ background: heatColor(d.count) }} title={d.date} />
        ))}
        <div className="streak-line">
          <IconFlame />
          {streakDays}-day streak
        </div>
      </div>

      <div className="section-title"><h2>Personal bests</h2></div>
      <div className="pb-list">
        {personalBests.length === 0 && <div className="empty-state">Log some sets to start tracking PBs.</div>}
        {personalBests.map((pb) => (
          <div className="pb-row" key={pb.id}>
            <span className="pb-icon"><IconTrophy /></span>
            <div className="pb-info">
              <div className="n">{pb.exerciseName}</div>
              <div className="v">{pb.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
