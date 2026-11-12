import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

export const dutyTypeOptions = [
  { value: 'trực_cổng', label: 'Trực cổng' },
  { value: 'trực_điện_phật', label: 'Trực điện Phật' },
  { value: 'trực_văn_phòng', label: 'Trực văn phòng' },
  { value: 'trực_lễ_hội', label: 'Trực lễ hội' },
  { value: 'công_phu_sáng', label: 'Công phu sáng' },
  { value: 'công_phu_chiều', label: 'Công phu chiều' },
  { value: 'khác', label: 'Khác' },
];
export const statusColors: Record<string, string> = {
  'chờ': 'processing', 'hoàn_thành': 'success', 'vắng': 'error', 'đổi_ca': 'warning',
};
export const shiftColors: Record<string, string> = {
  sáng: 'gold', chiều: 'orange', tối: 'purple', cả_ngày: 'blue',
};

export function useDutySchedulePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<any>([dayjs().startOf('week'), dayjs().endOf('week')]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const { canManage } = useAuth();

  useEffect(() => {
    api.get('/personnel', { params: { limit: 200, status: 'đang_hoạt_động' } })
      .then(({ data: r }) => setPersonnel(r.data));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateRange?.[0]) params.startDate = dateRange[0].format('YYYY-MM-DD');
      if (dateRange?.[1]) params.endDate = dateRange[1].format('YYYY-MM-DD');
      const { data: r } = await api.get('/duty-schedules', { params });
      setData(r);
    } catch {
      message.error('Không thể tải lịch trực');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: any) => {
    try {
      await api.delete(`/duty-schedules/${id}`);
      message.success('Đã xóa');
      fetchData();
    } catch {
      message.error('Không thể xóa');
    }
  };

  return {
    data, loading, dateRange, setDateRange,
    modalOpen, setModalOpen,
    editRecord, setEditRecord,
    personnel, canManage,
    fetchData, handleDelete,
  };
}
