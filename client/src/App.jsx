import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { TabBar } from './components/TabBar.jsx';
import { api } from './api.js';
import { Onboarding } from './pages/Onboarding.jsx';
import { Home } from './pages/Home.jsx';
import { Schedule } from './pages/Schedule.jsx';
import { ExerciseLibrary } from './pages/ExerciseLibrary.jsx';
import { ExerciseDetail } from './pages/ExerciseDetail.jsx';
import { WorkoutSession } from './pages/WorkoutSession.jsx';
import { Progress } from './pages/Progress.jsx';

function TabbedLayout() {
  return (
    <div className="page">
      <Outlet />
      <TabBar />
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.getProfile().then(setProfile).catch(() => setProfile({ onboarded: false }));
  }, []);

  if (!profile) {
    return <div className="spinner-wrap">Loading…</div>;
  }

  return (
    <Routes>
      <Route
        path="/onboarding"
        element={<Onboarding profile={profile} onDone={(p) => setProfile(p)} />}
      />
      <Route path="/session/:sessionId" element={<WorkoutSession />} />
      <Route path="/exercises/:id" element={<ExerciseDetail />} />

      <Route element={profile.onboarded ? <TabbedLayout /> : <Navigate to="/onboarding" replace />}>
        <Route path="/" element={<Home profile={profile} />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/exercises" element={<ExerciseLibrary />} />
        <Route path="/progress" element={<Progress />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
