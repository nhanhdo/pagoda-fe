import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { LoginOutlined, StarFilled, StarOutlined, CalendarOutlined, ArrowRightOutlined, MoonOutlined } from '@ant-design/icons';
import { solarToLunar, getBuddhistHolidays } from '../../utils/lunarCalendar';

/* ── Canvas: petals ─────────────────────────────────────── */
function usePetals(ref) {
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize();
    const ctx = c.getContext('2d');
    const palette = ['255,150,185', '255,175,200', '255,195,215', '255,160,170', '250,200,150'];
    class P {
      constructor(init) { this.reset(init); }
      reset(init) {
        this.x  = Math.random() * c.width;
        this.y  = init ? Math.random() * c.height : -14;
        this.s  = 3 + Math.random() * 5;
        this.vy = 0.45 + Math.random() * 1.0;
        this.a  = Math.random() * Math.PI * 2;
        this.rv = (Math.random() - 0.5) * 0.04;
        this.ph = Math.random() * Math.PI * 2;
        this.fr = 0.38 + Math.random() * 0.5;
        const op = 0.45 + Math.random() * 0.45;
        this.c  = `rgba(${palette[~~(Math.random() * palette.length)]},${op})`;
      }
      tick(t) {
        this.y += this.vy; this.x += Math.sin(t*this.fr+this.ph)*0.42; this.a += this.rv;
        if (this.y > c.height+16) this.reset();
      }
      draw() {
        ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(this.a);
        ctx.fillStyle=this.c; const s=this.s;
        ctx.beginPath();
        ctx.moveTo(0,-s); ctx.bezierCurveTo(s*.75,-s*.35,s*.75,s*.35,0,s);
        ctx.bezierCurveTo(-s*.75,s*.35,-s*.75,-s*.35,0,-s);
        ctx.fill(); ctx.restore();
      }
    }
    const ps = Array.from({length: innerWidth < 640 ? 40 : 80},()=>new P(true));
    let t=0,id;
    const go=()=>{ id=requestAnimationFrame(go); ctx.clearRect(0,0,c.width,c.height); t+=.013; ps.forEach(p=>{p.tick(t);p.draw();}); };
    const onVis=()=>{ if(document.hidden) cancelAnimationFrame(id); else go(); };
    go();
    window.addEventListener('resize',resize);
    document.addEventListener('visibilitychange',onVis);
    return ()=>{ cancelAnimationFrame(id); window.removeEventListener('resize',resize); document.removeEventListener('visibilitychange',onVis); };
  },[]);
}

/* ── Cloud ──────────────────────────────────────────────── */
function Cloud({ width = 220, opacity = 0.9 }) {
  return (
    <svg viewBox="0 0 220 80" width={width} height={typeof width === 'number' ? width * 80 / 220 : undefined} style={{ display:'block', opacity, filter:'drop-shadow(0 6px 10px rgba(150,130,180,0.12))' }}>
      <ellipse cx="60"  cy="52" rx="48" ry="24" fill="#fff"/>
      <ellipse cx="105" cy="38" rx="44" ry="32" fill="#fff"/>
      <ellipse cx="150" cy="48" rx="46" ry="26" fill="#fff"/>
      <ellipse cx="185" cy="58" rx="30" ry="16" fill="#fff"/>
      <ellipse cx="110" cy="62" rx="90" ry="16" fill="#fdf7ff"/>
    </svg>
  );
}

/* ── Temple — 3-tier pagoda in daylight ─────────────────── */
function Temple() {
  const wall = ['#f6e8cf', '#f2e1c2', '#eed9b6'];
  const col = '#a83a24';
  const roof = ['#a2332a', '#ac372c', '#b63e30'];
  const soffit = '#6e231b';
  const gold = '#e2a93c';
  const win = '#f2c66c';
  return (
    <svg viewBox="0 0 720 500" style={{ width:'100%', height:'auto', display:'block' }}>
      <defs>
        <filter id="tGlw">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="tSoft"><feGaussianBlur stdDeviation="10"/></filter>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="360" cy="474" rx="320" ry="18" fill="rgba(110,80,40,.22)" filter="url(#tSoft)"/>

      {/* Foundation */}
      <rect x="50"  y="448" width="620" height="20" rx="3" fill="#d4bf9a"/>
      <rect x="80"  y="432" width="560" height="18" rx="3" fill="#dfcca8"/>
      <rect x="110" y="418" width="500" height="16" rx="2" fill="#e8d7b6"/>
      <rect x="296" y="452" width="128" height="8"  rx="1" fill="#c6ae86"/>
      <rect x="316" y="460" width="88"  height="8"  rx="1" fill="#bba27a"/>

      {/* Tier 1 — main hall */}
      <rect x="130" y="294" width="460" height="126" rx="3" fill={wall[0]}/>
      {[148,208,278,360,442,512,562].map((x,i)=>(
        <rect key={i} x={x} y="294" width="11" height="126" rx="4" fill={col}/>
      ))}
      {[[162,310,55,70],[232,307,62,74],[426,307,62,74],[503,310,55,70]].map(([x,y,w,h],i)=>(
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} rx="4" fill={win} opacity="0.55"/>
          <rect x={x} y={y} width={w} height={h} rx="4" fill="none" stroke="#8f3a1e" strokeWidth="2" opacity="0.7"/>
          <line x1={x+w/2} y1={y} x2={x+w/2} y2={y+h} stroke="#8f3a1e" strokeWidth="1.2" opacity="0.5"/>
        </g>
      ))}
      <rect x="316" y="302" width="88" height="118" rx="5" fill="#b5562e"/>
      <rect x="324" y="310" width="30" height="110" rx="3" fill="#8f3a1e"/>
      <rect x="366" y="310" width="30" height="110" rx="3" fill="#8f3a1e"/>
      <circle cx="350" cy="365" r="2.5" fill={gold}/>
      <circle cx="370" cy="365" r="2.5" fill={gold}/>
      <rect x="316" y="302" width="88" height="118" rx="5" fill="none" stroke={gold} strokeWidth="2" opacity="0.8"/>

      {/* First roof */}
      <path d="M 38,300 Q 200,318 360,322 Q 520,318 682,300 L 648,256 Q 490,272 360,276 Q 230,272 72,256 Z" fill={roof[0]}/>
      <path d="M 72,256 Q 230,272 360,276 Q 490,272 648,256 L 638,268 Q 478,284 360,288 Q 242,284 82,268 Z" fill={soffit} opacity="0.75"/>
      <path d="M 38,300 Q 18,286 10,264 Q 22,270 42,284 Z" fill={roof[1]}/>
      <path d="M 682,300 Q 702,286 710,264 Q 698,270 678,284 Z" fill={roof[1]}/>
      <path d="M 72,256 Q 230,246 360,244 Q 490,246 648,256" fill="none" stroke={gold} strokeWidth="3"/>
      <path d="M 38,300 Q 200,318 360,322 Q 520,318 682,300" fill="none" stroke={gold} strokeWidth="2" opacity="0.7"/>
      {[140,195,255,315,360,405,465,525,580].map((x,i)=>(
        <line key={i} x1={x} y1="258" x2={x+15} y2="296" stroke={soffit} strokeWidth="1.2" opacity="0.35"/>
      ))}
      {[190, 360, 530].map((x,i)=>(
        <g key={i}>
          <line x1={x} y1="290" x2={x} y2="300" stroke="#8f3a1e" strokeWidth="1.5"/>
          <ellipse cx={x} cy="310" rx="7"  ry="10" fill="#d63a2a"/>
          <ellipse cx={x} cy="301" rx="8"  ry="3"  fill={gold}/>
          <ellipse cx={x} cy="320" rx="6"  ry="2.5" fill={gold}/>
          <ellipse cx={x} cy="310" rx="3"  ry="5.5" fill="#ffe08a" opacity="0.9"/>
        </g>
      ))}

      {/* Tier 2 */}
      <rect x="210" y="210" width="300" height="86" rx="3" fill={wall[1]}/>
      {[222,278,360,442,488].map((x,i)=>(
        <rect key={i} x={x} y="210" width="9" height="86" rx="3" fill={col}/>
      ))}
      <rect x="236" y="224" width="36" height="52" rx="3" fill={win} opacity="0.55" stroke="#8f3a1e" strokeWidth="1.5"/>
      <rect x="300" y="222" width="54" height="56" rx="3" fill={win} opacity="0.55" stroke="#8f3a1e" strokeWidth="1.5"/>
      <rect x="370" y="222" width="54" height="56" rx="3" fill={win} opacity="0.55" stroke="#8f3a1e" strokeWidth="1.5"/>
      <rect x="448" y="224" width="36" height="52" rx="3" fill={win} opacity="0.55" stroke="#8f3a1e" strokeWidth="1.5"/>

      {/* Second roof */}
      <path d="M 118,212 Q 240,228 360,232 Q 480,228 602,212 L 572,172 Q 450,186 360,190 Q 270,186 148,172 Z" fill={roof[1]}/>
      <path d="M 148,172 Q 270,186 360,190 Q 450,186 572,172 L 562,182 Q 440,196 360,200 Q 280,196 158,182 Z" fill={soffit} opacity="0.7"/>
      <path d="M 118,212 Q 98,200 88,182 Q 102,188 120,200 Z" fill={roof[2]}/>
      <path d="M 602,212 Q 622,200 632,182 Q 618,188 600,200 Z" fill={roof[2]}/>
      <path d="M 148,172 Q 270,162 360,160 Q 450,162 572,172" fill="none" stroke={gold} strokeWidth="2.5"/>
      <path d="M 118,212 Q 240,228 360,232 Q 480,228 602,212" fill="none" stroke={gold} strokeWidth="1.8" opacity="0.7"/>

      {/* Tier 3 */}
      <rect x="278" y="122" width="164" height="88" rx="3" fill={wall[2]}/>
      {[288,360,432].map((x,i)=>(
        <rect key={i} x={x} y="122" width="9" height="88" rx="3" fill={col}/>
      ))}
      <rect x="302" y="134" width="44" height="56" rx="3" fill={win} opacity="0.6" stroke="#8f3a1e" strokeWidth="1.5"/>
      <rect x="374" y="134" width="44" height="56" rx="3" fill={win} opacity="0.6" stroke="#8f3a1e" strokeWidth="1.5"/>

      {/* Third roof */}
      <path d="M 190,124 Q 275,138 360,142 Q 445,138 530,124 L 508,90 Q 422,103 360,107 Q 298,103 212,90 Z" fill={roof[2]}/>
      <path d="M 212,90 Q 298,103 360,107 Q 422,103 508,90 L 499,100 Q 413,113 360,117 Q 307,113 221,100 Z" fill={soffit} opacity="0.65"/>
      <path d="M 190,124 Q 172,114 162,98 Q 176,104 194,116 Z" fill="#c24636"/>
      <path d="M 530,124 Q 548,114 558,98 Q 544,104 526,116 Z" fill="#c24636"/>
      <path d="M 212,90 Q 298,80 360,78 Q 422,80 508,90" fill="none" stroke={gold} strokeWidth="2.2"/>

      {/* Spire */}
      <rect x="336" y="52" width="48" height="36" rx="3" fill="#a83a24"/>
      <rect x="328" y="46" width="64" height="12" rx="4" fill="#8f3a1e"/>
      <ellipse cx="360" cy="46" rx="32" ry="6" fill={gold}/>
      <line x1="360" y1="4" x2="360" y2="46" stroke={gold} strokeWidth="3.5"/>
      <ellipse cx="360" cy="40" rx="11" ry="4"   fill={gold}/>
      <ellipse cx="360" cy="33" rx="8.5" ry="3.2" fill={gold}/>
      <ellipse cx="360" cy="27" rx="7"   ry="2.8" fill={gold}/>
      <ellipse cx="360" cy="22" rx="5.5" ry="2.4" fill={gold}/>
      <ellipse cx="360" cy="17" rx="4"   ry="2"   fill={gold}/>
      <circle cx="360" cy="10" r="7" fill="#f5c451" filter="url(#tGlw)"/>
      <polygon points="360,1 356.5,10 363.5,10" fill="#f5c451"/>
    </svg>
  );
}

/* ── Live clock (text) ─────────────────────────────────── */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function nextHolyDay(from) {
  const start = dayjs(from).startOf('day');
  const maps = [start.year(), start.year() + 1].map(y => getBuddhistHolidays(y));
  for (let i = 0; i <= 60; i++) {
    const d = start.add(i, 'day');
    const hit = maps[d.year() === start.year() ? 0 : 1].get(d.format('YYYY-MM-DD'));
    if (hit) return { date: d, diff: i, name: hit.names[0], major: hit.major };
  }
  return null;
}

const CSS = `
  @keyframes hpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes hpSpin{to{transform:rotate(360deg)}}
  @keyframes hpBreath{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
  @keyframes hpRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
  @keyframes hpCloud{from{transform:translateX(-120%)}to{transform:translateX(160%)}}
  @keyframes hpRipple{0%,100%{transform:scaleX(1);opacity:.55}50%{transform:scaleX(1.08);opacity:.85}}
  @keyframes hpBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}

  .hp{position:relative;height:100vh;height:100dvh;overflow-x:hidden;overflow-y:auto;color:#3e2c1f;
    background:
      radial-gradient(ellipse 55% 60% at 78% 45%,rgba(255,214,170,.45) 0%,transparent 70%),
      radial-gradient(ellipse 45% 50% at 10% 85%,rgba(200,228,210,.45) 0%,transparent 70%),
      radial-gradient(ellipse 40% 40% at 8% 10%,rgba(220,205,255,.35) 0%,transparent 70%),
      linear-gradient(160deg,#fffaf3 0%,#fdf3e6 50%,#fbebd9 100%)}
  .hp > canvas{position:fixed;inset:0;pointer-events:none;z-index:1}

  /* Top bar */
  .hp__top{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:12px;
    padding:20px clamp(18px,5vw,64px)}
  .hp__brand{display:flex;align-items:center;gap:12px}
  .hp__logo{width:42px;height:42px;border-radius:50%;overflow:hidden;border:2px solid #fff;flex-shrink:0;
    box-shadow:0 0 0 1.5px rgba(214,160,96,.6),0 4px 12px rgba(196,127,54,.25)}
  .hp__logo img{width:100%;height:100%;object-fit:cover;object-position:center 18%;display:block}
  .hp__name{font-size:17px;font-weight:800;color:#6b3410;line-height:1.15}
  .hp__sub{font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#a0703a}
  .hp__login-sm{height:40px;padding:0 18px;border-radius:999px;border:1px solid #ecd6b5;background:rgba(255,255,255,.8);
    color:#9a5d22;font-size:13.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;
    transition:background .18s,box-shadow .18s,transform .18s}
  .hp__login-sm:hover{background:#fff;box-shadow:0 6px 16px rgba(176,111,44,.16);transform:translateY(-1px)}

  /* Main grid */
  .hp__main{position:relative;z-index:5;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;
    gap:clamp(24px,5vw,80px);padding:0 clamp(18px,5vw,64px) clamp(24px,4vh,48px);
    min-height:calc(100vh - 82px);min-height:calc(100dvh - 82px);max-width:1440px;margin:0 auto}

  /* Text column */
  .hp__text{max-width:560px}
  .hp__eyebrow{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;
    background:rgba(255,255,255,.75);border:1px solid #f0dfc6;color:#b07a3a;font-size:11.5px;font-weight:700;
    letter-spacing:.22em;text-transform:uppercase;animation:hpRise .6s ease both .05s}
  .hp__title{margin:18px 0 14px;font-size:clamp(44px,6.2vw,88px);font-weight:900;line-height:.98;letter-spacing:-.01em;color:#5a2c0e;
    animation:hpRise .6s ease both .15s}
  .hp__title span{display:block;background:linear-gradient(120deg,#c47f36 0%,#d9646c 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
  .hp__lead{margin:0;max-width:460px;font-size:clamp(14px,1.25vw,17px);line-height:1.7;color:#7a604c;animation:hpRise .6s ease both .25s}
  .hp__actions{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:clamp(22px,3.5vh,34px);animation:hpRise .6s ease both .35s}
  .hp__cta{display:inline-flex;align-items:center;gap:10px;height:54px;padding:0 32px;border:none;border-radius:999px;cursor:pointer;
    background:linear-gradient(135deg,#d6984a 0%,#c47f36 55%,#b06a24 100%);color:#fff;font-size:15px;font-weight:800;letter-spacing:.06em;
    box-shadow:0 14px 30px rgba(176,106,36,.32);transition:transform .2s ease,box-shadow .2s ease,filter .2s ease}
  .hp__cta:hover{transform:translateY(-2px);filter:brightness(1.05);box-shadow:0 18px 36px rgba(176,106,36,.4)}
  .hp__cta:focus-visible{outline:3px solid #6b3410;outline-offset:4px}
  .hp__cta .anticon{font-size:16px;transition:transform .2s ease}
  .hp__cta:hover .anticon{transform:translateX(3px)}
  .hp__hint{font-size:13px;color:#a8917a}

  .hp__facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:clamp(26px,5vh,48px);max-width:560px;
    animation:hpRise .6s ease both .45s}
  .hp__fact{padding:14px 16px;border-radius:16px;background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.95);
    backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 8px 24px rgba(120,90,50,.07);min-width:0}
  .hp__fact-label{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#b09075}
  .hp__fact-value{margin-top:6px;font-size:18px;font-weight:800;color:#3e2c1f;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .hp__fact-sub{margin-top:2px;font-size:12px;color:#a8917a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:capitalize}
  .hp__fact--holy .hp__fact-value{font-size:15px;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  .hp__fact--holy .hp__fact-sub{color:#c4545d;font-weight:700;text-transform:none}
  .hp__mono{font-family:ui-monospace,Consolas,monospace;letter-spacing:.02em}

  /* Arch scene */
  .hp__arch-wrap{position:relative;justify-self:center;animation:hpRise .8s cubic-bezier(.22,1,.36,1) both .1s}
  .hp__arch-glow{position:absolute;inset:-8% -14%;border-radius:50%;pointer-events:none;
    background:radial-gradient(ellipse at 50% 35%,rgba(255,220,160,.55) 0%,rgba(255,200,210,.25) 45%,transparent 70%);filter:blur(10px)}
  .hp__arch{position:relative;--h:min(76vh,720px);height:var(--h);width:calc(var(--h) * .72);
    border-radius:calc(var(--h) * .36) calc(var(--h) * .36) 28px 28px;overflow:hidden;
    border:6px solid #fff;box-shadow:0 0 0 1.5px rgba(214,160,96,.55),0 30px 70px rgba(150,95,40,.22);
    background:linear-gradient(180deg,#bfe0f4 0%,#d9e5f6 22%,#efe2f2 42%,#fde3e1 60%,#ffeedd 76%,#f6efd8 100%)}
  .hp__arch::after{content:'';position:absolute;inset:10px;border-radius:inherit;border:1px solid rgba(255,255,255,.7);pointer-events:none;z-index:9}

  .hp__sun{position:absolute;left:50%;top:8%;width:44%;aspect-ratio:1/1;transform:translateX(-50%);z-index:2}
  .hp__sun-rays,.hp__sun-core,.hp__sun-rainbow{position:absolute;left:50%;top:50%;border-radius:50%;pointer-events:none}
  .hp__sun-rays{width:300%;height:300%;margin:-150% 0 0 -150%;
    background:repeating-conic-gradient(rgba(255,255,255,.55) 0deg 4deg,transparent 4deg 15deg);
    -webkit-mask:radial-gradient(circle,#000 18%,transparent 56%);mask:radial-gradient(circle,#000 18%,transparent 56%);
    animation:hpSpin 160s linear infinite}
  .hp__sun-rainbow{width:210%;height:210%;margin:-105% 0 0 -105%;filter:blur(16px);
    background:conic-gradient(from 0deg,rgba(255,214,102,.7),rgba(255,160,190,.5),rgba(200,160,255,.45),rgba(130,200,255,.45),rgba(140,230,200,.45),rgba(255,214,102,.7));
    -webkit-mask:radial-gradient(circle,#000 26%,transparent 66%);mask:radial-gradient(circle,#000 26%,transparent 66%);
    animation:hpSpin 50s linear infinite}
  .hp__sun-core{width:150%;height:150%;margin:-75% 0 0 -75%;
    background:radial-gradient(circle,rgba(255,255,245,.95) 0%,rgba(255,236,170,.65) 36%,transparent 70%);
    animation:hpBreath 5s ease-in-out infinite}
  .hp__buddha{position:absolute;inset:0;border-radius:50%;overflow:hidden;border:4px solid #fff;
    box-shadow:0 0 0 1.5px rgba(226,169,60,.6),0 16px 36px rgba(180,110,40,.3);animation:hpFloat 7s ease-in-out infinite}
  .hp__buddha img{width:100%;height:100%;object-fit:cover;object-position:center 18%;display:block}

  .hp__cloud{position:absolute;z-index:1;pointer-events:none}
  .hp__hills{position:absolute;left:0;right:0;bottom:0;height:46%;z-index:3;pointer-events:none}
  .hp__hills svg{position:absolute;left:0;width:100%;display:block}
  .hp__temple{position:absolute;left:50%;bottom:15%;width:80%;transform:translateX(-50%);z-index:4;pointer-events:none}
  .hp__temple svg{width:100%;height:auto;display:block}
  .hp__pond{position:absolute;left:0;right:0;bottom:0;height:16%;z-index:5;pointer-events:none;
    background:linear-gradient(180deg,#cfe6ee 0%,#bcdbe7 60%,#aed2e0 100%)}
  .hp__pond::before{content:'';position:absolute;left:8%;right:8%;top:30%;height:2px;border-radius:2px;background:rgba(255,255,255,.75);animation:hpRipple 5s ease-in-out infinite}
  .hp__pond::after{content:'';position:absolute;left:22%;right:30%;top:62%;height:2px;border-radius:2px;background:rgba(255,255,255,.6);animation:hpRipple 6s ease-in-out infinite 1s}
  .hp__lotus{position:absolute;z-index:6;pointer-events:none;animation:hpBob 4s ease-in-out infinite}

  /* Responsive */
  @media (max-width: 1100px){
    .hp__arch{--h:min(64vh,600px)}
    .hp__facts{grid-template-columns:repeat(3,minmax(0,1fr))}
  }
  @media (max-width: 900px){
    .hp__main{grid-template-columns:minmax(0,1fr);justify-items:center;text-align:center;padding-top:8px}
    .hp__arch-wrap{order:-1}
    .hp__arch{--h:min(52vh,460px)}
    .hp__text{display:flex;flex-direction:column;align-items:center}
    .hp__actions{justify-content:center}
    .hp__facts{width:100%}
  }
  @media (max-width: 560px){
    .hp__login-sm{display:none}
    .hp__facts{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
    .hp__fact--holy{grid-column:1 / -1}
    .hp__title{font-size:44px}
  }
  @media (prefers-reduced-motion: reduce){ .hp *{animation:none !important} }
`;

function LotusFlower({ size = 34 }) {
  return (
    <svg viewBox="0 0 64 48" width={size} height={size * 0.75} aria-hidden="true">
      <ellipse cx="32" cy="42" rx="26" ry="5" fill="#7fb79a" opacity=".85" />
      {[-55, 55, -28, 28, 0].map((a, i) => (
        <g key={a} transform={`rotate(${a} 32 40)`}>
          <path d="M32 12 C38 20 38 31 32 40 C26 31 26 20 32 12 Z" fill={i < 2 ? '#f9c7d3' : i < 4 ? '#f4a6b8' : '#ee8fa6'} />
        </g>
      ))}
      <circle cx="32" cy="36" r="2.4" fill="#f6d36b" />
    </svg>
  );
}

export default function HomePage() {
  const petalsRef = useRef(null);
  const navigate = useNavigate();
  const now = useNow();
  usePetals(petalsRef);

  const lunar = solarToLunar(now.getDate(), now.getMonth() + 1, now.getFullYear());
  const holy = nextHolyDay(now);
  const two = (n) => String(n).padStart(2, '0');
  const goLogin = () => navigate('/login');

  return (
    <div className="hp">
      <style>{CSS}</style>
      <canvas ref={petalsRef} aria-hidden="true" />

      <header className="hp__top">
        <div className="hp__brand">
          <span className="hp__logo"><img src="/adida.PNG" alt="" /></span>
          <span>
            <div className="hp__name">Chùa Tân Thành</div>
            <div className="hp__sub">Hệ thống quản lý</div>
          </span>
        </div>
        <button type="button" className="hp__login-sm" onClick={goLogin}>
          <LoginOutlined /> Đăng nhập
        </button>
      </header>

      <main className="hp__main">
        {/* Text */}
        <section className="hp__text">
          <span className="hp__eyebrow">☸ Nam Mô A Di Đà Phật</span>
          <h1 className="hp__title">Chùa<span>Tân Thành</span></h1>
          <p className="hp__lead">
            Nơi an lạc, nơi tu tập và kết nối thiện duyên. Hệ thống quản lý giúp đại chúng
            theo dõi lịch trực, khóa tu, Phật sự và công đức một cách trang nghiêm, minh bạch.
          </p>
          <div className="hp__actions">
            <button type="button" className="hp__cta" onClick={goLogin}>
              Vào hệ thống <ArrowRightOutlined />
            </button>
            <span className="hp__hint">Dành cho chư Tăng Ni &amp; ban điều hành</span>
          </div>

          <div className="hp__facts">
            <div className="hp__fact">
              <div className="hp__fact-label"><CalendarOutlined /> Hôm nay</div>
              <div className="hp__fact-value">{two(now.getDate())}/{two(now.getMonth() + 1)}/{now.getFullYear()}</div>
              <div className="hp__fact-sub">{now.toLocaleDateString('vi-VN', { weekday: 'long' })} · <span className="hp__mono">{two(now.getHours())}:{two(now.getMinutes())}</span></div>
            </div>
            <div className="hp__fact">
              <div className="hp__fact-label"><MoonOutlined /> Âm lịch</div>
              <div className="hp__fact-value">{lunar.day}/{lunar.month}{lunar.leap ? '*' : ''}</div>
              <div className="hp__fact-sub">Năm {lunar.yearName}</div>
            </div>
            <div className="hp__fact hp__fact--holy">
              <div className="hp__fact-label">{holy?.major ? <StarFilled style={{ color: '#e0a83a' }} /> : <StarOutlined />} Sắp tới</div>
              <div className="hp__fact-value">{holy ? holy.name : '—'}</div>
              {holy && <div className="hp__fact-sub">{holy.diff === 0 ? 'Hôm nay' : `Còn ${holy.diff} ngày · ${holy.date.format('DD/MM')}`}</div>}
            </div>
          </div>
        </section>

        {/* Arch scene */}
        <section className="hp__arch-wrap" aria-hidden="true">
          <div className="hp__arch-glow" />
          <div className="hp__arch">
            <div className="hp__cloud" style={{ top: '14%', width: '46%', animation: 'hpCloud 70s linear -20s infinite' }}><Cloud width="100%" opacity={.9} /></div>
            <div className="hp__cloud" style={{ top: '30%', width: '34%', animation: 'hpCloud 90s linear -60s infinite' }}><Cloud width="100%" opacity={.75} /></div>

            <div className="hp__sun">
              <span className="hp__sun-rays" />
              <span className="hp__sun-rainbow" />
              <span className="hp__sun-core" />
              <div className="hp__buddha"><img src="/adida.PNG" alt="" /></div>
            </div>

            <div className="hp__hills">
              <svg viewBox="0 0 400 160" preserveAspectRatio="none" style={{ bottom: '24%', height: '72%' }}>
                <path fill="rgba(196,198,236,.7)" d="M0,120 Q60,70 120,92 Q180,48 250,80 Q320,52 400,86 L400,160 L0,160 Z" />
              </svg>
              <svg viewBox="0 0 400 160" preserveAspectRatio="none" style={{ bottom: '20%', height: '56%' }}>
                <path fill="rgba(160,190,196,.7)" d="M0,130 Q70,96 140,114 Q210,86 280,110 Q340,94 400,112 L400,160 L0,160 Z" />
              </svg>
              <svg viewBox="0 0 400 160" preserveAspectRatio="none" style={{ bottom: '16%', height: '40%' }}>
                <path fill="rgba(170,206,160,.85)" d="M0,140 Q90,116 200,126 Q300,114 400,132 L400,160 L0,160 Z" />
              </svg>
            </div>

            <div className="hp__temple"><Temple /></div>

            <div className="hp__pond" />
            <div className="hp__lotus" style={{ left: '10%', bottom: '5%' }}><LotusFlower size={38} /></div>
            <div className="hp__lotus" style={{ right: '12%', bottom: '8%', animationDelay: '1.4s' }}><LotusFlower size={30} /></div>
            <div className="hp__lotus" style={{ left: '44%', bottom: '2%', animationDelay: '.7s' }}><LotusFlower size={26} /></div>
          </div>
        </section>
      </main>
    </div>
  );
}
