import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';

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
  const [saving, setSaving] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const { canManage, isAdmin, hasRole } = useAuth();
  const { t } = useLanguage() as any;

  // Search waits 300ms after the last keystroke; a slower, older response never overwrites a newer one
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => { const id = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(id); }, [search]);
  const reqId = useRef(0);

  const fetchData = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const { data: r } = await api.get('/buddhist-followers', {
        params: { page, limit: 10, search: debouncedSearch, type: filterType },
      });
      if (id !== reqId.current) return;
      setData((r as any).data);
      setTotal((r as any).total);
    } catch {
      if (id === reqId.current) message.error(t.common.loadError);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [page, debouncedSearch, filterType]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  // Whole list (unfiltered) so summary stats, ranks and the leaderboard aren't limited to the current page
  const [allData, setAllData] = useState<any[]>([]);
  const fetchAll = useCallback(async () => {
    try {
      const { data: r } = await api.get('/buddhist-followers', { params: { page: 1, limit: 10000 } });
      setAllData((r as any).data || []);
    } catch {
      setAllData([]);
    }
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (values: any) => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        ...values,
        dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
        preceptDate: values.preceptDate?.format('YYYY-MM-DD'),
      };
      if (editRecord) {
        await api.put(`/buddhist-followers/${editRecord.id}`, payload);
        message.success(t.buddhistFollower.updateSuccess);
      } else {
        await api.post('/buddhist-followers', payload);
        message.success(t.buddhistFollower.addSuccess);
      }
      setModalOpen(false);
      fetchData();
      fetchAll();
    } catch (err: any) {
      message.error(err?.response?.data?.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: any) => {
    try {
      await api.delete(`/buddhist-followers/${id}`);
      message.success(t.common.deleteSuccess);
      fetchData();
      fetchAll();
    } catch {
      message.error(t.common.deleteError);
    }
  };

  return {
    data,
    allData,
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
    saving,
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
