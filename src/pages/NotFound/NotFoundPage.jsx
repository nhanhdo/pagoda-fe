import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
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
        <div className="not-found__mark"><DharmaWheel strokeWidth={5} /></div>
        <p className="not-found__code">404</p>
        <h1 style={{ margin: 0, color: '#5a3a22', fontSize: 17, fontWeight: 700, letterSpacing: 1 }}>{t.common.notFoundTitle}</h1>
        <p style={{ margin: 0, color: '#6f5e50', fontSize: 14 }}>{t.common.notFoundBody}</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button size="large" icon={<ArrowLeftOutlined aria-hidden="true" />} onClick={() => window.history.state?.idx > 0 ? navigate(-1) : navigate(home)}>{t.common.back}</Button>
          <Button size="large" type="primary" onClick={() => navigate(home)} style={{ borderRadius: 10 }}>
            {user ? t.common.notFoundToApp : t.layout.goHome}
          </Button>
        </div>
      </div>
    </main>
  );
}
