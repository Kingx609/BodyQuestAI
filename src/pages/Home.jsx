import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import NutritionSnapshotCard from '@/components/home/NutritionSnapshotCard';
import ProgressSnapshotCard from '@/components/home/ProgressSnapshotCard';
import CoachNoteCard from '@/components/home/CoachNoteCard';
import WorkoutPlanCard from '@/components/home/WorkoutPlanCard';
import { Flame, Apple, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchTodayWorkout } from '@/lib/today-workout';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const HEADLINES = [
  "Let's get to work.",
  "Time to dominate.",
  "No days off.",
  "Your body is waiting.",
];

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (!u.onboarding_complete) navigate('/onboarding');
    });
  }, []);

  const today = new Date();
  const dayName = DAYS[today.getDay()];
  const todayStr = today.toISOString().split('T')[0];

  // Pick headline based on day of week so it feels dynamic
  const headline = HEADLINES[today.getDay() % HEADLINES.length];

  const { data: workouts } = useQuery({
    queryKey: ['workouts'],
    queryFn: () => base44.entities.Workout.filter({ is_template: true }),
    initialData: [],
  });

  // Intentionally planned workout for today (by date, not day-of-week)
  const { data: todayWorkouts } = useQuery({
    queryKey: ['today-workout', todayStr],
    queryFn: () => fetchTodayWorkout(base44, todayStr),
    initialData: [],
  });

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.WorkoutSession.list('-date', 50),
    initialData: [],
  });

  const { data: meals } = useQuery({
    queryKey: ['meals-today', todayStr],
    queryFn: () => base44.entities.Meal.filter({ date: todayStr }),
    initialData: [],
  });



  // Only show a workout the user intentionally planned for today (by date)
  const todayWorkout = todayWorkouts?.[0] || null;

  const todayNutrition = {
    calories_consumed: meals.reduce((s, m) => s + (m.estimated_calories || 0), 0),
    protein_consumed: meals.reduce((s, m) => s + (m.estimated_protein || 0), 0),
    carbs_consumed: meals.reduce((s, m) => s + (m.estimated_carbs || 0), 0),
    fats_consumed: meals.reduce((s, m) => s + (m.estimated_fats || 0), 0),
  };

  // Calculate streak
  const completedDates = [...new Set(sessions.filter(s => s.status === 'completed').map(s => s.date))].sort().reverse();
  let streak = 0;
  const checkDate = new Date(today);
  for (let i = 0; i < completedDates.length; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (completedDates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = checkDate.toISOString().split('T')[0];
      if (completedDates.includes(yesterdayStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    } else break;
  }

  const firstName = user?.full_name?.split(' ')[0] || user?.display_name || null;

  return (
    <div className="max-w-lg mx-auto">
      {/* ── Hero section ── */}
      <div className="px-5 pt-10 pb-6">
        {/* Greeting row */}
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
            {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
          </p>
          {streak > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(102,217,255,0.08)', border: '1px solid rgba(102,217,255,0.2)', color: '#66D9FF' }}
            >
              <Flame className="w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 0 4px rgba(102,217,255,0.8))' }} />
              {streak} day streak
            </div>
          )}
        </div>

        {/* Big headline */}
        <h1
          className="text-4xl font-black tracking-tight leading-none mb-1"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #66D9FF 60%, #006DFF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
          }}
        >
          {headline}
        </h1>

        {/* Subline */}
        <p className="text-sm text-muted-foreground mt-1">
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>

        {/* Thin ice-blue divider */}
        <div className="mt-5 h-px w-full" style={{ background: 'linear-gradient(90deg, rgba(102,217,255,0.4) 0%, rgba(0,109,255,0.15) 60%, transparent 100%)' }} />
      </div>

      {/* ── Today's Workout — HERO CARD ── */}
      <div className="px-4 mb-4">
        <WorkoutPlanCard workout={todayWorkout} user={user} />
      </div>

      {/* ── Quick action buttons ── */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/nutrition" className="block">
            <button
              className="w-full h-13 rounded-2xl flex flex-col items-center justify-center gap-1 font-bold text-xs uppercase tracking-widest py-3"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(102,217,255,0.18)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <Apple className="w-4 h-4" style={{ color: '#66D9FF' }} />
              Track Calories
            </button>
          </Link>
          <Link to="/titan" className="block">
            <button
              className="w-full h-13 rounded-2xl flex flex-col items-center justify-center gap-1 font-bold text-xs uppercase tracking-widest py-3"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(102,217,255,0.18)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: '#66D9FF' }} />
              Ask Titan
            </button>
          </Link>
        </div>
      </div>

      {/* ── Secondary cards ── */}
      <div className="px-4 space-y-4 pb-6">
        <NutritionSnapshotCard nutrition={todayNutrition} userGoals={user} />
        <ProgressSnapshotCard sessions={sessions} streak={streak} />
        <CoachNoteCard />
      </div>
    </div>
  );
}
