import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, Empty } from 'antd';
import viVN from 'antd/locale/vi_VN';
import enUS from 'antd/locale/en_US';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import App from './App';
import './index.css';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';

dayjs.locale('vi');

function Root() {
  const { lang } = useLanguage();
  return (
    <ConfigProvider
      locale={lang === 'vi' ? viVN : enUS}
      renderEmpty={() => (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />
      )}
      theme={{
        token: {
          colorPrimary: '#c47f36',
          colorLink: '#b06f2c',
          colorSuccess: '#4f9a72',
          colorInfo: '#4d8fc7',
          colorWarning: '#e0a23e',
          colorError: '#d9646c',
          colorText: '#3e2c1f',
          colorTextSecondary: '#8c7a6b',
          colorBorder: '#eadfce',
          colorBorderSecondary: '#f3ebdf',
          colorBgLayout: '#fbf8f3',
          borderRadius: 10,
          borderRadiusLG: 14,
          controlHeight: 36,
          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          boxShadowTertiary: '0 1px 2px rgba(120,90,50,.04), 0 6px 20px rgba(120,90,50,.06)',
        },
        components: {
          Button: { primaryShadow: '0 4px 12px rgba(196,127,54,.25)', fontWeight: 600 },
          Table: {
            headerBg: '#faf4ea',
            headerColor: '#7a5230',
            headerSplitColor: 'transparent',
            rowHoverBg: '#fdf8f0',
            borderColor: '#f3ebdf',
          },
          Card: { colorBorderSecondary: '#f1e8da' },
          Tabs: { itemSelectedColor: '#b06f2c', inkBarColor: '#c47f36', itemHoverColor: '#c47f36' },
          Modal: { titleColor: '#5a3a22' },
        },
      }}
    >
      <App />
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <LanguageProvider>
    <Root />
  </LanguageProvider>
);
