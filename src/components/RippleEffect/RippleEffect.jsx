import { useEffect } from 'react';

export default function RippleEffect() {
  useEffect(() => {
    const handleClick = (e) => {
      // 3 vòng lan ra với delay khác nhau — giống mặt nước
      [0, 100, 210].forEach((delay, i) => {
        const el = document.createElement('div');
        el.className = 'click-ripple';
        el.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;animation-delay:${delay}ms;`;
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove(), { once: true });
      });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}
