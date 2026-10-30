import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

export const priorityColors: any = {
  thấp: 'default', trung_bình: 'processing', cao: 'warning', khẩn_cấp: 'error',
};

export const statusColors: any = {
  'chưa_bắt_đầu': 'default', 'đang_thực_hiện': 'processing',
  'hoàn_thành': 'success', 'tạm_dừng': 'warning', 'hủy': 'error',
};

export function useWorkAssignmentPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const { canManage } = useAuth();

  useEffect(() => {
    api.get('/personnel', { params: { limit: 200, status: 'đang_hoạt_động' } })
      .then(({ data: r }: any) => setPersonnel(r.data));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: r } = await api.get('/work-assignments', { params: { status: filterStatus } });
      setData(r as any[]);
    } catch {
      message.error('Không thể tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
      };
      if (editRecord) {
        await api.put(`/work-assignments/${editRecord.id}`, payload);
        message.success('Cập nhật thành công');
      } else {
        await api.post('/work-assignments', payload);
        message.success('Thêm công việc thành công');
      }
      setModalOpen(false);
      fetchData();
    } catch {
      message.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: any) => {
    try {
      await api.delete(`/work-assignments/${id}`);
      message.success('Đã xóa');
      fetchData();
    } catch {
      message.error('Không thể xóa');
    }
  };

  return {
    data,
    loading,
    filterStatus,
    setFilterStatus,
    modalOpen,
    setModalOpen,
    editRecord,
    setEditRecord,
    personnel,
    fetchData,
    handleSubmit,
    handleDelete,
    canManage,
  };
}
