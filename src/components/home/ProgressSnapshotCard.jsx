import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Trophy, Flame, Dumbbell } from 'lucide-react';

export default function ProgressSnapshotCard({ sessions, streak }) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const thisWeek = sessions?.filter(s => {
    const d = new Date(s.date);
    return d >= weekStart && s.status === 'completed';
  }) || [];

  const weekVolume = thisWeek.reduce((sum, s) => sum + (s.total_volume || 0), 0);
  const weekPRs = thisWeek.reduce((sum, s) => sum + (s.prs_count || 0), 0);

  // Build last 7 days calendar dots
  const days = ['S','M','T','W','T','F','S'];
  const completedDates = new Set(sessions?.filter(s => s.status === 'completed').map(s => s.date) || []);
  const calendarDots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const str = d.toISOString().split('T')[0];
    return { label: days[i], active: completedDates.has(str), isToday: str === now.toISOString().split('T')[0] };
  });

  return (
    <div
      className="rounded-3xl p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(10,14,26,0.97) 0%, rgba(0,25,55,0.92) 100%)',
        border: '1px solid rgba(102,217,255,0.2)',
        boxShadow: '0 0 50px rgba(0,109,255,0.1), inset 0 1px 0 rgba(102,217,255,0.1)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.07) 0%, transparent 65%)', transform: 'translate(25%,-25%)' }} />

      {/* Label */}
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4 relative z-10">This Week</p>

      {/* Calendar dots row */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        {calendarDots.map((dot, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={
                dot.active
                  ? { background: 'linear-gradient(135deg, #66D9FF, #006DFF)', color: '#030508', boxShadow: '0 0 12px rgba(102,217,255,0.5)' }
                  : dot.isToday
                  ? { background: 'rgba(102,217,255,0.1)', color: '#66D9FF', border: '1px solid rgba(102,217,255,0.4)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.07)' }
              }
            >
              {dot.label}
            </div>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-5 relative z-10">
        {[
          { icon: Dumbbell, label: 'Workouts', value: thisWeek.length, color: '#66D9FF' },
          { icon: TrendingUp, label: 'Volume', value: weekVolume > 0 ? `${(weekVolume / 1000).toFixed(1)}k` : '0', color: '#66D9FF' },
          { icon: Flame, label: 'Streak', value: `${streak || 0}d`, color: streak > 0 ? '#fb923c' : '#66D9FF' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-2xl p-3 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color }} />
            <div className="text-xl font-black text-foreground leading-none">{value}</div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* PR highlight */}
      {weekPRs > 0 && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 mb-4 relative z-10"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', boxShadow: '0 0 16px rgba(251,191,36,0.1)' }}
        >
          <Trophy className="w-4 h-4 flex-shrink-0" style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' }} />
          <span className="text-sm font-semibold" style={{ color: '#fbbf24' }}>
            {weekPRs} new PR{weekPRs > 1 ? 's' : ''} this week
          </span>
        </div>
      )}

      {/* CTA */}
      <Link to="/progress" className="relative z-10 block">
        <button
          className="w-full h-12 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
            color: '#030508',
            boxShadow: '0 0 24px rgba(102,217,255,0.3), 0 0 50px rgba(0,109,255,0.15)',
            border: 'none',
            letterSpacing: '0.1em',
          }}
        >
          <TrendingUp className="w-4 h-4" />
          See My Stats
        </button>
      </Link>
    </div>
  );
}