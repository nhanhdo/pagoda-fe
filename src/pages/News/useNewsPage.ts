import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';

export const BASE_URL =
  (import.meta as any).env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const imgSrc = (p: any): string | null =>
  !p ? null : p.startsWith('http') ? p : `${BASE_URL}${p}`;

export function useNewsPage() {
  const [posts, setPosts] = useState<any>({ event: [], news: [], article: [] });
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('article');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const { isAdmin, hasRole } = useAuth() as any;
  const { t } = useLanguage() as any;
  const tRef = useRef(t);
  tRef.current = t;
  const canEdit = isAdmin() || hasRole('truotri') || hasRole('thuki');
  const canPost = true; // all authenticated users can submit posts
  const canApprove = isAdmin() || hasRole('truotri') || hasRole('thuki');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ev, nw, ar] = (await Promise.all([
        api.get('/posts?type=event&limit=50'),
        api.get('/posts?type=news&limit=50'),
        api.get('/posts?type=article&limit=50'),
      ])) as any[];
      setPosts({ event: ev.data.data, news: nw.data.data, article: ar.data.data });
    } catch {
      message.error(tRef.current.news.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  const [freshPendingIds, setFreshPendingIds] = useState<any[]>([]);
  const pendingSigRef = useRef<string | null>(null);
  const pendingInFlight = useRef(false);

  const fetchPending = useCallback(async () => {
    if (!canApprove || pendingInFlight.current) return;
    pendingInFlight.current = true;
    try {
      const res = await api.get('/posts/pending?limit=50') as any;
      const list = res.data.data || [];
      const sig = list.map((p: any) => `${p.id}|${p.updatedAt || ''}`).join(',');
      if (sig === pendingSigRef.current) return;
      // Highlight posts that arrived since the previous check (not on first load)
      if (pendingSigRef.current !== null) {
        const before = new Set(pendingSigRef.current.split(',').map(s => s.split('|')[0]));
        const added = list.filter((p: any) => !before.has(String(p.id))).map((p: any) => p.id);
        if (added.length) {
          setFreshPendingIds(f => [...f, ...added]);
          setTimeout(() => setFreshPendingIds(f => f.filter(id => !added.includes(id))), 2600);
        }
      }
      pendingSigRef.current = sig;
      setPendingPosts(list);
    } catch {
      // silently ignore
    } finally {
      pendingInFlight.current = false;
    }
  }, [canApprove]);

  useEffect(() => {
    fetchAll();
    fetchPending();
  }, [fetchAll, fetchPending]);

  // Live refresh of the approval queue (every 10s while the tab is visible)
  useEffect(() => {
    if (!canApprove) return undefined;
    const tick = () => { if (!document.hidden) fetchPending(); };
    const id = setInterval(tick, 10000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [canApprove, fetchPending]);

  const openCreate = () => {
    setEditRecord(null);
    setModalOpen(true);
  };

  const openEdit = (r: any) => {
    setEditRecord(r);
    setModalOpen(true);
  };

  const handleDelete = async (id: any) => {
    try {
      await api.delete(`/posts/${id}`);
      message.success(t.common.deleteSuccess);
      fetchAll();
    } catch {
      message.error(t.news.deleteError);
    }
  };

  const handleApprove = async (id: any) => {
    try {
      await api.patch(`/posts/${id}/approve`);
      message.success(t.news.approved);
      fetchAll();
      fetchPending();
    } catch {
      message.error(t.news.approveError);
    }
  };

  const handleReject = async (id: any) => {
    try {
      await api.patch(`/posts/${id}/reject`);
      message.success(t.news.rejected);
      fetchPending();
    } catch {
      message.error(t.news.rejectError);
    }
  };

  return {
    posts,
    pendingPosts,
    freshPendingIds,
    loading,
    activeTab,
    setActiveTab,
    modalOpen,
    setModalOpen,
    editRecord,
    canEdit,
    canPost,
    canApprove,
    fetchAll,
    fetchPending,
    openCreate,
    openEdit,
    handleDelete,
    handleApprove,
    handleReject,
  };
}
