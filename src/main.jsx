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
          colorPrimary: '#8B4513',
          colorLink: '#8B4513',
          borderRadius: 6,
          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
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
