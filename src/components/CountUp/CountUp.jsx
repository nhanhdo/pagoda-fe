import { useEffect, useRef, useState } from 'react';

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Animates from the previous value to `end` with an ease-out curve. */
export function useCountUp(end, duration = 900) {
  const target = Number(end) || 0;
  const [value, setValue] = useState(prefersReduced() ? target : 0);
  const fromRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (prefersReduced()) { setValue(target); fromRef.current = target; return undefined; }
    const from = fromRef.current;
    if (from === target) { setValue(target); return undefined; }
    let start = null;
    const tick = (now) => {
      if (start === null) start = now;
      const p = Math.min((now - start) / duration, 1);
      const v = from + (target - from) * (1 - Math.pow(1 - p, 3));
      setValue(v);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = target;
    };
  }, [target, duration]);

  return value;
}

/**
 * Renders an animated number. `format` receives the in-flight value, so units
 * and currency stay intact while counting ("180h", "12.500.000 ₫", "12,5 triệu").
 */
export default function CountUp({ value, format, duration = 900, decimals = 0 }) {
  const v = useCountUp(value, duration);
  const rounded = decimals > 0 ? Number(v.toFixed(decimals)) : Math.round(v);
  return format ? format(rounded) : rounded.toLocaleString('vi-VN');
}
