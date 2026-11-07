import React, { useEffect, useRef, useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';

/* ── Falling petals canvas ───────────────────────────── */
function usePetals(ref) {
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize();
    const ctx = c.getContext('2d');
    class P {
      constructor(init) { this.reset(init); }
      reset(init) {
        this.x  = Math.random() * c.width;
        this.y  = init ? Math.random() * c.height : -14;
        this.s  = 2.5 + Math.random() * 4.5;
        this.vy = 0.4 + Math.random() * 1.1;
        this.a  = Math.random() * Math.PI * 2;
        this.rv = (Math.random() - 0.5) * 0.038;
        this.ph = Math.random() * Math.PI * 2;
        this.fr = 0.3 + Math.random() * 0.5;
        this.op = 0.28 + Math.random() * 0.5;
        const r = Math.random();
        this.c = r < 0.55
          ? `rgba(255,${155+~~(r*180)},${175+~~(r*60)},${this.op})`
          : `rgba(255,${185+~~(Math.random()*50)},${200+~~(Math.random()*40)},${this.op})`;
      }
      tick(t) {
        this.y += this.vy;
        this.x += Math.sin(t * this.fr + this.ph) * 0.38;
        this.a += this.rv;
        if (this.y > c.height + 16) this.reset(false);
      }
      draw() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.a);
        ctx.fillStyle = this.c;
        const s = this.s;
        ctx.beginPath();
        ctx.moveTo(0,-s); ctx.bezierCurveTo(s*.75,-s*.35,s*.75,s*.35,0,s);
        ctx.bezierCurveTo(-s*.75,s*.35,-s*.75,-s*.35,0,-s);
        ctx.fill(); ctx.restore();
      }
    }
    const ps = Array.from({ length: 200 }, (_, i) => new P(true));
    let t = 0, id;
    const go = () => {
      id = requestAnimationFrame(go);
      ctx.clearRect(0, 0, c.width, c.height);
      t += 0.013;
      ps.forEach(p => { p.tick(t); p.draw(); });
    };
    const onVis = () => { if (document.hidden) cancelAnimationFrame(id); else go(); };
    go();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVis);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVis); };
  }, []);
}

/* ── Main component ──────────────────────────────────── */
export default function Login() {
  const { t }              = useLanguage();
  const { login, loading } = useAuth();
  const [error, setError]  = useState('');
  const canvasRef          = useRef(null);
  usePetals(canvasRef);

  React.useEffect(() => {
    if (sessionStorage.getItem('logoutReason') === 'idle') {
      sessionStorage.removeItem('logoutReason');
      message.warning('Phiên làm việc đã hết hạn do không hoạt động. Vui lòng đăng nhập lại.', 6);
    }
  }, []);

  const onFinish = async (values) => {
    setError('');
    const result = await login(values.username, values.password);
    if (!result.success) setError(result.message || t.login.invalidCredentials);
  };

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      background: 'linear-gradient(155deg, #120600 0%, #2a0c04 18%, #4a1a08 38%, #7a2e10 56%, #5a1e08 72%, #2a0c04 86%, #0e0400 100%)',
      padding: '24px 20px',
    }}>
      <style>{`
        @keyframes buddhaGlowL{0%,100%{opacity:.50}50%{opacity:.88}}
        @keyframes raysL{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
        @keyframes floatL{0%,100%{transform:translateY(0px)}50%{transform:translateY(-9px)}}
        @keyframes shimmer{0%,100%{opacity:.6}50%{opacity:1}}
        .lf-input.ant-input-affix-wrapper {
          background: rgba(255,245,230,0.07) !important;
          border: 1px solid rgba(255,200,100,0.22) !important;
          border-radius: 10px !important;
          height: 48px !important;
          transition: border-color .2s, box-shadow .2s !important;
        }
        .lf-input.ant-input-affix-wrapper:hover {
          border-color: rgba(255,200,100,0.45) !important;
        }
        .lf-input.ant-input-affix-wrapper-focused {
          border-color: rgba(255,200,80,0.70) !important;
          box-shadow: 0 0 0 3px rgba(255,180,50,0.14) !important;
        }
        .lf-input .ant-input { background: transparent !important; color: #fdf0d8 !important; font-size: 14px !important; }
        .lf-input .ant-input::placeholder { color: rgba(255,210,140,0.30) !important; }
        .lf-input .ant-input-password input { background: transparent !important; color: #fdf0d8 !important; font-size: 14px !important; }
        .lf-input .ant-input-password input::placeholder { color: rgba(255,210,140,0.30) !important; }
        .lf-input .ant-input-prefix .anticon { color: rgba(255,196,77,0.45) !important; }
        .lf-input .ant-input-suffix .anticon { color: rgba(255,196,77,0.40) !important; }
        .lf-btn { transition: all 0.2s ease !important; }
        .lf-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 36px rgba(255,170,40,0.38) !important; }
        .lf-btn:active { transform: translateY(0) !important; }
        @media (max-width: 680px) { .login-left-col { display: none !important; } .login-divider-col { display: none !important; } }
      `}</style>

      {/* Full-screen petals */}
      <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}/>

      {/* Full-screen ambient glow */}
      <div aria-hidden="true" style={{
        position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        background:'radial-gradient(ellipse 70% 60% at 50% 42%, rgba(255,160,30,0.10) 0%, transparent 70%)',
      }}/>

      {/* ── Main card ── */}
      <div style={{
        position:'relative', zIndex:2,
        display:'flex',
        width:'100%',
        maxWidth:900,
        minHeight:540,
        borderRadius:24,
        overflow:'hidden',
        boxShadow:'0 32px 100px rgba(0,0,0,0.70), 0 0 0 1px rgba(255,200,80,0.12)',
      }}>

        {/* ════ LEFT — brand panel ════ */}
        <div className="login-left-col" style={{
          flex:'0 0 44%',
          position:'relative',
          background:'linear-gradient(160deg, #1e0804 0%, #3d1206 28%, #6b2210 55%, #3d1206 80%, #180602 100%)',
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          padding:'48px 36px',
          overflow:'hidden',
        }}>
          {/* Rotating sacred rays */}
          <div aria-hidden="true" style={{
            position:'absolute', left:'50%', top:'46%',
            width:'clamp(380px,55vw,560px)', aspectRatio:'1/1',
            transform:'translate(-50%,-50%)',
            borderRadius:'50%',
            background:'repeating-conic-gradient(rgba(255,195,55,0.14) 0deg 7deg, transparent 7deg 24deg)',
            animation:'raysL 110s linear infinite',
            zIndex:0, pointerEvents:'none',
          }}/>

          {/* Wide ambient glow */}
          <div aria-hidden="true" style={{
            position:'absolute', left:'50%', top:'40%',
            width:'72%', aspectRatio:'1/1',
            transform:'translate(-50%,-50%)',
            borderRadius:'50%',
            background:'radial-gradient(circle, rgba(255,210,70,0.26) 0%, rgba(255,140,20,0.11) 48%, transparent 70%)',
            animation:'buddhaGlowL 5s ease-in-out infinite',
            zIndex:0, pointerEvents:'none',
          }}/>

          {/* Buddha image */}
          <div style={{ position:'relative', zIndex:1, animation:'floatL 5.5s ease-in-out infinite', marginBottom:24 }}>
            {/* Outer halo */}
            <div style={{ position:'absolute', inset:'-12px', borderRadius:'50%',
              border:'1px solid rgba(255,215,0,0.32)',
              boxShadow:'0 0 44px rgba(255,200,50,0.24)',
              pointerEvents:'none' }}/>
            {/* Inner ring */}
            <div style={{ position:'absolute', inset:'-4px', borderRadius:'50%',
              border:'2px solid rgba(255,215,0,0.60)',
              boxShadow:'0 0 20px rgba(255,195,55,0.55), inset 0 0 14px rgba(255,170,30,0.16)',
              pointerEvents:'none' }}/>
            <div style={{
              width:'clamp(130px,13vw,172px)', aspectRatio:'1/1',
              borderRadius:'50%', overflow:'hidden',
              border:'2px solid rgba(255,215,0,0.42)',
            }}>
              <img src="/adida.PNG" alt="" style={{
                width:'100%', height:'100%',
                objectFit:'cover', objectPosition:'center 18%',
                display:'block',
                filter:'brightness(1.14) saturate(1.18)',
              }}/>
            </div>
          </div>

          {/* Temple name */}
          <h1 style={{
            position:'relative', zIndex:1,
            margin:'0 0 8px',
            fontSize:'clamp(22px,2.6vw,30px)',
            fontWeight:900,
            color:'#fdf4e3',
            letterSpacing:'0.08em',
            textAlign:'center',
            textShadow:'0 2px 24px rgba(255,160,30,0.55)',
          }}>Chùa Tân Thành</h1>

          <p style={{
            position:'relative', zIndex:1,
            margin:'0 0 32px',
            fontSize:11,
            color:'rgba(255,210,130,0.52)',
            letterSpacing:'0.30em',
            textTransform:'uppercase',
            textAlign:'center',
          }}>Hệ thống quản lý</p>

          {/* Quote */}
          <div style={{
            position:'relative', zIndex:1,
            borderLeft:'2px solid rgba(255,215,0,0.28)',
            paddingLeft:14,
            maxWidth:220,
          }}>
            <p style={{
              margin:0,
              fontSize:13,
              color:'rgba(255,230,170,0.62)',
              fontStyle:'italic',
              lineHeight:1.75,
            }}>"Tâm bình thì thế giới bình, tâm an thì vạn sự an"</p>
          </div>

          {/* Bottom ornament */}
          <div style={{
            position:'absolute', bottom:24,
            display:'flex', alignItems:'center', gap:10, zIndex:1,
          }}>
            <div style={{width:40, height:1, background:'linear-gradient(to right, transparent, rgba(255,215,0,0.30))'}}/>
            <span style={{color:'rgba(255,215,0,0.50)', fontSize:16}}>☸</span>
            <div style={{width:40, height:1, background:'linear-gradient(to left, transparent, rgba(255,215,0,0.30))'}}/>
          </div>

          {/* Top label */}
          <div style={{
            position:'absolute', top:22,
            display:'flex', alignItems:'center', gap:10, zIndex:1,
          }}>
            <div style={{width:28, height:1, background:'rgba(255,215,0,0.20)'}}/>
            <span style={{color:'rgba(255,215,0,0.32)', fontSize:10, letterSpacing:'0.32em'}}>TÂN THÀNH</span>
            <div style={{width:28, height:1, background:'rgba(255,215,0,0.20)'}}/>
          </div>
        </div>

        {/* ════ DIVIDER ════ */}
        <div className="login-divider-col" style={{
          width:1,
          background:'linear-gradient(to bottom, transparent, rgba(255,200,80,0.20) 25%, rgba(255,200,80,0.28) 50%, rgba(255,200,80,0.20) 75%, transparent)',
          flexShrink:0,
        }}/>

        {/* ════ RIGHT — login form ════ */}
        <div style={{
          flex:1,
          background:'rgba(10,4,2,0.88)',
          backdropFilter:'blur(28px)',
          WebkitBackdropFilter:'blur(28px)',
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          padding:'clamp(36px,5vh,56px) clamp(32px,5vw,56px)',
        }}>
          {/* Form header */}
          <div style={{ width:'100%', maxWidth:340, marginBottom:32, textAlign:'center' }}>
            <div style={{
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              width:46, height:46, borderRadius:'50%',
              background:'rgba(255,196,77,0.10)',
              border:'1px solid rgba(255,196,77,0.28)',
              marginBottom:16,
              fontSize:20,
            }}>☸</div>
            <h2 style={{
              margin:0, color:'#fdf4e3',
              fontSize:'clamp(20px,2.2vw,24px)',
              fontWeight:800, letterSpacing:'0.04em',
            }}>{t.login.sectionLabel || 'Đăng nhập'}</h2>
            <p style={{
              margin:'6px 0 0',
              fontSize:11,
              color:'rgba(255,200,100,0.40)',
              letterSpacing:'0.22em',
              textTransform:'uppercase',
            }}>Chùa Tân Thành</p>
          </div>

          {/* Form */}
          <Form layout="vertical" onFinish={onFinish} size="large" style={{ width:'100%', maxWidth:340 }}>

            {/* Error */}
            {error && (
              <div style={{
                background:'rgba(255,60,40,0.10)',
                border:'1px solid rgba(255,80,60,0.32)',
                borderRadius:10, padding:'10px 14px',
                marginBottom:16,
                display:'flex', alignItems:'center', gap:8,
              }}>
                <span style={{fontSize:14}}>⚠</span>
                <span style={{color:'rgba(255,120,100,0.95)', fontSize:13, fontWeight:600}}>{error}</span>
              </div>
            )}

            <Form.Item
              name="username"
              label={<span style={{ color:'rgba(255,200,100,0.55)', fontSize:10.5, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase' }}>{t.login.usernameLabel}</span>}
              style={{ marginBottom:14 }}
              rules={[{ required:true, message:t.login.usernameRequired }]}
            >
              <Input className="lf-input" prefix={<UserOutlined/>} placeholder="Nhập tên đăng nhập"/>
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ color:'rgba(255,200,100,0.55)', fontSize:10.5, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase' }}>{t.login.passwordLabel}</span>}
              style={{ marginBottom:28 }}
              rules={[{ required:true, message:t.login.passwordRequired }]}
            >
              <Input.Password
                className="lf-input"
                prefix={<LockOutlined/>}
                placeholder="Nhập mật khẩu"
                style={{ borderColor: error ? 'rgba(255,80,60,0.52)' : undefined }}
              />
            </Form.Item>

            <Button
              type="primary" htmlType="submit" block loading={loading}
              className="lf-btn"
              style={{
                height:50, borderRadius:12,
                background:'linear-gradient(135deg, #c17f3a 0%, #e8a84a 50%, #c17f3a 100%)',
                border:'none', color:'#1a0800',
                fontWeight:800, fontSize:14,
                letterSpacing:'0.18em', textTransform:'uppercase',
                boxShadow:'0 4px 22px rgba(255,170,40,0.30)',
              }}
            >
              {t.login.submitButton}
            </Button>
          </Form>

          {/* Forgot password */}
          <div style={{ marginTop:18 }}>
            <span
              style={{ color:'rgba(255,200,100,0.35)', fontSize:12, cursor:'pointer', letterSpacing:'0.05em', transition:'color .18s' }}
              onClick={() => message.info({ content: t.login.forgotPasswordMessage, duration:4 })}
              onMouseEnter={e => e.target.style.color = 'rgba(255,200,100,0.70)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,200,100,0.35)'}
            >
              {t.login.forgotPassword}
            </span>
          </div>

          {/* Footer note */}
          <div style={{
            marginTop:'auto', paddingTop:32,
            display:'flex', flexDirection:'column', alignItems:'center', gap:6,
          }}>
            <div style={{ display:'flex', gap:8, alignItems:'center', opacity:.22 }}>
              <div style={{width:28, height:1, background:'rgba(255,200,80,1)'}}/>
              <span style={{color:'rgba(255,200,80,1)', fontSize:10}}>✦</span>
              <div style={{width:28, height:1, background:'rgba(255,200,80,1)'}}/>
            </div>
            <span style={{ fontSize:10.5, color:'rgba(255,200,100,0.22)', letterSpacing:'0.15em' }}>
              Nam Mô A Di Đà Phật
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
