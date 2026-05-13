import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Apple, BarChart2 } from 'lucide-react';

// Titan glowing orb — center tab icon
function TitanOrbNav({ active }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 54, height: 54 }}
    >
      {/* Outer glow ring */}
      {active && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'rgba(102,217,255,0.22)',
            filter: 'blur(10px)',
            transform: 'scale(1.5)',
          }}
        />
      )}
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: 54,
          height: 54,
          background: active
            ? 'linear-gradient(135deg, #66D9FF 0%, #006DFF 100%)'
            : 'linear-gradient(135deg, rgba(102,217,255,0.15) 0%, rgba(0,109,255,0.2) 100%)',
          border: active
            ? '1.5px solid rgba(102,217,255,0.9)'
            : '1.5px solid rgba(102,217,255,0.3)',
          boxShadow: active
            ? '0 0 28px rgba(102,217,255,0.65), 0 0 60px rgba(0,109,255,0.35)'
            : '0 0 12px rgba(102,217,255,0.18)',
          transition: 'all 0.25s ease',
        }}
      >
        {/* Stylized T shape */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 6h16v2.5H14v9.5h-4V8.5H4z"
            fill={active ? '#030508' : '#66D9FF'}
            opacity="0.92"
          />
        </svg>
        {/* Highlight gloss */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 32%, rgba(255,255,255,0.28) 0%, transparent 55%)',
          }}
        />
      </div>
    </div>
  );
}

const LEFT_TABS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/workout', label: 'Fitness', icon: Dumbbell },
];

const RIGHT_TABS = [
  { path: '/nutrition', label: 'Nutrition', icon: Apple },
  { path: '/progress', label: 'Progress', icon: BarChart2 },
];

export default function BottomNav() {
  const location = useLocation();

  if (
    location.pathname.startsWith('/active-workout') ||
    location.pathname.startsWith('/onboarding') ||
    location.pathname.startsWith('/post-workout')
  ) {
    return null;
  }

  const isTitanActive = location.pathname === '/titan';

  const renderTab = ({ path, label, icon: Icon }) => {
    const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
    return (
      <Link
        key={path}
        to={path}
        className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all duration-200"
        style={{ color: isActive ? '#66D9FF' : 'rgba(255,255,255,0.32)' }}
      >
        <div
          className="p-1.5 rounded-xl transition-all duration-200"
          style={isActive ? { background: 'rgba(102,217,255,0.1)' } : {}}
        >
          <Icon
            className="w-5 h-5"
            strokeWidth={isActive ? 2.5 : 1.5}
            style={isActive ? { filter: 'drop-shadow(0 0 5px rgba(102,217,255,0.55))' } : {}}
          />
        </div>
        <span
          className="text-[9px] font-semibold uppercase tracking-wider"
          style={{ color: isActive ? '#66D9FF' : 'rgba(255,255,255,0.28)' }}
        >
          {label}
        </span>
      </Link>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(5,7,12,0.96)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(102,217,255,0.1)',
      }}
    >
      <div className="flex items-end justify-around max-w-lg mx-auto px-2" style={{ height: 68 }}>
        {/* Left tabs */}
        {LEFT_TABS.map(renderTab)}

        {/* Center Titan tab */}
        <Link
          to="/titan"
          className="flex flex-col items-center justify-end gap-0.5 flex-1 transition-all duration-200"
          style={{ paddingBottom: 8 }}
        >
          <div style={{ transform: 'translateY(-10px)' }}>
            <TitanOrbNav active={isTitanActive} />
          </div>
          <span
            className="text-[9px] font-black uppercase"
            style={{
              color: isTitanActive ? '#66D9FF' : 'rgba(102,217,255,0.45)',
              marginTop: -14,
              letterSpacing: '0.18em',
              filter: isTitanActive ? 'drop-shadow(0 0 5px rgba(102,217,255,0.7))' : 'none',
            }}
          >
            Titan
          </span>
        </Link>

        {/* Right tabs */}
        {RIGHT_TABS.map(renderTab)}
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)', background: 'rgba(5,7,12,0.96)' }} />
    </nav>
  );
}