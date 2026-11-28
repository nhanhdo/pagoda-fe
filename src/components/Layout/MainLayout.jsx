import React, { useState, useEffect, useRef } from 'react';
import { useOutlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import {
  Layout, Dropdown, Space, Typography, Modal, Form, Input,
  Descriptions, Tag, message, Select, Grid, Drawer,
  Badge, Popover, Button, Empty, Tooltip, Skeleton,
} from 'antd';
import {
  AppstoreFilled, TeamOutlined, CalendarFilled, CheckSquareFilled,
  BookFilled, HeartFilled, TrophyFilled, BankFilled, NotificationFilled,
  LogoutOutlined, UserOutlined, KeyOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  BellOutlined, SafetyCertificateFilled, DollarCircleOutlined, DownOutlined, CheckOutlined, CloudServerOutlined, AccountBookOutlined, FireOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import DharmaWheel from '../DharmaWheel/DharmaWheel';
import LangToggle from '../LangToggle/LangToggle';
import { Fade } from '../AnimateUI/Effects';
import api from '../../api/axios';
import { useLanguage } from '../../i18n/LanguageContext';
import { getBuddhistHolidays } from '../../utils/lunarCalendar';
import { guardedClose, rules } from '../../utils/formGuard';

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
function NotificationPanel({ notifications, readIds, onItemClick, onMarkAllRead }) {
  const { t } = useLanguage();
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const header = (
    <div className="notif__head">
      <span className="notif__title">{t.layout.notifications}</span>
      {unreadCount > 0 ? (
        <button type="button" className="notif__mark" onClick={onMarkAllRead}>
          <CheckOutlined /> {t.layout.markAllRead}
        </button>
      ) : (
        notifications.length > 0 && <span className="notif__count">{t.layout.allRead}</span>
      )}
    </div>
  );

  if (!notifications.length) {
    return (
      <div className="notif">
        {header}
        <Empty description={t.layout.noNotifications} style={{ padding: '24px 0' }} />
      </div>
    );
  }

  const order = ['new_comment', 'pending_expense', 'pending_post', 'overdue_task', 'today_duty', 'holiday'];
  const groupMeta = {
    new_comment:  { label: t.layout.newCommentsGroup,      color: '#3a9483' },
    pending_expense: { label: t.layout.pendingExpensesGroup, color: '#b9841f' },
    pending_post: { label: t.layout.pendingPostGroup,      color: '#d46b08' },
    overdue_task: { label: t.layout.overdueTasksGroup,     color: '#d9646c' },
    today_duty:   { label: t.layout.todayDutyGroup,        color: '#4d8fc7' },
    holiday:      { label: t.layout.upcomingHolidaysGroup, color: '#c98a1e' },
  };

  return (
    <div className="notif">
      {header}
      <div className="notif__list">
        {order.map(type => {
          const items = notifications.filter(n => n.type === type);
          if (!items.length) return null;
          const meta = groupMeta[type];
          return (
            <div key={type}>
              <div className="notif__group" style={{ color: meta.color }}>{meta.label}</div>
              {items.map((n) => {
                const isUnread = !readIds.has(n.id);
                return (
                  <button
                    type="button"
                    key={n.id}
                    className={`notif__item${isUnread ? ' is-unread' : ''}`}
                    onClick={() => onItemClick(n)}
                  >
                    <span className="notif__icon" style={{ background: `${meta.color}18` }}>{n.icon}</span>
                    <span className="notif__text">
                      <span className="notif__item-title">{n.title}</span>
                      {n.subtitle && <span className="notif__item-sub">{n.subtitle}</span>}
                    </span>
                    <span className="notif__meta">
                      {n.time && <span className="notif__time">{n.time}</span>}
                      {isUnread && <span className="notif__dot" aria-label="unread" />}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const SEEN_KEY = 'notif_seen_ids';
const READ_KEY = 'notif_read_ids';
const STORE_CAP = 500;
const readStore = (key) => {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); }
};
const addToStore = (key, ids) => {
  const set = readStore(key);
  ids.forEach(id => set.add(id));
  localStorage.setItem(key, JSON.stringify(Array.from(set).slice(-STORE_CAP)));
};

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
  const [readIds, setReadIds]             = useState(() => readStore(READ_KEY));
  const [ringing, setRinging]             = useState(false);
  const prevUnread = useRef(0);
  useEffect(() => {
    if (unread > prevUnread.current) setRinging(true);
    prevUnread.current = unread;
  }, [unread]);
  const { t, lang } = useLanguage();
  const { isAdmin, hasRole } = useAuth();
  const navigate = useNavigate();
  const langRef = React.useRef(lang);
  langRef.current = lang;
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
      const who = (p, u) => p?.dharmName || p?.fullName || u?.username || '—';
      let summary = null;
      try {
        const res = await api.get('/notifications/summary');
        summary = res.data || {};
      } catch { /* keep the previous list on network errors */ }

      if (summary) {
        // 1. Overdue work assignments
        (summary.overdueTasks || []).forEach(task => items.push({
          id: `task-${task.id}`,
          type: 'overdue_task',
          icon: '⚠️',
          title: task.title,
          subtitle: `${t.layout.inCharge}: ${who(task.personnel)}`,
          time: t.layout.overdue,
          link: '/app/work-assignment',
        }));

        // 2. Today's duties
        (summary.todayDuties || []).forEach(d => items.push({
          id: `duty-${d.id}`,
          type: 'today_duty',
          icon: '📅',
          title: t.dutySchedule?.dutyTypes?.[d.dutyType] || d.dutyType?.replace(/_/g, ' ') || t.layout.dutyFallback,
          subtitle: `${t.layout.shiftPrefix} ${t.dutySchedule?.shifts?.[d.shift] || d.shift || '—'} · ${who(d.personnel)}`,
          time: d.startTime && d.endTime ? `${d.startTime} – ${d.endTime}` : d.startTime || t.layout.today,
          link: '/app/duty-schedule',
        }));

        // 4a. Expense vouchers waiting for admin approval
        (summary.pendingExpenses || []).forEach(e => items.push({
          id: `pending-expense-${e.id}`,
          type: 'pending_expense',
          icon: '🧾',
          title: `${e.code} · ${Math.round(Number(e.amount) || 0).toLocaleString('vi-VN')} ₫`,
          subtitle: [e.fund?.name, e.payee || e.description, e.creator && who(e.creator.personnel, e.creator)].filter(Boolean).join(' · '),
          time: e.createdAt ? relTime(e.createdAt, t) : '',
          link: `/app/finance?tab=expenses&expense=${e.id}`,
        }));

        // 4. Posts waiting for approval
        (summary.pendingPosts || []).forEach(post => items.push({
          id: `pending-post-${post.id}`,
          type: 'pending_post',
          icon: '📝',
          title: post.title,
          subtitle: `${t.layout.postedBy}: ${who(post.author, post.userAuthor)}`,
          time: post.createdAt ? relTime(post.createdAt, t) : t.layout.pendingReview,
          link: `/app/news?tab=pending&post=${post.id}`,
        }));

        // 5. New comments from others on posts I wrote or joined
        (summary.comments || []).forEach(c => {
          const text = String(c.content || '').replace(/\s+/g, ' ');
          items.push({
            id: `comment-${c.id}`,
            type: 'new_comment',
            icon: '💬',
            title: `${who(c.commentAuthor, c.commentUser)} ${c.replyToMe ? t.layout.repliedToYou : c.onMyPost ? t.layout.commentedOnYourPost : t.layout.alsoCommented}`,
            subtitle: `“${text.length > 80 ? `${text.slice(0, 80)}…` : text}” · ${c.post?.title || ''}`,
            time: relTime(c.createdAt, t),
            link: `/app/news?post=${c.postId}`,
          });
        });
      } else {
        // Request failed: keep whatever was shown before (minus holidays, re-added below)
        notifsRef.current.filter(n => n.type !== 'holiday').forEach(n => items.push(n));
      }

      // 3. Buddhist holidays in the next 7 days (client-side, may cross into next year)
      try {
        const holidayMaps = {};
        for (let i = 0; i <= 7; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() + i);
          const key = ymd(d);
          const y = d.getFullYear();
          if (!holidayMaps[y]) holidayMaps[y] = getBuddhistHolidays(y, langRef.current);
          const h = holidayMaps[y].get(key);
          if (h) {
            h.names.forEach((name, idx) => items.push({
              id: `holiday-${key}-${idx}`,
              type: 'holiday',
              icon: '☸️',
              title: name,
              subtitle: i === 0 ? t.layout.today : `${i} ${t.layout.daysLater}`,
              time: `${d.getDate()}/${d.getMonth() + 1}`,
              link: '/app/news?tab=calendar',
            }));
          }
        }
      } catch { /* silent */ }

      inFlight = false;
      if (cancelled) return;

      // While the panel is open, anything newly loaded counts as seen (badge-wise)
      if (openRef.current) addToStore(SEEN_KEY, items.map(n => n.id));
      // Badge = items never seen before. Stores only ever grow, so a failed
      // request can't drop ids and make old items "new" again.
      const seenIds = readStore(SEEN_KEY);
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
    // Every 20s while the window is visible and focused; refresh immediately on focus/open.
    const id = setInterval(() => { if (!document.hidden && document.hasFocus()) load(); }, 20000);
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

  // Rebuild the list in the new language right away (holiday names, relative times)
  useEffect(() => { loadRef.current(); }, [lang]);

  const handleOpenChange = (v) => {
    setOpen(v);
    openRef.current = v;
    if (v) {
      // Opening clears the badge; items stay highlighted until read
      addToStore(SEEN_KEY, notifsRef.current.map(n => n.id));
      setUnread(0);
      loadRef.current();
    }
  };

  const markRead = (ids) => {
    addToStore(READ_KEY, ids);
    addToStore(SEEN_KEY, ids);
    setReadIds(readStore(READ_KEY));
  };

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
      trigger="click"
      placement="bottomRight"
      content={
        <NotificationPanel
          notifications={notifications}
          readIds={readIds}
          onItemClick={(n) => {
            markRead([n.id]);
            if (n.link) { navigate(n.link); setOpen(false); openRef.current = false; }
          }}
          onMarkAllRead={() => markRead(notifications.map(n => n.id))}
        />
      }
      overlayInnerStyle={{ padding: 0, borderRadius: 10, overflow: 'hidden' }}
      overlayStyle={{ zIndex: 1100 }}
    >
      <Badge count={unread} size="small" offset={[-4, 4]} color="#d9646c">
        <button
          type="button"
          className={`hdr-icon-btn${open ? ' is-open' : ''}${ringing ? ' is-ringing' : ''}`}
          aria-label={t.layout.notifications}
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
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(null);
  const { t } = useLanguage();
  // Plain navigation landmark + buttons with aria-current (a role="menu" would promise arrow-key behaviour)
  return (
    <LayoutGroup>
    <nav aria-label={t.layout.mainNav} style={{ padding: '8px 0', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
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
        const node = (
          <button
            type="button"
            key={item.key}
            className="sb-item"
            aria-label={collapsed ? item.label : undefined}
            aria-current={sel ? 'page' : undefined}
            onClick={() => onSelect(item.key)}
            onMouseEnter={() => setHovered(item.key)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : 10,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '6px 0' : '5px 10px 5px 6px',
              width: 'calc(100% - 24px)',
              margin: '2px 12px',
              border: 0,
              font: 'inherit',
              textAlign: 'left',
              borderRadius: 12,
              cursor: 'pointer',
              overflow: 'hidden',
              // Light, quiet menu: soft tint + accent bar for the current page (no heavy gradient)
              background: hov ? '#faf5ee' : 'transparent',
              transition: 'background var(--ui-fast) ease',
            }}
          >
            {sel && <motion.span aria-hidden="true" className="sb-current"
              layoutId={reduced ? undefined : 'sidebar-current'}
              transition={{ duration: reduced ? 0 : 0.22, ease: 'easeOut' }} />}
            {/* icon tile */}
            <span style={{
              width: 32, height: 32, flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 10,
              fontSize: 15.5, lineHeight: 1,
              background: 'transparent',
              color: sel ? '#b06f2c' : hov ? '#b06f2c' : '#8f7a66',
              transition: 'color 0.18s, background 0.18s',
            }}>
              {item.icon}
            </span>

            {/* label */}
            {!collapsed && (
              <span style={{
                fontSize: 13.5, flex: 1,
                fontWeight: sel ? 700 : 500,
                letterSpacing: 0.1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                color: sel ? '#8a4f1c' : hov ? '#2f2117' : '#4f4238',
                transition: 'color 0.18s',
              }}>
                {item.label}
              </span>
            )}

          </button>
        );
        return collapsed
          ? <Tooltip key={item.key} title={item.label} placement="right">{node}</Tooltip>
          : node;
      })}
    </nav>
    </LayoutGroup>
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();
  const { lang, t } = useLanguage();

  const reduceMotion = useReducedMotion();
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
    '/app/ceremonies':         { label: t.layout.pageTitle.ceremonies,        icon: <FireOutlined /> },
    '/app/library':            { label: t.layout.pageTitle.library,           icon: <DharmaWheel size="1em" /> },
    '/app/donations':          { label: t.layout.pageTitle.donations,          icon: <DollarCircleOutlined /> },
    '/app/finance':            { label: t.layout.pageTitle.finance,            icon: <AccountBookOutlined /> },
    '/app/reward-discipline':  { label: t.layout.pageTitle.rewardDiscipline,  icon: <TrophyFilled /> },
    '/app/news':               { label: t.layout.pageTitle.news,              icon: <NotificationFilled /> },
    '/app/users':              { label: t.layout.pageTitle.users,             icon: <SafetyCertificateFilled /> },
    '/app/backup':             { label: t.layout.pageTitle.backup,            icon: <CloudServerOutlined /> },
  };

  useEffect(() => {
    if (isMobile || isTablet) setCollapsed(true);
  }, [isMobile, isTablet]);

  // Sub-pages (e.g. /app/library/5, /app/personnel/4) belong to their section's menu item and title
  const sectionPath = location.pathname.split('/').slice(0, 3).join('/');
  useEffect(() => {
    const name = PAGE_TITLES[sectionPath]?.label || t.layout.defaultPageTitle;
    document.title = `${name} — ${t.app.siteName}`;
  }, [sectionPath, t]);


  const showFullLabel = isMobile || !collapsed;

  const menuItems = [
    { key: '/app/dashboard',          icon: <AppstoreFilled />,       label: t.nav.dashboard },
    { key: '/app/personnel',          icon: <TeamOutlined />,         label: t.nav.personnel },
    { key: '/app/departments',        icon: <BankFilled />,           label: t.nav.departments },
    { key: '/app/duty-schedule',      icon: <CalendarFilled />,       label: t.nav.dutySchedule },
    { key: '/app/work-assignment',    icon: <CheckSquareFilled />,    label: t.nav.workAssignment },
    { key: '/app/training',           icon: <BookFilled />,           label: t.nav.training },
    { key: '/app/buddhist-followers', icon: <HeartFilled />,          label: t.nav.buddhistFollowers },
    { key: '/app/ceremonies',         icon: <FireOutlined />,         label: t.nav.ceremonies },
    { key: '/app/library',            icon: <span className="anticon"><DharmaWheel size="1em" /></span>, label: t.nav.library },
    ...(['admin', 'truotri', 'thuki'].includes(user?.role) ? [
      { key: '/app/donations', icon: <DollarCircleOutlined />, label: t.nav.donations },
    ] : []),
    ...(['admin', 'truotri', 'thuki'].includes(user?.role) ? [
      { key: '/app/finance', icon: <AccountBookOutlined />, label: t.nav.finance },
    ] : []),
    { key: '/app/reward-discipline',  icon: <TrophyFilled />,         label: t.nav.rewardDiscipline },
    { key: '/app/news',               icon: <NotificationFilled />,   label: t.nav.news },
    ...(user?.role === 'admin' ? [
      { type: 'divider' },
      { key: '/app/users', icon: <SafetyCertificateFilled />, label: t.nav.users },
      { key: '/app/backup', icon: <CloudServerOutlined />, label: t.nav.backup },
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
      setProfileData(null);
      setProfileOpen(true);
      try {
        const res = await api.get('/auth/me');
        setProfileData(res.data);
      } catch { setProfileData(user); }
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

  const headerHeight = 56;
  const sidebarContent = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div
        role="button"
        tabIndex={0}
        aria-label={t.layout.goHome}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLogoClick(); } }}
        style={{ height: headerHeight, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: showFullLabel ? 'flex-start' : 'center', padding: showFullLabel ? '0 16px' : 0, borderBottom: '1px solid #ece1d1', cursor: 'pointer', gap: 10 }}
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
              <img src="/pagoda-tab.svg" alt="" style={{
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
        selectedKey={sectionPath}
        onSelect={goTo}
        collapsed={collapsed && !isMobile}
      />

    </div>
  );

  const sidebarWidth = 240;
  const collapsedSidebarWidth = 80;

  return (
    <Layout className="app-shell" style={{ overflow: 'hidden' }}>
      <a className="app-skip" href="#app-content" onClick={(event) => {
        event.preventDefault();
        contentRef.current?.focus({ preventScroll: true });
      }}>{t.layout.skipToContent}</a>
      {!isMobile && (
        <Sider trigger={null} collapsible collapsed={collapsed} width={sidebarWidth} collapsedWidth={collapsedSidebarWidth}
          style={{ background: SIDEBAR_BG, boxShadow: '1px 0 0 #ece1d1', position: 'relative', overflow: 'hidden' }}>
          {sidebarContent}
        </Sider>
      )}

      <Drawer
        rootClassName="app-drawer"
        open={isMobile && !collapsed}
        onClose={() => setCollapsed(true)}
        placement="left"
        width={240}
        closable={false}
        styles={{ body: { padding: 0, background: SIDEBAR_BG, overflow: 'hidden', height: '100%' } }}
      >
        {sidebarContent}
      </Drawer>

      <Layout className="app-shell" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header style={{ background: '#ffffff', padding: isPhone ? '0 10px' : '0 16px', height: headerHeight, minHeight: headerHeight, lineHeight: `${headerHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ece1d1', boxShadow: '0 1px 0 rgba(120,90,50,.02)', zIndex: 10, position: 'relative', flexShrink: 0 }}>

          {/* ── Navigation progress bar ── */}
          <div className="hdr-nav-progress" aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #e7b35a 0%, #c47f36 55%, #e98a6a 100%)',
              width:   navState === 1 ? '80%' : navState === 2 ? '100%' : '0%',
              opacity: navState === 0 ? 0 : 1,
              transition: reduceMotion ? 'none' : navState === 1
                ? 'width 0.32s cubic-bezier(0.1,0.5,0.5,1), opacity 0.05s'
                : navState === 2
                  ? 'width 0.14s ease-out, opacity 0.22s ease 0.1s'
                  : 'opacity 0.18s ease',
            }} />
          </div>

          <div className="hdr-left">
            <button
              type="button"
              className="hdr-toggle"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? t.layout.expandMenu : t.layout.collapseMenu}
              aria-expanded={!collapsed}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
            <span className="hdr-page-compact">
              {PAGE_TITLES[sectionPath]?.label || t.layout.defaultPageTitle}
            </span>
          </div>

          <div className="hdr-actions">
            {/* Language switch */}
            <LangToggle />

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
              <button type="button" className="hdr-user" aria-label={t.layout.accountMenu}>
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

        <Content ref={contentRef} id="app-content" tabIndex={-1} className="app-content"
          style={{ margin: isMobile ? '8px' : '16px', overflowY: 'auto', overflowX: 'hidden', scrollbarGutter: 'stable', position: 'relative', zIndex: 1, flex: 1, minHeight: 0 }}>
          <Fade
            key={location.pathname}
            className="app-route"
            initialOpacity={0.9}
            style={{ minHeight: '100%', paddingBottom: isMobile ? 'calc(16px + env(safe-area-inset-bottom, 0px))' : 0 }}
          >
            {outlet}
          </Fade>
        </Content>
      </Layout>

      <Modal open={profileOpen} onCancel={() => setProfileOpen(false)} footer={null}
        title={<span style={{ color: '#5a3a22', fontWeight: 700 }}>{t.auth.profile}</span>} width={480}>
        {!profileData && <Skeleton active paragraph={{ rows: 5 }} style={{ marginTop: 12 }} />}
        {profileData && (
          <Descriptions column={1} bordered size="small" style={{ marginTop: 8 }}>
            <Descriptions.Item label={t.auth.username}><strong>{profileData.username}</strong></Descriptions.Item>
            <Descriptions.Item label={t.users.colRole}>
              <span className="tbl-pill" style={{ color: '#a2652a', background: '#fbf1e4' }}>
                {t.roles[profileData.role] || profileData.role}
              </span>
            </Descriptions.Item>
            {profileData.personnel && <>
              <Descriptions.Item label={t.common.dharmName}>{profileData.personnel.dharmName || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.common.name}>{profileData.personnel.fullName || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.common.email}>{profileData.personnel.email || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.personnel.colPhone}>{profileData.personnel.phone || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.personnel.colPosition}>{profileData.personnel.position ? (t.personnel.positions?.[profileData.personnel.position] || profileData.personnel.position.replace(/_/g, ' ')) : '—'}</Descriptions.Item>
            </>}
            <Descriptions.Item label={t.common.status}>
              <span className="tbl-pill" style={profileData.isActive ? { color: '#3f8461', background: '#e8f4ed' } : { color: '#c4545d', background: '#fdeeee' }}>
                <span className="tbl-pill__dot" />{profileData.isActive ? t.users.active : t.users.locked}
              </span>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal open={changePassOpen} onCancel={() => guardedClose(changePassForm, () => setChangePassOpen(false), t)} onOk={() => changePassForm.submit()}
        okText={t.common.confirm} cancelText={t.common.cancel} maskClosable={false} destroyOnClose
        confirmLoading={changePassLoading}
        title={<span style={{ color: '#5a3a22', fontWeight: 700 }}>{t.auth.changePassword}</span>} width={400}>
        <Form form={changePassForm} layout="vertical" onFinish={handleChangePassword} style={{ marginTop: 16 }} requiredMark={false}>
          <Form.Item name="oldPassword" label={t.auth.oldPassword} rules={[rules(t).required(t.auth.oldPassword.toLowerCase())]}>
            <Input.Password autoComplete="current-password" autoFocus />
          </Form.Item>
          <Form.Item name="newPassword" label={t.auth.newPassword}
            rules={[rules(t).required(t.auth.newPassword.toLowerCase()), { min: 6, message: t.auth.passwordMinLength }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="confirmPassword" label={t.auth.confirmPassword} dependencies={['newPassword']}
            rules={[
              rules(t).required(t.auth.confirmPassword.toLowerCase()),
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error(t.auth.passwordMismatch));
                },
              }),
            ]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          {/* Lets Enter submit even though the OK button lives in the modal footer */}
          <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
        </Form>
      </Modal>
    </Layout>
  );
}
