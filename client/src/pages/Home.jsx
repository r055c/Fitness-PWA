import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { DayTypeIcon } from '../components/DayTypeIcon.jsx';
import { IconTrendDown, IconPlay, IconFlame, IconClock, IconChevronRight } from '../components/Icons.jsx';
import './Home.css';

const DOW_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DOW_LABEL = { MON: 'M', TUE: 'T', WED: 'W', THU: 'T', FRI: 'F', SAT: 'S', SUN: 'S' };
const SERVER_DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function todayCode() {
  return SERVER_DOW[new Date().getDay()];
}

export function Home({ profile }) {
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [today, setToday] = useState(null);
  const [summary, setSummary] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api.getPlan().then(setPlan);
    api.getToday().then(setToday).catch(() => setToday(null));
    api.getProgressSummary().then(setSummary);
  }, []);

  async function handleStart() {
    if (!today) return;
    setStarting(true);
    try {
      const session = await api.startSession(today.id);
      navigate(`/session/${session.id}`);
    } finally {
      setStarting(false);
    }
  }

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const code = todayCode();

  const goalWeight = summary?.goalWeightKg;
  const current = summary?.currentWeightKg;
  const startingW = summary?.startingWeightKg;
  const lost = startingW && current ? +(startingW - current).toFixed(1) : 0;
  const totalToLose = startingW && goalWeight ? startingW - goalWeight : null;
  const pct = totalToLose && totalToLose > 0 ? Math.min(100, Math.max(0, Math.round((lost / totalToLose) * 100))) : 0;

  const matchDay = profile.matchDay;
  const matchDayLabel = matchDay ? matchDay[0] + matchDay.slice(1).toLowerCase() : null;

  return (
    <div className="scroll">
      <div className="eyebrow">{dateLabel}</div>
      <h1 className="greeting">{profile.name && profile.name !== 'there' ? `Hi, ${profile.name}` : 'Hi there'}</h1>

      {summary && current != null ? (
        <>
          <div className="card weight-card row between">
            <div>
              <div className="stat-label">Current weight</div>
              <div className="stat-num">{current} kg</div>
              {lost > 0 && (
                <div className="delta-pill"><IconTrendDown /> {lost} kg so far</div>
              )}
            </div>
          </div>
          {goalWeight && (
            <>
              <div className="track"><div className="fill" style={{ width: `${pct}%` }} /></div>
              <div className="track-labels"><span>Goal: {goalWeight} kg</span><span>{pct}% there</span></div>
            </>
          )}
        </>
      ) : (
        <div className="card weight-card">
          <div className="stat-label">No weigh-ins yet</div>
          <div className="wsub">Log your weight from the Progress tab to start tracking.</div>
        </div>
      )}

      <div className="section-title"><h2>This week</h2></div>
      <div className="week-strip">
        {DOW_ORDER.map((d) => {
          const day = plan?.find((x) => x.day === d);
          const isToday = d === code;
          const isMatch = day?.type === 'football';
          return (
            <div key={d} className={`day-pill${isToday ? ' today' : ''}${isMatch ? ' match' : ''}`}>
              <span className="d">{DOW_LABEL[d]}</span>
              {isMatch ? <DayTypeIcon type="football" size={13} /> : <span className="dot" />}
            </div>
          );
        })}
      </div>

      <div className="section-title">
        <h2>Today's workout</h2>
        <button className="see-link" onClick={() => navigate('/schedule')}>See schedule <IconChevronRight width={13} height={13} /></button>
      </div>

      {today ? (
        today.type === 'football' || today.type === 'rest' ? (
          <div className="card">
            <span className={`tag`} style={today.type === 'football' ? { background: 'var(--orange-soft)', color: 'var(--orange-dark)' } : undefined}>
              {today.type === 'football' ? 'Match day' : 'Rest day'}
            </span>
            <div className="wtitle">{today.title}</div>
            <div className="wsub">{today.subtitle}</div>
          </div>
        ) : (
          <div className="card">
            <span className="tag">{today.type.replace('_', ' ')}</span>
            <div className="wtitle">{today.title}</div>
            <div className="wsub">{today.exercises.length} exercise{today.exercises.length === 1 ? '' : 's'} · about {today.durationMin} min</div>
            <button className="btn" style={{ marginTop: 16 }} disabled={starting} onClick={handleStart}>
              <IconPlay fill="#fff" /> Start workout
            </button>
          </div>
        )
      ) : (
        <div className="card"><div className="wsub">No plan for today yet.</div></div>
      )}

      <div className="stats-row">
        <div className="stat-tile">
          <IconFlame className="icon" />
          <div className="n">{summary?.streakDays ?? 0} days</div>
          <div className="l">Current streak</div>
        </div>
        <div className="stat-tile">
          <IconClock className="icon" style={{ color: 'var(--green)' }} />
          <div className="n">{summary?.sessionsThisWeek ?? 0}</div>
          <div className="l">Sessions this week</div>
        </div>
        {matchDayLabel && (
          <div className="stat-tile">
            <DayTypeIcon type="football" size={18} />
            <div className="n" style={{ color: 'var(--orange)' }}>{matchDayLabel} {profile.matchTime || ''}</div>
            <div className="l">Next football match</div>
          </div>
        )}
      </div>
    </div>
  );
}
