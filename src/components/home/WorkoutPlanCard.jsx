import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Dumbbell, Clock, Zap, ChevronRight, Sparkles, Loader2,
  Library, Plus, Trash2, GripVertical, Pencil, ChevronUp, ChevronDown
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { createTodayWorkout } from '@/lib/today-workout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['push', 'pull', 'legs', 'chest', 'back', 'arms', 'shoulders', 'glutes', 'upper_body', 'lower_body', 'full_body', 'custom'];

const EMPTY_EXERCISE = { name: '', muscle_group: '', target_sets: 3, target_reps: 10 };

const EXERCISE_LIBRARY = [
  { name: 'Barbell Bench Press', muscle_group: 'chest', target_sets: 4, target_reps: 8 },
  { name: 'Incline Dumbbell Press', muscle_group: 'chest', target_sets: 3, target_reps: 10 },
  { name: 'Pec Deck Fly', muscle_group: 'chest', target_sets: 3, target_reps: 12 },
  { name: 'Lat Pulldown', muscle_group: 'back', target_sets: 4, target_reps: 10 },
  { name: 'Barbell Row', muscle_group: 'back', target_sets: 4, target_reps: 8 },
  { name: 'Seated Cable Row', muscle_group: 'back', target_sets: 3, target_reps: 12 },
  { name: 'Squat', muscle_group: 'legs', target_sets: 4, target_reps: 8 },
  { name: 'Leg Press', muscle_group: 'legs', target_sets: 3, target_reps: 12 },
  { name: 'Romanian Deadlift', muscle_group: 'legs', target_sets: 3, target_reps: 10 },
  { name: 'Seated Shoulder Press', muscle_group: 'shoulders', target_sets: 3, target_reps: 10 },
  { name: 'Cable Lateral Raise', muscle_group: 'shoulders', target_sets: 3, target_reps: 15 },
  { name: 'Triceps Rope Pushdown', muscle_group: 'arms', target_sets: 3, target_reps: 12 },
  { name: 'Dumbbell Curl', muscle_group: 'arms', target_sets: 3, target_reps: 12 },
];

const normalizeExercise = (exercise) => ({
  name: exercise?.name || '',
  muscle_group: exercise?.muscle_group || '',
  target_sets: exercise?.target_sets || 3,
  target_reps: exercise?.target_reps || 10,
});

// ── Titan AI Dialog ───────────────────────────────────────────────────────────
function TitanBuildDialog({ open, onOpenChange, user }) {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const reset = () => {
    setPrompt('');
    setDraft(null);
    setLoading(false);
    setSaving(false);
  };

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleBuild = async () => {
    setLoading(true);

    const profileContext = user ? `
User profile:
- Goal: ${user.fitness_goal || 'build muscle'}
- Training styles: ${(user.training_styles || []).join(', ') || 'not specified'}
- Gym access: ${user.gym_access || 'full gym'}
- Injuries: ${user.injuries || 'none'}
- Activity level: ${user.activity_level || 'moderate'}
` : '';

    const basePrompt = prompt.trim()
      ? `Create a gym workout based on: "${prompt}". ${profileContext}`
      : `Create today's optimal workout based on this athlete's profile: ${profileContext}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Titan, a world-class AI bodybuilding coach. ${basePrompt}
Return a JSON object with: name (string, e.g. "Chest & Triceps"), category (one of: push, pull, legs, chest, back, arms, shoulders, glutes, upper_body, lower_body, full_body, custom), estimated_duration (number in minutes), exercises (array of 5-8 objects with: name, muscle_group, target_sets, target_reps).`,
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          category: { type: "string" },
          estimated_duration: { type: "number" },
          exercises: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                muscle_group: { type: "string" },
                target_sets: { type: "number" },
                target_reps: { type: "number" }
              }
            }
          }
        }
      }
    });

    setDraft({
      name: result.name || 'Titan Built Workout',
      category: result.category || 'custom',
      estimated_duration: result.estimated_duration || 60,
      exercises: (result.exercises || []).map(normalizeExercise),
    });
    setLoading(false);
  };

  const updateDraft = (field, value) => setDraft(prev => ({ ...prev, [field]: value }));
  const updateDraftExercise = (i, field, value) => {
    setDraft(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex),
    }));
  };
  const addDraftExercise = (exercise = EMPTY_EXERCISE) => {
    setDraft(prev => ({ ...prev, exercises: [...prev.exercises, normalizeExercise(exercise)] }));
  };
  const removeDraftExercise = (i) => {
    setDraft(prev => ({ ...prev, exercises: prev.exercises.filter((_, idx) => idx !== i) }));
  };
  const moveDraftExercise = (i, dir) => {
    setDraft(prev => {
      const nextIndex = i + dir;
      if (nextIndex < 0 || nextIndex >= prev.exercises.length) return prev;
      const next = [...prev.exercises];
      const [moved] = next.splice(i, 1);
      next.splice(nextIndex, 0, moved);
      return { ...prev, exercises: next };
    });
  };

  const canSaveDraft = draft?.name?.trim() && draft?.exercises?.some(e => e.name?.trim());

  const handleSaveDraft = async () => {
    if (!canSaveDraft) return;
    setSaving(true);
    const saved = await createTodayWorkout(base44, todayStr, {
      name: draft.name.trim(),
      category: draft.category || 'custom',
      estimated_duration: parseInt(draft.estimated_duration) || 60,
      exercises: draft.exercises.filter(e => e.name.trim()).map(normalizeExercise),
    });
    if (saved?.id) queryClient.setQueryData(['today-workout', todayStr], [saved]);
    queryClient.invalidateQueries({ queryKey: ['today-workout', todayStr] });
    queryClient.invalidateQueries({ queryKey: ['today-workout'] });
    queryClient.invalidateQueries({ queryKey: ['workouts'] });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="border-0 max-w-sm mx-4 max-h-[85vh] overflow-y-auto"
        style={{ background: 'rgba(10,14,24,0.98)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102,217,255,0.2)', boxShadow: '0 0 60px rgba(0,109,255,0.2)' }}
      >
        <DialogHeader>
          <DialogTitle className="font-black text-lg" style={{ background: 'linear-gradient(135deg,#fff 0%,#66D9FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Build With Titan
          </DialogTitle>
        </DialogHeader>
        {!draft ? (
          <>
            <p className="text-sm text-muted-foreground">
              Tell Titan what you want, or leave blank and Titan will pick based on your profile.
            </p>
            <Textarea
              placeholder='e.g. "Chest and traps, ~60 min" or leave blank for Titan to decide...'
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="border-0 text-foreground placeholder:text-muted-foreground/50 resize-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(102,217,255,0.15)', minHeight: '80px' }}
            />
            <button
              onClick={handleBuild}
              disabled={loading}
              className="w-full h-12 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', color: '#030508', border: 'none', boxShadow: '0 0 20px rgba(102,217,255,0.25)' }}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Titan is building...</> : <><Sparkles className="w-4 h-4" /> Generate My Workout</>}
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review Titan's plan, make any edits, then save it as today's workout.
            </p>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Workout Name</p>
              <input
                value={draft.name}
                onChange={e => updateDraft('name', e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm text-foreground outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(102,217,255,0.15)' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Category</p>
                <select
                  value={draft.category}
                  onChange={e => updateDraft('category', e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(102,217,255,0.15)' }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#0a0e18' }}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Est. Duration</p>
                <input
                  type="number"
                  value={draft.estimated_duration}
                  onChange={e => updateDraft('estimated_duration', e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(102,217,255,0.15)' }}
                />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Exercises</p>
              <div className="space-y-2">
                {draft.exercises.map((ex, i) => (
                  <div key={i} className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                      <input
                        value={ex.name}
                        onChange={e => updateDraftExercise(i, 'name', e.target.value)}
                        placeholder="Exercise name"
                        className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(102,217,255,0.12)' }}
                      />
                      <button onClick={() => moveDraftExercise(i, -1)} disabled={i === 0} className="disabled:opacity-25 text-muted-foreground hover:text-foreground">
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => moveDraftExercise(i, 1)} disabled={i === draft.exercises.length - 1} className="disabled:opacity-25 text-muted-foreground hover:text-foreground">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeDraftExercise(i)} className="text-muted-foreground/40 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input value={ex.muscle_group} onChange={e => updateDraftExercise(i, 'muscle_group', e.target.value)} placeholder="Muscle" className="rounded-lg px-2 py-2 text-xs text-foreground outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(102,217,255,0.12)' }} />
                      <input type="number" value={ex.target_sets} onChange={e => updateDraftExercise(i, 'target_sets', parseInt(e.target.value) || 3)} placeholder="Sets" className="rounded-lg px-2 py-2 text-xs text-foreground outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(102,217,255,0.12)' }} />
                      <input type="number" value={ex.target_reps} onChange={e => updateDraftExercise(i, 'target_reps', parseInt(e.target.value) || 10)} placeholder="Reps" className="rounded-lg px-2 py-2 text-xs text-foreground outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(102,217,255,0.12)' }} />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addDraftExercise()}
                className="mt-2 w-full h-9 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                style={{ background: 'rgba(102,217,255,0.06)', border: '1px solid rgba(102,217,255,0.18)', color: '#66D9FF' }}
              >
                <Plus className="w-3.5 h-3.5" /> Add Custom Exercise
              </button>
            </div>
            <button
              onClick={handleSaveDraft}
              disabled={!canSaveDraft || saving}
              className="w-full h-12 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', color: '#030508', border: 'none', boxShadow: '0 0 20px rgba(102,217,255,0.25)' }}
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save as Today\'s Workout'}
            </button>
            <button
              onClick={() => setDraft(null)}
              className="w-full h-10 rounded-xl font-semibold text-xs uppercase tracking-widest"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}
            >
              Change Prompt
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Manual Build Dialog ────────────────────────────────────────────────────────
function ManualBuildDialog({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [category, setCategory] = useState('custom');
  const [duration, setDuration] = useState('60');
  const [exercises, setExercises] = useState([{ ...EMPTY_EXERCISE }]);
  const [saving, setSaving] = useState(false);

  const addExercise = () => setExercises(prev => [...prev, { ...EMPTY_EXERCISE }]);
  const addLibraryExercise = (exercise) => setExercises(prev => [...prev, normalizeExercise(exercise)]);
  const removeExercise = (i) => setExercises(prev => prev.filter((_, idx) => idx !== i));
  const updateExercise = (i, field, value) => setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex));
  const moveExercise = (i, dir) => {
    setExercises(prev => {
      const nextIndex = i + dir;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(i, 1);
      next.splice(nextIndex, 0, moved);
      return next;
    });
  };

  const handleSave = async () => {
    const validExercises = exercises.filter(e => e.name.trim());
    if (!name.trim() || validExercises.length === 0) return;
    setSaving(true);
    const saved = await createTodayWorkout(base44, todayStr, {
      name: name.trim(),
      category,
      estimated_duration: parseInt(duration) || 60,
      exercises: validExercises.map(normalizeExercise),
    });
    if (saved?.id) queryClient.setQueryData(['today-workout', todayStr], [saved]);
    queryClient.invalidateQueries({ queryKey: ['today-workout', todayStr] });
    queryClient.invalidateQueries({ queryKey: ['today-workout'] });
    queryClient.invalidateQueries({ queryKey: ['workouts'] });
    setSaving(false);
    onOpenChange(false);
    // Reset
    setName(''); setCategory('custom'); setDuration('60');
    setExercises([{ ...EMPTY_EXERCISE }]);
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(102,217,255,0.15)',
    borderRadius: 10,
    color: 'white',
    padding: '8px 12px',
    outline: 'none',
    width: '100%',
    fontSize: 13,
  };
  const canSave = name.trim() && exercises.some(e => e.name.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-0 max-w-sm mx-4 max-h-[85vh] overflow-y-auto"
        style={{ background: 'rgba(10,14,24,0.98)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102,217,255,0.2)', boxShadow: '0 0 60px rgba(0,109,255,0.2)' }}
      >
        <DialogHeader>
          <DialogTitle className="font-black text-lg" style={{ background: 'linear-gradient(135deg,#fff 0%,#66D9FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Plan My Workout
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Workout name */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Workout Name</p>
            <input
              style={inputStyle}
              placeholder='e.g. Chest Day, Leg Day, Back & Biceps...'
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* Category + Duration row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Category</p>
              <select
                style={{ ...inputStyle, appearance: 'none' }}
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c} style={{ background: '#0a0e18' }}>
                    {c.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Est. Duration</p>
              <input
                style={inputStyle}
                type="number"
                placeholder="60"
                value={duration}
                onChange={e => setDuration(e.target.value)}
              />
            </div>
          </div>

          {/* Exercise library */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Library className="w-3.5 h-3.5" style={{ color: '#66D9FF' }} />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Select Exercises</p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
              {EXERCISE_LIBRARY.map(ex => (
                <button
                  key={`${ex.name}-${ex.muscle_group}`}
                  onClick={() => addLibraryExercise(ex)}
                  className="rounded-xl px-3 py-2 text-left"
                  style={{ background: 'rgba(102,217,255,0.05)', border: '1px solid rgba(102,217,255,0.13)' }}
                >
                  <p className="text-xs font-bold text-foreground leading-tight">{ex.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{ex.muscle_group}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Exercises */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Exercises</p>
            <div className="space-y-2">
              {exercises.map((ex, i) => (
                <div key={i} className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="Exercise name"
                      value={ex.name}
                      onChange={e => updateExercise(i, 'name', e.target.value)}
                    />
                    <button onClick={() => moveExercise(i, -1)} disabled={i === 0} className="text-muted-foreground/50 hover:text-foreground disabled:opacity-20 transition-colors flex-shrink-0">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveExercise(i, 1)} disabled={i === exercises.length - 1} className="text-muted-foreground/50 hover:text-foreground disabled:opacity-20 transition-colors flex-shrink-0">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeExercise(i)} className="text-muted-foreground/40 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      style={{ ...inputStyle, fontSize: 11 }}
                      placeholder="Muscle"
                      value={ex.muscle_group}
                      onChange={e => updateExercise(i, 'muscle_group', e.target.value)}
                    />
                    <input
                      style={{ ...inputStyle, fontSize: 11 }}
                      type="number"
                      placeholder="Sets"
                      value={ex.target_sets}
                      onChange={e => updateExercise(i, 'target_sets', parseInt(e.target.value) || 3)}
                    />
                    <input
                      style={{ ...inputStyle, fontSize: 11 }}
                      type="number"
                      placeholder="Reps"
                      value={ex.target_reps}
                      onChange={e => updateExercise(i, 'target_reps', parseInt(e.target.value) || 10)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addExercise}
              className="mt-2 w-full h-9 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
              style={{ background: 'rgba(102,217,255,0.06)', border: '1px solid rgba(102,217,255,0.18)', color: '#66D9FF' }}
            >
              <Plus className="w-3.5 h-3.5" /> Add Exercise
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="w-full h-12 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', color: '#030508', border: 'none', boxShadow: '0 0 20px rgba(102,217,255,0.25)' }}
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Workout'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── No Workout Planned ────────────────────────────────────────────────────────
function PrePlanCard({ onManualClick, onTitanClick }) {
  return (
    <motion.div
      key="preplan"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="rounded-3xl p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(10,14,26,0.97) 0%, rgba(0,20,50,0.95) 100%)',
        border: '1px solid rgba(102,217,255,0.25)',
        boxShadow: '0 0 60px rgba(0,109,255,0.14), 0 0 20px rgba(102,217,255,0.08), inset 0 1px 0 rgba(102,217,255,0.14)',
      }}
    >
      <div className="absolute top-0 right-0 w-52 h-52 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.1) 0%, transparent 65%)', transform: 'translate(30%,-30%)' }} />
      <div className="absolute bottom-0 left-0 w-36 h-36 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,109,255,0.08) 0%, transparent 70%)', transform: 'translate(-20%,20%)' }} />

      {/* Icon + label */}
      <div className="flex items-center gap-2.5 mb-4 relative z-10">
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(102,217,255,0.1)', border: '1px solid rgba(102,217,255,0.25)' }}>
          <Dumbbell className="w-4 h-4" style={{ color: '#66D9FF' }} />
        </div>
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Today's Session</span>
      </div>

      <h2 className="text-2xl font-black tracking-tight leading-tight mb-1 relative z-10"
        style={{ background: 'linear-gradient(135deg, #ffffff 0%, #a8ecff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
        Plan Today's Workout
      </h2>
      <p className="text-sm text-muted-foreground mb-5 relative z-10">
        Choose how you want to train today. Titan can help build the session, or you can create it your way.
      </p>

      <div className="space-y-2.5 relative z-10">
        {/* Pre-Plan (manual) */}
        <button
          onClick={onManualClick}
          className="w-full rounded-2xl px-4 py-4 flex items-center gap-3 text-left"
          style={{
            background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
            color: '#030508', border: 'none',
            boxShadow: '0 0 28px rgba(102,217,255,0.35), 0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <Plus className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm">Pre-Plan My Workout</p>
            <p className="text-[11px] opacity-70 mt-0.5">Build your own session — title, exercises, sets & reps</p>
          </div>
          <ChevronRight className="w-4 h-4 opacity-60" />
        </button>

        {/* Build With Titan */}
        <button
          onClick={onTitanClick}
          className="w-full rounded-2xl px-4 py-4 flex items-center gap-3 text-left"
          style={{
            background: 'rgba(102,217,255,0.07)',
            border: '1px solid rgba(102,217,255,0.25)',
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(102,217,255,0.12)', border: '1px solid rgba(102,217,255,0.25)' }}>
            <Sparkles className="w-5 h-5" style={{ color: '#66D9FF' }} />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm text-foreground">Build With Titan</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">AI builds today's plan based on your profile & goals</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Freestyle */}
        <Link to="/active-workout/free" className="block">
          <button
            className="w-full rounded-2xl px-4 py-4 flex items-center gap-3 text-left"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Zap className="w-5 h-5" style={{ color: 'rgba(102,217,255,0.6)' }} />
            </div>
            <div className="flex-1">
              <p className="font-black text-sm text-foreground">Freestyle Workout</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Start lifting now — Titan tracks your session live</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

// ── Workout Is Planned ────────────────────────────────────────────────────────
function PlannedCard({ workout, onEdit }) {
  return (
    <motion.div
      key="planned"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="rounded-3xl p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(10,14,26,0.97) 0%, rgba(0,25,55,0.95) 100%)',
        border: '1px solid rgba(102,217,255,0.28)',
        boxShadow: '0 0 70px rgba(0,109,255,0.14), 0 0 24px rgba(102,217,255,0.1), inset 0 1px 0 rgba(102,217,255,0.14)',
      }}
    >
      <div className="absolute top-0 right-0 w-52 h-52 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.1) 0%, transparent 65%)', transform: 'translate(25%,-25%)' }} />
      <div className="absolute bottom-0 left-0 w-36 h-36 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,109,255,0.09) 0%, transparent 70%)', transform: 'translate(-20%,20%)' }} />

      {/* Label row */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(102,217,255,0.12)', border: '1px solid rgba(102,217,255,0.28)' }}>
            <Dumbbell className="w-4 h-4" style={{ color: '#66D9FF' }} />
          </div>
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Today's Workout</span>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80' }}>
          Planned ✓
        </div>
      </div>

      {/* Name */}
      <p className="text-3xl font-black tracking-tight leading-tight mb-2 relative z-10"
        style={{ background: 'linear-gradient(135deg, #ffffff 0%, #a8ecff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
        {workout.name}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-5 relative z-10 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>~{workout.estimated_duration || 60} min</span>
        </div>
        <div className="w-px h-3 bg-border" />
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Zap className="w-3.5 h-3.5" style={{ color: '#66D9FF' }} />
          <span>{workout.exercises?.length || 0} exercises</span>
        </div>
        {workout.category && (
          <>
            <div className="w-px h-3 bg-border" />
            <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ color: '#66D9FF', background: 'rgba(102,217,255,0.1)', border: '1px solid rgba(102,217,255,0.22)' }}>
              {workout.category.replace('_', ' ')}
            </span>
          </>
        )}
      </div>

      {/* Exercise pills */}
      {workout.exercises?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5 relative z-10">
          {workout.exercises.slice(0, 4).map((ex, i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
              {ex.name}
            </span>
          ))}
          {workout.exercises.length > 4 && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'rgba(102,217,255,0.06)', border: '1px solid rgba(102,217,255,0.15)', color: 'rgba(102,217,255,0.7)' }}>
              +{workout.exercises.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* CTAs */}
      <div className="space-y-2 relative z-10">
        <Link to={`/active-workout/${workout.id}`} className="block">
          <button
            className="w-full h-14 rounded-2xl font-black text-base uppercase tracking-widest flex items-center justify-center gap-2.5"
            style={{
              background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
              color: '#030508', border: 'none',
              boxShadow: '0 0 36px rgba(102,217,255,0.42), 0 0 70px rgba(0,109,255,0.22), 0 4px 20px rgba(0,0,0,0.4)',
              letterSpacing: '0.15em',
            }}
          >
            <Zap className="w-5 h-5" />
            Start Session
          </button>
        </Link>
        <button
          onClick={onEdit}
          className="w-full h-10 rounded-xl font-semibold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
        >
          <Pencil className="w-3.5 h-3.5" /> Edit Workout
        </button>
      </div>
    </motion.div>
  );
}

// ── Edit Dialog (reuse ManualBuildDialog pre-filled) ──────────────────────────
function EditWorkoutDialog({ open, onOpenChange, workout }) {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split('T')[0];
  const [name, setName] = useState(workout?.name || '');
  const [category, setCategory] = useState(workout?.category || 'custom');
  const [duration, setDuration] = useState(String(workout?.estimated_duration || 60));
  const [exercises, setExercises] = useState((workout?.exercises || []).map(normalizeExercise));
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (workout) {
      setName(workout.name || '');
      setCategory(workout.category || 'custom');
      setDuration(String(workout.estimated_duration || 60));
      setExercises((workout.exercises || []).map(normalizeExercise));
    }
  }, [workout]);

  const addExercise = () => setExercises(prev => [...prev, { ...EMPTY_EXERCISE }]);
  const addLibraryExercise = (exercise) => setExercises(prev => [...prev, normalizeExercise(exercise)]);
  const removeExercise = (i) => setExercises(prev => prev.filter((_, idx) => idx !== i));
  const updateExercise = (i, field, value) => setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex));
  const moveExercise = (i, dir) => {
    setExercises(prev => {
      const nextIndex = i + dir;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(i, 1);
      next.splice(nextIndex, 0, moved);
      return next;
    });
  };

  const handleSave = async () => {
    const validExercises = exercises.filter(e => e.name.trim());
    if (!name.trim() || !workout || validExercises.length === 0) return;
    setSaving(true);
    await base44.entities.Workout.update(workout.id, {
      name: name.trim(),
      category,
      estimated_duration: parseInt(duration) || 60,
      exercises: validExercises.map(normalizeExercise),
    });
    queryClient.invalidateQueries({ queryKey: ['today-workout', todayStr] });
    queryClient.invalidateQueries({ queryKey: ['today-workout'] });
    queryClient.invalidateQueries({ queryKey: ['workouts'] });
    setSaving(false);
    onOpenChange(false);
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(102,217,255,0.15)',
    borderRadius: 10,
    color: 'white',
    padding: '8px 12px',
    outline: 'none',
    width: '100%',
    fontSize: 13,
  };
  const canSave = name.trim() && exercises.some(e => e.name.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-0 max-w-sm mx-4 max-h-[85vh] overflow-y-auto"
        style={{ background: 'rgba(10,14,24,0.98)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102,217,255,0.2)', boxShadow: '0 0 60px rgba(0,109,255,0.2)' }}
      >
        <DialogHeader>
          <DialogTitle className="font-black text-lg" style={{ background: 'linear-gradient(135deg,#fff 0%,#66D9FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Edit Workout
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Workout Name</p>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Category</p>
              <select style={{ ...inputStyle, appearance: 'none' }} value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#0a0e18' }}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Est. Duration</p>
              <input style={inputStyle} type="number" value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Library className="w-3.5 h-3.5" style={{ color: '#66D9FF' }} />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Add From Library</p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto pr-1 mb-4">
              {EXERCISE_LIBRARY.map(ex => (
                <button
                  key={`${ex.name}-${ex.muscle_group}`}
                  onClick={() => addLibraryExercise(ex)}
                  className="rounded-xl px-3 py-2 text-left"
                  style={{ background: 'rgba(102,217,255,0.05)', border: '1px solid rgba(102,217,255,0.13)' }}
                >
                  <p className="text-xs font-bold text-foreground leading-tight">{ex.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{ex.muscle_group}</p>
                </button>
              ))}
            </div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Exercises</p>
            <div className="space-y-2">
              {exercises.map((ex, i) => (
                <div key={i} className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                    <input style={{ ...inputStyle, flex: 1 }} placeholder="Exercise name" value={ex.name} onChange={e => updateExercise(i, 'name', e.target.value)} />
                    <button onClick={() => moveExercise(i, -1)} disabled={i === 0} className="text-muted-foreground/50 hover:text-foreground disabled:opacity-20 transition-colors flex-shrink-0">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveExercise(i, 1)} disabled={i === exercises.length - 1} className="text-muted-foreground/50 hover:text-foreground disabled:opacity-20 transition-colors flex-shrink-0">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeExercise(i)} className="text-muted-foreground/40 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input style={{ ...inputStyle, fontSize: 11 }} placeholder="Muscle" value={ex.muscle_group} onChange={e => updateExercise(i, 'muscle_group', e.target.value)} />
                    <input style={{ ...inputStyle, fontSize: 11 }} type="number" placeholder="Sets" value={ex.target_sets} onChange={e => updateExercise(i, 'target_sets', parseInt(e.target.value) || 3)} />
                    <input style={{ ...inputStyle, fontSize: 11 }} type="number" placeholder="Reps" value={ex.target_reps} onChange={e => updateExercise(i, 'target_reps', parseInt(e.target.value) || 10)} />
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addExercise}
              className="mt-2 w-full h-9 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
              style={{ background: 'rgba(102,217,255,0.06)', border: '1px solid rgba(102,217,255,0.18)', color: '#66D9FF' }}
            >
              <Plus className="w-3.5 h-3.5" /> Add Exercise
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="w-full h-12 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', color: '#030508', border: 'none' }}
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function WorkoutPlanCard({ workout, user }) {
  const [showManual, setShowManual] = useState(false);
  const [showTitan, setShowTitan] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <AnimatePresence mode="wait">
        {!workout
          ? <PrePlanCard key="preplan" onManualClick={() => setShowManual(true)} onTitanClick={() => setShowTitan(true)} />
          : <PlannedCard key="planned" workout={workout} onEdit={() => setShowEdit(true)} />
        }
      </AnimatePresence>

      <ManualBuildDialog open={showManual} onOpenChange={setShowManual} />
      <TitanBuildDialog open={showTitan} onOpenChange={setShowTitan} user={user} />
      {workout && <EditWorkoutDialog open={showEdit} onOpenChange={setShowEdit} workout={workout} />}
    </>
  );
}
