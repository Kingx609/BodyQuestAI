import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Mic, Clock, Trophy, ChevronDown, ChevronUp,
  Loader2, Zap, X, MicOff, CheckCircle2, SkipForward,
  ChevronLeft, ChevronRight, Plus, Send, Flag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ── Helpers ─────────────────────────────────────────────────────────────────
const formatTime = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatVolume = (volume = 0) => (
  volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : `${Math.round(volume)}`
);

const setVolume = (set) => (Number(set?.weight) || 0) * (Number(set?.reps) || 0);

const exerciseVolume = (exercise) => (exercise?.sets || []).reduce((sum, set) => sum + setVolume(set), 0);

const formatSet = (set) => set ? `${set.weight || 0} lbs x ${set.reps || 0}` : 'None yet';

const sameExercise = (a, b) => a?.toLowerCase?.().trim() === b?.toLowerCase?.().trim();

const PERSONALITY_PROMPTS = {
  tough_love: 'You are TITAN with a Tough Love personality. Validate performance then push harder. No sugarcoating. Short, direct, intense.',
  hype_man: 'You are TITAN with a Hype Man personality. Explosive energy. Celebrate every rep. Make them feel unstoppable.',
  calm_technician: 'You are TITAN with a Calm Technician personality. Precise, data-driven, focused on form and consistency. Measured tone.',
  sarcastic_friend: 'You are TITAN with a Sarcastic Friend personality. Dry humor, playful jabs, but genuine care. Banter like a gym buddy who gets results.',
};

// ── Voice waveform ───────────────────────────────────────────────────────────
function VoiceBars({ active }) {
  const heights = [4, 8, 14, 10, 18, 10, 14, 8, 4];
  return (
    <div className="flex items-center justify-center gap-1" style={{ height: 24 }}>
      {heights.map((h, i) => (
        <motion.div key={i} className="rounded-full" style={{ width: 3, background: '#66D9FF' }}
          animate={active ? { height: [h, h * 2.2, h], opacity: [0.6, 1, 0.6] } : { height: 3, opacity: 0.25 }}
          transition={{ duration: 0.7 + (i % 3) * 0.15, repeat: Infinity, delay: i * 0.07, ease: 'easeInOut' }} />
      ))}
    </div>
  );
}

// ── Titan avatar ─────────────────────────────────────────────────────────────
function TitanOrb({ size = 28, glow = true }) {
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
        boxShadow: glow ? '0 0 14px rgba(102,217,255,0.5)' : 'none',
      }}>
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16v2.5H14v9.5h-4V8.5H4z" fill="#030508" opacity="0.92" />
      </svg>
    </div>
  );
}

// ── Titan chat bubble ────────────────────────────────────────────────────────
function TitanBubble({ message, isNew }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
      className="flex items-start gap-2.5">
      <TitanOrb size={28} />
      <div className="flex-1 rounded-2xl rounded-tl-sm px-4 py-3"
        style={{
          background: 'rgba(10,16,32,0.95)',
          border: isNew ? '1px solid rgba(102,217,255,0.35)' : '1px solid rgba(102,217,255,0.1)',
          boxShadow: isNew ? '0 0 20px rgba(102,217,255,0.1)' : 'none',
        }}>
        <p className="text-sm text-foreground/90 leading-relaxed">{message}</p>
      </div>
    </motion.div>
  );
}

// ── User chat bubble ─────────────────────────────────────────────────────────
function UserBubble({ message }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
      className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-3"
        style={{ background: 'rgba(102,217,255,0.1)', border: '1px solid rgba(102,217,255,0.2)' }}>
        <p className="text-sm text-foreground/80 leading-relaxed">{message}</p>
      </div>
    </motion.div>
  );
}

// ── Thinking dots ────────────────────────────────────────────────────────────
function TitanThinking() {
  return (
    <div className="flex items-center gap-2.5">
      <TitanOrb size={28} glow={false} />
      <div className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5"
        style={{ background: 'rgba(10,14,26,0.9)', border: '1px solid rgba(102,217,255,0.12)' }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#66D9FF' }}
            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
        ))}
      </div>
    </div>
  );
}

// ── Add Exercise Dialog ──────────────────────────────────────────────────────
function AddExerciseDialog({ open, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [muscle, setMuscle] = useState('');

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(102,217,255,0.15)',
    borderRadius: 10, color: 'white', padding: '8px 12px', outline: 'none', width: '100%', fontSize: 13,
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), muscle_group: muscle, target_sets: parseInt(sets) || 3, target_reps: parseInt(reps) || 10 });
    setName(''); setSets('3'); setReps('10'); setMuscle('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="border-0 max-w-sm mx-4"
        style={{ background: 'rgba(10,14,24,0.98)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102,217,255,0.2)', boxShadow: '0 0 60px rgba(0,109,255,0.2)' }}>
        <DialogHeader>
          <DialogTitle className="font-black text-lg"
            style={{ background: 'linear-gradient(135deg,#fff 0%,#66D9FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Add Exercise
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <input style={inputStyle} placeholder="Exercise name" value={name} onChange={e => setName(e.target.value)} autoFocus />
          <input style={inputStyle} placeholder="Muscle group (optional)" value={muscle} onChange={e => setMuscle(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input style={inputStyle} type="number" placeholder="Sets" value={sets} onChange={e => setSets(e.target.value)} />
            <input style={inputStyle} type="number" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)} />
          </div>
          <button onClick={handleAdd} disabled={!name.trim()}
            className="w-full h-12 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', color: '#030508', border: 'none' }}>
            <Plus className="w-4 h-4" /> Add to Session
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Finish Workout confirmation ───────────────────────────────────────────────
function FinishDialog({ open, onClose, onConfirm, sessionData }) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="border-0 max-w-sm mx-4"
        style={{ background: 'rgba(10,14,24,0.98)', backdropFilter: 'blur(24px)', border: '1px solid rgba(74,222,128,0.25)', boxShadow: '0 0 60px rgba(74,222,128,0.12)' }}>
        <DialogHeader>
          <DialogTitle className="font-black text-lg"
            style={{ background: 'linear-gradient(135deg,#fff 0%,#4ade80 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Finish Workout?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Sets', value: sessionData.total_sets },
              { label: 'Reps', value: sessionData.total_reps },
              { label: 'Volume', value: `${(sessionData.total_volume / 1000).toFixed(1)}k` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-xl font-black text-foreground">{value}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
          <button onClick={onConfirm}
            className="w-full h-12 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)', color: '#030508', border: 'none', boxShadow: '0 0 24px rgba(74,222,128,0.3)' }}>
            <Flag className="w-4 h-4" /> Complete Session
          </button>
          <button onClick={onClose}
            className="w-full h-10 rounded-xl font-semibold text-xs uppercase tracking-wider"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
            Keep Going
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Voice Input Sheet ────────────────────────────────────────────────────────
function VoiceSheet({ open, onClose, onSubmit, loading, currentExercise, currentSet }) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => { if (!open) { setText(''); setListening(false); } }, [open]);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = 'en-US'; r.interimResults = true;
    recognitionRef.current = r;
    r.onstart = () => setListening(true);
    r.onresult = e => setText(Array.from(e.results).map(x => x[0].transcript).join(''));
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
  };

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };
  const handleSubmit = () => { if (text.trim()) { onSubmit(text); setText(''); } };

  if (!open) return null;

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl overflow-hidden"
      style={{ background: 'rgba(6,10,22,0.98)', backdropFilter: 'blur(32px)', border: '1.5px solid rgba(102,217,255,0.2)', boxShadow: '0 -20px 80px rgba(0,109,255,0.2)' }}>
      <div className="max-w-lg mx-auto px-5 pt-5 pb-8">
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(102,217,255,0.25)' }} />
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-0.5" style={{ color: 'rgba(102,217,255,0.6)' }}>Titan · Voice Coach</p>
            <h3 className="font-black text-base text-foreground">
              {currentExercise ? `${currentExercise} — Set ${currentSet}` : 'Log Your Set'}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Speak or type naturally: <span style={{ color: 'rgba(102,217,255,0.7)' }}>"135 for 10"</span> · <span style={{ color: 'rgba(102,217,255,0.7)' }}>"225 for 5 on bench"</span>
        </p>
        <div className="relative mb-4">
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder={`e.g. "135 for 10" or "225 for 5, felt solid"`}
            rows={3}
            className="w-full rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(102,217,255,0.18)' }}
            autoFocus />
          {listening && <div className="absolute bottom-3 right-3"><VoiceBars active={true} /></div>}
        </div>
        <div className="flex gap-3">
          <motion.button whileTap={{ scale: 0.93 }}
            onClick={listening ? stopListening : startListening}
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: listening ? 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)' : 'rgba(102,217,255,0.1)',
              border: listening ? 'none' : '1.5px solid rgba(102,217,255,0.3)',
              boxShadow: listening ? '0 0 20px rgba(248,113,113,0.4)' : '0 0 12px rgba(102,217,255,0.15)',
            }}
            animate={listening ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={{ duration: 1.2, repeat: Infinity }}>
            {listening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" style={{ color: '#66D9FF' }} />}
          </motion.button>
          <button onClick={handleSubmit} disabled={loading || !text.trim()}
            className="flex-1 h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', color: '#030508', border: 'none', boxShadow: '0 0 30px rgba(102,217,255,0.45)' }}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Logging...</> : <><Zap className="w-4 h-4" /> Log Set</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main ActiveWorkout ───────────────────────────────────────────────────────
export default function ActiveWorkout() {
  const navigate = useNavigate();
  const workoutId = window.location.pathname.split('/active-workout/')[1];
  const isFreestyle = workoutId === 'free';

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]); // { role: 'titan'|'user', text, isNew? }
  const [titanLoading, setTitanLoading] = useState(false);
  const [session, setSession] = useState({
    exercises: [], total_volume: 0, total_sets: 0, total_reps: 0,
    muscle_group_volume: {}, prs_count: 0, heaviest_lift: 0,
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [showExercises, setShowExercises] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showAddEx, setShowAddEx] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [logging, setLogging] = useState(false);
  const [textInput, setTextInput] = useState('');

  // extra exercises added during session (freestyle or additions)
  const [addedExercises, setAddedExercises] = useState([]);

  const messagesEndRef = useRef(null);
  const startTime = useRef(Date.now());
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const { data: workout } = useQuery({
    queryKey: ['workout', workoutId],
    queryFn: () => base44.entities.Workout.filter({ id: workoutId }).then(r => r[0]),
    enabled: !isFreestyle && !!workoutId,
  });

  const { data: prs } = useQuery({
    queryKey: ['prs'],
    queryFn: () => base44.entities.PersonalRecord.list('-date', 500),
    initialData: [],
  });

  // Load user for personality
  useEffect(() => { base44.auth.me().then(u => setUser(u)); }, []);

  // Timers
  useEffect(() => {
    const t = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isResting) return;
    const t = setInterval(() => setRestSeconds(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [isResting]);

  // Auto-scroll messages
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, titanLoading]);

  // Planned mode uses the saved plan. Freestyle mode turns logged exercises into the live exercise order.
  const loggedExercisePlans = session.exercises.map(ex => ({
    name: ex.name,
    muscle_group: ex.muscle_group,
    target_sets: ex.target_sets,
    target_reps: ex.target_reps,
  }));
  const loggedNames = new Set(loggedExercisePlans.map(ex => ex.name?.toLowerCase()));
  const unloggedAddedExercises = addedExercises.filter(ex => !loggedNames.has(ex.name?.toLowerCase()));
  const plannedExercises = isFreestyle
    ? [...loggedExercisePlans, ...unloggedAddedExercises]
    : [...(workout?.exercises || []), ...addedExercises];
  const currentPlanned = plannedExercises[currentExIdx] || null;
  const loggedEx = session.exercises.find(e => sameExercise(e.name, currentPlanned?.name));
  const setsLoggedForCurrent = loggedEx?.sets?.length || 0;
  const totalSetsForCurrent = currentPlanned?.target_sets || 4;
  const currentExerciseVolume = exerciseVolume(loggedEx);
  const lastSet = loggedEx?.sets?.[loggedEx.sets.length - 1] || null;
  const bestSetToday = (loggedEx?.sets || []).reduce((best, set) => setVolume(set) > setVolume(best) ? set : best, null);
  const currentHistoricalBest = currentPlanned
    ? Math.max(0, ...prs.filter(p => sameExercise(p.exercise_name, currentPlanned.name)).map(p => p.weight || 0))
    : 0;
  const currentTopWeight = Math.max(0, ...(loggedEx?.sets || []).map(set => set.weight || 0));
  const prWatch = !currentPlanned
    ? 'Waiting for first lift'
    : currentHistoricalBest === 0
      ? 'First time logging'
      : currentTopWeight > currentHistoricalBest
        ? 'New PR pace'
        : currentTopWeight === currentHistoricalBest
          ? 'Tied last best'
          : `${Math.max(0, currentHistoricalBest - currentTopWeight)} lbs off best`;
  const completedExerciseCount = plannedExercises.filter(ex => {
    const logged = session.exercises.find(entry => sameExercise(entry.name, ex.name));
    return (logged?.sets?.length || 0) >= (ex.target_sets || 4);
  }).length;
  const remainingExerciseCount = Math.max(0, plannedExercises.length - completedExerciseCount);

  // Initial Titan greeting (once workout data resolves or freestyle)
  useEffect(() => {
    if (messages.length > 0) return;
    if (isFreestyle) {
      setMessages([{ role: 'titan', text: "Free session — I like it. No plan, just pure work. Tell me what you're lifting and I'll track every set. Weight and reps. Let's go.", isNew: false }]);
      return;
    }
    if (workout === undefined) return; // still loading
    const first = workout?.exercises?.[0];
    const greeting = workout
      ? `${workout.name} — locked in. First up: ${first?.name || 'your first exercise'}${first?.target_sets ? ` — ${first.target_sets} sets of ${first.target_reps}` : ''}. Call out your weight and reps after each set and I'll track everything.`
      : "Free session — let's run it. Tell me what you're doing and I'll track every set.";
    setMessages([{ role: 'titan', text: greeting, isNew: false }]);
  }, [workout, isFreestyle]);

  // Core: parse and log a set from natural text
  const handleLogSet = useCallback(async (text) => {
    setLogging(true);
    setShowVoice(false);
    setMessages(prev => [...prev, { role: 'user', text }]);

    const currentSession = sessionRef.current;
    const personality = user?.coaching_personality || 'tough_love';
    const personalityPrompt = PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.tough_love;

    // Parse the input
    const parsed = await base44.integrations.Core.InvokeLLM({
      prompt: `Parse this gym set log: "${text}". Context: user is doing ${currentPlanned?.name || 'an exercise'}.
Extract: exercise_name (use "${currentPlanned?.name || 'Unknown'}" if not mentioned), weight (number, lbs), reps (number), set_count (number of identical sets if mentioned, default 1), muscle_group (chest/back/shoulders/legs/arms/core/other), equipment_or_variation (string if mentioned), notes (how it felt or relevant context), rpe (1-10 if mentioned, else null).
If the user is asking a question (e.g. "what's next?", "how many sets left?"), set is_question to true and exercise_name to null.
Return JSON.`,
      response_json_schema: {
        type: 'object',
        properties: {
          is_question: { type: 'boolean' },
          exercise_name: { type: 'string' },
          weight: { type: 'number' },
          reps: { type: 'number' },
          set_count: { type: 'number' },
          muscle_group: { type: 'string' },
          equipment_or_variation: { type: 'string' },
          notes: { type: 'string' },
          rpe: { type: 'number' },
        }
      }
    });

    // If it's a question, just respond conversationally
    if (parsed.is_question) {
      setTitanLoading(true);
      const setsLeft = currentPlanned ? Math.max(0, totalSetsForCurrent - setsLoggedForCurrent) : null;
      const exLeft = Math.max(0, plannedExercises.length - currentExIdx - 1);
      const exerciseStatus = plannedExercises.length > 0
        ? `${exLeft > 0 ? `${exLeft} exercises remaining.` : 'This is the last exercise.'}`
        : 'Freestyle mode has no preset exercise order yet.';
      const reply = await base44.integrations.Core.InvokeLLM({
        prompt: `${personalityPrompt}
User asked: "${text}"
Session data: ${setsLeft !== null ? `${setsLeft} sets left on ${currentPlanned?.name},` : ''} ${exerciseStatus}
Total so far: ${currentSession.total_sets} sets, ${(currentSession.total_volume / 1000).toFixed(1)}k lbs volume.
Answer helpfully in 1-3 sentences.`,
      });
      setMessages(prev => [...prev, { role: 'titan', text: reply, isNew: true }]);
      setTimeout(() => setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, isNew: false } : m)), 4000);
      setTitanLoading(false);
      setLogging(false);
      return;
    }

    // Log one or more sets from natural language.
    const exerciseName = parsed.exercise_name || currentPlanned?.name || 'Unknown Exercise';
    const muscleGroup = parsed.muscle_group || currentPlanned?.muscle_group || 'other';
    const setCount = Math.max(1, Math.min(parseInt(parsed.set_count, 10) || 1, 10));
    const perSetVolume = (parsed.weight || 0) * (parsed.reps || 0);
    const totalLoggedVolume = perSetVolume * setCount;
    const exercisePRs = prs.filter(p => sameExercise(p.exercise_name, exerciseName));
    const bestWeight = exercisePRs.length > 0 ? Math.max(...exercisePRs.map(p => p.weight || 0)) : 0;
    const isPR = parsed.weight > 0 && parsed.weight > bestWeight;
    const setEntries = Array.from({ length: setCount }, (_, i) => ({
      weight: parsed.weight || 0,
      reps: parsed.reps || 0,
      rpe: parsed.rpe || null,
      notes: parsed.notes || '',
      equipment_or_variation: parsed.equipment_or_variation || '',
      volume: perSetVolume,
      timestamp: new Date().toISOString(),
      logged_at_seconds: elapsedSeconds,
      is_pr: isPR && i === 0,
    }));

    let newSession;
    setSession(prev => {
      const exercises = [...prev.exercises];
      const idx = exercises.findIndex(e => sameExercise(e.name, exerciseName));
      if (idx >= 0) {
        exercises[idx] = {
          ...exercises[idx],
          muscle_group: exercises[idx].muscle_group || muscleGroup,
          sets: [...exercises[idx].sets, ...setEntries],
        };
      } else {
        exercises.push({ name: exerciseName, muscle_group: muscleGroup, sets: setEntries });
      }
      const mgVol = { ...prev.muscle_group_volume };
      mgVol[muscleGroup] = (mgVol[muscleGroup] || 0) + totalLoggedVolume;
      newSession = {
        ...prev, exercises,
        total_volume: prev.total_volume + totalLoggedVolume,
        total_sets: prev.total_sets + setCount,
        total_reps: prev.total_reps + ((parsed.reps || 0) * setCount),
        muscle_group_volume: mgVol,
        prs_count: prev.prs_count + (isPR ? 1 : 0),
        heaviest_lift: Math.max(prev.heaviest_lift, parsed.weight || 0),
      };
      return newSession;
    });

    const existingPlanIndex = plannedExercises.findIndex(ex => sameExercise(ex.name, exerciseName));
    if (existingPlanIndex < 0) {
      setAddedExercises(prev => prev.some(ex => sameExercise(ex.name, exerciseName))
        ? prev
        : [...prev, { name: exerciseName, muscle_group: muscleGroup, target_sets: null, target_reps: null }]);
    }
    if (isFreestyle || existingPlanIndex < 0) {
      setCurrentExIdx(existingPlanIndex >= 0 ? existingPlanIndex : plannedExercises.length);
    }

    setIsResting(true);
    setRestSeconds(0);
    setLogging(false);

    // Advance exercise if sets complete
    const isCurrentExerciseLog = currentPlanned && sameExercise(exerciseName, currentPlanned.name);
    const newSetsCount = isCurrentExerciseLog ? setsLoggedForCurrent + setCount : setCount;
    const exerciseDone = isCurrentExerciseLog && newSetsCount >= totalSetsForCurrent;
    if (exerciseDone && currentExIdx < plannedExercises.length - 1) {
      setCurrentExIdx(p => p + 1);
    }

    // Titan coaching response
    setTitanLoading(true);
    const nextEx = exerciseDone ? plannedExercises[currentExIdx + 1] : null;
    const nextSetText = isCurrentExerciseLog
      ? `Same exercise: ${exerciseName} - set ${newSetsCount + 1} of ${totalSetsForCurrent} next.`
      : `Current exercise updated to ${exerciseName}.`;
    const coachReply = await base44.integrations.Core.InvokeLLM({
      prompt: `${personalityPrompt}
You just received a set log in a live gym session.

Set logged: ${setCount > 1 ? `${setCount} sets of ` : ''}${exerciseName} - ${parsed.weight}lbs x ${parsed.reps} reps${parsed.rpe ? ` @ RPE ${parsed.rpe}` : ''}${isPR ? ' - NEW PERSONAL RECORD!' : ''}
Previous best for this lift: ${bestWeight > 0 ? `${bestWeight} lbs` : 'first time logging this exercise'}
Notes: ${parsed.notes || 'none'}
Session so far: ${(currentSession.total_sets || 0) + setCount} sets, ${(((currentSession.total_volume || 0) + totalLoggedVolume) / 1000).toFixed(1)}k lbs total volume, ${formatTime(elapsedSeconds)} elapsed.
${nextEx ? `Next exercise: ${nextEx.name} - ${nextEx.target_sets || 3} sets of ${nextEx.target_reps || 10} reps.` : exerciseDone ? 'Workout complete - all exercises done.' : nextSetText}

Your response must:
1. Confirm what was logged in 1 punchy sentence (natural gym coach talk)
2. ${isPR ? 'React to the PR with genuine energy.' : 'Give a specific coaching cue for the next set (weight suggestion, form tip, or mental cue).'}
3. If moving to a new exercise, introduce it and set the expectation.
Keep total response to 2-4 sentences. Sound like a real elite coach, not a chatbot.`,
    });

    setMessages(prev => [...prev, { role: 'titan', text: coachReply, isNew: true }]);
    setTimeout(() => setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, isNew: false } : m)), 4000);
    setTitanLoading(false);
  }, [currentPlanned, prs, setsLoggedForCurrent, totalSetsForCurrent, currentExIdx, plannedExercises, elapsedSeconds, user, isFreestyle]);

  const handleTextSubmit = () => {
    if (!textInput.trim() || logging || titanLoading) return;
    handleLogSet(textInput.trim());
    setTextInput('');
  };

  const handleAddExercise = (ex) => {
    setAddedExercises(prev => [...prev, ex]);
    // jump to new exercise
    setCurrentExIdx(plannedExercises.length);
  };

  const handleFinishWorkout = async () => {
    const today = new Date().toISOString().split('T')[0];
    const s = sessionRef.current;
    const sessionData = {
      workout_name: workout?.name || 'Freestyle Session',
      workout_id: isFreestyle ? '' : (workoutId || ''),
      date: today, status: 'completed',
      exercises: s.exercises,
      total_volume: s.total_volume,
      total_sets: s.total_sets,
      total_reps: s.total_reps,
      duration_minutes: Math.floor(elapsedSeconds / 60),
      prs_count: s.prs_count,
      heaviest_lift: s.heaviest_lift,
      muscle_group_volume: s.muscle_group_volume,
    };
    const created = await base44.entities.WorkoutSession.create(sessionData);
    for (const ex of s.exercises) {
      for (const set of (ex.sets || [])) {
        if (set.is_pr) {
          await base44.entities.PersonalRecord.create({
            exercise_name: ex.name, weight: set.weight, reps: set.reps,
            volume: (set.weight || 0) * (set.reps || 0), date: today, session_id: created.id,
          });
        }
      }
    }
    navigate(`/post-workout/${created.id}`);
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: '#030508' }}>

      {/* ── TOP BAR ── */}
      <div className="flex-shrink-0 px-4 pt-safe pt-5 pb-3 flex items-center gap-3"
        style={{ borderBottom: '1px solid rgba(102,217,255,0.12)', background: 'rgba(5,7,12,0.97)', backdropFilter: 'blur(20px)' }}>
        <TitanOrb size={36} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: 'rgba(102,217,255,0.6)' }}>
            Live Session · Titan
          </p>
          <h1 className="font-black text-base leading-tight truncate"
            style={{ background: 'linear-gradient(135deg, #fff 0%, #66D9FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {workout?.name || 'Freestyle Session'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.24)', color: '#4ade80' }}>
            In Progress
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-mono font-bold text-sm"
            style={{ background: 'rgba(102,217,255,0.08)', border: '1px solid rgba(102,217,255,0.18)', color: '#66D9FF' }}>
            <Clock className="w-3 h-3" />
            {formatTime(elapsedSeconds)}
          </div>
        </div>
      </div>

      {/* ── REST TIMER BANNER ── */}
      <AnimatePresence>
        {isResting && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 flex items-center justify-between px-5 py-2.5"
            style={{ background: 'rgba(102,217,255,0.06)', borderBottom: '1px solid rgba(102,217,255,0.1)' }}>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Rest</span>
            <span className="font-mono font-black text-lg" style={{ color: '#66D9FF' }}>{formatTime(restSeconds)}</span>
            <button onClick={() => setIsResting(false)}
              className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
              style={{ background: 'rgba(102,217,255,0.12)', border: '1px solid rgba(102,217,255,0.25)', color: '#66D9FF' }}>
              Done Resting
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SCROLLABLE MAIN AREA ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

          {/* Live Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div
              className="col-span-2 rounded-3xl p-4 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(102,217,255,0.11) 0%, rgba(0,109,255,0.08) 55%, rgba(255,255,255,0.03) 100%)',
                border: '1px solid rgba(102,217,255,0.28)',
                boxShadow: '0 0 36px rgba(102,217,255,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold mb-1">Total Volume Lifted</p>
              <div className="flex items-end justify-between gap-3">
                <p className="text-4xl font-black leading-none" style={{ color: '#ffffff', textShadow: '0 0 18px rgba(102,217,255,0.28)' }}>
                  {formatVolume(session.total_volume)}
                  <span className="text-base ml-1" style={{ color: '#66D9FF' }}>lbs</span>
                </p>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Exercise Volume</p>
                  <p className="font-black text-sm" style={{ color: '#66D9FF' }}>{formatVolume(currentExerciseVolume)} lbs</p>
                </div>
              </div>
            </div>

            {[
              { label: 'Working Sets', value: session.total_sets },
              { label: 'Total Reps', value: session.total_reps },
              { label: 'PR Watch', value: prWatch, highlight: session.prs_count > 0 },
              { label: 'Remaining', value: plannedExercises.length > 0 ? `${remainingExerciseCount} exercises` : 'Open session' },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="rounded-2xl py-3 px-3"
                style={{
                  background: highlight ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)',
                  border: highlight ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(255,255,255,0.07)',
                }}>
                <div className="text-sm font-black leading-tight" style={{ color: highlight ? '#fbbf24' : '#ffffff' }}>
                  {value}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Current Exercise Card */}
          {currentPlanned ? (
            <div className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(0,18,52,0.98) 0%, rgba(0,32,80,0.95) 100%)',
                border: '1.5px solid rgba(102,217,255,0.45)',
                boxShadow: '0 0 40px rgba(102,217,255,0.12), inset 0 1px 0 rgba(102,217,255,0.15)',
              }}>
              <div className="absolute top-0 right-0 w-36 h-36"
                style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.1) 0%, transparent 70%)', transform: 'translate(30%,-30%)', pointerEvents: 'none' }} />

              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-1" style={{ color: 'rgba(102,217,255,0.6)' }}>Current Exercise</p>
                  <h2 className="font-black text-xl text-foreground leading-tight">{currentPlanned.name}</h2>
                  {currentPlanned.muscle_group && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold mt-0.5 block" style={{ color: 'rgba(102,217,255,0.5)' }}>
                      {currentPlanned.muscle_group}
                    </span>
                  )}
                </div>
                {/* Set progress pips */}
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex gap-1">
                    {Array.from({ length: totalSetsForCurrent }).map((_, i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                        style={{
                          background: i < setsLoggedForCurrent ? '#66D9FF' : 'rgba(255,255,255,0.1)',
                          boxShadow: i < setsLoggedForCurrent ? '0 0 6px rgba(102,217,255,0.7)' : 'none',
                        }} />
                    ))}
                  </div>
                  <span className="text-xs font-black" style={{ color: '#66D9FF' }}>
                    {setsLoggedForCurrent}/{totalSetsForCurrent} sets
                  </span>
                  {currentPlanned.target_reps && (
                    <span className="text-[10px] text-muted-foreground">Target: {currentPlanned.target_reps} reps</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 relative z-10">
                {[
                  { label: 'Last Set', value: formatSet(lastSet) },
                  { label: 'Best Today', value: formatSet(bestSetToday) },
                  { label: 'Volume', value: `${formatVolume(currentExerciseVolume)} lbs` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl px-2 py-2"
                    style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(102,217,255,0.09)' }}>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
                    <p className="text-xs font-black text-foreground mt-1 leading-tight">{value}</p>
                  </div>
                ))}
              </div>

              {/* Logged sets for current exercise */}
              {loggedEx?.sets?.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {loggedEx.sets.map((set, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-xl"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(102,217,255,0.08)' }}>
                      <span className="text-xs text-muted-foreground font-semibold">Set {i + 1}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-foreground">{set.weight} lbs × {set.reps}</span>
                        {set.rpe && <span className="text-[10px] text-muted-foreground">RPE {set.rpe}</span>}
                        {set.is_pr && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1"
                            style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                            <Trophy className="w-2.5 h-2.5" /> PR
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Exercise nav controls */}
              {plannedExercises.length > 1 && (
                <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid rgba(102,217,255,0.08)' }}>
                  <button
                    onClick={() => setCurrentExIdx(p => Math.max(0, p - 1))}
                    disabled={currentExIdx === 0}
                    className="flex-1 h-9 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button
                    onClick={() => setCurrentExIdx(p => Math.min(plannedExercises.length - 1, p + 1))}
                    disabled={currentExIdx === plannedExercises.length - 1}
                    className="flex-1 h-9 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                    Skip <SkipForward className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentExIdx(p => Math.min(plannedExercises.length - 1, p + 1))}
                    disabled={currentExIdx === plannedExercises.length - 1}
                    className="flex-1 h-9 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-30"
                    style={{ background: 'rgba(102,217,255,0.08)', border: '1px solid rgba(102,217,255,0.2)', color: '#66D9FF' }}>
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Up Next preview */}
              {currentExIdx < plannedExercises.length - 1 && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Up Next</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground/70">{plannedExercises[currentExIdx + 1]?.name}</span>
                </div>
              )}
            </div>
          ) : isFreestyle ? (
            <div className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(102,217,255,0.15)' }}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Freestyle Mode</p>
              <p className="text-sm text-foreground/70">Tell Titan what you're doing and log sets naturally. No plan — just lift.</p>
            </div>
          ) : null}

          {/* Exercise list (collapsible) */}
          {plannedExercises.length > 0 && (
            <div>
              <button onClick={() => setShowExercises(p => !p)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider w-full mb-2"
                style={{ color: 'rgba(102,217,255,0.5)' }}>
                {showExercises ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>All Exercises</span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>{plannedExercises.length} total</span>
              </button>
              <AnimatePresence>
                {showExercises && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-1.5">
                    {plannedExercises.map((ex, i) => {
                      const logged = session.exercises.find(e => e.name?.toLowerCase() === ex.name?.toLowerCase());
                      const sLogged = logged?.sets?.length || 0;
                      const sDone = sLogged >= (ex.target_sets || 4);
                      const isCurrent = i === currentExIdx;
                      return (
                        <button key={i} onClick={() => { setCurrentExIdx(i); setShowExercises(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
                          style={{
                            background: isCurrent ? 'rgba(0,22,58,0.95)' : 'rgba(255,255,255,0.03)',
                            border: isCurrent ? '1.5px solid rgba(102,217,255,0.4)' : sDone ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.07)',
                          }}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: sDone ? 'rgba(34,197,94,0.15)' : isCurrent ? 'rgba(102,217,255,0.15)' : 'rgba(255,255,255,0.05)', border: `1.5px solid ${sDone ? 'rgba(34,197,94,0.5)' : isCurrent ? 'rgba(102,217,255,0.5)' : 'rgba(255,255,255,0.1)'}` }}>
                            {sDone ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} /> : <span className="text-[10px] font-black" style={{ color: isCurrent ? '#66D9FF' : 'rgba(255,255,255,0.3)' }}>{i + 1}</span>}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold" style={{ color: isCurrent ? '#fff' : sDone ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.75)' }}>{ex.name}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: isCurrent ? '#66D9FF' : 'rgba(255,255,255,0.25)' }}>
                              {sLogged}/{ex.target_sets || 4} sets · {ex.target_reps || '?'} reps
                            </p>
                          </div>
                          {isCurrent && <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ background: 'rgba(102,217,255,0.15)', color: '#66D9FF' }}>ACTIVE</span>}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Titan Chat Messages */}
          <div className="space-y-3 pb-2">
            {messages.map((msg, i) =>
              msg.role === 'titan'
                ? <TitanBubble key={i} message={msg.text} isNew={msg.isNew} />
                : <UserBubble key={i} message={msg.text} />
            )}
            {titanLoading && <TitanThinking />}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* ── BOTTOM INPUT BAR ── */}
      <div className="flex-shrink-0"
        style={{ background: 'rgba(5,7,12,0.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(102,217,255,0.12)' }}>
        <div className="max-w-lg mx-auto px-4 pt-3 pb-3 space-y-2.5">

          {/* Voice Log Set — big CTA */}
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => setShowVoice(true)}
            className="w-full rounded-2xl flex items-center justify-center gap-3 font-black text-base uppercase tracking-widest relative overflow-hidden"
            style={{
              height: 60,
              background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
              color: '#030508', border: 'none',
              boxShadow: '0 0 40px rgba(102,217,255,0.35), 0 0 80px rgba(0,109,255,0.2), 0 4px 24px rgba(0,0,0,0.5)',
              letterSpacing: '0.1em',
            }}>
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 35% 40%, rgba(255,255,255,0.18) 0%, transparent 60%)' }} />
            <Mic className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Tap to Log by Voice</span>
          </motion.button>

          {/* Text input row */}
          <div className="flex gap-2">
            <input
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
              placeholder='Type a set or ask Titan anything...'
              className="flex-1 h-11 rounded-xl px-4 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(102,217,255,0.15)' }}
            />
            <button onClick={handleTextSubmit} disabled={!textInput.trim() || logging || titanLoading}
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
              style={{ background: 'rgba(102,217,255,0.1)', border: '1px solid rgba(102,217,255,0.25)' }}>
              <Send className="w-4 h-4" style={{ color: '#66D9FF' }} />
            </button>
          </div>

          {/* Secondary controls row */}
          <div className="flex gap-2">
            <button onClick={() => setShowAddEx(true)}
              className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.5)' }}>
              <Plus className="w-3.5 h-3.5" /> Add Exercise
            </button>
            <button onClick={() => setShowFinish(true)}
              className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider"
              style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)', color: 'rgba(74,222,128,0.8)' }}>
              <Flag className="w-3.5 h-3.5" /> Finish Workout
            </button>
          </div>
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>

      {/* ── OVERLAYS ── */}
      <AnimatePresence>
        {showVoice && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowVoice(false)} />
            <VoiceSheet
              open={showVoice} onClose={() => setShowVoice(false)}
              onSubmit={handleLogSet} loading={logging}
              currentExercise={currentPlanned?.name}
              currentSet={setsLoggedForCurrent + 1}
            />
          </>
        )}
      </AnimatePresence>

      <AddExerciseDialog open={showAddEx} onClose={() => setShowAddEx(false)} onAdd={handleAddExercise} />
      <FinishDialog
        open={showFinish} onClose={() => setShowFinish(false)}
        onConfirm={handleFinishWorkout} sessionData={session}
      />
    </div>
  );
}
