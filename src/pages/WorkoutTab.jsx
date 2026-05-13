import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Plus, Clock, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import WorkoutPlanCard from '@/components/home/WorkoutPlanCard';
import WorkoutTemplateSheet from '@/components/workout/WorkoutTemplateSheet';
import { WORKOUT_TEMPLATES, BROWSE_CATEGORIES } from '@/components/workout/WorkoutTemplates';
import { fetchTodayWorkout } from '@/lib/today-workout';

export default function WorkoutTab() {
  const queryClient = useQueryClient();
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [browseCategory, setBrowseCategory] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [user, setUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: todayWorkouts, isSuccess: todayLoaded } = useQuery({
    queryKey: ['today-workout', todayStr],
    queryFn: () => fetchTodayWorkout(base44, todayStr),
    initialData: [],
    staleTime: 0,
  });

  // Only set todayWorkout once the query has confirmed its result — never guess from cache
  const todayWorkout = todayLoaded ? (todayWorkouts?.[0] || null) : undefined;



  const handleAiBuild = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a fitness workout builder. Create a gym workout based on this request: "${aiPrompt}". Return a JSON object with: name (string), category (one of: push, pull, legs, chest, back, arms, shoulders, glutes, upper_body, lower_body, full_body, custom), estimated_duration (number in minutes), exercises (array of objects with: name, muscle_group, target_sets, target_reps). Make it practical for a real gym. Include 5-8 exercises.`,
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
    await base44.entities.Workout.create({ ...result, is_template: true });
    queryClient.invalidateQueries({ queryKey: ['workouts'] });
    setShowAi(false);
    setAiPrompt('');
    setAiLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto pb-10">

      {/* ── Hero: Today's Workout (shared state with Home) ── */}
      <div className="px-4 pt-8 pb-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1">Training Command</p>
        <h1
          className="text-3xl font-black tracking-tight mb-5"
          style={{ background: 'linear-gradient(135deg, #ffffff 0%, #66D9FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
        >
          Fitness
        </h1>
      </div>
      <div className="px-4 mb-6">
        <WorkoutPlanCard workout={todayWorkout} user={user} />
      </div>

      {/* ── Two action cards ── */}
      <div className="px-4 mb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">Create New</p>
        <div className="grid grid-cols-2 gap-3">

          {/* AI Pre-Planned */}
          <button
            onClick={() => setShowAi(true)}
            className="rounded-3xl p-5 text-left relative overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(10,14,26,0.97) 0%, rgba(0,25,55,0.9) 100%)',
              border: '1px solid rgba(102,217,255,0.25)',
              boxShadow: '0 0 30px rgba(0,109,255,0.1), inset 0 1px 0 rgba(102,217,255,0.1)',
            }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.1) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(102,217,255,0.1)', border: '1px solid rgba(102,217,255,0.25)' }}>
              <Sparkles className="w-5 h-5" style={{ color: '#66D9FF', filter: 'drop-shadow(0 0 6px rgba(102,217,255,0.7))' }} />
            </div>
            <p className="font-black text-sm text-foreground leading-tight mb-1">AI Workout</p>
            <p className="text-[10px] text-muted-foreground leading-snug">Let AI build the perfect plan for you</p>
          </button>

          {/* Custom Workout */}
          <Link to="/workout/create" className="block">
            <div
              className="rounded-3xl p-5 text-left relative overflow-hidden h-full transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, rgba(10,14,26,0.97) 0%, rgba(0,25,55,0.9) 100%)',
                border: '1px solid rgba(102,217,255,0.15)',
                boxShadow: '0 0 20px rgba(0,109,255,0.07), inset 0 1px 0 rgba(102,217,255,0.07)',
              }}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Plus className="w-5 h-5 text-foreground" />
              </div>
              <p className="font-black text-sm text-foreground leading-tight mb-1">Custom</p>
              <p className="text-[10px] text-muted-foreground leading-snug">Design your own workout split</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="px-4 mb-5">
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, rgba(102,217,255,0.3) 0%, rgba(0,109,255,0.1) 60%, transparent 100%)' }} />
      </div>

      {/* ── Browse Workouts ── */}
      <div className="px-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">Browse Workouts</p>
        <p className="text-xs text-muted-foreground mb-4">Tap a category to see a curated workout you can use today.</p>

        {/* Category grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {BROWSE_CATEGORIES.map(({ key, label }) => {
            const tmpl = WORKOUT_TEMPLATES[key];
            const isActive = browseCategory === key;
            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setBrowseCategory(key);
                  setSelectedTemplate(tmpl);
                }}
                className="rounded-2xl p-4 text-left relative overflow-hidden transition-all"
                style={isActive
                  ? { background: 'linear-gradient(135deg, rgba(102,217,255,0.15) 0%, rgba(0,109,255,0.12) 100%)', border: '1px solid rgba(102,217,255,0.45)', boxShadow: '0 0 20px rgba(102,217,255,0.15)' }
                  : { background: 'rgba(10,12,20,0.85)', border: '1px solid rgba(102,217,255,0.1)' }
                }
              >
                <p className="font-black text-sm text-foreground mb-0.5">{label}</p>
                <p className="text-[10px] text-muted-foreground leading-snug truncate">{tmpl?.focus}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Clock className="w-3 h-3 text-muted-foreground/50" />
                  <span className="text-[10px] text-muted-foreground/70">~{tmpl?.estimated_duration}min</span>
                  <span className="text-muted-foreground/30 mx-0.5">·</span>
                  <span className="text-[10px] text-muted-foreground/70">{tmpl?.exercises?.length} ex</span>
                </div>
                {isActive && (
                  <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full" style={{ background: '#66D9FF', boxShadow: '0 0 6px rgba(102,217,255,0.8)' }} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Template Detail Sheet ── */}
      {selectedTemplate && (
        <WorkoutTemplateSheet
          key={selectedTemplate.name}
          template={selectedTemplate}
          onClose={() => { setSelectedTemplate(null); setBrowseCategory(null); }}
        />
      )}

      {/* ── AI Build Dialog ── */}
      <Dialog open={showAi} onOpenChange={setShowAi}>
        <DialogContent
          className="border-0 max-w-sm mx-4"
          style={{ background: 'rgba(10,14,24,0.98)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102,217,255,0.2)', boxShadow: '0 0 60px rgba(0,109,255,0.2)' }}
        >
          <DialogHeader>
            <DialogTitle className="font-black text-lg" style={{ background: 'linear-gradient(135deg,#fff 0%,#66D9FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              AI Workout Builder
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Describe what you want and AI will build a full workout plan.</p>
          <Textarea
            placeholder="e.g. Build me a chest and traps workout for hypertrophy..."
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            className="border-0 text-foreground placeholder:text-muted-foreground/50 resize-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(102,217,255,0.15)', minHeight: '100px' }}
          />
          <button
            onClick={handleAiBuild}
            disabled={aiLoading || !aiPrompt.trim()}
            className="w-full h-12 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', color: '#030508', border: 'none', boxShadow: '0 0 20px rgba(102,217,255,0.25)' }}
          >
            {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Building...</> : <><Sparkles className="w-4 h-4" /> Generate Workout</>}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
