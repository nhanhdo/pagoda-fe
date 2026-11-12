import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

export const TRAINING_TYPES = ['khóa_phật_học', 'an_cư_kiết_hạ', 'giới_đàn', 'bồi_dưỡng', 'khác'];

// Status shown to users follows the calendar; a stored 'hủy' (cancelled) always wins.
export function effectiveStatus(r: any): string {
  if (r.status === 'hủy') return 'hủy';
  const today = dayjs().startOf('day');
  if (r.startDate && today.isBefore(dayjs(r.startDate), 'day')) return 'sắp_diễn_ra';
  if (r.endDate && today.isAfter(dayjs(r.endDate), 'day')) return 'hoàn_thành';
  if (r.startDate) return 'đang_diễn_ra';
  return r.status || 'sắp_diễn_ra';
}

export function useTrainingPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [participantModalId, setParticipantModalId] = useState<any>(null);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const { canManage, isAdmin, hasRole } = useAuth() as any;
  const canDelete = () => isAdmin() || hasRole('truotri');

  useEffect(() => {
    api.get('/personnel', { params: { limit: 500, status: 'đang_hoạt_động' } })
      .then(({ data: r }: any) => setPersonnel(r.data || []))
      .catch(() => setPersonnel([]));
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

  // Derive from the latest data so the dialog reflects changes right after add/remove
  const participantModal = participantModalId != null ? data.find(d => d.id === participantModalId) || null : null;
  const setParticipantModal = (record: any) => {
    setSelectedPersonnelIds([]);
    setParticipantModalId(record ? record.id : null);
  };

  const handleSubmit = async (values: any) => {
    setSaving(true);
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
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: any) => {
    try {
      await api.delete(`/trainings/${id}`);
      message.success('Đã xóa khóa học');
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể xóa');
    }
  };

  const addParticipants = async () => {
    if (!selectedPersonnelIds.length || !participantModal) return;
    try {
      await api.post(`/trainings/${participantModal.id}/participants`, { personnelIds: selectedPersonnelIds });
      message.success('Đã thêm học viên');
      setSelectedPersonnelIds([]);
      fetchData();
    } catch {
      message.error('Có lỗi xảy ra');
    }
  };

  const updateResult = async (participantId: any, result: string) => {
    if (!participantModal) return;
    try {
      await api.put(`/trainings/${participantModal.id}/participants/${participantId}`, { result });
      fetchData();
    } catch {
      message.error('Có lỗi xảy ra');
    }
  };

  const removeParticipant = async (participantId: any) => {
    if (!participantModal) return;
    try {
      await api.delete(`/trainings/${participantModal.id}/participants/${participantId}`);
      fetchData();
    } catch {
      message.error('Không thể xóa học viên');
    }
  };

  return {
    data,
    loading,
    saving,
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
    handleDelete,
    addParticipants,
    updateResult,
    removeParticipant,
    canManage,
    canDelete,
  };
}
