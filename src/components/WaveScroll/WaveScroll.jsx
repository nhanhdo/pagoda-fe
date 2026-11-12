import { useEffect } from 'react';

const CSS = `
  /* ── Vòng gợn nước khi scroll ── */
  @keyframes ws-ripple {
    0%   { width: 0;     height: 0;     opacity: 0.55; border-width: 2.5px; }
    50%  { opacity: 0.25; }
    100% { width: 320px; height: 320px; opacity: 0;    border-width: 1px; }
  }
  @keyframes ws-ripple2 {
    0%   { width: 0;     height: 0;     opacity: 0.3;  border-width: 2px; }
    100% { width: 200px; height: 200px; opacity: 0;    border-width: 1px; }
  }

  /* ── Wave-in reveal cho section/card ── */
  @keyframes ws-wave-in {
    0%   { opacity: 0; transform: translateY(36px) scaleY(0.97); }
    38%  { opacity: 1; transform: translateY(-7px)  scaleY(1.012); }
    62%  { transform: translateY(4px)  scaleY(0.996); }
    80%  { transform: translateY(-2px) scaleY(1.003); }
    100% { opacity: 1; transform: translateY(0)    scaleY(1); }
  }

  .ws-hidden {
    opacity: 0;
    transform: translateY(36px) scaleY(0.97);
    will-change: transform, opacity;
  }
  .ws-hidden.ws-visible {
    animation: ws-wave-in 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
`;

let styleEl = null;
let refCount = 0;

export default function WaveScroll({ selector = '.ws-target' }) {
  useEffect(() => {
    /* inject CSS once */
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'wave-scroll-css';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = CSS;
    refCount++;

    /* ── Intersection Observer: wave-in for elements ── */
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = parseFloat(el.dataset.waveDelay || 0);
            setTimeout(() => el.classList.add('ws-visible'), delay);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    const targets = document.querySelectorAll(selector);
    targets.forEach((el, i) => {
      el.classList.add('ws-hidden');
      el.dataset.waveDelay = (i % 4) * 80; // slight stagger per group
      observer.observe(el);
    });

    /* ── Scroll ripple circles ── */
    let lastScrollY = window.scrollY;
    let cooldown = false;

    const spawnRipple = (scrollY) => {
      const delta = Math.abs(scrollY - lastScrollY);
      if (delta < 15 || cooldown) return;
      lastScrollY = scrollY;
      cooldown = true;
      setTimeout(() => { cooldown = false; }, 220);

      const count = delta > 60 ? 2 : 1;
      for (let k = 0; k < count; k++) {
        const x = window.innerWidth * (0.2 + Math.random() * 0.6);
        const y = window.innerHeight * (0.3 + Math.random() * 0.4);
        const color = k === 0
          ? 'rgba(212,160,23,0.28)'   // gold
          : 'rgba(255,180,100,0.18)'; // warm

        const el = document.createElement('div');
        el.style.cssText = `
          position: fixed;
          left: ${x}px; top: ${y}px;
          width: 0; height: 0;
          border-radius: 50%;
          border: 2.5px solid ${color};
          transform: translate(-50%, -50%);
          animation: ${k === 0 ? 'ws-ripple' : 'ws-ripple2'} ${1.2 + k * 0.25}s ease-out forwards;
          pointer-events: none;
          z-index: 9997;
        `;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1600);
      }
    };

    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        spawnRipple(window.scrollY);
        rafId = null;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
      targets.forEach(el => {
        el.classList.remove('ws-hidden', 'ws-visible');
        delete el.dataset.waveDelay;
      });
      refCount--;
      if (refCount === 0 && styleEl) {
        document.head.removeChild(styleEl);
        styleEl = null;
      }
    };
  }, [selector]);

  return null;
}
