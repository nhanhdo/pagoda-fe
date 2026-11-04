import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

export const typeColors: any = {
  phật_tử: '#27ae60', tình_nguyện_viên: '#e67e22', cả_hai: '#8B4513',
};

export const statusColors: any = {
  'đang_sinh_hoạt': 'success', 'tạm_ngưng': 'warning', 'đã_rời': 'default',
};

export function useBuddhistFollowerPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const { canManage, isAdmin, hasRole } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: r } = await api.get('/buddhist-followers', {
        params: { page, limit: 10, search, type: filterType },
      });
      setData((r as any).data);
      setTotal((r as any).total);
    } catch {
      message.error('Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
        preceptDate: values.preceptDate?.format('YYYY-MM-DD'),
      };
      if (editRecord) {
        await api.put(`/buddhist-followers/${editRecord.id}`, payload);
        message.success('Cập nhật thành công');
      } else {
        await api.post('/buddhist-followers', payload);
        message.success('Thêm thành công');
      }
      setModalOpen(false);
      fetchData();
    } catch {
      message.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: any) => {
    try {
      await api.delete(`/buddhist-followers/${id}`);
      message.success('Đã xóa');
      fetchData();
    } catch {
      message.error('Không thể xóa');
    }
  };

  return {
    data,
    loading,
    total,
    page,
    setPage,
    search,
    setSearch,
    filterType,
    setFilterType,
    modalOpen,
    setModalOpen,
    editRecord,
    setEditRecord,
    fetchData,
    handleSubmit,
    handleDelete,
    canManage,
    isAdmin,
    hasRole,
  };
}
