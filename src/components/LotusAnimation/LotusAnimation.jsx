import React, { useMemo } from 'react';

/* Golden orbs that float upward — like incense sparks / offering lights */
export default function FloatingOrbs({ count = 22, zIndex = 0, contained = false }) {
  const orbs = useMemo(() => (
    Array.from({ length: count }, (_, i) => {
      const size = 2.5 + Math.random() * 9;
      const bright = Math.random() > 0.45;
      const isLarge = size > 7;
      return {
        id: i,
        left: Math.random() * 100,
        size,
        color: bright
          ? `rgba(212,160,23,${0.55 + Math.random() * 0.38})`
          : `rgba(255,200,80,${0.22 + Math.random() * 0.28})`,
        glow: isLarge
          ? `0 0 ${size * 3}px rgba(212,160,23,0.65), 0 0 ${size}px rgba(255,210,80,0.4)`
          : `0 0 ${size * 2}px rgba(212,160,23,0.45)`,
        riseDuration: 10 + Math.random() * 16,
        swayDuration: 2.8 + Math.random() * 4,
        swayAmount: 10 + Math.random() * 38,
        delay: -(Math.random() * 24),
        blur: size < 4.5 ? Math.random() * 1.2 : 0,
      };
    })
  ), [count]);

  const pos = contained ? 'absolute' : 'fixed';

  return (
    <>
      <style>{`
        @keyframes orb-rise {
          0%   { bottom: -16px; opacity: 0; }
          7%   { opacity: 1; }
          86%  { opacity: 0.75; }
          100% { bottom: 108%; opacity: 0; }
        }
        @keyframes orb-sway {
          0%   { margin-left: 0; }
          25%  { margin-left: var(--osw); }
          75%  { margin-left: calc(0px - var(--osw)); }
          100% { margin-left: 0; }
        }
        .float-orb {
          pointer-events: none;
          border-radius: 50%;
          animation: orb-rise linear infinite, orb-sway ease-in-out infinite;
        }
      `}</style>
      {orbs.map(orb => (
        <div
          key={orb.id}
          className="float-orb"
          style={{
            position: pos,
            left: `${orb.left}%`,
            width: orb.size,
            height: orb.size,
            background: orb.color,
            boxShadow: orb.glow,
            filter: orb.blur > 0 ? `blur(${orb.blur}px)` : undefined,
            zIndex,
            '--osw': `${orb.swayAmount}px`,
            animationDuration: `${orb.riseDuration}s, ${orb.swayDuration}s`,
            animationDelay: `${orb.delay}s, ${orb.delay}s`,
          }}
        />
      ))}
    </>
  );
}
