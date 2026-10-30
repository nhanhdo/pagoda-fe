import React, { useMemo } from 'react';
import {
  Card, Table, Button, Select, Space, Tag, Modal, Form, Input,
  message, Popconfirm, Row, Col, DatePicker, Segmented,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, TrophyOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { useRewardDisciplinePage, rewardSubTypes, disciplineSubTypes } from './useRewardDisciplinePage';
import { useLanguage } from '../../i18n/LanguageContext';
import './RewardDisciplinePage.css';

const { Option } = Select;

export default function RewardDisciplinePage() {
  const { t } = useLanguage();
  const {
    data, loading, activeType, setActiveType,
    modalOpen, setModalOpen,
    editRecord, setEditRecord,
    personnel, canEdit,
    fetchData, handleDelete,
  } = useRewardDisciplinePage();

  const [form] = Form.useForm();

  const isReward = activeType === 'khen_thưởng';
  const subTypes = isReward ? rewardSubTypes : disciplineSubTypes;

  const rdStats = useMemo(() => {
    const thisYear  = new Date().getFullYear();
    const thisMonth = new Date().getMonth();
    const yearCount  = data.filter(d => d.issuedDate && dayjs(d.issuedDate).year() === thisYear).length;
    const monthCount = data.filter(d => d.issuedDate && dayjs(d.issuedDate).year() === thisYear && dayjs(d.issuedDate).month() === thisMonth).length;
    const accent = isReward ? '#d4a017' : '#e74c3c';
    return [
      { label: isReward ? t.rewardDiscipline.statTotalReward : t.rewardDiscipline.statTotalDiscipline, value: data.length,   color: accent },
      { label: `${t.rewardDiscipline.statYear} ${thisYear}`,                                           value: yearCount,     color: accent },
      { label: `${t.rewardDiscipline.statMonth} ${thisMonth + 1}`,                                     value: monthCount,    color: accent },
    ];
  }, [data, isReward]);

  const openModal = (record = null) => {
    setEditRecord(record);
    if (record) {
      form.setFieldsValue({ ...record, issuedDate: record.issuedDate ? dayjs(record.issuedDate) : null });
    } else {
      form.resetFields();
      form.setFieldValue('type', activeType);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = { ...values, issuedDate: values.issuedDate?.format('YYYY-MM-DD') };
      if (editRecord) {
        await api.put(`/reward-disciplines/${editRecord.id}`, payload);
        message.success(t.rewardDiscipline.updateSuccess);
      } else {
        await api.post('/reward-disciplines', payload);
        message.success(t.rewardDiscipline.addSuccess);
      }
      setModalOpen(false);
      fetchData();
    } catch {
      message.error(t.common.error);
    }
  };

  const columns = [
    {
      title: t.rewardDiscipline.colPerson,
      width: 160,
      render: (_, r) => {
        const p = r.personnel;
        return p ? (p.dharmName || p.fullName) : '—';
      },
    },
    {
      title: t.rewardDiscipline.colType,
      dataIndex: 'subType',
      width: 140,
      render: (v) => (
        <Tag color={isReward ? 'gold' : 'red'}
          icon={isReward ? <TrophyOutlined /> : <WarningOutlined />}>
          {v?.replace(/_/g, ' ')}
        </Tag>
      ),
    },
    {
      title: t.rewardDiscipline.colTitle,
      dataIndex: 'title',
      width: 220,
    },
    {
      title: t.rewardDiscipline.colDate,
      dataIndex: 'issuedDate',
      width: 110,
      render: (v) => v ? dayjs(v).format('DD/MM/YYYY') : '—',
    },
    {
      title: t.rewardDiscipline.colSigner,
      dataIndex: 'issuedBy',
      width: 130,
      render: (v) => v || '—',
    },
    {
      title: t.common.actions,
      width: 100,
      render: (_, r) => canEdit && (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openModal(r)} />
          <Popconfirm title={t.rewardDiscipline.confirmDelete} onConfirm={() => handleDelete(r.id)} okText={t.common.delete} cancelText={t.common.cancel}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div className="follower-stats-row">
        {rdStats.map(({ label, value, color }) => (
          <div key={label} className="follower-stat-card" style={{ borderTopColor: color }}>
            <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="rd-toolbar">
        <Segmented
          options={[
            { label: `🏆 ${t.rewardDiscipline.tabReward}`, value: 'khen_thưởng' },
            { label: `⚠️ ${t.rewardDiscipline.tabDiscipline}`, value: 'kỷ_luật' },
          ]}
          value={activeType}
          onChange={setActiveType}
        />
        {canEdit && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}
            style={{ backgroundColor: isReward ? '#d4a017' : '#e74c3c', borderColor: isReward ? '#d4a017' : '#e74c3c' }}>
            {t.common.add} {isReward ? t.rewardDiscipline.tabReward : t.rewardDiscipline.tabDiscipline}
          </Button>
        )}
      </div>

      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} size="small" className="personnel-table" scroll={{ x: 860 }} />

      <Modal
        title={`${editRecord ? t.common.edit : t.common.add} ${isReward ? t.rewardDiscipline.tabReward : t.rewardDiscipline.tabDiscipline}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editRecord ? t.common.update : t.common.add}
        cancelText={t.common.cancel}
        okButtonProps={{
          style: {
            backgroundColor: isReward ? '#d4a017' : '#e74c3c',
            borderColor: isReward ? '#d4a017' : '#e74c3c',
          }
        }}
        width={580}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="type" initialValue={activeType} hidden><Input /></Form.Item>
          <Form.Item name="personnelId" label={t.rewardDiscipline.colPerson} rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">
              {personnel.map(p => (
                <Option key={p.id} value={p.id}>
                  {p.dharmName ? `${p.dharmName} (${p.fullName})` : p.fullName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="subType" label={t.rewardDiscipline.fieldSubType} rules={[{ required: true }]}>
                <Select>
                  {subTypes.map(s => <Option key={s} value={s}>{s.replace(/_/g, ' ')}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="issuedDate" label={t.rewardDiscipline.colDate} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label={t.rewardDiscipline.colTitle} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="reason" label={t.rewardDiscipline.fieldReason} rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="issuedBy" label={t.rewardDiscipline.colSigner}>
            <Input />
          </Form.Item>
          <Form.Item name="notes" label={t.common.notes}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
