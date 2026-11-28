import React, { useState, useRef } from 'react';
import { Avatar, Tooltip, Result, Button, Alert, Dropdown } from 'antd';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import {
  TeamOutlined, HeartOutlined, BookOutlined, CheckSquareOutlined,
  ArrowRightOutlined, ScheduleOutlined, SolutionOutlined,
  UsergroupAddOutlined, FileTextOutlined, StarFilled, BellFilled,
  CalendarOutlined, EnvironmentOutlined, ClockCircleOutlined, PieChartOutlined,
  PlusOutlined, DownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useDashboard } from './useDashboard';
import { useLanguage } from '../../i18n/LanguageContext';
import { solarToLunar, getBuddhistHolidays } from '../../utils/lunarCalendar';
import { useCountUp } from '../../components/CountUp/CountUp';
import { DUTY_CREATE_ROLES, useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';

const ACCENT = {
  amber:    { c: '#c47f36', s: '#fbf1e4' },
  rose:     { c: '#d9646c', s: '#fdeeee' },
  sky:      { c: '#4d8fc7', s: '#e9f1fb' },
  sage:     { c: '#4f9a72', s: '#e8f4ed' },
  lavender: { c: '#8b6fc9', s: '#f1edfb' },
  teal:     { c: '#3a9483', s: '#e6f4f0' },
  gold:     { c: '#d39a2c', s: '#fdf3dc' },
};

const SHIFT_TONE  = { 'sáng': 'gold', 'chiều': 'amber', 'tối': 'lavender', 'cả_ngày': 'sky' };
const STATUS_TONE = { 'chờ': 'sky', 'hoàn_thành': 'sage', 'vắng': 'rose', 'đổi_ca': 'gold' };

function Pill({ tone = 'amber', children }) {
  const a = ACCENT[tone] || ACCENT.amber;
  return <span className="db-pill" style={{ color: a.c, background: a.s }}>{children}</span>;
}

function SectionCard({ icon, title, count, action, children, className = '' }) {
  return (
    <section className={`db-card ${className}`}>
      <header className="db-card__head">
        <h2 className="db-card__title">
          <span className="db-card__icon">{icon}</span>
          {title}
          {count > 0 && <span className="db-card__count">{count}</span>}
        </h2>
        {action}
      </header>
      <div className="db-card__body">{children}</div>
    </section>
  );
}

function EmptyState({ icon, text, actionLabel, onAction }) {
  return (
    <div className="db-empty">
      <span className="db-empty__icon">{icon}</span>
      <span className="db-empty__text">{text}</span>
      {actionLabel && onAction && (
        <button type="button" className="db-link add-action" onClick={onAction}>
          <PlusOutlined /> {actionLabel}
        </button>
      )}
    </div>
  );
}

function KpiTile({ label, value, tone, icon, foot, onClick, delay }) {
  const a = ACCENT[tone];
  const shown = Math.round(useCountUp(value));
  return (
    <button type="button" className={`db-kpi kpi-anim kpi-anim-d${delay}`} onClick={onClick} style={{ '--kpi-accent': a.c, '--kpi-soft': a.s }}>
      <div className="db-kpi__top">
        <span className="db-kpi__label">{label}</span>
        <span className="db-kpi__icon">{icon}</span>
      </div>
      <div className="db-kpi__value">{shown}</div>
      <div className="db-kpi__foot">
        <span>{foot}</span>
        <ArrowRightOutlined className="db-kpi__arrow" />
      </div>
    </button>
  );
}

function Breakdown({ data, total, totalLabel, size = 172, thickness = 16 }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [focused, setFocused] = useState(null);
  const active = hovered ?? focused ?? selected;
  const toggle = index => setSelected(value => value === index ? null : index);
  const preview = (event, index) => {
    if (event.pointerType === 'mouse') setHovered(index);
  };

  const c = size / 2;
  const r = (size - thickness - 12) / 2;
  const C = 2 * Math.PI * r;
  const gap = data.length > 1 ? 4 : 0;
  const pct = (v) => Math.round((v / total) * 100);
  const focus = active != null ? data[active] : null;

  let acc = 0;
  const arcs = data.map((d) => {
    const full = (d.value / total) * C;
    const arc = { ...d, len: Math.max(full - gap, 0.01), off: acc + gap / 2 };
    acc += full;
    return arc;
  });

  return (
    <div className="db-bd">
      <div className="db-bd__chart" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
          aria-label={`${totalLabel}: ${total}`} style={{ '--db-ring-length': C }}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="#f6efe5" strokeWidth={thickness} />
          <circle cx={c} cy={c} r={r - thickness / 2 - 6} fill="none" stroke="#f3ebdf" strokeWidth="1" strokeDasharray="2 4" />
          {arcs.map((a, i) => {
            const isActive = active === i;
            const dim = active != null && !isActive;
            return (
              <circle
                key={a.label}
                cx={c} cy={c} r={r}
                fill="none"
                stroke={a.color}
                strokeWidth={isActive ? thickness + 7 : thickness}
                strokeDasharray={`${a.len} ${C - a.len}`}
                strokeDashoffset={-a.off}
                transform={`rotate(-90 ${c} ${c})`}
                opacity={dim ? 0.28 : 1}
                className="db-bd__arc"
                onPointerEnter={event => preview(event, i)}
                onPointerLeave={event => preview(event, null)}
                onClick={() => toggle(i)}
              />
            );
          })}
        </svg>
        <div className="db-bd__center" aria-live="polite">
          {focus ? (
            <>
              <strong style={{ color: focus.color }}>{pct(focus.value)}%</strong>
              <span className="db-bd__center-label">{focus.label}</span>
              <span className="db-bd__center-sub">{focus.value} / {total}</span>
            </>
          ) : (
            <>
              <strong>{total}</strong>
              <span className="db-bd__center-label">{totalLabel}</span>
            </>
          )}
        </div>
      </div>

      <ul className="db-bd__legend">
        {data.map((d, i) => (
          <li key={d.label}>
            <button
              type="button"
              className={`db-bd__row${active === i ? ' is-active' : ''}`}
              aria-pressed={selected === i}
              onPointerEnter={event => preview(event, i)}
              onPointerLeave={event => preview(event, null)}
              onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setFocused(i); }}
              onBlur={() => setFocused(null)}
              onClick={() => toggle(i)}
              style={{ '--c': d.color }}
            >
              <span className="db-bd__swatch" />
              <span className="db-bd__info">
                <span className="db-bd__line">
                  <span className="db-bd__name">{d.label}</span>
                  <span className="db-bd__value">{d.value}</span>
                </span>
                <span className="db-bd__track" aria-hidden="true"><i style={{ width: `${pct(d.value)}%` }} /></span>
              </span>
              <span className="db-bd__pct">{pct(d.value)}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Dashboard() {
  const { stats, dutyToday, upcomingEvents, loading, error, partialError, reload, displayName } = useDashboard();
  const { user } = useAuth();
  const role = user?.role;
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const d = t.dashboard;
  const [showAllDuty, setShowAllDuty] = useState(false);
  const DUTY_LIMIT = 5;

  if (loading) return <PageSpinner />;
  if (error) {
    return (
      <Result
        status="warning"
        title={d.loadError}
        subTitle={d.loadErrorHint}
        extra={<Button type="primary" onClick={reload}>{t.common.retry}</Button>}
      />
    );
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 11 ? d.greetMorning : hour < 14 ? d.greetNoon : hour < 18 ? d.greetAfternoon : d.greetEvening;
  const name = displayName ? displayName.charAt(0).toUpperCase() + displayName.slice(1) : '';
  const lunar = solarToLunar(now.getDate(), now.getMonth() + 1, now.getFullYear());
  const todayKey = dayjs(now).format('YYYY-MM-DD');
  const holidays = getBuddhistHolidays(now.getFullYear(), lang).get(todayKey);
  const dateLocale = lang === 'en' ? 'en-US' : 'vi-VN';

  const p = stats?.personnel || {};
  const total = p.total ?? 0;
  const followers = stats?.followers ?? 0;
  const trainings = stats?.trainings ?? 0;
  const pending = stats?.pendingWork ?? 0;

  // Keep the same creation permissions for shortcuts and empty states.
  const managerRoles = ['admin', 'truotri', 'thuki'];
  const quickActions = [
    { path: '/app/duty-schedule', label: d.createDuty, icon: <ScheduleOutlined />, roles: DUTY_CREATE_ROLES, featured: true },
    { path: '/app/work-assignment', label: d.assignWork, icon: <SolutionOutlined />, roles: managerRoles, featured: true },
    { path: '/app/personnel', label: d.addPersonnel, icon: <UsergroupAddOutlined />, roles: managerRoles },
    { path: '/app/buddhist-followers', label: d.addFollower, icon: <HeartOutlined />, roles: managerRoles },
    { path: '/app/training', label: d.createCourse, icon: <BookOutlined />, roles: managerRoles },
    { path: '/app/news', label: d.postNews, icon: <FileTextOutlined /> },
  ].filter(action => !action.roles || action.roles.includes(role));
  const featuredActions = quickActions.filter(action => action.featured);
  const otherActions = quickActions.filter(action => !action.featured);

  const createAction = (path) => (quickActions.some(action => action.path === path) ? () => navigate(`${path}?create=1`) : undefined);

  const breakdown = [
    { label: d.tangNi,         value: p.tangNi ?? 0,         color: ACCENT.amber.c },
    { label: d.cuSi,           value: p.cuSi ?? 0,           color: ACCENT.sage.c },
    { label: d.phatTu,         value: p.phatTu ?? 0,         color: ACCENT.sky.c },
    { label: d.tinhNguyenVien, value: p.tinhNguyenVien ?? 0, color: ACCENT.lavender.c },
    { label: d.nhanVien,       value: p.nhanVien ?? 0,       color: ACCENT.rose.c },
  ].filter(x => x.value > 0);
  const breakdownTotal = breakdown.reduce((s, x) => s + x.value, 0);

  const todayStart = dayjs().startOf('day');
  const holidayMaps = [now.getFullYear(), now.getFullYear() + 1].map(y => getBuddhistHolidays(y, lang));
  const upcomingHolidays = [];
  for (let i = 0; i <= 60 && upcomingHolidays.length < 5; i++) {
    const day = todayStart.add(i, 'day');
    const key = day.format('YYYY-MM-DD');
    const hit = holidayMaps[day.year() === now.getFullYear() ? 0 : 1].get(key);
    if (hit) {
      upcomingHolidays.push({
        key, date: day, diff: i, names: hit.names, major: hit.major,
        lunar: solarToLunar(day.date(), day.month() + 1, day.year()),
      });
    }
  }

  const viewAll = (path) => (
    <button type="button" className="db-link" onClick={() => navigate(path)}>
      {d.viewAll} <ArrowRightOutlined />
    </button>
  );

  return (
    <div className="db-root">
      {partialError && (
        <Alert
          type="warning"
          showIcon
          message={d.partialLoadError}
          action={<Button size="small" onClick={reload}>{t.common.retry}</Button>}
          style={{ marginBottom: 16, borderRadius: 12 }}
        />
      )}
      {/* ── Hero ── */}
      <section className="db-hero welcome-anim">
        <div className="db-hero__main">
          <div className="db-hero__date">
            {now.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <h1 className="db-hero__greet">{greeting}, <span>{name}</span></h1>
          <p className="db-hero__bless">{d.blessing}</p>
          {holidays?.names?.length > 0 && (
            <div className="db-hero__holidays">
              {holidays.names.map(n => (
                <span key={n} className={`db-holiday${holidays.major ? ' is-major' : ''}`}>
                  {holidays.major ? <StarFilled /> : <BellFilled />} {n}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="db-lunar" aria-label={d.lunarLabel}>
          <div className="db-lunar__label">{d.lunarLabel}</div>
          <div className="db-lunar__day">{String(lunar.day).padStart(2, '0')}</div>
          <div className="db-lunar__month">{d.lunarMonth} {lunar.month}{lunar.leap ? ` (${d.leapMonth})` : ''}</div>
          <div className="db-lunar__year">{lunar.yearName}</div>
        </div>
        <div className="db-actions">
          {featuredActions.map(action => (
            <button
              key={action.path}
              type="button"
              className="db-action add-action"
              onClick={createAction(action.path)}
            >
              {action.icon}{action.label}
            </button>
          ))}
          {otherActions.length > 0 && (
            <Dropdown
              trigger={['click']}
              menu={{
                items: otherActions.map(a => ({ key: a.path, label: a.label, icon: a.icon })),
                onClick: ({ key }) => createAction(key)?.(),
              }}
            >
              <button type="button" className="db-action" aria-haspopup="menu">
                {d.otherActions}<DownOutlined aria-hidden="true" />
              </button>
            </Dropdown>
          )}
        </div>
      </section>

      {/* ── KPIs ── */}
      <div className="db-kpis">
        <KpiTile delay={0} label={d.pendingWork} value={pending} tone={pending ? 'gold' : 'sage'} icon={<CheckSquareOutlined />}
          foot={d.viewPendingWork}
          onClick={() => navigate('/app/work-assignment')} />
        <KpiTile delay={1} label={d.totalPersonnel} value={total} tone="amber" icon={<TeamOutlined />}
          foot={total ? `${d.tangNi} ${p.tangNi ?? 0} · ${d.cuSi} ${p.cuSi ?? 0}` : d.noData}
          onClick={() => navigate('/app/personnel')} />
        <KpiTile delay={2} label={d.followers} value={followers} tone="rose" icon={<HeartOutlined />}
          foot={followers ? d.viewDetails : d.noData}
          onClick={() => navigate('/app/buddhist-followers')} />
        <KpiTile delay={3} label={d.activeTrainings} value={trainings} tone="sky" icon={<BookOutlined />}
          foot={trainings ? d.viewDetails : d.noData}
          onClick={() => navigate('/app/training')} />
      </div>

      <div className="db-grid">
        <SectionCard
          className="db-duty-card"
          icon={<ScheduleOutlined />}
          title={d.todayDuty}
          count={dutyToday.length}
          action={viewAll('/app/duty-schedule')}
        >
          {dutyToday.length === 0 ? (
            <EmptyState icon={<ScheduleOutlined />} text={d.noDutyToday} actionLabel={d.createDuty} onAction={createAction('/app/duty-schedule')} />
          ) : (
            <>
              <ul className="db-duty">
                {(showAllDuty ? dutyToday : dutyToday.slice(0, DUTY_LIMIT)).map(r => {
                  const person = r.personnel?.dharmName || r.personnel?.fullName || '—';
                  return (
                    <li key={r.id} className="db-duty__row">
                      <Avatar size={36} style={{ background: ACCENT.amber.s, color: ACCENT.amber.c, fontWeight: 700, flexShrink: 0 }}>
                        {person.trim().split(/\s+/).pop()?.[0]?.toUpperCase()}
                      </Avatar>
                      <div className="db-duty__info">
                        <div className="db-duty__person">{person}</div>
                        <div className="db-duty__type">{t.dutySchedule.dutyTypes[r.dutyType] || r.dutyType}</div>
                      </div>
                      <Pill tone={SHIFT_TONE[r.shift]}>{t.dutySchedule.shifts[r.shift] || r.shift}</Pill>
                      <Pill tone={STATUS_TONE[r.status]}>{t.dutySchedule.statuses[r.status] || r.status}</Pill>
                    </li>
                  );
                })}
              </ul>
              {dutyToday.length > DUTY_LIMIT && (
                <div className="list-toggle-row">
                  <button type="button" className="list-toggle" aria-expanded={showAllDuty} onClick={() => setShowAllDuty(v => !v)}>
                    {showAllDuty ? t.common.showLess : t.common.showAllN.replace('{n}', dutyToday.length)}
                    <span className={`list-toggle__chev${showAllDuty ? ' is-up' : ''}`}>›</span>
                  </button>
                </div>
              )}
            </>
          )}
        </SectionCard>

        <SectionCard className="db-personnel-card" icon={<PieChartOutlined />} title={d.personnelBreakdown}>
          {breakdownTotal === 0 ? (
            <EmptyState icon={<TeamOutlined />} text={d.noData} actionLabel={d.addPersonnel} onAction={createAction('/app/personnel')} />
          ) : (
            <Breakdown data={breakdown} total={breakdownTotal} totalLabel={t.common.total} />
          )}
        </SectionCard>

        <div className="db-pair">
          <SectionCard
            icon={<CalendarOutlined />}
            title={d.upcomingEvents}
            count={upcomingEvents.length}
            action={viewAll('/app/news?tab=event')}
          >
            {upcomingEvents.length === 0 ? (
              <EmptyState icon={<CalendarOutlined />} text={d.noUpcomingEvents} actionLabel={d.postNews} onAction={createAction('/app/news')} />
            ) : (
              <div className="db-events">
                {upcomingEvents.slice(0, 4).map(ev => {
                  const day = ev.eventDate ? dayjs(ev.eventDate) : null;
                  const diff = day ? day.startOf('day').diff(dayjs().startOf('day'), 'day') : null;
                  const isToday = diff === 0;
                  return (
                    <button type="button" key={ev.id} className={`db-event${isToday ? ' is-today' : ''}`} onClick={() => navigate(`/app/news?post=${ev.id}`)}>
                      <div className="db-event__tile">
                        <span>{day ? day.toDate().toLocaleDateString(dateLocale, { month: 'short' }) : ''}</span>
                        <strong>{day ? day.format('DD') : '—'}</strong>
                      </div>
                      <div className="db-event__info">
                        <Tooltip title={ev.title}><div className="db-event__title">{ev.title}</div></Tooltip>
                        <div className="db-event__meta">
                          {ev.eventTime && <span><ClockCircleOutlined /> {ev.eventTime}</span>}
                          {ev.eventLocation && <span className="db-event__loc"><EnvironmentOutlined /> {ev.eventLocation}</span>}
                        </div>
                      </div>
                      {diff != null && (
                        <span className={`db-event__when${isToday ? ' is-today' : ''}`}>
                          {isToday ? d.today : d.inDays.replace('{n}', diff)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard icon={<StarFilled />} title={d.upcomingHolidays} count={upcomingHolidays.length}>
            {upcomingHolidays.length === 0 ? (
              <EmptyState icon={<StarFilled />} text={d.noHolidays} />
            ) : (
              <ul className="db-holy">
                {upcomingHolidays.map(h => (
                  <li key={h.key} className={`db-holy__row${h.major ? ' is-major' : ''}${h.diff === 0 ? ' is-today' : ''}`}>
                    <div className="db-holy__tile">
                      <strong>{h.date.format('DD')}</strong>
                      <span>{h.date.toDate().toLocaleDateString(dateLocale, { month: 'short' })}</span>
                    </div>
                    <div className="db-holy__info">
                      <div className="db-holy__name">
                        {h.major ? <StarFilled className="db-holy__star" /> : <BellFilled className="db-holy__bell" />}
                        <span>{h.names[0]}</span>
                        {h.names.length > 1 && (
                          <Tooltip title={h.names.slice(1).join(' · ')}><span className="db-holy__extra">+{h.names.length - 1}</span></Tooltip>
                        )}
                      </div>
                      <div className="db-holy__lunar">{d.lunarShort} {h.lunar.day}/{h.lunar.month} · {h.date.toDate().toLocaleDateString(dateLocale, { weekday: 'long' })}</div>
                    </div>
                    <span className={`db-event__when${h.diff === 0 ? ' is-today' : ''}`}>
                      {h.diff === 0 ? d.today : d.inDays.replace('{n}', h.diff)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
