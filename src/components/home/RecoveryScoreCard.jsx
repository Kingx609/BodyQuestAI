import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Zap, Activity } from 'lucide-react';

function ScoreArc({ score }) {
  const clamp = Math.max(0, Math.min(100, score));
  const r = 52;
  const circ = Math.PI * r; // half-circle
  const dash = (clamp / 100) * circ;
  const color = clamp >= 75 ? '#66D9FF' : clamp >= 45 ? '#fbbf24' : '#f87171';
  const glow = clamp >= 75 ? 'rgba(102,217,255,0.6)' : clamp >= 45 ? 'rgba(251,191,36,0.6)' : 'rgba(248,113,113,0.5)';
  const label = clamp >= 75 ? 'Optimal' : clamp >= 45 ? 'Moderate' : 'Low';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 128, height: 72 }}>
        <svg width="128" height="72" viewBox="0 0 128 72">
          {/* Track */}
          <path
            d="M 8 68 A 56 56 0 0 1 120 68"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Fill */}
          <path
            d="M 8 68 A 56 56 0 0 1 120 68"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ filter: `drop-shadow(0 0 6px ${glow})`, transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-3xl font-black leading-none" style={{ color }}>{clamp}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
        </div>
      </div>
    </div>
  );
}

export default function RecoveryScoreCard({ sleepLogs, sessions }) {
  // Compute a simple recovery score from recent sleep + workout spacing
  const latestSleep = sleepLogs?.[0];
  const quality = latestSleep?.quality || 0;
  const duration = latestSleep?.duration_hours || 0;

  // Base score from sleep
  let score = 50;
  if (duration >= 7.5) score += 25;
  else if (duration >= 6) score += 12;
  else if (duration > 0) score -= 10;

  if (quality >= 8) score += 15;
  else if (quality >= 6) score += 8;
  else if (quality > 0) score -= 5;

  // Boost if no session yesterday (rest day)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const trainedYesterday = sessions?.some(s => s.date === yesterdayStr && s.status === 'completed');
  if (!trainedYesterday) score += 10;

  score = Math.max(0, Math.min(100, Math.round(score)));
  const noData = !latestSleep;

  return (
    <div
      className="rounded-3xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(10,14,26,0.97) 0%, rgba(0,20,50,0.93) 100%)',
        border: '1px solid rgba(102,217,255,0.18)',
        boxShadow: '0 0 50px rgba(0,109,255,0.1), inset 0 1px 0 rgba(102,217,255,0.1)',
      }}
    >
      <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.07) 0%, transparent 65%)', transform: 'translate(25%,-25%)' }} />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-0.5">Recovery</p>
          <h3 className="font-black text-lg text-foreground">Readiness Score</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
          style={{ background: 'rgba(102,217,255,0.07)', border: '1px solid rgba(102,217,255,0.18)', color: '#66D9FF' }}>
          <Activity className="w-3 h-3" /> Live
        </div>
      </div>

      {noData ? (
        <div className="relative z-10 text-center py-4">
          <Moon className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground mb-3">Log your sleep to see your recovery score.</p>
          <Link to="/nutrition">
            <button
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest"
              style={{ background: 'rgba(102,217,255,0.1)', border: '1px solid rgba(102,217,255,0.25)', color: '#66D9FF' }}
            >
              Log Sleep
            </button>
          </Link>
        </div>
      ) : (
        <div className="relative z-10">
          <ScoreArc score={score} />
          <div className="flex items-center justify-around mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-center">
              <p className="text-sm font-black text-foreground">{duration > 0 ? `${duration}h` : '—'}</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">Sleep</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-sm font-black text-foreground">{quality > 0 ? `${quality}/10` : '—'}</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">Quality</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-sm font-black" style={{ color: trainedYesterday ? '#f87171' : '#66D9FF' }}>
                {trainedYesterday ? 'Active' : 'Rested'}
              </p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">Yesterday</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}