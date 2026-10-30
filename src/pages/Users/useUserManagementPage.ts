import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import api from '../../api/axios';

export const ROLE_CONFIG: any = {
  admin:     { label: 'Quản trị',   color: 'red',     bg: '#fff1f0' },
  truotri:   { label: 'Trụ trì',    color: '#8B4513', bg: '#fdf5ee' },
  thuki:     { label: 'Thư ký',     color: 'blue',    bg: '#e6f7ff' },
  truongban: { label: 'Trưởng ban', color: 'green',   bg: '#f6ffed' },
  user:      { label: 'Người dùng', color: 'default', bg: '#fafafa' },
};

export function useUserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [personnelList, setPersonnelList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [resetModal, setResetModal] = useState<any>({ open: false, user: null });
  const [editRecord, setEditRecord] = useState<any>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const resp: any = await api.get('/users');
      setUsers(resp.data);
    } catch {
      message.error('Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    api
      .get('/personnel?limit=200')
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
      message.success('Đã xóa tài khoản');
      fetchUsers();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể xóa');
    }
  };

  const toggleActive = async (record: any) => {
    try {
      await api.put(`/users/${record.id}`, { isActive: !record.isActive });
      message.success(record.isActive ? 'Đã khoá tài khoản' : 'Đã mở khoá tài khoản');
      fetchUsers();
    } catch {
      message.error('Có lỗi xảy ra');
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
