import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

function MacroCircle({ label, current, goal, color, glowColor }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const r = 15.9155;
  const dash = (pct / 100) * (2 * Math.PI * r);
  const gap = (2 * Math.PI * r) - dash;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r={r} fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${glowColor})`, transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-foreground">{Math.round(pct)}%</span>
        </div>
      </div>
      <div className="text-[10px] font-semibold text-foreground">{current}{label !== 'Cal' ? 'g' : ''}</div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

export default function NutritionSnapshotCard({ nutrition, userGoals }) {
  const cals = nutrition?.calories_consumed || 0;
  const protein = nutrition?.protein_consumed || 0;
  const carbs = nutrition?.carbs_consumed || 0;
  const fats = nutrition?.fats_consumed || 0;
  const targetOrFallback = (value, fallback) => {
    const target = Number(value);
    return Number.isFinite(target) && target > 0 ? target : fallback;
  };

  const calGoal = targetOrFallback(userGoals?.calorie_goal, 2500);
  const proteinGoal = targetOrFallback(userGoals?.protein_goal, 180);
  const carbGoal = targetOrFallback(userGoals?.carb_goal, 280);
  const fatGoal = targetOrFallback(userGoals?.fat_goal, 70);

  const calPct = calGoal > 0 ? Math.min(Math.round((cals / calGoal) * 100), 100) : 0;
  const r = 15.9155;
  const calDash = (calPct / 100) * (2 * Math.PI * r);
  const calGap = (2 * Math.PI * r) - calDash;

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
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4 relative z-10">Today's Fuel</p>

      {/* Big calorie number + ring */}
      <div className="flex items-center gap-5 mb-5 relative z-10">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
            <circle
              cx="18" cy="18" r={r} fill="none"
              stroke="url(#calGrad)" strokeWidth="2.5"
              strokeDasharray={`${calDash} ${calGap}`}
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 6px rgba(102,217,255,0.5))', transition: 'stroke-dasharray 0.6s ease' }}
            />
            <defs>
              <linearGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#66D9FF" />
                <stop offset="100%" stopColor="#006DFF" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-muted-foreground font-medium">CAL</span>
            <span className="text-lg font-black leading-tight" style={{ color: '#66D9FF', textShadow: '0 0 10px rgba(102,217,255,0.5)' }}>{calPct}%</span>
          </div>
        </div>

        <div>
          <div
            className="text-4xl font-black leading-none tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #66D9FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {cals.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">
            of <span className="font-semibold text-foreground">{calGoal.toLocaleString()}</span> kcal
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            <span style={{ color: '#66D9FF' }}>{Math.max(0, calGoal - cals).toLocaleString()}</span> remaining
          </div>
        </div>
      </div>

      {/* Macro circles row */}
      <div className="flex items-center justify-around mb-5 relative z-10 py-3 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <MacroCircle label="Protein" current={protein} goal={proteinGoal} color="#66D9FF" glowColor="rgba(102,217,255,0.6)" />
        <div className="w-px h-10 bg-border" />
        <MacroCircle label="Carbs" current={carbs} goal={carbGoal} color="#fbbf24" glowColor="rgba(251,191,36,0.5)" />
        <div className="w-px h-10 bg-border" />
        <MacroCircle label="Fats" current={fats} goal={fatGoal} color="#a78bfa" glowColor="rgba(167,139,250,0.5)" />
      </div>

      {/* CTA */}
      <Link to="/nutrition" className="relative z-10 block">
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
          <Plus className="w-4 h-4" />
          Log Meal
        </button>
      </Link>
    </div>
  );
}
