import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Moon, Sun, Sparkles, Loader2, BedDouble } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

const GOAL_HOURS = 8;
const QUALITY_EMOJIS = ['😩', '😣', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '🌟'];

function to12h(time24) {
  if (!time24) return '—';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function calcDuration(bedtime, wakeTime) {
  if (!bedtime || !wakeTime) return null;
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let mins = (wh * 60 + wm) - (bh * 60 + bm);
  if (mins < 0) mins += 24 * 60;
  return Math.round((mins / 60) * 100) / 100;
}

export default function SleepSection() {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split('T')[0];
  const [showDialog, setShowDialog] = useState(false);
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(7);
  const [saving, setSaving] = useState(false);

  const { data: sleepLogs } = useQuery({
    queryKey: ['sleep', todayStr],
    queryFn: () => base44.entities.Sleep.filter({ date: todayStr }),
    initialData: [],
  });

  const lastSleep = sleepLogs?.[0] || null;

  const saveMut = useMutation({
    mutationFn: (data) => lastSleep
      ? base44.entities.Sleep.update(lastSleep.id, data)
      : base44.entities.Sleep.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep'] });
      setShowDialog(false);
    },
  });

  const handleSave = async () => {
    setSaving(true);
    const duration = calcDuration(bedtime, wakeTime);
    const insight = await base44.integrations.Core.InvokeLLM({
      prompt: `A user slept ${duration} hours (bedtime ${to12h(bedtime)}, wake ${to12h(wakeTime)}, quality ${quality}/10). Write ONE short, motivational recovery insight (max 12 words). Be specific about their hours. No markdown.`,
    });
    await saveMut.mutateAsync({ date: todayStr, bedtime, wake_time: wakeTime, duration_hours: duration, quality, ai_insight: insight });
    setSaving(false);
  };

  // Ring values
  const hours = lastSleep?.duration_hours || 0;
  const pct = Math.min((hours / GOAL_HOURS) * 100, 100);
  const r = 15.9155;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const gap = circ - dash;

  const ringColor = hours >= 7.5 ? '#66D9FF' : hours >= 6 ? '#fbbf24' : '#f87171';
  const ringGlow = hours >= 7.5 ? 'rgba(102,217,255,0.6)' : hours >= 6 ? 'rgba(251,191,36,0.5)' : 'rgba(248,113,113,0.5)';

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">Sleep Recovery</p>

      <div
        className="rounded-3xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(10,14,26,0.97) 0%, rgba(5,10,30,0.95) 100%)',
          border: '1px solid rgba(102,217,255,0.2)',
          boxShadow: '0 0 50px rgba(0,109,255,0.1), inset 0 1px 0 rgba(102,217,255,0.1)',
        }}
      >
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.06) 0%, transparent 65%)', transform: 'translate(25%,-25%)' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(80,50,180,0.08) 0%, transparent 70%)', transform: 'translate(-20%,20%)' }} />

        {lastSleep ? (
          <>
            {/* Stats row */}
            <div className="flex items-center gap-5 mb-5 relative z-10">
              {/* Ring */}
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                  <defs>
                    <linearGradient id="sleepGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={ringColor} />
                      <stop offset="100%" stopColor="#006DFF" />
                    </linearGradient>
                  </defs>
                  <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.2" />
                  <circle cx="18" cy="18" r={r} fill="none"
                    stroke="url(#sleepGrad)" strokeWidth="2.2"
                    strokeDasharray={`${dash} ${gap}`}
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 7px ${ringGlow})`, transition: 'stroke-dasharray 0.6s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">slept</span>
                  <span className="text-xl font-black leading-tight" style={{ color: ringColor, textShadow: `0 0 12px ${ringGlow}` }}>
                    {hours.toFixed(1)}
                  </span>
                  <span className="text-[9px] text-muted-foreground">of {GOAL_HOURS}h</span>
                </div>
              </div>

              {/* Times */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(102,217,255,0.08)', border: '1px solid rgba(102,217,255,0.15)' }}>
                    <Moon className="w-3.5 h-3.5" style={{ color: '#66D9FF' }} />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Bedtime</p>
                    <p className="text-sm font-black text-foreground">{to12h(lastSleep.bedtime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
                    <Sun className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Wake Time</p>
                    <p className="text-sm font-black text-foreground">{to12h(lastSleep.wake_time)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quality + insight */}
            <div className="rounded-2xl p-3 mb-4 relative z-10" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Sleep Quality</span>
                <span className="text-lg">{QUALITY_EMOJIS[(lastSleep.quality || 7) - 1]}</span>
              </div>
              {/* Quality bar */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${((lastSleep.quality || 7) / 10) * 100}%`, background: `linear-gradient(90deg, ${ringColor}, #006DFF)`, boxShadow: `0 0 6px ${ringGlow}` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{lastSleep.quality || 7}/10</p>
            </div>

            {/* AI insight */}
            {lastSleep.ai_insight && (
              <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-4 relative z-10"
                style={{ background: 'rgba(102,217,255,0.05)', border: '1px solid rgba(102,217,255,0.13)' }}>
                <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#66D9FF' }} />
                <p className="text-xs text-foreground/80 leading-relaxed">{lastSleep.ai_insight}</p>
              </div>
            )}

            {/* Update button */}
            <button
              onClick={() => { setBedtime(lastSleep.bedtime || '23:00'); setWakeTime(lastSleep.wake_time || '07:00'); setQuality(lastSleep.quality || 7); setShowDialog(true); }}
              className="w-full h-12 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 relative z-10"
              style={{ background: 'rgba(102,217,255,0.08)', border: '1px solid rgba(102,217,255,0.2)', color: '#66D9FF', letterSpacing: '0.1em' }}
            >
              <Moon className="w-4 h-4" /> Update Sleep
            </button>
          </>
        ) : (
          <>
            {/* Empty state */}
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(102,217,255,0.08)', border: '1px solid rgba(102,217,255,0.2)' }}>
                <BedDouble className="w-6 h-6" style={{ color: '#66D9FF' }} />
              </div>
              <div>
                <p className="font-black text-base text-foreground">Log last night's sleep</p>
                <p className="text-xs text-muted-foreground">Track recovery for better performance.</p>
              </div>
            </div>

            <button
              onClick={() => setShowDialog(true)}
              className="w-full h-14 rounded-2xl font-black text-base uppercase tracking-widest flex items-center justify-center gap-2 relative z-10"
              style={{
                background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
                color: '#030508',
                border: 'none',
                boxShadow: '0 0 30px rgba(102,217,255,0.32), 0 0 60px rgba(0,109,255,0.15), 0 4px 16px rgba(0,0,0,0.4)',
                letterSpacing: '0.1em',
              }}
            >
              <Moon className="w-5 h-5" /> Log Sleep
            </button>
          </>
        )}
      </div>

      {/* ── Log Sleep Dialog ── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="border-0 max-w-sm mx-4"
          style={{ background: 'rgba(10,14,24,0.98)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102,217,255,0.2)', boxShadow: '0 0 60px rgba(0,109,255,0.2)' }}
        >
          <DialogHeader>
            <DialogTitle className="font-black text-lg" style={{ background: 'linear-gradient(135deg,#fff 0%,#66D9FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Log Sleep
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Times */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Moon className="w-3 h-3" style={{ color: '#66D9FF' }} /> Bedtime
                </label>
                <input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)}
                  className="w-full h-10 rounded-xl px-3 text-sm font-bold text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(102,217,255,0.2)', colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Sun className="w-3 h-3" style={{ color: '#fbbf24' }} /> Wake Time
                </label>
                <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
                  className="w-full h-10 rounded-xl px-3 text-sm font-bold text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(102,217,255,0.2)', colorScheme: 'dark' }} />
              </div>
            </div>

            {/* Duration preview */}
            {bedtime && wakeTime && (
              <div className="rounded-xl px-4 py-2.5 text-center"
                style={{ background: 'rgba(102,217,255,0.06)', border: '1px solid rgba(102,217,255,0.15)' }}>
                <span className="text-2xl font-black" style={{ color: '#66D9FF' }}>{calcDuration(bedtime, wakeTime)?.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground ml-1">hours of sleep</span>
              </div>
            )}

            {/* Quality slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[9px] uppercase tracking-widest text-muted-foreground">Sleep Quality</label>
                <span className="text-lg">{QUALITY_EMOJIS[quality - 1]}</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="range" min="1" max="10" value={quality} onChange={e => setQuality(Number(e.target.value))}
                  className="flex-1 accent-cyan-400"
                  style={{ accentColor: '#66D9FF' }} />
                <span className="text-sm font-black w-6 text-center" style={{ color: '#66D9FF' }}>{quality}</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)', color: '#030508', border: 'none', boxShadow: '0 0 20px rgba(102,217,255,0.25)' }}
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Moon className="w-4 h-4" /> Save Sleep Log</>}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}