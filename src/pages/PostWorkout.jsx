import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Trophy, Flame, Clock, Dumbbell, TrendingUp, Share2, FileText, Calendar, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PostWorkout() {
  const navigate = useNavigate();
  const sessionId = window.location.pathname.split('/post-workout/')[1];
  const [aiFeedback, setAiFeedback] = useState('');
  const [loadingFeedback, setLoadingFeedback] = useState(true);

  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => base44.entities.WorkoutSession.filter({ id: sessionId }).then(r => r[0]),
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (!session) return;
    const generateFeedback = async () => {
      const resp = await base44.integrations.Core.InvokeLLM({
        prompt: `You are BodyQuest AI coach. Generate a post-workout summary feedback paragraph for this session: Workout: ${session.workout_name}, Volume: ${session.total_volume} lbs, Sets: ${session.total_sets}, Reps: ${session.total_reps}, Duration: ${session.duration_minutes} min, PRs: ${session.prs_count}, Exercises: ${JSON.stringify(session.exercises?.map(e => ({ name: e.name, sets: e.sets?.length })))}. Be motivational, highlight strengths, suggest next session goals. 3-4 sentences.`,
      });
      setAiFeedback(resp);
      setLoadingFeedback(false);
      // Save to session
      await base44.entities.WorkoutSession.update(sessionId, { ai_feedback: resp });
    };
    generateFeedback();
  }, [session]);

  if (!session) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-8 max-w-lg mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="flex justify-center mb-4">
          {session.prs_count > 0 ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }} className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-400" />
            </motion.div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center glow-blue">
              <Flame className="w-8 h-8 text-primary" />
            </div>
          )}
        </div>
        <h1 className="text-sm text-muted-foreground uppercase tracking-wider mb-1">{session.workout_name} Completed</h1>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="text-5xl font-black text-glow text-primary mb-1"
        >
          {(session.total_volume || 0).toLocaleString()}
        </motion.div>
        <div className="text-sm text-muted-foreground">Total Volume (lbs)</div>
        <div className="flex items-center justify-center gap-4 mt-3 text-sm text-muted-foreground">
          <span>{session.total_sets} Sets</span>
          <span className="text-border">|</span>
          <span>{session.total_reps} Reps</span>
          <span className="text-border">|</span>
          <span>{session.duration_minutes} Min</span>
        </div>
      </motion.div>

      {/* PRs */}
      {session.prs_count > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-4 text-center">
          <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <div className="text-lg font-bold text-amber-400">{session.prs_count} New PR{session.prs_count > 1 ? 's' : ''}!</div>
        </motion.div>
      )}

      {/* Hero metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
          <div className="text-lg font-bold">{session.heaviest_lift || 0}</div>
          <div className="text-[10px] text-muted-foreground">Heaviest Lift</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
          <div className="text-lg font-bold">{session.duration_minutes}</div>
          <div className="text-[10px] text-muted-foreground">Minutes</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <Dumbbell className="w-4 h-4 text-primary mx-auto mb-1" />
          <div className="text-lg font-bold">{session.exercises?.length || 0}</div>
          <div className="text-[10px] text-muted-foreground">Exercises</div>
        </div>
      </div>

      {/* Muscle Group Breakdown */}
      {session.muscle_group_volume && Object.keys(session.muscle_group_volume).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Volume by Muscle Group</h3>
          <div className="space-y-2">
            {Object.entries(session.muscle_group_volume).sort((a, b) => b[1] - a[1]).map(([mg, vol]) => (
              <div key={mg} className="flex items-center justify-between">
                <span className="text-sm capitalize text-muted-foreground">{mg}</span>
                <span className="text-sm font-semibold">{vol.toLocaleString()} lbs</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise Details */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Exercise Log</h3>
        <div className="space-y-3">
          {session.exercises?.map((ex, i) => (
            <div key={i}>
              <div className="font-medium text-sm mb-1">{ex.name}</div>
              <div className="space-y-0.5">
                {ex.sets?.map((set, j) => (
                  <div key={j} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Set {j + 1}</span>
                    <div className="flex items-center gap-2">
                      <span>{set.weight} × {set.reps}</span>
                      {set.is_pr && <Trophy className="w-3 h-3 text-amber-400" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Feedback */}
      <div className="bg-gradient-to-br from-primary/10 to-card border border-primary/20 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-xs text-primary uppercase tracking-wider font-semibold">AI Coach Feedback</h3>
        </div>
        {loadingFeedback ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Analyzing your session...</div>
        ) : (
          <p className="text-sm text-foreground leading-relaxed">{aiFeedback}</p>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Button onClick={() => navigate('/')} className="w-full bg-primary text-primary-foreground glow-blue-sm font-semibold">
          Done
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 border-border bg-secondary text-muted-foreground">
            <Share2 className="w-4 h-4 mr-1" /> Share
          </Button>
          <Button variant="outline" className="flex-1 border-border bg-secondary text-muted-foreground">
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
        </div>
      </div>
    </div>
  );
}