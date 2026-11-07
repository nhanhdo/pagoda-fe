import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Canvas: petals ─────────────────────────────────────── */
function usePetals(ref) {
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize();
    const ctx = c.getContext('2d');
    class P {
      constructor(init) {
        this.reset(init);
      }
      reset(init) {
        this.x  = Math.random() * c.width;
        this.y  = init ? Math.random() * c.height : -14;
        this.s  = 3 + Math.random() * 5.5;
        this.vy = 0.5 + Math.random() * 1.2;
        this.a  = Math.random() * Math.PI * 2;
        this.rv = (Math.random() - 0.5) * 0.042;
        this.ph = Math.random() * Math.PI * 2;
        this.fr = 0.38 + Math.random() * 0.5;
        this.op = 0.35 + Math.random() * 0.55;
        const r = Math.random();
        this.c  = r < 0.5
          ? `rgba(255,${160+~~(r*180)},${180+~~(r*60)},${this.op})`
          : `rgba(255,${190+~~(Math.random()*50)},${205+~~(Math.random()*40)},${this.op})`;
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
    const ps = Array.from({length:240},(_,i)=>new P(true));
    let t=0,id;
    const go=()=>{ id=requestAnimationFrame(go); ctx.clearRect(0,0,c.width,c.height); t+=.013; ps.forEach(p=>{p.tick(t);p.draw();}); };
    const onVis=()=>{ if(document.hidden) cancelAnimationFrame(id); else go(); };
    go();
    window.addEventListener('resize',resize);
    document.addEventListener('visibilitychange',onVis);
    return ()=>{ cancelAnimationFrame(id); window.removeEventListener('resize',resize); document.removeEventListener('visibilitychange',onVis); };
  },[]);
}


/* ── Canvas: fireflies ──────────────────────────────────── */
function useFireflies(ref) {
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize();
    const ctx = c.getContext('2d');
    class F {
      reset(init) {
        this.x  = Math.random() * c.width;
        this.y  = init ? c.height*(0.45+Math.random()*.5) : c.height*(0.6+Math.random()*.4);
        this.vy = -(0.1 + Math.random()*0.28);
        this.ph = Math.random()*Math.PI*2;
        this.fr = 0.6 + Math.random()*1.8;
        this.r  = 1.4 + Math.random()*1.8;
        this.warm = Math.random() > 0.28;
      }
      constructor(init) { this.reset(init); }
      tick(t) {
        this.x += Math.sin(t*0.35+this.ph)*0.35;
        this.y += this.vy;
        if (this.y < c.height*0.38 || this.y > c.height+10) this.reset(false);
      }
      draw(t) {
        const op = 0.25 + 0.75*(0.5+0.5*Math.sin(t*this.fr+this.ph));
        const [r,g,b] = this.warm ? [255,228,90] : [140,255,160];
        ctx.save();
        ctx.shadowColor = `rgba(${r},${g},${b},${op*.85})`;
        ctx.shadowBlur = 10;
        ctx.fillStyle = `rgba(${r},${g},${b},${op})`;
        ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
    }
    const fs = Array.from({length:50},(_,i)=>{ const f=new F(); f.reset(true); return f; });
    let t=0,id;
    const go=()=>{ id=requestAnimationFrame(go); ctx.clearRect(0,0,c.width,c.height); t+=.018; fs.forEach(f=>{f.tick(t);f.draw(t);}); };
    const onVis=()=>{ if(document.hidden) cancelAnimationFrame(id); else go(); };
    go();
    window.addEventListener('resize',resize);
    document.addEventListener('visibilitychange',onVis);
    return ()=>{ cancelAnimationFrame(id); window.removeEventListener('resize',resize); document.removeEventListener('visibilitychange',onVis); };
  },[]);
}

/* ── Cherry tree SVG ────────────────────────────────────── */
function CherryTree({ flip = false, scale = 1 }) {
  return (
    <svg viewBox="0 0 300 520" style={{ width:`clamp(150px,${20*scale}vw,${290*scale}px)`, height:'auto', display:'block', transform:flip?'scaleX(-1)':'none' }}>
      <path d="M 148,520 Q 145,440 143,360 Q 140,300 138,256" stroke="#3a1a06" strokeWidth="18" fill="none" strokeLinecap="round"/>
      <path d="M 142,360 Q 108,306 72,270"  stroke="#3a1a06" strokeWidth="12" fill="none" strokeLinecap="round"/>
      <path d="M 140,315 Q 168,264 196,228"  stroke="#3a1a06" strokeWidth="10" fill="none" strokeLinecap="round"/>
      <path d="M 140,290 Q 108,242 90,198"   stroke="#3a1a06" strokeWidth="8"  fill="none" strokeLinecap="round"/>
      <path d="M 138,256 Q 165,208 192,172"  stroke="#3a1a06" strokeWidth="7"  fill="none" strokeLinecap="round"/>
      <path d="M 92,220  Q 66,188 50,158"    stroke="#3a1a06" strokeWidth="5"  fill="none" strokeLinecap="round"/>
      <path d="M 184,202 Q 210,174 228,144"  stroke="#3a1a06" strokeWidth="5"  fill="none" strokeLinecap="round"/>
      {[
        [58,262,70,56],[108,236,76,60],[55,204,62,50],[94,194,68,55],[150,256,60,48],
        [186,222,74,58],[224,188,64,52],[140,202,66,53],[98,164,56,44],[178,163,62,50],
        [52,162,50,42],[218,153,54,44],[130,148,58,46],[170,188,60,48],[78,222,56,46],
      ].map(([cx,cy,rx,ry],i)=>(
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry}
          fill={['#ffaec9','#ffb8d0','#ffc5da','#ffbbd2','#ffd0e4','#ffafc8'][i%6]}
          opacity={0.72+((i*7)%5)*0.05}/>
      ))}
    </svg>
  );
}

/* ── Stone lantern post ─────────────────────────────────── */
function StoneLanternPost({ size = 34, lit = true }) {
  return (
    <svg viewBox="0 0 28 90" width={size} height={size * 90 / 28} style={{ display:'block' }}>
      {/* ground light pool */}
      {lit && <ellipse cx="14" cy="87" rx="14" ry="3.5" fill="rgba(255,140,30,.35)"/>}
      {/* base */}
      <rect x="3"  y="80" width="22" height="8" rx="2" fill="#9e8a6c" opacity=".9"/>
      <rect x="7"  y="76" width="14" height="5" rx="1" fill="#7a6340"/>
      {/* pole */}
      <rect x="12" y="40" width="4"  height="37" fill="#7a6340"/>
      {/* outer soft bloom (night only) */}
      {lit && <ellipse cx="14" cy="34" rx="16" ry="14" fill="rgba(255,130,20,.22)" style={{filter:'blur(3px)'}}/>}
      {/* lantern body */}
      <rect x="6"  y="27" width="16" height="15" rx="2" fill={lit ? '#b83000' : '#6b1500'}/>
      {/* inner bright light */}
      {lit && <rect x="8" y="29" width="12" height="11" rx="1" fill="rgba(255,215,70,.95)" style={{filter:'drop-shadow(0 0 3px rgba(255,180,40,.9))'}}/>}
      {/* cap */}
      <path d="M 3,27 L 14,18 L 25,27 Z" fill={lit ? '#9e2500' : '#5e1200'}/>
      <rect x="12.5" y="14" width="3" height="5" rx="1" fill={lit ? '#9e2500' : '#5e1200'}/>
      <line x1="14" y1="13" x2="14" y2="10" stroke="rgba(100,60,20,.6)" strokeWidth="1.5"/>
    </svg>
  );
}

/* ── Temple silhouette — grand 3-tier pagoda ────────────── */
function TempleSilhouette() {
  return (
    <svg viewBox="0 0 720 500" style={{ width:'clamp(300px,52vw,720px)', height:'auto', display:'block' }}>
      <defs>
        <filter id="tGlw">
          <feGaussianBlur stdDeviation="3.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="tAmb"><feGaussianBlur stdDeviation="14"/></filter>
        <filter id="tAmbSm"><feGaussianBlur stdDeviation="7"/></filter>
        <filter id="tWin">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Ambient window light spill ── */}
      <ellipse cx="360" cy="492" rx="295" ry="20" fill="#ffaa22" opacity="0.16" filter="url(#tAmb)"/>
      <ellipse cx="360" cy="485" rx="215" ry="13" fill="#ffcc44" opacity="0.11" filter="url(#tAmb)"/>
      <ellipse cx="360" cy="390" rx="200" ry="28" fill="#ffaa22" opacity="0.26" filter="url(#tAmb)"/>
      <ellipse cx="360" cy="272" rx="140" ry="20" fill="#ffaa22" opacity="0.20" filter="url(#tAmb)"/>

      {/* ══ FOUNDATION ══ */}
      <rect x="50"  y="448" width="620" height="20" rx="3" fill="#130303" opacity="0.97"/>
      <rect x="80"  y="432" width="560" height="18" rx="3" fill="#180404" opacity="0.97"/>
      <rect x="110" y="418" width="500" height="16" rx="2" fill="#1c0505" opacity="0.97"/>
      {/* Stair steps */}
      <rect x="296" y="452" width="128" height="8"  rx="1" fill="#0d0202" opacity="0.85"/>
      <rect x="316" y="460" width="88"  height="8"  rx="1" fill="#0a0202" opacity="0.8"/>

      {/* ══ TIER 1 — MAIN HALL ══ */}
      {/* Hall body */}
      <rect x="130" y="294" width="460" height="126" rx="3" fill="#1a0505" opacity="0.97"/>
      {/* Columns */}
      {[148,208,278,360,442,512,562].map((x,i)=>(
        <rect key={i} x={x} y="294" width="11" height="126" rx="4" fill="#260707" opacity="0.9"/>
      ))}
      {/* Window glow — amber light from inside */}
      <rect x="162" y="310" width="55"  height="70" rx="4" fill="#ffcc44" opacity="0.85" filter="url(#tWin)"/>
      <rect x="232" y="307" width="62"  height="74" rx="4" fill="#ffcc44" opacity="0.78" filter="url(#tWin)"/>
      {/* Center gate */}
      <rect x="316" y="302" width="88"  height="118" rx="5" fill="#ffaa22" opacity="0.90" filter="url(#tWin)"/>
      <rect x="324" y="310" width="30"  height="110" rx="3" fill="#ff9900" opacity="0.65"/>
      <rect x="366" y="310" width="30"  height="110" rx="3" fill="#ff9900" opacity="0.65"/>
      {/* Right windows */}
      <rect x="426" y="307" width="62"  height="74" rx="4" fill="#ffcc44" opacity="0.78" filter="url(#tWin)"/>
      <rect x="503" y="310" width="55"  height="70" rx="4" fill="#ffcc44" opacity="0.85" filter="url(#tWin)"/>
      <ellipse cx="189" cy="345" rx="34" ry="38" fill="#ffcc44" opacity="0.24" filter="url(#tAmb)"/>
      <ellipse cx="263" cy="344" rx="39" ry="40" fill="#ffcc44" opacity="0.19" filter="url(#tAmb)"/>
      <ellipse cx="360" cy="361" rx="54" ry="62" fill="#ffaa22" opacity="0.22" filter="url(#tAmb)"/>
      <ellipse cx="457" cy="344" rx="39" ry="40" fill="#ffcc44" opacity="0.19" filter="url(#tAmb)"/>
      <ellipse cx="530" cy="345" rx="34" ry="38" fill="#ffcc44" opacity="0.24" filter="url(#tAmb)"/>
      {/* Window frames */}
      {[
        [162,310,55,70],[232,307,62,74],[316,302,88,118],[426,307,62,74],[503,310,55,70]
      ].map(([x,y,w,h],i)=>(
        <rect key={i} x={x} y={y} width={w} height={h} rx="4" fill="none" stroke="#bb7700" strokeWidth="1.8" opacity="0.55"/>
      ))}

      {/* ── FIRST ROOF (widest, most prominent) ── */}
      {/* Main roof surface */}
      <path d="
        M 38,300
        Q 200,318 360,322
        Q 520,318 682,300
        L 648,256
        Q 490,272 360,276
        Q 230,272 72,256
        Z
      " fill="#550a0a" opacity="0.98"/>
      {/* Roof soffit (underside visible strip) */}
      <path d="
        M 72,256 Q 230,272 360,276 Q 490,272 648,256
        L 638,268 Q 478,284 360,288 Q 242,284 82,268 Z
      " fill="#3d0707" opacity="0.85"/>
      {/* Eave corner upturn — left */}
      <path d="M 38,300 Q 18,286 10,264 Q 22,270 42,284 Z" fill="#660c0c" opacity="0.95"/>
      {/* Eave corner upturn — right */}
      <path d="M 682,300 Q 702,286 710,264 Q 698,270 678,284 Z" fill="#660c0c" opacity="0.95"/>
      {/* Ridge line (golden) */}
      <path d="M 72,256 Q 230,246 360,244 Q 490,246 648,256"
        fill="none" stroke="#ffd000" strokeWidth="2.5" opacity="0.6"/>
      {/* Roof tile grooves */}
      {[140,195,255,315,360,405,465,525,580].map((x,i)=>(
        <line key={i} x1={x} y1="258" x2={x+15} y2="296" stroke="#3a0606" strokeWidth="1.2" opacity="0.35"/>
      ))}
      {/* Hanging lanterns under eave */}
      {[190, 360, 530].map((x,i)=>(
        <g key={i}>
          <line x1={x} y1="260" x2={x} y2="276" stroke="#770000" strokeWidth="1.5" opacity="0.7"/>
          <ellipse cx={x} cy="282" rx="7"  ry="11" fill="#cc0e0e" opacity="0.88"/>
          <ellipse cx={x} cy="273" rx="9"  ry="4"  fill="#880c0c" opacity="0.8"/>
          <ellipse cx={x} cy="293" rx="7"  ry="3"  fill="#880c0c" opacity="0.75"/>
          <ellipse cx={x} cy="282" rx="3.5" ry="6" fill="#ffdd44" opacity="0.92" filter="url(#tWin)"/>
        </g>
      ))}

      {/* ══ TIER 2 — SECOND FLOOR ══ */}
      <rect x="210" y="210" width="300" height="86" rx="3" fill="#1e0606" opacity="0.97"/>
      {[222,278,360,442,488].map((x,i)=>(
        <rect key={i} x={x} y="210" width="9" height="86" rx="3" fill="#280808" opacity="0.85"/>
      ))}
      <rect x="230" y="222" width="50" height="58" rx="3" fill="#ffcc44" opacity="0.82" filter="url(#tWin)"/>
      <rect x="300" y="218" width="120" height="64" rx="4" fill="#ffaa22" opacity="0.88" filter="url(#tWin)"/>
      <rect x="440" y="222" width="50" height="58" rx="3" fill="#ffcc44" opacity="0.82" filter="url(#tWin)"/>
      <ellipse cx="255" cy="251" rx="33" ry="32" fill="#ffcc44" opacity="0.21" filter="url(#tAmb)"/>
      <ellipse cx="360" cy="250" rx="72" ry="36" fill="#ffaa22" opacity="0.20" filter="url(#tAmb)"/>
      <ellipse cx="465" cy="251" rx="33" ry="32" fill="#ffcc44" opacity="0.21" filter="url(#tAmb)"/>

      {/* ── SECOND ROOF ── */}
      <path d="
        M 118,212
        Q 240,228 360,232
        Q 480,228 602,212
        L 572,172
        Q 450,186 360,190
        Q 270,186 148,172
        Z
      " fill="#660a0a" opacity="0.97"/>
      <path d="
        M 148,172 Q 270,186 360,190 Q 450,186 572,172
        L 562,182 Q 440,196 360,200 Q 280,196 158,182 Z
      " fill="#4a0808" opacity="0.8"/>
      <path d="M 118,212 Q 98,200 88,182 Q 102,188 120,200 Z" fill="#770c0c" opacity="0.95"/>
      <path d="M 602,212 Q 622,200 632,182 Q 618,188 600,200 Z" fill="#770c0c" opacity="0.95"/>
      <path d="M 148,172 Q 270,162 360,160 Q 450,162 572,172"
        fill="none" stroke="#ffd000" strokeWidth="2" opacity="0.5"/>
      {[220,295,360,425,500].map((x,i)=>(
        <line key={i} x1={x} y1="174" x2={x+12} y2="206" stroke="#3d0606" strokeWidth="1" opacity="0.3"/>
      ))}

      {/* ══ TIER 3 — UPPER FLOOR ══ */}
      <rect x="278" y="122" width="164" height="88" rx="3" fill="#220707" opacity="0.97"/>
      {[288,360,432].map((x,i)=>(
        <rect key={i} x={x} y="122" width="9" height="88" rx="3" fill="#2e0808" opacity="0.8"/>
      ))}
      <rect x="290" y="132" width="56" height="58" rx="3" fill="#ffcc44" opacity="0.84" filter="url(#tWin)"/>
      <rect x="374" y="132" width="56" height="58" rx="3" fill="#ffcc44" opacity="0.84" filter="url(#tWin)"/>
      <rect x="326" y="128" width="68" height="64" rx="4" fill="#ffaa22" opacity="0.90" filter="url(#tWin)"/>
      <ellipse cx="318" cy="161" rx="35" ry="33" fill="#ffcc44" opacity="0.22" filter="url(#tAmb)"/>
      <ellipse cx="402" cy="161" rx="35" ry="33" fill="#ffcc44" opacity="0.22" filter="url(#tAmb)"/>
      <ellipse cx="360" cy="160" rx="46" ry="36" fill="#ffaa22" opacity="0.20" filter="url(#tAmb)"/>

      {/* ── THIRD ROOF ── */}
      <path d="
        M 190,124
        Q 275,138 360,142
        Q 445,138 530,124
        L 508,90
        Q 422,103 360,107
        Q 298,103 212,90
        Z
      " fill="#770a0a" opacity="0.97"/>
      <path d="
        M 212,90 Q 298,103 360,107 Q 422,103 508,90
        L 499,100 Q 413,113 360,117 Q 307,113 221,100 Z
      " fill="#550808" opacity="0.78"/>
      <path d="M 190,124 Q 172,114 162,98 Q 176,104 194,116 Z" fill="#880c0c" opacity="0.95"/>
      <path d="M 530,124 Q 548,114 558,98 Q 544,104 526,116 Z" fill="#880c0c" opacity="0.95"/>
      <path d="M 212,90 Q 298,80 360,78 Q 422,80 508,90"
        fill="none" stroke="#ffd000" strokeWidth="1.8" opacity="0.45"/>

      {/* ══ SPIRE / FINIAL (bảo đỉnh) ══ */}
      {/* Base cap block sitting on third roof */}
      <rect x="336" y="52" width="48" height="36" rx="3" fill="#2a0808" opacity="0.97"/>
      <rect x="328" y="46" width="64" height="12" rx="4" fill="#330909" opacity="0.92"/>
      {/* Lotus base collar */}
      <ellipse cx="360" cy="46" rx="32" ry="6" fill="#ffd000" opacity="0.55"/>
      {/* Spire pole — thin needle */}
      <line x1="360" y1="4" x2="360" y2="46" stroke="#ffd000" strokeWidth="3.5" opacity="0.82" filter="url(#tGlw)"/>
      {/* Stacked rings — INCREASE in size going DOWN (proper pagoda finial) */}
      <ellipse cx="360" cy="40" rx="11" ry="4"   fill="#ffd000" opacity="0.90" filter="url(#tGlw)"/>
      <ellipse cx="360" cy="33" rx="8.5" ry="3.2" fill="#ffd000" opacity="0.84"/>
      <ellipse cx="360" cy="27" rx="7"   ry="2.8" fill="#ffd000" opacity="0.78"/>
      <ellipse cx="360" cy="22" rx="5.5" ry="2.4" fill="#ffd000" opacity="0.72"/>
      <ellipse cx="360" cy="17" rx="4"   ry="2"   fill="#ffd000" opacity="0.66"/>
      {/* Top orb / jewel */}
      <circle cx="360" cy="10" r="7" fill="#ffd000" opacity="0.95" filter="url(#tGlw)"/>
      {/* Sharp pointed tip */}
      <polygon points="360,1 356.5,10 363.5,10" fill="#ffd000" opacity="0.98" filter="url(#tGlw)"/>
      {/* Ambient glow halo around orb */}
      <circle cx="360" cy="10" r="20" fill="#ffd000" opacity="0.09" filter="url(#tAmb)"/>

    </svg>
  );
}


/* ── Clock widget ────────────────────────────────────────── */
function ClockWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  const secDeg  = s * 6;
  const minDeg  = m * 6 + s * 0.1;
  const hourDeg = (h % 12) * 30 + m * 0.5;

  const gold   = '#ffc44d';
  const light  = '#fff8d0';
  const faint  = 'rgba(255,210,140,.32)';
  const faceBg = 'rgba(6,2,16,.55)';
  const rim    = 'rgba(255,196,77,.68)';
  const glow   = 'drop-shadow(0 0 16px rgba(255,190,55,.5)) drop-shadow(0 2px 8px rgba(0,0,0,.5))';
  const secCol = '#ff7043';
  const WEEKS  = ['CN','T2','T3','T4','T5','T6','T7'];

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>

      {/* ── Analog face ── */}
      <svg width="124" height="124" viewBox="0 0 124 124" style={{ filter: glow, display:'block' }}>
        {/* outer ambient ring */}
        <circle cx="62" cy="62" r="59" fill="none" stroke={gold} strokeWidth="0.6" opacity="0.28"/>
        {/* face */}
        <circle cx="62" cy="62" r="56" fill={faceBg} stroke={rim} strokeWidth="2.8"/>

        {/* 12 tick marks */}
        {Array.from({length:12},(_,i) => {
          const a = (i*30 - 90) * Math.PI / 180;
          const major = i % 3 === 0;
          const r1 = major ? 41 : 46;
          return (
            <line key={i}
              x1={62 + r1   * Math.cos(a)} y1={62 + r1   * Math.sin(a)}
              x2={62 + 52.5 * Math.cos(a)} y2={62 + 52.5 * Math.sin(a)}
              stroke={major ? gold : faint}
              strokeWidth={major ? 2.8 : 1.3}
              strokeLinecap="round"
            />
          );
        })}

        {/* Roman numerals — 12 3 6 9 */}
        {[['XII',0],['III',90],['VI',180],['IX',270]].map(([n,deg]) => {
          const a = (deg-90)*Math.PI/180;
          return (
            <text key={n} x={62+31*Math.cos(a)} y={62+31*Math.sin(a)}
              textAnchor="middle" dominantBaseline="central"
              fill={gold} fontSize="8" fontWeight="700" letterSpacing="0.5" opacity="0.88">
              {n}
            </text>
          );
        })}

        {/* ☸ subtle center decoration */}
        <text x="62" y="50" textAnchor="middle" dominantBaseline="central"
          fill={faint} fontSize="9.5" opacity="0.55">☸</text>

        {/* Hour hand */}
        <g transform={`rotate(${hourDeg},62,62)`}>
          <line x1="62" y1="62" x2="62" y2="33" stroke={gold}  strokeWidth="4.2" strokeLinecap="round" opacity="0.92"/>
          <line x1="62" y1="62" x2="62" y2="69" stroke={gold}  strokeWidth="4.2" strokeLinecap="round" opacity="0.38"/>
        </g>

        {/* Minute hand */}
        <g transform={`rotate(${minDeg},62,62)`}>
          <line x1="62" y1="62" x2="62" y2="18" stroke={light} strokeWidth="2.8" strokeLinecap="round" opacity="0.90"/>
          <line x1="62" y1="62" x2="62" y2="71" stroke={light} strokeWidth="2.8" strokeLinecap="round" opacity="0.32"/>
        </g>

        {/* Second hand */}
        <g transform={`rotate(${secDeg},62,62)`}>
          <line x1="62" y1="62" x2="62" y2="14" stroke={secCol} strokeWidth="1.4" strokeLinecap="round" opacity="0.92"/>
          <line x1="62" y1="62" x2="62" y2="74" stroke={secCol} strokeWidth="1.4" strokeLinecap="round" opacity="0.50"/>
        </g>

        {/* Center cap */}
        <circle cx="62" cy="62" r="4.5" fill={gold}/>
        <circle cx="62" cy="62" r="2"   fill="#fffacc"/>
      </svg>

      {/* ── Digital + date ── */}
      <div style={{
        background: 'rgba(6,2,18,.55)',
        border: '1px solid rgba(255,196,77,.28)',
        borderRadius: 9, padding: '5px 14px',
        backdropFilter: 'blur(8px)',
        textAlign: 'center',
        boxShadow: '0 2px 14px rgba(0,0,0,.45)',
      }}>
        <div style={{
          fontFamily: 'monospace',
          fontSize: 18, fontWeight: 700, letterSpacing: 2.5,
          color: '#ffd59e',
          lineHeight: 1.15,
        }}>
          {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
        </div>
        <div style={{
          fontSize: 10, letterSpacing: 1.2, marginTop: 3,
          color: 'rgba(255,210,140,.48)',
        }}>
          {WEEKS[now.getDay()]} · {String(now.getDate()).padStart(2,'0')}/{String(now.getMonth()+1).padStart(2,'0')}/{now.getFullYear()}
        </div>
      </div>
    </div>
  );
}



/* ── Main ────────────────────────────────────────────────── */
export default function HomePage() {
  const canvasRef   = useRef(null);
  const fireflyRef  = useRef(null);
  const navigate    = useNavigate();
  const [mp, setMp] = useState({ x:0, y:0 });

  usePetals(canvasRef);
  useFireflies(fireflyRef);

  const onMove = (e) => setMp({
    x: (e.clientX / innerWidth  - 0.5) * 2,
    y: (e.clientY / innerHeight - 0.5) * 2,
  });

  const p = (d) => ({
    transform: `translate(${mp.x*d}px, ${mp.y*d*.3}px)`,
    transition: 'transform 0.1s ease-out',
  });

  return (
    <div onMouseMove={onMove} style={{
      width:'100vw', height:'100vh', position:'relative', overflow:'hidden',
      background:'linear-gradient(180deg,#04020e 0%,#09051c 10%,#120830 22%,#200c38 36%,#360f28 52%,#581420 65%,#7a1e18 78%,#963412 88%,#7a3208 100%)',
    }}>
      <style>{`
        @keyframes moonGlow{0%,100%{opacity:.85;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}
        @keyframes lanternSway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
        @keyframes twinkle{0%,100%{opacity:.25}50%{opacity:.9}}
        @keyframes treeSway{0%,100%{transform:rotate(-1.8deg)}50%{transform:rotate(1.8deg)}}
        @keyframes treeSwaySm{0%,100%{transform:rotate(-1.2deg)}50%{transform:rotate(1.2deg)}}
        @keyframes birdFly{from{transform:translateX(-120px)}to{transform:translateX(calc(100vw + 120px))}}
        @keyframes birdFlyRev{from{transform:translateX(calc(100vw + 120px))}to{transform:translateX(-120px)}}
        @keyframes loginHint{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:.75;transform:translateY(-3px)}}
        @keyframes mistDrift{0%,100%{transform:translateX(-18%) scaleX(1.4);opacity:.22}50%{transform:translateX(0%) scaleX(1.4);opacity:.36}}
        @keyframes mistDrift2{0%,100%{transform:translateX(12%) scaleX(1.5);opacity:.14}50%{transform:translateX(-12%) scaleX(1.5);opacity:.26}}
        @keyframes mistDrift3{0%,100%{transform:translateX(-8%) scaleX(1.3);opacity:.1}50%{transform:translateX(8%) scaleX(1.3);opacity:.2}}
        @keyframes buddhaFloat{0%,100%{transform:translateY(0px) scale(1)}50%{transform:translateY(-12px) scale(1.014)}}
        @keyframes buddhaGlow{0%,100%{opacity:.50}50%{opacity:.95}}
        @keyframes sacredRaysRotate{from{transform:translate(-50%,-20%) rotate(0deg)}to{transform:translate(-50%,-20%) rotate(360deg)}}
        @keyframes mandalaRingPulse{0%,100%{opacity:.28}50%{opacity:.62}}
        @keyframes mandalaRingPulse2{0%,100%{opacity:.14}50%{opacity:.42}}
      `}</style>

      {/* ── Sacred light rays — divine aura behind Buddha ── */}
      <div aria-hidden="true" style={{
        position:'absolute',
        left:'50%',
        top:'8%',
        width:'clamp(520px,66vw,920px)',
        aspectRatio:'1 / 1',
        transform:'translate(-50%, -20%)',
        zIndex:3,
        pointerEvents:'none',
        background:'repeating-conic-gradient(rgba(255,210,80,0.17) 0deg 8deg, transparent 8deg 24deg)',
        borderRadius:'50%',
        animation:'sacredRaysRotate 90s linear infinite',
        mixBlendMode:'screen',
      }}/>

      {/* ── Outer mandala ring 1 ── */}
      <div aria-hidden="true" style={{
        position:'absolute',
        left:'50%',
        top:'8%',
        width:'clamp(340px,42vw,580px)',
        aspectRatio:'1 / 1',
        transform:'translate(-50%, 2%)',
        zIndex:4,
        pointerEvents:'none',
        border:'1px solid rgba(255,215,0,0.30)',
        borderRadius:'50%',
        boxShadow:'0 0 40px rgba(255,200,60,0.22)',
        animation:'mandalaRingPulse 5s ease-in-out infinite',
      }}/>

      {/* ── Outer mandala ring 2 ── */}
      <div aria-hidden="true" style={{
        position:'absolute',
        left:'50%',
        top:'8%',
        width:'clamp(420px,52vw,700px)',
        aspectRatio:'1 / 1',
        transform:'translate(-50%, -4%)',
        zIndex:4,
        pointerEvents:'none',
        border:'1px solid rgba(255,215,0,0.18)',
        borderRadius:'50%',
        animation:'mandalaRingPulse2 7s ease-in-out 1.5s infinite',
      }}/>

      {/* ── Tượng Phật — centered divine focal point ── */}
      {/* Outer: pure centering, no parallax (divine immovability) */}
      <div aria-hidden="true" style={{
        position:'absolute',
        left:'50%',
        top:'8%',
        width:'clamp(220px,24vw,340px)',
        zIndex:12,
        pointerEvents:'none',
        transform:'translateX(-50%)',
      }}>
      {/* Inner: float animation */}
      <div style={{ position:'relative', animation:'buddhaFloat 6s ease-in-out infinite' }}>
        {/* Deep ambient halo — wide soft glow */}
        <div style={{
          position:'absolute',
          inset:'-55%',
          borderRadius:'50%',
          background:'radial-gradient(circle, rgba(255,245,120,0.82) 0%, rgba(255,200,50,0.48) 42%, rgba(255,140,20,0.18) 65%, transparent 78%)',
          animation:'buddhaGlow 4s ease-in-out infinite',
          pointerEvents:'none',
        }}/>

        {/* Mid glow ring */}
        <div style={{
          position:'absolute',
          inset:'-22%',
          borderRadius:'50%',
          background:'radial-gradient(circle, transparent 50%, rgba(255,215,80,0.28) 72%, transparent 90%)',
          pointerEvents:'none',
        }}/>

        {/* Outer golden ring — 2nd */}
        <div style={{
          position:'absolute',
          inset:'-12px',
          borderRadius:'50%',
          border:'1px solid rgba(255,215,0,0.50)',
          boxShadow:'0 0 50px rgba(255,215,70,0.65), 0 0 100px rgba(255,160,30,0.28)',
          pointerEvents:'none',
        }}/>

        {/* Inner golden ring */}
        <div style={{
          position:'absolute',
          inset:'-5px',
          borderRadius:'50%',
          border:'2px solid rgba(255,215,0,0.85)',
          boxShadow:'0 0 24px rgba(255,210,70,0.90), 0 0 50px rgba(255,170,30,0.40), inset 0 0 18px rgba(255,200,60,0.20)',
          pointerEvents:'none',
        }}/>

        {/* Circle crop container */}
        <div style={{
          borderRadius:'50%',
          overflow:'hidden',
          aspectRatio:'1 / 1',
          border:'2px solid rgba(255,215,0,0.65)',
          boxShadow:'inset 0 0 40px rgba(255,200,50,0.38)',
        }}>
          <img
            src="/adida.PNG"
            alt=""
            style={{
              width:'100%',
              height:'100%',
              objectFit:'cover',
              objectPosition:'center 18%',
              display:'block',
              filter:'brightness(1.18) saturate(1.25) contrast(1.06)',
            }}
          />
        </div>
      </div>{/* /inner float */}
      </div>{/* /outer centering */}

      {/* ── Clock widget — top-left sky ── */}
      <div style={{
        position:'absolute', top:'11%', left:'2.5%',
        zIndex:15, pointerEvents:'none',
        ...p(4),
      }}>
        <ClockWidget/>
      </div>

      {/* Stars */}
      <div aria-hidden="true" style={{position:'absolute',inset:0,pointerEvents:'none',...p(1.5)}}>
        {Array.from({length:55},(_,i)=>(
          <div key={i} style={{
            position:'absolute',
            left:`${(i*139.5)%100}%`, top:`${(i*82.3)%50}%`,
            width: 1+(i%3)*.6, height: 1+(i%3)*.6,
            borderRadius:'50%', background:'#fff',
            animation:`twinkle ${2+(i%5)*0.8}s ease-in-out ${(i*.27)%3}s infinite`,
          }}/>
        ))}
      </div>


      {/* Moon */}
      <div aria-hidden="true" style={{
        position:'absolute', right:'16%', top:'7%',
        width:120, height:120, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(255,235,165,.97) 30%,rgba(255,190,80,.65) 58%,transparent 74%)',
        boxShadow:'0 0 50px 18px rgba(255,210,90,.32),0 0 100px 50px rgba(255,160,50,.16)',
        animation:'moonGlow 5s ease-in-out infinite',
        pointerEvents:'none', zIndex:20,
        ...p(5),
      }}/>

      {/* ── Cinematic bottom CTA ── */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0,
        height:'48%',
        background:'linear-gradient(to top,rgba(4,1,10,0.92) 0%,rgba(4,1,10,0.58) 42%,transparent 100%)',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'flex-end',
        paddingBottom:'clamp(28px,5vh,52px)',
        gap:0,
        zIndex:22,
        pointerEvents:'none',
      }}>
        {/* Temple name — large atmospheric */}
        <div style={{
          fontWeight:900, fontSize:'clamp(26px,4.5vw,58px)',
          color:'#fff8e8',
          letterSpacing:'0.06em',
          textShadow:'0 0 60px rgba(255,180,30,0.55), 0 0 20px rgba(255,140,0,0.35), 0 2px 24px rgba(0,0,0,0.9)',
          lineHeight:1.1,
          textAlign:'center',
          pointerEvents:'none',
          marginBottom: 6,
        }}>
          Chùa Tân Thành
        </div>

        {/* Tagline */}
        <div style={{
          fontSize:'clamp(11px,1.4vw,15px)', letterSpacing:'0.28em',
          color:'rgba(255,210,130,0.55)',
          textTransform:'uppercase',
          marginBottom:28,
          pointerEvents:'none',
          textShadow:'0 1px 8px rgba(0,0,0,0.6)',
        }}>
          Nơi an lạc &nbsp;·&nbsp; Nơi tu tập
        </div>

        {/* Login button — frosted pill */}
        <button
          onClick={()=>navigate('/login')}
          style={{
            pointerEvents:'auto',
            padding:'clamp(12px,1.8vh,16px) clamp(40px,5vw,72px)',
            borderRadius:50,
            border:'1px solid rgba(255,196,77,0.45)',
            cursor:'pointer',
            background:'rgba(255,196,77,0.14)',
            backdropFilter:'blur(14px)',
            WebkitBackdropFilter:'blur(14px)',
            color:'#ffd59e',
            fontSize:'clamp(13px,1.4vw,16px)',
            fontWeight:800,
            letterSpacing:'0.22em',
            textTransform:'uppercase',
            boxShadow:'0 0 40px rgba(255,180,50,0.22), 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,220,100,0.18)',
            transition:'all 0.2s ease',
          }}
          onMouseEnter={e=>{
            e.currentTarget.style.background='rgba(255,196,77,0.26)';
            e.currentTarget.style.boxShadow='0 0 70px rgba(255,180,50,0.42), 0 8px 36px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,220,100,0.3)';
            e.currentTarget.style.borderColor='rgba(255,196,77,0.75)';
            e.currentTarget.style.transform='translateY(-3px)';
          }}
          onMouseLeave={e=>{
            e.currentTarget.style.background='rgba(255,196,77,0.14)';
            e.currentTarget.style.boxShadow='0 0 40px rgba(255,180,50,0.22), 0 4px 24px rgba(0,0,0,0.5)';
            e.currentTarget.style.borderColor='rgba(255,196,77,0.45)';
            e.currentTarget.style.transform='';
          }}
        >
          ☸ &nbsp; Đăng nhập
        </button>
      </div>

      {/* Horizon glow / atmospheric scattering */}
      <div aria-hidden="true" style={{
        position:'absolute', bottom:'18%', left:0, right:0, height:'22%',
        background:'radial-gradient(ellipse 70% 55% at 50% 100%, rgba(180,60,15,.30) 0%, rgba(120,30,10,.12) 50%, transparent 100%)',
        pointerEvents:'none', zIndex:1,
      }}/>

      {/* Cloud bands — mid sky */}
      <div aria-hidden="true" style={{position:'absolute',top:'28%',left:0,right:0,pointerEvents:'none',zIndex:2}}>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{width:'100%',height:60,display:'block',opacity:0.12}}>
          <path fill="rgba(200,180,220,1)"
            d="M-80,52 Q120,28 280,44 Q420,56 560,34 Q700,18 840,38 Q980,52 1120,30 Q1260,14 1440,36 L1440,80 L-80,80 Z"/>
          <path fill="rgba(140,100,160,0.5)"
            d="M-80,62 Q200,42 380,58 Q560,68 720,46 Q880,32 1060,52 Q1200,62 1440,48 L1440,80 L-80,80 Z"/>
        </svg>
      </div>
      <div aria-hidden="true" style={{position:'absolute',top:'38%',left:0,right:0,pointerEvents:'none',zIndex:2}}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{width:'100%',height:45,display:'block',opacity:0.08}}>
          <path fill="rgba(180,160,210,1)"
            d="M-80,40 Q300,18 520,34 Q740,48 960,24 Q1160,8 1440,30 L1440,60 L-80,60 Z"/>
        </svg>
      </div>

      {/* Mountains — distant (faintest, highest) */}
      <div style={{position:'absolute',bottom:'24%',width:'100%',pointerEvents:'none',...p(1.5)}}>
        <svg viewBox="0 0 1440 160" preserveAspectRatio="none" style={{width:'100%',height:140,display:'block'}}>
          <path fill="rgba(30,15,35,.38)"
            d="M0,155 Q80,118 160,138 Q220,128 290,100 Q350,116 420,108 Q490,96 560,80 Q630,92 700,110 Q770,100 850,74 Q920,88 990,96 Q1060,80 1130,100 Q1200,112 1280,92 Q1360,106 1440,118 L1440,160 L0,160 Z"/>
        </svg>
      </div>

      {/* Mountains — far */}
      <div style={{position:'absolute',bottom:'21%',width:'100%',pointerEvents:'none',...p(2.5)}}>
        <svg viewBox="0 0 1440 190" preserveAspectRatio="none" style={{width:'100%',height:165,display:'block'}}>
          <path fill="rgba(22,8,20,.55)"
            d="M0,180 Q60,148 130,162 Q180,148 240,118 Q300,132 360,120 Q420,106 490,80 Q560,96 630,112 Q700,100 770,78 Q840,90 910,106 Q980,88 1050,98 Q1120,110 1200,88 Q1280,100 1360,118 Q1400,128 1440,122 L1440,190 L0,190 Z"/>
        </svg>
      </div>

      {/* Mountains — near */}
      <div style={{position:'absolute',bottom:'18%',width:'100%',pointerEvents:'none',...p(5.5)}}>
        <svg viewBox="0 0 1440 175" preserveAspectRatio="none" style={{width:'100%',height:148,display:'block'}}>
          <path fill="rgba(14,5,16,.76)"
            d="M0,165 Q50,138 110,152 Q155,138 210,110 Q260,122 320,100 Q370,88 440,65 Q510,80 575,98 Q640,86 710,60 Q775,74 840,90 Q905,72 975,82 Q1040,92 1115,70 Q1180,82 1250,100 Q1320,88 1380,108 Q1420,118 1440,110 L1440,175 L0,175 Z"/>
        </svg>
      </div>

      {/* Ground */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:'22%',
        background:'linear-gradient(to bottom,rgba(10,3,2,.72) 0%,rgba(4,1,1,.98) 100%)',
        pointerEvents:'none',
      }}>
        <svg viewBox="0 0 1440 140" preserveAspectRatio="none" style={{width:'100%',height:'100%',display:'block'}}>
          <path fill="rgba(140,90,40,.18)" d="M 672,0 L 768,0 L 1040,140 L 400,140 Z"/>
          <path fill="rgba(160,110,55,.09)" d="M 696,0 L 744,0 L 892,140 L 548,140 Z"/>
          {[14,32,54,80,110].map((y,i)=>(
            <ellipse key={i} cx="720" cy={y} rx={8+i*5} ry="4.5" fill="rgba(190,145,70,.22)"/>
          ))}
        </svg>
      </div>

      {/* Cherry tree — far left (small) */}
      <div aria-hidden="true" style={{position:'absolute',left:'4%',bottom:'20%',pointerEvents:'none',zIndex:2,opacity:.65,...p(7)}}>
        <div style={{transform:'scale(.58)',transformOrigin:'bottom center',animation:'treeSwaySm 5.5s ease-in-out 0.3s infinite'}}>
          <CherryTree/>
        </div>
      </div>

      {/* Cherry tree — far right (small) */}
      <div aria-hidden="true" style={{position:'absolute',right:'4%',bottom:'20%',pointerEvents:'none',zIndex:2,opacity:.65,...p(7)}}>
        <div style={{transform:'scale(.58)',transformOrigin:'bottom center',animation:'treeSwaySm 6.2s ease-in-out 1.1s infinite'}}>
          <CherryTree flip/>
        </div>
      </div>

      {/* Cherry tree — near left */}
      <div aria-hidden="true" style={{position:'absolute',left:'-3%',bottom:'18%',pointerEvents:'none',zIndex:4,...p(13)}}>
        <div style={{transformOrigin:'bottom center',animation:'treeSway 4.8s ease-in-out 0s infinite'}}>
          <CherryTree/>
        </div>
      </div>

      {/* Cherry tree — near right */}
      <div aria-hidden="true" style={{position:'absolute',right:'-3%',bottom:'18%',pointerEvents:'none',zIndex:4,...p(13)}}>
        <div style={{transformOrigin:'bottom center',animation:'treeSway 5.2s ease-in-out 0.7s infinite'}}>
          <CherryTree flip/>
        </div>
      </div>

      {/* Temple */}
      <div style={{
        position:'absolute', left:'50%', bottom:'19%',
        transform:'translateX(-50%)',
        pointerEvents:'none', zIndex:2, opacity:.88,
        ...p(9),
      }}>
        <TempleSilhouette/>
      </div>

      {/* Stone lantern posts along the path (perspective-scaled, on ground) */}
      {[
        {left:'30%', bottom:'3%',  size:42, z:5},
        {left:'70%', bottom:'3%',  size:42, z:5},
        {left:'37%', bottom:'9%',  size:31, z:4},
        {left:'63%', bottom:'9%',  size:31, z:4},
        {left:'44%', bottom:'16%', size:22, z:3},
        {left:'56%', bottom:'16%', size:22, z:3},
      ].map((lp,i)=>(
        <div key={i} aria-hidden="true" style={{
          position:'absolute', left:lp.left, bottom:lp.bottom,
          pointerEvents:'none', zIndex:lp.z,
          transform:'translateX(-50%)',
          animation:`lanternPostPulse ${2.2 + i * 0.4}s ease-in-out ${i * 0.5}s infinite`,
        }}>
          <StoneLanternPost size={lp.size} lit={true}/>
        </div>
      ))}

      {/* Floating lanterns — hanging from inner tree branches */}
      {[
        {left:'12%', bottom:'46%', d:0},
        {left:'17%', bottom:'54%', d:1.8},
        {left:'80%', bottom:'46%', d:.5},
        {left:'75%', bottom:'54%', d:1.2},
      ].map((l,i)=>(
        <div key={i} aria-hidden="true" style={{
          position:'absolute',left:l.left,bottom:l.bottom,
          width:30,height:50,pointerEvents:'none',zIndex:6,
          animation:`lanternSway ${3.5+i*.4}s ease-in-out ${l.d}s infinite`,
          ...p(5+i*2),
        }}>
          <svg viewBox="0 0 30 54" style={{width:'100%',height:'100%'}}>
            <line x1="15" y1="0" x2="15" y2="8" stroke="#770000" strokeWidth="1.5" opacity="0.7"/>
            <ellipse cx="15" cy="12" rx="13" ry="5" fill="#880c0c" opacity="0.9"/>
            <ellipse cx="15" cy="26" rx="12" ry="16" fill="#cc0e0e" opacity="0.92"/>
            <ellipse cx="15" cy="42" rx="10" ry="4.5" fill="#880c0c" opacity="0.85"/>
            <line x1="12" y1="46" x2="11" y2="52" stroke="#880c0c" strokeWidth="1.2" opacity="0.7"/>
            <line x1="15" y1="46" x2="15" y2="53" stroke="#880c0c" strokeWidth="1.2" opacity="0.7"/>
            <line x1="18" y1="46" x2="19" y2="52" stroke="#880c0c" strokeWidth="1.2" opacity="0.7"/>
            <ellipse cx="15" cy="26" rx="6" ry="10" fill="#ffdd44" opacity={0.9}
              style={{filter:'url(#tGlw)'}}/>
          </svg>
        </div>
      ))}

      {/* Birds flying across sky */}
      {[
        {top:'11%', dur:'20s', delay:'-7s',  size:52},
        {top:'17%', dur:'26s', delay:'-16s', size:40},
        {top:'7%',  dur:'32s', delay:'-24s', size:34},
        {top:'14%', dur:'23s', delay:'-11s', size:28},
        {top:'4%',  dur:'17s', delay:'-4s',  size:44},
        {top:'21%', dur:'29s', delay:'-21s', size:22},
      ].map((b,i)=>(
        <div key={i} aria-hidden="true" style={{
          position:'absolute', top:b.top, left:0,
          pointerEvents:'none', zIndex:3,
          animation:`birdFly ${b.dur} linear ${b.delay} infinite`,
        }}>
          <svg viewBox="0 0 60 22" width={b.size} height={b.size*22/60} style={{display:'block'}}>
            <path d="M 0,11 Q 12,2 22,11" fill="none" stroke="rgba(20,4,4,.72)" strokeWidth="2.2" strokeLinecap="round"/>
            <path d="M 22,11 Q 32,20 42,11" fill="none" stroke="rgba(20,4,4,.72)" strokeWidth="2.2" strokeLinecap="round"/>
            <path d="M 42,11 Q 52,4 60,11" fill="none" stroke="rgba(20,4,4,.55)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
      ))}

      {/* Birds flying right→left */}
      {[
        {top:'9%',  dur:'24s', delay:'-8s',  size:36},
        {top:'19%', dur:'31s', delay:'-15s', size:26},
      ].map((b,i)=>(
        <div key={i} aria-hidden="true" style={{
          position:'absolute', top:b.top, right:0,
          pointerEvents:'none', zIndex:3,
          animation:`birdFlyRev ${b.dur} linear ${b.delay} infinite`,
        }}>
          <svg viewBox="0 0 60 22" width={b.size} height={b.size*22/60} style={{display:'block',transform:'scaleX(-1)'}}>
            <path d="M 0,11 Q 12,2 22,11" fill="none" stroke="rgba(20,4,4,.72)" strokeWidth="2.2" strokeLinecap="round"/>
            <path d="M 22,11 Q 32,20 42,11" fill="none" stroke="rgba(20,4,4,.72)" strokeWidth="2.2" strokeLinecap="round"/>
            <path d="M 42,11 Q 52,4 60,11" fill="none" stroke="rgba(20,4,4,.55)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
      ))}

      {/* Petal canvas */}
      <canvas ref={canvasRef} aria-hidden="true" style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:8}}/>

      {/* Firefly canvas — night only */}
      <canvas ref={fireflyRef} aria-hidden="true" style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:9}}/>

      {/* Ground mist — 3 animated layers */}
      <div aria-hidden="true" style={{position:'absolute',bottom:'17%',left:'-20%',right:'-20%',height:90,pointerEvents:'none',zIndex:7}}>
        <div style={{position:'absolute',inset:0,
          background:'linear-gradient(to top,rgba(180,80,30,.28) 0%,rgba(150,60,20,.12) 55%,transparent 100%)',
          animation:'mistDrift 14s ease-in-out infinite',
        }}/>
        <div style={{position:'absolute',inset:0,
          background:'linear-gradient(to top,rgba(200,100,40,.16) 0%,rgba(160,70,25,.06) 60%,transparent 100%)',
          animation:'mistDrift2 19s ease-in-out 3s infinite',
        }}/>
        <div style={{position:'absolute',inset:0,
          background:'linear-gradient(to top,rgba(160,60,20,.12) 0%,transparent 70%)',
          animation:'mistDrift3 25s ease-in-out 8s infinite',
        }}/>
      </div>

      {/* ── UI: top banner (title only) ── */}
      <div style={{
        position:'absolute', top:0, left:0, right:0,
        display:'flex', alignItems:'center',
        padding:'0 clamp(20px,4vw,48px)',
        height:'clamp(60px,8vh,80px)',
        background:'linear-gradient(to bottom,rgba(4,1,1,0.72),transparent)',
        zIndex:20, pointerEvents:'none',
      }}>
        <span style={{fontSize:28,filter:'drop-shadow(0 0 8px rgba(255,180,30,.8))'}}>☸</span>
        <div style={{marginLeft:10}}>
          <div style={{color:'#fff5d8',fontWeight:900,fontSize:'clamp(16px,2.2vw,22px)',letterSpacing:.5,lineHeight:1.2,textShadow:'0 1px 12px rgba(255,140,30,.5)'}}>
            Chùa Tân Thành
          </div>
          <div style={{color:'rgba(255,200,100,.55)',fontSize:10,letterSpacing:3,textTransform:'uppercase'}}>
            Hệ thống quản lý
          </div>
        </div>
      </div>

    </div>
  );
}
