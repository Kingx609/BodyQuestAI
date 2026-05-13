import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, TrendingUp, Target, Dumbbell, Award, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

// ── Scroll-reactive body outline ─────────────────────────────────────────────
function ProgressBodyBackground({ scrollY }) {
  const opacity = Math.min(0.05 + scrollY * 0.0007, 0.18);
  const auraOpacity = Math.min(0.03 + scrollY * 0.0003, 0.1);
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse 55% 80% at 50% 40%, rgba(102,217,255,${auraOpacity}) 0%, transparent 70%)` }} />
      <div className="absolute inset-0 flex items-center justify-center"
        style={{ opacity, transition: 'opacity 0.5s' }}>
        <svg viewBox="0 0 200 420" className="h-[80vh] max-h-[650px]" fill="none"
          style={{ filter: 'drop-shadow(0 0 16px rgba(102,217,255,0.45))' }}>
          <ellipse cx="100" cy="38" rx="22" ry="26" stroke="rgba(102,217,255,0.8)" strokeWidth="1.5" />
          <rect x="91" y="62" width="18" height="18" rx="5" stroke="rgba(102,217,255,0.6)" strokeWidth="1.2" />
          <path d="M100 78 C68 80 42 92 38 118" stroke="rgba(102,217,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M100 78 C132 80 158 92 162 118" stroke="rgba(102,217,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M55 118 L50 230 Q100 248 150 230 L145 118" stroke="rgba(102,217,255,0.65)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="80" y1="160" x2="120" y2="160" stroke="rgba(102,217,255,0.3)" strokeWidth="1" />
          <line x1="78" y1="182" x2="122" y2="182" stroke="rgba(102,217,255,0.3)" strokeWidth="1" />
          <line x1="78" y1="204" x2="122" y2="204" stroke="rgba(102,217,255,0.3)" strokeWidth="1" />
          <line x1="100" y1="140" x2="100" y2="225" stroke="rgba(102,217,255,0.25)" strokeWidth="1" />
          <path d="M55 118 L30 175 L26 230 L36 232 L46 188 L68 134" stroke="rgba(102,217,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M145 118 L170 175 L174 230 L164 232 L154 188 L132 134" stroke="rgba(102,217,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M50 228 Q100 250 150 228" stroke="rgba(102,217,255,0.5)" strokeWidth="1.5" />
          <path d="M80 240 L72 330 L68 390 L82 392 L90 335 L96 240" stroke="rgba(102,217,255,0.55)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M120 240 L128 330 L132 390 L118 392 L110 335 L104 240" stroke="rgba(102,217,255,0.55)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

const BADGES = [
  { id: 'first_workout', label: 'First Quest', desc: 'Logged first workout', icon: Zap, check: (s) => s.length >= 1 },
  { id: 'ten_workouts', label: 'Warrior', desc: '10 workouts', icon: Dumbbell, check: (s) => s.length >= 10 },
  { id: 'first_pr', label: 'Record Breaker', desc: 'First PR', icon: Trophy, check: (_, p) => p.length >= 1 },
  { id: 'volume_100k', label: 'Iron Century', desc: '100k lbs/month', icon: TrendingUp, check: (s) => { const now = new Date(); return s.filter(x => { const d = new Date(x.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((sum, x) => sum + (x.total_volume || 0), 0) >= 100000; } },
  { id: 'streak_7', label: 'Week Warrior', desc: '7-day streak', icon: Flame, check: () => false },
  { id: 'streak_30', label: 'Iron Will', desc: '30-day streak', icon: Award, check: () => false },
];

export default function ProgressTab() {
  const [user, setUser] = useState(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  useEffect(() => {
    const el = document.getElementById('main-scroll');
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const { data: sessions } = useQuery({
    queryKey: ['all-sessions'],
    queryFn: () => base44.entities.WorkoutSession.filter({ status: 'completed' }, '-date', 200),
    initialData: [],
  });

  const { data: prs } = useQuery({
    queryKey: ['prs'],
    queryFn: () => base44.entities.PersonalRecord.list('-date', 500),
    initialData: [],
  });

  const { data: meals } = useQuery({
    queryKey: ['all-meals'],
    queryFn: () => base44.entities.Meal.list('-date', 200),
    initialData: [],
  });

  const now = new Date();
  const thisMonth = sessions.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const monthVolume = thisMonth.reduce((sum, s) => sum + (s.total_volume || 0), 0);
  const monthPRs = prs.filter(p => { const d = new Date(p.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const totalVolume = sessions.reduce((sum, s) => sum + (s.total_volume || 0), 0);

  // Streak calc
  const completedDates = [...new Set(sessions.map(s => s.date))].sort().reverse();
  let streak = 0;
  const checkDate = new Date(now);
  for (let i = 0; i < completedDates.length; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (completedDates.includes(dateStr)) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
    else if (i === 0) { checkDate.setDate(checkDate.getDate() - 1); if (completedDates.includes(checkDate.toISOString().split('T')[0])) { streak++; checkDate.setDate(checkDate.getDate() - 1); } else break; }
    else break;
  }

  // Weekly calendar — current week
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const completedSet = new Set(sessions.map(s => s.date));
  const DAY_LABELS = ['S','M','T','W','T','F','S'];
  const weekDots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const str = d.toISOString().split('T')[0];
    const isToday = str === now.toISOString().split('T')[0];
    const isFuture = d > now;
    return { label: DAY_LABELS[i], active: completedSet.has(str), isToday, isFuture };
  });

  // Chart data
  const chartData = sessions.slice(0, 14).reverse().map(s => ({
    date: new Date(s.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    volume: s.total_volume || 0,
  }));

  // Nutrition stats
  const calGoal = user?.calorie_goal || 2500;
  const proteinGoal = user?.protein_goal || 180;
  const mealsByDate = {};
  const proteinByDate = {};
  meals.forEach(m => {
    mealsByDate[m.date] = (mealsByDate[m.date] || 0) + (m.estimated_calories || 0);
    proteinByDate[m.date] = (proteinByDate[m.date] || 0) + (m.estimated_protein || 0);
  });
  const daysWithMeals = Object.keys(mealsByDate).length;
  const proteinHitDays = Object.values(proteinByDate).filter(p => p >= proteinGoal * 0.85).length;

  return (
    <div className="relative">
      <ProgressBodyBackground scrollY={scrollY} />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-8 pb-10 space-y-4">

        {/* ── Header ── */}
        <div className="mb-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1">Your Journey</p>
          <h1
            className="text-3xl font-black tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #66D9FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Progress
          </h1>
        </div>

        {/* ── Hero stats card: Volume + Streak ── */}
        <div
          className="rounded-3xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(10,14,26,0.97) 0%, rgba(0,25,55,0.92) 100%)',
            border: '1px solid rgba(102,217,255,0.22)',
            boxShadow: '0 0 60px rgba(0,109,255,0.12), inset 0 1px 0 rgba(102,217,255,0.12)',
          }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.07) 0%, transparent 65%)', transform: 'translate(25%,-25%)' }} />

          {/* Big total volume */}
          <div className="relative z-10 mb-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1">Total Volume Lifted</p>
            <div
              className="font-black leading-none tracking-tight"
              style={{
                fontSize: 'clamp(2.6rem, 10vw, 4rem)',
                background: 'linear-gradient(135deg, #ffffff 0%, #66D9FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}k` : '0'}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">lbs all time</p>
          </div>

          {/* 3 stat tiles */}
          <div className="grid grid-cols-3 gap-2 relative z-10">
            {[
              { icon: Dumbbell, label: 'This Month', value: thisMonth.length, sub: 'workouts', color: '#66D9FF' },
              {
                icon: Flame,
                label: 'Streak',
                value: `${streak}`,
                sub: 'days',
                color: streak > 0 ? '#fb923c' : '#66D9FF',
                glow: streak > 0 ? '0 0 14px rgba(251,146,60,0.4)' : undefined,
              },
              { icon: Trophy, label: 'Month PRs', value: monthPRs.length, sub: 'records', color: '#fbbf24', glow: monthPRs.length > 0 ? '0 0 14px rgba(251,191,36,0.35)' : undefined },
            ].map(({ icon: Icon, label, value, sub, color, glow }) => (
              <div
                key={label}
                className="rounded-2xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: glow }}
              >
                <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color, filter: glow ? `drop-shadow(0 0 5px ${color})` : undefined }} />
                <div className="text-xl font-black text-foreground leading-none">{value}</div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Weekly calendar ── */}
        <div
          className="rounded-3xl p-5"
          style={{ background: 'rgba(10,12,18,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(102,217,255,0.12)' }}
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">This Week</p>
          <div className="flex items-center justify-between">
            {weekDots.map((dot, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                  style={
                    dot.active
                      ? { background: 'linear-gradient(135deg, #66D9FF, #006DFF)', color: '#030508', boxShadow: '0 0 14px rgba(102,217,255,0.55)' }
                      : dot.isToday
                      ? { background: 'rgba(102,217,255,0.1)', color: '#66D9FF', border: '1px solid rgba(102,217,255,0.4)' }
                      : dot.isFuture
                      ? { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.05)' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.07)' }
                  }
                >
                  {dot.active ? '✓' : dot.label}
                </div>
                {dot.isToday && <div className="w-1 h-1 rounded-full" style={{ background: '#66D9FF' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* ── Volume chart ── */}
        {chartData.length > 1 && (
          <div
            className="rounded-3xl p-5"
            style={{ background: 'rgba(10,12,18,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(102,217,255,0.12)' }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">Volume Trend</p>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#66D9FF" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#66D9FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(10,14,24,0.95)', border: '1px solid rgba(102,217,255,0.2)', borderRadius: '12px', color: '#fff', fontSize: 11 }}
                  formatter={v => [`${v.toLocaleString()} lbs`, 'Volume']}
                />
                <Area type="monotone" dataKey="volume" stroke="#66D9FF" fill="url(#volGrad)" strokeWidth={2}
                  style={{ filter: 'drop-shadow(0 0 4px rgba(102,217,255,0.4))' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Recent PRs ── */}
        {prs.length > 0 && (
          <div
            className="rounded-3xl p-5"
            style={{ background: 'rgba(10,12,18,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(251,191,36,0.15)' }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-4" style={{ color: 'rgba(251,191,36,0.7)' }}>Personal Records</p>
            <div className="space-y-2">
              {prs.slice(0, 5).map((pr, i) => (
                <motion.div
                  key={pr.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between py-2 px-3 rounded-xl"
                  style={{ background: i === 0 ? 'rgba(251,191,36,0.07)' : 'rgba(255,255,255,0.03)', border: i === 0 ? '1px solid rgba(251,191,36,0.18)' : '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: '#fbbf24', filter: i === 0 ? 'drop-shadow(0 0 6px rgba(251,191,36,0.7))' : undefined }}
                    />
                    <span className="text-sm font-medium text-foreground">{pr.exercise_name}</span>
                  </div>
                  <div className="text-sm font-black" style={{ color: i === 0 ? '#fbbf24' : 'rgba(255,255,255,0.7)' }}>
                    {pr.weight} × {pr.reps}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Badges ── */}
        <div
          className="rounded-3xl p-5"
          style={{ background: 'rgba(10,12,18,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(102,217,255,0.12)' }}
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">Achievements</p>
          <div className="grid grid-cols-3 gap-3">
            {BADGES.map(badge => {
              const earned = badge.check(sessions, prs);
              return (
                <motion.div
                  key={badge.id}
                  className="text-center p-3 rounded-2xl"
                  style={
                    earned
                      ? { background: 'rgba(102,217,255,0.07)', border: '1px solid rgba(102,217,255,0.25)', boxShadow: '0 0 16px rgba(102,217,255,0.1)' }
                      : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.35 }
                  }
                >
                  <badge.icon
                    className="w-6 h-6 mx-auto mb-1.5"
                    style={{ color: earned ? '#66D9FF' : 'rgba(255,255,255,0.3)', filter: earned ? 'drop-shadow(0 0 6px rgba(102,217,255,0.6))' : undefined }}
                  />
                  <div className="text-xs font-bold text-foreground leading-tight">{badge.label}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{badge.desc}</div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Nutrition consistency ── */}
        {daysWithMeals > 0 && (
          <div
            className="rounded-3xl p-5"
            style={{ background: 'rgba(10,12,18,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(102,217,255,0.12)' }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">Nutrition Consistency</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Protein Goal', value: `${proteinHitDays}/${daysWithMeals}`, sub: 'days on target', color: '#66D9FF' },
                { label: 'Month Workouts', value: thisMonth.length, sub: 'sessions logged', color: '#66D9FF' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="rounded-2xl p-4 text-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-2xl font-black" style={{ color }}>{value}</div>
                  <div className="text-xs font-medium text-foreground mt-1">{label}</div>
                  <div className="text-[9px] text-muted-foreground">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}