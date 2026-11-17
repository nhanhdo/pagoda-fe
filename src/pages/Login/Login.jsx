import React, { useEffect, useRef, useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import DharmaWheel from '../../components/DharmaWheel/DharmaWheel';
import ShaderCanvas from '../../components/ShaderCanvas/ShaderCanvas';
import { HALO_FRAG } from '../Home/homeShaders';

// Shader halo only where the brand panel is large (desktop/tablet); phones keep the CSS glow.
function useWideBrand() {
  const query = '(min-width: 721px)';
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
}

/* ── Falling petals canvas ───────────────────────────── */
function usePetals(ref) {
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize();
    const ctx = c.getContext('2d');
    const palette = ['255,183,197', '255,205,178', '245,200,120', '255,222,230'];
    class P {
      constructor(init) { this.reset(init); }
      reset(init) {
        this.x  = Math.random() * c.width;
        this.y  = init ? Math.random() * c.height : -14;
        this.s  = 3 + Math.random() * 4.5;
        this.vy = 0.3 + Math.random() * 0.8;
        this.a  = Math.random() * Math.PI * 2;
        this.rv = (Math.random() - 0.5) * 0.03;
        this.ph = Math.random() * Math.PI * 2;
        this.fr = 0.3 + Math.random() * 0.5;
        const op = 0.35 + Math.random() * 0.4;
        this.c = `rgba(${palette[~~(Math.random() * palette.length)]},${op})`;
      }
      tick(t) {
        this.y += this.vy;
        this.x += Math.sin(t * this.fr + this.ph) * 0.35;
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
    const count = innerWidth < 600 ? 45 : 90;
    const ps = Array.from({ length: count }, () => new P(true));
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

const CSS = `
  @keyframes lgRays{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
  @keyframes lgFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes lgGlow{0%,100%{opacity:.55}50%{opacity:.95}}
  @keyframes lgIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}

  .lg-root{
    position:relative; height:100vh; height:100dvh; overflow-y:auto; overflow-x:hidden;
    background:
      radial-gradient(ellipse 60% 50% at 15% 10%, rgba(255,214,150,0.45) 0%, transparent 60%),
      radial-gradient(ellipse 55% 45% at 90% 90%, rgba(255,190,170,0.35) 0%, transparent 60%),
      linear-gradient(160deg, #fffaf2 0%, #fbf1e1 45%, #f6e6cf 100%);
  }
  .lg-root::before{
    content:''; position:fixed; inset:0; pointer-events:none; z-index:0; opacity:.5;
    background-image: radial-gradient(rgba(180,130,60,0.10) 1px, transparent 1px);
    background-size: 22px 22px;
  }
  .lg-canvas{position:fixed; inset:0; pointer-events:none; z-index:1}
  .lg-center{
    position:relative; z-index:2; min-height:100%;
    display:flex; align-items:center; justify-content:center;
    padding:32px 20px;
  }
  .lg-card{
    display:flex; width:100%; max-width:940px; min-height:560px;
    background:#fff; border-radius:24px; overflow:hidden;
    box-shadow:0 24px 70px rgba(139,69,19,0.14), 0 4px 16px rgba(139,69,19,0.06), 0 0 0 1px rgba(200,150,80,0.14);
    animation:lgIn .6s ease both;
  }

  /* Brand panel */
  .lg-brand{
    flex:0 0 44%; position:relative; overflow:hidden;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:56px 36px; text-align:center;
    background:linear-gradient(165deg, #fff6e6 0%, #fbe7c6 50%, #f4d6a6 100%);
    border-right:1px solid rgba(200,150,80,0.18);
  }
  .lg-rays{
    position:absolute; left:50%; top:42%; width:560px; aspect-ratio:1/1; border-radius:50%;
    transform:translate(-50%,-50%);
    background:repeating-conic-gradient(rgba(255,255,255,0.55) 0deg 6deg, transparent 6deg 22deg);
    -webkit-mask:radial-gradient(circle, #000 20%, transparent 68%);
            mask:radial-gradient(circle, #000 20%, transparent 68%);
    animation:lgRays 120s linear infinite; pointer-events:none;
  }
  .lg-halo{
    position:absolute; left:50%; top:42%; width:300px; aspect-ratio:1/1; border-radius:50%;
    transform:translate(-50%,-50%);
    background:radial-gradient(circle, rgba(255,215,120,0.75) 0%, rgba(255,190,90,0.25) 45%, transparent 70%);
    animation:lgGlow 5s ease-in-out infinite; pointer-events:none;
  }
  .lg-buddha{position:relative; z-index:1; margin-bottom:24px; animation:lgFloat 6s ease-in-out infinite}
  /* WebGL halo centred on the medallion (shared with the homepage); sits behind the image */
  .lg-halo-gl{position:absolute; left:50%; top:50%; width:340%; aspect-ratio:1/1; transform:translate(-50%,-50%); z-index:-1; pointer-events:none}
  .lg-halo-gl .lg-rays--fallback{left:50%; top:50%; width:100%}
  .lg-halo-gl .lg-halo--fallback{left:50%; top:50%; width:53%}
  .lg-buddha-img{
    width:168px; aspect-ratio:1/1; border-radius:50%; overflow:hidden;
    border:3px solid #fff;
    box-shadow:0 0 0 2px rgba(212,160,23,0.55), 0 0 0 10px rgba(255,255,255,0.45), 0 14px 40px rgba(180,110,30,0.30);
  }
  .lg-buddha-img img{width:100%; height:100%; object-fit:cover; object-position:center 18%; display:block}
  .lg-title{
    position:relative; z-index:1; margin:0 0 6px;
    font-size:30px; font-weight:800; letter-spacing:.04em; color:#6b3410;
  }
  .lg-sub{
    position:relative; z-index:1; margin:0 0 28px;
    font-size:11px; letter-spacing:.32em; text-transform:uppercase; color:#a0703a;
  }
  .lg-quote{
    position:relative; z-index:1; max-width:250px; margin:0;
    font-size:13.5px; line-height:1.75; font-style:italic; color:#8a5a2b;
  }
  .lg-orn{display:flex; align-items:center; justify-content:center; gap:10px; color:#c9973a}
  .lg-orn i{display:block; width:36px; height:1px; background:linear-gradient(to right, transparent, rgba(201,151,58,0.7))}
  .lg-orn i:last-child{transform:scaleX(-1)}
  .lg-brand .lg-orn{position:absolute; bottom:24px; left:0; right:0; z-index:1}

  /* Form panel */
  .lg-form{
    flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:48px 56px; background:#fff;
  }
  .lg-form-inner{width:100%; max-width:360px}
  .lg-head{text-align:center; margin-bottom:30px}
  .lg-head-icon{
    display:inline-flex; align-items:center; justify-content:center;
    width:48px; height:48px; border-radius:50%; margin-bottom:14px; font-size:22px;
    color:#b07a2a; background:#fdf3e2; border:1px solid #f0dcb8;
  }
  .lg-head h2{margin:0; font-size:26px; font-weight:800; color:#3d2410; letter-spacing:.01em}
  .lg-head p{margin:6px 0 0; font-size:13px; color:#9a8068}
  .lg-label{font-size:12.5px; font-weight:600; color:#6b4a2e}

  .lg-input.ant-input-affix-wrapper{
    height:48px; border-radius:12px; background:#fdfaf5; border:1px solid #ead9c0;
    transition:border-color .2s, box-shadow .2s, background .2s;
  }
  .lg-input.ant-input-affix-wrapper:hover{border-color:#d4a85c}
  .lg-input.ant-input-affix-wrapper-focused{
    background:#fff; border-color:#c98a2e; box-shadow:0 0 0 3px rgba(201,138,46,0.14);
  }
  .lg-input .ant-input{background:transparent; color:#3d2410; font-size:14.5px}
  .lg-input .ant-input::placeholder{color:#bfa98c}
  .lg-input .ant-input-prefix{margin-inline-end:10px; color:#c49a5c}
  .lg-input .ant-input-suffix .anticon{color:#c49a5c}

  .lg-btn.ant-btn{
    height:50px; border-radius:12px; border:2px solid transparent !important;
    background:linear-gradient(135deg, #c98a2e 0%, #e0a84a 50%, #b8741f 100%) padding-box;
    color:#fff; font-weight:700; font-size:15px; letter-spacing:.06em;
    box-shadow:0 8px 22px rgba(185,116,31,0.30);
    transition:transform .2s, box-shadow .2s, filter .2s;
  }
  /* Gold fill + spinning rainbow ring (shared glow-spin / glow-halo keyframes in index.css) */
  .lg-btn.ant-btn:not(:disabled):is(:hover, :focus-visible){
    background:
      linear-gradient(135deg, #c98a2e 0%, #e0a84a 50%, #b8741f 100%) padding-box,
      conic-gradient(from var(--glow-angle), #4285f4, #9b72cb, #d96570, #fbbc05, #34a853, #4285f4) border-box !important;
    color:#fff !important; filter:brightness(1.05);
    transform:translateY(-1px);
    animation: glow-spin 2.6s linear infinite, glow-halo 2.6s linear infinite;
  }
  @media (prefers-reduced-motion: reduce){ .lg-btn.ant-btn:not(:disabled):is(:hover, :focus-visible){ animation:none; } }
  .lg-btn.ant-btn:not(:disabled):active{transform:none}

  .lg-error{
    display:flex; align-items:center; gap:8px; margin-bottom:16px; padding:10px 14px;
    border-radius:10px; background:#fff2f0; border:1px solid #ffccc7;
    color:#cf1322; font-size:13px; font-weight:500;
  }
  .lg-forgot{
    display:block; margin:18px auto 0; padding:4px 8px; background:none; border:none;
    color:#a0703a; font-size:13px; cursor:pointer; transition:color .18s;
  }
  .lg-forgot:hover{color:#6b3410; text-decoration:underline}
  .lg-foot{margin-top:28px; text-align:center}
  .lg-foot span{display:block; margin-top:6px; font-size:11.5px; letter-spacing:.14em; color:#b8996f}

  /* ── Tablet: narrower brand panel ── */
  @media (max-width: 960px){
    .lg-card{max-width:760px; min-height:520px}
    .lg-brand{flex-basis:42%; padding:48px 26px}
    .lg-buddha-img{width:140px}
    .lg-title{font-size:25px}
    .lg-form{padding:40px 36px}
  }

  /* ── Portrait tablet & phone: stack ── */
  @media (max-width: 720px){
    .lg-center{padding:24px 16px; align-items:flex-start}
    .lg-card{flex-direction:column; max-width:480px; min-height:0; border-radius:20px; margin:auto 0}
    .lg-brand{
      flex:none; flex-direction:row; justify-content:center; gap:16px; text-align:left;
      padding:24px 24px; border-right:none; border-bottom:1px solid rgba(200,150,80,0.18);
    }
    .lg-rays{width:420px; left:22%; top:50%}
    .lg-halo{width:180px; left:22%; top:50%}
    .lg-buddha{margin:0; flex-shrink:0}
    .lg-buddha-img{width:84px; border-width:2px; box-shadow:0 0 0 2px rgba(212,160,23,0.55), 0 0 0 6px rgba(255,255,255,0.45), 0 8px 22px rgba(180,110,30,0.28)}
    .lg-title{font-size:22px; margin-bottom:4px}
    .lg-sub{margin:0; font-size:10px; letter-spacing:.24em}
    .lg-quote, .lg-brand .lg-orn{display:none}
    .lg-form{padding:30px 28px 28px}
    .lg-head{margin-bottom:22px}
    .lg-head-icon{display:none}
    .lg-head h2{font-size:22px}
  }

  /* ── Small phone ── */
  @media (max-width: 400px){
    .lg-center{padding:14px 10px}
    .lg-card{border-radius:16px}
    .lg-brand{padding:20px 16px; gap:12px}
    .lg-buddha-img{width:68px}
    .lg-title{font-size:19px}
    .lg-form{padding:24px 18px 22px}
    .lg-input.ant-input-affix-wrapper, .lg-btn.ant-btn{height:46px}
  }

  /* ── Landscape phone (short height) ── */
  @media (max-height: 520px) and (min-width: 721px){
    .lg-center{align-items:flex-start; padding:16px}
    .lg-card{min-height:0}
    .lg-brand{padding:28px 24px}
    .lg-buddha-img{width:96px}
    .lg-buddha{margin-bottom:14px}
    .lg-sub{margin-bottom:0}
    .lg-quote, .lg-brand .lg-orn, .lg-head-icon{display:none}
    .lg-form{padding:24px 36px}
    .lg-head{margin-bottom:16px}
    .lg-foot{display:none}
  }

  @media (prefers-reduced-motion: reduce){
    .lg-rays, .lg-halo, .lg-buddha, .lg-card{animation:none}
  }
`;

/* ── Main component ──────────────────────────────────── */
export default function Login() {
  const { t }              = useLanguage();
  const { login, loading } = useAuth();
  const [error, setError]  = useState('');
  const canvasRef          = useRef(null);
  const wideBrand          = useWideBrand();
  usePetals(canvasRef);

  useEffect(() => {
    if (sessionStorage.getItem('logoutReason') === 'idle') {
      sessionStorage.removeItem('logoutReason');
      message.warning(t.login.idleLoggedOut, 6);
    }
  }, []);

  const onFinish = async (values) => {
    setError('');
    const result = await login(values.username, values.password);
    if (!result.success) setError(result.message || t.login.invalidCredentials);
  };

  return (
    <div className="lg-root">
      <style>{CSS}</style>
      <canvas ref={canvasRef} className="lg-canvas" />

      <div className="lg-center">
        <div className="lg-card">

          {/* ── Brand panel ── */}
          <div className="lg-brand">
            {!wideBrand && (
              <>
                <div className="lg-rays" aria-hidden="true" />
                <div className="lg-halo" aria-hidden="true" />
              </>
            )}

            <div className="lg-buddha">
              {wideBrand && (
                <div className="lg-halo-gl" aria-hidden="true">
                  <ShaderCanvas
                    fragment={HALO_FRAG}
                    fps={45}
                    fallback={(
                      <>
                        <div className="lg-rays lg-rays--fallback" />
                        <div className="lg-halo lg-halo--fallback" />
                      </>
                    )}
                  />
                </div>
              )}
              <div className="lg-buddha-img">
                <img src="/adida.PNG" alt="" />
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 className="lg-title">Chùa Tân Thành</h1>
              <p className="lg-sub">Hệ thống quản lý</p>
              <p className="lg-quote">"Tâm bình thì thế giới bình, tâm an thì vạn sự an"</p>
            </div>

            <div className="lg-orn" aria-hidden="true"><i /><DharmaWheel /><i /></div>
          </div>

          {/* ── Form panel ── */}
          <div className="lg-form">
            <div className="lg-form-inner">
              <div className="lg-head">
                <div className="lg-head-icon"><DharmaWheel /></div>
                <h2>{t.login.sectionLabel || 'Đăng nhập'}</h2>
                <p>Vui lòng đăng nhập để tiếp tục</p>
              </div>

              <Form layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
                {error && (
                  <div className="lg-error" role="alert">
                    <span>⚠</span><span>{error}</span>
                  </div>
                )}

                <Form.Item
                  name="username"
                  label={<span className="lg-label">{t.login.usernameLabel}</span>}
                  style={{ marginBottom: 16 }}
                  rules={[{ required: true, message: t.login.usernameRequired }]}
                >
                  <Input className="lg-input" prefix={<UserOutlined />} placeholder={t.login.usernamePlaceholder} autoComplete="username" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label={<span className="lg-label">{t.login.passwordLabel}</span>}
                  style={{ marginBottom: 26 }}
                  rules={[{ required: true, message: t.login.passwordRequired }]}
                >
                  <Input.Password className="lg-input" prefix={<LockOutlined />} placeholder={t.login.passwordPlaceholder} autoComplete="current-password" />
                </Form.Item>

                <Button type="primary" htmlType="submit" block loading={loading} className="lg-btn">
                  {t.login.signIn || t.login.submitButton}
                </Button>
              </Form>

              <button
                type="button"
                className="lg-forgot"
                onClick={() => message.info({ content: t.login.forgotPasswordMessage, duration: 4 })}
              >
                {t.login.forgotPassword}
              </button>

              <div className="lg-foot">
                <div className="lg-orn" aria-hidden="true"><i /><span style={{ fontSize: 10 }}>✦</span><i /></div>
                <span>Nam Mô A Di Đà Phật</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
