import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import './PageSpinner.css';

const PETALS = [
  { angle: -62, fill: 'url(#psPetalOuter)', delay: 0.48 },
  { angle:  62, fill: 'url(#psPetalOuter)', delay: 0.48 },
  { angle: -31, fill: 'url(#psPetalSide)',  delay: 0.24 },
  { angle:  31, fill: 'url(#psPetalSide)',  delay: 0.24 },
  { angle:   0, fill: 'url(#psPetalCore)',  delay: 0 },
];

export default function PageSpinner({ delay = 120, label }) {
  const { t } = useLanguage();
  const text = label || (t.common.loading || 'Đang tải').replace(/\.+$/, '');
  const [visible, setVisible] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return;
    const id = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(id);
  }, [delay]);

  return (
    <div className={`ps-root${visible ? ' is-visible' : ''}`} role="status" aria-live="polite">
      <div className="ps-loader" aria-hidden="true">
        <span className="ps-glow" />
        <span className="ps-ring" />
        <span className="ps-ring ps-ring--soft" />
        <svg className="ps-lotus" viewBox="0 0 64 64">
          <defs>
            <linearGradient id="psPetalCore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd6b5" />
              <stop offset="100%" stopColor="#e98a6a" />
            </linearGradient>
            <linearGradient id="psPetalSide" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffe2c6" />
              <stop offset="100%" stopColor="#e9a172" />
            </linearGradient>
            <linearGradient id="psPetalOuter" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff0de" />
              <stop offset="100%" stopColor="#efbd8c" />
            </linearGradient>
          </defs>
          {PETALS.map(p => (
            <g key={p.angle} transform={`rotate(${p.angle} 32 44)`}>
              <path
                className="ps-petal"
                style={{ animationDelay: `${p.delay}s` }}
                d="M32 14 C39.5 23 39.5 35 32 44 C24.5 35 24.5 23 32 14 Z"
                fill={p.fill}
              />
            </g>
          ))}
          <path d="M17 46 Q32 53 47 46" fill="none" stroke="#e0a454" strokeWidth="2.2" strokeLinecap="round" />
          <circle className="ps-seed" cx="32" cy="41" r="2.4" fill="#fff6e6" />
        </svg>
      </div>

      <div className="ps-text">
        <span className="ps-label">{text}</span>
        <span className="ps-dots"><i /><i /><i /></span>
      </div>
      <div className="ps-mantra">Nam Mô A Di Đà Phật</div>
    </div>
  );
}
