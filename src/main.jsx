import React, { useEffect, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, Empty } from 'antd';
import viVN from 'antd/locale/vi_VN';
import enUS from 'antd/locale/en_US';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
import App from './App';
import './index.css';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';

function Root() {
  const { lang } = useLanguage();
  // Relative times, weekday/month names and antd pickers follow the UI language.
  // Set during render (idempotent) so the first paint after switching already uses it.
  dayjs.locale(lang === 'en' ? 'en' : 'vi');
  const reducedMotion = useReducedMotion();
  const locale = lang === 'vi' ? viVN : enUS;
  const theme = useMemo(() => ({
    token: {
      colorPrimary: '#93521c',
      motion: !reducedMotion,
      motionDurationFast: '0.14s',
      motionDurationMid: '0.22s',
      motionDurationSlow: '0.32s',
      colorLink: '#b06f2c',
      colorSuccess: '#4f9a72',
      colorInfo: '#4d8fc7',
      colorWarning: '#e0a23e',
      colorError: '#d9646c',
      colorText: '#3e2c1f',
      colorTextSecondary: '#6f5e50',
      colorBorder: '#eadfce',
      colorBorderSecondary: '#f3ebdf',
      colorBgLayout: '#f6f1e9',
      borderRadius: 10,
      borderRadiusLG: 14,
      controlHeight: 36,
      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      boxShadowTertiary: '0 1px 2px rgba(120,90,50,.04), 0 6px 20px rgba(120,90,50,.06)',
    },
    components: {
      Button: { primaryShadow: 'none', fontWeight: 600 },
      Table: {
        headerBg: '#faf4ea',
        headerColor: '#7a5230',
        headerSplitColor: 'transparent',
        rowHoverBg: '#fdf8f0',
        borderColor: '#f3ebdf',
      },
      Card: { colorBorderSecondary: '#ece1d1' },
      Tabs: { itemSelectedColor: '#93521c', inkBarColor: '#93521c', itemHoverColor: '#793f16' },
      Modal: { titleColor: '#5a3a22' },
    },
  }), [reducedMotion]);

  useEffect(() => {
    document.documentElement.lang = lang;
    ConfigProvider.config({
      holderRender: children => <ConfigProvider locale={locale} theme={theme}>{children}</ConfigProvider>,
    });
  }, [lang, locale, theme]);

  return (
    <ConfigProvider locale={locale} theme={theme} form={{ scrollToFirstError: { focus: true } }}
      renderEmpty={() => <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}>
      <App />
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <LanguageProvider>
    <Root />
  </LanguageProvider>
);
