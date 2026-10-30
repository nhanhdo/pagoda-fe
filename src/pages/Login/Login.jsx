import React, { useState, useRef, useCallback } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';

const { Title, Text } = Typography;

/* ── Robot Lamp SVG ──────────────────────────────────── */
function RobotLamp({ lit }) {
  const circuit = lit ? 'rgba(0,200,255,0.75)' : 'rgba(0,150,230,0.65)';
  const smileColor = lit ? 'rgba(0,220,255,0.9)' : 'rgba(0,120,200,0.75)';

  return (
    <svg
      viewBox="0 0 220 315"
      aria-hidden="true"
      style={{
        width: 'clamp(160px, 38vw, 220px)',
        height: 'auto',
        filter: lit
          ? 'drop-shadow(0 0 18px rgba(0,150,255,0.5))'
          : 'drop-shadow(0 1px 5px rgba(0,0,0,0.7))',
        transition: 'filter 1.1s ease',
      }}
    >
      <defs>
        <radialGradient id="rlShade" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor={lit ? '#1a4a8a' : '#1c2e52'} />
          <stop offset="100%" stopColor={lit ? '#0b2058' : '#0c1838'} />
        </radialGradient>
        <radialGradient id="rlEye" cx="33%" cy="33%" r="65%">
          <stop offset="0%" stopColor={lit ? '#ffffff' : '#6a9eb8'} />
          <stop offset="40%" stopColor={lit ? '#48e4ff' : '#1e4d68'} />
          <stop offset="100%" stopColor={lit ? '#0066bb' : '#0d1e30'} />
        </radialGradient>
        <radialGradient id="rlOrb" cx="30%" cy="25%" r="68%">
          <stop offset="0%" stopColor={lit ? '#90eeff' : '#2a5a82'} />
          <stop offset="100%" stopColor={lit ? '#0077cc' : '#0d2040'} />
        </radialGradient>
        <radialGradient id="rlBase" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor={lit ? '#0e2248' : '#142035'} />
          <stop offset="100%" stopColor={lit ? '#070f28' : '#091220'} />
        </radialGradient>
        <filter id="rlEyeGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={lit ? '6' : '1'} result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="rlOrbGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={lit ? '7' : '2'} result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── SHADE ── */}
      <path d="M 68,32 L 152,32 L 180,152 L 40,152 Z" fill="url(#rlShade)" />
      <rect x="63" y="22" width="94" height="14" rx="4" fill={lit ? '#1a3560' : '#0a1428'} style={{transition:'fill 1.2s'}} />
      <rect x="67" y="22" width="86" height="8" rx="3" fill={lit ? '#223870' : '#0c1835'} style={{transition:'fill 1.2s'}} />

      {/* ── CIRCUIT TRACES ── */}
      <g stroke={circuit} strokeWidth="1.5" fill="none" strokeLinecap="round" style={{transition:'stroke 1.2s'}}>
        <polyline points="58,54 78,54 78,44 94,44" />
        <polyline points="58,68 70,68 70,78" />
        <polyline points="162,54 142,54 142,44 126,44" />
        <polyline points="162,68 150,68 150,78" />
        <polyline points="52,122 70,122 70,112 85,112" />
        <polyline points="168,122 150,122 150,112 135,112" />
      </g>
      <g fill={circuit} style={{transition:'fill 1.2s'}}>
        {[[78,54],[94,44],[70,78],[142,54],[126,44],[150,78],[70,122],[85,112],[150,122],[135,112]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="2.5" />
        ))}
      </g>

      {/* ── FACE ── */}
      <ellipse cx="88"  cy="108" rx="23" ry="21" fill="rgba(0,0,0,0.65)" />
      <ellipse cx="132" cy="108" rx="23" ry="21" fill="rgba(0,0,0,0.65)" />
      <circle cx="88"  cy="108" r="18" fill="url(#rlEye)" filter="url(#rlEyeGlow)" style={{transition:'fill 1.2s, filter 1.2s', transformBox:'fill-box', transformOrigin:'center', animation:lit?'eyeBlink 3s ease-in-out 0.5s infinite':'none'}} />
      <circle cx="132" cy="108" r="18" fill="url(#rlEye)" filter="url(#rlEyeGlow)" style={{transition:'fill 1.2s, filter 1.2s', transformBox:'fill-box', transformOrigin:'center', animation:lit?'eyeBlink 3s ease-in-out 0.5s infinite':'none'}} />
      <circle cx="82"  cy="102" r="5"  fill="rgba(255,255,255,0.8)" opacity={lit ? 0.95 : 0.1} style={{transition:'opacity 1.2s'}} />
      <circle cx="126" cy="102" r="5"  fill="rgba(255,255,255,0.8)" opacity={lit ? 0.95 : 0.1} style={{transition:'opacity 1.2s'}} />
      <path d="M 76,132 Q 110,150 144,132"
        fill="none" stroke={smileColor} strokeWidth="2.5" strokeLinecap="round"
        style={{transition:'stroke 1.2s'}}
      />

      {/* ── NECK ── */}
      <rect x="98" y="152" width="24" height="65" rx="4" fill="#0a1630" />
      <rect x="100" y="152" width="7"  height="65" rx="3" fill="rgba(0,60,120,0.25)" />
      <line x1="110" y1="160" x2="110" y2="210" stroke={circuit} strokeWidth="1" style={{transition:'stroke 1.2s'}} />
      <circle cx="110" cy="185" r="2" fill={circuit} style={{transition:'fill 1.2s'}} />

      {/* ── BASE ── */}
      <ellipse cx="110" cy="228" rx="56" ry="12" fill="#040a14" />
      <rect x="54" y="217" width="112" height="26" rx="6" fill="url(#rlBase)" />
      <ellipse cx="110" cy="217" rx="56" ry="12" fill={lit ? '#101e38' : '#060c18'} style={{transition:'fill 1.2s'}} />
      <ellipse cx="110" cy="243" rx="56" ry="12" fill="#030810" />
      <g stroke={circuit} strokeWidth="1.5" style={{transition:'stroke 1.2s'}}>
        <line x1="64"  y1="230" x2="84"  y2="230" />
        <line x1="136" y1="230" x2="156" y2="230" />
      </g>
      <g fill={circuit} style={{transition:'fill 1.2s'}}>
        <circle cx="84"  cy="230" r="2.5" />
        <circle cx="136" cy="230" r="2.5" />
      </g>

      {/* ── HANGING ORB ── */}
      <line x1="110" y1="243" x2="110" y2="268" stroke="rgba(0,70,130,0.5)" strokeWidth="1.5" />
      <circle cx="110" cy="280" r="13" fill="url(#rlOrb)" filter="url(#rlOrbGlow)" style={{transition:'filter 1.2s'}} />
      <circle cx="104" cy="274" r="4"  fill="rgba(255,255,255,0.7)" opacity={lit ? 0.9 : 0.1} style={{transition:'opacity 1.2s'}} />
    </svg>
  );
}

const PULL_THRESHOLD = 38;
const MAX_DRAG = 72;
const BASE_CORD = 46;

/* ── Main component ───────────────────────────────────── */
export default function Login() {
  const { t } = useLanguage();
  const { login, loading } = useAuth();
  const [lit, setLit]               = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY]           = useState(0);
  const [flashKey, setFlashKey]     = useState(0);
  const [error, setError]           = useState('');
  const startY   = useRef(0);
  const didDrag  = useRef(false); // track whether pointer actually moved

  const isLit = lit;
  const aboveThreshold = dragY >= PULL_THRESHOLD;

  const toggle = useCallback(() => {
    const next = !lit;
    setLit(next);
    if (next) setFlashKey(k => k + 1);
  }, [lit]);

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    startY.current = e.clientY;
    didDrag.current = false;
    setIsDragging(true);
    setDragY(0);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!isDragging) return;
    const dy = Math.max(0, Math.min(MAX_DRAG, e.clientY - startY.current));
    if (dy > 4) didDrag.current = true;
    setDragY(dy);
  }, [isDragging]);

  const onPointerUp = useCallback((e) => {
    if (!isDragging) return;
    const pulled = dragY >= PULL_THRESHOLD;
    setIsDragging(false);
    setDragY(0);
    if (pulled) toggle();
  }, [isDragging, dragY, toggle]);

  // Click (no drag) also toggles
  const onClick = useCallback(() => {
    if (!didDrag.current) toggle();
  }, [toggle]);

  const onKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  }, [toggle]);

  const onFinish = async (values) => {
    setError('');
    const result = await login(values.username, values.password);
    if (!result.success) setError(result.message || t.login.invalidCredentials);
  };

  const cordLen = BASE_CORD + dragY;
  const cordT   = isDragging ? 'none' : 'height 0.38s cubic-bezier(0.34,1.56,0.64,1)';
  const beadT   = isDragging ? 'none' : 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1)';

  // Bounce only when unlit, not dragging, and bead is at rest
  const beadAnim = (!isLit && !isDragging && dragY === 0)
    ? 'beadBounce 1.8s ease-in-out infinite'
    : 'none';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#030810',
      backgroundImage: `
        linear-gradient(rgba(0,90,200,0.065) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,90,200,0.065) 1px, transparent 1px)
      `,
      backgroundSize: '44px 44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px 16px',
    }}>
      {/* Flicker overlay */}
      <div
        key={flashKey}
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 15,
          background: 'rgba(0,160,255,0.14)',
          animation: flashKey > 0 ? 'lamp-flash-overlay 0.7s ease-out forwards' : 'none',
        }}
      />

      {/* Ambient light */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: '15%', left: '20%',
        width: '55%', height: '65%',
        background: 'radial-gradient(ellipse, rgba(0,80,200,0.12) 0%, transparent 70%)',
        opacity: isLit ? 1 : 0.22,
        transition: 'opacity 1.6s ease',
        pointerEvents: 'none',
      }} />

      {/* Corner glows */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: -120, right: -120,
        width: 340, height: 340,
        background: 'radial-gradient(circle, rgba(80,40,200,0.07) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', bottom: -100, left: -100,
        width: 280, height: 280,
        background: 'radial-gradient(circle, rgba(0,80,200,0.06) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Main content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(20px,5vw,72px)',
        maxWidth: 980,
        width: '100%',
        flexWrap: 'wrap',
      }}>

        {/* ── LEFT: LAMP + CORD ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Ceiling mount */}
          <div aria-hidden="true" style={{
            width: 46, height: 7,
            background: 'linear-gradient(to bottom, rgba(0,120,220,0.75), rgba(0,70,150,0.45))',
            borderRadius: '0 0 4px 4px',
          }} />

          {/* Swaying group */}
          <div aria-hidden="true" style={{
            transformOrigin: '50% 0%',
            animation: 'lantern-sway 8s ease-in-out infinite',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {/* Top wire */}
            <div style={{
              width: 2, height: 30,
              background: 'linear-gradient(to bottom, rgba(0,140,240,0.75), rgba(0,90,180,0.55))',
            }} />

            <RobotLamp lit={isLit} />

            {/* Pull cord — keyboard & click accessible */}
            <div
              role="button"
              tabIndex={0}
              aria-label={isLit ? t.login.lampOnAriaLabel : t.login.lampOffAriaLabel}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                cursor: isDragging ? 'grabbing' : 'grab',
                outline: 'none',
                marginTop: -4,
                userSelect: 'none',
                touchAction: 'none',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onClick={onClick}
              onKeyDown={onKeyDown}
            >
              {/* Cord line */}
              <div style={{
                width: 2,
                height: cordLen,
                background: aboveThreshold
                  ? 'linear-gradient(to bottom, rgba(0,220,180,0.7), rgba(0,180,140,0.5))'
                  : 'linear-gradient(to bottom, rgba(0,160,255,0.85), rgba(0,100,200,0.62))',
                transition: cordT,
                borderRadius: 1,
              }} />

              {/* Pull bead */}
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: aboveThreshold
                  ? 'radial-gradient(circle at 34% 30%, #80ffea, #00bb88)'
                  : isLit
                    ? 'radial-gradient(circle at 34% 30%, #80e0ff, #0088cc)'
                    : 'radial-gradient(circle at 34% 30%, #3a6a9a, #1a3558)',
                border: `1.5px solid ${aboveThreshold ? 'rgba(0,230,180,0.8)' : isLit ? 'rgba(0,200,255,0.65)' : 'rgba(0,140,230,0.7)'}`,
                boxShadow: aboveThreshold
                  ? '0 0 16px rgba(0,220,160,0.8), 0 0 6px rgba(0,255,200,0.5)'
                  : isLit
                    ? '0 0 14px rgba(0,180,255,0.65), 0 0 5px rgba(0,220,255,0.4)'
                    : '0 0 12px rgba(0,120,230,0.5), 0 2px 5px rgba(0,0,0,0.5)',
                transform: isDragging ? `translateY(${dragY}px)` : undefined,
                animation: isDragging ? 'none' : beadAnim,
                transition: isDragging ? 'none' : `box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s, ${beadT}`,
              }} />

              {/* Tassel */}
              <div style={{ display: 'flex', gap: 2.5, marginTop: 5, opacity: 0.85 }}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{
                    width: 1.5,
                    height: 6 + (i === 2 ? 4 : Math.abs(i - 2) * 1.5),
                    background: 'rgba(0,155,255,0.82)',
                    borderRadius: 1,
                  }} />
                ))}
              </div>
            </div>
          </div>

          {/* Pull hint */}
          <div style={{
            marginTop: 16,
            opacity: isLit ? 0 : 1,
            transition: 'opacity 0.7s ease',
            pointerEvents: 'none',
          }}>
            <Text style={{ color: 'rgba(0,190,255,0.92)', fontSize: 12, letterSpacing: 2, textShadow: '0 0 10px rgba(0,150,255,0.5)' }}>
              {t.login.pullHint}
            </Text>
          </div>
        </div>

        {/* ── RIGHT: FORM CARD ── */}
        <div style={{
          flex: '1 1 300px',
          maxWidth: 420,
          opacity: isLit ? 1 : 0.18,
          filter: isLit ? 'none' : 'blur(2.5px)',
          transition: 'opacity 0.9s ease 0.3s, filter 0.9s ease 0.3s',
          pointerEvents: isLit ? 'auto' : 'none',
        }}>
          <div style={{
            background: 'rgba(4,14,36,0.82)',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            border: '1px solid rgba(60,110,220,0.28)',
            borderRadius: 22,
            padding: 'clamp(24px,4.5vw,40px)',
            boxShadow: '0 8px 52px rgba(0,0,0,0.65), 0 0 24px rgba(60,100,220,0.07), inset 0 1px 0 rgba(80,150,255,0.1)',
          }}>
            {/* Accent bar */}
            <div style={{
              width: 40, height: 3,
              background: 'linear-gradient(to right, transparent, #0088ff, transparent)',
              margin: '0 auto 22px',
              borderRadius: 2,
            }} />

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <Title level={2} style={{
                color: '#dceeff',
                margin: '0 0 6px',
                fontWeight: 800,
                fontSize: 'clamp(20px,2.8vw,26px)',
                letterSpacing: 0.5,
                textShadow: '0 2px 16px rgba(0,140,255,0.25)',
              }}>
                {t.login.pagodaName}
              </Title>
              <Text style={{ color: 'rgba(80,160,255,0.5)', fontSize: 10.5, letterSpacing: 3 }}>
                {t.login.systemSubtitle}
              </Text>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(60,110,220,0.22))' }} />
              <Text style={{ color: 'rgba(60,120,255,0.3)', fontSize: 10, letterSpacing: 3, fontWeight: 600 }}>{t.login.sectionLabel}</Text>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, rgba(60,110,220,0.22))' }} />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                color: 'rgba(255,80,80,0.85)',
                fontSize: 10.5, letterSpacing: 1.5,
                textAlign: 'center', marginBottom: 14,
                fontWeight: 700,
              }}>
                {t.login.errorBanner}
              </div>
            )}

            <Form layout="vertical" onFinish={onFinish} size="large">
              <Form.Item
                name="username"
                label={<span style={{ color: 'rgba(80,160,255,0.58)', fontSize: 10.5, letterSpacing: 2.5, fontWeight: 700 }}>{t.login.usernameLabel}</span>}
                style={{ marginBottom: 14 }}
                rules={[{ required: true, message: t.login.usernameRequired }]}
              >
                <Input
                  className="login-sci-input"
                  prefix={<UserOutlined style={{ color: 'rgba(60,150,255,0.45)' }} />}
                  placeholder="Username"
                  style={{
                    background: 'rgba(0,60,160,0.08)', border: '1px solid rgba(60,120,220,0.28)',
                    borderRadius: 10, color: '#c8e0ff', height: 48, fontSize: 14,
                  }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span style={{ color: 'rgba(80,160,255,0.58)', fontSize: 10.5, letterSpacing: 2.5, fontWeight: 700 }}>{t.login.passwordLabel}</span>}
                style={{ marginBottom: 24 }}
                rules={[{ required: true, message: t.login.passwordRequired }]}
              >
                <Input.Password
                  className="login-sci-input"
                  prefix={<LockOutlined style={{ color: 'rgba(60,150,255,0.45)' }} />}
                  placeholder="Password"
                  style={{
                    background: 'rgba(0,60,160,0.08)',
                    border: `1px solid ${error ? 'rgba(255,80,80,0.5)' : 'rgba(60,120,220,0.28)'}`,
                    borderRadius: 10, color: '#c8e0ff', height: 48, fontSize: 14,
                  }}
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{
                  height: 48, borderRadius: 10,
                  background: 'linear-gradient(135deg, #4422aa 0%, #6633cc 50%, #8855ee 100%)',
                  border: 'none', color: '#e8ddff', fontWeight: 700, fontSize: 14,
                  letterSpacing: 2, boxShadow: '0 4px 22px rgba(90,40,180,0.45)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 30px rgba(110,50,220,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 22px rgba(90,40,180,0.45)'; }}
              >
                {t.login.submitButton}
              </Button>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 18 }}>
              <Text
                style={{ color: 'rgba(60,120,255,0.45)', fontSize: 12, cursor: 'pointer', letterSpacing: 0.5 }}
                onClick={() => message.info({
                  content: t.login.forgotPasswordMessage,
                  duration: 4,
                })}
                onMouseEnter={e => e.target.style.color = 'rgba(100,180,255,0.75)'}
                onMouseLeave={e => e.target.style.color = 'rgba(60,120,255,0.45)'}
              >
                {t.login.forgotPassword}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
