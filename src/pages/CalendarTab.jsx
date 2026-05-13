import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flame, Dumbbell, Trophy, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarTab() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const todayStr = today.toISOString().split('T')[0];

  const { data: sessions } = useQuery({
    queryKey: ['sessions-calendar'],
    queryFn: () => base44.entities.WorkoutSession.list('-date', 200),
    initialData: [],
  });

  const { data: prs } = useQuery({
    queryKey: ['prs-calendar'],
    queryFn: () => base44.entities.PersonalRecord.list('-date', 50),
    initialData: [],
  });

  const completedDates = new Set(sessions.filter(s => s.status === 'completed').map(s => s.date));
  const prDates = new Set(prs.map(p => p.date));

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build calendar grid
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthStr = (d) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${viewYear}-${mm}-${dd}`;
  };

  // Streak calculation
  const completedArr = [...completedDates].sort().reverse();
  let streak = 0;
  const checkDate = new Date(today);
  for (let i = 0; i < completedArr.length; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (completedDates.has(dateStr)) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
    else if (i === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (completedDates.has(checkDate.toISOString().split('T')[0])) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
      else break;
    } else break;
  }

  // Recent sessions list
  const recentSessions = sessions.filter(s => s.status === 'completed').slice(0, 10);

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-10">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1">Training</p>
        <h1
          className="text-3xl font-black tracking-tight"
          style={{ background: 'linear-gradient(135deg, #ffffff 0%, #66D9FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
        >
          Schedule
        </h1>
        <div className="mt-4 h-px w-full" style={{ background: 'linear-gradient(90deg, rgba(102,217,255,0.4) 0%, rgba(0,109,255,0.15) 60%, transparent 100%)' }} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Streak', value: `${streak}d`, icon: Flame, color: streak > 0 ? '#fb923c' : '#66D9FF' },
          { label: 'This Month', value: sessions.filter(s => s.status === 'completed' && s.date?.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`)).length, icon: Dumbbell, color: '#66D9FF' },
          { label: 'Total PRs', value: prs.length, icon: Trophy, color: '#fbbf24' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(10,12,18,0.8)', border: '1px solid rgba(102,217,255,0.1)' }}>
            <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color }} />
            <div className="text-2xl font-black text-foreground">{value}</div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Calendar card */}
      <div className="rounded-3xl p-5 mb-6"
        style={{ background: 'rgba(10,12,18,0.85)', border: '1px solid rgba(102,217,255,0.12)', backdropFilter: 'blur(12px)' }}>
        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:text-foreground text-muted-foreground"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-black text-base text-foreground">
            {MONTHS[viewMonth]} {viewYear}
          </h2>
          <button onClick={nextMonth} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:text-foreground text-muted-foreground"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} />;
            const dateStr = monthStr(d);
            const isToday = dateStr === todayStr;
            const isCompleted = completedDates.has(dateStr);
            const hasPR = prDates.has(dateStr);
            const isFuture = dateStr > todayStr;
            return (
              <div key={dateStr} className="flex flex-col items-center py-0.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center relative"
                  style={
                    isCompleted
                      ? { background: 'linear-gradient(135deg, #66D9FF, #006DFF)', boxShadow: '0 0 12px rgba(102,217,255,0.4)' }
                      : isToday
                      ? { background: 'rgba(102,217,255,0.1)', border: '1.5px solid rgba(102,217,255,0.5)' }
                      : { background: 'transparent' }
                  }
                >
                  <span className="text-xs font-bold"
                    style={{ color: isCompleted ? '#030508' : isToday ? '#66D9FF' : isFuture ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)' }}>
                    {d}
                  </span>
                  {hasPR && (
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                      style={{ background: '#fbbf24', border: '1px solid rgba(0,0,0,0.3)' }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg, #66D9FF, #006DFF)' }} />
            <span className="text-[10px] text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#fbbf24' }} />
            <span className="text-[10px] text-muted-foreground">PR set</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border" style={{ borderColor: 'rgba(102,217,255,0.5)' }} />
            <span className="text-[10px] text-muted-foreground">Today</span>
          </div>
        </div>
      </div>

      {/* Recent sessions */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">Recent Sessions</p>
        {recentSessions.length === 0 ? (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(10,12,18,0.6)', border: '1px dashed rgba(102,217,255,0.1)' }}>
            <Dumbbell className="w-7 h-7 mx-auto mb-2 opacity-20 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No completed sessions yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                style={{ background: 'rgba(10,12,18,0.85)', border: '1px solid rgba(102,217,255,0.09)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(102,217,255,0.08)', border: '1px solid rgba(102,217,255,0.15)' }}>
                    <Check className="w-3.5 h-3.5" style={{ color: '#66D9FF' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{s.workout_name}</p>
                    <p className="text-xs text-muted-foreground">{s.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  {s.total_volume > 0 && <p className="text-xs font-bold" style={{ color: '#66D9FF' }}>{(s.total_volume / 1000).toFixed(1)}k vol</p>}
                  {s.prs_count > 0 && <p className="text-[10px] font-semibold text-yellow-400">{s.prs_count} PR{s.prs_count > 1 ? 's' : ''}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}