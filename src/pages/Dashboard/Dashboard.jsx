import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Typography, Table, Tag, Spin, Empty, List } from 'antd';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import {
  TeamOutlined, HeartFilled, BookFilled, CalendarFilled,
  CheckSquareFilled, WarningOutlined,
  ArrowRightOutlined, ScheduleOutlined, SolutionOutlined,
  UsergroupAddOutlined, FileTextOutlined, StarFilled, BellFilled,
  CalendarOutlined, EnvironmentOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDashboard, SHIFT_COLORS, DUTY_STATUS_COLORS } from './useDashboard';
import { useLanguage } from '../../i18n/LanguageContext';
import { solarToLunar, getBuddhistHolidays } from '../../utils/lunarCalendar';
import ParticleCanvas from '../../components/ParticleCanvas/ParticleCanvas';
import './Dashboard.css';

const { Title, Text } = Typography;

/* ── Count-up hook ────────────────────────────────────── */
function useCountUp(end, duration = 1200) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    const target = end ?? 0;
    if (target === 0) { setCount(0); return; }
    let startTime = null;
    const tick = (now) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [end, duration]);
  return count;
}

/* ── KPI card with animated number ───────────────────── */
function KpiCard({ title, value, icon, color, warnIfZero = false, subStats = null, onClick, animDelay = 0 }) {
  const { t } = useLanguage();
  const isEmpty = warnIfZero && (value === 0 || value == null);
  const displayed = useCountUp(value, 1100);

  return (
    <Card
      className={`kpi-card kpi-anim kpi-anim-d${animDelay} ${isEmpty ? 'kpi-card--warn' : ''}`}
      hoverable={!!onClick}
      onClick={onClick}
      style={{
        borderTop: `4px solid ${isEmpty ? '#faad14' : color}`,
        background: `linear-gradient(150deg, ${isEmpty ? 'rgba(250,173,20,0.06)' : color + '09'} 0%, #fff 55%)`,
      }}
    >
      <div className="kpi-card-inner">
        <div className="kpi-icon" style={{ background: `${color}18`, color }}>
          {icon}
        </div>
        <div className="kpi-body">
          <Text className="kpi-title">{title}</Text>
          <div className="kpi-value" style={{ color: isEmpty ? '#faad14' : color }}>
            {displayed}
          </div>
          {isEmpty ? (
            <Text style={{ fontSize: 11, color: '#faad14' }}>
              <WarningOutlined style={{ marginRight: 3 }} />{t.dashboard.notUpdated}
            </Text>
          ) : subStats ? (
            <div className="kpi-substats">{subStats}</div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

/* ── Donut chart — draws itself on mount ──────────────── */
function DonutChart({ data, size = 160, thickness = 26 }) {
  const { t } = useLanguage();
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 250);
    return () => clearTimeout(t);
  }, []);

  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  if (total === 0) return <Empty description={t.common.noData} style={{ padding: '16px 0' }} />;

  let cumulative = 0;
  const slices = data.map(d => {
    const pct = d.value / total;
    const dash = pct * circumference;
    const slice = { ...d, dash, offset: cumulative, pct };
    cumulative += dash;
    return slice;
  });

  return (
    <div className="donut-wrap">
      <div className="donut-svg-wrap">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)', transition: 'opacity 0.4s', opacity: drawn ? 1 : 0.3 }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f0" strokeWidth={thickness} />
          {slices.map((s, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={drawn ? `${s.dash} ${circumference - s.dash}` : `0 ${circumference}`}
              strokeDashoffset={drawn ? -s.offset : 0}
              style={{
                transition: `stroke-dasharray 1.1s cubic-bezier(0.22,1,0.36,1) ${i * 0.18}s,
                             stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1) ${i * 0.18}s`,
              }}
            />
          ))}
        </svg>
        <div className="donut-center" style={{ opacity: drawn ? 1 : 0, transition: 'opacity 0.6s 0.5s' }}>
          <span className="donut-num">{total}</span>
          <span className="donut-sub">{t.common.total}</span>
        </div>
      </div>
      <div className="donut-legend">
        {slices.map((s, i) => (
          <div key={i} className="donut-legend-row"
            style={{ opacity: drawn ? 1 : 0, transform: drawn ? 'translateX(0)' : 'translateX(12px)', transition: `opacity 0.5s ${0.4 + i * 0.15}s, transform 0.5s ${0.4 + i * 0.15}s` }}>
            <div className="donut-dot" style={{ background: s.color }} />
            <Text style={{ flex: 1, fontSize: 13 }}>{s.label}</Text>
            <span style={{ color: s.color, fontWeight: 700, fontSize: 15 }}>{s.value}</span>
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>({Math.round(s.pct * 100)}%)</Text>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { stats, dutyToday, upcomingEvents, loading, displayName } = useDashboard();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const quickActions = [
    { label: t.dashboard.addPersonnel,  icon: <UsergroupAddOutlined />, path: '/app/personnel',          color: '#8B4513' },
    { label: t.dashboard.createDuty,    icon: <ScheduleOutlined />,    path: '/app/duty-schedule',       color: '#2980b9' },
    { label: t.dashboard.assignWork,    icon: <SolutionOutlined />,    path: '/app/work-assignment',     color: '#27ae60' },
    { label: t.dashboard.addFollower,   icon: <HeartFilled />,         path: '/app/buddhist-followers',  color: '#e74c3c' },
    { label: t.dashboard.createCourse,  icon: <BookFilled />,          path: '/app/training',            color: '#1890ff' },
    { label: t.dashboard.postNews,      icon: <FileTextOutlined />,    path: '/app/news',                color: '#722ed1' },
  ];

  const systemItems = [
    { label: t.dashboard.activePersonnel, value: stats?.personnel?.total ?? 0, color: '#8B4513', path: '/app/personnel' },
    { label: t.nav.buddhistFollowers,     value: stats?.followers ?? 0,         color: '#e74c3c', path: '/app/buddhist-followers' },
    { label: t.training.title,            value: stats?.trainings ?? 0,         color: '#1890ff', path: '/app/training' },
    { label: t.dashboard.pendingWork,     value: stats?.pendingWork ?? 0,       color: '#fa8c16', path: '/app/work-assignment' },
  ];

  const dutyColumns = [
    { title: t.dutySchedule.colDuty,  dataIndex: 'dutyType', render: (v) => t.dutySchedule.dutyTypes[v] || v },
    { title: t.dutySchedule.colShift, dataIndex: 'shift',    render: (v) => <Tag color={SHIFT_COLORS[v] || 'default'}>{v}</Tag> },
    { title: t.dutySchedule.colPerson, render: (_, r) => r.personnel?.dharmName || r.personnel?.fullName || '—' },
    { title: t.common.status,         dataIndex: 'status',   render: (v) => <Tag color={DUTY_STATUS_COLORS[v] || 'default'}>{v}</Tag> },
  ];

  const tangNi         = stats?.personnel?.tangNi          ?? 0;
  const cuSi           = stats?.personnel?.cuSi            ?? 0;
  const phatTu         = stats?.personnel?.phatTu          ?? 0;
  const tinhNguyenVien = stats?.personnel?.tinhNguyenVien  ?? 0;
  const nhanVien       = stats?.personnel?.nhanVien        ?? 0;
  const total          = stats?.personnel?.total           ?? 0;

  const today = new Date();
  const todayLunar = solarToLunar(today.getDate(), today.getMonth() + 1, today.getFullYear());
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const holidaysToday = getBuddhistHolidays(today.getFullYear()).get(todayKey);
  const dateLocale = lang === 'en' ? 'en-US' : 'vi-VN';

  if (loading) return <PageSpinner />;

  return (
    <div className="dashboard-root">
      {/* Welcome */}
      <div className="dashboard-welcome welcome-anim">
        <ParticleCanvas count={22} style={{ opacity: 0.7 }} />
        <Title level={4} className="dashboard-welcome-title">
          {t.dashboard.welcome} {displayName ? displayName.charAt(0).toUpperCase() + displayName.slice(1) : ''}
        </Title>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 2 }}>
          <Text type="secondary">
            {today.toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
          <span style={{ color: '#ccc' }}>·</span>
          <Tag
            icon={<CalendarFilled style={{ color: '#d48806', marginRight: 3 }} />}
            style={{ background: '#fffbe6', border: '1px solid #ffe58f', color: '#8B4513', borderRadius: 20, fontSize: 12 }}
          >
            {todayLunar.day}/{todayLunar.month} {todayLunar.yearName}
          </Tag>
          {holidaysToday?.names.map((name, i) => (
            <Tag
              key={i}
              icon={holidaysToday.major
                ? <StarFilled style={{ color: '#cf1322', marginRight: 3 }} />
                : <BellFilled  style={{ color: '#389e0d', marginRight: 3 }} />
              }
              style={{
                background: holidaysToday.major ? '#fff1f0' : '#f6ffed',
                border: `1px solid ${holidaysToday.major ? '#ffa39e' : '#b7eb8f'}`,
                color: holidaysToday.major ? '#cf1322' : '#389e0d',
                borderRadius: 20, fontSize: 12,
              }}
            >
              {name}
            </Tag>
          ))}
        </div>
      </div>

      {/* KPI Row — each card staggers in */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            animDelay={0}
            title={t.dashboard.totalPersonnel}
            value={total}
            icon={<TeamOutlined />}
            color="#8B4513"
            onClick={() => navigate('/app/personnel')}
            subStats={
              <span>
                <span style={{ color: '#d46b08' }}>{t.dashboard.tangNi} {tangNi}</span>
                <span style={{ margin: '0 6px', color: '#ccc' }}>·</span>
                <span style={{ color: '#389e0d' }}>{t.dashboard.cuSi} {cuSi}</span>
              </span>
            }
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard animDelay={1} title={t.dashboard.followers} value={stats?.followers} icon={<HeartFilled />} color="#e74c3c" warnIfZero onClick={() => navigate('/app/buddhist-followers')} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard animDelay={2} title={t.dashboard.activeTrainings} value={stats?.trainings} icon={<BookFilled />} color="#1890ff" warnIfZero onClick={() => navigate('/app/training')} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard animDelay={3} title={t.dashboard.pendingWork} value={stats?.pendingWork} icon={<CheckSquareFilled />} color={stats?.pendingWork > 0 ? '#fa8c16' : '#52c41a'} onClick={() => navigate('/app/work-assignment')} />
        </Col>
      </Row>

      {/* Lower section */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            className="dashboard-section-card"
            title={
              <span>
                <CalendarFilled style={{ color: '#8B4513', marginRight: 8 }} />
                {t.dashboard.todayDuty}
                {dutyToday.length > 0 && <Tag color="blue" style={{ marginLeft: 8 }}>{dutyToday.length}</Tag>}
              </span>
            }
            extra={<span className="card-extra-link" onClick={() => navigate('/app/duty-schedule')}>{t.dashboard.viewAll} <ArrowRightOutlined /></span>}
          >
            {dutyToday.length === 0 ? (
              <Empty description={t.dashboard.noDutyToday} />
            ) : (
              <Table dataSource={dutyToday} columns={dutyColumns} rowKey="id" pagination={false} size="small" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="dashboard-section-card" title={<span>☸ {t.dashboard.quickActionsTitle}</span>}>
            <List
              dataSource={quickActions}
              renderItem={(item, idx) => (
                <List.Item
                  className="quick-action-item"
                  onClick={() => navigate(item.path)}
                  style={{
                    opacity: 0,
                    animation: `kpi-slide-in 0.5s cubic-bezier(0.34,1.36,0.64,1) ${0.1 + idx * 0.07}s forwards`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${item.color}10`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                >
                  <div className="quick-action-icon" style={{ background: `${item.color}18`, color: item.color }}>{item.icon}</div>
                  <Text className="quick-action-label">{item.label}</Text>
                  <ArrowRightOutlined className="quick-action-arrow" style={{ marginLeft: 'auto' }} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Upcoming events */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            className="dashboard-section-card"
            title={
              <span>
                <CalendarOutlined style={{ color: '#8B4513', marginRight: 8 }} />
                {t.dashboard.upcomingEvents}
                {upcomingEvents.length > 0 && <Tag color="volcano" style={{ marginLeft: 8 }}>{upcomingEvents.length}</Tag>}
              </span>
            }
            extra={<span className="card-extra-link" onClick={() => navigate('/app/news?tab=event')}>{t.dashboard.viewAll} <ArrowRightOutlined /></span>}
          >
            {upcomingEvents.length === 0 ? (
              <Empty description={t.dashboard.noUpcomingEvents} />
            ) : (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {upcomingEvents.map((ev, idx) => {
                  const evDate = ev.eventDate ? new Date(ev.eventDate) : null;
                  const dayNum = evDate ? evDate.getDate() : '—';
                  const monthStr = evDate ? evDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', { month: 'short' }) : '';
                  const isToday = evDate && evDate.toISOString().split('T')[0] === todayKey;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => navigate('/app/news?tab=event')}
                      style={{
                        flex: '1 1 220px', minWidth: 200, maxWidth: 280,
                        border: '1px solid #f0e8d8', borderRadius: 10,
                        padding: '12px 14px', cursor: 'pointer', background: '#fffdf9',
                        borderTop: `3px solid ${isToday ? '#cf1322' : '#8B4513'}`,
                        opacity: 0,
                        animation: `kpi-slide-in 0.45s cubic-bezier(0.16,1,0.3,1) ${0.1 + idx * 0.08}s forwards`,
                        transition: 'box-shadow 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(139,69,19,0.12)'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{
                          minWidth: 44, textAlign: 'center', background: isToday ? '#fff1f0' : '#fdf6ec',
                          border: `1px solid ${isToday ? '#ffa39e' : '#f0e8d8'}`, borderRadius: 8, padding: '4px 6px',
                        }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: isToday ? '#cf1322' : '#8B4513', lineHeight: 1.1 }}>{dayNum}</div>
                          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>{monthStr}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                          {ev.eventTime && (
                            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                              <ClockCircleOutlined style={{ marginRight: 4 }} />{ev.eventTime}
                            </div>
                          )}
                          {ev.eventLocation && (
                            <div style={{ fontSize: 12, color: '#888', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <EnvironmentOutlined style={{ marginRight: 4 }} />{ev.eventLocation}
                            </div>
                          )}
                          {isToday && (
                            <Tag color="red" style={{ marginTop: 4, fontSize: 11, borderRadius: 20 }}>Hôm nay</Tag>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Personnel breakdown */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card className="dashboard-section-card" title={`📊 ${t.dashboard.personnelBreakdown}`}>
            <DonutChart
              data={[
                { label: t.dashboard.tangNi,         value: tangNi,         color: '#d46b08' },
                { label: t.dashboard.cuSi,           value: cuSi,           color: '#389e0d' },
                { label: t.dashboard.phatTu,         value: phatTu,         color: '#1890ff' },
                { label: t.dashboard.tinhNguyenVien, value: tinhNguyenVien, color: '#722ed1' },
                { label: t.dashboard.nhanVien,       value: nhanVien,       color: '#eb2f96' },
              ].filter(d => d.value > 0)}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="dashboard-section-card" title={`📋 ${t.dashboard.systemOverview}`}>
            <div className="system-overview">
              {systemItems.map((item, idx) => (
                <div key={item.label} className="overview-row" onClick={() => navigate(item.path)}
                  style={{
                    opacity: 0,
                    animation: `kpi-slide-in 0.45s cubic-bezier(0.16,1,0.3,1) ${0.2 + idx * 0.08}s forwards`,
                  }}>
                  <Text style={{ fontSize: 13 }}>{item.label}</Text>
                  <span className="overview-badge" style={{ background: `${item.color}18`, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
