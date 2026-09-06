import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { IconChevronLeft, IconSprintFigure } from '../components/Icons.jsx';
import './ExerciseDetail.css';

export function ExerciseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ex, setEx] = useState(null);
  const [tab, setTab] = useState('instructions');

  useEffect(() => {
    setEx(null);
    api.getExercise(id).then(setEx);
  }, [id]);

  if (!ex) return <div className="spinner-wrap">Loading…</div>;

  return (
    <div className="page">
      <div className="hero">
        <button className="icon-btn" style={{ left: 16 }} onClick={() => navigate(-1)}><IconChevronLeft /></button>
        {ex.images[0] ? <img src={ex.images[0]} alt={ex.name} /> : <IconSprintFigure />}
      </div>

      <div className="scroll">
        <div className="ex-title">{ex.name}</div>
        <div className="tag-row">
          <span className="tag diff">{ex.difficulty}</span>
          <span className="tag equip">{ex.equipment || 'bodyweight'}</span>
          <span className="tag">{ex.primaryMuscles[0] || ex.category}</span>
        </div>

        <div className="segmented">
          <button className={`seg${tab === 'instructions' ? ' on' : ''}`} onClick={() => setTab('instructions')}>Instructions</button>
          <button className={`seg${tab === 'muscles' ? ' on' : ''}`} onClick={() => setTab('muscles')}>Muscles worked</button>
        </div>

        {tab === 'instructions' ? (
          <>
            <div className="steps">
              {ex.instructions.map((step, i) => (
                <div className="step" key={i}>
                  <span className="step-num">{i + 1}</span>
                  <span className="step-text">{step}</span>
                </div>
              ))}
            </div>
            {ex.secondaryMuscles.length > 0 && (
              <div className="also-works">Also works: <b>{ex.secondaryMuscles.join(', ')}</b></div>
            )}
          </>
        ) : (
          <div className="muscle-list">
            <div className="muscle-row"><span className="k">Primary</span><span>{ex.primaryMuscles.join(', ') || '—'}</span></div>
            <div className="muscle-row"><span className="k">Secondary</span><span>{ex.secondaryMuscles.join(', ') || '—'}</span></div>
            <div className="muscle-row"><span className="k">Mechanic</span><span>{ex.mechanic || '—'}</span></div>
            <div className="muscle-row"><span className="k">Force</span><span>{ex.force || '—'}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
