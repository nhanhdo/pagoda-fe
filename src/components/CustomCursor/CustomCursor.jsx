import React, { useEffect, useRef } from 'react';

const CLICKABLE = 'button, a, [role="button"], [role="menuitem"], [role="tab"], [role="radio"], label, summary, select,'
  + ' .ant-btn, .ant-select-selector, .ant-picker, .ant-segmented-item, .ant-pagination-item, .ant-tabs-tab,'
  + ' .ant-dropdown-menu-item, .ant-table-row, .ant-checkbox-wrapper, .ant-radio-wrapper, .ant-switch';
const TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]';

export default function CustomCursor() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return undefined;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ease = reduced ? 1 : 0.28;

    let mx = -100, my = -100, rx = -100, ry = -100;
    let visible = false;
    let rafId;

    const setState = (cls, on) => {
      dot.classList.toggle(cls, on);
      ring.classList.toggle(cls, on);
    };

    const move = (e) => {
      mx = e.clientX; my = e.clientY;
      if (!visible) {
        visible = true;
        rx = mx; ry = my;
        setState('is-hidden', false);
      }
    };
    const over = (e) => {
      const el = e.target instanceof Element ? e.target : null;
      const isText = !!el?.closest(TEXT);
      const isClick = !isText && !!el?.closest(CLICKABLE);
      setState('is-text', isText);
      setState('is-hover', isClick);
    };
    const down = () => setState('is-down', true);
    const up = () => setState('is-down', false);
    const leave = () => { visible = false; setState('is-hidden', true); };

    const tick = () => {
      rx += (mx - rx) * ease;
      ry += (my - ry) * ease;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      rafId = requestAnimationFrame(tick);
    };

    document.documentElement.classList.add('has-custom-cursor');
    document.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mouseover', over, { passive: true });
    document.addEventListener('mousedown', down);
    document.addEventListener('mouseup', up);
    document.documentElement.addEventListener('mouseleave', leave);
    window.addEventListener('blur', leave);
    rafId = requestAnimationFrame(tick);

    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseover', over);
      document.removeEventListener('mousedown', down);
      document.removeEventListener('mouseup', up);
      document.documentElement.removeEventListener('mouseleave', leave);
      window.removeEventListener('blur', leave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cc-ring is-hidden" aria-hidden="true"><span /></div>
      <div ref={dotRef} className="cc-dot is-hidden" aria-hidden="true"><span /></div>
    </>
  );
}
