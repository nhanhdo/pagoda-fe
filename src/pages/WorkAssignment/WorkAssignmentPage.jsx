import React, { useState, useRef } from 'react';
import {
  Card, Table, Button, Select, Space, Tag, Modal, Form, Input,
  DatePicker, Popconfirm, Badge, Row, Col, Tooltip, message,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined,
  TableOutlined, ProjectOutlined, UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { useWorkAssignmentPage, priorityColors, statusColors } from './useWorkAssignmentPage';
import { useLanguage } from '../../i18n/LanguageContext';
import './WorkAssignmentPage.css';

const { Option } = Select;

const PRIORITY_COLORS = {
  'thấp':      '#8c8c8c',
  'trung_bình':'#1890ff',
  'cao':       '#fa8c16',
  'khẩn_cấp': '#ff4d4f',
};

/* ── Kanban card ──────────────────────────────────────── */
function KanbanCard({ record, canManage, onEdit, onDelete, onDragStart, onDragEnd }) {
  const { t } = useLanguage();
  const isOverdue = record.endDate && dayjs(record.endDate).isBefore(dayjs(), 'day')
    && record.status !== 'hoàn_thành';
  const assignee = record.personnel ? (record.personnel.dharmName || record.personnel.fullName) : null;

  return (
    <div
      className="kanban-card"
      draggable
      onDragStart={(e) => onDragStart(e, record)}
      onDragEnd={onDragEnd}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
        <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4, flex: 1 }}>{record.title}</div>
        {canManage && (
          <div className="kanban-card__actions">
            <Tooltip title={t.common.edit}>
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)}
                style={{ color: '#8B4513', padding: '0 4px' }} />
            </Tooltip>
            <Popconfirm title={t.workAssignment.confirmDelete} onConfirm={() => onDelete(record.id)}
              okText={t.common.delete} cancelText={t.common.cancel} okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} style={{ padding: '0 4px' }} />
            </Popconfirm>
          </div>
        )}
      </div>

      {record.description && (
        <div style={{ fontSize: 11, color: '#888', marginTop: 4, lineHeight: 1.5 }}
          className="kanban-card__desc">
          {record.description}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {record.priority && (
          <span style={{ display: 'flex', alignItems: 'center', fontSize: 11, color: PRIORITY_COLORS[record.priority] }}>
            <span className="priority-dot" style={{ background: PRIORITY_COLORS[record.priority] }} />
            {t.workAssignment.priorities[record.priority] || record.priority}
          </span>
        )}
        {assignee && (
          <span style={{ display: 'flex', alignItems: 'center', fontSize: 11, color: '#595959', gap: 3 }}>
            <UserOutlined style={{ fontSize: 10 }} />
            {assignee}
          </span>
        )}
        {record.endDate && (
          <span style={{
            display: 'flex', alignItems: 'center', fontSize: 11, gap: 3,
            color: isOverdue ? '#ff4d4f' : '#8c8c8c',
            fontWeight: isOverdue ? 600 : 400,
          }}>
            <ClockCircleOutlined style={{ fontSize: 10 }} />
            {dayjs(record.endDate).format('DD/MM')}
            {isOverdue && ` · ${t.layout.overdue}`}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Kanban board ─────────────────────────────────────── */
function KanbanBoard({ data, canManage, onEdit, onDelete, onMoveCard }) {
  const { t } = useLanguage();
  const [overCol, setOverCol] = useState(null);
  const dragCard = useRef(null);

  const KANBAN_COLS = [
    { key: 'chưa_bắt_đầu',   label: t.workAssignment.statuses['chưa_bắt_đầu'],   color: '#8c8c8c' },
    { key: 'đang_thực_hiện',  label: t.workAssignment.statuses['đang_thực_hiện'],  color: '#1890ff' },
    { key: 'hoàn_thành',      label: t.workAssignment.statuses['hoàn_thành'],      color: '#52c41a' },
    { key: 'tạm_dừng',        label: t.workAssignment.statuses['tạm_dừng'],        color: '#fa8c16' },
  ];

  const handleDragStart = (e, record) => {
    dragCard.current = record;
    e.currentTarget.classList.add('kanban-card--dragging');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('kanban-card--dragging');
    dragCard.current = null;
    setOverCol(null);
  };

  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverCol(colKey);
  };

  const handleDrop = (e, colKey) => {
    e.preventDefault();
    setOverCol(null);
    if (dragCard.current && dragCard.current.status !== colKey) {
      onMoveCard(dragCard.current, colKey);
    }
  };

  return (
    <div className="kanban-board">
      {KANBAN_COLS.map(col => {
        const cards = data.filter(d => d.status === col.key);
        return (
          <div
            key={col.key}
            className={`kanban-col${overCol === col.key ? ' kanban-col--over' : ''}`}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={() => setOverCol(null)}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className="kanban-col__header" style={{ borderBottomColor: col.color }}>
              <span style={{ color: col.color }}>{col.label}</span>
              <span style={{
                background: col.color, color: '#fff',
                borderRadius: 20, fontSize: 11, padding: '1px 8px', fontWeight: 700,
              }}>{cards.length}</span>
            </div>

            {cards.map(record => (
              <KanbanCard
                key={record.id}
                record={record}
                canManage={canManage()}
                onEdit={onEdit}
                onDelete={onDelete}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            ))}

            {cards.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '24px 0',
                color: '#bfbfbf', fontSize: 12, borderRadius: 8,
                border: '1px dashed #e8e8e8',
              }}>
                {t.workAssignment.emptyColumn}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main page ────────────────────────────────────────── */
export default function WorkAssignmentPage() {
  const { t } = useLanguage();
  const {
    data, loading, filterStatus, setFilterStatus,
    modalOpen, setModalOpen, editRecord, setEditRecord,
    personnel, fetchData, handleSubmit, handleDelete, canManage,
  } = useWorkAssignmentPage();
  const [form] = Form.useForm();
  const [viewMode, setViewMode] = useState('table');

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

  const handleMoveCard = async (record, newStatus) => {
    try {
      await api.put(`/work-assignments/${record.id}`, { ...record, status: newStatus, personnelId: record.personnel?.id ?? record.personnelId });
      fetchData();
    } catch {
      message.error(t.workAssignment.cannotUpdateStatus);
    }
  };

  const columns = [
    {
      title: t.workAssignment.colTask, dataIndex: 'title', width: 300,
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v}</div>
          {r.description && <div style={{ fontSize: 12, color: '#888' }}>{r.description}</div>}
        </div>
      ),
    },
    {
      title: t.workAssignment.colAssignee, width: 160,
      render: (_, r) => { const p = r.personnel; return p ? (p.dharmName || p.fullName) : '—'; },
    },
    {
      title: t.workAssignment.fieldPriority, dataIndex: 'priority', width: 110,
      render: (v) => <Tag color={priorityColors[v]}>{t.workAssignment.priorities[v] || v}</Tag>,
    },
    {
      title: t.workAssignment.colDeadline, width: 120,
      render: (_, r) => {
        const overdue = r.endDate && dayjs(r.endDate).isBefore(dayjs(), 'day') && r.status !== 'hoàn_thành';
        return r.endDate
          ? <span style={{ color: overdue ? '#ff4d4f' : undefined }}>{dayjs(r.endDate).format('DD/MM/YYYY')}</span>
          : '—';
      },
    },
    {
      title: t.common.status, dataIndex: 'status', width: 150,
      render: (v) => <Badge status={statusColors[v] || 'default'} text={t.workAssignment.statuses[v] || v?.replace(/_/g, ' ')} />,
    },
    {
      title: t.common.actions, width: 100,
      render: (_, r) => canManage() && (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openModal(r)} />
          <Popconfirm title={t.workAssignment.confirmDelete} onConfirm={() => handleDelete(r.id)}
            okText={t.common.delete} cancelText={t.common.cancel}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card bodyStyle={{ paddingTop: 16 }}>
      <div className="page-toolbar">
        <Space wrap>
          {/* View toggle */}
          <div className="view-toggle">
            <Tooltip title={t.workAssignment.tooltipTable}><Button
              type={viewMode === 'table' ? 'primary' : 'default'}
              icon={<TableOutlined />}
              onClick={() => setViewMode('table')}
              style={viewMode === 'table' ? { background: '#2e7d32', borderColor: '#2e7d32' } : {}}
            /></Tooltip>
            <Tooltip title={t.workAssignment.tooltipKanban}><Button
              type={viewMode === 'kanban' ? 'primary' : 'default'}
              icon={<ProjectOutlined />}
              onClick={() => setViewMode('kanban')}
              style={viewMode === 'kanban' ? { background: '#2e7d32', borderColor: '#2e7d32' } : {}}
            /></Tooltip>
          </div>

          {/* Status filter — only in table mode */}
          {viewMode === 'table' && (
            <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 180 }} placeholder={t.workAssignment.allStatuses}>
              <Option value="">{t.common.all}</Option>
              <Option value="chưa_bắt_đầu">{t.workAssignment.statuses['chưa_bắt_đầu']}</Option>
              <Option value="đang_thực_hiện">{t.workAssignment.statuses['đang_thực_hiện']}</Option>
              <Option value="hoàn_thành">{t.workAssignment.statuses['hoàn_thành']}</Option>
              <Option value="tạm_dừng">{t.workAssignment.statuses['tạm_dừng']}</Option>
              <Option value="hủy">{t.workAssignment.statuses['hủy']}</Option>
            </Select>
          )}
        </Space>

        {canManage() && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}
            style={{ backgroundColor: '#2e7d32', borderColor: '#2e7d32' }}>
            {t.workAssignment.addNew}
          </Button>
        )}
      </div>

      {viewMode === 'table' ? (
        <Table dataSource={data} columns={columns} rowKey="id" loading={loading}
          size="small" className="personnel-table" />
      ) : (
        <KanbanBoard
          data={data}
          canManage={canManage}
          onEdit={openModal}
          onDelete={handleDelete}
          onMoveCard={handleMoveCard}
        />
      )}

      <Modal
        title={editRecord ? t.workAssignment.editTitle : t.workAssignment.addTitle}
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
          <Form.Item name="title" label={t.workAssignment.fieldTitle} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label={t.common.description}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="personnelId" label={t.workAssignment.colAssignee} rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">
              {personnel.map(p => (
                <Option key={p.id} value={p.id}>{p.dharmName ? `${p.dharmName} (${p.fullName})` : p.fullName}</Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label={t.workAssignment.fieldPriority} initialValue="trung_bình">
                <Select>
                  <Option value="thấp">{t.workAssignment.priorities['thấp']}</Option>
                  <Option value="trung_bình">{t.workAssignment.priorities['trung_bình']}</Option>
                  <Option value="cao">{t.workAssignment.priorities['cao']}</Option>
                  <Option value="khẩn_cấp">{t.workAssignment.priorities['khẩn_cấp']}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label={t.common.status} initialValue="chưa_bắt_đầu">
                <Select>
                  <Option value="chưa_bắt_đầu">{t.workAssignment.statuses['chưa_bắt_đầu']}</Option>
                  <Option value="đang_thực_hiện">{t.workAssignment.statuses['đang_thực_hiện']}</Option>
                  <Option value="hoàn_thành">{t.workAssignment.statuses['hoàn_thành']}</Option>
                  <Option value="tạm_dừng">{t.workAssignment.statuses['tạm_dừng']}</Option>
                  <Option value="hủy">{t.workAssignment.statuses['hủy']}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="startDate" label={t.workAssignment.fieldStartDate}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label={t.workAssignment.colDeadline}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label={t.common.notes}><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
