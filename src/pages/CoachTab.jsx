import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Send, Sparkles, Loader2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const QUICK_PROMPTS = ['What should I train?', 'Weekly review', "How's my progress?", 'Nutrition tips'];

export default function CoachTab() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: sessions } = useQuery({
    queryKey: ['sessions-coach'],
    queryFn: () => base44.entities.WorkoutSession.filter({ status: 'completed' }, '-date', 20),
    initialData: [],
  });

  const { data: prs } = useQuery({
    queryKey: ['prs-coach'],
    queryFn: () => base44.entities.PersonalRecord.list('-date', 50),
    initialData: [],
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Hey! I'm your BodyQuest AI coach. Ask me anything — what to train, your progress, nutrition advice, or just say \"weekly review\" for a full breakdown. Let's get after it. 💪"
      }]);
    }
  }, []);

  const sendMessage = async (text) => {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const personality = user?.coaching_personality || 'hype_man';
    const recentSessions = sessions.slice(0, 5).map(s => ({ name: s.workout_name, date: s.date, volume: s.total_volume, sets: s.total_sets, prs: s.prs_count }));
    const recentPRs = prs.slice(0, 10).map(p => ({ exercise: p.exercise_name, weight: p.weight, reps: p.reps, date: p.date }));

    const personalityPrompt = {
      tough_love: 'Be direct, no-nonsense, push the user hard. Call out weak efforts.',
      hype_man: 'Be high energy, celebrate wins, keep the user pumped up.',
      calm_technician: 'Be quiet, precise, give technical feedback on form and programming.',
      sarcastic_friend: 'Be witty, funny, playfully tease but always helpful.',
    }[personality] || 'Be motivational and helpful.';

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are BodyQuest AI, a personal fitness coach. ${personalityPrompt}
User profile: ${JSON.stringify({ name: user?.display_name, goal: user?.fitness_goal, level: user?.training_level, calories: user?.calorie_goal, protein: user?.protein_goal })}
Recent sessions: ${JSON.stringify(recentSessions)}
Recent PRs: ${JSON.stringify(recentPRs)}
Previous conversation: ${JSON.stringify(messages.slice(-6).map(m => ({ role: m.role, content: m.content })))}
User says: "${userMsg}"
Respond helpfully. Use markdown for formatting when useful. Keep responses concise (2-4 sentences for quick questions, longer for reviews).`,
    });

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  const personalityLabel = user?.coaching_personality?.replace(/_/g, ' ') || 'AI';

  return (
    <div className="flex flex-col max-w-lg mx-auto" style={{ height: 'calc(100vh - 5rem)' }}>

      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(102,217,255,0.1)', border: '1px solid rgba(102,217,255,0.3)', boxShadow: '0 0 16px rgba(102,217,255,0.2)' }}
          >
            <Sparkles className="w-5 h-5" style={{ color: '#66D9FF', filter: 'drop-shadow(0 0 6px rgba(102,217,255,0.8))' }} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">AI Powered</p>
            <h1
              className="text-2xl font-black tracking-tight leading-tight"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #66D9FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              BodyQuest Coach
            </h1>
          </div>
          <div className="ml-auto px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider capitalize"
            style={{ background: 'rgba(102,217,255,0.08)', border: '1px solid rgba(102,217,255,0.2)', color: '#66D9FF' }}>
            {personalityLabel}
          </div>
        </div>

        {/* Divider glow */}
        <div className="mt-4 h-px w-full"
          style={{ background: 'linear-gradient(90deg, rgba(102,217,255,0.4) 0%, rgba(0,109,255,0.15) 60%, transparent 100%)' }} />
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-3" style={{ scrollbarWidth: 'thin' }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center mr-2 flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(102,217,255,0.1)', border: '1px solid rgba(102,217,255,0.25)' }}
                >
                  <Zap className="w-3.5 h-3.5" style={{ color: '#66D9FF' }} />
                </div>
              )}
              <div
                className="max-w-[82%] rounded-2xl px-4 py-3"
                style={
                  msg.role === 'user'
                    ? {
                        background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
                        color: '#030508',
                        boxShadow: '0 0 16px rgba(102,217,255,0.2)',
                      }
                    : {
                        background: 'rgba(10,14,26,0.9)',
                        border: '1px solid rgba(102,217,255,0.15)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: 'inset 0 1px 0 rgba(102,217,255,0.07)',
                      }
                }
              >
                {msg.role === 'user' ? (
                  <p className="text-sm font-medium">{msg.content}</p>
                ) : (
                  <div className="text-sm text-foreground/90 prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(102,217,255,0.1)', border: '1px solid rgba(102,217,255,0.25)' }}>
              <Zap className="w-3.5 h-3.5" style={{ color: '#66D9FF' }} />
            </div>
            <div className="rounded-2xl px-4 py-3"
              style={{ background: 'rgba(10,14,26,0.9)', border: '1px solid rgba(102,217,255,0.15)' }}>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#66D9FF' }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* ── Quick prompts ── */}
      <div className="px-4 pt-2 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {QUICK_PROMPTS.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all"
              style={{ background: 'rgba(102,217,255,0.07)', border: '1px solid rgba(102,217,255,0.18)', color: 'rgba(102,217,255,0.85)' }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── Input bar ── */}
      <div
        className="px-4 pb-4 pt-2 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(102,217,255,0.1)', background: 'rgba(6,8,14,0.96)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Ask your coach anything..."
            className="flex-1 h-12 rounded-2xl px-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(102,217,255,0.15)' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
            style={{
              background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
              boxShadow: input.trim() ? '0 0 20px rgba(102,217,255,0.3)' : 'none',
              border: 'none',
            }}
          >
            <Send className="w-4 h-4" style={{ color: '#030508' }} />
          </button>
        </div>
      </div>
    </div>
  );
}