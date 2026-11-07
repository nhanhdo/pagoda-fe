import React, { useMemo } from 'react';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import {
  Card, Table, Button, Select, Space, Tag, Modal, Form, Input,
  DatePicker, Badge, Row, Col, List, Avatar,
} from 'antd';
import { PlusOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTrainingPage, typeLabels, statusColors } from './useTrainingPage';
import { useLanguage } from '../../i18n/LanguageContext';
import './TrainingPage.css';

const { Option } = Select;

export default function TrainingPage() {
  const { t } = useLanguage();
  const {
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
    handleSubmit,
    addParticipants,
    canManage,
  } = useTrainingPage();

  const [form] = Form.useForm();

  const trainingStats = useMemo(() => {
    const ongoing  = data.filter(d => d.status === 'đang_diễn_ra').length;
    const upcoming = data.filter(d => d.status === 'sắp_diễn_ra').length;
    const done     = data.filter(d => d.status === 'hoàn_thành').length;
    return [
      { label: t.training.statTotalCourses,            value: data.length, color: '#8B4513' },
      { label: t.training.statuses['đang_diễn_ra'],    value: ongoing,     color: '#2e7d32' },
      { label: t.training.statuses['sắp_diễn_ra'],     value: upcoming,    color: '#0288d1' },
      { label: t.training.statuses['hoàn_thành'],      value: done,        color: '#888'   },
    ];
  }, [data, t]);

  const openModal = (record = null) => {
    setEditRecord(record);
    if (record) {
      form.setFieldsValue({
        ...record,
        startDate: record.startDate ? dayjs(record.startDate) : null,
        endDate: record.endDate ? dayjs(record.endDate) : null,
      });
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const columns = [
    {
      title: t.training.colName,
      dataIndex: 'name',
      width: 220,
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v}</div>
          <Tag size="small">{typeLabels[r.type] || r.type}</Tag>
        </div>
      ),
    },
    {
      title: t.training.colTime,
      width: 140,
      render: (_, r) => (
        <div>
          <div>{dayjs(r.startDate).format('DD/MM/YYYY')}</div>
          <div style={{ color: '#888', fontSize: 12 }}>→ {dayjs(r.endDate).format('DD/MM/YYYY')}</div>
        </div>
      ),
    },
    {
      title: t.training.colLocation,
      dataIndex: 'location',
      width: 150,
      render: (v) => v || '—',
    },
    {
      title: t.training.colStudents,
      width: 110,
      render: (_, r) => <Tag icon={<TeamOutlined />}>{r.participants?.length || 0} người</Tag>,
    },
    {
      title: t.common.status,
      dataIndex: 'status',
      width: 140,
      render: (v) => <Badge status={statusColors[v] || 'default'} text={v?.replace(/_/g, ' ')} />,
    },
    {
      title: t.common.actions,
      width: 120,
      render: (_, r) => canManage() && (
        <Space>
          <Button type="text" icon={<TeamOutlined />} onClick={() => setParticipantModal(r)} title={t.training.colStudents} />
          <Button type="text" icon={<EditOutlined />} onClick={() => openModal(r)} />
        </Space>
      ),
    },
  ];

  if (loading && !data.length) return <PageSpinner />;

  return (
    <Card>
      <div className="follower-stats-row section-anim section-d0">
        {trainingStats.map(({ label, value, color }) => (
          <div key={label} className="follower-stat-card" style={{ borderTopColor: color }}>
            <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="page-toolbar section-anim section-d1">
        <div />
        {canManage() && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}
            style={{ backgroundColor: '#2e7d32', borderColor: '#2e7d32' }}>
            {t.training.addNew}
          </Button>
        )}
      </div>

      <div className="section-anim section-d2">
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        className="personnel-table"
        scroll={{ x: 'max-content' }}
        expandable={{
          expandedRowRender: (r) => (
            <div style={{ padding: '8px 0' }}>
              <strong>{t.training.colStudents} ({r.participants?.length || 0}):</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {r.participants?.map(p => (
                  <Tag key={p.id} color={p.result === 'đạt' ? 'success' : 'default'}>
                    {p.personnel?.dharmName || p.personnel?.fullName}
                    {p.result !== 'chưa_đánh_giá' ? ` (${p.result})` : ''}
                  </Tag>
                ))}
              </div>
            </div>
          ),
        }}
      />
      </div>

      <Modal
        title={editRecord ? t.training.editTitle : t.training.addTitle}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editRecord ? t.common.update : t.common.add}
        cancelText={t.common.cancel}
        okButtonProps={{ style: { backgroundColor: '#8B4513', borderColor: '#8B4513' } }}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label={t.training.colName} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label={t.training.colType} rules={[{ required: true }]}>
                <Select>
                  {Object.entries(typeLabels).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label={t.common.status} initialValue="sắp_diễn_ra">
                <Select>
                  <Option value="sắp_diễn_ra">{t.training.statuses['sắp_diễn_ra']}</Option>
                  <Option value="đang_diễn_ra">{t.training.statuses['đang_diễn_ra']}</Option>
                  <Option value="hoàn_thành">{t.training.statuses['hoàn_thành']}</Option>
                  <Option value="hủy">{t.training.statuses['hủy']}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="startDate" label={t.training.fieldStartDate} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label={t.training.fieldEndDate} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="location" label={t.training.colLocation}>
            <Input />
          </Form.Item>
          <Form.Item name="instructor" label={t.training.fieldInstructor}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t.common.description}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${t.training.manageParticipants}: ${participantModal?.name || ''}`}
        open={!!participantModal}
        onCancel={() => setParticipantModal(null)}
        footer={null}
        width={600}
      >
        {participantModal && (
          <div>
            <div className="participant-modal-add">
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder={t.training.selectPersonnelPlaceholder}
                value={selectedPersonnelIds}
                onChange={setSelectedPersonnelIds}
                showSearch
                optionFilterProp="children"
              >
                {personnel.map(p => (
                  <Option key={p.id} value={p.id}>
                    {p.dharmName ? `${p.dharmName} (${p.fullName})` : p.fullName}
                  </Option>
                ))}
              </Select>
              <Button
                type="primary"
                onClick={addParticipants}
                style={{ marginTop: 8, backgroundColor: '#8B4513', borderColor: '#8B4513' }}
              >
                {t.common.add} {t.training.colStudents}
              </Button>
            </div>
            <List
              size="small"
              header={<strong>{t.training.colStudents}</strong>}
              dataSource={participantModal.participants || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#8B4513' }}>{item.personnel?.fullName?.[0]}</Avatar>}
                    title={item.personnel?.dharmName || item.personnel?.fullName}
                  />
                  <Tag color={item.result === 'đạt' ? 'success' : item.result === 'không_đạt' ? 'error' : 'default'}>
                    {item.result}
                  </Tag>
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
}
