const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getProfile: () => request('/profile'),
  updateProfile: (data) => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),

  getPlan: () => request('/plan'),
  getToday: () => request('/plan/today'),
  getPlanDay: (id) => request(`/plan/days/${id}`),

  getExercises: (params = {}) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v))).toString();
    return request(`/exercises${qs ? `?${qs}` : ''}`);
  },
  getExercise: (id) => request(`/exercises/${id}`),

  startSession: (planDayId) => request('/sessions', { method: 'POST', body: JSON.stringify({ planDayId }) }),
  getSession: (id) => request(`/sessions/${id}`),
  logSet: (sessionId, data) => request(`/sessions/${sessionId}/sets`, { method: 'POST', body: JSON.stringify(data) }),
  completeSession: (id) => request(`/sessions/${id}/complete`, { method: 'POST' }),

  getWeight: () => request('/weight'),
  addWeight: (weightKg) => request('/weight', { method: 'POST', body: JSON.stringify({ weightKg }) }),

  getProgressSummary: () => request('/progress/summary'),
};
