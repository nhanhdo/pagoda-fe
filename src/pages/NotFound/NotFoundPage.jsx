import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import DharmaWheel from '../../components/DharmaWheel/DharmaWheel';
import LangToggle from '../../components/LangToggle/LangToggle';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  // Signed-in users belong in the app, not on the public landing page
  const home = user ? '/app/dashboard' : '/';

  return (
    // html/body don't scroll (the app shell does), so this page scrolls itself on short screens
    <main className="not-found">
      <div style={{ position: 'fixed', top: 14, right: 14, zIndex: 2 }}><LangToggle /></div>
      <div className="not-found__body" style={{
        minHeight: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 20, padding: '56px 24px 32px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 72, color: '#e0a454', filter: 'drop-shadow(0 6px 18px rgba(224,164,84,.35))' }}><DharmaWheel strokeWidth={5} /></div>
        <div style={{ color: '#c47f36', fontSize: 'clamp(48px,8vw,96px)', fontWeight: 900, lineHeight: 1 }}>404</div>
        <h1 style={{ margin: 0, color: '#5a3a22', fontSize: 17, fontWeight: 700, letterSpacing: 1 }}>{t.common.notFoundTitle}</h1>
        <p style={{ margin: 0, color: '#6f5e50', fontSize: 14 }}>{t.common.notFoundBody}</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button size="large" onClick={() => window.history.state?.idx > 0 ? navigate(-1) : navigate(home)} style={{ borderRadius: 10 }}>← {t.common.back}</Button>
          <Button size="large" type="primary" onClick={() => navigate(home)} style={{ borderRadius: 10 }}>
            {user ? t.common.notFoundToApp : t.layout.goHome}
          </Button>
        </div>
      </div>
    </main>
  );
}
