import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import './LotusEmpty.css';

const PETALS = [
  { a: -60, fill: 'url(#leOuter)' },
  { a: 60,  fill: 'url(#leOuter)' },
  { a: -30, fill: 'url(#leSide)' },
  { a: 30,  fill: 'url(#leSide)' },
  { a: 0,   fill: 'url(#leCore)' },
];

function LotusArt({ size }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="leCore" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffdcc0" />
          <stop offset="100%" stopColor="#eb9a76" />
        </linearGradient>
        <linearGradient id="leSide" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe8d2" />
          <stop offset="100%" stopColor="#eeae86" />
        </linearGradient>
        <linearGradient id="leOuter" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff2e3" />
          <stop offset="100%" stopColor="#f2c79e" />
        </linearGradient>
      </defs>
      {PETALS.map(p => (
        <g key={p.a} transform={`rotate(${p.a} 32 45)`}>
          <path d="M32 14 C39.5 23 39.5 35 32 45 C24.5 35 24.5 23 32 14 Z" fill={p.fill} />
        </g>
      ))}
      <path d="M15 47 Q32 54.5 49 47" fill="none" stroke="#e3ab63" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M22 52 Q32 56.5 42 52" fill="none" stroke="#e3ab63" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}

export default function LotusEmpty({ description, hint, compact = false }) {
  const { t } = useLanguage();
  const title = description || t.common.noData;
  const sub = hint ?? t.common.noDataHint;

  if (compact) {
    return (
      <div className="le-compact">
        <LotusArt size={28} />
        <span>{title}</span>
      </div>
    );
  }

  return (
    <div className="le-root">
      <div className="le-art">
        <span className="le-halo" />
        <span className="le-ring" />
        <span className="le-spark le-spark--1" />
        <span className="le-spark le-spark--2" />
        <span className="le-spark le-spark--3" />
        <div className="le-lotus"><LotusArt size={58} /></div>
      </div>
      <div className="le-title">{title}</div>
      {sub && <div className="le-hint">{sub}</div>}
    </div>
  );
}
