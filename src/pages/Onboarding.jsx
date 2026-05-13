import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Zap, Flame, Dumbbell, Heart,
  Sparkles, Activity, Check, RefreshCw, Trophy
} from 'lucide-react';

const BODYQUEST_LOGO_URL = '/brand/bodyquest-shield.png';

// ─── Data ────────────────────────────────────────────────────────────────────

const GOALS = [
  { id: 'lose_fat', label: 'Lose Fat', icon: Flame, desc: 'Burn body fat while preserving muscle mass' },
  { id: 'build_muscle', label: 'Build Muscle', icon: Dumbbell, desc: 'Pack on lean mass and increase size' },
  { id: 'recomposition', label: 'Body Recomposition', icon: RefreshCw, desc: 'Lose fat and gain muscle simultaneously' },
  { id: 'get_stronger', label: 'Get Stronger', icon: Trophy, desc: 'Increase your max lifts and raw power' },
  { id: 'improve_health', label: 'Improve Health', icon: Heart, desc: 'Build sustainable habits and longevity' },
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, little or no exercise outside of training' },
  { id: 'light', label: 'Lightly Active', desc: 'Light movement or exercise 1–3 days per week' },
  { id: 'moderate', label: 'Moderately Active', desc: 'Moderate exercise or sport 3–5 days per week' },
  { id: 'active', label: 'Active', desc: 'Hard training 6–7 days per week' },
  { id: 'very_active', label: 'Very Active', desc: 'Physical job + daily training or 2× per day' },
];

const TRAINING_STYLES = [
  { id: 'ppl', label: 'Push / Pull / Legs', icon: '🔁' },
  { id: 'upper_lower', label: 'Upper / Lower', icon: '⬆️' },
  { id: 'full_body', label: 'Full Body', icon: '💪' },
  { id: 'bro_split', label: 'Bro Split', icon: '💥' },
  { id: 'strength', label: 'Strength Training', icon: '🏋️' },
  { id: 'hypertrophy', label: 'Hypertrophy', icon: '🎯' },
  { id: 'powerlifting', label: 'Powerlifting', icon: '🥇' },
  { id: 'hiit', label: 'HIIT', icon: '⚡' },
  { id: 'cardio', label: 'Cardio / Endurance', icon: '🏃' },
  { id: 'calisthenics', label: 'Calisthenics', icon: '🤸' },
  { id: 'functional', label: 'Functional Training', icon: '⚙️' },
  { id: 'glute_focused', label: 'Glute-Focused Training', icon: '🍑', desc: 'Hip thrusts, RDLs, glute bridges, cable kickbacks, abduction & hamstring work' },
];

const GYM_ACCESS = [
  { id: 'full_gym', label: 'Full Gym', desc: 'Access to all machines, free weights, cables', icon: '🏢' },
  { id: 'home', label: 'Home Only', desc: 'Limited or no equipment at home', icon: '🏠' },
  { id: 'limited', label: 'Limited Equipment', desc: 'Dumbbells, resistance bands, pull-up bar', icon: '🎒' },
  { id: 'outdoors', label: 'Outdoors', desc: 'Parks, tracks, outdoor training areas', icon: '🌿' },
];

const RECOVERY_TOOLS = [
  { id: 'sauna', label: 'Sauna', icon: '🔥' },
  { id: 'cold_plunge', label: 'Cold Plunge', icon: '🧊' },
  { id: 'foam_rolling', label: 'Foam Rolling', icon: '🫧' },
  { id: 'massage', label: 'Massage', icon: '💆' },
  { id: 'stretching', label: 'Stretching', icon: '🤸' },
  { id: 'ice_bath', label: 'Ice Bath', icon: '🛁' },
  { id: 'compression', label: 'Compression', icon: '🦵' },
  { id: 'none', label: 'None currently', icon: '—' },
];

const SUPPLEMENTS = [
  { id: 'protein', label: 'Protein Powder', icon: '🥤' },
  { id: 'creatine', label: 'Creatine', icon: '⚗️' },
  { id: 'preworkout', label: 'Pre-Workout', icon: '⚡' },
  { id: 'bcaa', label: 'BCAAs', icon: '🧬' },
  { id: 'omega3', label: 'Omega-3', icon: '🐟' },
  { id: 'vitamin_d', label: 'Vitamin D', icon: '☀️' },
  { id: 'magnesium', label: 'Magnesium', icon: '💊' },
  { id: 'none', label: "I don't take any", icon: '🚫' },
];

const NUTRITION_PREFS = [
  { id: 'high_protein', label: 'High Protein', icon: '🥩' },
  { id: 'mediterranean', label: 'Mediterranean', icon: '🫒' },
  { id: 'asian', label: 'Asian Cuisine', icon: '🍜' },
  { id: 'meal_prep', label: 'Meal Prep', icon: '📦' },
  { id: 'intermittent_fasting', label: 'Intermittent Fasting', icon: '⏱️' },
  { id: 'plant_based', label: 'Plant-Based', icon: '🥦' },
  { id: 'keto_low_carb', label: 'Low Carb / Keto', icon: '🥑' },
  { id: 'flexible', label: 'Flexible / IIFYM', icon: '🔄' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function estimateMacros(data) {
  // Mifflin-St Jeor BMR
  const weightKg = data.weight_unit === 'kg'
    ? (parseFloat(data.weight) || 80)
    : (parseFloat(data.weight) || 180) / 2.205;

  let heightCm = 0;
  if (data.height_unit === 'cm') {
    heightCm = parseFloat(data.height_cm) || 175;
  } else {
    heightCm = ((parseFloat(data.height_ft) || 5) * 12 + (parseFloat(data.height_in) || 10)) * 2.54;
  }

  const age = calcAge(data.birthday) || 25;
  const sex = data.biological_sex || 'male';

  const bmr = sex === 'female'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

  const activityMultipliers = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
  };
  const tdee = bmr * (activityMultipliers[data.activity_level] || 1.55);
  const maintenance = Math.round(tdee);

  let calories = maintenance;
  const goal = data.fitness_goal;
  if (goal === 'build_muscle' || goal === 'get_stronger') calories += 500;
  else if (goal === 'lose_fat') calories -= 500;

  const weightLbs = weightKg * 2.205;
  const protein = Math.round(weightLbs * 1.0);
  const fats = Math.round(calories * 0.25 / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fats * 9) / 4));
  return { maintenance, calories, protein, carbs, fats };
}

function calcAge(birthday) {
  if (!birthday) return null;
  const today = new Date();
  const dob = new Date(birthday);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function estimateTimeline(current, goal, goalType) {
  const diff = Math.abs(parseFloat(current) - parseFloat(goal));
  if (!diff || diff < 1) return null;
  const weeksNeeded = goalType === 'lose_fat' ? Math.ceil(diff / 1) : Math.ceil(diff / 0.5);
  const months = Math.round(weeksNeeded / 4.3);
  if (months < 1) return '2–4 weeks';
  if (months === 1) return '~1 month';
  return `~${months} months`;
}

// ─── Shared UI pieces ─────────────────────────────────────────────────────────

function StepHeader({ label, title, subtitle }) {
  return (
    <div className="mb-7">
      {label && (
        <p className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-2" style={{ color: 'rgba(102,217,255,0.7)' }}>
          {label}
        </p>
      )}
      <h2
        className="text-3xl font-black tracking-tight leading-tight mb-2"
        style={{ background: 'linear-gradient(135deg, #ffffff 0%, #a8ecff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
      >
        {title}
      </h2>
      {subtitle && <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function SelectCard({ selected, onClick, children, glow }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-4 transition-all duration-200"
      style={selected ? {
        background: 'rgba(102,217,255,0.1)',
        border: '1px solid rgba(102,217,255,0.45)',
        boxShadow: glow ? '0 0 20px rgba(102,217,255,0.2)' : 'none',
      } : {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {children}
    </button>
  );
}

function MultiChip({ selected, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
      style={selected ? {
        background: 'rgba(102,217,255,0.12)',
        border: '1px solid rgba(102,217,255,0.4)',
        color: '#66D9FF',
        boxShadow: '0 0 12px rgba(102,217,255,0.15)',
      } : {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        color: 'rgba(255,255,255,0.6)',
      }}
    >
      {selected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
      {children}
    </button>
  );
}

function StyledInput({ value, onChange, placeholder, type = 'text', suffix, prefix, autoFocus }) {
  return (
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-4 text-muted-foreground text-sm font-medium">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full h-14 rounded-2xl text-lg font-bold text-foreground placeholder:text-muted-foreground/40 outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(102,217,255,0.2)',
          paddingLeft: prefix ? '2.5rem' : '1.25rem',
          paddingRight: suffix ? '3rem' : '1.25rem',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(102,217,255,0.5)'}
        onBlur={e => e.target.style.borderColor = 'rgba(102,217,255,0.2)'}
      />
      {suffix && <span className="absolute right-4 text-muted-foreground text-sm font-medium">{suffix}</span>}
    </div>
  );
}

function UnitToggle({ value, options, onChange }) {
  return (
    <div className="flex rounded-xl overflow-hidden mb-4" style={{ border: '1px solid rgba(102,217,255,0.15)', width: 'fit-content' }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className="px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all"
          style={value === opt
            ? { background: 'rgba(102,217,255,0.15)', color: '#66D9FF' }
            : { background: 'transparent', color: 'rgba(255,255,255,0.4)' }
          }
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Individual Steps ─────────────────────────────────────────────────────────

function StepWelcome() {
  return (
    <div className="flex flex-col items-center text-center pt-6">
      {/* Logo — official BodyQuest AI branding */}
      <div className="relative mb-8">
        {/* Ice blue glow behind logo */}
        <div className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.32) 0%, rgba(0,109,255,0.16) 48%, transparent 76%)', transform: 'scale(1.55)' }} />
        <div
          className="relative flex items-center justify-center overflow-hidden rounded-[2rem]"
          style={{
            width: 196,
            height: 160,
            background: 'radial-gradient(circle at 50% 40%, rgba(102,217,255,0.1), rgba(3,5,8,0.68) 68%)',
            border: '1px solid rgba(102,217,255,0.18)',
            boxShadow: '0 0 36px rgba(102,217,255,0.22), inset 0 0 36px rgba(3,5,8,0.75)',
          }}
        >
          <img
            src={BODYQUEST_LOGO_URL}
            alt="BodyQuest AI"
            className="w-full h-full object-cover relative z-10"
            style={{
              filter: 'drop-shadow(0 0 18px rgba(102,217,255,0.55)) drop-shadow(0 0 6px rgba(0,109,255,0.4))',
              maskImage: 'radial-gradient(circle at center, black 48%, rgba(0,0,0,0.88) 66%, transparent 92%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 48%, rgba(0,0,0,0.88) 66%, transparent 92%)',
            }}
          />
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle at center, transparent 44%, rgba(3,5,8,0.18) 68%, rgba(3,5,8,0.86) 100%)' }}
          />
        </div>
      </div>

      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-semibold mb-3">Welcome to</p>
      <h1
        className="text-5xl font-black tracking-tight leading-none"
        style={{ background: 'linear-gradient(135deg, #ffffff 0%, #66D9FF 60%, #006DFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
      >
        BodyQuest AI
      </h1>

      <div className="mt-6 mb-3 h-px w-20 mx-auto" style={{ background: 'linear-gradient(90deg, transparent, rgba(102,217,255,0.5), transparent)' }} />

      <p className="text-base font-semibold text-foreground/90 max-w-xs leading-relaxed mb-3">
        Log the work. Beat your numbers. Build the body.
      </p>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        Let's build your profile so <span className="font-semibold" style={{ color: '#66D9FF' }}>Titan</span> can create a fitness experience tailored to your body, your goals, and your journey.
      </p>
    </div>
  );
}

function StepUsername({ data, update }) {
  return (
    <div>
      <StepHeader
        label="Step 1 of 16"
        title="Choose a Username"
        subtitle="This is how you'll appear in the app. Pick something you're proud of."
      />
      <StyledInput
        value={data.display_name}
        onChange={e => update('display_name', e.target.value)}
        placeholder="e.g. IronMike, QueenGains..."
        autoFocus
      />
      {data.display_name.length > 2 && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-xs font-semibold flex items-center gap-1.5"
          style={{ color: '#66D9FF' }}
        >
          <Check className="w-3.5 h-3.5" /> Looking good, {data.display_name}
        </motion.p>
      )}
    </div>
  );
}

function StepBiologicalSex({ data, update }) {
  return (
    <div>
      <StepHeader
        label="Step 2 of 16"
        title="Biological Sex"
        subtitle="Used only for accurate calorie and hormone-based calculations. This stays private."
      />
      <div className="grid grid-cols-2 gap-3">
        {[{ id: 'male', label: 'Male', emoji: '♂️' }, { id: 'female', label: 'Female', emoji: '♀️' }].map(s => (
          <button
            key={s.id}
            onClick={() => update('biological_sex', s.id)}
            className="rounded-2xl py-8 flex flex-col items-center gap-3 transition-all duration-200"
            style={data.biological_sex === s.id ? {
              background: 'rgba(102,217,255,0.1)',
              border: '2px solid rgba(102,217,255,0.5)',
              boxShadow: '0 0 24px rgba(102,217,255,0.18)',
            } : {
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span className="text-4xl">{s.emoji}</span>
            <span className="font-black text-base text-foreground">{s.label}</span>
            {data.biological_sex === s.id && <Check className="w-4 h-4" style={{ color: '#66D9FF' }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepBirthday({ data, update }) {
  const age = calcAge(data.birthday);
  return (
    <div>
      <StepHeader
        label="Step 3 of 16"
        title="When's Your Birthday?"
        subtitle="Your age fine-tunes your metabolic rate and recovery recommendations."
      />
      <StyledInput
        type="date"
        value={data.birthday}
        onChange={e => update('birthday', e.target.value)}
      />
      {age !== null && age > 0 && age < 100 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{ background: 'rgba(102,217,255,0.07)', border: '1px solid rgba(102,217,255,0.18)' }}
        >
          <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: '#66D9FF' }} />
          <p className="text-sm text-foreground/85">
            You're <span className="font-black" style={{ color: '#66D9FF' }}>{age} years old</span> — your targets will be calibrated accordingly.
          </p>
        </motion.div>
      )}
    </div>
  );
}

function StepHeight({ data, update }) {
  return (
    <div>
      <StepHeader
        label="Step 4 of 16"
        title="Your Height"
        subtitle="Helps calculate BMR and body composition estimates."
      />
      <UnitToggle value={data.height_unit || 'ft'} options={['ft', 'cm']} onChange={v => update('height_unit', v)} />
      {(data.height_unit || 'ft') === 'ft' ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Feet</p>
            <StyledInput
              type="number"
              value={data.height_ft}
              onChange={e => update('height_ft', e.target.value)}
              placeholder="5"
              suffix="ft"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Inches</p>
            <StyledInput
              type="number"
              value={data.height_in}
              onChange={e => update('height_in', e.target.value)}
              placeholder="11"
              suffix="in"
            />
          </div>
        </div>
      ) : (
        <StyledInput
          type="number"
          value={data.height_cm}
          onChange={e => update('height_cm', e.target.value)}
          placeholder="180"
          suffix="cm"
        />
      )}
    </div>
  );
}

function StepWeight({ data, update }) {
  return (
    <div>
      <StepHeader
        label="Step 5 of 16"
        title="Current Weight"
        subtitle="Your starting point. You can update this anytime after workouts."
      />
      <UnitToggle value={data.weight_unit || 'lbs'} options={['lbs', 'kg']} onChange={v => update('weight_unit', v)} />
      <StyledInput
        type="number"
        value={data.weight}
        onChange={e => update('weight', e.target.value)}
        placeholder={data.weight_unit === 'kg' ? '80' : '180'}
        suffix={data.weight_unit || 'lbs'}
      />
    </div>
  );
}

function StepGoalWeight({ data, update }) {
  const unit = data.weight_unit || 'lbs';
  const current = parseFloat(data.weight);
  const goal = parseFloat(data.goal_weight);
  const diff = current && goal ? (goal - current).toFixed(1) : null;
  const timeline = data.fitness_goal && current && goal
    ? estimateTimeline(current, goal, data.fitness_goal)
    : null;

  return (
    <div>
      <StepHeader
        label="Step 6 of 16"
        title="Goal Weight"
        subtitle="Where do you want to be? This anchors your long-term targets."
      />
      <StyledInput
        type="number"
        value={data.goal_weight}
        onChange={e => update('goal_weight', e.target.value)}
        placeholder={unit === 'kg' ? '75' : '170'}
        suffix={unit}
      />
      {current && goal && !isNaN(diff) && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl p-4 space-y-2"
          style={{ background: 'rgba(102,217,255,0.06)', border: '1px solid rgba(102,217,255,0.15)' }}
        >
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current</span>
            <span className="font-black text-foreground">{data.weight} {unit}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Goal</span>
            <span className="font-black" style={{ color: '#66D9FF' }}>{data.goal_weight} {unit}</span>
          </div>
          <div className="h-px" style={{ background: 'rgba(102,217,255,0.12)' }} />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Difference</span>
            <span className={`font-bold ${parseFloat(diff) > 0 ? 'text-green-400' : 'text-orange-400'}`}>
              {parseFloat(diff) > 0 ? '+' : ''}{diff} {unit}
            </span>
          </div>
          {timeline && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated timeline</span>
              <span className="font-bold text-foreground">{timeline}</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function StepMainGoal({ data, update }) {
  return (
    <div>
      <StepHeader
        label="Step 7 of 16"
        title="Your Main Goal"
        subtitle="This shapes every workout, meal plan, and recommendation you'll receive."
      />
      <div className="space-y-2.5">
        {GOALS.map(g => (
          <SelectCard key={g.id} selected={data.fitness_goal === g.id} onClick={() => update('fitness_goal', g.id)} glow>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={data.fitness_goal === g.id
                  ? { background: 'rgba(102,217,255,0.15)', border: '1px solid rgba(102,217,255,0.35)' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
                }>
                <g.icon className="w-5 h-5" style={{ color: data.fitness_goal === g.id ? '#66D9FF' : 'rgba(255,255,255,0.4)' }} />
              </div>
              <div className="flex-1">
                <p className={`font-bold text-sm ${data.fitness_goal === g.id ? 'text-foreground' : 'text-foreground/80'}`}>{g.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
              </div>
              {data.fitness_goal === g.id && <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#66D9FF' }} />}
            </div>
          </SelectCard>
        ))}
      </div>
    </div>
  );
}

function StepActivityLevel({ data, update }) {
  return (
    <div>
      <StepHeader
        label="Step 8 of 16"
        title="Activity Level"
        subtitle="How active are you outside the gym? Be honest — it directly affects your calorie targets."
      />
      <div className="space-y-2.5">
        {ACTIVITY_LEVELS.map((a, i) => (
          <SelectCard key={a.id} selected={data.activity_level === a.id} onClick={() => update('activity_level', a.id)} glow>
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base font-black"
                style={data.activity_level === a.id
                  ? { background: 'rgba(102,217,255,0.15)', color: '#66D9FF', border: '1px solid rgba(102,217,255,0.3)' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.07)' }
                }>
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-foreground/90">{a.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
              </div>
              {data.activity_level === a.id && <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#66D9FF' }} />}
            </div>
          </SelectCard>
        ))}
      </div>
    </div>
  );
}

// ─── Nutrition Targets Step ───────────────────────────────────────────────────

function StepNutritionTargets({ data, update }) {
  const macros = estimateMacros(data);
  const activeTargets = {
    calories: data.calorie_goal || macros.calories,
    protein: data.protein_goal || macros.protein,
    carbs: data.carb_goal || macros.carbs,
    fats: data.fat_goal || macros.fats,
  };
  const displayedTargets = data.nutrition_targets_confirmed ? activeTargets : macros;

  const goal = data.fitness_goal;
  const goalLabel = goal === 'lose_fat' ? 'Fat Loss' : goal === 'build_muscle' || goal === 'get_stronger' ? 'Muscle Building' : 'Maintenance';
  const deficitLabel = goal === 'lose_fat'
    ? 'Since your goal is fat loss, Titan applied a ~500 calorie daily deficit to your maintenance to accelerate fat burning while preserving muscle.'
    : goal === 'build_muscle' || goal === 'get_stronger'
    ? 'Since your goal is muscle building, Titan added a ~500 calorie daily surplus to fuel muscle growth and strength gains.'
    : 'Your goal is maintenance, so Titan set your target close to your estimated maintenance calories.';

  const [customMode, setCustomMode] = React.useState(false);
  const [custom, setCustom] = React.useState({
    calories: String(data.calorie_goal || macros.calories),
    protein: String(data.protein_goal || macros.protein),
    carbs: String(data.carb_goal || macros.carbs),
    fats: String(data.fat_goal || macros.fats),
  });

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(102,217,255,0.2)',
    borderRadius: 12, color: 'white', padding: '10px 14px', outline: 'none',
    width: '100%', fontSize: 15, fontWeight: 700,
  };

  const cleanTarget = (value, fallback) => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };

  const handleAccept = () => {
    update('maintenance_calories', macros.maintenance);
    update('calorie_goal', macros.calories);
    update('protein_goal', macros.protein);
    update('carb_goal', macros.carbs);
    update('fat_goal', macros.fats);
    update('nutrition_targets_source', 'titan');
    update('nutrition_targets_confirmed', true);
    setCustomMode(false);
  };

  const handleSaveCustom = () => {
    update('maintenance_calories', macros.maintenance);
    update('calorie_goal', cleanTarget(custom.calories, macros.calories));
    update('protein_goal', cleanTarget(custom.protein, macros.protein));
    update('carb_goal', cleanTarget(custom.carbs, macros.carbs));
    update('fat_goal', cleanTarget(custom.fats, macros.fats));
    update('nutrition_targets_source', 'custom');
    update('nutrition_targets_confirmed', true);
    setCustomMode(false);
  };

  const openCustomMode = () => {
    setCustom({
      calories: String(activeTargets.calories),
      protein: String(activeTargets.protein),
      carbs: String(activeTargets.carbs),
      fats: String(activeTargets.fats),
    });
    setCustomMode(true);
  };

  const isTitanAccepted = data.nutrition_targets_confirmed && data.nutrition_targets_source === 'titan';
  const isCustomAccepted = data.nutrition_targets_confirmed && data.nutrition_targets_source === 'custom';

  return (
    <div>
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-2" style={{ color: 'rgba(102,217,255,0.7)' }}>
          Step 9 of 16
        </p>
        <h2 className="text-3xl font-black tracking-tight leading-tight mb-2"
          style={{ background: 'linear-gradient(135deg, #ffffff 0%, #a8ecff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Your Nutrition Targets Are Ready
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Titan used your body data, activity level, and goal to estimate the daily calorie and macro targets that support your transformation.
        </p>
      </div>

      {/* Maintenance vs Goal explanation */}
      <div className="rounded-2xl p-4 mb-4 relative overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Estimated Maintenance</p>
            <p className="text-2xl font-black text-foreground">{macros.maintenance.toLocaleString()} <span className="text-sm font-semibold text-muted-foreground">cal/day</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: 'rgba(102,217,255,0.7)' }}>
              {isCustomAccepted ? 'Custom Target' : `Goal: ${goalLabel}`}
            </p>
            <p className="text-3xl font-black" style={{ color: '#66D9FF' }}>{displayedTargets.calories.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">cal/day target</p>
          </div>
        </div>
        <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{deficitLabel}</p>
      </div>

      {/* Macro targets */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Protein', value: displayedTargets.protein, unit: 'g', color: '#66D9FF' },
          { label: 'Carbs', value: displayedTargets.carbs, unit: 'g', color: '#fbbf24' },
          { label: 'Fats', value: displayedTargets.fats, unit: 'g', color: '#a78bfa' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="rounded-2xl p-3 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-xl font-black" style={{ color }}>{value}{unit}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Why this matters */}
      <div className="rounded-2xl px-4 py-3 mb-4"
        style={{ background: 'rgba(102,217,255,0.05)', border: '1px solid rgba(102,217,255,0.15)' }}>
        <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: 'rgba(102,217,255,0.7)' }}>Why This Matters</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Training creates the signal. Nutrition supports the transformation. Hit these targets consistently and Titan can guide your progress with much greater accuracy.
        </p>
      </div>

      {/* Custom mode inputs */}
      {customMode && (
        <div className="rounded-2xl p-4 mb-4 space-y-3"
          style={{ background: 'rgba(102,217,255,0.05)', border: '1px solid rgba(102,217,255,0.2)' }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#66D9FF' }}>Custom Targets</p>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Daily Calories</p>
            <input style={inputStyle} type="number" value={custom.calories} onChange={e => setCustom(p => ({ ...p, calories: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'protein', label: 'Protein (g)' },
              { key: 'carbs', label: 'Carbs (g)' },
              { key: 'fats', label: 'Fats (g)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                <input style={inputStyle} type="number" value={custom[key]} onChange={e => setCustom(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <button onClick={handleSaveCustom}
            className="w-full h-11 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', color: '#030508', border: 'none' }}>
            Save My Targets
          </button>
        </div>
      )}

      {/* CTA buttons */}
      {!customMode && (
        <div className="space-y-2.5">
          <button
            onClick={handleAccept}
            className="w-full h-13 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 py-4"
            style={isTitanAccepted ? {
              background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.35)',
              color: '#4ade80', boxShadow: '0 0 20px rgba(74,222,128,0.12)',
            } : {
              background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
              color: '#030508', border: 'none', boxShadow: '0 0 28px rgba(102,217,255,0.35)',
            }}>
            {isTitanAccepted ? <><Check className="w-4 h-4" /> Titan's Targets Applied</> : <>Use Titan's Targets</>}
          </button>
          <button onClick={openCustomMode}
            className="w-full h-11 rounded-xl font-semibold text-sm uppercase tracking-wider flex items-center justify-center"
            style={isCustomAccepted ? {
              background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.35)',
              color: '#4ade80',
            } : {
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)',
            }}>
            {isCustomAccepted ? <><Check className="w-4 h-4 mr-2" /> Custom Targets Applied</> : <>Customize My Targets</>}
          </button>
        </div>
      )}

      {customMode && (
        <button onClick={handleAccept}
          className="w-full h-10 rounded-xl text-xs font-semibold uppercase tracking-wider"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
          Use Titan's Targets Instead
        </button>
      )}
    </div>
  );
}

function StepTrainingStyle({ data, update }) {
  const selected = data.training_styles || [];
  const toggle = (id) => {
    update('training_styles', selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  };
  return (
    <div>
      <StepHeader
        label="Step 10 of 16"
        title="Training Style"
        subtitle="Pick everything that resonates. Your workouts will be designed around your preferences."
      />
      <div className="flex flex-wrap gap-2.5">
        {TRAINING_STYLES.map(t => (
          <MultiChip key={t.id} selected={selected.includes(t.id)} onClick={() => toggle(t.id)}>
            <span>{t.icon}</span> {t.label}
          </MultiChip>
        ))}
        {selected.includes('glute_focused') && (
          <p className="w-full text-xs text-muted-foreground mt-1 leading-relaxed" style={{ color: 'rgba(102,217,255,0.6)' }}>
            ✓ Titan will prioritize hip thrusts, RDLs, glute bridges, cable kickbacks, abduction & hamstring-focused work in your programming.
          </p>
        )}
      </div>
    </div>
  );
}

function StepGymAccess({ data, update }) {
  return (
    <div>
      <StepHeader
        label="Step 11 of 16"
        title="Gym Access"
        subtitle="Your available equipment determines which exercises make sense for you."
      />
      <div className="grid grid-cols-2 gap-3">
        {GYM_ACCESS.map(g => (
          <button
            key={g.id}
            onClick={() => update('gym_access', g.id)}
            className="rounded-2xl p-4 text-left transition-all duration-200"
            style={data.gym_access === g.id ? {
              background: 'rgba(102,217,255,0.1)',
              border: '1.5px solid rgba(102,217,255,0.45)',
              boxShadow: '0 0 18px rgba(102,217,255,0.15)',
            } : {
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="text-3xl mb-2">{g.icon}</div>
            <p className="font-bold text-sm text-foreground mb-1">{g.label}</p>
            <p className="text-[11px] text-muted-foreground leading-snug">{g.desc}</p>
            {data.gym_access === g.id && (
              <div className="mt-2 flex items-center gap-1" style={{ color: '#66D9FF' }}>
                <Check className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Selected</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepInjuries({ data, update }) {
  return (
    <div>
      <StepHeader
        label="Step 12 of 16"
        title="Injuries & Limitations"
        subtitle="Tell your coach anything they should know. Your safety comes first — exercises will be modified accordingly."
      />
      <textarea
        value={data.injuries || ''}
        onChange={e => update('injuries', e.target.value)}
        placeholder="e.g. Bad lower back, left knee pain, avoid overhead pressing..."
        rows={4}
        className="w-full rounded-2xl p-4 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(102,217,255,0.2)',
          lineHeight: '1.6',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(102,217,255,0.5)'}
        onBlur={e => e.target.style.borderColor = 'rgba(102,217,255,0.2)'}
      />
      <button
        onClick={() => update('injuries', 'No injuries or limitations')}
        className="mt-3 text-sm font-semibold flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
      >
        <Check className="w-3.5 h-3.5" /> No injuries — I'm good to go
      </button>
    </div>
  );
}

function StepRecoveryTools({ data, update }) {
  const selected = data.recovery_tools || [];
  const toggle = (id) => {
    update('recovery_tools', selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  };
  return (
    <div>
      <StepHeader
        label="Step 13 of 16"
        title="Recovery Tools"
        subtitle="What do you use to recover? This helps plan your rest days and recommendations."
      />
      <div className="flex flex-wrap gap-2.5">
        {RECOVERY_TOOLS.map(r => (
          <MultiChip key={r.id} selected={selected.includes(r.id)} onClick={() => toggle(r.id)}>
            <span>{r.icon}</span> {r.label}
          </MultiChip>
        ))}
      </div>
    </div>
  );
}

function StepSleep({ data, update }) {
  return (
    <div>
      <StepHeader
        label="Step 14 of 16"
        title="Sleep & Recovery"
        subtitle="Sleep is the most underrated performance tool. Tell us about yours."
      />
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Typical sleep duration</p>
          <div className="flex flex-wrap gap-2">
            {['< 5 hrs', '5–6 hrs', '6–7 hrs', '7–8 hrs', '8–9 hrs', '9+ hrs'].map(opt => (
              <button
                key={opt}
                onClick={() => update('sleep_duration', opt)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={data.sleep_duration === opt
                  ? { background: 'rgba(102,217,255,0.12)', border: '1px solid rgba(102,217,255,0.4)', color: '#66D9FF' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Sleep quality</p>
          <div className="flex flex-wrap gap-2">
            {['Poor', 'Fair', 'Good', 'Excellent'].map(opt => (
              <button
                key={opt}
                onClick={() => update('sleep_quality', opt)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={data.sleep_quality === opt
                  ? { background: 'rgba(102,217,255,0.12)', border: '1px solid rgba(102,217,255,0.4)', color: '#66D9FF' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepNutritionPrefs({ data, update }) {
  const selected = data.nutrition_prefs || [];
  const toggle = (id) => {
    update('nutrition_prefs', selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  };
  return (
    <div>
      <StepHeader
        label="Step 15 of 16"
        title="Nutrition Preferences"
        subtitle="Meal recommendations will align with your food culture and dietary style."
      />
      <div className="flex flex-wrap gap-2.5">
        {NUTRITION_PREFS.map(n => (
          <MultiChip key={n.id} selected={selected.includes(n.id)} onClick={() => toggle(n.id)}>
            <span>{n.icon}</span> {n.label}
          </MultiChip>
        ))}
      </div>
    </div>
  );
}

function StepSupplements({ data, update }) {
  const selected = data.supplements || [];
  const toggle = (id) => {
    if (id === 'none') {
      update('supplements', selected.includes('none') ? [] : ['none']);
      return;
    }
    const next = selected.filter(x => x !== 'none');
    update('supplements', next.includes(id) ? next.filter(x => x !== id) : [...next, id]);
  };
  return (
    <div>
      <StepHeader
        label="Step 16 of 16"
        title="Supplements"
        subtitle="So your coach knows what's already in your stack and what might help."
      />
      <div className="flex flex-wrap gap-2.5">
        {SUPPLEMENTS.map(s => (
          <MultiChip key={s.id} selected={selected.includes(s.id)} onClick={() => toggle(s.id)}>
            <span>{s.icon}</span> {s.label}
          </MultiChip>
        ))}
      </div>
    </div>
  );
}

function StepFinish({ data }) {
  const name = data.display_name || 'Athlete';
  return (
    <div className="flex flex-col items-center text-center pt-4">
      {/* Official BodyQuest AI logo with activation glow */}
      <div className="relative mb-8 flex items-center justify-center" style={{ width: 140, height: 140 }}>
        {/* Outer pulse ring */}
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: 'transparent', border: '1px solid rgba(102,217,255,0.2)', borderRadius: '50%', transform: 'scale(1.35)', animation: 'none', boxShadow: '0 0 40px rgba(102,217,255,0.18)' }} />
        {/* Mid ring */}
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: 'transparent', border: '1px solid rgba(102,217,255,0.1)', borderRadius: '50%', transform: 'scale(1.65)' }} />
        {/* Deep glow bloom */}
        <div className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.38) 0%, rgba(0,109,255,0.2) 45%, transparent 75%)', transform: 'scale(1.9)' }} />
        {/* Logo */}
        <img
          src={BODYQUEST_LOGO_URL}
          alt="BodyQuest AI"
          className="w-24 h-24 object-contain relative z-10"
          style={{ filter: 'drop-shadow(0 0 20px rgba(102,217,255,0.65)) drop-shadow(0 0 8px rgba(0,109,255,0.5))' }}
        />
      </div>

      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-2">Profile Complete</p>
      <h2
        className="text-4xl font-black tracking-tight leading-tight mb-4"
        style={{ background: 'linear-gradient(135deg, #ffffff 0%, #66D9FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
      >
        You're Ready, {name}
      </h2>

      <p className="text-base text-foreground/85 max-w-xs leading-relaxed mb-2 font-medium">
        Titan now has everything it needs to build your personalized training, nutrition, and recovery system.
      </p>
      <p className="text-sm max-w-xs leading-relaxed mb-6" style={{ color: 'rgba(102,217,255,0.75)' }}>
        Your journey is ready. Your plan is being calibrated right now.
      </p>

      {/* Summary chips */}
      <div className="flex flex-wrap justify-center gap-2 max-w-xs">
        {[
          data.fitness_goal && GOALS.find(g => g.id === data.fitness_goal)?.label,
          data.activity_level && ACTIVITY_LEVELS.find(a => a.id === data.activity_level)?.label,
          data.gym_access && GYM_ACCESS.find(g => g.id === data.gym_access)?.label,
        ].filter(Boolean).map(tag => (
          <span key={tag} className="text-xs px-3 py-1.5 rounded-full font-semibold"
            style={{ background: 'rgba(102,217,255,0.08)', border: '1px solid rgba(102,217,255,0.22)', color: '#66D9FF' }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Onboarding Component ────────────────────────────────────────────────

const TOTAL_STEPS = 18; // 0=welcome, 1-15=steps, 16=nutrition targets, 17=finish

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    display_name: '',
    biological_sex: '',
    birthday: '',
    height_unit: 'ft',
    height_ft: '',
    height_in: '',
    height_cm: '',
    weight_unit: 'lbs',
    weight: '',
    goal_weight: '',
    fitness_goal: '',
    activity_level: '',
    training_styles: [],
    gym_access: '',
    injuries: '',
    recovery_tools: [],
    sleep_duration: '',
    sleep_quality: '',
    nutrition_prefs: [],
    supplements: [],
    maintenance_calories: '',
    calorie_goal: '',
    protein_goal: '',
    carb_goal: '',
    fat_goal: '',
    nutrition_targets_source: '',
    nutrition_targets_confirmed: false,
  });

  const nutritionTargetInputs = new Set([
    'biological_sex',
    'birthday',
    'height_unit',
    'height_ft',
    'height_in',
    'height_cm',
    'weight_unit',
    'weight',
    'fitness_goal',
    'activity_level',
  ]);

  const update = (field, val) => setData(prev => {
    const next = { ...prev, [field]: val };
    if (nutritionTargetInputs.has(field)) {
      next.maintenance_calories = '';
      next.calorie_goal = '';
      next.protein_goal = '';
      next.carb_goal = '';
      next.fat_goal = '';
      next.nutrition_targets_source = '';
      next.nutrition_targets_confirmed = false;
    }
    return next;
  });

  const go = (dir) => {
    setDirection(dir);
    setStep(s => s + dir);
  };

  const handleFinish = async () => {
    setSaving(true);
    let heightInches = '';
    if (data.height_unit === 'ft') {
      heightInches = (parseFloat(data.height_ft || 0) * 12 + parseFloat(data.height_in || 0)).toString();
    } else {
      heightInches = data.height_cm ? (parseFloat(data.height_cm) / 2.54).toFixed(1) : '';
    }
    // Use whatever targets the user accepted/customized, fallback to estimate
    const fallback = estimateMacros(data);
    await base44.auth.updateMe({
      ...data,
      height: heightInches,
      maintenance_calories: data.maintenance_calories || fallback.maintenance,
      calorie_goal: data.calorie_goal || fallback.calories,
      protein_goal: data.protein_goal || fallback.protein,
      carb_goal: data.carb_goal || fallback.carbs,
      fat_goal: data.fat_goal || fallback.fats,
      nutrition_targets_source: data.nutrition_targets_source || 'titan',
      nutrition_targets_confirmed: true,
      onboarding_complete: true,
    });
    navigate('/');
  };

  const canNext = () => {
    if (step === 1) return data.display_name.trim().length >= 2;
    if (step === 2) return !!data.biological_sex;
    if (step === 3) return !!data.birthday && calcAge(data.birthday) > 0;
    if (step === 5) return !!data.weight;
    if (step === 7) return !!data.fitness_goal;
    if (step === 8) return !!data.activity_level;
    if (step === 9) return !!data.nutrition_targets_confirmed;
    if (step === 11) return !!data.gym_access;
    return true;
  };

  const isWelcome = step === 0;
  const isFinish = step === TOTAL_STEPS - 1;
  // Progress: skip welcome (0) and finish (17), show 1-16
  const progressPct = step === 0 ? 0 : Math.min(((step) / (TOTAL_STEPS - 2)) * 100, 100);

  const stepComponents = [
    <StepWelcome key="welcome" />,
    <StepUsername key="username" data={data} update={update} />,
    <StepBiologicalSex key="sex" data={data} update={update} />,
    <StepBirthday key="birthday" data={data} update={update} />,
    <StepHeight key="height" data={data} update={update} />,
    <StepWeight key="weight" data={data} update={update} />,
    <StepGoalWeight key="goalweight" data={data} update={update} />,
    <StepMainGoal key="goal" data={data} update={update} />,
    <StepActivityLevel key="activity" data={data} update={update} />,
    <StepNutritionTargets key="nutritiontargets" data={data} update={update} />,
    <StepTrainingStyle key="training" data={data} update={update} />,
    <StepGymAccess key="gym" data={data} update={update} />,
    <StepInjuries key="injuries" data={data} update={update} />,
    <StepRecoveryTools key="recovery" data={data} update={update} />,
    <StepSleep key="sleep" data={data} update={update} />,
    <StepNutritionPrefs key="nutrition" data={data} update={update} />,
    <StepSupplements key="supplements" data={data} update={update} />,
    <StepFinish key="finish" data={data} />,
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96"
          style={{ background: 'radial-gradient(circle, rgba(0,109,255,0.08) 0%, transparent 70%)', transform: 'translateX(-50%) translateY(-30%)' }} />
        <div className="absolute bottom-0 right-0 w-64 h-64"
          style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.05) 0%, transparent 70%)' }} />
      </div>

      {/* Brand header */}
      <div className="relative z-10 px-5 pt-4 pb-1">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div
            className="h-12 w-36 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{
              background: 'radial-gradient(circle at center, rgba(102,217,255,0.08), rgba(3,5,8,0.72) 76%)',
              border: '1px solid rgba(102,217,255,0.2)',
              boxShadow: '0 0 22px rgba(102,217,255,0.18), inset 0 0 24px rgba(3,5,8,0.7)',
            }}
          >
            <img
              src={BODYQUEST_LOGO_URL}
              alt="BodyQuest AI"
              className="w-full h-full object-cover"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(102,217,255,0.45))',
                maskImage: 'linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%)',
              }}
            />
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[10px] font-semibold mt-1" style={{ color: 'rgba(102,217,255,0.68)' }}>
              Titan onboarding
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {!isWelcome && (
        <div className="relative z-10 px-5 pt-5 pb-2">
          <div className="flex items-center gap-3 mb-1">
            {step > 0 && !isFinish && (
              <button onClick={() => go(-1)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #66D9FF, #006DFF)' }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            {!isWelcome && !isFinish && (
              <span className="text-[10px] font-bold text-muted-foreground flex-shrink-0 tabular-nums" style={{ minWidth: '2.5rem', textAlign: 'right' }}>
                {step} / {TOTAL_STEPS - 2}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pt-4 pb-4">
        <div className="max-w-md mx-auto">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 32 : -32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -32 : 32 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {stepComponents[step]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="relative z-10 px-5 pb-10 pt-4 max-w-md mx-auto w-full">
        {isFinish ? (
          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full h-16 rounded-2xl font-black text-base uppercase tracking-widest flex items-center justify-center gap-3"
            style={{
              background: saving ? 'rgba(102,217,255,0.4)' : 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
              color: '#030508',
              border: 'none',
              boxShadow: '0 0 40px rgba(102,217,255,0.45), 0 0 80px rgba(0,109,255,0.25), 0 4px 24px rgba(0,0,0,0.4)',
              letterSpacing: '0.15em',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <><Activity className="w-5 h-5 animate-pulse" /> Setting Up...</>
            ) : (
              <><Zap className="w-5 h-5" /> Start My Quest</>
            )}
          </button>
        ) : isWelcome ? (
          <button
            onClick={() => go(1)}
            className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
              color: '#030508',
              border: 'none',
              boxShadow: '0 0 32px rgba(102,217,255,0.4), 0 0 64px rgba(0,109,255,0.2)',
              letterSpacing: '0.12em',
            }}
          >
            <Sparkles className="w-5 h-5" />
            Set Up Titan
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => go(1)}
            disabled={!canNext()}
            className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-35"
            style={{
              background: canNext()
                ? 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)'
                : 'rgba(255,255,255,0.08)',
              color: canNext() ? '#030508' : 'rgba(255,255,255,0.4)',
              border: canNext() ? 'none' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: canNext() ? '0 0 28px rgba(102,217,255,0.35), 0 0 56px rgba(0,109,255,0.18)' : 'none',
              letterSpacing: '0.12em',
            }}
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
