import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  ArrowRightOutlined,
  CalendarOutlined,
  LoginOutlined,
  MoonOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import DharmaWheel from "../../components/DharmaWheel/DharmaWheel";
import LangToggle from "../../components/LangToggle/LangToggle";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { getBuddhistHolidays, solarToLunar } from "../../utils/lunarCalendar";
import "./HomePage.css";

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function nextHolyDay(from, lang) {
  const start = dayjs(from).startOf("day");
  const maps = [start.year(), start.year() + 1].map((y) =>
    getBuddhistHolidays(y, lang),
  );
  for (let i = 0; i <= 60; i++) {
    const d = start.add(i, "day");
    const hit = maps[d.year() === start.year() ? 0 : 1].get(
      d.format("YYYY-MM-DD"),
    );
    if (hit) return { date: d, diff: i, name: hit.names[0], major: hit.major };
  }
  return null;
}

function useHomeMotion(pageRef, heroRef, enabled) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const page = pageRef.current;
    const hero = heroRef.current;
    const media = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let heroVisible = true;
    let frame = 0;

    const update = () => {
      frame = 0;
      if (!heroVisible) return;
      const travel = Math.max(40, Math.min(490, page.scrollHeight - page.clientHeight));
      const progress = Math.max(0, Math.min(page.scrollTop / travel, 1));
      const offset = media.matches ? progress * 22 : 0;
      hero.style.setProperty("--hp-scroll", `${offset}px`);
    };

    const queueUpdate = () => {
      if (heroVisible && !frame) frame = requestAnimationFrame(update);
    };

    let observer;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(([entry]) => {
        heroVisible = entry.isIntersecting;
        hero.toggleAttribute("data-offscreen", !heroVisible);
        queueUpdate();
      }, { root: page });
      observer.observe(hero);
    }

    update();
    page.addEventListener("scroll", queueUpdate, { passive: true });
    media.addEventListener("change", queueUpdate);
    window.addEventListener("resize", queueUpdate);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      page.removeEventListener("scroll", queueUpdate);
      media.removeEventListener("change", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
    };
  }, [pageRef, heroRef, enabled]);
}

function TempleScene({ src }) {
  return (
    <div className="hp__scene" aria-hidden="true">
      <div className="hp__photo-depth">
        <img className="hp__photo" src={src} alt="" fetchpriority="high" />
      </div>
      <div className="hp__mist" />
    </div>
  );
}

export function HomeLanding({
  now,
  onEnter,
  showcaseTime,
  logoSrc = "/logochua.jpg",
  sceneSrc = "/temple-cinema.jpg",
}) {
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const isShowcase = showcaseTime !== undefined;
  useHomeMotion(pageRef, heroRef, !isShowcase);
  const { t, lang } = useLanguage();
  const L = t.login;
  const D = t.dashboard;
  const lunar = solarToLunar(now.getDate(), now.getMonth() + 1, now.getFullYear());
  const holy = nextHolyDay(now, lang);
  const two = (n) => String(n).padStart(2, "0");

  return (
    <div
      ref={pageRef}
      className={isShowcase ? "hp hp--showcase" : "hp"}
      lang={lang}
      style={isShowcase ? { "--hp-seek": `${-showcaseTime}s` } : undefined}
    >
      <header className="hp__header">
        <div className="hp__top hp__shell">
          <div className="hp__brand">
            <img className="hp__logo" src={logoSrc} width="48" height="48" alt="" />
            <div>
              <div className="hp__name">{L.pagodaName}</div>
              <div className="hp__sub">{L.brandSubtitle}</div>
            </div>
          </div>
          <div className="hp__top-actions">
            <LangToggle />
            <button type="button" className="hp__login-sm" onClick={onEnter}>
              <LoginOutlined aria-hidden="true" /> {L.signIn}
            </button>
          </div>
        </div>
      </header>

      <main className="hp__main">
        <section ref={heroRef} className="hp__hero" aria-labelledby="hp-title">
          <TempleScene src={sceneSrc} />
          <div className="hp__text hp__shell">
            <p className="hp__eyebrow"><DharmaWheel /> {L.footerChant}</p>
            <h1 className="hp__title" id="hp-title">
              <span className="hp__title-part"><span>{L.homeTitleA}</span></span>{" "}
              <span className="hp__title-part"><span>{L.homeTitleB}</span></span>
            </h1>
            <p className="hp__lead">{L.homeLead}</p>
            <button type="button" className="hp__cta" onClick={onEnter}>
              {L.homeEnter} <ArrowRightOutlined aria-hidden="true" />
            </button>
          </div>
        </section>

        <div className="hp__facts hp__shell">
          <div className="hp__fact">
            <div className="hp__fact-label">
              <CalendarOutlined aria-hidden="true" /> {D.today}
            </div>
            <div className="hp__fact-value">
              {two(now.getDate())}/{two(now.getMonth() + 1)}/
              {now.getFullYear()}
            </div>
            <div className="hp__fact-sub">
              {now.toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
                weekday: "long",
              })}{" "}
              ·{" "}
              <span className="hp__mono">
                {two(now.getHours())}:{two(now.getMinutes())}
              </span>
            </div>
          </div>
          <div className="hp__fact">
            <div className="hp__fact-label">
              <MoonOutlined aria-hidden="true" /> {D.lunarLabel}
            </div>
            <div className="hp__fact-value">
              {lunar.day}/{lunar.month}
              {lunar.leap ? "*" : ""}
            </div>
            <div className="hp__fact-sub">
              {L.homeYear.replace("{y}", lunar.yearName)}
            </div>
          </div>
          <div className="hp__fact hp__fact--holy">
            <div className="hp__fact-label">
              {holy?.major ? (
                <StarFilled aria-hidden="true" style={{ color: "#e0a83a" }} />
              ) : (
                <StarOutlined aria-hidden="true" />
              )}{" "}
              {L.homeUpcoming}
            </div>
            <div className="hp__fact-value">{holy ? holy.name : "—"}</div>
            {holy && (
              <div className="hp__fact-sub">
                {holy.diff === 0
                  ? D.today
                  : `${D.inDays.replace("{n}", holy.diff)} · ${holy.date.format("DD/MM")}`}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

let activeLoginTransition;

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const now = useNow();
  const entering = useRef(false);

  function enterSystem() {
    if (entering.current) return;
    entering.current = true;

    if (user) {
      navigate("/login");
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      navigate("/login", { state: { fromHome: true } });
      return;
    }

    if (typeof document.startViewTransition !== "function") {
      navigate("/login", { state: { fromHome: true, entryMotion: "fade" } });
      return;
    }

    const root = document.documentElement;
    root.dataset.pagodaLoginTransition = window.matchMedia("(min-width: 768px)").matches
      ? "desktop"
      : "mobile";

    let cancelled = false;
    const transition = document.startViewTransition(() => {
      // BrowserRouter must commit Login before the browser captures the destination.
      if (!cancelled) {
        flushSync(() => navigate("/login", { state: { fromHome: true, entryMotion: "native" } }));
      }
    });
    activeLoginTransition = transition;

    const cancelOnBack = () => {
      cancelled = true;
      entering.current = false;
      transition.skipTransition();
    };
    window.addEventListener("popstate", cancelOnBack, { once: true });

    const finish = () => {
      window.removeEventListener("popstate", cancelOnBack);
      if (activeLoginTransition === transition) {
        activeLoginTransition = undefined;
        delete root.dataset.pagodaLoginTransition;
      }
    };
    transition.ready.catch(() => {
      // An interrupted transition can skip its snapshots while navigation still succeeds.
    });
    transition.finished.then(finish, finish);
  }

  return <HomeLanding now={now} onEnter={enterSystem} />;
}
