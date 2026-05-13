import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

const MALE_IMG = 'https://media.base44.com/images/public/69fb38375017cb21fba9794c/10caf9413_generated_image.png';
const FEMALE_IMG = 'https://media.base44.com/images/public/69fb38375017cb21fba9794c/57e73ca27_generated_image.png';

export default function BodyOutlineBackground() {
  const [gender, setGender] = useState('male');
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.gender === 'female') setGender('female');
      else setGender('male');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll');
    if (!scrollEl) return;
    const handler = () => setScrollY(scrollEl.scrollTop);
    scrollEl.addEventListener('scroll', handler, { passive: true });
    return () => scrollEl.removeEventListener('scroll', handler);
  }, []);

  // As user scrolls down, body becomes more visible (opacity increases)
  const baseOpacity = 0.08;
  const maxOpacity = 0.22;
  const scrollFactor = Math.min(scrollY / 400, 1);
  const opacity = baseOpacity + (maxOpacity - baseOpacity) * scrollFactor;

  const img = gender === 'female' ? FEMALE_IMG : MALE_IMG;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 flex flex-col items-center justify-end overflow-hidden"
      aria-hidden="true"
    >
      {/* Glow aura behind body */}
      <div
        className="absolute bottom-16 left-1/2 -translate-x-1/2 w-72 h-[70vh] rounded-full transition-all duration-700"
        style={{
          opacity: opacity * 0.8,
          background: 'radial-gradient(ellipse at center, rgba(0,109,255,0.18) 0%, rgba(102,217,255,0.08) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Body image */}
      <img
        src={img}
        alt="body outline"
        className="absolute bottom-14 left-1/2 -translate-x-1/2 h-[82vh] w-auto object-contain transition-opacity duration-700 select-none"
        style={{ opacity, mixBlendMode: 'screen' }}
        draggable={false}
      />

      {/* Bottom tagline */}
      <div
        className="absolute bottom-20 left-0 right-0 flex justify-center transition-all duration-700"
        style={{ opacity: Math.max(0, opacity - 0.04) }}
      >
        <p
          className="text-xs tracking-[0.35em] uppercase text-center font-light"
          style={{
            color: 'rgba(102,217,255,0.55)',
            fontFamily: "'Inter', sans-serif",
            letterSpacing: '0.3em',
            textShadow: '0 0 12px rgba(102,217,255,0.4)',
          }}
        >
          Consistency is the only way there.
        </p>
      </div>
    </div>
  );
}