import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, Sparkles, Trash2, Apple, Mic, Camera, X } from 'lucide-react';
import SleepSection from '@/components/nutrition/SleepSection';
import CalorieGoalCard from '@/components/nutrition/CalorieGoalCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

// ── Scroll-reactive body outline background ──────────────────────────────────
function NutritionBodyBackground({ scrollY }) {
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

// ── Macro Circle ──────────────────────────────────────────────────────────────
function MacroCircle({ label, current, goal, color, glowColor }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const r = 15.9155;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  const gap = circumference - dash;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-[72px] h-[72px]">
        <svg className="w-[72px] h-[72px] -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r={r} fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 5px ${glowColor})`, transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-foreground">{Math.round(pct)}%</span>
        </div>
      </div>
      <div className="text-sm font-black text-foreground leading-none">{current}<span className="text-[10px] font-normal text-muted-foreground">g</span></div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-[9px] font-medium" style={{ color }}>{Math.max(0, goal - current)}g left</div>
    </div>
  );
}

// ── Meal log dialog modes ─────────────────────────────────────────────────────
function LogMealDialog({ open, onOpenChange, onConfirm }) {
  const [mode, setMode] = useState('voice'); // 'voice' | 'photo'
  const [mealInput, setMealInput] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [logging, setLogging] = useState(false);
  const [pendingMeal, setPendingMeal] = useState(null);
  const fileInputRef = useRef(null);

  const reset = () => { setMealInput(''); setPhotoFile(null); setPhotoPreview(null); setPendingMeal(null); setLogging(false); };

  useEffect(() => { if (!open) reset(); }, [open]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleEstimate = async () => {
    setLogging(true);
    let prompt = '';
    let file_urls = undefined;

    if (mode === 'photo' && photoFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
      file_urls = [file_url];
      prompt = `You are a nutrition estimation AI. The user uploaded a photo of their meal. Analyze the image and estimate the nutritional content. Return JSON with: name (meal type like Breakfast/Lunch), description (what you see), estimated_calories (number), estimated_protein (grams), estimated_carbs (grams), estimated_fats (grams).`;
    } else {
      prompt = `You are a nutrition estimation AI. The user describes a meal: "${mealInput}". Estimate the nutritional content. Return JSON with: name (meal name like Breakfast, Lunch, etc.), description (clean description), estimated_calories (number), estimated_protein (grams), estimated_carbs (grams), estimated_fats (grams). Be reasonable.`;
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls,
      response_json_schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          estimated_calories: { type: 'number' },
          estimated_protein: { type: 'number' },
          estimated_carbs: { type: 'number' },
          estimated_fats: { type: 'number' },
        }
      }
    });
    setPendingMeal(result);
    setLogging(false);
  };

  const canEstimate = mode === 'voice' ? mealInput.trim().length > 0 : !!photoFile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-0 max-w-sm mx-4"
        style={{ background: 'rgba(10,14,24,0.98)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102,217,255,0.2)', boxShadow: '0 0 60px rgba(0,109,255,0.2)' }}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground font-black text-lg" style={{ background: 'linear-gradient(135deg,#fff 0%,#66D9FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Log Meal
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!pendingMeal ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Mode toggle */}
              <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(102,217,255,0.15)' }}>
                {[{ id: 'voice', icon: Mic, label: 'Voice Log' }, { id: 'photo', icon: Camera, label: 'Take Photo' }].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setMode(id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider transition-all"
                    style={mode === id
                      ? { background: 'rgba(102,217,255,0.12)', color: '#66D9FF', borderRight: id === 'voice' ? '1px solid rgba(102,217,255,0.15)' : 'none' }
                      : { background: 'transparent', color: 'rgba(255,255,255,0.35)', borderRight: id === 'voice' ? '1px solid rgba(102,217,255,0.1)' : 'none' }
                    }
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>

              {mode === 'voice' ? (
                <Textarea
                  value={mealInput}
                  onChange={e => setMealInput(e.target.value)}
                  placeholder='"6 eggs, toast, protein shake with 40g protein..."'
                  className="border-0 text-foreground placeholder:text-muted-foreground/50 resize-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(102,217,255,0.15)', minHeight: '90px' }}
                  autoFocus
                />
              ) : (
                <div
                  className="rounded-2xl overflow-hidden flex flex-col items-center justify-center cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(102,217,255,0.2)', minHeight: '120px' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="meal" className="w-full max-h-40 object-cover rounded-2xl" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-8">
                      <Camera className="w-8 h-8" style={{ color: 'rgba(102,217,255,0.5)' }} />
                      <p className="text-xs text-muted-foreground">Tap to select a photo</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
                </div>
              )}

              <button
                onClick={handleEstimate}
                disabled={logging || !canEstimate}
                className="w-full h-12 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', color: '#030508', border: 'none', boxShadow: '0 0 20px rgba(102,217,255,0.25)' }}
              >
                {logging ? <><Loader2 className="w-4 h-4 animate-spin" /> Estimating...</> : <><Sparkles className="w-4 h-4" /> Estimate Macros</>}
              </button>
            </motion.div>
          ) : (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(102,217,255,0.05)', border: '1px solid rgba(102,217,255,0.15)' }}>
                <h3 className="font-bold text-foreground">{pendingMeal.name}</h3>
                <p className="text-xs text-muted-foreground">{pendingMeal.description}</p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {[
                    { label: 'Calories', value: pendingMeal.estimated_calories, color: '#66D9FF' },
                    { label: 'Protein', value: `${pendingMeal.estimated_protein}g`, color: '#66D9FF' },
                    { label: 'Carbs', value: `${pendingMeal.estimated_carbs}g`, color: '#fbbf24' },
                    { label: 'Fats', value: `${pendingMeal.estimated_fats}g`, color: '#a78bfa' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="text-lg font-black" style={{ color }}>{value}</div>
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}*</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPendingMeal(null)} className="flex-1 h-11 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                  Edit
                </button>
                <button onClick={() => { onConfirm(pendingMeal); reset(); }} className="flex-1 h-11 rounded-xl text-sm font-bold" style={{ background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', color: '#030508' }}>
                  Save Meal
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NutritionTab() {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split('T')[0];
  const [showLog, setShowLog] = useState(false);
  const [logMode, setLogMode] = useState('voice');
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

  const { data: meals } = useQuery({
    queryKey: ['meals-today', todayStr],
    queryFn: () => base44.entities.Meal.filter({ date: todayStr }),
    initialData: [],
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Meal.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meals-today'] }),
  });

  const confirmMeal = async (mealData) => {
    await base44.entities.Meal.create({ date: todayStr, ...mealData, confirmed: true });
    queryClient.invalidateQueries({ queryKey: ['meals-today'] });
    setShowLog(false);
  };

  const totals = {
    calories: meals.reduce((s, m) => s + (m.estimated_calories || 0), 0),
    protein: meals.reduce((s, m) => s + (m.estimated_protein || 0), 0),
    carbs: meals.reduce((s, m) => s + (m.estimated_carbs || 0), 0),
    fats: meals.reduce((s, m) => s + (m.estimated_fats || 0), 0),
  };

  const calGoal = user?.calorie_goal || 2500;
  const proteinGoal = user?.protein_goal || 180;
  const carbGoal = user?.carb_goal || 280;
  const fatGoal = user?.fat_goal || 70;

  const calPct = calGoal > 0 ? Math.min(Math.round((totals.calories / calGoal) * 100), 100) : 0;
  const r = 15.9155;
  const calCirc = 2 * Math.PI * r;
  const calDash = (calPct / 100) * calCirc;
  const calGap = calCirc - calDash;
  const calRemaining = Math.max(0, calGoal - totals.calories);
  const proteinRemaining = Math.max(0, proteinGoal - totals.protein);

  const openLog = (mode) => { setLogMode(mode); setShowLog(true); };

  return (
    <div className="relative">
      <NutritionBodyBackground scrollY={scrollY} />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-8 pb-10 space-y-5">

        {/* ── Header ── */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1">Daily Tracking</p>
          <h1
            className="text-3xl font-black tracking-tight"
            style={{ background: 'linear-gradient(135deg, #ffffff 0%, #66D9FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          >
            Today's Fuel
          </h1>
          <div className="mt-4 h-px w-full" style={{ background: 'linear-gradient(90deg, rgba(102,217,255,0.4) 0%, rgba(0,109,255,0.15) 60%, transparent 100%)' }} />
        </div>

        {/* ── Hero calorie card ── */}
        <div
          className="rounded-3xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(10,14,26,0.97) 0%, rgba(0,25,55,0.92) 100%)',
            border: '1px solid rgba(102,217,255,0.22)',
            boxShadow: '0 0 60px rgba(0,109,255,0.12), inset 0 1px 0 rgba(102,217,255,0.12)',
          }}
        >
          <div className="absolute top-0 right-0 w-52 h-52 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.08) 0%, transparent 65%)', transform: 'translate(25%,-25%)' }} />

          {/* Centered calorie display */}
          <div className="flex flex-col items-center relative z-10 mb-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">Calories Today</p>

            {/* Ring + number */}
            <div className="relative w-36 h-36 mb-4">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 36 36">
                <defs>
                  <linearGradient id="calGradFull" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#66D9FF" />
                    <stop offset="100%" stopColor="#006DFF" />
                  </linearGradient>
                </defs>
                <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                <circle
                  cx="18" cy="18" r={r} fill="none"
                  stroke="url(#calGradFull)" strokeWidth="2"
                  strokeDasharray={`${calDash} ${calGap}`}
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(102,217,255,0.6))', transition: 'stroke-dasharray 0.6s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">eaten</span>
                <span
                  className="font-black leading-none"
                  style={{ fontSize: '1.9rem', background: 'linear-gradient(135deg,#fff 0%,#66D9FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >
                  {totals.calories.toLocaleString()}
                </span>
                <span className="text-[9px] text-muted-foreground">of {calGoal.toLocaleString()}</span>
              </div>
            </div>

            {/* Calorie fraction label */}
            <div
              className="flex items-baseline gap-1.5 px-5 py-2 rounded-full"
              style={{ background: 'rgba(102,217,255,0.07)', border: '1px solid rgba(102,217,255,0.18)' }}
            >
              <span className="text-2xl font-black" style={{ color: '#66D9FF', textShadow: '0 0 16px rgba(102,217,255,0.5)' }}>
                {totals.calories.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">/ {calGoal.toLocaleString()} kcal</span>
              <span className="text-xs font-bold ml-2" style={{ color: '#66D9FF' }}>·</span>
              <span className="text-xs font-bold" style={{ color: '#66D9FF' }}>{calRemaining.toLocaleString()} left</span>
            </div>
          </div>

          {/* Macro circles */}
          <div
            className="flex items-center justify-around py-4 rounded-2xl relative z-10"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <MacroCircle label="Protein" current={totals.protein} goal={proteinGoal} color="#66D9FF" glowColor="rgba(102,217,255,0.6)" />
            <div className="w-px h-14 bg-border" />
            <MacroCircle label="Carbs" current={totals.carbs} goal={carbGoal} color="#fbbf24" glowColor="rgba(251,191,36,0.5)" />
            <div className="w-px h-14 bg-border" />
            <MacroCircle label="Fats" current={totals.fats} goal={fatGoal} color="#a78bfa" glowColor="rgba(167,139,250,0.5)" />
          </div>
        </div>

        {/* ── Coach nudge ── */}
        {calRemaining > 0 && (
          <div
            className="rounded-2xl px-4 py-3 flex items-start gap-2"
            style={{ background: 'rgba(102,217,255,0.05)', border: '1px solid rgba(102,217,255,0.14)' }}
          >
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#66D9FF' }} />
            <p className="text-sm text-foreground/80">
              <span className="font-semibold" style={{ color: '#66D9FF' }}>{calRemaining.toLocaleString()} kcal</span> remaining today.
              {proteinRemaining > 20 && <> Still need <span className="font-semibold" style={{ color: '#66D9FF' }}>{proteinRemaining}g</span> protein.</>}
            </p>
          </div>
        )}

        {/* ── Two big action buttons ── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => openLog('voice')}
            className="h-16 rounded-2xl flex flex-col items-center justify-center gap-1 font-black text-xs uppercase tracking-widest"
            style={{
              background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
              color: '#030508',
              border: 'none',
              boxShadow: '0 0 28px rgba(102,217,255,0.35), 0 0 60px rgba(0,109,255,0.18), 0 4px 16px rgba(0,0,0,0.4)',
              letterSpacing: '0.08em',
            }}
          >
            <Mic className="w-5 h-5 mb-0.5" />
            Voice Log
          </button>
          <button
            onClick={() => openLog('photo')}
            className="h-16 rounded-2xl flex flex-col items-center justify-center gap-1 font-black text-xs uppercase tracking-widest"
            style={{
              background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
              color: '#030508',
              border: 'none',
              boxShadow: '0 0 28px rgba(102,217,255,0.35), 0 0 60px rgba(0,109,255,0.18), 0 4px 16px rgba(0,0,0,0.4)',
              letterSpacing: '0.08em',
            }}
          >
            <Camera className="w-5 h-5 mb-0.5" />
            Take Photo
          </button>
        </div>

        {/* ── Today's Meals ── */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">Today's Meals</p>

          {meals.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ background: 'rgba(10,12,18,0.6)', border: '1px dashed rgba(102,217,255,0.12)' }}
            >
              <Apple className="w-8 h-8 mx-auto mb-3 opacity-30 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No meals logged yet.</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Tap a button above to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {meals.map((meal, i) => {
                const timeStr = meal.created_date
                  ? new Date(meal.created_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                  : null;
                return (
                  <motion.div
                    key={meal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl p-4"
                    style={{ background: 'rgba(10,12,18,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(102,217,255,0.1)' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-bold text-sm text-foreground">{meal.name || 'Meal'}</h3>
                          {timeStr && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                              style={{ background: 'rgba(102,217,255,0.08)', border: '1px solid rgba(102,217,255,0.15)', color: 'rgba(102,217,255,0.7)' }}>
                              {timeStr}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{meal.description}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-black" style={{ color: '#66D9FF' }}>{meal.estimated_calories} kcal</span>
                          <span className="text-muted-foreground/60">·</span>
                          <span className="text-muted-foreground">{meal.estimated_protein}g <span style={{ color: '#66D9FF' }}>P</span></span>
                          <span className="text-muted-foreground">{meal.estimated_carbs}g <span style={{ color: '#fbbf24' }}>C</span></span>
                          <span className="text-muted-foreground">{meal.estimated_fats}g <span style={{ color: '#a78bfa' }}>F</span></span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMut.mutate(meal.id)}
                        className="text-muted-foreground/30 hover:text-red-400 transition-colors mt-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Calorie Goal Breakdown ── */}
        <CalorieGoalCard user={user} />

        {/* ── Sleep Recovery ── */}
        <SleepSection />
      </div>

      {/* ── Log Meal Dialog ── */}
      <LogMealDialog open={showLog} onOpenChange={setShowLog} onConfirm={confirmMeal} />
    </div>
  );
}