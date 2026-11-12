import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

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
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPending = useCallback(async () => {
    if (!canApprove) return;
    try {
      const res = await api.get('/posts/pending?limit=50') as any;
      setPendingPosts(res.data.data);
    } catch {
      // silently ignore
    }
  }, [canApprove]);

  useEffect(() => {
    fetchAll();
    fetchPending();
  }, [fetchAll, fetchPending]);

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
      message.success('Đã xóa');
      fetchAll();
    } catch {
      message.error('Không thể xóa');
    }
  };

  const handleApprove = async (id: any) => {
    try {
      await api.patch(`/posts/${id}/approve`);
      message.success('Đã duyệt bài viết');
      fetchAll();
      fetchPending();
    } catch {
      message.error('Không thể duyệt bài');
    }
  };

  const handleReject = async (id: any) => {
    try {
      await api.patch(`/posts/${id}/reject`);
      message.success('Đã từ chối bài viết');
      fetchPending();
    } catch {
      message.error('Không thể từ chối');
    }
  };

  return {
    posts,
    pendingPosts,
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
