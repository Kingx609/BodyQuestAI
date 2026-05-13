import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import BodyOutlineBackground from './BodyOutlineBackground';

export default function AppLayout() {
  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Fixed body outline background */}
      <BodyOutlineBackground />

      {/* Scrollable content layer */}
      <div
        id="main-scroll"
        className="relative z-10 h-full overflow-y-auto pb-20"
        style={{ scrollbarWidth: 'thin' }}
      >
        <Outlet />
      </div>

      {/* Bottom nav always on top */}
      <BottomNav />
    </div>
  );
}