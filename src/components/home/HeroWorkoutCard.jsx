import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Clock, Zap, ChevronRight, Sparkles, Plus, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';

function AiWorkoutDialog({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuild = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    const todayDay = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a fitness workout builder. Create a gym workout based on this request: "${prompt}". Return a JSON object with: name (string), category (one of: push, pull, legs, chest, back, arms, shoulders, glutes, upper_body, lower_body, full_body, custom), estimated_duration (number in minutes), exercises (array of objects with: name, muscle_group, target_sets, target_reps). Include 5-8 exercises.`,
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          category: { type: "string" },
          estimated_duration: { type: "number" },
          exercises: { type: "array", items: { type: "object", properties: { name: { type: "string" }, muscle_group: { type: "string" }, target_sets: { type: "number" }, target_reps: { type: "number" } } } }
        }
      }
    });
    await base44.entities.Workout.create({ ...result, is_template: true, scheduled_day: todayDay });
    queryClient.invalidateQueries({ queryKey: ['workouts'] });
    setLoading(false);
    setPrompt('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-0 max-w-sm mx-4"
        style={{ background: 'rgba(10,14,24,0.98)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102,217,255,0.2)', boxShadow: '0 0 60px rgba(0,109,255,0.2)' }}
      >
        <DialogHeader>
          <DialogTitle className="font-black text-lg" style={{ background: 'linear-gradient(135deg,#fff 0%,#66D9FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            AI Workout Builder
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Describe what you want and AI will build a full workout for today.</p>
        <Textarea
          placeholder="e.g. Chest and traps hypertrophy, ~60 min..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          className="border-0 text-foreground placeholder:text-muted-foreground/50 resize-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(102,217,255,0.15)', minHeight: '90px' }}
        />
        <button
          onClick={handleBuild}
          disabled={loading || !prompt.trim()}
          className="w-full h-12 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', color: '#030508', border: 'none', boxShadow: '0 0 20px rgba(102,217,255,0.25)' }}
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Building...</> : <><Sparkles className="w-4 h-4" /> Generate Workout</>}
        </button>
      </DialogContent>
    </Dialog>
  );
}

export default function HeroWorkoutCard({ workout }) {
  const [showAi, setShowAi] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {!workout ? (
        <motion.div
          key="plan"
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
          {/* Ambient glows */}
          <div className="absolute top-0 right-0 w-52 h-52 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.1) 0%, transparent 65%)', transform: 'translate(30%,-30%)' }} />
          <div className="absolute bottom-0 left-0 w-36 h-36 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(0,109,255,0.08) 0%, transparent 70%)', transform: 'translate(-20%,20%)' }} />

          {/* Icon + label */}
          <div className="flex items-center gap-2.5 mb-5 relative z-10">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(102,217,255,0.1)', border: '1px solid rgba(102,217,255,0.25)' }}>
              <Dumbbell className="w-4.5 h-4.5" style={{ color: '#66D9FF' }} />
            </div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Today's Session</span>
          </div>

          {/* Headline */}
          <h2
            className="text-2xl font-black tracking-tight leading-tight mb-1.5 relative z-10"
            style={{ background: 'linear-gradient(135deg, #ffffff 0%, #a8ecff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          >
            Plan Today's Workout
          </h2>
          <p className="text-sm text-muted-foreground mb-6 relative z-10">
            No session scheduled yet. Let AI build one or design your own.
          </p>

          {/* Two big action buttons */}
          <div className="space-y-3 relative z-10">
            <button
              onClick={() => setShowAi(true)}
              className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2.5"
              style={{
                background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
                color: '#030508',
                border: 'none',
                boxShadow: '0 0 32px rgba(102,217,255,0.4), 0 0 64px rgba(0,109,255,0.2), 0 4px 20px rgba(0,0,0,0.35)',
                letterSpacing: '0.1em',
              }}
            >
              <Sparkles className="w-5 h-5" />
              Get AI Recommendation
            </button>

            <Link to="/workout/create" className="block">
              <button
                className="w-full h-13 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2.5"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.75)',
                  border: '1px solid rgba(102,217,255,0.18)',
                  letterSpacing: '0.1em',
                }}
              >
                <Plus className="w-4.5 h-4.5" />
                Build Custom Workout
              </button>
            </Link>
          </div>

          <AiWorkoutDialog open={showAi} onOpenChange={setShowAi} />
        </motion.div>
      ) : (
        <motion.div
          key="session"
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
          {/* Ambient glows */}
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
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Today's Session</span>
            </div>
            <Link to="/workout">
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          {/* Workout name */}
          <p
            className="text-3xl font-black tracking-tight leading-tight mb-2 relative z-10"
            style={{ background: 'linear-gradient(135deg, #ffffff 0%, #a8ecff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          >
            {workout.name}
          </p>

          {/* Meta stats */}
          <div className="flex items-center gap-3 mb-5 relative z-10">
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
            <div className="flex flex-wrap gap-2 mb-6 relative z-10">
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

          {/* START SESSION CTA */}
          <Link to={`/active-workout/${workout.id}`} className="relative z-10 block">
            <button
              className="w-full h-14 rounded-2xl font-black text-base uppercase tracking-widest flex items-center justify-center gap-2.5"
              style={{
                background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
                color: '#030508',
                border: 'none',
                boxShadow: '0 0 36px rgba(102,217,255,0.42), 0 0 70px rgba(0,109,255,0.22), 0 4px 20px rgba(0,0,0,0.4)',
                letterSpacing: '0.15em',
              }}
            >
              <Zap className="w-5 h-5" />
              Start Session
            </button>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
