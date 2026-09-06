import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { IconTrendDown, IconDumbbell, IconHeart, IconCheck, IconArrowRight } from '../components/Icons.jsx';
import './Onboarding.css';

const GOALS = [
  { id: 'lose_weight_football', Icon: IconTrendDown, t: "Lose weight & get fitter for 5-a-side", s: 'Cardio-led plan, tuned around match day' },
  { id: 'build_strength', Icon: IconDumbbell, t: 'Build strength', s: 'Progressive lifting-focused plan' },
  { id: 'general_fitness', Icon: IconHeart, t: 'General fitness & energy', s: 'Balanced, low-pressure routine' },
];

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS = { MON: 'M', TUE: 'T', WED: 'W', THU: 'T', FRI: 'F', SAT: 'S', SUN: 'S' };

export function Onboarding({ profile, onDone }) {
  const navigate = useNavigate();
  const [goal, setGoal] = useState(profile.goal || 'lose_weight_football');
  const [startingWeight, setStartingWeight] = useState(profile.startingWeightKg || '');
  const [goalWeight, setGoalWeight] = useState(profile.goalWeightKg || '');
  const [matchDay, setMatchDay] = useState(profile.matchDay || 'FRI');
  const [saving, setSaving] = useState(false);

  const canContinue = startingWeight && goalWeight;

  async function handleContinue() {
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        goal,
        startingWeightKg: Number(startingWeight),
        goalWeightKg: Number(goalWeight),
        matchDay,
        onboarded: true,
      });
      onDone(updated);
      navigate('/', { replace: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="onboarding-scroll">
        <div className="heading">What's your main goal?</div>
        <div className="sub">We'll build a weekly plan around this — and keep your football match at the centre of it.</div>

        <div className="goal-list">
          {GOALS.map(({ id, Icon, t, s }) => {
            const sel = goal === id;
            return (
              <button key={id} type="button" className={`goal-card${sel ? ' sel' : ''}`} onClick={() => setGoal(id)}>
                <span className="goal-icon"><Icon /></span>
                <span className="goal-text">
                  <span className="t">{t}</span>
                  <span className="s">{s}</span>
                </span>
                {sel && <span className="check-circle"><IconCheck /></span>}
              </button>
            );
          })}
        </div>

        <div className="field-group">
          <div className="field">
            <label htmlFor="starting-weight">Current weight (kg)</label>
            <input id="starting-weight" type="number" inputMode="decimal" value={startingWeight}
              onChange={(e) => setStartingWeight(e.target.value)} placeholder="84.2" />
          </div>
          <div className="field">
            <label htmlFor="goal-weight">Goal weight (kg)</label>
            <input id="goal-weight" type="number" inputMode="decimal" value={goalWeight}
              onChange={(e) => setGoalWeight(e.target.value)} placeholder="78.0" />
          </div>
        </div>

        <div className="label-row">Which night do you play?</div>
        <div className="day-chips">
          {DAYS.map((d) => (
            <button key={d} type="button" className={`day-chip${matchDay === d ? ' sel' : ''}`} onClick={() => setMatchDay(d)}>
              {DAY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="onboarding-bottom">
        <button className="btn" disabled={!canContinue || saving} onClick={handleContinue}>
          Continue <IconArrowRight stroke="#fff" />
        </button>
      </div>
    </div>
  );
}
