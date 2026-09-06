import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { IconSearch, IconChevronRight } from '../components/Icons.jsx';
import './ExerciseLibrary.css';

const FILTERS = [
  { label: 'All', value: null },
  { label: 'Speed & Stamina', tag: 'speed-stamina' },
  { label: 'Strength', category: 'strength' },
  { label: 'Cardio', category: 'cardio' },
  { label: 'Plyometrics', category: 'plyometrics' },
  { label: 'Stretching', category: 'stretching' },
];

const DIFF_COLOR = { beginner: 'var(--green)', intermediate: 'var(--orange)', advanced: 'var(--danger)' };

export function ExerciseLibrary() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(FILTERS[0]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const params = { search };
      if (filter.category) params.category = filter.category;

      const finish = (list) => {
        setExercises(list);
        setLoading(false);
      };

      if (filter.tag === 'speed-stamina') {
        Promise.all([api.getExercises({ ...params, tag: 'speed' }), api.getExercises({ ...params, tag: 'stamina' })])
          .then(([a, b]) => {
            const byId = new Map();
            [...a, ...b].forEach((ex) => byId.set(ex.id, ex));
            finish([...byId.values()].sort((x, y) => x.name.localeCompare(y.name)));
          });
      } else {
        api.getExercises(params).then(finish);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [search, filter]);

  return (
    <div className="scroll">
      <div className="title">Exercise Library</div>
      <div className="wsub">Searchable library with step-by-step form guides</div>

      <div className="search">
        <IconSearch />
        <input placeholder="Search exercises…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="chip-row">
        {FILTERS.map((f) => (
          <button key={f.label} type="button" className={`chip${filter.label === f.label ? ' sel' : ''}`} onClick={() => setFilter(f)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="results-count">{loading ? 'Searching…' : `${exercises.length} exercise${exercises.length === 1 ? '' : 's'}`}</div>

      <div className="ex-list">
        {exercises.map((ex) => (
          <button key={ex.id} type="button" className="ex-row" onClick={() => navigate(`/exercises/${ex.id}`)}>
            <div className="ex-thumb">{ex.name.slice(0, 1)}</div>
            <div className="ex-info">
              <div className="n">{ex.name}</div>
              <div className="m">
                <span className="diff-dot" style={{ background: DIFF_COLOR[ex.difficulty] || 'var(--mute)' }} />
                {ex.primaryMuscles[0] || ex.category} · {ex.equipment || 'bodyweight'} · {ex.difficulty}
              </div>
            </div>
            <IconChevronRight className="chev" style={{ color: 'var(--mute)' }} />
          </button>
        ))}
        {!loading && exercises.length === 0 && <div className="empty-state">No exercises match that search.</div>}
      </div>
    </div>
  );
}
