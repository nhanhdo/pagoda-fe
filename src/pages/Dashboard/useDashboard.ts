import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

export const DUTY_TYPE_LABELS: Record<string, string> = {
  'trực_cổng': 'Trực cổng',
  'trực_điện_phật': 'Trực điện Phật',
  'trực_văn_phòng': 'Trực văn phòng',
  'trực_lễ_hội': 'Trực lễ hội',
  'công_phu_sáng': 'Công phu sáng',
  'công_phu_chiều': 'Công phu chiều',
  'khác': 'Khác',
};

export const SHIFT_COLORS: Record<string, string> = {
  sáng: 'gold', chiều: 'orange', tối: 'purple', cả_ngày: 'blue',
};

export const DUTY_STATUS_COLORS: Record<string, string> = {
  'chờ': 'processing', 'hoàn_thành': 'success', 'vắng': 'error', 'đổi_ca': 'warning',
};

export interface PersonnelStats {
  total: number;
  tangNi: number;
  cuSi: number;
}

export interface DashboardStats {
  personnel: PersonnelStats;
  followers: number;
  trainings: number;
  pendingWork: number;
}

export interface DutyRecord {
  id: number;
  dutyType: string;
  shift: string;
  status: string;
  personnel?: { dharmName?: string; fullName?: string };
}

export function useDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dutyToday, setDutyToday] = useState<DutyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/duty-today'),
    ]).then(([statsRes, dutyRes]) => {
      setStats(statsRes.data);
      setDutyToday(dutyRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const displayName =
    (user as any)?.personnel?.dharmName ||
    (user as any)?.personnel?.fullName ||
    (user as any)?.username;

  return { stats, dutyToday, loading, displayName };
}
