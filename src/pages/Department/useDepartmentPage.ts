import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

export const deptColors: Record<string, { bg: string; text: string }> = {
  BAN_HOT_TU:    { bg: '#7B3F00', text: '#fff' },
  BAN_PHAP_SU:   { bg: '#4A1E8C', text: '#fff' },
  BAN_TAI_CHINH: { bg: '#0B5E3A', text: '#fff' },
  BAN_TU_THIEN:  { bg: '#B5360A', text: '#fff' },
  BAN_VAN_HOA:   { bg: '#1565A6', text: '#fff' },
};

export const getDeptColor = (code: string) => deptColors[code] || { bg: '#5a5a5a', text: '#fff' };

export function useDepartmentPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAdmin, hasRole } = useAuth();
  const canEdit = isAdmin() || hasRole('truotri');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: r } = await api.get('/departments');
      setData(r);
    } catch {
      message.error('Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: any) => {
    try {
      await api.delete(`/departments/${id}`);
      message.success('Đã xóa');
      fetchData();
    } catch {
      message.error('Không thể xóa');
    }
  };

  return { data, loading, canEdit, fetchData, handleDelete };
}
