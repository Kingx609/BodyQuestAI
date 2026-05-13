import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Mic, Keyboard, Send, Apple, Dumbbell, BarChart2, Activity, X, MicOff, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

// ── Titan orb icon ──────────────────────────────────────────────────────────
function TitanOrb({ size = 44, glowing = false }) {
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      {glowing && (
        <div className="absolute inset-0 rounded-full animate-pulse"
          style={{ background: 'rgba(102,217,255,0.3)', filter: 'blur(12px)', transform: 'scale(1.6)' }} />
      )}
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: size, height: size,
          background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
          boxShadow: glowing
            ? '0 0 32px rgba(102,217,255,0.7), 0 0 60px rgba(0,109,255,0.4)'
            : '0 0 16px rgba(102,217,255,0.4)',
        }}
      >
        {/* Stylized T / helmet shape */}
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
          <path d="M4 6h16v2.5H14v9.5h-4V8.5H4z" fill="#030508" opacity="0.9" />
          <circle cx="12" cy="6" r="1.2" fill="#030508" opacity="0.5" />
        </svg>
        <div className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle at 35% 32%, rgba(255,255,255,0.35) 0%, transparent 55%)' }} />
      </div>
    </div>
  );
}

// ── Pulsing voice waveform ──────────────────────────────────────────────────
function VoiceWaveform({ listening }) {
  const bars = [4, 7, 11, 16, 22, 16, 11, 7, 4, 7, 14, 20, 14, 7, 4];
  return (
    <div className="flex items-center justify-center gap-1.5" style={{ height: 56 }}>
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{ width: 4, background: '#66D9FF', boxShadow: '0 0 8px rgba(102,217,255,0.75)' }}
          animate={listening ? {
            height: [h, h * 2.8, h],
            opacity: [0.55, 1, 0.55],
          } : { height: 4, opacity: 0.18 }}
          transition={{
            duration: 0.75 + (i % 4) * 0.15,
            repeat: Infinity,
            delay: i * 0.055,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ── Quick action cards ──────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: Apple, label: 'Log a meal with photo', sub: 'AI analyzes nutrition instantly', prompt: 'Help me log a meal with a photo — analyze the nutrition for me.' },
  { icon: Dumbbell, label: "Plan today's workout", sub: 'AI builds it based on your history', prompt: 'Plan a workout for me today based on my goals and history.' },
  { icon: BarChart2, label: 'Log this set', sub: 'e.g. "8 reps at 185 bench"', prompt: 'I want to log a workout set. Ask me for the exercise, weight and reps.' },
  { icon: Activity, label: 'Check my recovery', sub: 'Readiness score + sleep insights', prompt: "How's my recovery today? Give me a full readiness breakdown." },
];

// ── Message bubble ──────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5"
          style={{ background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', boxShadow: '0 0 10px rgba(102,217,255,0.35)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16v2.5H14v9.5h-4V8.5H4z" fill="#030508" opacity="0.9" />
          </svg>
        </div>
      )}
      <div
        className="max-w-[82%] rounded-2xl px-4 py-3"
        style={isUser
          ? { background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', color: '#030508', boxShadow: '0 0 16px rgba(102,217,255,0.2)' }
          : { background: 'rgba(10,14,26,0.9)', border: '1px solid rgba(102,217,255,0.14)', backdropFilter: 'blur(12px)' }
        }
      >
        {isUser ? (
          <p className="text-sm font-medium">{msg.content}</p>
        ) : (
          <div className="text-sm text-foreground/90 prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 leading-relaxed">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
        {msg.action && (
          <div className="mt-2 text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider w-fit"
            style={{ background: 'rgba(102,217,255,0.15)', color: '#66D9FF', border: '1px solid rgba(102,217,255,0.2)' }}>
            ✓ {msg.action}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main TitanTab ───────────────────────────────────────────────────────────
export default function TitanTab() {
  const [mode, setMode] = useState(null); // null | 'voice' | 'text'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [user, setUser] = useState(null);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: sessions } = useQuery({
    queryKey: ['sessions-titan'],
    queryFn: () => base44.entities.WorkoutSession.filter({ status: 'completed' }, '-date', 20),
    initialData: [],
  });

  const { data: prs } = useQuery({
    queryKey: ['prs-titan'],
    queryFn: () => base44.entities.PersonalRecord.list('-date', 50),
    initialData: [],
  });

  const { data: sleepLogs } = useQuery({
    queryKey: ['sleep-titan'],
    queryFn: () => base44.entities.Sleep.list('-date', 7),
    initialData: [],
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Build Titan system context ───────────────────────────────────────────
  const buildPrompt = useCallback((userMsg) => {
    const today = new Date().toISOString().split('T')[0];
    const todayDay = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
    const recentSessions = sessions.slice(0, 5).map(s => ({ name: s.workout_name, date: s.date, volume: s.total_volume, sets: s.total_sets, prs: s.prs_count }));
    const recentPRs = prs.slice(0, 8).map(p => ({ exercise: p.exercise_name, weight: p.weight, reps: p.reps, date: p.date }));
    const latestSleep = sleepLogs[0];
    const personality = user?.coaching_personality || 'hype_man';
    const personalityPrompt = {
      tough_love: 'Be direct and demanding. No excuses. Push hard.',
      hype_man: 'Be explosive energy, celebrate wins, pump the user up. Use short punchy sentences.',
      calm_technician: 'Be precise and data-driven. Give technical breakdowns.',
      sarcastic_friend: 'Be witty and playful but always deliver the goods.',
    }[personality] || 'Be a motivating, knowledgeable performance coach.';

    return `You are TITAN — an elite AI personal trainer and performance coach embedded in the BodyQuest AI fitness app. ${personalityPrompt}

Today: ${today} (${todayDay})
User: ${JSON.stringify({ name: user?.full_name, goal: user?.fitness_goal, level: user?.training_level, calories: user?.calorie_goal, protein: user?.protein_goal, gym: user?.gym_access })}
Recent sessions: ${JSON.stringify(recentSessions)}
Recent PRs: ${JSON.stringify(recentPRs)}
Last sleep: ${JSON.stringify(latestSleep || null)}
Conversation: ${JSON.stringify(messages.slice(-6).map(m => ({ role: m.role, content: m.content })))}

User says: "${userMsg}"

IMPORTANT: You can detect intent and take actions. If the user wants to:
- Log a meal → include in your response: [ACTION:LOG_MEAL] 
- Generate/plan a workout → generate a complete workout JSON and include [ACTION:SAVE_WORKOUT:<json>] where <json> is {"name":"...", "category":"...", "estimated_duration":60, "exercises":[{"name":"...","muscle_group":"...","target_sets":3,"target_reps":10}]}. Valid workout categories are push, pull, legs, chest, back, arms, shoulders, glutes, upper_body, lower_body, full_body, and custom.
- Check recovery → compute a recovery insight from their sleep/session data
- Log a set → ask for specifics if missing, then confirm

Respond helpfully, with personality. Use markdown. Keep it punchy. 2-3 sentences for quick questions, detailed for planning.`;
  }, [user, sessions, prs, sleepLogs, messages]);

  // ── Send message & parse actions ─────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    setInput('');
    setTranscript('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const response = await base44.integrations.Core.InvokeLLM({ prompt: buildPrompt(userMsg) });

    let finalResponse = response;
    let actionLabel = null;

    // Parse action: LOG_MEAL
    if (response.includes('[ACTION:LOG_MEAL]')) {
      finalResponse = response.replace('[ACTION:LOG_MEAL]', '').trim();
      actionLabel = 'Opening meal logger…';
      // Navigate to nutrition after a beat
      setTimeout(() => { window.location.hash = '#/nutrition'; }, 1800);
    }

    // Parse action: SAVE_WORKOUT
    const workoutMatch = response.match(/\[ACTION:SAVE_WORKOUT:(\{[\s\S]*?\})\]/);
    if (workoutMatch) {
      finalResponse = response.replace(workoutMatch[0], '').trim();
      const todayDay = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
      const workoutData = JSON.parse(workoutMatch[1]);
      await base44.entities.Workout.create({ ...workoutData, is_template: true, scheduled_day: todayDay });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      actionLabel = `Workout saved to Fitness tab`;
    }

    setMessages(prev => [...prev, { role: 'assistant', content: finalResponse, action: actionLabel }]);
    setLoading(false);
  }, [input, loading, buildPrompt, queryClient]);

  // ── Voice mode ────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please use Chrome or Safari.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(t);
    };
    recognition.onend = () => {
      setListening(false);
      setTranscript(prev => {
        if (prev.trim()) sendMessage(prev);
        return '';
      });
    };
    recognition.onerror = () => setListening(false);
    recognition.start();
  }, [sendMessage]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const enterMode = (m) => {
    setMode(m);
    setMessages([{
      role: 'assistant',
      content: m === 'voice'
        ? "I'm listening. Tell me what you need — log a meal, plan a workout, check your recovery, anything."
        : "What's up? Type your goal, question, or command. I'll take it from there.",
    }]);
  };

  const resetToHome = () => {
    setMode(null);
    setMessages([]);
    setInput('');
    setTranscript('');
    if (listening) recognitionRef.current?.stop();
    setListening(false);
  };

  // ── Landing screen ────────────────────────────────────────────────────────
  if (!mode) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 pb-12 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

        {/* ── Hero header ── */}
        <div className="flex items-center gap-4 mb-3">
          <TitanOrb size={56} glowing />
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] font-bold mb-0.5" style={{ color: 'rgba(102,217,255,0.65)' }}>
              AI Training Partner
            </p>
            <h1 className="text-3xl font-black tracking-tight leading-tight"
              style={{ background: 'linear-gradient(135deg, #ffffff 0%, #66D9FF 60%, #006DFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Titan
            </h1>
          </div>
        </div>
        <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
          Your AI Training Partner
        </p>
        <p className="text-xs mb-6" style={{ color: 'rgba(102,217,255,0.6)', letterSpacing: '0.02em' }}>
          Log sets. Plan workouts. Track meals. Just speak.
        </p>

        <div className="h-px w-full mb-6" style={{ background: 'linear-gradient(90deg, rgba(102,217,255,0.45) 0%, rgba(0,109,255,0.2) 50%, transparent 100%)' }} />

        {/* ── Mode selector ── */}
        <div className="grid grid-cols-2 gap-4 mb-7">

          {/* Voice — primary glowing CTA */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { enterMode('voice'); startListening(); }}
            className="relative rounded-3xl overflow-hidden flex flex-col items-center justify-center gap-4 py-9"
            style={{
              background: 'linear-gradient(160deg, rgba(8,16,36,0.99) 0%, rgba(0,28,68,0.97) 100%)',
              border: '1.5px solid rgba(102,217,255,0.45)',
              boxShadow: '0 0 50px rgba(102,217,255,0.22), 0 0 100px rgba(0,109,255,0.12), inset 0 1px 0 rgba(102,217,255,0.18)',
            }}
          >
            {/* Corner glow */}
            <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.15) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
            <div className="absolute bottom-0 left-0 w-24 h-24 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(0,109,255,0.1) 0%, transparent 70%)', transform: 'translate(-20%,20%)' }} />

            {/* Pulsing mic orb */}
            <div className="relative flex items-center justify-center">
              <motion.div
                className="absolute rounded-full"
                style={{ width: 72, height: 72, background: 'rgba(102,217,255,0.12)' }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.15, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute rounded-full"
                style={{ width: 60, height: 60, background: 'rgba(102,217,255,0.15)' }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              />
              <div className="relative w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', boxShadow: '0 0 32px rgba(102,217,255,0.7), 0 0 64px rgba(0,109,255,0.4)' }}>
                <Mic className="w-7 h-7" style={{ color: '#030508' }} />
                <div className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle at 35% 32%, rgba(255,255,255,0.32) 0%, transparent 55%)' }} />
              </div>
            </div>

            <div className="relative z-10">
              <p className="font-black text-base text-foreground text-center">Voice Mode</p>
              <p className="text-[11px] text-center font-semibold mt-0.5" style={{ color: '#66D9FF' }}>Talk to Titan</p>
            </div>
          </motion.button>

          {/* Text */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => enterMode('text')}
            className="relative rounded-3xl overflow-hidden flex flex-col items-center justify-center gap-4 py-9"
            style={{
              background: 'rgba(10,12,20,0.9)',
              border: '1.5px solid rgba(102,217,255,0.2)',
              boxShadow: '0 0 20px rgba(0,109,255,0.08), inset 0 1px 0 rgba(102,217,255,0.1)',
            }}
          >
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(102,217,255,0.08)', border: '1.5px solid rgba(102,217,255,0.28)' }}>
              <Keyboard className="w-7 h-7" style={{ color: '#66D9FF' }} />
            </div>
            <div>
              <p className="font-black text-base text-foreground text-center">Text Mode</p>
              <p className="text-[11px] text-center font-medium mt-0.5" style={{ color: 'rgba(102,217,255,0.5)' }}>Ask Titan</p>
            </div>
          </motion.button>
        </div>

        {/* ── Quick action cards ── */}
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Quick Actions</p>
          <div className="flex-1 h-px" style={{ background: 'rgba(102,217,255,0.08)' }} />
        </div>
        <div className="space-y-2.5 mb-8">
          {QUICK_ACTIONS.map(({ icon: Icon, label, sub, prompt }, idx) => (
            <motion.button
              key={label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.07 }}
              whileTap={{ scale: 0.982 }}
              onClick={() => { enterMode('text'); setTimeout(() => sendMessage(prompt), 100); }}
              className="w-full rounded-2xl px-4 py-4 flex items-center gap-4 text-left"
              style={{
                background: 'rgba(8,11,22,0.85)',
                border: '1px solid rgba(102,217,255,0.12)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
              }}
            >
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(102,217,255,0.07)', border: '1px solid rgba(102,217,255,0.2)', boxShadow: '0 0 12px rgba(102,217,255,0.1)' }}>
                <Icon className="w-5 h-5" style={{ color: '#66D9FF', filter: 'drop-shadow(0 0 4px rgba(102,217,255,0.5))' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground">{label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(102,217,255,0.5)' }}>{sub}</p>
              </div>
              <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(102,217,255,0.06)', border: '1px solid rgba(102,217,255,0.12)', color: 'rgba(102,217,255,0.4)', fontSize: 14 }}>
                ›
              </div>
            </motion.button>
          ))}
        </div>

        {/* ── Start Live Coaching CTA ── */}
        <div className="flex items-center gap-2 mb-3 mt-1">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Live Session</p>
          <div className="flex-1 h-px" style={{ background: 'rgba(102,217,255,0.08)' }} />
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { window.location.href = '/active-workout/free'; }}
          className="w-full rounded-2xl px-5 py-5 flex items-center gap-4 mb-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,20,55,0.97) 0%, rgba(0,35,80,0.93) 100%)',
            border: '1.5px solid rgba(102,217,255,0.35)',
            boxShadow: '0 0 40px rgba(102,217,255,0.14), inset 0 1px 0 rgba(102,217,255,0.12)',
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.1) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', boxShadow: '0 0 20px rgba(102,217,255,0.45)' }}>
            <Mic className="w-6 h-6" style={{ color: '#030508' }} />
          </div>
          <div className="flex-1 text-left relative z-10">
            <p className="font-black text-base text-foreground">Start Live Coaching</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(102,217,255,0.6)' }}>No plan needed — Titan coaches every set in real time</p>
          </div>
          <div className="text-xl" style={{ color: 'rgba(102,217,255,0.4)' }}>›</div>
        </motion.button>

        {/* ── Titan learns footer ── */}
        <div className="rounded-2xl px-5 py-4 flex items-start gap-3"
          style={{ background: 'rgba(102,217,255,0.04)', border: '1px solid rgba(102,217,255,0.1)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(102,217,255,0.1)', border: '1px solid rgba(102,217,255,0.2)' }}>
            <Zap className="w-4 h-4" style={{ color: '#66D9FF', filter: 'drop-shadow(0 0 4px rgba(102,217,255,0.7))' }} />
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <span style={{ color: 'rgba(102,217,255,0.8)', fontWeight: 700 }}>Titan learns your style</span> — the more you use it, the better it pushes you.
          </p>
        </div>
      </div>
    );
  }

  // ── Chat / Voice screen ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col max-w-lg mx-auto" style={{ height: 'calc(100vh - 5rem)' }}>

      {/* Header */}
      <div className="px-4 pt-5 pb-4 flex-shrink-0 flex items-center gap-3">
        <TitanOrb size={38} glowing={mode === 'voice' && listening} />
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: 'rgba(102,217,255,0.6)' }}>
            {mode === 'voice' ? 'Voice Mode' : 'Text Mode'}
          </p>
          <h2 className="font-black text-lg leading-tight"
            style={{ background: 'linear-gradient(135deg, #fff 0%, #66D9FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Titan
          </h2>
        </div>
        <button onClick={resetToHome}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mx-4 h-px mb-4 flex-shrink-0"
        style={{ background: 'linear-gradient(90deg, rgba(102,217,255,0.35) 0%, transparent 100%)' }} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-3" style={{ scrollbarWidth: 'thin' }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', boxShadow: '0 0 10px rgba(102,217,255,0.35)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16v2.5H14v9.5h-4V8.5H4z" fill="#030508" opacity="0.9" />
              </svg>
            </div>
            <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(10,14,26,0.9)', border: '1px solid rgba(102,217,255,0.14)' }}>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#66D9FF' }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Voice mode bottom */}
      {mode === 'voice' && (
        <div className="flex-shrink-0 px-4 pb-6 pt-3 flex flex-col items-center gap-5"
          style={{ borderTop: '1px solid rgba(102,217,255,0.08)', background: 'rgba(5,7,14,0.97)' }}>

          {/* Live status label */}
          <div className="flex items-center gap-2">
            {listening && (
              <motion.div className="w-2 h-2 rounded-full"
                style={{ background: '#66D9FF', boxShadow: '0 0 8px rgba(102,217,255,0.9)' }}
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }} />
            )}
            <p className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: listening ? '#66D9FF' : 'rgba(255,255,255,0.3)' }}>
              {listening ? 'Listening...' : 'Tap mic to speak'}
            </p>
          </div>

          {/* Large waveform panel */}
          <div className="w-full rounded-2xl px-5 flex flex-col items-center gap-3 justify-center relative overflow-hidden"
            style={{
              minHeight: 110,
              background: listening
                ? 'linear-gradient(160deg, rgba(0,20,55,0.97) 0%, rgba(0,35,80,0.93) 100%)'
                : 'rgba(10,14,26,0.85)',
              border: listening ? '1.5px solid rgba(102,217,255,0.4)' : '1px solid rgba(102,217,255,0.12)',
              boxShadow: listening ? '0 0 40px rgba(102,217,255,0.14) inset, 0 0 20px rgba(0,109,255,0.1)' : 'none',
              transition: 'all 0.35s ease',
              paddingTop: 18, paddingBottom: 18,
            }}>
            {listening && (
              <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.12) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
            )}
            {/* Listening label row */}
            <div className="flex items-center gap-2">
              {listening && (
                <motion.div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: '#66D9FF', boxShadow: '0 0 10px rgba(102,217,255,1)' }}
                  animate={{ opacity: [1, 0.15, 1], scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.85, repeat: Infinity }} />
              )}
              <p className="text-xs font-black uppercase tracking-[0.22em]"
                style={{ color: listening ? '#66D9FF' : 'rgba(255,255,255,0.2)', textShadow: listening ? '0 0 12px rgba(102,217,255,0.6)' : 'none' }}>
                {listening ? 'Listening...' : 'Ready'}
              </p>
            </div>
            {/* Waveform bars — enlarged */}
            <VoiceWaveform listening={listening} />
            {transcript && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-center italic px-2"
                style={{ color: 'rgba(102,217,255,0.9)', textShadow: '0 0 8px rgba(102,217,255,0.4)' }}
              >
                "{transcript}"
              </motion.p>
            )}
          </div>

          {/* Big pulsing mic button */}
          <div className="relative flex items-center justify-center">
            {listening && (
              <>
                <motion.div className="absolute rounded-full"
                  style={{ width: 110, height: 110, background: 'rgba(102,217,255,0.08)' }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ duration: 1.8, repeat: Infinity }} />
                <motion.div className="absolute rounded-full"
                  style={{ width: 92, height: 92, background: 'rgba(102,217,255,0.11)' }}
                  animate={{ scale: [1, 1.28, 1], opacity: [0.55, 0, 0.55] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: 0.35 }} />
              </>
            )}
            <motion.button
              whileTap={{ scale: 0.91 }}
              onClick={listening ? stopListening : startListening}
              className="relative w-[84px] h-[84px] rounded-full flex items-center justify-center"
              style={{
                background: listening
                  ? 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
                boxShadow: listening
                  ? '0 0 40px rgba(248,113,113,0.65), 0 0 80px rgba(220,38,38,0.35)'
                  : '0 0 40px rgba(102,217,255,0.65), 0 0 80px rgba(0,109,255,0.4)',
                border: 'none',
              }}
            >
              {listening
                ? <MicOff className="w-9 h-9" style={{ color: '#fff' }} />
                : <Mic className="w-9 h-9" style={{ color: '#030508' }} />
              }
              <div className="absolute inset-0 rounded-full"
                style={{ background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.3) 0%, transparent 55%)' }} />
            </motion.button>
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold"
            style={{ color: listening ? 'rgba(102,217,255,0.5)' : 'rgba(255,255,255,0.2)' }}>
            {listening ? 'Tap to stop' : 'Tap to speak to Titan'}
          </p>
        </div>
      )}

      {/* Text mode input */}
      {mode === 'text' && (
        <div className="px-4 pb-4 pt-2 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(102,217,255,0.1)', background: 'rgba(5,7,12,0.96)', backdropFilter: 'blur(20px)' }}>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Tell Titan what you need..."
              autoFocus
              className="flex-1 h-12 rounded-2xl px-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(102,217,255,0.15)' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
                boxShadow: input.trim() ? '0 0 20px rgba(102,217,255,0.35)' : 'none',
                border: 'none',
              }}
            >
              <Send className="w-4 h-4" style={{ color: '#030508' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
