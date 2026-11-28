import React, { useState, useEffect, useRef } from 'react';
import { useOutlet, useNavigate, useLocation } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import {
  Layout, Dropdown, Space, Modal, Form, Input,
  Descriptions, Tag, message, Select, Grid, Drawer,
  Badge, Popover, Button, Empty, Tooltip, Skeleton,
} from 'antd';
import FormDialog from '../FormDialog/FormDialog';
import {
  AppstoreOutlined, TeamOutlined, CalendarOutlined, CheckSquareOutlined,
  BookOutlined, HeartOutlined, TrophyOutlined, BankOutlined, NotificationOutlined,
  LogoutOutlined, UserOutlined, KeyOutlined, MenuUnfoldOutlined, LeftOutlined, RightOutlined, CloseOutlined, SearchOutlined, SettingOutlined,
  BellOutlined, SafetyCertificateOutlined, DollarCircleOutlined, DownOutlined, CheckOutlined, CloudServerOutlined, AccountBookOutlined, FireOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import DharmaWheel from '../DharmaWheel/DharmaWheel';
import LangToggle from '../LangToggle/LangToggle';
import { Fade } from '../AnimateUI/Effects';
import api from '../../api/axios';
import { useLanguage } from '../../i18n/LanguageContext';
import { getBuddhistHolidays } from '../../utils/lunarCalendar';
import { guardedClose, rules } from '../../utils/formGuard';

const { Header, Content } = Layout;
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


const SIDEBAR_PREFERENCE = 'pagoda.sidebar.collapsed';

function normalizePageName(text) {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replaceAll('đ', 'd');
}

function SidebarMenu({ groups, selectedKey, onSelect, collapsed, query }) {
  const { t } = useLanguage();
  const search = normalizePageName(query.trim());
  const visibleGroups = groups
    .map(group => ({
      ...group,
      items: group.items.filter(item => normalizePageName(item.label).includes(search)),
    }))
    .filter(group => group.items.length > 0);

  return (
    <nav id="admin-navigation" className="sb-nav" aria-label={t.layout.mainNav}>
      {visibleGroups.map(group => (
        <div key={group.key} className="sb-group">
          {group.label && (
            collapsed ? (
              <Tooltip title={group.label} placement="right" trigger={['hover', 'focus']}>
                <span className="sb-group-anchor">
                  <Dropdown placement="rightTop" autoFocus trigger={['click']} menu={{
                    items: group.items,
                    selectedKeys: [selectedKey],
                    onClick: ({ key }) => onSelect(key),
                  }}>
                    <button type="button" className="sb-group-trigger" aria-haspopup="menu" aria-label={group.label}>
                      {group.icon}
                    </button>
                  </Dropdown>
                </span>
              </Tooltip>
            ) : <div className="sb-group-label">{group.label}</div>
          )}
          <ul className={`sb-list${group.label ? ' sb-list--nested' : ''}`}>
            {group.items.map(item => {
              const button = (
                <button type="button" className="sb-item" aria-label={item.label}
                  aria-current={selectedKey === item.key ? 'page' : undefined} onClick={() => onSelect(item.key)}>
                  <span className="sb-icon" aria-hidden="true">{item.icon}</span>
                  <span className="sb-label" aria-hidden={collapsed}>{item.label}</span>
                </button>
              );
              return (
                <li key={item.key}>
                  {collapsed
                    ? <Tooltip title={item.label} placement="right" trigger={['hover', 'focus']}>{button}</Tooltip>
                    : button}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {visibleGroups.length === 0 && <p className="sb-empty" role="status">{t.layout.noMatchingPages}</p>}
    </nav>
  );
}

export default function MainLayout() {
  const [sidebarPreference, setSidebarPreference] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_PREFERENCE);
    return saved === null ? null : saved === 'true';
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pageQuery, setPageQuery] = useState('');
  const searchRef = useRef(null);
  const focusSearch = useRef(false);
  const mobileToggleRef = useRef(null);
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
    '/app/dashboard':          { label: t.layout.pageTitle.dashboard,        icon: <AppstoreOutlined /> },
    '/app/personnel':          { label: t.layout.pageTitle.personnel,         icon: <TeamOutlined /> },
    '/app/departments':        { label: t.layout.pageTitle.departments,       icon: <BankOutlined /> },
    '/app/duty-schedule':      { label: t.layout.pageTitle.dutySchedule,      icon: <CalendarOutlined /> },
    '/app/work-assignment':    { label: t.layout.pageTitle.workAssignment,    icon: <CheckSquareOutlined /> },
    '/app/training':           { label: t.layout.pageTitle.training,          icon: <BookOutlined /> },
    '/app/buddhist-followers': { label: t.layout.pageTitle.buddhistFollowers, icon: <HeartOutlined /> },
    '/app/ceremonies':         { label: t.layout.pageTitle.ceremonies,        icon: <FireOutlined /> },
    '/app/library':            { label: t.layout.pageTitle.library,           icon: <DharmaWheel size="1em" /> },
    '/app/donations':          { label: t.layout.pageTitle.donations,          icon: <DollarCircleOutlined /> },
    '/app/finance':            { label: t.layout.pageTitle.finance,            icon: <AccountBookOutlined /> },
    '/app/reward-discipline':  { label: t.layout.pageTitle.rewardDiscipline,  icon: <TrophyOutlined /> },
    '/app/news':               { label: t.layout.pageTitle.news,              icon: <NotificationOutlined /> },
    '/app/users':              { label: t.layout.pageTitle.users,             icon: <SafetyCertificateOutlined /> },
    '/app/backup':             { label: t.layout.pageTitle.backup,            icon: <CloudServerOutlined /> },
  };

  const collapsed = !isMobile && (sidebarPreference ?? isTablet);
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (!collapsed && focusSearch.current) {
      focusSearch.current = false;
      searchRef.current?.focus();
    }
  }, [collapsed]);

  // Sub-pages (e.g. /app/library/5, /app/personnel/4) belong to their section's menu item and title
  const sectionPath = location.pathname.split('/').slice(0, 3).join('/');
  useEffect(() => {
    const name = PAGE_TITLES[sectionPath]?.label || t.layout.defaultPageTitle;
    document.title = `${name} — ${t.app.siteName}`;
  }, [sectionPath, t]);


  const groups = t.layout.navGroups;
  const menuGroups = [
    { key: 'overview', items: [
      { key: '/app/dashboard', icon: <AppstoreOutlined />, label: t.nav.dashboard },
    ] },
    { key: 'operations', label: groups.operations, icon: <SettingOutlined />, items: [
      { key: '/app/personnel', icon: <TeamOutlined />, label: t.nav.personnel },
      { key: '/app/departments', icon: <BankOutlined />, label: t.nav.departments },
      { key: '/app/duty-schedule', icon: <CalendarOutlined />, label: t.nav.dutySchedule },
      { key: '/app/work-assignment', icon: <CheckSquareOutlined />, label: t.nav.workAssignment },
      { key: '/app/reward-discipline', icon: <TrophyOutlined />, label: t.nav.rewardDiscipline },
    ] },
    { key: 'community', label: groups.community, icon: <BookOutlined />, items: [
      { key: '/app/buddhist-followers', icon: <HeartOutlined />, label: t.nav.buddhistFollowers },
      { key: '/app/ceremonies', icon: <FireOutlined />, label: t.nav.ceremonies },
      { key: '/app/training', icon: <BookOutlined />, label: t.nav.training },
      { key: '/app/library', icon: <span className="anticon"><DharmaWheel size="1em" /></span>, label: t.nav.library },
      { key: '/app/news', icon: <NotificationOutlined />, label: t.nav.news },
    ] },
    ...(['admin', 'truotri', 'thuki'].includes(user?.role) ? [{
      key: 'finance', label: groups.finance, icon: <DollarCircleOutlined />, items: [
        { key: '/app/donations', icon: <DollarCircleOutlined />, label: t.nav.donations },
        { key: '/app/finance', icon: <AccountBookOutlined />, label: t.nav.finance },
      ],
    }] : []),
    ...(user?.role === 'admin' ? [{
      key: 'admin', label: groups.admin, icon: <SafetyCertificateOutlined />, items: [
        { key: '/app/users', icon: <SafetyCertificateOutlined />, label: t.nav.users },
        { key: '/app/backup', icon: <CloudServerOutlined />, label: t.nav.backup },
      ],
    }] : []),
  ];

  const userMenuItems = [
    { key: 'profile',          icon: <UserOutlined />,   label: t.userMenu.profile },
    { key: 'change-password',  icon: <KeyOutlined />,    label: t.userMenu.changePassword },
    { type: 'divider' },
    { key: 'logout',           icon: <LogoutOutlined />, label: t.userMenu.logout, danger: true },
  ];

  const handleUserMenu = async ({ key }) => {
    if (isMobile) closeDrawer();
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

  const closeDrawer = () => {
    setDrawerOpen(false);
    setPageQuery('');
  };

  const goTo = (path) => {
    if (path !== location.pathname) navigate(path);
    setPageQuery('');
    if (isMobile) closeDrawer();
  };

  const saveCollapsed = (next) => {
    setSidebarPreference(next);
    localStorage.setItem(SIDEBAR_PREFERENCE, String(next));
    if (next) setPageQuery('');
  };

  const toggleLabel = isMobile || !collapsed ? t.layout.collapseMenu : t.layout.expandMenu;
  const accountButton = (
    <button type="button" className="sb-account" aria-label={t.layout.accountMenu} aria-haspopup="menu">
      <span className="hdr-avatar" aria-hidden="true">{initials}</span>
      <span className="sb-account__text" aria-hidden={collapsed}>
        <strong>{displayName}</strong>
        <small>{t.roles[user?.role] || user?.role}</small>
      </span>
      <DownOutlined className="sb-account__chevron" aria-hidden="true" />
    </button>
  );

  const sidebarContent = (
    <div className={`sb-panel admin-nav-glass${collapsed ? ' sb-panel--compact' : ''}`}>
      <div className="sb-top">
        <Tooltip title={collapsed ? t.layout.goHome : null} placement="right" trigger={['hover', 'focus']}>
          <button type="button" className="sb-brand" aria-label={t.layout.goHome}
            onClick={() => goTo('/app/dashboard')}>
            <img src="/pagoda-tab.svg" alt="" className="sb-brand__logo" />
            <span className="sb-brand__text" aria-hidden={collapsed}>{t.app.title1} <strong>{t.app.title2}</strong></span>
          </button>
        </Tooltip>
        <button type="button" className="sb-toggle" aria-label={toggleLabel}
          aria-expanded={isMobile ? drawerOpen : !collapsed} aria-controls="admin-navigation"
          onClick={() => isMobile ? closeDrawer() : saveCollapsed(!collapsed)}>
          {isMobile ? <CloseOutlined /> : collapsed ? <RightOutlined /> : <LeftOutlined />}
        </button>
        <div className="sb-search">
          {collapsed ? (
            <Tooltip title={t.layout.findPage} placement="right" trigger={['hover', 'focus']}>
              <button type="button" className="sb-search-trigger" aria-label={t.layout.findPage}
                onClick={() => { focusSearch.current = true; saveCollapsed(false); }}>
                <SearchOutlined />
              </button>
            </Tooltip>
          ) : (
            <Input ref={searchRef} value={pageQuery} onChange={event => setPageQuery(event.target.value)}
              prefix={<SearchOutlined />} allowClear placeholder={t.layout.findPage} aria-label={t.layout.findPage}
              onPressEnter={() => {
                const match = menuGroups.flatMap(group => group.items)
                  .find(item => normalizePageName(item.label).includes(normalizePageName(pageQuery.trim())));
                if (pageQuery.trim() && match) goTo(match.key);
              }} />
          )}
        </div>
      </div>

      <SidebarMenu groups={menuGroups} selectedKey={sectionPath} onSelect={goTo}
        collapsed={collapsed} query={pageQuery} />

      <div className="sb-bottom">
        <Tooltip title={collapsed ? t.layout.accountMenu : null} placement="right" trigger={['hover', 'focus']}>
          <div>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }}
              placement={isMobile ? 'topLeft' : 'rightBottom'} autoFocus trigger={['click']}>
              {accountButton}
            </Dropdown>
          </div>
        </Tooltip>
      </div>
    </div>
  );

  return (
    <Layout className={`app-shell admin-shell admin-shell--navigation${isMobile ? ' admin-shell--mobile' : ''}${collapsed ? ' admin-shell--compact' : ''}`}>
      <a className="app-skip" href="#app-content" onClick={(event) => {
        event.preventDefault();
        contentRef.current?.focus({ preventScroll: true });
      }}>{t.layout.skipToContent}</a>
      <Header className="admin-nav-glass admin-header" style={{ padding: isPhone ? '0 10px' : '0 16px', height: 56 }}>

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
          {isMobile && (
            <button
              type="button"
              className="hdr-toggle"
              ref={mobileToggleRef}
              onClick={() => setDrawerOpen(true)}
              aria-label={t.layout.expandMenu}
              aria-expanded={drawerOpen}
            >
              <MenuUnfoldOutlined />
            </button>
          )}
          <span className="hdr-page-compact">
            {PAGE_TITLES[sectionPath]?.label || t.layout.defaultPageTitle}
          </span>
        </div>

        <div className="hdr-actions">
          <LangToggle />

          <NotificationBell />
        </div>
      </Header>
      {!isMobile && <aside className="sb-rail">{sidebarContent}</aside>}
      {isMobile && (
        <Drawer rootClassName="app-drawer" open={drawerOpen} onClose={closeDrawer}
          placement="left" width="min(280px, calc(100vw - 24px))" closable={false}
          aria-label={t.layout.mainNav}
          afterOpenChange={visible => { if (!visible) mobileToggleRef.current?.focus({ preventScroll: true }); }}
          styles={{ body: { padding: 0 } }}>
          {sidebarContent}
        </Drawer>
      )}

      <Content ref={contentRef} id="app-content" tabIndex={-1} className="app-content"
        style={{ margin: 'var(--admin-inset)', overflowY: 'auto', overflowX: 'hidden', scrollbarGutter: 'stable', position: 'relative', zIndex: 1, flex: 1, minHeight: 0 }}>
        <Fade
          key={location.pathname}
          className="app-route"
          initialOpacity={0.9}
          style={{ minHeight: '100%', paddingBottom: isMobile ? 'calc(16px + env(safe-area-inset-bottom, 0px))' : 0 }}
        >
          {outlet}
          <footer className="admin-glass admin-footer">
            <span>{t.app.siteName}</span>
            <span>{t.login.brandSubtitle}</span>
          </footer>
        </Fade>
      </Content>

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

      <FormDialog open={changePassOpen} onCancel={() => guardedClose(changePassForm, () => setChangePassOpen(false), t)} onOk={() => changePassForm.submit()}
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
      </FormDialog>
    </Layout>
  );
}
