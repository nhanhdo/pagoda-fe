import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

export function useDonationPage() {
  const [data, setData]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [summary, setSummary]     = useState({ totalAmount: 0, count: 0, thisMonthAmount: 0 });

  const { isAdmin, hasRole } = useAuth() as any;

  const canManage = () => isAdmin() || hasRole('truotri') || hasRole('thuki') || hasRole('truongban');

  useEffect(() => {
    api.get('/buddhist-followers', { params: { limit: 500, status: 'đang_sinh_hoạt' } })
      .then((r: any) => setFollowers(r.data.data || []))
      .catch(() => {});
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const params: any = {};
      if (dateRange?.[0]) params.startDate = dayjs(dateRange[0]).format('YYYY-MM-DD');
      if (dateRange?.[1]) params.endDate   = dayjs(dateRange[1]).format('YYYY-MM-DD');
      const r: any = await api.get('/donations/summary', { params });
      setSummary(r.data);
    } catch { /* silent */ }
  }, [dateRange]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10, search };
      if (dateRange?.[0]) params.startDate = dayjs(dateRange[0]).format('YYYY-MM-DD');
      if (dateRange?.[1]) params.endDate   = dayjs(dateRange[1]).format('YYYY-MM-DD');
      const r: any = await api.get('/donations', { params });
      setData(r.data.data);
      setTotal(r.data.total);
    } catch {
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [page, search, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        donationDate: values.donationDate ? dayjs(values.donationDate).format('YYYY-MM-DD') : null,
      };
      if (editRecord) {
        await api.put(`/donations/${editRecord.id}`, payload);
        message.success('Cập nhật thành công');
      } else {
        await api.post('/donations', payload);
        message.success('Đã ghi nhận cúng dường');
      }
      setModalOpen(false);
      setEditRecord(null);
      fetchData();
      fetchSummary();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: any) => {
    try {
      await api.delete(`/donations/${id}`);
      message.success('Đã xóa');
      fetchData();
      fetchSummary();
    } catch {
      message.error('Không thể xóa');
    }
  };

  return {
    data, loading, total, page, setPage,
    search, setSearch,
    dateRange, setDateRange,
    modalOpen, setModalOpen,
    editRecord, setEditRecord,
    followers,
    summary,
    handleSubmit, handleDelete,
    canManage, isAdmin, hasRole,
  };
}
