import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

export type DeptTheme = { accent: string; soft: string; tint: string; icon: string };

const PALETTE: DeptTheme[] = [
  { accent: '#c47f36', soft: '#fbf1e4', tint: '#fffaf3', icon: 'safety' },
  { accent: '#8b6fc9', soft: '#f1edfb', tint: '#fbfaff', icon: 'book' },
  { accent: '#3a9483', soft: '#e6f4f0', tint: '#f7fcfa', icon: 'wallet' },
  { accent: '#d9646c', soft: '#fdeeee', tint: '#fffafa', icon: 'heart' },
  { accent: '#4d8fc7', soft: '#e9f1fb', tint: '#f8fbff', icon: 'read' },
  { accent: '#b8893a', soft: '#f8f0dc', tint: '#fffcf5', icon: 'apartment' },
];

const KNOWN: Record<string, number> = {
  BAN_HOT_TU: 0, BAN_PHAP_SU: 1, BAN_TAI_CHINH: 2, BAN_TU_THIEN: 3, BAN_VAN_HOA: 4,
};

export const getDeptTheme = (code = ''): DeptTheme => {
  if (code in KNOWN) return PALETTE[KNOWN[code]];
  let h = 0;
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { ...PALETTE[h % PALETTE.length], icon: 'apartment' };
};

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
