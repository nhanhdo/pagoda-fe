import React, { useEffect, useState } from "react";
import { Form, Input, Button, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { solarToLunar } from "../../utils/lunarCalendar";
import LangToggle from "../../components/LangToggle/LangToggle";
import PagodaSeal from "./PagodaSeal";
import "./Login.css";

const pagodaTimeZone = "Asia/Ho_Chi_Minh";
const pagodaDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: pagodaTimeZone,
});

function LunarDate({ lang, labels }) {
  const today = new Date();
  const [day, month, year] = pagodaDate.format(today).split("/").map(Number);
  const lunar = solarToLunar(day, month, year);
  const solarLabel = new Intl.DateTimeFormat(
    lang === "vi" ? "vi-VN" : "en-GB",
    {
      timeZone: pagodaTimeZone,
      weekday: "long",
      day: "numeric",
      month: "numeric",
      year: "numeric",
    },
  ).format(today);

  return (
    <div className="lg-lunar">
      <div className="lg-lunar-tile">
        <span>{labels.lunarCalendar}</span>
        <strong>{lunar.day}</strong>
        <small>
          {labels.lunarMonth} {lunar.month}
          {lunar.leap ? ` ${labels.lunarLeap}` : ""}
        </small>
      </div>
      <div className="lg-lunar-caption">
        <strong>
          {labels.lunarYear} {lunar.yearName}
        </strong>
        <div>{solarLabel}</div>
      </div>
    </div>
  );
}

export default function Login() {
  const { t, lang } = useLanguage();
  const { login, loading } = useAuth();
  const [error, setError] = useState("");
  useEffect(() => {
    if (sessionStorage.getItem("logoutReason") === "idle") {
      sessionStorage.removeItem("logoutReason");
      message.warning(t.login.idleLoggedOut, 6);
    }
  }, []);

  const onFinish = async (values) => {
    setError("");
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
            <header className="lg-brand-header">
              <img src="/tanthanh.png" alt="" width="40" height="40" />
              <div>
                <p className="lg-sub">{t.login.brandSubtitle}</p>
                <h1 className="lg-title">{t.login.pagodaName}</h1>
              </div>
            </header>

            <PagodaSeal
              inscription={`${t.login.pagodaName} · ${t.login.footerChant} · `}
            />

            <p className="lg-quote">“{t.login.brandQuote}”</p>
            <LunarDate lang={lang} labels={t.login} />
          </div>

          {/* ── Form panel ── */}
          <div className="lg-form">
            <div className="lg-form-inner">
              <div className="lg-head">
                <div className="lg-head-icon">
                  <img src="/tanthanh.png" alt="" width="60" height="60" />
                </div>
                <h2>{t.login.signIn}</h2>
                <p>{t.login.signInHint}</p>
              </div>

              <Form
                layout="vertical"
                onFinish={onFinish}
                size="large"
                requiredMark={false}
              >
                {error && (
                  <div className="lg-error" role="alert">
                    <span>⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                <Form.Item
                  name="username"
                  label={
                    <span className="lg-label">{t.login.usernameLabel}</span>
                  }
                  className="lg-field"
                  rules={[
                    { required: true, message: t.login.usernameRequired },
                  ]}
                >
                  <Input
                    className="lg-input"
                    prefix={<UserOutlined />}
                    placeholder={t.login.usernamePlaceholder}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label={
                    <span className="lg-label">{t.login.passwordLabel}</span>
                  }
                  className="lg-field lg-field-last"
                  rules={[
                    { required: true, message: t.login.passwordRequired },
                  ]}
                >
                  <Input.Password
                    className="lg-input"
                    prefix={<LockOutlined />}
                    placeholder={t.login.passwordPlaceholder}
                    autoComplete="current-password"
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className="lg-btn"
                >
                  {t.login.signIn || t.login.submitButton}
                </Button>
              </Form>

              <button
                type="button"
                className="lg-forgot"
                onClick={() =>
                  message.info({
                    content: t.login.forgotPasswordMessage,
                    duration: 4,
                  })
                }
              >
                {t.login.forgotPassword}
              </button>

              <div className="lg-foot">
                <div className="lg-orn" aria-hidden="true">
                  <i />
                  <b>✦</b>
                  <i />
                </div>
                <span>{t.login.footerChant}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
