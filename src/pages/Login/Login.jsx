import React, { useEffect, useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import DharmaWheel from '../../components/DharmaWheel/DharmaWheel';
import LangToggle from '../../components/LangToggle/LangToggle';
import './Login.css';

export default function Login() {
  const { t }              = useLanguage();
  const { login, loading } = useAuth();
  const [error, setError]  = useState('');
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
      <LangToggle className="lg-lang" />

      <div className="lg-center">
        <div className="lg-card">

          {/* ── Brand panel ── */}
          <div className="lg-brand">
            <div className="lg-buddha">
              <img src="/adida.PNG" alt="" />
            </div>

            <div>
              <h1 className="lg-title">{t.login.pagodaName}</h1>
              <p className="lg-sub">{t.login.brandSubtitle}</p>
              <p className="lg-quote">“{t.login.brandQuote}”</p>
            </div>

            <div className="lg-orn" aria-hidden="true"><i /><DharmaWheel /><i /></div>
          </div>

          {/* ── Form panel ── */}
          <div className="lg-form">
            <div className="lg-form-inner">
              <div className="lg-head">
                <div className="lg-head-icon">
                  <img src="/logochua.jpg" alt="" width="60" height="60" />
                </div>
                <h2>{t.login.signIn}</h2>
                <p>{t.login.signInHint}</p>
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
                <div className="lg-orn" aria-hidden="true"><i /><b>✦</b><i /></div>
                <span>{t.login.footerChant}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
