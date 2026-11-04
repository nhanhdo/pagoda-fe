import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import api from '../../api/axios';

export const typeLabels: Record<string, string> = {
  tang_ni: 'Tăng ni', cu_si: 'Cư sĩ', phat_tu: 'Phật tử',
  tinh_nguyen_vien: 'Tình nguyện viên', nhan_vien: 'Nhân viên',
};
export const typeColors: Record<string, string> = {
  tang_ni: '#8B4513', cu_si: '#2980b9', phat_tu: '#27ae60',
  tinh_nguyen_vien: '#e67e22', nhan_vien: '#8e44ad',
};
export const statusColors: Record<string, string> = {
  'đang_hoạt_động': 'success', 'tạm_nghỉ': 'warning', 'đã_rời': 'default',
};
export const statusLabels: Record<string, string> = {
  'đang_hoạt_động': 'Đang hoạt động', 'tạm_nghỉ': 'Tạm nghỉ', 'đã_rời': 'Đã rời',
};

export function usePersonnelList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('đang_hoạt_động');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/personnel', {
        params: { page, limit: 10, search, type: filterType, status: filterStatus },
      });
      setData(res.data);
      setTotal(res.total);
    } catch {
      message.error('Không thể tải danh sách nhân sự');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: any) => {
    try {
      await api.delete(`/personnel/${id}`);
      message.success('Đã xóa nhân sự');
      fetchData();
    } catch {
      message.error('Không thể xóa');
    }
  };

  return {
    data, loading, total, page, search, filterType, filterStatus,
    modalOpen, editRecord,
    setPage, setSearch, setFilterType, setFilterStatus,
    setModalOpen, setEditRecord,
    fetchData, handleDelete,
  };
}
