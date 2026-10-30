import React, { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const r1Ref  = useRef(null);
  const r2Ref  = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    const r1  = r1Ref.current;
    const r2  = r2Ref.current;
    if (!dot || !r1 || !r2) return;

    let mx = -300, my = -300;
    let x1 = -300, y1 = -300;
    let x2 = -300, y2 = -300;
    let rafId;
    let pressing = false;

    const move = (e) => { mx = e.clientX; my = e.clientY; };

    const down = () => {
      pressing = true;
      dot.style.transform = 'translate(-50%,-50%) scale(0.4)';
      r1.style.transform  = 'translate(-50%,-50%) scale(2)';
      r1.style.opacity    = '0.28';
    };
    const up = () => {
      pressing = false;
      dot.style.transform = '';
      r1.style.transform  = '';
      r1.style.opacity    = '';
    };

    const over = (e) => {
      const clickable = e.target.closest(
        'button, a, [role="button"], [tabindex="0"], label,' +
        ' .ant-btn, .ant-menu-item, .ant-select-selector,' +
        ' .ant-card.kpi-card, .overview-row, .quick-action-item'
      );
      if (clickable) {
        dot.classList.add('cc-hover');
        r1.classList.add('cc-hover');
      } else {
        dot.classList.remove('cc-hover');
        r1.classList.remove('cc-hover');
      }
    };

    const leave = () => {
      dot.style.opacity = '0';
      r1.style.opacity  = '0';
      r2.style.opacity  = '0';
    };
    const enter = () => {
      dot.style.opacity = '';
      r1.style.opacity  = pressing ? '0.28' : '';
      r2.style.opacity  = '';
    };

    const tick = () => {
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';

      // Ring 1 — medium lag (lerp 14%)
      x1 += (mx - x1) * 0.14;
      y1 += (my - y1) * 0.14;
      r1.style.left = x1 + 'px';
      r1.style.top  = y1 + 'px';

      // Ring 2 — slow lag (lerp 6%)
      x2 += (mx - x2) * 0.06;
      y2 += (my - y2) * 0.06;
      r2.style.left = x2 + 'px';
      r2.style.top  = y2 + 'px';

      rafId = requestAnimationFrame(tick);
    };

    document.addEventListener('mousemove',   move,  { passive: true });
    document.addEventListener('mousedown',   down);
    document.addEventListener('mouseup',     up);
    document.addEventListener('mouseover',   over,  { passive: true });
    document.addEventListener('mouseleave',  leave);
    document.addEventListener('mouseenter',  enter);
    rafId = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener('mousemove',  move);
      document.removeEventListener('mousedown',  down);
      document.removeEventListener('mouseup',    up);
      document.removeEventListener('mouseover',  over);
      document.removeEventListener('mouseleave', leave);
      document.removeEventListener('mouseenter', enter);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div ref={dotRef}  className="cc-dot"  />
      <div ref={r1Ref}   className="cc-ring1" />
      <div ref={r2Ref}   className="cc-ring2" />
    </>
  );
}
