import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import api from '../../api/axios';

export const ROLE_ORDER = ['admin', 'truotri', 'thuki', 'truongban', 'user'];

export const ROLE_CONFIG: Record<string, { c: string; s: string }> = {
  admin:     { c: '#d9646c', s: '#fdeeee' },
  truotri:   { c: '#c47f36', s: '#fbf1e4' },
  thuki:     { c: '#4d8fc7', s: '#e9f1fb' },
  truongban: { c: '#4f9a72', s: '#e8f4ed' },
  user:      { c: '#8c7a6b', s: '#f2ede6' },
};

export function useUserManagementPage(t: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [personnelList, setPersonnelList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [resetModal, setResetModal] = useState<any>({ open: false, user: null });
  const [editRecord, setEditRecord] = useState<any>(null);
  const U = t?.users || {};

  const fetchUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const resp: any = await api.get('/users');
      setUsers(resp.data);
    } catch {
      if (!silent) message.error(U.loadError);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Keep the online indicators fresh (quietly, only while the tab is visible)
  useEffect(() => {
    const tick = () => { if (!document.hidden) fetchUsers(true); };
    const id = setInterval(tick, 30000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers();
    api
      .get('/personnel', { params: { limit: 1000 } })
      .then((resp: any) => setPersonnelList(resp.data.data || []))
      .catch(() => {});
  }, [fetchUsers]);

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
      await api.delete(`/users/${id}`);
      message.success(U.deleteSuccess);
      fetchUsers();
    } catch (err: any) {
      message.error(err.response?.data?.message || t?.common?.deleteError);
    }
  };

  const toggleActive = async (record: any) => {
    try {
      await api.put(`/users/${record.id}`, { isActive: !record.isActive });
      message.success(record.isActive ? U.lockSuccess : U.unlockSuccess);
      fetchUsers();
    } catch (err: any) {
      message.error(err.response?.data?.message || t?.common?.error);
    }
  };

  return {
    users,
    personnelList,
    loading,
    modalOpen,
    setModalOpen,
    resetModal,
    setResetModal,
    editRecord,
    setEditRecord,
    fetchUsers,
    openCreate,
    openEdit,
    handleDelete,
    toggleActive,
  };
}
