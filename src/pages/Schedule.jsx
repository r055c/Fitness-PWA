import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { DayTypeIcon, dayTypeMeta } from '../components/DayTypeIcon.jsx';
import { IconChevronRight } from '../components/Icons.jsx';
import './Schedule.css';

const SERVER_DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_NAME = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' };

function todayCode() {
  return SERVER_DOW[new Date().getDay()];
}

export function Schedule() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const code = todayCode();

  useEffect(() => {
    api.getPlan().then(setPlan);
  }, []);

  async function handleDayClick(day) {
    if (day.type === 'football' || day.type === 'rest') return;
    setBusyId(day.id);
    try {
      const session = await api.startSession(day.id);
      navigate(`/session/${session.id}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="scroll">
      <div className="title">Your schedule</div>
      <div className="caption">Two gym days, low-impact walking in between, and a lighter session before kickoff.</div>

      <div className="day-list">
        {plan.map((day) => {
          const isToday = day.day === code;
          const isMatch = day.type === 'football';
          const isRest = day.type === 'rest';
          const clickable = !isMatch && !isRest;
          return (
            <button
              key={day.id}
              type="button"
              className={`day-row${isToday ? ' today' : ''}${isMatch ? ' match' : ''}${isRest ? ' rest' : ''}`}
              onClick={() => handleDayClick(day)}
              disabled={!clickable || busyId === day.id}
            >
              <div className="date-col"><div className="dn">{DAY_NAME[day.day]}</div></div>
              <div className={`icon-circle ${dayTypeMeta(day.type).cls}`}>
                <DayTypeIcon type={day.type} size={17} />
              </div>
              <div className="info">
                <div className="t">{day.title}</div>
                <div className="s">
                  {day.durationMin ? `${day.durationMin} min · ` : ''}{day.subtitle}{isToday ? ' · today' : ''}
                </div>
              </div>
              {clickable && <IconChevronRight className="chev" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
