import React, { useState, useEffect } from 'react';

const SPOKES = [0, 45, 90, 135, 180, 225, 270, 315];

export default function PageSpinner({ delay = 120 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 28,
      zIndex: 50,
      background: 'rgba(253,248,242,0.95)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.2s ease',
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      {/* ── Dharma Wheel (Pháp Luân) ── */}
      <div style={{ position: 'relative', width: 100, height: 100 }}>

        {/* ambient glow — delayed so it doesn't fight the fade-in */}
        <div style={{
          position: 'absolute',
          inset: -20,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,196,77,0.28) 0%, transparent 70%)',
          animation: 'glow-pulse 2.4s ease-in-out 0.3s infinite',
          pointerEvents: 'none',
        }} />

        {/* rotating wheel */}
        <svg
          viewBox="0 0 110 110"
          width="100"
          height="100"
          style={{ animation: 'dharma-spin 5s linear infinite', display: 'block' }}
        >
          <defs>
            <radialGradient id="ps-gold" cx="38%" cy="32%" r="68%">
              <stop offset="0%"   stopColor="#fff3c4" />
              <stop offset="45%"  stopColor="#ffc44d" />
              <stop offset="100%" stopColor="#8B4513" />
            </radialGradient>
            <radialGradient id="ps-hub" cx="38%" cy="32%" r="68%">
              <stop offset="0%"   stopColor="#ffd59e" />
              <stop offset="100%" stopColor="#c85000" />
            </radialGradient>
            <filter id="ps-spoke-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* outer rim */}
          <circle cx="55" cy="55" r="48"
            fill="none" stroke="url(#ps-gold)" strokeWidth="4.5" />

          {/* 8 spokes */}
          <g filter="url(#ps-spoke-glow)">
            {SPOKES.map(a => {
              const r = a * Math.PI / 180;
              return (
                <line key={a}
                  x1={55 + 11 * Math.cos(r)} y1={55 + 11 * Math.sin(r)}
                  x2={55 + 43 * Math.cos(r)} y2={55 + 43 * Math.sin(r)}
                  stroke="url(#ps-gold)" strokeWidth="3" strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* inner ring */}
          <circle cx="55" cy="55" r="24"
            fill="none" stroke="url(#ps-gold)" strokeWidth="2.5" />

          {/* 8 dots on rim */}
          {SPOKES.map(a => {
            const r = a * Math.PI / 180;
            return (
              <circle key={`d${a}`}
                cx={55 + 48 * Math.cos(r)} cy={55 + 48 * Math.sin(r)}
                r="4.5" fill="url(#ps-gold)"
              />
            );
          })}

          {/* center hub */}
          <circle cx="55" cy="55" r="10" fill="url(#ps-hub)" />
          <circle cx="52" cy="52" r="3.5" fill="rgba(255,255,255,0.65)" />
        </svg>
      </div>

      {/* ── Text ── */}
      <div style={{ textAlign: 'center', userSelect: 'none' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#8B4513', letterSpacing: 2.5, marginBottom: 8 }}>
          <span className="ps-dots">Đang tải</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(139,69,19,0.5)', letterSpacing: 3, fontStyle: 'italic' }}>
          ☸ Nam Mô A Di Đà Phật ☸
        </div>
      </div>
    </div>
  );
}
