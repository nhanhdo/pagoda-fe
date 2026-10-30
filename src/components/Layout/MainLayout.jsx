import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout, Dropdown, Space, Typography, Modal, Form, Input,
  Descriptions, Tag, message, Select, Grid, Drawer,
  Badge, Popover, Button, Empty,
} from 'antd';
import {
  AppstoreFilled, TeamOutlined, CalendarFilled, CheckSquareFilled,
  BookFilled, HeartFilled, TrophyFilled, BankFilled, NotificationFilled,
  LogoutOutlined, UserOutlined, KeyOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  BellOutlined, SafetyCertificateFilled, GlobalOutlined,
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
      <div style={{ width: 320 }}>
        <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14, borderBottom: '1px solid #f0f0f0', color: '#333' }}>
          {t.layout.notifications}
        </div>
        <Empty description={t.layout.noNotifications} style={{ padding: '24px 0' }} />
      </div>
    );
  }

  const grouped = {
    pending_post: notifications.filter(n => n.type === 'pending_post'),
    overdue_task: notifications.filter(n => n.type === 'overdue_task'),
    today_duty:   notifications.filter(n => n.type === 'today_duty'),
    holiday:      notifications.filter(n => n.type === 'holiday'),
  };

  const groupMeta = {
    pending_post: { label: t.layout.pendingPostGroup,      color: '#d46b08' },
    overdue_task: { label: t.layout.overdueTasksGroup,     color: '#ff4d4f' },
    today_duty:   { label: t.layout.todayDutyGroup,        color: '#1890ff' },
    holiday:      { label: t.layout.upcomingHolidaysGroup, color: '#d48806' },
  };

  return (
    <div style={{ width: 320 }}>
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

/* ── Notification Bell ────────────────────────────────── */
function NotificationBell() {
  const [open, setOpen]                   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const { t } = useLanguage();
  const { isAdmin, hasRole } = useAuth();
  const navigate = useNavigate();
  const canApprove = isAdmin() || hasRole('truotri') || hasRole('thuki');
  // ref so handleOpenChange always has latest list (avoids stale closure)
  const notifsRef = React.useRef([]);

  useEffect(() => {
    const load = async () => {
      const items = [];
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

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
        const res = await api.get(`/duty-schedules?date=${todayStr}`);
        const duties = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        duties.forEach(d => items.push({
          id: `duty-${d.id}`,
          type: 'today_duty',
          icon: '📅',
          title: d.dutyType?.replace(/_/g, ' ') || t.layout.dutyFallback,
          subtitle: `${t.layout.shiftPrefix} ${d.shift || '—'} · ${d.personnel?.dharmName || d.personnel?.fullName || '—'}`,
          time: t.layout.today,
        }));
      } catch { /* silent */ }

      // 3. Buddhist holidays in next 7 days
      try {
        const holidays = getBuddhistHolidays(today.getFullYear());
        for (let i = 0; i <= 7; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() + i);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const h = holidays.get(key);
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
            subtitle: `${t.layout.postedBy}: ${post.author?.fullName || post.createdBy?.fullName || '—'}`,
            time: t.layout.pendingReview,
            link: '/app/news',
          }));
        } catch { /* silent */ }
      }

      // Only count items the user hasn't seen yet (persisted across page loads)
      const seenIds = new Set(JSON.parse(localStorage.getItem('notif_seen_ids') || '[]'));
      const newCount = items.filter(n => !seenIds.has(n.id)).length;

      notifsRef.current = items;
      setNotifications(items);
      setUnread(newCount);
    };
    load();
  }, [canApprove]);

  const handleOpenChange = (v) => {
    setOpen(v);
    if (v) {
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
      <Badge count={unread} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 18, color: '#5c3317' }} />}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }}
        />
      </Badge>
    </Popover>
  );
}

const SIDEBAR_BG = 'linear-gradient(180deg, #1a0800 0%, #3d1a06 30%, #6b2e10 65%, #8B4513 100%)';

/* ── Custom sidebar menu — replaces Ant Design <Menu> ── */
function SidebarMenu({ items, selectedKey, onSelect, collapsed }) {
  const [hovered, setHovered] = useState(null);
  return (
    <nav role="menu" style={{ padding: '8px 0', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
      {items.map((item, idx) => {
        if (item.type === 'divider') {
          return (
            <div key={`div-${idx}`} style={{
              height: 1, margin: '10px 18px',
              background: 'linear-gradient(90deg, transparent, rgba(255,195,95,.22), transparent)',
            }} />
          );
        }
        const sel = selectedKey === item.key;
        const hov = hovered === item.key;
        const isAdminItem = item.key === '/app/users';
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
              gap: collapsed ? 0 : 11,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '13px 0' : '10px 14px',
              margin: '2px 10px',
              borderRadius: 10,
              cursor: 'pointer',
              outline: 'none',
              overflow: 'hidden',
              background: sel
                ? 'linear-gradient(135deg, rgba(255,185,50,.30) 0%, rgba(160,60,0,.18) 100%)'
                : hov ? 'rgba(255,185,50,.09)' : 'transparent',
              boxShadow: sel
                ? 'inset 0 0 0 1px rgba(255,160,40,.22), 0 3px 10px rgba(100,30,0,.28)'
                : 'none',
              transition: 'background 0.17s ease, box-shadow 0.17s ease',
            }}
          >
            {/* animated left accent */}
            <div style={{
              position: 'absolute', left: 0,
              top: sel ? '14%' : '50%', bottom: sel ? '14%' : '50%',
              width: sel ? 3.5 : 0,
              borderRadius: '0 3px 3px 0',
              background: isAdminItem
                ? 'linear-gradient(180deg, #ffd700, #ffc44d)'
                : 'linear-gradient(180deg, #ffc44d, #c85000)',
              boxShadow: sel ? '0 0 10px rgba(255,196,77,.65)' : 'none',
              transition: 'top 0.22s ease, bottom 0.22s ease, width 0.15s ease',
            }} />

            {/* icon */}
            <span style={{
              fontSize: 16, lineHeight: 1, flexShrink: 0,
              color: sel
                ? isAdminItem ? '#ffd700' : '#ffd59e'
                : hov ? 'rgba(255,210,140,.9)' : 'rgba(255,175,85,.58)',
              filter: sel ? 'drop-shadow(0 0 5px rgba(255,190,70,.75))' : 'none',
              transition: 'color 0.17s, filter 0.17s',
            }}>
              {item.icon}
            </span>

            {/* label */}
            {!collapsed && (
              <span style={{
                fontSize: 13.5, flex: 1,
                fontWeight: sel ? 700 : 400,
                letterSpacing: sel ? 0.25 : 0.05,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                color: sel
                  ? isAdminItem ? '#ffd700' : '#ffd59e'
                  : hov ? 'rgba(255,225,175,.92)' : 'rgba(255,205,150,.58)',
                transition: 'color 0.17s',
              }}>
                {item.label}
              </span>
            )}

            {/* collapsed selected dot */}
            {sel && collapsed && (
              <span style={{
                position: 'absolute', bottom: 5,
                left: '50%', transform: 'translateX(-50%)',
                display: 'block', width: 4, height: 4,
                borderRadius: '50%', background: '#ffc44d',
                boxShadow: '0 0 6px rgba(255,196,77,.9)',
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, t } = useLanguage();

  const screens = useBreakpoint();
  const isMobile = screens.md === false;

  const PAGE_TITLES = {
    '/app/dashboard':          { label: t.layout.pageTitle.dashboard,        icon: '☸' },
    '/app/personnel':          { label: t.layout.pageTitle.personnel,         icon: '👥' },
    '/app/departments':        { label: t.layout.pageTitle.departments,       icon: '🏛' },
    '/app/duty-schedule':      { label: t.layout.pageTitle.dutySchedule,      icon: '📅' },
    '/app/work-assignment':    { label: t.layout.pageTitle.workAssignment,    icon: '✅' },
    '/app/training':           { label: t.layout.pageTitle.training,          icon: '📖' },
    '/app/buddhist-followers': { label: t.layout.pageTitle.buddhistFollowers, icon: '🙏' },
    '/app/reward-discipline':  { label: t.layout.pageTitle.rewardDiscipline,  icon: '🏆' },
    '/app/news':               { label: t.layout.pageTitle.news,              icon: '📰' },
    '/app/users':              { label: t.layout.pageTitle.users,             icon: '🔐' },
  };

  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

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
    { key: '/app/reward-discipline',  icon: <TrophyFilled />,         label: t.nav.rewardDiscipline },
    { key: '/app/news',               icon: <NotificationFilled />,   label: t.nav.news },
    ...(user?.role === 'admin' ? [
      { type: 'divider' },
      { key: '/app/users', icon: <SafetyCertificateFilled />, label: t.nav.users, style: { color: '#ffc44d' } },
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

  const handleMenuClick = ({ key }) => {
    navigate(key);
    if (isMobile) setCollapsed(true);
  };

  const handleLogoClick = () => {
    navigate('/app/dashboard');
    if (isMobile) setCollapsed(true);
  };

  const sidebarContent = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: -60, right: -60, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,81,0,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div
        style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: showFullLabel ? 'flex-start' : 'center', padding: showFullLabel ? '0 16px' : 0, borderBottom: '1px solid rgba(255,210,140,0.15)', cursor: 'pointer', gap: 10 }}
        onClick={handleLogoClick}
      >
        <LotusSVG size={showFullLabel ? 42 : 36} />
        {showFullLabel && (
          <div style={{ whiteSpace: 'nowrap' }}>
            <Text style={{ color: '#ffd59e', fontWeight: 800, fontSize: 13, letterSpacing: 0.3 }}>{t.app.title1} </Text>
            <Text style={{ color: '#ffedd5', fontWeight: 600, fontSize: 13, opacity: 0.9 }}>{t.app.title2}</Text>
          </div>
        )}
      </div>

      <SidebarMenu
        items={menuItems}
        selectedKey={location.pathname}
        onSelect={(key) => { navigate(key); if (isMobile) setCollapsed(true); }}
        collapsed={collapsed && !isMobile}
      />

      {showFullLabel && (
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
          <LotusSVG size={110} opacity={0.22} />
        </div>
      )}
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider trigger={null} collapsible collapsed={collapsed} width={240}
          style={{ background: SIDEBAR_BG, boxShadow: '3px 0 16px rgba(0,0,0,0.35)', position: 'relative', overflow: 'hidden' }}>
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

      <Layout>
        <Header style={{ background: '#fdf8f2', padding: '0 16px', height: 72, lineHeight: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(139,69,19,.15)', boxShadow: '0 1px 8px rgba(139,69,19,.06)', zIndex: 10, position: 'relative' }}>
          <div onClick={() => setCollapsed(!collapsed)} style={{ fontSize: 18, cursor: 'pointer', color: '#5c3317', padding: '0 8px' }}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>

          {currentPage && (
            <div style={{
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 8,
              pointerEvents: 'none', userSelect: 'none',
            }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{currentPage.icon}</span>
              <Text style={{ fontWeight: 700, fontSize: 15, color: '#5c3317', letterSpacing: 0.3 }}>
                {currentPage.label}
              </Text>
            </div>
          )}

          <Space size={8}>
            <Select
              value={lang}
              onChange={setLang}
              size="small"
              style={{ width: isMobile ? 90 : 120 }}
              suffixIcon={<GlobalOutlined style={{ color: '#888' }} />}
              options={[
                { value: 'vi', label: isMobile ? '🇻🇳 VI' : '🇻🇳 Tiếng Việt' },
                { value: 'en', label: isMobile ? '🇬🇧 EN' : '🇬🇧 English' },
              ]}
            />

            <NotificationBell />

            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <div className="avatar-placeholder">{initials}</div>
                {!isMobile && (
                  <div style={{ lineHeight: 1.3 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#333' }}>{displayName}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{t.roles[user?.role] || user?.role}</div>
                  </div>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: isMobile ? '8px' : '16px', overflow: 'auto', position: 'relative', zIndex: 1 }}>
          <Outlet />
        </Content>
      </Layout>

      <Modal open={profileOpen} onCancel={() => setProfileOpen(false)} footer={null}
        title={<span style={{ color: '#5c3317', fontWeight: 700 }}>{t.auth.profile}</span>} width={480}>
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
        okButtonProps={{ loading: changePassLoading, style: { background: '#8B4513', borderColor: '#8B4513' } }}
        title={<span style={{ color: '#5c3317', fontWeight: 700 }}>{t.auth.changePassword}</span>} width={400}>
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
