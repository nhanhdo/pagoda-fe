import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';

export function useDonationPage() {
  const [data, setData]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [fundFilter, setFundFilter] = useState<any>(undefined);
  const [summary, setSummary]     = useState<any>({
    totalAmount: 0, count: 0, thisMonthAmount: 0, lastMonthAmount: 0, anonymousCount: 0, byMethod: [],
  });

  const { isAdmin, hasRole } = useAuth() as any;
  const { t } = useLanguage() as any;

  // Search waits 300ms after the last keystroke; stale responses are ignored
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => { const id = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(id); }, [search]);
  const reqId = useRef(0);

  const canManage = () => isAdmin() || hasRole('truotri') || hasRole('thuki') || hasRole('truongban');

  useEffect(() => {
    api.get('/buddhist-followers', { params: { limit: 500, status: 'đang_sinh_hoạt' } })
      .then((r: any) => setFollowers(r.data.data || []))
      .catch(() => {});
    api.get('/funds')
      .then((r: any) => setFunds(r.data || []))
      .catch(() => {});
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const params: any = { fundId: fundFilter };
      if (dateRange?.[0]) params.startDate = dayjs(dateRange[0]).format('YYYY-MM-DD');
      if (dateRange?.[1]) params.endDate   = dayjs(dateRange[1]).format('YYYY-MM-DD');
      const r: any = await api.get('/donations/summary', { params });
      setSummary(r.data);
    } catch { /* silent */ }
  }, [dateRange, fundFilter]);

  const fetchData = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const params: any = { page, limit: 10, search: debouncedSearch, fundId: fundFilter };
      if (dateRange?.[0]) params.startDate = dayjs(dateRange[0]).format('YYYY-MM-DD');
      if (dateRange?.[1]) params.endDate   = dayjs(dateRange[1]).format('YYYY-MM-DD');
      const r: any = await api.get('/donations', { params });
      if (id !== reqId.current) return;
      setData(r.data.data);
      setTotal(r.data.total);
    } catch {
      if (id === reqId.current) message.error(t.common.loadError);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [page, debouncedSearch, dateRange, fundFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const handleSubmit = async (values: any) => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        ...values,
        donationDate: values.donationDate ? dayjs(values.donationDate).format('YYYY-MM-DD') : null,
      };
      if (editRecord) {
        await api.put(`/donations/${editRecord.id}`, payload);
        message.success(t.donation.updateSuccess);
      } else {
        await api.post('/donations', payload);
        message.success(t.donation.addSuccess);
      }
      setModalOpen(false);
      setEditRecord(null);
      fetchData();
      fetchSummary();
    } catch (err: any) {
      message.error(err.response?.data?.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: any) => {
    try {
      await api.delete(`/donations/${id}`);
      message.success(t.common.deleteSuccess);
      fetchData();
      fetchSummary();
    } catch {
      message.error(t.common.deleteError);
    }
  };

  return {
    data, loading, total, page, setPage,
    search, setSearch,
    dateRange, setDateRange,
    funds, fundFilter, setFundFilter,
    modalOpen, setModalOpen, saving,
    editRecord, setEditRecord,
    followers,
    summary,
    handleSubmit, handleDelete,
    canManage, isAdmin, hasRole,
  };
}
