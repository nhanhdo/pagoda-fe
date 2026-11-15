import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';

export const WORK_STATUSES = ['chưa_bắt_đầu', 'đang_thực_hiện', 'tạm_dừng', 'hoàn_thành', 'hủy'];
export const PRIORITIES = ['thấp', 'trung_bình', 'cao', 'khẩn_cấp'];

export const STATUS_TONE: Record<string, { c: string; s: string }> = {
  'chưa_bắt_đầu':   { c: '#8c7a6b', s: '#f2ede6' },
  'đang_thực_hiện': { c: '#3f7fb5', s: '#e9f1fb' },
  'tạm_dừng':       { c: '#b9841f', s: '#fdf3dc' },
  'hoàn_thành':     { c: '#3f8461', s: '#e8f4ed' },
  'hủy':            { c: '#c4545d', s: '#fdeeee' },
};
export const PRIORITY_TONE: Record<string, { c: string; s: string }> = {
  'thấp':       { c: '#8c7a6b', s: '#f2ede6' },
  'trung_bình': { c: '#4d8fc7', s: '#e9f1fb' },
  'cao':        { c: '#c47f36', s: '#fbf1e4' },
  'khẩn_cấp':   { c: '#d9646c', s: '#fdeeee' },
};

export const isOverdue = (r: any) => !!r.endDate
  && dayjs(r.endDate).isBefore(dayjs(), 'day')
  && r.status !== 'hoàn_thành' && r.status !== 'hủy';

export function useWorkAssignmentPage() {
  const { t } = useLanguage() as any;
  const W = t.workAssignment;
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const { canManage } = useAuth();

  useEffect(() => {
    api.get('/personnel', { params: { limit: 500, status: 'đang_hoạt_động' } })
      .then(({ data: r }: any) => setPersonnel(r.data || []))
      .catch(() => setPersonnel([]));
  }, []);

  // Everything is loaded once; status/assignee/search filters run client-side so the board and stats stay complete.
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: r } = await api.get('/work-assignments');
      setData(r as any[]);
    } catch {
      message.error(W.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
      };
      if (editRecord) {
        await api.put(`/work-assignments/${editRecord.id}`, payload);
        message.success(W.updateSuccess);
      } else {
        await api.post('/work-assignments', payload);
        message.success(W.addSuccess);
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  // Optimistic status change (drag & drop or the card's status menu)
  const moveStatus = async (record: any, status: string) => {
    if (!record || record.status === status) return;
    const prev = data;
    setData(d => d.map(x => (x.id === record.id ? { ...x, status } : x)));
    try {
      await api.put(`/work-assignments/${record.id}`, { status });
      message.success((W.movedTo || '{status}').replace('{status}', W.statuses[status] || status));
    } catch {
      setData(prev);
      message.error(W.cannotUpdateStatus);
    }
  };

  const handleDelete = async (id: any) => {
    try {
      await api.delete(`/work-assignments/${id}`);
      message.success(t.common.deleteSuccess);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || W.deleteError);
    }
  };

  return {
    data, loading, saving,
    modalOpen, setModalOpen, editRecord, setEditRecord,
    personnel, fetchData, handleSubmit, handleDelete, moveStatus, canManage,
  };
}
