import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

export const rewardSubTypes = ['giấy_khen', 'công_đức_xuất_sắc', 'bằng_khen'];
export const disciplineSubTypes = ['khiển_trách', 'cảnh_cáo', 'tạm_đình_chỉ', 'đình_chỉ'];

export function useRewardDisciplinePage() {
  // All records are loaded once (the API is unpaginated) so stats, counts and filters cover everything
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const { isAdmin, hasRole } = useAuth() as any;
  const canEdit = isAdmin() || hasRole('truotri');

  useEffect(() => {
    api
      .get('/personnel', { params: { limit: 1000 } })
      .then((resp: any) => setPersonnel(resp.data.data || []))
      .catch(() => setPersonnel([]));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resp: any = await api.get('/reward-disciplines');
      setData(resp.data || []);
    } catch {
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: any) => {
    try {
      await api.delete(`/reward-disciplines/${id}`);
      message.success('Đã xóa');
      fetchData();
    } catch {
      message.error('Không thể xóa');
    }
  };

  return {
    data,
    loading,
    modalOpen,
    setModalOpen,
    editRecord,
    setEditRecord,
    personnel,
    canEdit,
    fetchData,
    handleDelete,
  };
}
