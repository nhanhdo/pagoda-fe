import React, { useState, useEffect, useRef } from 'react';
import { useOutlet, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Layout, Dropdown, Space, Typography, Modal, Form, Input,
  Descriptions, Tag, message, Select, Grid, Drawer,
  Badge, Popover, Button, Empty,
} from 'antd';
import {
  AppstoreFilled, TeamOutlined, CalendarFilled, CheckSquareFilled,
  BookFilled, HeartFilled, TrophyFilled, BankFilled, NotificationFilled,
  LogoutOutlined, UserOutlined, KeyOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  BellOutlined, SafetyCertificateFilled, DollarCircleOutlined, DownOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { useLanguage } from '../../i18n/LanguageContext';
import { getBuddhistHolidays } from '../../utils/lunarCalendar';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

function LotusSVG({ size = 40, opacity = 1 }) {
  const s = size;
  const cx = s / 2, cy = s / 2;
  const r = s * 0.42;
  const petalCount = 8;
  const petals = Array.from({ length: petalCount }, (_, i) => {
    const a = (i * 360) / petalCount;
    const rad = (a * Math.PI) / 180;
    const px = cx + r * 0.48 * Math.cos(rad);
    const py = cy + r * 0.48 * Math.sin(rad);
    return { px, py, a };
  });
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ flexShrink: 0, opacity, filter: `drop-shadow(0 0 ${s*0.1}px rgba(255,180,100,0.55))` }}>
      {petals.map((p, i) => (
        <ellipse key={`op${i}`} cx={p.px} cy={p.py} rx={r * 0.28} ry={r * 0.44}
          fill="rgba(255,160,120,0.55)" stroke="rgba(255,200,150,0.4)" strokeWidth={s * 0.012}
          transform={`rotate(${p.a}, ${p.px}, ${p.py})`} />
      ))}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i * 60 + 30) * Math.PI / 180;
        const px = cx + r * 0.26 * Math.cos(a);
        const py = cy + r * 0.26 * Math.sin(a);
        return (
          <ellipse key={`ip${i}`} cx={px} cy={py} rx={r * 0.18} ry={r * 0.30}
            fill="rgba(255,200,160,0.75)" stroke="rgba(255,220,180,0.5)" strokeWidth={s * 0.01}
            transform={`rotate(${i * 60 + 30}, ${px}, ${py})`} />
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.18} fill="rgba(255,220,100,0.9)" />
      <circle cx={cx} cy={cy} r={r * 0.09} fill="rgba(255,255,200,0.95)" />
    </svg>
  );
}

/* ── Notification Panel ───────────────────────────────── */
function NotificationPanel({ notifications, onNavigate }) {
  const { t } = useLanguage();

  if (!notifications.length) {
    return (
      <div style={{ width: 'min(320px, calc(100vw - 24px))' }}>
        <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14, borderBottom: '1px solid #f0f0f0', color: '#333' }}>
          {t.layout.notifications}
        </div>
        <Empty description={t.layout.noNotifications} style={{ padding: '24px 0' }} />
      </div>
    );
  }

  const grouped = {
    new_comment:  notifications.filter(n => n.type === 'new_comment'),
    pending_post: notifications.filter(n => n.type === 'pending_post'),
    overdue_task: notifications.filter(n => n.type === 'overdue_task'),
    today_duty:   notifications.filter(n => n.type === 'today_duty'),
    holiday:      notifications.filter(n => n.type === 'holiday'),
  };

  const groupMeta = {
    new_comment:  { label: t.layout.newCommentsGroup,      color: '#3a9483' },
    pending_post: { label: t.layout.pendingPostGroup,      color: '#d46b08' },
    overdue_task: { label: t.layout.overdueTasksGroup,     color: '#ff4d4f' },
    today_duty:   { label: t.layout.todayDutyGroup,        color: '#1890ff' },
    holiday:      { label: t.layout.upcomingHolidaysGroup, color: '#d48806' },
  };

  return (
    <div style={{ width: 'min(320px, calc(100vw - 24px))' }}>
      <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#333' }}>{t.layout.notifications}</span>
        <span style={{ fontSize: 11, color: '#999', fontWeight: 400 }}>{notifications.length} {t.layout.notifItems}</span>
      </div>

      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {Object.entries(grouped).map(([type, items]) => {
          if (!items.length) return null;
          const meta = groupMeta[type];
          return (
            <div key={type}>
              <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 600, color: meta.color, textTransform: 'uppercase', letterSpacing: 0.8, background: '#fafafa' }}>
                {meta.label}
              </div>
              {items.map((n) => (
                <div key={n.id}
                  onClick={() => n.link && onNavigate?.(n.link)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 16px', borderBottom: '1px solid #f5f5f5', transition: 'background 0.15s', cursor: n.link ? 'pointer' : 'default' }}
                  onMouseEnter={e => e.currentTarget.style.background = n.link ? '#fff8ee' : '#f9f9f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, marginTop: 1 }}>
                    {n.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</div>
                    {n.subtitle && <div style={{ fontSize: 12, color: '#888', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.subtitle}</div>}
                  </div>
                  {n.time && <div style={{ fontSize: 11, color: '#bbb', flexShrink: 0, marginTop: 2 }}>{n.time}</div>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function relTime(iso, t) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return t.layout.justNow;
  if (m < 60) return t.layout.minutesAgo.replace('{n}', m);
  const h = Math.floor(m / 60);
  if (h < 24) return t.layout.hoursAgo.replace('{n}', h);
  return t.layout.daysAgo.replace('{n}', Math.floor(h / 24));
}

/* ── Notification Bell ────────────────────────────────── */
function NotificationBell() {
  const [open, setOpen]                   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [ringing, setRinging]             = useState(false);
  const prevUnread = useRef(0);
  useEffect(() => {
    if (unread > prevUnread.current) setRinging(true);
    prevUnread.current = unread;
  }, [unread]);
  const { t } = useLanguage();
  const { isAdmin, hasRole } = useAuth();
  const navigate = useNavigate();
  const canApprove = isAdmin() || hasRole('truotri') || hasRole('thuki');
  // ref so handleOpenChange always has latest list (avoids stale closure)
  const notifsRef = React.useRef([]);
  const openRef = React.useRef(false);
  const tRef = React.useRef(t);
  tRef.current = t;
  const signatureRef = React.useRef('');
  const loadRef = React.useRef(() => {});

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    const load = async () => {
      if (inFlight || document.hidden) return;
      inFlight = true;
      const t = tRef.current;
      const items = [];
      const today = new Date();
      const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const todayStr = ymd(today);

      // 1. Overdue work assignments
      try {
        const res = await api.get('/work-assignments');
        const tasks = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        const overdue = tasks.filter(t =>
          t.endDate && t.endDate < todayStr &&
          t.status !== 'hoàn_thành' && t.status !== 'hủy'
        );
        overdue.forEach(task => items.push({
          id: `task-${task.id}`,
          type: 'overdue_task',
          icon: '⚠️',
          title: task.title,
          subtitle: `${t.layout.inCharge}: ${task.personnel?.dharmName || task.personnel?.fullName || '—'}`,
          time: t.layout.overdue,
        }));
      } catch { /* silent */ }

      // 2. Today's duties
      try {
        const res = await api.get(`/duty-schedules?startDate=${todayStr}&endDate=${todayStr}`);
        const duties = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        duties.forEach(d => {
          const timeLabel = d.startTime && d.endTime
            ? `${d.startTime} – ${d.endTime}`
            : d.startTime
              ? `${d.startTime}`
              : t.layout.today;
          items.push({
            id: `duty-${d.id}`,
            type: 'today_duty',
            icon: '📅',
            title: d.dutyType?.replace(/_/g, ' ') || t.layout.dutyFallback,
            subtitle: `${t.layout.shiftPrefix} ${d.shift || '—'} · ${d.personnel?.dharmName || d.personnel?.fullName || '—'}`,
            time: timeLabel,
          });
        });
      } catch { /* silent */ }

      // 3. Buddhist holidays in next 7 days (may cross into next year)
      try {
        const holidayMaps = {};
        for (let i = 0; i <= 7; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() + i);
          const key = ymd(d);
          const y = d.getFullYear();
          if (!holidayMaps[y]) holidayMaps[y] = getBuddhistHolidays(y);
          const h = holidayMaps[y].get(key);
          if (h) {
            h.names.forEach((name, idx) => items.push({
              id: `holiday-${key}-${idx}`,
              type: 'holiday',
              icon: '☸️',
              title: name,
              subtitle: i === 0 ? t.layout.today : `${i} ${t.layout.daysLater}`,
              time: `${d.getDate()}/${d.getMonth() + 1}`,
            }));
          }
        }
      } catch { /* silent */ }

      // 4. Pending posts for approval (admin / truotri / thuki only)
      if (canApprove) {
        try {
          const res = await api.get('/posts/pending?limit=50');
          const pending = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
          pending.forEach(post => items.push({
            id: `pending-post-${post._id || post.id}`,
            type: 'pending_post',
            icon: '📝',
            title: post.title,
            subtitle: `${t.layout.postedBy}: ${post.author?.dharmName || post.author?.fullName || post.userAuthor?.username || '—'}`,
            time: post.createdAt ? relTime(post.createdAt, t) : t.layout.pendingReview,
            link: `/app/news?tab=pending&post=${post._id || post.id}`,
          }));
        } catch { /* silent */ }
      }

      inFlight = false;
      if (cancelled) return;

      // While the panel is open, anything newly loaded counts as seen
      if (openRef.current) {
        localStorage.setItem('notif_seen_ids', JSON.stringify(items.map(n => n.id)));
      }
      // 5. New comments from others on posts I wrote or joined
      try {
        const res = await api.get('/posts/comments/recent', { params: { limit: 20, days: 7 } });
        const list = Array.isArray(res.data) ? res.data : [];
        list.forEach(c => {
          const who = c.commentAuthor?.dharmName || c.commentAuthor?.fullName || c.commentUser?.username || '—';
          const text = String(c.content || '').replace(/\s+/g, ' ');
          items.push({
            id: `comment-${c.id}`,
            type: 'new_comment',
            icon: '💬',
            title: `${who} ${c.onMyPost ? t.layout.commentedOnYourPost : t.layout.alsoCommented}`,
            subtitle: `“${text.length > 60 ? `${text.slice(0, 60)}…` : text}” · ${c.post?.title || ''}`,
            time: relTime(c.createdAt, t),
            link: `/app/news?post=${c.postId}`,
          });
        });
      } catch { /* silent */ }

      // Only count items the user hasn't seen yet (persisted across page loads)
      const seenIds = new Set(JSON.parse(localStorage.getItem('notif_seen_ids') || '[]'));
      const newCount = items.filter(n => !seenIds.has(n.id)).length;

      // Skip re-rendering when nothing changed between polls
      const signature = items.map(n => `${n.id}|${n.title}|${n.subtitle}|${n.time}`).join('§');
      if (signature !== signatureRef.current) {
        signatureRef.current = signature;
        notifsRef.current = items;
        setNotifications(items);
      }
      setUnread(newCount);
    };

    loadRef.current = load;
    load();
    const id = setInterval(load, 3000);
    const onVisible = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [canApprove]);

  const handleOpenChange = (v) => {
    setOpen(v);
    openRef.current = v;
    if (v) {
      loadRef.current();
      // Mark all currently loaded notifications as seen
      const ids = notifsRef.current.map(n => n.id);
      localStorage.setItem('notif_seen_ids', JSON.stringify(ids));
      setUnread(0);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
      trigger="click"
      placement="bottomRight"
      content={<NotificationPanel notifications={notifications} onNavigate={(path) => { navigate(path); setOpen(false); }} />}
      overlayInnerStyle={{ padding: 0, borderRadius: 10, overflow: 'hidden' }}
      overlayStyle={{ zIndex: 1100 }}
    >
      <Badge count={unread} size="small" offset={[-4, 4]} color="#d9646c">
        <button
          type="button"
          className={`hdr-icon-btn${open ? ' is-open' : ''}${ringing ? ' is-ringing' : ''}`}
          aria-label="notifications"
          onAnimationEnd={() => setRinging(false)}
        >
          <BellOutlined />
        </button>
      </Badge>
    </Popover>
  );
}

const SIDEBAR_BG = '#ffffff';

/* ── Custom sidebar menu — replaces Ant Design <Menu> ── */
function SidebarMenu({ items, selectedKey, onSelect, collapsed }) {
  const [hovered, setHovered] = useState(null);
  return (
    <nav role="menu" style={{ padding: '8px 0', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
      {items.map((item, idx) => {
        if (item.type === 'divider') {
          return (
            <div key={`div-${idx}`} style={{
              height: 1, margin: '10px 20px',
              background: '#f1e8db',
            }} />
          );
        }
        const sel = selectedKey === item.key;
        const hov = hovered === item.key;
        return (
          <div
            key={item.key}
            role="menuitem"
            tabIndex={0}
            aria-current={sel ? 'page' : undefined}
            onClick={() => onSelect(item.key)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(item.key); } }}
            onMouseEnter={() => setHovered(item.key)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : 10,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '6px 0' : '5px 10px 5px 6px',
              margin: '2px 12px',
              borderRadius: 12,
              cursor: 'pointer',
              outline: 'none',
              overflow: 'hidden',
              background: sel
                ? 'linear-gradient(135deg, #dca35e 0%, #c47f36 60%, #b56f28 100%)'
                : hov ? '#f8f2ea' : 'transparent',
              boxShadow: sel ? '0 6px 16px rgba(196,127,54,.30)' : 'none',
              transition: 'background 0.18s ease, box-shadow 0.18s ease',
            }}
          >
            {/* icon tile */}
            <span style={{
              width: 32, height: 32, flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 10,
              fontSize: 15.5, lineHeight: 1,
              background: sel ? 'rgba(255,255,255,.22)' : hov ? '#fff' : '#f7f2ec',
              color: sel ? '#ffffff' : hov ? '#c47f36' : '#a8957f',
              transition: 'color 0.18s, background 0.18s',
            }}>
              {item.icon}
            </span>

            {/* label */}
            {!collapsed && (
              <span style={{
                fontSize: 13.5, flex: 1,
                fontWeight: sel ? 650 : 500,
                letterSpacing: 0.1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                color: sel ? '#ffffff' : hov ? '#3e2c1f' : '#5f5046',
                transition: 'color 0.18s',
              }}>
                {item.label}
              </span>
            )}

            {/* collapsed selected dot */}
            {sel && collapsed && (
              <span style={{
                position: 'absolute', bottom: 1,
                left: '50%', transform: 'translateX(-50%)',
                display: 'block', width: 4, height: 4,
                borderRadius: '50%', background: '#ffffff',
                boxShadow: 'none',
              }} />
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [changePassForm] = Form.useForm();
  const [navState, setNavState] = useState(0); // 0=idle 1=loading 2=done
  const [buddhaGlows, setBuddhaGlows] = useState([]);
  const handleBuddhaClick = () => {
    const id = Date.now();
    setBuddhaGlows(g => [...g, id]);
    setTimeout(() => setBuddhaGlows(g => g.filter(x => x !== id)), 2100);
  };
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();
  const { lang, setLang, t } = useLanguage();

  const contentRef = useRef(null);
  const isFirstNav = useRef(true);
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
    if (isFirstNav.current) { isFirstNav.current = false; return; }
    setNavState(1);
    const done  = setTimeout(() => setNavState(2), 340);
    const reset = setTimeout(() => setNavState(0), 660);
    return () => { clearTimeout(done); clearTimeout(reset); };
  }, [location.pathname]);

  const screens = useBreakpoint();
  const isMobile = screens.md === false;
  const isTablet = screens.md === true && screens.lg === false;
  const isPhone  = screens.sm === false;

  const PAGE_TITLES = {
    '/app/dashboard':          { label: t.layout.pageTitle.dashboard,        icon: <AppstoreFilled /> },
    '/app/personnel':          { label: t.layout.pageTitle.personnel,         icon: <TeamOutlined /> },
    '/app/departments':        { label: t.layout.pageTitle.departments,       icon: <BankFilled /> },
    '/app/duty-schedule':      { label: t.layout.pageTitle.dutySchedule,      icon: <CalendarFilled /> },
    '/app/work-assignment':    { label: t.layout.pageTitle.workAssignment,    icon: <CheckSquareFilled /> },
    '/app/training':           { label: t.layout.pageTitle.training,          icon: <BookFilled /> },
    '/app/buddhist-followers': { label: t.layout.pageTitle.buddhistFollowers, icon: <HeartFilled /> },
    '/app/donations':          { label: t.layout.pageTitle.donations,          icon: <DollarCircleOutlined /> },
    '/app/reward-discipline':  { label: t.layout.pageTitle.rewardDiscipline,  icon: <TrophyFilled /> },
    '/app/news':               { label: t.layout.pageTitle.news,              icon: <NotificationFilled /> },
    '/app/users':              { label: t.layout.pageTitle.users,             icon: <SafetyCertificateFilled /> },
  };

  useEffect(() => {
    if (isMobile || isTablet) setCollapsed(true);
  }, [isMobile, isTablet]);

  useEffect(() => {
    const name = PAGE_TITLES[location.pathname]?.label || t.layout.defaultPageTitle;
    document.title = `${name} — ${t.app.siteName}`;
  }, [location.pathname, t]);

  const currentPage = PAGE_TITLES[location.pathname];

  const showFullLabel = isMobile || !collapsed;

  const menuItems = [
    { key: '/app/dashboard',          icon: <AppstoreFilled />,       label: t.nav.dashboard },
    { key: '/app/personnel',          icon: <TeamOutlined />,         label: t.nav.personnel },
    { key: '/app/departments',        icon: <BankFilled />,           label: t.nav.departments },
    { key: '/app/duty-schedule',      icon: <CalendarFilled />,       label: t.nav.dutySchedule },
    { key: '/app/work-assignment',    icon: <CheckSquareFilled />,    label: t.nav.workAssignment },
    { key: '/app/training',           icon: <BookFilled />,           label: t.nav.training },
    { key: '/app/buddhist-followers', icon: <HeartFilled />,          label: t.nav.buddhistFollowers },
    ...(['admin', 'thuki'].includes(user?.role) ? [
      { key: '/app/donations', icon: <DollarCircleOutlined />, label: t.nav.donations },
    ] : []),
    { key: '/app/reward-discipline',  icon: <TrophyFilled />,         label: t.nav.rewardDiscipline },
    { key: '/app/news',               icon: <NotificationFilled />,   label: t.nav.news },
    ...(user?.role === 'admin' ? [
      { type: 'divider' },
      { key: '/app/users', icon: <SafetyCertificateFilled />, label: t.nav.users },
    ] : []),
  ];

  const userMenuItems = [
    { key: 'profile',          icon: <UserOutlined />,   label: t.userMenu.profile },
    { key: 'change-password',  icon: <KeyOutlined />,    label: t.userMenu.changePassword },
    { type: 'divider' },
    { key: 'logout',           icon: <LogoutOutlined />, label: t.userMenu.logout, danger: true },
  ];

  const handleUserMenu = async ({ key }) => {
    if (key === 'logout') { logout(); return; }
    if (key === 'profile') {
      try {
        const res = await api.get('/auth/me');
        setProfileData(res.data);
      } catch { setProfileData(user); }
      setProfileOpen(true);
    }
    if (key === 'change-password') {
      changePassForm.resetFields();
      setChangePassOpen(true);
    }
  };

  const handleChangePassword = async (values) => {
    setChangePassLoading(true);
    try {
      await api.put('/auth/change-password', { oldPassword: values.oldPassword, newPassword: values.newPassword });
      message.success(t.auth.changePasswordSuccess);
      setChangePassOpen(false);
    } catch (err) {
      message.error(err.response?.data?.message || t.auth.changePasswordFail);
    } finally {
      setChangePassLoading(false);
    }
  };

  const displayName = user?.personnel?.dharmName || user?.personnel?.fullName || user?.username;
  const initials = displayName?.charAt(0)?.toUpperCase() || 'U';

  const goTo = (path) => {
    if (path !== location.pathname) navigate(path);
    if (isMobile) setCollapsed(true);
  };

  const handleLogoClick = () => goTo('/app/dashboard');

  const sidebarContent = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div
        style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: showFullLabel ? 'flex-start' : 'center', padding: showFullLabel ? '0 16px' : 0, borderBottom: '1px solid #f0e6d8', cursor: 'pointer', gap: 10 }}
        onClick={handleLogoClick}
      >
        {/* Logo Buddha circle */}
        {(() => {
          const sz = showFullLabel ? 42 : 36;
          return (
            <div style={{
              width: sz, height: sz, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
              border: '2px solid #fff',
              boxShadow: '0 0 0 1.5px rgba(214,160,96,.6), 0 4px 12px rgba(196,127,54,.25)',
            }}>
              <img src="/adida.PNG" alt="" style={{
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center 18%',
                display: 'block',
              }}/>
            </div>
          );
        })()}
        {showFullLabel && (
          <div style={{ whiteSpace: 'nowrap' }}>
            <Text style={{ color: '#a2652a', fontWeight: 800, fontSize: 13.5, letterSpacing: 0.3 }}>{t.app.title1} </Text>
            <Text style={{ color: '#6f5a49', fontWeight: 600, fontSize: 13 }}>{t.app.title2}</Text>
          </div>
        )}
      </div>

      <SidebarMenu
        items={menuItems}
        selectedKey={location.pathname}
        onSelect={goTo}
        collapsed={collapsed && !isMobile}
      />

      {/* Buddha mandala — bottom decoration, click for halo effect */}
      {showFullLabel && (
        <div className="sider-buddha" style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', padding: '22px 0 18px' }}>
          <div
            onClick={handleBuddhaClick}
            style={{ position: 'relative', width: 112, height: 112, cursor: 'pointer' }}
          >
            {/* Soft ambient glow */}
            <div style={{
              position: 'absolute', inset: '-30%', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(250,222,170,0.40) 0%, rgba(250,230,200,0.14) 50%, transparent 72%)',
              pointerEvents: 'none',
            }}/>

            {/* Emanating halo rings on click */}
            {buddhaGlows.map(id => (
              <React.Fragment key={id}>
                <div className="buddha-ring buddha-ring-d1"/>
                <div className="buddha-ring buddha-ring-d2"/>
                <div className="buddha-ring buddha-ring-d3"/>
              </React.Fragment>
            ))}

            {/* Outer golden ring */}
            <div style={{
              position: 'absolute', inset: -4, borderRadius: '50%',
              border: '1.5px solid #ecd6b5',
              boxShadow: '0 6px 16px rgba(176,111,44,0.14)',
              pointerEvents: 'none',
            }}/>
            {/* Circle-cropped Buddha image */}
            <div style={{
              borderRadius: '50%', overflow: 'hidden',
              width: 112, height: 112,
              border: '2px solid #fff',
              opacity: 0.92,
            }}>
              <img
                src="/adida.PNG"
                alt=""
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center 18%',
                  display: 'block',
                  filter: 'brightness(1.06) saturate(1.10)',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {!isMobile && (
        <Sider trigger={null} collapsible collapsed={collapsed} width={240}
          style={{ background: SIDEBAR_BG, boxShadow: '1px 0 0 #f1e8db, 6px 0 24px rgba(120,90,50,0.04)', position: 'relative', overflow: 'hidden', height: '100vh' }}>
          {sidebarContent}
        </Sider>
      )}

      <Drawer
        open={isMobile && !collapsed}
        onClose={() => setCollapsed(true)}
        placement="left"
        width={240}
        closable={false}
        styles={{ body: { padding: 0, background: SIDEBAR_BG, overflow: 'hidden', height: '100%' } }}
      >
        {sidebarContent}
      </Drawer>

      <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: isPhone ? '0 10px' : '0 16px', height: isPhone ? 56 : 72, minHeight: isPhone ? 56 : 72, lineHeight: isPhone ? '56px' : '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0e6d8', boxShadow: '0 1px 12px rgba(120,90,50,.04)', zIndex: 10, position: 'relative', flexShrink: 0 }}>

          {/* ── Navigation progress bar ── */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #e7b35a 0%, #c47f36 55%, #e98a6a 100%)',
              width:   navState === 1 ? '80%' : navState === 2 ? '100%' : '0%',
              opacity: navState === 0 ? 0 : 1,
              transition: navState === 1
                ? 'width 0.38s cubic-bezier(0.1,0.5,0.5,1), opacity 0.05s'
                : navState === 2
                  ? 'width 0.14s ease-out, opacity 0.22s ease 0.1s'
                  : 'opacity 0.18s ease',
            }} />
          </div>

          <div onClick={() => setCollapsed(!collapsed)} style={{ fontSize: 18, cursor: 'pointer', color: '#5a3a22', padding: '0 8px' }}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>

          {currentPage && !isPhone && (
            <div style={{
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'linear-gradient(135deg, #fff8ee 0%, #fcefdc 100%)',
              border: '1px solid #f0dfc6',
              borderRadius: 20,
              padding: '5px 14px 5px 10px',
              pointerEvents: 'none', userSelect: 'none',
              maxWidth: isMobile ? 180 : 300,
            }}>
              <span style={{
                fontSize: 14, lineHeight: 1, flexShrink: 0,
                color: '#c47f36',
                display: 'flex', alignItems: 'center',
              }}>
                {currentPage.icon}
              </span>
              <Text style={{
                fontWeight: 700, fontSize: 14, color: '#5a3a22',
                letterSpacing: 0.2, whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {currentPage.label}
              </Text>
            </div>
          )}

          <div className="hdr-actions">
            {/* Language switch */}
            <div className={`hdr-lang is-${lang}`} role="radiogroup" aria-label="Language">
              <span className="hdr-lang__thumb" aria-hidden="true" />
              {['vi', 'en'].map(code => (
                <button
                  key={code}
                  type="button"
                  role="radio"
                  aria-checked={lang === code}
                  className={`hdr-lang__opt${lang === code ? ' is-active' : ''}`}
                  onClick={() => setLang(code)}
                  title={code === 'vi' ? 'Tiếng Việt' : 'English'}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>

            <NotificationBell />

            <span className="hdr-divider" aria-hidden="true" />

            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenu }}
              placement="bottomRight"
              trigger={['click']}
              popupRender={(menu) => (
                <div className="hdr-menu">
                  <div className="hdr-menu__profile">
                    <div className="hdr-avatar hdr-avatar--lg">{initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="hdr-menu__name">{displayName}</div>
                      <div className="hdr-menu__user">@{user?.username}</div>
                      <span className="hdr-role">{t.roles[user?.role] || user?.role}</span>
                    </div>
                  </div>
                  {menu}
                </div>
              )}
            >
              <button type="button" className="hdr-user">
                <span className="hdr-avatar">
                  {initials}
                  <i className="hdr-avatar__status" />
                </span>
                {!isMobile && (
                  <span className="hdr-user__text">
                    <span className="hdr-user__name">{displayName}</span>
                    <span className="hdr-user__role">{t.roles[user?.role] || user?.role}</span>
                  </span>
                )}
                <DownOutlined className="hdr-user__chevron" />
              </button>
            </Dropdown>
          </div>
        </Header>

        <Content ref={contentRef} style={{ margin: isMobile ? '8px' : '16px', overflowY: 'auto', overflowX: 'hidden', scrollbarGutter: 'stable', position: 'relative', zIndex: 1, flex: 1, minHeight: 0 }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.08, ease: 'easeIn' } }}
              style={{ minHeight: '100%' }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </Content>
      </Layout>

      <Modal open={profileOpen} onCancel={() => setProfileOpen(false)} footer={null}
        title={<span style={{ color: '#5a3a22', fontWeight: 700 }}>{t.auth.profile}</span>} width={480}>
        {profileData && (
          <Descriptions column={1} bordered size="small" style={{ marginTop: 8 }}>
            <Descriptions.Item label={t.auth.username}><strong>{profileData.username}</strong></Descriptions.Item>
            <Descriptions.Item label={t.users.colRole}>
              <Tag color={profileData.role === 'admin' ? 'red' : profileData.role === 'truotri' ? 'purple' : 'blue'}>
                {t.roles[profileData.role] || profileData.role}
              </Tag>
            </Descriptions.Item>
            {profileData.personnel && <>
              <Descriptions.Item label={t.common.dharmName}>{profileData.personnel.dharmName || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.common.name}>{profileData.personnel.fullName || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.common.email}>{profileData.personnel.email || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.personnel.colPhone}>{profileData.personnel.phone || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.personnel.colPosition}>{profileData.personnel.position || '—'}</Descriptions.Item>
            </>}
            <Descriptions.Item label={t.common.status}>
              <Tag color={profileData.isActive ? 'green' : 'red'}>
                {profileData.isActive ? t.users.active : t.users.locked}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal open={changePassOpen} onCancel={() => setChangePassOpen(false)} onOk={() => changePassForm.submit()}
        okText={t.common.confirm} cancelText={t.common.cancel}
        okButtonProps={{ loading: changePassLoading, style: { background: '#c47f36', borderColor: '#c47f36' } }}
        title={<span style={{ color: '#5a3a22', fontWeight: 700 }}>{t.auth.changePassword}</span>} width={400}>
        <Form form={changePassForm} layout="vertical" onFinish={handleChangePassword} style={{ marginTop: 16 }}>
          <Form.Item name="oldPassword" label={t.auth.oldPassword} rules={[{ required: true, message: `${t.auth.oldPassword}` }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="newPassword" label={t.auth.newPassword}
            rules={[{ required: true }, { min: 6, message: t.auth.passwordMinLength }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="confirmPassword" label={t.auth.confirmPassword} dependencies={['newPassword']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error(t.auth.passwordMismatch));
                },
              }),
            ]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
