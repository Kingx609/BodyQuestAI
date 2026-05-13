import React from 'react';
import { Info, Flame, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Mifflin-St Jeor BMR + TDEE calculation
export function calcTDEE(user) {
  const weight = parseFloat(user?.weight) || 0;
  const sex = user?.biological_sex || 'male';
  const birthday = user?.birthday;
  const activityLevel = user?.activity_level || 'moderate';

  // Convert weight to kg
  const weightKg = user?.weight_unit === 'kg' ? weight : weight / 2.205;

  // Convert height to cm
  let heightCm = 0;
  if (user?.height) {
    // stored as inches
    heightCm = parseFloat(user.height) * 2.54;
  } else if (user?.height_cm) {
    heightCm = parseFloat(user.height_cm);
  }

  // Age
  let age = 25;
  if (birthday) {
    const today = new Date();
    const dob = new Date(birthday);
    age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  }

  if (!weightKg || !heightCm) return null;

  // Mifflin-St Jeor BMR
  const bmr = sex === 'female'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.55));

  // Goal adjustment
  const goal = user?.fitness_goal;
  let goalCals = tdee;
  let adjustment = 0;
  if (goal === 'build_muscle' || goal === 'get_stronger') { goalCals = tdee + 500; adjustment = +500; }
  else if (goal === 'lose_fat') { goalCals = tdee - 500; adjustment = -500; }

  return { bmr: Math.round(bmr), tdee, goalCals, adjustment };
}

export default function CalorieGoalCard({ user }) {
  const data = calcTDEE(user);
  if (!data) return null;

  const goal = user?.fitness_goal;
  const goalLabel = goal === 'build_muscle' || goal === 'get_stronger'
    ? 'Muscle Gain' : goal === 'lose_fat' ? 'Fat Loss' : 'Maintenance';

  const AdjIcon = data.adjustment > 0 ? TrendingUp : data.adjustment < 0 ? TrendingDown : Minus;
  const adjColor = data.adjustment > 0 ? '#4ade80' : data.adjustment < 0 ? '#f87171' : '#66D9FF';

  const macroRows = [
    { label: 'Protein', grams: user?.protein_goal || Math.round(data.goalCals * 0.30 / 4), cal: Math.round((user?.protein_goal || Math.round(data.goalCals * 0.30 / 4)) * 4), color: '#66D9FF', pct: 30 },
    { label: 'Carbs', grams: user?.carb_goal || Math.round(data.goalCals * 0.45 / 4), cal: Math.round((user?.carb_goal || Math.round(data.goalCals * 0.45 / 4)) * 4), color: '#fbbf24', pct: 45 },
    { label: 'Fats', grams: user?.fat_goal || Math.round(data.goalCals * 0.25 / 9), cal: Math.round((user?.fat_goal || Math.round(data.goalCals * 0.25 / 9)) * 9), color: '#a78bfa', pct: 25 },
  ];

  return (
    <div
      className="rounded-3xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(10,14,26,0.97) 0%, rgba(0,20,50,0.95) 100%)',
        border: '1px solid rgba(102,217,255,0.18)',
        boxShadow: '0 0 40px rgba(0,109,255,0.1), inset 0 1px 0 rgba(102,217,255,0.1)',
      }}
    >
      <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.07) 0%, transparent 65%)', transform: 'translate(25%,-25%)' }} />

      {/* Header */}
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(102,217,255,0.1)', border: '1px solid rgba(102,217,255,0.25)' }}>
          <Info className="w-4 h-4" style={{ color: '#66D9FF' }} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Mifflin-St Jeor Formula</p>
          <p className="text-sm font-black text-foreground">Your Calorie Breakdown</p>
        </div>
        <div className="ml-auto px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(102,217,255,0.08)', border: '1px solid rgba(102,217,255,0.2)', color: '#66D9FF' }}>
          {goalLabel}
        </div>
      </div>

      {/* BMR → TDEE → Goal row */}
      <div className="grid grid-cols-3 gap-2 mb-4 relative z-10">
        {[
          { label: 'BMR', value: data.bmr.toLocaleString(), sub: 'Base rate', icon: Flame, color: '#f87171' },
          { label: 'Maintenance', value: data.tdee.toLocaleString(), sub: 'TDEE', icon: Target, color: '#66D9FF' },
          { label: 'Your Goal', value: data.goalCals.toLocaleString(), sub: `${data.adjustment > 0 ? '+' : ''}${data.adjustment || '±0'} kcal`, icon: AdjIcon, color: adjColor },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-3 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
            <div className="text-lg font-black text-foreground leading-none">{value}</div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
            <div className="text-[9px] font-medium mt-0.5" style={{ color }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Macro split */}
      <div className="relative z-10">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2.5">Daily Macro Split</p>
        <div className="space-y-2">
          {macroRows.map(({ label, grams, pct, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-14 text-xs font-bold text-foreground">{label}</div>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}66` }}
                />
              </div>
              <div className="text-xs font-black w-16 text-right" style={{ color }}>
                {grams}g <span className="text-[9px] font-normal text-muted-foreground">({pct}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formula note */}
      <p className="text-[10px] text-muted-foreground/50 mt-3 relative z-10 leading-relaxed">
        BMR calculated using Mifflin-St Jeor. TDEE = BMR × activity multiplier. Adjust in onboarding to recalibrate.
      </p>
    </div>
  );
}