import React, { useRef, useEffect } from 'react';

const COLORS = [
  'rgba(255,196,77,',
  'rgba(255,140,50,',
  'rgba(255,220,130,',
  'rgba(212,150,20,',
];

function mkParticle(W, H, fromBottom = false) {
  return {
    x: Math.random() * W,
    y: fromBottom ? H + Math.random() * 20 : Math.random() * H,
    r: Math.random() * 2.2 + 0.6,
    vy: -(Math.random() * 0.32 + 0.10),
    vx: (Math.random() - 0.5) * 0.07,
    op: Math.random() * 0.16 + 0.05,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    wobble: Math.random() * Math.PI * 2,
    ws: Math.random() * 0.007 + 0.002,
  };
}

export default function ParticleCanvas({ count = 30, style }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const particles = Array.from({ length: count }, () => mkParticle(W(), H()));

    function draw() {
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.wobble += p.ws;
        p.x += Math.sin(p.wobble) * 0.45 + p.vx;
        p.y += p.vy;
        if (p.y < -8) {
          particles[i] = mkParticle(w, h, true);
          continue;
        }
        ctx.globalAlpha = p.op;
        ctx.fillStyle = p.color + '1)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [count]);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        willChange: 'contents',
        ...style,
      }}
    />
  );
}
