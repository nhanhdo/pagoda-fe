import React from 'react';

export default function LotusEmpty({ description = 'Không có dữ liệu', size = 100 }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '28px 0', gap: 10,
      userSelect: 'none',
    }}>
      <svg
        width={size} height={size * 0.82}
        viewBox="0 0 220 180"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        stroke="#c4956a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.65 }}
      >
        {/* ── Central petal ── */}
        <path d="M110,14 C102,30 96,52 96,72 C96,85 102,94 110,96 C118,94 124,85 124,72 C124,52 118,30 110,14 Z" />

        {/* ── Left inner petal ── */}
        <path d="M108,28 C94,36 80,54 76,72 C74,83 78,91 88,94 C97,92 104,83 106,73" />

        {/* ── Right inner petal ── */}
        <path d="M112,28 C126,36 140,54 144,72 C146,83 142,91 132,94 C123,92 116,83 114,73" />

        {/* ── Left outer petal ── */}
        <path d="M88,94 C72,90 46,78 34,60 C26,48 30,36 42,38 C55,40 74,62 86,90" />

        {/* ── Right outer petal ── */}
        <path d="M132,94 C148,90 174,78 186,60 C194,48 190,36 178,38 C165,40 146,62 134,90" />

        {/* ── Base arc 1 ── */}
        <path d="M42,97 C64,107 86,112 110,112 C134,112 156,107 178,97" />

        {/* ── Base arc 2 ── */}
        <path d="M56,108 C74,122 92,128 110,130 C128,128 146,122 164,108" />

        {/* ── Base arc 3 (bottom) ── */}
        <path d="M70,118 C84,136 98,143 110,146 C122,143 136,136 150,118" />

        {/* ── Left swirl ── */}
        <path d="M36,97 C22,96 14,86 18,77 C23,67 35,70 35,79 C35,84 30,87 25,84" />

        {/* ── Right swirl ── */}
        <path d="M184,97 C198,96 206,86 202,77 C197,67 185,70 185,79 C185,84 190,87 195,84" />

        {/* ── Center jewel dot ── */}
        <circle cx="110" cy="86" r="4" />
      </svg>

      <span style={{
        fontSize: 13, color: '#b08060', fontStyle: 'italic', letterSpacing: 0.3,
      }}>
        {description}
      </span>
    </div>
  );
}
