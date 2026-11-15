import React, { useState, useEffect } from 'react';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import {
  Tabs, Tag, Button, Modal, Form, Input, Select, DatePicker, TimePicker,
  message, Popconfirm, Space, Spin, Upload, Switch, Typography, Avatar, Dropdown,
  Calendar, Badge, Tooltip, Segmented, Image,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, CalendarOutlined,
  ThunderboltOutlined, ReadOutlined, EnvironmentOutlined, ClockCircleOutlined,
  PushpinOutlined, PushpinFilled, UploadOutlined, EllipsisOutlined, SearchOutlined,
  StarFilled, BellFilled, CheckCircleOutlined, CloseCircleOutlined,
  CommentOutlined, SendOutlined, ScheduleOutlined, InboxOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import api from '../../api/axios';
import { useNewsPage, imgSrc } from './useNewsPage';
import { useLanguage } from '../../i18n/LanguageContext';
import { solarToLunar, getBuddhistHolidays, getSolarTerm, getHoangDaoHours, getTruc } from '../../utils/lunarCalendar';
import './NewsPage.css';
import DharmaWheel from '../../components/DharmaWheel/DharmaWheel';
import { guardedClose, rules } from '../../utils/formGuard';

const MAX_IMAGE_MB = 10;
// Short month for the date tile: "T11" in Vietnamese (dayjs 'MMM' gives "thg 11"), "Nov" in English
const shortMonth = (d, lang) => (lang === 'en' ? dayjs(d).locale('en').format('MMM') : `T${dayjs(d).month() + 1}`);
const AVATAR_TONE = { background: '#fbf1e4', color: '#a2652a' };

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const TYPE_CFG = {
  event:   { color: '#cf5f68', bg: '#fdf0f0', icon: <CalendarOutlined /> },
  news:    { color: '#3a9483', bg: '#eaf6f2', icon: <ThunderboltOutlined /> },
  article: { color: '#c47f36', bg: '#fbf1e4', icon: <ReadOutlined /> },
};

/* ─── Comment Section (Facebook style: one level of replies) ─ */
const COMMENT_LIMIT = 3;   // top-level comments shown before "view more"
const REPLY_PREVIEW = 2;   // replies shown per thread before "view more replies"
const FEED_PAGE = 10;

const commentName = (c, t) => c?.commentAuthor?.dharmName || c?.commentAuthor?.fullName || c?.commentUser?.username || t.news.anonymous;
// Vietnamese names: initial of the given name (last word); usernames: first letter
const initialOf = (name = '') => ((name.trim().split(/\s+/).pop() || '?').charAt(0) || '?').toUpperCase();

function CommentItem({ c, isReply, mention, fresh, canDel, onReply, onDelete }) {
  const { t } = useLanguage();
  const name = commentName(c, t);
  return (
    <div className={`cmt${isReply ? ' cmt--reply' : ''}${fresh ? ' is-fresh' : ''}`}>
      <Avatar size={isReply ? 26 : 32} className="cmt__avatar" style={AVATAR_TONE}>{initialOf(name)}</Avatar>
      <div className="cmt__body">
        <div className="cmt__bubble">
          <div className="cmt__name">{name}</div>
          <div className="cmt__text">
            {mention && <span className="cmt__mention">{mention}</span>}
            {c.content}
          </div>
        </div>
        <div className="cmt__meta">
          <Tooltip title={dayjs(c.createdAt).format('HH:mm · DD/MM/YYYY')}>
            <span className="cmt__time">{dayjs(c.createdAt).fromNow()}</span>
          </Tooltip>
          <button type="button" className="cmt__act" onClick={() => onReply(c)}>{t.news.reply}</button>
          {canDel && (
            <Popconfirm title={t.news.deleteCommentConfirm} onConfirm={() => onDelete(c.id)} okText={t.common.delete} cancelText={t.common.cancel} okButtonProps={{ danger: true }}>
              <button type="button" className="cmt__act cmt__act--danger">{t.common.delete}</button>
            </Popconfirm>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentComposer({ value, onChange, onSend, sending, placeholder, small, autoFocus, onCancel, hint }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const me = user?.personnel?.dharmName || user?.personnel?.fullName || user?.username || 'U';
  return (
    <div className={`cmt-compose${small ? ' cmt-compose--reply' : ''}`}>
      <Avatar size={small ? 26 : 32} className="cmt__avatar" style={AVATAR_TONE}>{initialOf(me)}</Avatar>
      <div className="cmt-compose__main">
        {hint && (
          <div className="cmt-compose__hint">
            {hint}
            {onCancel && <> · <button type="button" className="cmt__act" onClick={onCancel}>{t.common.cancel}</button></>}
          </div>
        )}
        <div className="cmt-compose__field">
          <Input.TextArea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            autoFocus={autoFocus}
            autoSize={{ minRows: 1, maxRows: 5 }}
            onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); onSend(); } }}
            onKeyDown={e => { if (e.key === 'Escape' && onCancel) { e.preventDefault(); onCancel(); } }}
            variant="borderless"
          />
          <Button
            type="text"
            shape="circle"
            className="cmt-compose__send"
            icon={<SendOutlined />}
            loading={sending}
            disabled={!value.trim()}
            onClick={onSend}
            aria-label={t.news.sendComment}
          />
        </div>
      </div>
    </div>
  );
}

function CommentSection({ postId, onCountChange }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showAllComments, setShowAllComments] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());   // threads with all replies shown
  const [comments, setComments] = useState([]);
  const [loadingCmt, setLoadingCmt] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);                 // comment being answered
  const [replyVal, setReplyVal] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [freshIds, setFreshIds] = useState([]);
  const onCountRef = React.useRef(onCountChange);
  onCountRef.current = onCountChange;

  const updateComments = (next) => {
    setComments(prev => {
      const list = typeof next === 'function' ? next(prev) : next;
      onCountRef.current?.(list.length);
      return list;
    });
  };

  // Initial load + live refresh every 10s while this thread is open and the tab is visible
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let known = null;

    const load = async (initial = false) => {
      if (inFlight || (!initial && document.hidden)) return;
      inFlight = true;
      try {
        const r = await api.get(`/posts/${postId}/comments`);
        if (cancelled) return;
        const list = Array.isArray(r.data) ? r.data : [];
        const ids = list.map(c => c.id).join(',');
        if (ids === known) return;
        if (known !== null) {
          const before = new Set(known.split(',').filter(Boolean).map(Number));
          const added = list.filter(c => !before.has(c.id) && c.userId !== user?.id).map(c => c.id);
          if (added.length) {
            setFreshIds(f => [...f, ...added]);
            setTimeout(() => setFreshIds(f => f.filter(id => !added.includes(id))), 2600);
          }
        }
        known = ids;
        updateComments(list);
      } catch { /* silent */ } finally {
        inFlight = false;
        if (initial && !cancelled) setLoadingCmt(false);
      }
    };

    setLoadingCmt(true);
    load(true);
    const id = setInterval(load, 10000);
    const onVisible = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [postId, user?.id]);

  const send = async (content, replyToId) => {
    const r = await api.post(`/posts/${postId}/comments`, { content: content.trim(), replyToId });
    updateComments(prev => (prev.some(c => c.id === r.data.id) ? prev : [...prev, r.data]));
    return r.data;
  };

  const handleSend = async () => {
    if (!inputVal.trim()) return;
    setSubmitting(true);
    try {
      await send(inputVal);
      setInputVal('');
    } catch {
      message.error(t.news.commentSendError);
    } finally {
      setSubmitting(false);
    }
  };

  const startReply = (c) => {
    setReplyTo(c);
    setReplyVal('');
    // Make sure the reply box (end of thread) and the new reply stay visible
    const rootId = c.parentId || c.id;
    setExpanded(s => new Set(s).add(rootId));
  };
  const cancelReply = () => { setReplyTo(null); setReplyVal(''); };

  const handleSendReply = async () => {
    if (!replyVal.trim() || !replyTo) return;
    setReplySending(true);
    try {
      await send(replyVal, replyTo.id);
      cancelReply();
    } catch (err) {
      message.error(err?.response?.data?.message || t.news.commentSendError);
    } finally {
      setReplySending(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      const r = await api.delete(`/posts/${postId}/comments/${commentId}`);
      const removed = new Set(r.data?.removedIds || [commentId]);
      // Also drop local replies of a deleted top-level comment
      updateComments(prev => prev.filter(c => !removed.has(c.id) && !removed.has(c.parentId)));
      if (replyTo && (removed.has(replyTo.id) || removed.has(replyTo.parentId))) cancelReply();
    } catch {
      message.error(t.news.commentDeleteError);
    }
  };

  // Build threads: top-level comments (oldest → newest), each with its replies
  const byId = new Map(comments.map(c => [c.id, c]));
  const repliesOf = new Map();
  const roots = [];
  comments.forEach(c => {
    if (c.parentId && byId.has(c.parentId)) {
      if (!repliesOf.has(c.parentId)) repliesOf.set(c.parentId, []);
      repliesOf.get(c.parentId).push(c);
    } else {
      roots.push(c);
    }
  });
  const hiddenRoots = showAllComments ? 0 : Math.max(0, roots.length - COMMENT_LIMIT);
  const visibleRoots = roots.slice(hiddenRoots);
  const canDelete = (c) => user?.id === c.userId || ['admin', 'truotri'].includes(user?.role);

  return (
    <div className="comment-section">
      {loadingCmt ? (
        <div className="cmt-empty">{t.news.commentsLoading}</div>
      ) : (
        <div className="cmt-list">
          {comments.length === 0 && <div className="cmt-empty">{t.news.noComments}</div>}
          {roots.length > COMMENT_LIMIT && (
            <button type="button" className="cmt-more" onClick={() => setShowAllComments(v => !v)}>
              {showAllComments ? t.common.showLess : t.news.moreComments.replace('{n}', hiddenRoots)}
            </button>
          )}
          {visibleRoots.map(root => {
            const replies = repliesOf.get(root.id) || [];
            const isOpen = expanded.has(root.id);
            const hiddenReplies = isOpen ? 0 : Math.max(0, replies.length - REPLY_PREVIEW);
            const replyingHere = replyTo && (replyTo.parentId || replyTo.id) === root.id;
            return (
              <div key={root.id} className="cmt-thread">
                <CommentItem
                  c={root}
                  fresh={freshIds.includes(root.id)}
                  canDel={canDelete(root)}
                  onReply={startReply}
                  onDelete={handleDelete}
                />
                {(replies.length > 0 || replyingHere) && (
                  <div className="cmt-replies">
                    {hiddenReplies > 0 && (
                      <button type="button" className="cmt-more cmt-more--reply" onClick={() => setExpanded(s => new Set(s).add(root.id))}>
                        <span className="cmt-more__elbow" aria-hidden />
                        {t.news.viewMoreReplies.replace('{n}', hiddenReplies)}
                      </button>
                    )}
                    {isOpen && replies.length > REPLY_PREVIEW && (
                      <button
                        type="button"
                        className="cmt-more cmt-more--reply"
                        onClick={() => setExpanded(s => { const n = new Set(s); n.delete(root.id); return n; })}
                      >
                        <span className="cmt-more__elbow" aria-hidden />
                        {t.news.hideReplies}
                      </button>
                    )}
                    {replies.slice(hiddenReplies).map(rep => {
                      // Tag the person only when answering another reply (as Facebook does)
                      const target = rep.replyToId && rep.replyToId !== root.id ? byId.get(rep.replyToId) : null;
                      return (
                        <CommentItem
                          key={rep.id}
                          c={rep}
                          isReply
                          mention={target ? commentName(target, t) : null}
                          fresh={freshIds.includes(rep.id)}
                          canDel={canDelete(rep)}
                          onReply={startReply}
                          onDelete={handleDelete}
                        />
                      );
                    })}
                    {replyingHere && (
                      <CommentComposer
                        key={replyTo.id}
                        small
                        autoFocus
                        value={replyVal}
                        onChange={setReplyVal}
                        onSend={handleSendReply}
                        sending={replySending}
                        onCancel={cancelReply}
                        hint={t.news.replyingTo.replace('{name}', commentName(replyTo, t))}
                        placeholder={t.news.replyPlaceholder.replace('{name}', commentName(replyTo, t))}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <CommentComposer
        value={inputVal}
        onChange={setInputVal}
        onSend={handleSend}
        sending={submitting}
        placeholder={t.news.commentPlaceholder}
      />
    </div>
  );
}

/* ─── Single Post Card (Facebook style) ─────────────────── */
function PostCard({ post, canEdit, onEdit, onDelete, focused }) {
  const { t, lang } = useLanguage();
  const [showComments, setShowComments] = useState(!!focused);
  const cardRef = React.useRef(null);
  useEffect(() => {
    if (!focused) return;
    setShowComments(true);
    const id = setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    return () => clearTimeout(id);
  }, [focused]);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const cfg = TYPE_CFG[post.type] || TYPE_CFG.article;
  const typeLabel = { event: t.news.typeEvent, news: t.news.typeNews, article: t.news.typeArticle }[post.type] || t.news.typeArticle;
  const authorName = post.author?.dharmName || post.author?.fullName || post.userAuthor?.username || t.news.guestAuthor;
  const initial = initialOf(authorName);
  const timeAgo = dayjs(post.createdAt).fromNow();

  // A Popconfirm inside a dropdown item closes with the menu, so confirm with a modal instead.
  const menu = {
    items: [
      { key: 'edit', icon: <EditOutlined />, label: t.common.edit },
      { key: 'delete', icon: <DeleteOutlined />, label: t.common.delete, danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'edit') onEdit(post);
      if (key === 'delete') {
        Modal.confirm({
          title: t.news.deletePostConfirm,
          content: post.title,
          okText: t.common.delete,
          cancelText: t.common.cancel,
          okButtonProps: { danger: true },
          onOk: () => onDelete(post.id),
        });
      }
    },
  };

  return (
    <article ref={cardRef} id={`post-${post.id}`} className={`post-card${focused ? ' is-focused' : ''}`}>
      <div className="post-card__body">
        <header className="post-card__head">
          <Avatar size={40} style={{ background: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
            {initial}
          </Avatar>
          <div className="post-card__meta">
            <div className="post-card__author">{authorName}</div>
            <Tooltip title={dayjs(post.createdAt).format('DD/MM/YYYY · HH:mm')}>
              <span className="post-card__time">{timeAgo}</span>
            </Tooltip>
          </div>
          <div className="post-card__tags">
            {post.isPinned && (
              <Tooltip title={t.news.pinned}>
                <span className="post-card__pin"><PushpinFilled /></span>
              </Tooltip>
            )}
            <span className="post-card__type" style={{ color: cfg.color, background: cfg.bg }}>
              {cfg.icon}{typeLabel}
            </span>
            {canEdit && (
              <Dropdown menu={menu} trigger={['click']} placement="bottomRight">
                <Button type="text" className="post-card__more" aria-label={t.news.postActions} icon={<EllipsisOutlined style={{ fontSize: 18 }} />} />
              </Dropdown>
            )}
          </div>
        </header>

        <h3 className="post-card__title">{post.title}</h3>

        {post.type === 'event' && (post.eventDate || post.eventLocation) && (
          <div className="post-card__event">
            {post.eventDate && (
              <div className="post-card__date-tile">
                <span>{shortMonth(post.eventDate, lang)}</span>
                <strong>{dayjs(post.eventDate).format('DD')}</strong>
              </div>
            )}
            <div className="post-card__event-info">
              {post.eventDate && (
                <div>
                  <CalendarOutlined />{dayjs(post.eventDate).format('dddd, DD/MM/YYYY')}
                  {post.eventTime && <span style={{ marginLeft: 10 }}><ClockCircleOutlined />{post.eventTime}</span>}
                </div>
              )}
              {post.eventLocation && <div><EnvironmentOutlined />{post.eventLocation}</div>}
            </div>
          </div>
        )}

        {post.content && (
          <Paragraph className="post-card__content" ellipsis={{ rows: 3, expandable: true, symbol: t.news.readMore }}>
            {post.content}
          </Paragraph>
        )}
      </div>

      {post.coverImage && (
        <div className="post-card__media" style={{ '--media-bg': `url("${imgSrc(post.coverImage)}")` }}>
          <Image
            src={imgSrc(post.coverImage)}
            alt={post.title || ''}
            preview={{ mask: null }}
            rootClassName="post-card__img"
          />
        </div>
      )}

      <footer className="post-card__foot">
        <button
          type="button"
          className={`post-card__action${showComments ? ' is-active' : ''}`}
          onClick={() => setShowComments(v => !v)}
          aria-expanded={showComments}
        >
          <CommentOutlined />
          {t.news.comment}
          {commentCount > 0 && <span className="post-card__count">{commentCount}</span>}
        </button>
      </footer>

      {showComments && <CommentSection postId={post.id} onCountChange={setCommentCount} />}
    </article>
  );
}

/* ─── Pending Post Card ──────────────────────────────────── */
function PendingPostCard({ post, onApprove, onReject, focused, focusKey, fresh }) {
  const { t } = useLanguage();
  const cfg = TYPE_CFG[post.type] || TYPE_CFG.article;
  const typeLabel = { event: t.news.typeEvent, news: t.news.typeNews, article: t.news.typeArticle }[post.type] || t.news.typeArticle;
  const authorName = post.author?.dharmName || post.author?.fullName || post.userAuthor?.username || t.news.defaultUser;
  const timeAgo = dayjs(post.createdAt).fromNow();
  const cardRef = React.useRef(null);
  useEffect(() => {
    if (!focused) return undefined;
    const id = setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    return () => clearTimeout(id);
  }, [focused, focusKey]);

  return (
    <article
      ref={cardRef}
      id={`pending-${post.id}`}
      key={focused ? focusKey : undefined}
      className={`post-card post-card--pending${focused ? ' is-focused' : ''}${fresh ? ' is-fresh' : ''}`}
    >
      <div className="post-card__body">
        <header className="post-card__head">
          <Avatar size={40} style={{ background: '#fdf0d8', color: '#c98a1e', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
            {initialOf(authorName)}
          </Avatar>
          <div className="post-card__meta">
            <div className="post-card__author">{authorName}</div>
            <Tooltip title={dayjs(post.createdAt).format('DD/MM/YYYY · HH:mm')}>
              <span className="post-card__time">{timeAgo}</span>
            </Tooltip>
          </div>
          <div className="post-card__tags">
            <span className="post-card__type" style={{ color: cfg.color, background: cfg.bg }}>
              {cfg.icon}{typeLabel}
            </span>
          </div>
        </header>
        <h3 className="post-card__title">{post.title}</h3>
        {post.content && (
          <Paragraph className="post-card__content" ellipsis={{ rows: 3, expandable: true, symbol: t.news.readMore }}>
            {post.content}
          </Paragraph>
        )}
      </div>
      <div className="post-card__review">
        <Popconfirm title={t.news.rejectConfirm} onConfirm={() => onReject(post.id)} okText={t.news.reject} cancelText={t.common.cancel} okButtonProps={{ danger: true }}>
          <Button icon={<CloseCircleOutlined />} danger>{t.news.reject}</Button>
        </Popconfirm>
        <Popconfirm title={t.news.approveConfirm} onConfirm={() => onApprove(post.id)} okText={t.news.approve} cancelText={t.common.cancel}>
          <Button icon={<CheckCircleOutlined />} type="primary">{t.news.approvePublish}</Button>
        </Popconfirm>
      </div>
    </article>
  );
}

function NewsEmpty({ icon, text }) {
  return (
    <div className="news-empty">
      <div className="news-empty__icon">{icon}</div>
      <div>{text}</div>
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
        const tm = editRecord.eventTime && /^\d{1,2}:\d{2}/.test(editRecord.eventTime) ? dayjs(`2000-01-01T${editRecord.eventTime.padStart(5, '0').slice(0, 5)}`) : undefined;
        form.setFieldsValue({
          ...editRecord,
          eventDate: editRecord.eventDate ? dayjs(editRecord.eventDate) : undefined,
          eventTime: tm && tm.isValid() ? tm : undefined,
        });
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
          fd.append(k, k === 'eventDate' ? v.format('YYYY-MM-DD') : k === 'eventTime' ? v.format('HH:mm') : v);
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
      title={<span style={{ fontWeight: 700, fontSize: 16 }}>{editRecord ? t.news.editPost : t.news.addNew}</span>}
      open={open} onCancel={() => guardedClose(form, onClose, t)} onOk={() => form.submit()}
      okText={editRecord ? t.common.update : t.news.addNew}
      cancelText={t.common.cancel}
      confirmLoading={submitting} maskClosable={false}
      width={680} destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <Form.Item name="type" label={t.news.formTypeLabel} rules={[rules(t).select(t.news.formTypeLabel.toLowerCase())]} style={{ flex: 1, marginBottom: 12 }}>
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
            <Form.Item name="eventDate" label={t.news.formDateLabel} style={{ flex: 1 }} rules={[{ required: true, message: t.news.eventDateRequired }]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="eventTime" label={t.news.formTimeLabel} style={{ width: 120 }}>
              <TimePicker format="HH:mm" minuteStep={5} needConfirm={false} placeholder="08:00" style={{ width: '100%' }} />
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
            accept="image/*"
            onChange={({ fileList: fl }) => setFileList(fl)}
            beforeUpload={(file) => {
              if (!file.type?.startsWith('image/')) { message.error(t.news.imageInvalidType); return Upload.LIST_IGNORE; }
              if (file.size > MAX_IMAGE_MB * 1024 * 1024) { message.error(t.news.imageTooLarge.replace('{n}', MAX_IMAGE_MB)); return Upload.LIST_IGNORE; }
              return false; // sent together with the form, not uploaded immediately
            }}
          >
            {fileList.length === 0 && <div><UploadOutlined /><div style={{ marginTop: 6, fontSize: 12 }}>{t.news.formAddImage}</div></div>}
          </Upload>
          {editRecord?.coverImage && fileList.length === 0 && (
            <img src={imgSrc(editRecord.coverImage)} alt="" style={{ width: 100, borderRadius: 8, marginTop: 4 }} />
          )}
        </Form.Item>
        {/* Enter in a single-line field submits; the OK button lives in the footer */}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </Form>
    </Modal>
  );
}

/* ─── Feed Tab Content ────────────────────────────────────── */
function LoadMore({ shown, total, onMore }) {
  const { t } = useLanguage();
  if (shown >= total) return null;
  return (
    <div className="list-toggle-row" style={{ marginBottom: 8 }}>
      <button type="button" className="list-toggle" onClick={onMore}>
        {t.common.loadMoreN.replace('{n}', total - shown)}
        <span className="list-toggle__chev">›</span>
      </button>
    </div>
  );
}

function FeedTab({ posts, loading, canEdit, onEdit, onDelete, emptyIcon, emptyText, resetKey, focusPostId }) {
  const [limit, setLimit] = useState(FEED_PAGE);
  useEffect(() => { setLimit(FEED_PAGE); }, [resetKey]);
  // Make sure a post opened from a notification is within the visible page
  useEffect(() => {
    if (!focusPostId) return;
    const idx = posts.findIndex(p => String(p.id) === String(focusPostId));
    if (idx >= 0) setLimit(l => Math.max(l, Math.ceil((idx + 1) / FEED_PAGE) * FEED_PAGE));
  }, [focusPostId, posts]);
  if (loading) return <PageSpinner />;
  if (posts.length === 0) return <NewsEmpty icon={emptyIcon} text={emptyText} />;
  return (
    <div>
      {posts.slice(0, limit).map(p => (
        <PostCard key={p.id} post={p} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} focused={String(p.id) === String(focusPostId)} />
      ))}
      <LoadMore shown={Math.min(limit, posts.length)} total={posts.length} onMore={() => setLimit(l => l + FEED_PAGE)} />
    </div>
  );
}

function PendingList({ posts, onApprove, onReject, emptyText, focusPostId, focusKey, freshIds = [] }) {
  const [limit, setLimit] = useState(FEED_PAGE);
  useEffect(() => {
    if (!focusPostId) return;
    const idx = posts.findIndex(p => String(p.id) === String(focusPostId));
    if (idx >= 0) setLimit(l => Math.max(l, Math.ceil((idx + 1) / FEED_PAGE) * FEED_PAGE));
  }, [focusPostId, posts]);
  if (posts.length === 0) return <NewsEmpty icon={<InboxOutlined />} text={emptyText} />;
  return (
    <div>
      {posts.slice(0, limit).map(p => (
        <PendingPostCard
          key={p.id}
          post={p}
          onApprove={onApprove}
          onReject={onReject}
          focused={String(p.id) === String(focusPostId)}
          focusKey={focusKey}
          fresh={freshIds.includes(p.id)}
        />
      ))}
      <LoadMore shown={Math.min(limit, posts.length)} total={posts.length} onMore={() => setLimit(l => l + FEED_PAGE)} />
    </div>
  );
}

/* ─── Van Nien Calendar ──────────────────────────────────── */
function EventCalendarView({ events, canEdit, onDblClickDate }) {
  const { t } = useLanguage();
  const CL = t.news.cal;
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
        title={canEdit ? CL.dblClickHint : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
          <span style={{ fontSize: 10, color: lunarColor, fontWeight: isRam || isMung1 ? 700 : 400, lineHeight: 1.3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', minWidth: 0 }}>
            {lunar.day}/{lunar.month}{lunar.leap ? '*' : ''}
          </span>
          <span style={{ flexShrink: 0, marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: dotColor }} />
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
        {evs.length > 1 && <div style={{ fontSize: 9, color: '#7a6a5c' }}>+{evs.length - 1}</div>}
        {canEdit && (
          <div className="cal-add-hint">+</div>
        )}
      </div>
    );
  };

  const DOT = (color) => <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 5, verticalAlign: 'middle' }} />;

  return (
    <div className="news-cal-container">
    <div className="news-cal-layout" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

      {/* ── Left: Info Panel ── */}
      <div className="news-cal-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Solar + Lunar date card */}
        <div style={{ background: 'linear-gradient(160deg, #f6b38a 0%, #e98a6a 55%, #d9646c 100%)', borderRadius: 16, padding: '18px 16px', color: '#fff', textAlign: 'center', boxShadow: '0 8px 22px rgba(217,100,108,.25)' }}>
          <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: 1.2, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>
            {sel.format('dddd')}
          </div>
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, letterSpacing: -3 }}>
            {sel.format('DD')}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
            {CL.monthYear.replace('{m}', sel.format('MM')).replace('{y}', sel.format('YYYY'))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.25)', marginTop: 12, paddingTop: 10 }}>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>{CL.lunar}</div>
            <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>
              {selLunar.day < 10 ? `0${selLunar.day}` : selLunar.day}
              <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.8 }}> / {selLunar.month}{selLunar.leap ? ' ★' : ''}</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 3 }}>{CL.year} {selLunar.yearName}</div>
          </div>
        </div>

        {/* Can-Chi details */}
        <div style={{ background: '#fffdf9', border: '1px solid #f0e8df', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: CL.month, value: selLunar.monthCanChi },
            { label: CL.day,   value: selLunar.dayCanChi },
            { label: CL.term,  value: selTiKhi },
            { label: CL.truc,  value: selTruc.name, color: selTruc.hoangDao ? '#c2620a' : '#7a6a5c',
              badge: selTruc.hoangDao ? { text: CL.hoangDao, bg: '#fff7e6', color: '#d46b08' } : { text: CL.hacDao, bg: '#f5f5f5', color: '#7a6a5c' }
            },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#7a6a5c' }}>{r.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: r.color || '#5a3a22' }}>{r.value}</span>
            </div>
          ))}
        </div>

        {/* Giờ Hoàng Đạo */}
        <div style={{ background: '#fffaf4', border: '1px solid #f5e6cc', borderRadius: 12, padding: '10px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e67e22', marginBottom: 8 }}>☀ {CL.hoangDaoHours}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {selHDHours.map(h => (
              <div key={h.chi} style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#d46b08', fontWeight: 600, textAlign: 'center' }}>
                <div>{h.chi}</div>
                <div style={{ fontSize: 10, color: '#7a6a5c', fontWeight: 400 }}>{h.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Holidays / Events for selected day */}
        {(selHoliday || selEvents.length > 0 || canEdit) && (
          <div style={{ background: '#fff', border: '1px solid #f0e8df', borderRadius: 12, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#b06f2c', marginBottom: 2 }}>📅 {CL.thisDay}</div>
            {selHoliday?.names.map((n, i) => (
              <div key={i} style={{ fontSize: 12, color: selHoliday.major ? '#cf1322' : '#389e0d', fontWeight: 600 }}>
                {selHoliday.major ? '★' : '▲'} {n}
              </div>
            ))}
            {selEvents.map(e => (
              <Tooltip key={e.id} title={e.title}>
                <div style={{ fontSize: 12, color: '#1890ff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />{e.title}
                </div>
              </Tooltip>
            ))}
            {!selHoliday && selEvents.length === 0 && <div style={{ fontSize: 12, color: '#7a6a5c' }}>{CL.nothingThisDay}</div>}
            {canEdit && (
              <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => onDblClickDate(sel)} style={{ marginTop: 4 }}>
                {CL.addEventFor.replace('{d}', sel.format('DD/MM'))}
              </Button>
            )}
          </div>
        )}

        {/* Legend */}
        <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#7a6a5c', marginBottom: 2, letterSpacing: 0.5, textTransform: 'uppercase' }}>{CL.legend}</div>
          {[
            { dot: '#e67e22', label: CL.goodDay },
            { dot: '#bbb',    label: CL.badDay },
            { dot: '#c0392b', label: t.news.calendarLunar },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
              {DOT(l.dot)}<span style={{ color: '#555' }}>{l.label}</span>
            </div>
          ))}
          <div style={{ fontSize: 12, color: '#cf1322' }}>★ {t.news.calendarMajorHoliday}</div>
          <div style={{ fontSize: 12, color: '#389e0d' }}>▲ {t.news.calendarHoliday}</div>
          <div style={{ fontSize: 12, color: '#1677ff' }}><CalendarOutlined /> {t.news.calendarTempleEvent}</div>
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
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function NewsPage() {
  const { t, lang } = useLanguage();
  const [calPrefillDate, setCalPrefillDate] = useState(null);
  const [calModalOpen, setCalModalOpen] = useState(false);
  const {
    posts, pendingPosts, freshPendingIds, loading, activeTab, setActiveTab,
    modalOpen, setModalOpen,
    editRecord, canEdit, canPost, canApprove,
    fetchAll, fetchPending, openCreate, openEdit, handleDelete,
    handleApprove, handleReject,
  } = useNewsPage();

  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // ?post=<id>[&tab=pending] (from a notification): switch to that post's tab and focus it.
  // location.key re-triggers this even when the same link is clicked again.
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  // Drop the focus params once the highlight has played, so later refreshes don't pull the user back
  useEffect(() => {
    if (!location.search) return undefined;
    const id = setTimeout(() => navigate(location.pathname, { replace: true }), 3000);
    return () => clearTimeout(id);
  }, [location.key]);
  const focusPostId = params.get('post');
  // ?create=1 (dashboard quick action) opens the composer straight away
  useEffect(() => {
    if (params.get('create') === '1' && canPost) openCreate();
  }, [location.key]);
  const focusTab = params.get('tab');
  useEffect(() => {
    if (focusTab === 'pending' && canApprove) {
      setActiveTab('pending');
      fetchPending();
      return;
    }
    if (focusTab && ['article', 'news', 'event', 'calendar'].includes(focusTab) && !focusPostId) {
      setActiveTab(focusTab);
      return;
    }
    if (!focusPostId || loading) return;
    const type = ['article', 'news', 'event'].find(k => (posts[k] || []).some(p => String(p.id) === String(focusPostId)));
    if (type) {
      setSearchText('');
      setActiveFilter('all');
      setActiveTab(type);
    }
  }, [focusPostId, focusTab, loading, posts, location.key, canApprove]);

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
  const count = (n, warn) => n > 0
    ? <span className={`news-tab-count${warn ? ' news-tab-count--warn' : ''}`}>{n}</span>
    : null;

  const feed = (type, icon, emptyText) => (
    <FeedTab posts={getDisplayPosts(type)} loading={loading} canEdit={canEdit} onEdit={openEdit} onDelete={handleDelete} emptyIcon={icon} emptyText={emptyText} resetKey={`${activeFilter}|${searchText}`} focusPostId={focusPostId} />
  );

  const tabs = [
    { key: 'article',  label: <span><ReadOutlined />{t.news.tabFeed}{count(cnt('article'))}</span>,
      content: feed('article', <ReadOutlined />, t.news.emptyArticle) },
    { key: 'news',     label: <span><ThunderboltOutlined />{t.news.typeNews}{count(cnt('news'))}</span>,
      content: feed('news', <ThunderboltOutlined />, t.news.emptyNews) },
    { key: 'event',    label: <span><CalendarOutlined />{t.news.tabEvents}{count(cnt('event'))}</span>,
      content: feed('event', <CalendarOutlined />, t.news.emptyEvents) },
    { key: 'calendar', label: <span><ScheduleOutlined />{t.news.tabCalendar}</span>,
      content: (
        <EventCalendarView
          events={posts.event}
          canEdit={canEdit}
          onDblClickDate={(date) => { setCalPrefillDate(date); setCalModalOpen(true); }}
        />
      ) },
    ...(canApprove ? [{
      key: 'pending',
      label: <span><ClockCircleOutlined />{t.news.tabPending}{count(pendingPosts.length, true)}</span>,
      content: (
        <PendingList
          posts={pendingPosts}
          onApprove={handleApprove}
          onReject={handleReject}
          emptyText={t.news.emptyPending}
          focusPostId={focusTab === 'pending' ? focusPostId : null}
          focusKey={location.key}
          freshIds={freshPendingIds}
        />
      ),
    }] : []),
  ];
  const tabItems = tabs.map(({ key, label }) => ({ key, label }));
  const activeContent = (tabs.find(x => x.key === activeTab) || tabs[0]).content;
  const showFilters = ['article', 'news', 'event'].includes(activeTab);

  const upcomingEvents = posts.event
    .filter(p => p.eventDate && !dayjs(p.eventDate).isBefore(dayjs(), 'day'))
    .slice(0, 4);

  const pinnedPosts = [...posts.event, ...posts.news, ...posts.article]
    .filter(p => p.isPinned)
    .slice(0, 3);

  const typeLabels = { event: t.news.typeEvent, news: t.news.typeNews, article: t.news.typeArticle };
  const showSidebar = activeTab !== 'calendar' && (upcomingEvents.length > 0 || pinnedPosts.length > 0);

  return (
    <div>
      {/* ── Banner ── */}
      <div className="news-banner section-anim section-d0">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: '#fff', border: '1.5px solid #f0dcc0', color: '#c47f36', boxShadow: '0 4px 12px rgba(196,127,54,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            fontSize: 28,
          }}>
            <DharmaWheel />
          </div>
          <div>
            <div style={{ color: '#5a3a22', fontWeight: 800, fontSize: 20, letterSpacing: 0.3 }}>{t.news.title}</div>
            <div style={{ color: '#7a6a5c', fontSize: 13, marginTop: 3 }}>
              {t.news.bannerSubtitle}
            </div>
          </div>
        </div>
        {canPost && (
          <Button
            icon={<PlusOutlined />} onClick={openCreate}
            title={canEdit ? t.news.shareDescription : t.news.pendingDescription}
            type="primary"
            style={{ fontWeight: 700, height: 40, borderRadius: 10, fontSize: 14, position: 'relative', zIndex: 1 }}
          >
            {t.news.addNew}
          </Button>
        )}
      </div>

      {/* ── 2 cột: Feed + Sidebar ── */}
      <div className={`news-layout section-anim section-d1${showSidebar ? ' has-rail' : activeTab !== 'calendar' ? ' is-centered' : ''}`}>

        {/* ── CỘT TRÁI: Feed ── */}
        <div className="news-feed-col">
          <div className="news-toolbar">
            <Tabs
              className="news-feed-tabs"
              activeKey={activeTab}
              onChange={key => { setActiveTab(key); setSearchText(''); setActiveFilter('all'); }}
              items={tabItems}
            />
            {showFilters && (
              <div className="news-toolbar__filters">
                <Input
                  className="news-search"
                  prefix={<SearchOutlined style={{ color: '#7a6a5c' }} />}
                  placeholder={t.news.searchPlaceholder}
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  allowClear
                />
                <Segmented
                  value={activeFilter}
                  onChange={setActiveFilter}
                  options={FILTERS.map(f => ({
                    value: f.key,
                    label: (
                      <span className="news-seg">
                        {f.key === 'pinned' && <PushpinOutlined />}
                        {f.key === 'month' && <CalendarOutlined />}
                        {f.label}
                      </span>
                    ),
                  }))}
                />
              </div>
            )}
          </div>

          <div className="news-feed-content m-fade-in" key={activeTab}>{activeContent}</div>
        </div>

        {/* ── CỘT PHẢI: Sidebar ── */}
        {showSidebar && (
          <aside className="news-sidebar">
            {upcomingEvents.length > 0 && (
              <div className="news-widget">
                <div className="news-widget-header">
                  <CalendarOutlined style={{ color: '#cf5f68' }} /> {t.news.sidebarUpcoming}
                </div>
                <div className="news-widget-list">
                  {upcomingEvents.map(ev => (
                    <div key={ev.id} className="news-widget-item">
                      <div className="news-widget-date">
                        <strong>{dayjs(ev.eventDate).format('DD')}</strong>
                        <span>{shortMonth(ev.eventDate, lang)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="news-widget-item__title">{ev.title}</div>
                        {ev.eventLocation && (
                          <div className="news-widget-item__sub"><EnvironmentOutlined style={{ marginRight: 4 }} />{ev.eventLocation}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pinnedPosts.length > 0 && (
              <div className="news-widget">
                <div className="news-widget-header">
                  <PushpinOutlined style={{ color: '#d39a2c' }} /> {t.news.sidebarPinned}
                </div>
                <div className="news-widget-list">
                  {pinnedPosts.map(p => {
                    const cfg = TYPE_CFG[p.type] || TYPE_CFG.article;
                    return (
                      <div key={p.id} className="news-widget-item">
                        <span className="news-widget-dot" style={{ background: cfg.color }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="news-widget-item__title">{p.title}</div>
                          <div className="news-widget-item__sub" style={{ color: cfg.color }}>{typeLabels[p.type]}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      <PostFormModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        editRecord={editRecord} type={activeTab} onSaved={() => { fetchAll(); fetchPending(); }}
        canEdit={canEdit}
      />

      {/* Calendar quick-add modal */}
      <PostFormModal
        open={calModalOpen}
        onClose={() => { setCalModalOpen(false); setCalPrefillDate(null); }}
        editRecord={null}
        type="event"
        prefillDate={calPrefillDate}
        onSaved={() => { fetchAll(); fetchPending(); setCalPrefillDate(null); }}
        canEdit={canEdit}
      />
    </div>
  );
}
