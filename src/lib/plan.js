// The weekly plan is fixed configuration, not user data — it lives here as
// plain data rather than in the database. Edit this and reload to change it:
// which days you have gym access, exercise selection, rest periods, etc.
//
// Two gym days only (Mon/Wed), built for a beginner starting from a higher
// bodyweight and a sedentary desk job: full-body strength (not a split —
// more effective at low weekly frequency) on the days there's gym access,
// low-impact walking in between since there's no gym on those days and
// high-impact sprint/plyometric work is the wrong starting point here,
// and a taper into Friday's match.
export const DEFAULT_PLAN = [
  {
    day: 'MON', type: 'strength', title: 'Full Body Strength A', subtitle: 'gym', durationMin: 45,
    exercises: [
      { exerciseId: 'Goblet_Squat', sets: 3, reps: '10', restSeconds: 90 },
      { exerciseId: 'Seated_Cable_Rows', sets: 3, reps: '10', restSeconds: 75 },
      { exerciseId: 'Barbell_Bench_Press_-_Medium_Grip', sets: 3, reps: '8', restSeconds: 90 },
      { exerciseId: 'Standing_Dumbbell_Calf_Raise', sets: 3, reps: '15', restSeconds: 45 },
      { exerciseId: 'Plank', sets: 3, reps: '30s', restSeconds: 45 },
    ],
  },
  {
    day: 'TUE', type: 'stamina', title: 'Brisk Walk', subtitle: 'no gym needed — outdoors or treadmill at home', durationMin: 30,
    exercises: [
      { exerciseId: 'Brisk_Walking_Intervals', sets: 1, reps: '30min', restSeconds: 0 },
    ],
  },
  {
    day: 'WED', type: 'strength', title: 'Full Body Strength B', subtitle: 'gym', durationMin: 45,
    exercises: [
      { exerciseId: 'Dumbbell_Lunges', sets: 3, reps: '10', restSeconds: 90 },
      { exerciseId: 'Close-Grip_Front_Lat_Pulldown', sets: 3, reps: '10', restSeconds: 75 },
      { exerciseId: 'Standing_Dumbbell_Press', sets: 3, reps: '10', restSeconds: 75 },
      { exerciseId: 'Dumbbell_Bicep_Curl', sets: 3, reps: '12', restSeconds: 45 },
      { exerciseId: 'Russian_Twist', sets: 3, reps: '20', restSeconds: 30 },
    ],
  },
  {
    day: 'THU', type: 'mobility', title: 'Light Mobility', subtitle: 'deload before match, no gym needed', durationMin: 20,
    exercises: [
      { exerciseId: 'Worlds_Greatest_Stretch', sets: 2, reps: '5 each side', restSeconds: 15 },
      { exerciseId: 'Kneeling_Hip_Flexor', sets: 2, reps: '30s each side', restSeconds: 15 },
      { exerciseId: 'Hamstring_Stretch', sets: 2, reps: '30s each side', restSeconds: 15 },
      { exerciseId: 'Plank', sets: 2, reps: '30s', restSeconds: 30 },
    ],
  },
  {
    day: 'FRI', type: 'football', title: '5-a-side Football', subtitle: '8:00 PM · The Sports Dome', durationMin: 60,
    exercises: [],
  },
  {
    day: 'SAT', type: 'rest', title: 'Rest & Recovery', subtitle: 'stretch or walk, optional', durationMin: null,
    exercises: [],
  },
  {
    day: 'SUN', type: 'stamina', title: 'Steady State Walk', subtitle: 'easy pace, no gym needed', durationMin: 40,
    exercises: [
      { exerciseId: 'Steady_State_Walk', sets: 1, reps: '40min', restSeconds: 0 },
    ],
  },
];
