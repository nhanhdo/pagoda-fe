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
  CommentOutlined, SendOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import api from '../../api/axios';
import { useNewsPage, imgSrc } from './useNewsPage';
import { useLanguage } from '../../i18n/LanguageContext';
import { solarToLunar, getBuddhistHolidays, getSolarTerm, getHoangDaoHours, getTruc } from '../../utils/lunarCalendar';
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

/* ─── Comment Section ────────────────────────────────────── */
function CommentSection({ postId, onCountChange }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loadingCmt, setLoadingCmt] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateComments = (list) => {
    setComments(list);
    onCountChange?.(list.length);
  };

  useEffect(() => {
    setLoadingCmt(true);
    api.get(`/posts/${postId}/comments`)
      .then(r => updateComments(r.data))
      .catch(() => {})
      .finally(() => setLoadingCmt(false));
  }, [postId]);

  const handleSend = async () => {
    if (!inputVal.trim()) return;
    setSubmitting(true);
    try {
      const r = await api.post(`/posts/${postId}/comments`, { content: inputVal.trim() });
      updateComments([...comments, r.data]);
      setInputVal('');
    } catch {
      message.error('Không thể gửi bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/posts/${postId}/comments/${commentId}`);
      updateComments(comments.filter(c => c.id !== commentId));
    } catch {
      message.error('Không thể xóa bình luận');
    }
  };

  return (
    <div className="comment-section">
      {loadingCmt ? (
        <div style={{ padding: '8px 0', color: '#bbb', fontSize: 12 }}>Đang tải...</div>
      ) : (
        <div>
          {comments.length === 0 && (
            <div style={{ color: '#bbb', fontSize: 12, padding: '8px 0', fontStyle: 'italic' }}>Chưa có bình luận nào.</div>
          )}
          {comments.map(c => {
            const name = c.commentAuthor?.dharmName || c.commentAuthor?.fullName || c.commentUser?.username || 'Ẩn danh';
            const initial = name.charAt(name.length - 1).toUpperCase();
            const canDel = user?.id === c.userId || ['admin', 'truotri'].includes(user?.role);
            return (
              <div key={c.id} className="comment-item">
                <Avatar size={30} style={{ background: '#8B4513', fontSize: 12, flexShrink: 0, fontWeight: 700 }}>{initial}</Avatar>
                <div style={{ flex: 1, background: '#fdf8f2', borderRadius: 8, padding: '6px 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: '#5c3317' }}>{name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#bbb' }}>{dayjs(c.createdAt).fromNow()}</span>
                      {canDel && (
                        <Popconfirm title="Xóa bình luận này?" onConfirm={() => handleDelete(c.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
                          <Button type="text" size="small" danger icon={<DeleteOutlined style={{ fontSize: 11 }} />} style={{ padding: '0 4px', height: 20 }} />
                        </Popconfirm>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#333', marginTop: 2, lineHeight: 1.5 }}>{c.content}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Input */}
      <div className="comment-input-row">
        <Avatar size={30} style={{ background: '#8B4513', fontSize: 12, flexShrink: 0, fontWeight: 700 }}>
          {(user?.personnel?.dharmName || user?.personnel?.fullName || user?.username || 'U').slice(-1).toUpperCase()}
        </Avatar>
        <Input.TextArea
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          placeholder="Viết bình luận..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
          style={{ borderRadius: 20, resize: 'none', fontSize: 13 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={submitting}
          disabled={!inputVal.trim()}
          onClick={handleSend}
          style={{ background: '#8B4513', borderColor: '#8B4513', borderRadius: 20, flexShrink: 0 }}
        />
      </div>
    </div>
  );
}

/* ─── Single Post Card (Facebook style) ─────────────────── */
function PostCard({ post, canEdit, onEdit, onDelete }) {
  const { t } = useLanguage();
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
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
    <div className="news-post-card" style={{ borderTop: `3px solid ${cfg.color}` }}>

      {/* ── Cover image (top banner) ── */}
      {post.coverImage && (
        <div style={{ overflow: 'hidden', maxHeight: 280, borderRadius: '12px 12px 0 0' }}>
          <img
            src={imgSrc(post.coverImage)}
            alt=""
            style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block', transition: 'transform .3s ease' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={40} style={{ background: TYPE_AVATAR_BG[post.type], fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
            {initial}
          </Avatar>
          <div style={{ lineHeight: 1.35 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>{authorName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 12, color: '#aaa' }}>{timeAgo}</Text>
              <Tag icon={cfg.icon} style={{ background: cfg.bg, color: cfg.color, border: 'none', borderRadius: 20, fontSize: 11, padding: '0 8px', lineHeight: '20px' }}>
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
            <Button type="text" icon={<EllipsisOutlined style={{ fontSize: 20 }} />} style={{ color: '#ccc', borderRadius: 50, width: 36, height: 36 }} />
          </Dropdown>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '10px 16px 14px' }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a1a', marginBottom: 8, lineHeight: 1.5, letterSpacing: 0.1 }}>
          {post.title}
        </div>

        {post.type === 'event' && (post.eventDate || post.eventLocation) && (
          <div style={{ background: '#fff5f5', border: '1px solid rgba(192,57,43,.12)', borderRadius: 8, padding: '7px 12px', marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {post.eventDate && (
              <Text style={{ fontSize: 13, color: '#c0392b' }}>
                <CalendarOutlined style={{ marginRight: 5 }} />
                {dayjs(post.eventDate).format('dddd, DD/MM/YYYY')}
                {post.eventTime && <span style={{ marginLeft: 8 }}><ClockCircleOutlined style={{ marginRight: 4 }} />{post.eventTime}</span>}
              </Text>
            )}
            {post.eventLocation && (
              <Text style={{ fontSize: 13, color: '#c0392b' }}><EnvironmentOutlined style={{ marginRight: 5 }} />{post.eventLocation}</Text>
            )}
          </div>
        )}

        {post.content && (
          <Paragraph
            ellipsis={{ rows: 3, expandable: true, symbol: t.news.readMore }}
            style={{ margin: 0, fontSize: 14, color: '#555', lineHeight: 1.7, wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}
          >
            {post.content}
          </Paragraph>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '8px 16px 10px', borderTop: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#ccc' }}>
          {dayjs(post.createdAt).format('DD/MM/YYYY · HH:mm')}
        </Text>
        <Button
          type="text"
          size="small"
          icon={<CommentOutlined />}
          onClick={() => setShowComments(v => !v)}
          style={{
            fontSize: 12,
            color: showComments ? '#8B4513' : '#aaa',
            fontWeight: showComments ? 700 : 400,
            background: showComments ? '#fdf3ec' : 'transparent',
            borderRadius: 20,
            padding: '0 10px',
          }}
        >
          {t.news.comment}
          {commentCount > 0 && (
            <span style={{
              marginLeft: 5, background: showComments ? '#8B4513' : '#e0d5cc',
              color: showComments ? '#fff' : '#888',
              borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 700,
            }}>
              {commentCount}
            </span>
          )}
        </Button>
      </div>

      {/* ── Comments ── */}
      {showComments && <CommentSection postId={post.id} onCountChange={setCommentCount} />}
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
function PostFormModal({ open, onClose, editRecord, type: defaultType, onSaved, canEdit, prefillDate }) {
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
        form.setFieldsValue({
          type: prefillDate ? 'event' : defaultType,
          isPublished: true,
          ...(prefillDate ? { eventDate: prefillDate } : {}),
        });
      }
      setFileList([]);
    }
  }, [open, editRecord, defaultType, prefillDate, form]);

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

/* ─── Van Nien Calendar ──────────────────────────────────── */
function EventCalendarView({ events, canEdit, onDblClickDate }) {
  const [calYear, setCalYear] = React.useState(dayjs().year());
  const [selectedDate, setSelectedDate] = React.useState(dayjs());

  const byDate = {};
  events.forEach(e => {
    if (e.eventDate) {
      const key = dayjs(e.eventDate).format('YYYY-MM-DD');
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(e);
    }
  });

  const holidays = React.useMemo(() => getBuddhistHolidays(calYear), [calYear]);

  const sel      = selectedDate;
  const selLunar = solarToLunar(sel.date(), sel.month() + 1, sel.year());
  const selKey   = sel.format('YYYY-MM-DD');
  const selHoliday = holidays.get(selKey);
  const selEvents  = byDate[selKey] || [];
  const selTiKhi   = getSolarTerm(sel.date(), sel.month() + 1, sel.year());
  const selChiIdx  = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'].indexOf(selLunar.dayChi);
  const selHDHours = getHoangDaoHours(selChiIdx);
  const selTruc    = getTruc(selLunar.day, selLunar.month, selLunar.year);

  const cellRender = (date, info) => {
    if (info.type !== 'date') return info.originNode;
    const key    = date.format('YYYY-MM-DD');
    const evs    = byDate[key] || [];
    const lunar  = solarToLunar(date.date(), date.month() + 1, date.year());
    const holiday = holidays.get(key);
    const isRam   = lunar.day === 15;
    const isMung1 = lunar.day === 1;
    const truc    = getTruc(lunar.day, lunar.month, lunar.year);
    const dotColor = isRam || isMung1 ? '#c0392b' : truc.hoangDao ? '#e67e22' : '#bbb';
    const lunarColor = isRam || isMung1 ? '#c0392b' : '#555';

    return (
      <div
        style={{ minHeight: 0, paddingTop: 1, position: 'relative', height: '100%' }}
        onDoubleClick={canEdit ? (e) => { e.stopPropagation(); onDblClickDate(date); } : undefined}
        title={canEdit ? 'Double-click để thêm sự kiện' : undefined}
      >
        <span style={{ position: 'absolute', top: 1, right: 2, width: 6, height: 6, borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
        <div style={{ fontSize: 10, color: lunarColor, fontWeight: isRam || isMung1 ? 700 : 400, lineHeight: 1.3, paddingRight: 8 }}>
          {lunar.day}/{lunar.month}{lunar.leap ? '*' : ''}
        </div>
        {holiday && (
          <div style={{ fontSize: 9, color: holiday.major ? '#cf1322' : '#389e0d', fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {holiday.major ? '★' : '▲'} {holiday.names[0]}
          </div>
        )}
        {evs.slice(0, 1).map(e => (
          <div key={e.id} style={{ fontSize: 9, color: '#1890ff', background: '#e6f4ff', borderRadius: 2, padding: '0 3px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {e.title}
          </div>
        ))}
        {evs.length > 1 && <div style={{ fontSize: 9, color: '#aaa' }}>+{evs.length - 1}</div>}
        {canEdit && (
          <div className="cal-add-hint">+</div>
        )}
      </div>
    );
  };

  const DOT = (color) => <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 5, verticalAlign: 'middle' }} />;

  return (
    <div className="news-cal-layout" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

      {/* ── Left: Info Panel ── */}
      <div className="news-cal-sidebar" style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Solar + Lunar date card */}
        <div style={{ background: 'linear-gradient(160deg, #6b0f00 0%, #c0392b 100%)', borderRadius: 14, padding: '18px 16px', color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: 1.2, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>
            {sel.format('dddd')}
          </div>
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, letterSpacing: -3 }}>
            {sel.format('DD')}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
            Tháng {sel.format('MM')} năm {sel.format('YYYY')}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.25)', marginTop: 12, paddingTop: 10 }}>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>Âm lịch</div>
            <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>
              {selLunar.day < 10 ? `0${selLunar.day}` : selLunar.day}
              <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.8 }}> / {selLunar.month}{selLunar.leap ? ' ★' : ''}</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 3 }}>Năm {selLunar.yearName}</div>
          </div>
        </div>

        {/* Can-Chi details */}
        <div style={{ background: '#fffdf9', border: '1px solid #f0e8df', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Tháng', value: selLunar.monthCanChi },
            { label: 'Ngày',  value: selLunar.dayCanChi },
            { label: 'Tiết',  value: selTiKhi },
            { label: 'Trực',  value: selTruc.name, color: selTruc.hoangDao ? '#e67e22' : '#888',
              badge: selTruc.hoangDao ? { text: 'Hoàng đạo', bg: '#fff7e6', color: '#d46b08' } : { text: 'Hắc đạo', bg: '#f5f5f5', color: '#888' }
            },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#aaa' }}>{r.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: r.color || '#5c3317' }}>{r.value}</span>
            </div>
          ))}
        </div>

        {/* Giờ Hoàng Đạo */}
        <div style={{ background: '#fffaf4', border: '1px solid #f5e6cc', borderRadius: 12, padding: '10px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e67e22', marginBottom: 8 }}>☀ Giờ Hoàng Đạo</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {selHDHours.map(h => (
              <div key={h.chi} style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#d46b08', fontWeight: 600, textAlign: 'center' }}>
                <div>{h.chi}</div>
                <div style={{ fontSize: 10, color: '#aaa', fontWeight: 400 }}>{h.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Holidays / Events for selected day */}
        {(selHoliday || selEvents.length > 0) && (
          <div style={{ background: '#fff', border: '1px solid #f0e8df', borderRadius: 12, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8B4513', marginBottom: 2 }}>📅 Ngày này có</div>
            {selHoliday?.names.map((n, i) => (
              <div key={i} style={{ fontSize: 12, color: selHoliday.major ? '#cf1322' : '#389e0d', fontWeight: 600 }}>
                {selHoliday.major ? '★' : '▲'} {n}
              </div>
            ))}
            {selEvents.map(e => (
              <div key={e.id} style={{ fontSize: 12, color: '#1890ff', fontWeight: 600 }}>
                <CalendarOutlined style={{ marginRight: 4 }} />{e.title}
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#bbb', marginBottom: 2, letterSpacing: 0.5 }}>CHÚ THÍCH</div>
          {[
            { dot: '#e67e22', label: 'Ngày hoàng đạo' },
            { dot: '#bbb',    label: 'Ngày hắc đạo' },
            { dot: '#c0392b', label: 'Rằm / Mùng 1' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
              {DOT(l.dot)}<span style={{ color: '#555' }}>{l.label}</span>
            </div>
          ))}
          <div style={{ fontSize: 12, color: '#cf1322' }}>★ Đại lễ Phật giáo</div>
          <div style={{ fontSize: 12, color: '#389e0d' }}>▲ Ngày lễ thường</div>
          <div style={{ fontSize: 12, color: '#1890ff' }}><CalendarOutlined /> Sự kiện chùa</div>
        </div>
      </div>

      {/* ── Right: Calendar grid ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="news-calendar-wrap" style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0e8df', overflow: 'hidden' }}>
          <Calendar
            value={selectedDate}
            cellRender={(date, info) => info.type === 'date' ? cellRender(date, info) : null}
            onPanelChange={(val) => { setCalYear(val.year()); }}
            onSelect={(date) => setSelectedDate(dayjs(date.valueOf()))}
          />
        </div>
      </div>

    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function NewsPage() {
  const { t } = useLanguage();
  const [calPrefillDate, setCalPrefillDate] = useState(null);
  const [calModalOpen, setCalModalOpen] = useState(false);
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
      children: <EventCalendarView
        events={posts.event}
        canEdit={canEdit}
        onDblClickDate={(date) => { setCalPrefillDate(date); setCalModalOpen(true); }}
      />,
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
        <div className="news-feed-col">
          <div className="news-feed-inner" style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 10px rgba(0,0,0,.05)',
            border: '1px solid #f0e8df',
            overflow: 'hidden',
            padding: '0 20px 20px',
            minWidth: 0,
            maxWidth: '100%',
            boxSizing: 'border-box',
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

      {/* Calendar quick-add modal */}
      <PostFormModal
        open={calModalOpen}
        onClose={() => { setCalModalOpen(false); setCalPrefillDate(null); }}
        editRecord={null}
        type="event"
        prefillDate={calPrefillDate}
        onSaved={() => { fetchAll(); setCalPrefillDate(null); }}
        canEdit={canEdit}
      />
    </div>
  );
}
