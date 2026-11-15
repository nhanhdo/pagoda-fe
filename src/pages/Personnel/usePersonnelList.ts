import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import api from '../../api/axios';
import { useLanguage } from '../../i18n/LanguageContext';

export function usePersonnelList() {
  const { t } = useLanguage() as any;
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('đang_hoạt_động');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);

  // Don't hit the server on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/personnel', {
        params: { page, limit: 10, search: debouncedSearch, type: filterType, status: filterStatus },
      });
      setData(res.data);
      setTotal(res.total);
    } catch {
      message.error(t.personnel.loadError);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterType, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: any) => {
    try {
      await api.delete(`/personnel/${id}`);
      message.success(t.personnel.deleteSuccess);
      // Step back a page when the last row of the page was removed
      if (data.length === 1 && page > 1) setPage(page - 1);
      else fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || t.personnel.deleteError);
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
