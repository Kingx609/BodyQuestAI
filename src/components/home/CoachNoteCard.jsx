import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MessageCircle, Zap } from 'lucide-react';

export default function CoachNoteCard({ note }) {
  return (
    <div
      className="rounded-3xl p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(10,14,26,0.97) 0%, rgba(0,20,50,0.95) 100%)',
        border: '1px solid rgba(102,217,255,0.25)',
        boxShadow: '0 0 60px rgba(0,109,255,0.12), 0 0 20px rgba(102,217,255,0.06), inset 0 1px 0 rgba(102,217,255,0.12)',
      }}
    >
      {/* Corner glow top-right */}
      <div className="absolute top-0 right-0 w-52 h-52 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(102,217,255,0.1) 0%, transparent 65%)', transform: 'translate(30%,-30%)' }} />
      {/* Bottom-left accent */}
      <div className="absolute bottom-0 left-0 w-36 h-36 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,109,255,0.08) 0%, transparent 70%)', transform: 'translate(-20%,20%)' }} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(102,217,255,0.1)', border: '1px solid rgba(102,217,255,0.3)', boxShadow: '0 0 14px rgba(102,217,255,0.2)' }}
        >
          <Sparkles className="w-5 h-5" style={{ color: '#66D9FF', filter: 'drop-shadow(0 0 6px rgba(102,217,255,0.8))' }} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">AI Powered</p>
          <h3
            className="text-lg font-black tracking-tight leading-none"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #66D9FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Titan
          </h3>
        </div>
        <div className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(102,217,255,0.08)', border: '1px solid rgba(102,217,255,0.2)', color: '#66D9FF' }}>
          <Zap className="w-3 h-3" /> Live
        </div>
      </div>

      {/* Message card */}
      <div
        className="rounded-2xl px-4 py-4 mb-5 relative z-10"
        style={{
          background: 'rgba(102,217,255,0.04)',
          border: '1px solid rgba(102,217,255,0.12)',
          boxShadow: 'inset 0 1px 0 rgba(102,217,255,0.08)',
        }}
      >
        {/* Typing cursor decoration */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#66D9FF', boxShadow: '0 0 6px rgba(102,217,255,0.8)' }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(102,217,255,0.4)' }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(102,217,255,0.2)' }} />
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">
          {note || "Welcome to BodyQuest AI. Start your first workout and I'll have personalized insights for you. Let's build something great together."}
        </p>
      </div>

      {/* CTA */}
      <Link to="/titan" className="relative z-10 block">
        <button
          className="w-full h-14 rounded-2xl font-black text-base uppercase tracking-widest flex items-center justify-center gap-3"
          style={{
            background: 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)',
            color: '#030508',
            border: 'none',
            boxShadow: '0 0 30px rgba(102,217,255,0.35), 0 0 60px rgba(0,109,255,0.2), 0 4px 20px rgba(0,0,0,0.4)',
            letterSpacing: '0.1em',
          }}
        >
          <MessageCircle className="w-5 h-5" />
          Talk to Titan
        </button>
      </Link>
    </div>
  );
}