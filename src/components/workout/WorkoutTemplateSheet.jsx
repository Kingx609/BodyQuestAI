import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { createTodayWorkout } from '@/lib/today-workout';
import {
  X, Clock, Zap, Sparkles, Loader2, Pencil, Play,
  Plus, Trash2, GripVertical, ChevronUp, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_OPTIONS = [
  'push', 'pull', 'legs', 'chest', 'back', 'arms',
  'shoulders', 'glutes', 'upper_body', 'lower_body', 'full_body', 'custom',
];

const EMPTY_EXERCISE = { name: '', muscle_group: '', target_sets: 3, target_reps: 10 };

const repsLabel = (exercise) => {
  if (exercise?.target_reps_label) return exercise.target_reps_label;
  const map = { 7: '6-8', 8: '8', 9: '8-10', 10: '10', 11: '10-12', 12: '12', 13: '12-15', 15: '15' };
  return map[exercise?.target_reps] || exercise?.target_reps || 10;
};

const setsLabel = (exercise) => exercise?.target_sets_label || exercise?.target_sets || 3;

const normalizeExercise = (exercise) => ({
  name: exercise?.name?.trim() || '',
  muscle_group: exercise?.muscle_group?.trim() || 'custom',
  target_sets: Math.max(1, parseInt(exercise?.target_sets, 10) || 3),
  target_reps: Math.max(1, parseInt(exercise?.target_reps, 10) || 10),
});

const draftFromTemplate = (template) => ({
  name: template?.name || '',
  category: template?.category || 'custom',
  focus: template?.focus || '',
  estimated_duration: String(template?.estimated_duration || 60),
  exercises: (template?.exercises || []).map(normalizeExercise),
});

export default function WorkoutTemplateSheet({ template, onClose }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(draftFromTemplate(template));

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setDraft(draftFromTemplate(template));
    setEditing(false);
    setSaving(false);
  }, [template]);

  if (!template) return null;

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

  const updateDraft = (field, value) => setDraft(prev => ({ ...prev, [field]: value }));
  const updateExercise = (index, field, value) => {
    setDraft(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => i === index ? { ...exercise, [field]: value } : exercise),
    }));
  };
  const addExercise = () => setDraft(prev => ({ ...prev, exercises: [...prev.exercises, { ...EMPTY_EXERCISE }] }));
  const removeExercise = (index) => setDraft(prev => ({ ...prev, exercises: prev.exercises.filter((_, i) => i !== index) }));
  const moveExercise = (index, direction) => {
    setDraft(prev => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.exercises.length) return prev;
      const next = [...prev.exercises];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      return { ...prev, exercises: next };
    });
  };

  const saveAsToday = async (workoutDraft) => {
    const validExercises = (workoutDraft.exercises || [])
      .map(normalizeExercise)
      .filter(exercise => exercise.name);

    if (!workoutDraft.name?.trim() || validExercises.length === 0) return;

    setSaving(true);
    let shouldClose = false;
    try {
      const plannedWorkout = {
        name: workoutDraft.name.trim(),
        category: workoutDraft.category || 'custom',
        estimated_duration: parseInt(workoutDraft.estimated_duration, 10) || 60,
        exercises: validExercises,
        is_template: false,
        planned_date: todayStr,
      };

      const saved = await createTodayWorkout(base44, todayStr, plannedWorkout);

      if (saved?.id) {
        queryClient.setQueryData(['today-workout', todayStr], [saved]);
      }
      queryClient.invalidateQueries({ queryKey: ['today-workout', todayStr] });
      queryClient.invalidateQueries({ queryKey: ['today-workout'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });

      shouldClose = true;
    } finally {
      setSaving(false);
      if (shouldClose) onClose();
    }
  };

  const previewExercises = template.exercises || [];
  const canSaveDraft = draft.name.trim() && draft.exercises.some(exercise => exercise.name.trim());

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 9999, isolation: 'isolate' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-lg rounded-t-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(8,12,22,0.99) 0%, rgba(3,5,8,1) 100%)',
            border: '1px solid rgba(102,217,255,0.2)',
            borderBottom: 'none',
            boxShadow: '0 -20px 60px rgba(0,109,255,0.2), 0 -4px 20px rgba(102,217,255,0.1)',
            maxHeight: '88vh',
          }}
          onClick={event => event.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(102,217,255,0.25)' }} />
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 'calc(88vh - 24px)' }}>
            <div className="px-5 pt-3 pb-28">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1">
                    {editing ? 'Customize Template' : template.focus}
                  </p>
                  <h2
                    className="text-xl font-black tracking-tight leading-tight"
                    style={{ background: 'linear-gradient(135deg, #ffffff 0%, #a8ecff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                  >
                    {editing ? 'Customize Before Saving' : template.name}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="ml-3 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {!editing ? (
                <>
                  <div className="flex items-center gap-2.5 mb-5 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>~{template.estimated_duration} min</span>
                    </div>
                    <div className="w-px h-3 bg-border" />
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Zap className="w-3.5 h-3.5" style={{ color: '#66D9FF' }} />
                      <span>{previewExercises.length} exercises</span>
                    </div>
                    <div className="w-px h-3 bg-border" />
                    <span className="text-xs text-muted-foreground capitalize">{template.category?.replace('_', ' ')}</span>
                  </div>

                  {template.titan_note && (
                    <div
                      className="rounded-2xl px-4 py-3 mb-5 flex items-start gap-3"
                      style={{ background: 'rgba(102,217,255,0.05)', border: '1px solid rgba(102,217,255,0.14)' }}
                    >
                      <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#66D9FF' }} />
                      <p className="text-xs text-muted-foreground leading-relaxed">{template.titan_note}</p>
                    </div>
                  )}

                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Exercises</p>
                  <div className="space-y-2 mb-6">
                    {previewExercises.map((exercise, index) => (
                      <div
                        key={`${exercise.name}-${index}`}
                        className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
                            style={{ background: 'rgba(102,217,255,0.1)', color: '#66D9FF' }}
                          >
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-tight">{exercise.name}</p>
                            <p className="text-[11px] text-muted-foreground capitalize">{exercise.muscle_group}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-foreground">{setsLabel(exercise)} x {repsLabel(exercise)}</p>
                          <p className="text-[10px] text-muted-foreground">sets x reps</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2.5">
                    <button
                      onClick={() => saveAsToday({
                        name: template.name,
                        category: template.category,
                        estimated_duration: template.estimated_duration,
                        exercises: template.exercises,
                      })}
                      disabled={saving}
                      className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
                        color: '#030508',
                        boxShadow: '0 0 30px rgba(102,217,255,0.35), 0 4px 20px rgba(0,0,0,0.4)',
                      }}
                    >
                      {saving
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        : <><Play className="w-4 h-4" /> Use This Workout Today</>
                      }
                    </button>
                    <button
                      onClick={() => setEditing(true)}
                      className="w-full h-11 rounded-xl font-semibold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Customize Before Saving
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Workout Name</p>
                    <input style={inputStyle} value={draft.name} onChange={event => updateDraft('name', event.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Category</p>
                      <select
                        style={{ ...inputStyle, appearance: 'none' }}
                        value={draft.category}
                        onChange={event => updateDraft('category', event.target.value)}
                      >
                        {CATEGORY_OPTIONS.map(category => (
                          <option key={category} value={category} style={{ background: '#0a0e18' }}>
                            {category.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Est. Duration</p>
                      <input style={inputStyle} type="number" value={draft.estimated_duration} onChange={event => updateDraft('estimated_duration', event.target.value)} />
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Exercises</p>
                    <div className="space-y-2">
                      {draft.exercises.map((exercise, index) => (
                        <div
                          key={`${exercise.name}-${index}`}
                          className="rounded-xl p-3 space-y-2"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                            <input
                              style={{ ...inputStyle, flex: 1 }}
                              placeholder="Exercise name"
                              value={exercise.name}
                              onChange={event => updateExercise(index, 'name', event.target.value)}
                            />
                            <button onClick={() => moveExercise(index, -1)} disabled={index === 0} className="text-muted-foreground/50 hover:text-foreground disabled:opacity-20 transition-colors flex-shrink-0">
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button onClick={() => moveExercise(index, 1)} disabled={index === draft.exercises.length - 1} className="text-muted-foreground/50 hover:text-foreground disabled:opacity-20 transition-colors flex-shrink-0">
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button onClick={() => removeExercise(index)} className="text-muted-foreground/40 hover:text-red-400 transition-colors flex-shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <input style={{ ...inputStyle, fontSize: 11 }} placeholder="Muscle" value={exercise.muscle_group} onChange={event => updateExercise(index, 'muscle_group', event.target.value)} />
                            <input style={{ ...inputStyle, fontSize: 11 }} type="number" placeholder="Sets" value={exercise.target_sets} onChange={event => updateExercise(index, 'target_sets', parseInt(event.target.value, 10) || 3)} />
                            <input style={{ ...inputStyle, fontSize: 11 }} type="number" placeholder="Reps" value={exercise.target_reps} onChange={event => updateExercise(index, 'target_reps', parseInt(event.target.value, 10) || 10)} />
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

                  <div className="space-y-2.5">
                    <button
                      onClick={() => saveAsToday(draft)}
                      disabled={!canSaveDraft || saving}
                      className="w-full h-13 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', color: '#030508', border: 'none', boxShadow: '0 0 24px rgba(102,217,255,0.28)' }}
                    >
                      {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Customized Workout Today'}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="w-full h-10 rounded-xl font-semibold text-xs uppercase tracking-widest"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}
                    >
                      Back to Preview
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
