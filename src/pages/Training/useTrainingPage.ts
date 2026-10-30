import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

export const typeLabels: any = {
  'khóa_phật_học': 'Khóa Phật học', 'an_cư_kiết_hạ': 'An cư kiết hạ',
  'giới_đàn': 'Giới đàn', 'bồi_dưỡng': 'Bồi dưỡng', 'khác': 'Khác',
};

export const statusColors: any = {
  'sắp_diễn_ra': 'processing', 'đang_diễn_ra': 'success',
  'hoàn_thành': 'default', 'hủy': 'error',
};

export function useTrainingPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [participantModal, setParticipantModal] = useState<any>(null);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<any[]>([]);
  const { canManage } = useAuth();

  useEffect(() => {
    api.get('/personnel', { params: { limit: 200, status: 'đang_hoạt_động' } })
      .then(({ data: r }: any) => setPersonnel(r.data));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: r } = await api.get('/trainings');
      setData(r as any[]);
    } catch {
      message.error('Không thể tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
      };
      if (editRecord) {
        await api.put(`/trainings/${editRecord.id}`, payload);
        message.success('Cập nhật thành công');
      } else {
        await api.post('/trainings', payload);
        message.success('Thêm khóa học thành công');
      }
      setModalOpen(false);
      fetchData();
    } catch {
      message.error('Có lỗi xảy ra');
    }
  };

  const addParticipants = async () => {
    if (!selectedPersonnelIds.length) return;
    try {
      await api.post(`/trainings/${participantModal.id}/participants`, { personnelIds: selectedPersonnelIds });
      message.success('Đã thêm học viên');
      setSelectedPersonnelIds([]);
      fetchData();
    } catch {
      message.error('Có lỗi xảy ra');
    }
  };

  return {
    data,
    loading,
    modalOpen,
    setModalOpen,
    editRecord,
    setEditRecord,
    participantModal,
    setParticipantModal,
    personnel,
    selectedPersonnelIds,
    setSelectedPersonnelIds,
    fetchData,
    handleSubmit,
    addParticipants,
    canManage,
  };
}
