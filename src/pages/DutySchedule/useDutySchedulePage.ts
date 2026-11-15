import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';

export const DUTY_TYPES = [
  'trực_cổng', 'trực_điện_phật', 'trực_văn_phòng', 'trực_lễ_hội', 'công_phu_sáng', 'công_phu_chiều', 'khác',
];
export const DUTY_STATUSES = ['chờ', 'hoàn_thành', 'vắng', 'đổi_ca'];

/* Default hours used to prefill the form when a shift is picked. */
export const SHIFT_HOURS: Record<string, [string, string]> = {
  'sáng':    ['06:00', '11:30'],
  'chiều':   ['13:30', '17:30'],
  'tối':     ['18:00', '21:30'],
  'cả_ngày': ['06:00', '21:30'],
};

export function useDutySchedulePage() {
  const { t } = useLanguage() as any;
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<any>([dayjs().startOf('week'), dayjs().endOf('week')]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const { canManage } = useAuth();

  useEffect(() => {
    api.get('/personnel', { params: { limit: 500, status: 'đang_hoạt_động' } })
      .then(({ data: r }: any) => setPersonnel(r.data || []))
      .catch(() => setPersonnel([]));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateRange?.[0]) params.startDate = dateRange[0].format('YYYY-MM-DD');
      if (dateRange?.[1]) params.endDate = dateRange[1].format('YYYY-MM-DD');
      const { data: r } = await api.get('/duty-schedules', { params });
      setData(r as any[]);
    } catch {
      message.error(t.dutySchedule.loadError);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: any) => {
    try {
      await api.delete(`/duty-schedules/${id}`);
      message.success(t.common.deleteSuccess);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || t.dutySchedule.deleteError);
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
