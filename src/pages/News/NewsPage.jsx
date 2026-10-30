import React, { useState, useEffect } from 'react';
import {
  Tabs, Tag, Button, Modal, Form, Input, Select, DatePicker,
  message, Popconfirm, Space, Spin, Upload, Switch, Typography, Avatar, Dropdown,
  Calendar, Badge,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, CalendarOutlined,
  ThunderboltOutlined, ReadOutlined, EnvironmentOutlined, ClockCircleOutlined,
  PushpinOutlined, UploadOutlined, EllipsisOutlined, SearchOutlined,
  StarFilled, BellFilled, CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import api from '../../api/axios';
import { useNewsPage, imgSrc } from './useNewsPage';
import { useLanguage } from '../../i18n/LanguageContext';
import { solarToLunar, getBuddhistHolidays } from '../../utils/lunarCalendar';
import './NewsPage.css';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const TYPE_CFG = {
  event:   { color: '#c0392b', bg: '#fff5f5', icon: <CalendarOutlined /> },
  news:    { color: '#0f6b5c', bg: '#f0faf8', icon: <ThunderboltOutlined /> },
  article: { color: '#8B4513', bg: '#fdf8f2', icon: <ReadOutlined /> },
};

/* avatar màu theo type */
const TYPE_AVATAR_BG = { event: '#c0392b', news: '#0f6b5c', article: '#8B4513' };

/* ─── Single Post Card (Facebook style) ─────────────────── */
function PostCard({ post, canEdit, onEdit, onDelete }) {
  const { t } = useLanguage();
  const cfg = TYPE_CFG[post.type] || TYPE_CFG.article;
  const typeLabel = { event: t.news.typeEvent, news: t.news.typeNews, article: t.news.typeArticle }[post.type] || t.news.typeArticle;
  const authorName = post.author?.dharmName || post.author?.fullName || post.userAuthor?.username || t.news.guestAuthor;
  const initial = authorName.charAt(authorName.length - 1).toUpperCase();
  const timeAgo = dayjs(post.createdAt).fromNow();

  const menuItems = [
    { key: 'edit',   label: <span><EditOutlined style={{ marginRight: 6 }} />{t.common.edit}</span>,   onClick: () => onEdit(post) },
    { key: 'delete', label: (
        <Popconfirm title={t.common.confirmDelete} onConfirm={() => onDelete(post.id)} okText={t.common.delete} cancelText={t.common.cancel}>
          <span style={{ color: '#f44336' }}><DeleteOutlined style={{ marginRight: 6 }} />{t.common.delete}</span>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div
      className="news-post-card"
      style={{ borderLeft: `3px solid ${cfg.color}` }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            size={42}
            style={{ background: TYPE_AVATAR_BG[post.type], fontWeight: 700, fontSize: 16, flexShrink: 0 }}
          >
            {initial}
          </Avatar>
          <div style={{ lineHeight: 1.35 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>{authorName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Text style={{ fontSize: 12, color: '#8a8a8a' }}>{timeAgo}</Text>
              <span style={{ color: '#ccc', fontSize: 10 }}>·</span>
              <Tag
                icon={cfg.icon}
                style={{
                  background: cfg.bg, color: cfg.color, border: 'none',
                  borderRadius: 20, fontSize: 11, padding: '0 8px', lineHeight: '20px',
                }}
              >
                {typeLabel}
              </Tag>
              {post.isPinned && (
                <Tag icon={<PushpinOutlined />} color="gold" style={{ fontSize: 11, borderRadius: 20, padding: '0 8px', lineHeight: '20px' }}>
                  {t.news.pinned}
                </Tag>
              )}
            </div>
          </div>
        </div>

        {canEdit && (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button
              type="text"
              icon={<EllipsisOutlined style={{ fontSize: 20 }} />}
              style={{ color: '#aaa', borderRadius: 50, width: 36, height: 36 }}
            />
          </Dropdown>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a', marginBottom: 6, lineHeight: 1.45 }}>
          {post.title}
        </div>

        {/* Event meta */}
        {post.type === 'event' && (post.eventDate || post.eventLocation) && (
          <div style={{
            background: '#fff5f5',
            border: '1px solid rgba(192,57,43,.15)',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 8,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
          }}>
            {post.eventDate && (
              <Text style={{ fontSize: 13, color: '#c0392b' }}>
                <CalendarOutlined style={{ marginRight: 5 }} />
                {dayjs(post.eventDate).format('dddd, DD/MM/YYYY')}
                {post.eventTime && <span style={{ marginLeft: 8 }}><ClockCircleOutlined style={{ marginRight: 4 }} />{post.eventTime}</span>}
              </Text>
            )}
            {post.eventLocation && (
              <Text style={{ fontSize: 13, color: '#c0392b' }}>
                <EnvironmentOutlined style={{ marginRight: 5 }} />{post.eventLocation}
              </Text>
            )}
          </div>
        )}

        {post.content && (
          <Paragraph
            ellipsis={{ rows: 4, expandable: true, symbol: t.news.readMore }}
            style={{ margin: 0, fontSize: 14, color: '#333', lineHeight: 1.65 }}
          >
            {post.content}
          </Paragraph>
        )}
      </div>

      {/* ── Ảnh full-width ── */}
      {post.coverImage && (
        <div style={{ borderTop: '1px solid #f5f5f5' }}>
          <img
            src={imgSrc(post.coverImage)}
            alt=""
            style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid #f5f5f5',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 12, color: '#bbb' }}>
          {dayjs(post.createdAt).format('DD/MM/YYYY · HH:mm')}
        </Text>
        <div style={{ fontSize: 12, color: cfg.color, display: 'flex', alignItems: 'center', gap: 5 }}>
          {cfg.icon} {typeLabel}
        </div>
      </div>
    </div>
  );
}

/* ─── Pending Post Card ──────────────────────────────────── */
function PendingPostCard({ post, onApprove, onReject }) {
  const { t } = useLanguage();
  const cfg = TYPE_CFG[post.type] || TYPE_CFG.article;
  const typeLabel = { event: t.news.typeEvent, news: t.news.typeNews, article: t.news.typeArticle }[post.type] || t.news.typeArticle;
  const authorName = post.author?.dharmName || post.author?.fullName || post.userAuthor?.username || t.news.defaultUser;
  const timeAgo = dayjs(post.createdAt).fromNow();

  return (
    <div style={{
      background: '#fffbf0',
      borderRadius: 12,
      border: '1px solid #ffe58f',
      marginBottom: 16,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={36} style={{ background: '#faad14', fontWeight: 700, fontSize: 14 }}>
            {authorName.charAt(authorName.length - 1).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{authorName}</div>
            <div style={{ fontSize: 11, color: '#8a8a8a' }}>{timeAgo}</div>
          </div>
        </div>
        <Tag icon={cfg.icon} style={{ background: cfg.bg, color: cfg.color, border: 'none', borderRadius: 20, fontSize: 11 }}>
          {typeLabel}
        </Tag>
      </div>
      <div style={{ padding: '10px 16px' }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{post.title}</div>
        {post.content && (
          <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: t.news.readMore }}
            style={{ margin: 0, fontSize: 13, color: '#555' }}>
            {post.content}
          </Paragraph>
        )}
      </div>
      <div style={{ padding: '8px 16px 12px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Popconfirm title={t.news.rejectConfirm} onConfirm={() => onReject(post.id)} okText={t.news.reject} cancelText={t.common.cancel} okButtonProps={{ danger: true }}>
          <Button icon={<CloseCircleOutlined />} danger size="small">{t.news.reject}</Button>
        </Popconfirm>
        <Popconfirm title={t.news.approveConfirm} onConfirm={() => onApprove(post.id)} okText={t.news.approve} cancelText={t.common.cancel}>
          <Button icon={<CheckCircleOutlined />} type="primary" size="small"
            style={{ background: '#52c41a', borderColor: '#52c41a' }}>
            {t.news.approvePublish}
          </Button>
        </Popconfirm>
      </div>
    </div>
  );
}

/* ─── Post Form Modal ────────────────────────────────────── */
function PostFormModal({ open, onClose, editRecord, type: defaultType, onSaved, canEdit }) {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState([]);
  const currentType = Form.useWatch('type', form);

  useEffect(() => {
    if (open) {
      if (editRecord) {
        form.setFieldsValue({ ...editRecord, eventDate: editRecord.eventDate ? dayjs(editRecord.eventDate) : undefined });
      } else {
        form.resetFields();
        form.setFieldsValue({ type: defaultType, isPublished: true });
      }
      setFileList([]);
    }
  }, [open, editRecord, defaultType, form]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (v !== undefined && v !== null)
          fd.append(k, k === 'eventDate' ? v.format('YYYY-MM-DD') : v);
      });
      if (fileList[0]?.originFileObj) fd.append('coverImage', fileList[0].originFileObj);

      if (editRecord) {
        await api.put(`/posts/${editRecord.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        message.success(t.news.updateSuccess);
      } else {
        const res = await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data?.isPending) {
          message.info(t.news.pendingInfo);
        } else {
          message.success(t.news.postSuccess);
        }
      }
      onSaved(); onClose();
    } catch (err) {
      message.error(err.response?.data?.message || t.common.error);
    } finally { setSubmitting(false); }
  };

  return (
    <Modal
      title={<span style={{ fontWeight: 700, fontSize: 16 }}>{editRecord ? t.news.title : t.news.addNew}</span>}
      open={open} onCancel={onClose} onOk={() => form.submit()}
      okText={editRecord ? t.common.update : t.news.addNew}
      cancelText={t.common.cancel}
      okButtonProps={{ loading: submitting, style: { background: '#8B4513', borderColor: '#8B4513' } }}
      width={680} destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <Form.Item name="type" label={t.news.formTypeLabel} rules={[{ required: true }]} style={{ flex: 1, marginBottom: 12 }}>
            <Select size="large">
              <Select.Option value="event">📅  {t.news.typeEvent}</Select.Option>
              <Select.Option value="news">⚡  {t.news.typeNews}</Select.Option>
              <Select.Option value="article">📖  {t.news.typeArticle}</Select.Option>
            </Select>
          </Form.Item>
          {canEdit && (
            <>
              <Form.Item name="isPinned" label={t.news.pinned} valuePropName="checked" style={{ marginBottom: 12 }}>
                <Switch />
              </Form.Item>
              <Form.Item name="isPublished" label={t.news.formPublishLabel} valuePropName="checked" style={{ marginBottom: 12 }}>
                <Switch defaultChecked />
              </Form.Item>
            </>
          )}
        </div>

        <Form.Item name="title" label={t.news.colTitle} rules={[{ required: true, message: t.news.formTitleRequired }]}>
          <Input size="large" placeholder={t.news.formTitlePlaceholder} />
        </Form.Item>

        <Form.Item name="content" label={t.news.formContentLabel}>
          <TextArea autoSize={{ minRows: 4, maxRows: 10 }} placeholder={t.news.formContentPlaceholder} />
        </Form.Item>

        {currentType === 'event' && (
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="eventDate" label={t.news.formDateLabel} style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="eventTime" label={t.news.formTimeLabel} style={{ width: 110 }}>
              <Input placeholder="08:00" />
            </Form.Item>
            <Form.Item name="eventLocation" label={t.news.formLocationLabel} style={{ flex: 2 }}>
              <Input />
            </Form.Item>
          </div>
        )}

        <Form.Item label={t.news.formImageLabel}>
          <Upload
            listType="picture-card" maxCount={1}
            fileList={fileList}
            onChange={({ fileList: fl }) => setFileList(fl)}
            beforeUpload={() => false}
          >
            {fileList.length === 0 && <div><UploadOutlined /><div style={{ marginTop: 6, fontSize: 12 }}>{t.news.formAddImage}</div></div>}
          </Upload>
          {editRecord?.coverImage && fileList.length === 0 && (
            <img src={imgSrc(editRecord.coverImage)} alt="" style={{ width: 100, borderRadius: 8, marginTop: 4 }} />
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
}

/* ─── Feed Tab Content ────────────────────────────────────── */
function FeedTab({ posts, loading, canEdit, onEdit, onDelete, emptyIcon, emptyText }) {
  if (loading) return <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>;
  if (posts.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb' }}>
      <div style={{ fontSize: 14 }}>{emptyText}</div>
    </div>
  );
  return (
    <div>
      {posts.map(p => (
        <PostCard key={p.id} post={p} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

/* ─── Event Calendar ─────────────────────────────────────── */
function EventCalendarView({ events }) {
  const { t } = useLanguage();
  const [calYear, setCalYear] = React.useState(dayjs().year());

  const byDate = {};
  events.forEach(e => {
    if (e.eventDate) {
      const key = dayjs(e.eventDate).format('YYYY-MM-DD');
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(e);
    }
  });

  const holidays = React.useMemo(() => getBuddhistHolidays(calYear), [calYear]);

  const cellRender = (date, info) => {
    if (info.type !== 'date') return info.originNode;
    const key = date.format('YYYY-MM-DD');
    const evs = byDate[key] || [];
    const lunar = solarToLunar(date.date(), date.month() + 1, date.year());
    const holiday = holidays.get(key);
    const isRam = lunar.day === 15;
    const isMung1 = lunar.day === 1;
    const isToday = date.isSame(dayjs(), 'day');

    return (
      <div style={{ minHeight: 0 }}>
        {isToday && <span className="today-chip">{t.news.today}</span>}
        {/* Lunar date */}
        <div style={{
          fontSize: 10,
          color: isRam || isMung1 ? '#e85d04' : '#888',
          fontWeight: isRam || isMung1 ? 700 : 500,
          lineHeight: 1.2,
          marginBottom: 2,
        }}>
          {lunar.day}/{lunar.month}
        </div>

        {/* Buddhist holiday */}
        {holiday && (
          <div style={{
            fontSize: 10,
            color: holiday.major ? '#cf1322' : '#389e0d',
            fontWeight: 600,
            lineHeight: 1.3,
            marginBottom: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            overflow: 'hidden',
          }}>
            {holiday.major
              ? <StarFilled style={{ fontSize: 9, color: '#cf1322', flexShrink: 0 }} />
              : <BellFilled  style={{ fontSize: 9, color: '#389e0d', flexShrink: 0 }} />
            }
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {holiday.names[0]}
              {holiday.names.length > 1 && ` +${holiday.names.length - 1}`}
            </span>
          </div>
        )}

        {/* Events */}
        {evs.slice(0, 2).map(e => (
          <div key={e.id} style={{
            fontSize: 10,
            color: '#1890ff',
            fontWeight: 600,
            background: '#e6f4ff',
            borderRadius: 3,
            padding: '1px 4px',
            marginBottom: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            overflow: 'hidden',
          }}>
            <CalendarOutlined style={{ fontSize: 9, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
          </div>
        ))}
        {evs.length > 2 && <div style={{ fontSize: 10, color: '#aaa' }}>+{evs.length - 2}</div>}
      </div>
    );
  };

  const monthCellRender = (date, info) => {
    if (info.type !== 'month') return info.originNode;
    const m = date.month() + 1;
    const y = date.year();
    const count = events.filter(e => e.eventDate && dayjs(e.eventDate).month() + 1 === m && dayjs(e.eventDate).year() === y).length;
    if (!count) return null;
    return <Badge count={count} color="#e85d04" />;
  };

  return (
    <div className="news-calendar-wrap" style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
      {/* Legend */}
      <div style={{ padding: '12px 20px 0', display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#e85d04', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e85d04', display: 'inline-block' }} />
          {t.news.calendarLunar}
        </span>
        <span style={{ fontSize: 11, color: '#cf1322', display: 'flex', alignItems: 'center', gap: 4 }}>
          <StarFilled style={{ fontSize: 10, color: '#cf1322' }} />
          {t.news.calendarMajorHoliday}
        </span>
        <span style={{ fontSize: 11, color: '#389e0d', display: 'flex', alignItems: 'center', gap: 4 }}>
          <BellFilled style={{ fontSize: 10, color: '#389e0d' }} />
          {t.news.calendarHoliday}
        </span>
        <span style={{ fontSize: 11, color: '#1890ff', display: 'flex', alignItems: 'center', gap: 4 }}>
          <CalendarOutlined style={{ fontSize: 10, color: '#1890ff' }} />
          {t.news.calendarTempleEvent}
        </span>
      </div>
      <Calendar
        cellRender={(date, info) => info.type === 'date' ? cellRender(date, info) : monthCellRender(date, info)}
        onPanelChange={(val) => setCalYear(val.year())}
      />
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function NewsPage() {
  const { t } = useLanguage();
  const {
    posts, pendingPosts, loading, activeTab, setActiveTab,
    modalOpen, setModalOpen,
    editRecord, canEdit, canPost, canApprove,
    fetchAll, openCreate, openEdit, handleDelete,
    handleApprove, handleReject,
  } = useNewsPage();

  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const getDisplayPosts = (type) => {
    let arr = posts[type] || [];
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      arr = arr.filter(p => p.title?.toLowerCase().includes(q) || p.content?.toLowerCase().includes(q));
    }
    if (activeFilter === 'pinned') arr = arr.filter(p => p.isPinned);
    if (activeFilter === 'month') arr = arr.filter(p => dayjs(p.createdAt).isSame(dayjs(), 'month'));
    return arr;
  };

  const FILTERS = [
    { key: 'all',    label: t.common.all },
    { key: 'pinned', label: t.news.filterPinned },
    { key: 'month',  label: t.news.filterThisMonth },
  ];

  const cnt = (key) => posts[key].length;
  const badge = (n, color) => n > 0
    ? <span style={{ marginLeft: 7, background: color, color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{n}</span>
    : null;

  const tabItems = [
    {
      key: 'article',
      label: <span><ReadOutlined style={{ marginRight: 5 }} />{t.news.tabFeed}{badge(cnt('article'), '#8B4513')}</span>,
      children: <FeedTab posts={getDisplayPosts('article')} loading={loading} canEdit={canEdit} onEdit={openEdit} onDelete={handleDelete} emptyIcon="📖" emptyText={t.news.emptyArticle} />,
    },
    {
      key: 'news',
      label: <span><ThunderboltOutlined style={{ marginRight: 5 }} />{t.news.typeNews}{badge(cnt('news'), '#0f6b5c')}</span>,
      children: <FeedTab posts={getDisplayPosts('news')} loading={loading} canEdit={canEdit} onEdit={openEdit} onDelete={handleDelete} emptyIcon="⚡" emptyText={t.news.emptyNews} />,
    },
    {
      key: 'event',
      label: <span><CalendarOutlined style={{ marginRight: 5 }} />{t.news.tabEvents}{badge(cnt('event'), '#c0392b')}</span>,
      children: <FeedTab posts={getDisplayPosts('event')} loading={loading} canEdit={canEdit} onEdit={openEdit} onDelete={handleDelete} emptyIcon="📅" emptyText={t.news.emptyEvents} />,
    },
    {
      key: 'calendar',
      label: <span>🗓️ {t.news.tabCalendar}</span>,
      children: <EventCalendarView events={posts.event} />,
    },
    ...(canApprove ? [{
      key: 'pending',
      label: (
        <span>
          <ClockCircleOutlined style={{ marginRight: 5, color: '#faad14' }} />
          {t.news.tabPending}
          {pendingPosts.length > 0 && (
            <span style={{ marginLeft: 7, background: '#faad14', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
              {pendingPosts.length}
            </span>
          )}
        </span>
      ),
      children: (
        <div>
          {pendingPosts.length === 0
            ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb', fontSize: 14 }}>{t.news.emptyPending}</div>
            : pendingPosts.map(p => (
                <PendingPostCard key={p.id} post={p} onApprove={handleApprove} onReject={handleReject} />
              ))
          }
        </div>
      ),
    }] : []),
  ];

  const upcomingEvents = posts.event
    .filter(p => p.eventDate && !dayjs(p.eventDate).isBefore(dayjs(), 'day'))
    .slice(0, 4);

  const pinnedPosts = [...posts.event, ...posts.news, ...posts.article]
    .filter(p => p.isPinned)
    .slice(0, 3);

  const typeLabels = { event: t.news.typeEvent, news: t.news.typeNews, article: t.news.typeArticle };

  return (
    <div>
      {/* ── Banner ── */}
      <div className="news-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(255,196,77,.18)', border: '1.5px solid rgba(255,196,77,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            fontSize: 28,
          }}>
            ☸
          </div>
          <div>
            <div style={{ color: '#ffd59e', fontWeight: 800, fontSize: 20, letterSpacing: 0.3 }}>{t.news.title}</div>
            <div style={{ color: 'rgba(255,210,160,.6)', fontSize: 12, marginTop: 3 }}>
              {t.news.bannerSubtitle}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {[
                { label: `${cnt('event')} ${t.news.typeEvent}`, color: 'rgba(255,100,80,.9)' },
                { label: `${cnt('news')} ${t.news.typeNews}`, color: 'rgba(80,220,190,.9)' },
                { label: `${cnt('article')} ${t.news.typeArticle}`, color: 'rgba(255,196,77,.9)' },
              ].map(s => (
                <span key={s.label} style={{
                  fontSize: 11, fontWeight: 600, color: s.color,
                  background: 'rgba(255,255,255,.1)', borderRadius: 20,
                  padding: '2px 10px', border: '1px solid rgba(255,255,255,.12)',
                }}>
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>
        {canPost && (
          <Button
            icon={<PlusOutlined />} onClick={openCreate}
            style={{
              background: '#ffc44d', borderColor: '#e09000', color: '#3d1a06',
              fontWeight: 700, height: 40, borderRadius: 10, fontSize: 14,
              boxShadow: '0 4px 14px rgba(255,180,40,.35)',
              position: 'relative', zIndex: 1,
            }}
          >
            {t.news.addNew}
          </Button>
        )}
      </div>

      {/* ── 2 cột: Feed + Sidebar ── */}
      <div className="news-layout">

        {/* ── CỘT TRÁI: Feed ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 10px rgba(0,0,0,.05)',
            border: '1px solid #f0e8df',
            overflow: 'hidden',
            padding: '0 20px 20px',
          }}>
            {/* Search + Filter */}
            <div style={{ padding: '12px 0 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Input
                prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                placeholder={t.news.searchPlaceholder}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
                style={{ borderRadius: 8 }}
              />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {FILTERS.map(f => (
                  <Tag
                    key={f.key}
                    style={{
                      cursor: 'pointer', borderRadius: 20, padding: '3px 14px',
                      fontSize: 12, userSelect: 'none',
                      background: activeFilter === f.key ? '#8B4513' : '#f5f5f5',
                      color: activeFilter === f.key ? '#fff' : '#555',
                      border: activeFilter === f.key ? '1px solid #8B4513' : '1px solid #e8e8e8',
                      transition: 'all 0.15s',
                    }}
                    onClick={() => setActiveFilter(f.key)}
                  >
                    {f.label}
                  </Tag>
                ))}
              </div>
            </div>

            <Tabs
              className="news-feed-tabs"
              activeKey={activeTab}
              onChange={key => { setActiveTab(key); setSearchText(''); setActiveFilter('all'); }}
              items={tabItems}
              tabBarStyle={{ borderBottom: '1px solid #f0e8df', marginBottom: 16 }}
              tabBarGutter={22}
            />
          </div>
        </div>

        {/* ── CỘT PHẢI: Sidebar ── */}
        <div className="news-sidebar">

          {/* Thống kê nhanh */}
          <div className="news-widget">
            <div className="news-widget-header">
              <span style={{ fontSize: 15 }}>☸</span> {t.news.sidebarOverview}
            </div>
            <div style={{ padding: '8px 0 12px' }}>
              {[
                { icon: <CalendarOutlined />, label: t.news.typeEvent,   count: cnt('event'),   color: '#c0392b', bg: '#fff0ef' },
                { icon: <ThunderboltOutlined />, label: t.news.typeNews, count: cnt('news'), color: '#0f6b5c', bg: '#edfaf6' },
                { icon: <ReadOutlined />,       label: t.news.typeArticle,  count: cnt('article'), color: '#8B4513', bg: '#fdf8f2' },
              ].map(s => (
                <div key={s.label} className="news-stat-row" style={{ background: s.bg }}>
                  <span style={{ color: s.color, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                    {s.icon} {s.label}
                  </span>
                  <span style={{ fontWeight: 800, fontSize: 20, color: s.color, lineHeight: 1 }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sự kiện sắp tới */}
          {upcomingEvents.length > 0 && (
            <div className="news-widget">
              <div className="news-widget-header">
                <CalendarOutlined style={{ color: '#c0392b' }} /> {t.news.sidebarUpcoming}
              </div>
              <div style={{ padding: '8px 0' }}>
                {upcomingEvents.map(ev => (
                  <div key={ev.id} style={{ padding: '10px 16px', borderBottom: '1px solid #fafafa', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      minWidth: 42, textAlign: 'center', background: '#fff0ef',
                      borderRadius: 8, padding: '4px 0', flexShrink: 0,
                      border: '1px solid rgba(192,57,43,.15)',
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#c0392b', lineHeight: 1 }}>{dayjs(ev.eventDate).format('DD')}</div>
                      <div style={{ fontSize: 10, color: '#c0392b', textTransform: 'uppercase' }}>{dayjs(ev.eventDate).format('MMM')}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                      {ev.eventLocation && <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}><EnvironmentOutlined style={{ marginRight: 3 }} />{ev.eventLocation}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bài ghim */}
          {pinnedPosts.length > 0 && (
            <div className="news-widget">
              <div className="news-widget-header">
                <PushpinOutlined style={{ color: '#d48806' }} /> {t.news.sidebarPinned}
              </div>
              <div style={{ padding: '8px 0' }}>
                {pinnedPosts.map(p => {
                  const cfg = TYPE_CFG[p.type];
                  return (
                    <div key={p.id} style={{ padding: '10px 16px', borderBottom: '1px solid #fafafa', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, marginTop: 6, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: cfg.color, marginTop: 2 }}>{typeLabels[p.type]}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nút tạo nhanh */}
          {canPost && (
            <div style={{ background: 'linear-gradient(135deg,#3d1a06,#8B4513)', borderRadius: 12, padding: '20px 16px', textAlign: 'center', boxShadow: '0 4px 16px rgba(93,46,0,0.2)' }}>
              <div style={{ color: '#ffd59e', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t.news.addNew}</div>
              <div style={{ color: 'rgba(255,210,160,0.6)', fontSize: 12, marginBottom: 14 }}>
                {canEdit ? t.news.shareDescription : t.news.pendingDescription}
              </div>
              <Button block icon={<PlusOutlined />} onClick={openCreate}
                style={{ background: '#ffc44d', borderColor: '#ffa500', color: '#3d1a06', fontWeight: 700, borderRadius: 8 }}>
                {t.news.addNew}
              </Button>
            </div>
          )}
        </div>
      </div>

      <PostFormModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        editRecord={editRecord} type={activeTab} onSaved={fetchAll}
        canEdit={canEdit}
      />
    </div>
  );
}
