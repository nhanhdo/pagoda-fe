import React, { useState } from 'react';
import {
  Card, Table, Button, Select, DatePicker, Space, Tag, Modal, Form,
  Input, message, Popconfirm, Badge, Row, Col, Tabs, Calendar, Tooltip,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined,
  TableOutlined, CalendarOutlined, FileExcelOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import {
  useDutySchedulePage, dutyTypeOptions, statusColors, shiftColors,
} from './useDutySchedulePage';
import { useLanguage } from '../../i18n/LanguageContext';
import { exportToExcel } from '../../utils/exportData';
import './DutySchedulePage.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

// Màu nền nhẹ cho ca trực trên lịch
const SHIFT_BG = {
  'sáng':    '#fff8e1',
  'chiều':   '#fff3e0',
  'tối':     '#e8eaf6',
  'cả_ngày': '#e8f5e9',
};

const SHIFT_DOT = {
  'sáng':    '#f59e0b',
  'chiều':   '#f97316',
  'tối':     '#6366f1',
  'cả_ngày': '#22c55e',
};

export default function DutySchedulePage() {
  const {
    data, loading, dateRange, setDateRange,
    modalOpen, setModalOpen,
    editRecord, setEditRecord,
    personnel, canManage,
    fetchData, handleDelete,
  } = useDutySchedulePage();

  const { t } = useLanguage();
  const [form] = Form.useForm();
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'calendar'
  const [calendarValue, setCalendarValue] = useState(dayjs());

  const openModal = (record = null, defaultDate = null) => {
    setEditRecord(record);
    if (record) {
      form.setFieldsValue({ ...record, dutyDate: dayjs(record.dutyDate) });
    } else {
      form.resetFields();
      if (defaultDate) form.setFieldsValue({ dutyDate: defaultDate });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      const submitData = { ...values, dutyDate: values.dutyDate.format('YYYY-MM-DD') };
      if (editRecord) {
        await api.put(`/duty-schedules/${editRecord.id}`, submitData);
        message.success(t.dutySchedule.updateSuccess);
      } else {
        await api.post('/duty-schedules', submitData);
        message.success(t.dutySchedule.addSuccess);
      }
      setModalOpen(false);
      fetchData();
    } catch {
      message.error(t.common.error);
    }
  };

  const handleExport = () => {
    exportToExcel(data, [
      { header: t.dutySchedule.fields.date, render: (r) => dayjs(r.dutyDate).format('DD/MM/YYYY') },
      { header: t.dutySchedule.fields.dutyType, render: (r) => t.dutySchedule.dutyTypes[r.dutyType] || r.dutyType },
      { header: t.dutySchedule.colShift, render: (r) => t.dutySchedule.shifts[r.shift] || r.shift },
      { header: t.dutySchedule.colPerson, render: (r) => r.personnel?.dharmName || r.personnel?.fullName || '' },
      { header: t.dutySchedule.fields.startTime, key: 'startTime' },
      { header: t.dutySchedule.fields.endTime, key: 'endTime' },
      { header: t.common.status, render: (r) => t.dutySchedule.statuses[r.status] || r.status },
      { header: t.common.notes, key: 'notes' },
    ], 'lich-truc');
  };

  // Khi đổi tháng trên calendar, cập nhật dateRange để fetch dữ liệu tháng đó
  const handleCalendarPanelChange = (value) => {
    setCalendarValue(value);
    const start = value.startOf('month');
    const end = value.endOf('month');
    setDateRange([start, end]);
  };

  // Render nội dung mỗi ô ngày trên calendar
  const calendarCellRender = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    const dayDuties = data.filter((d) => {
      const dStr = typeof d.dutyDate === 'string' ? d.dutyDate.slice(0, 10) : dayjs(d.dutyDate).format('YYYY-MM-DD');
      return dStr === dateStr;
    });
    if (!dayDuties.length) return null;
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 11 }}>
        {dayDuties.slice(0, 3).map((d) => (
          <li key={d.id}
            onClick={(e) => { e.stopPropagation(); openModal(d); }}
            style={{
              background: SHIFT_BG[d.shift] || '#f5f5f5',
              borderLeft: `3px solid ${SHIFT_DOT[d.shift] || '#888'}`,
              borderRadius: 3, padding: '1px 4px', marginBottom: 2,
              cursor: 'pointer', lineHeight: 1.4, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            <span style={{ color: SHIFT_DOT[d.shift] || '#888', fontWeight: 700 }}>
              {t.dutySchedule.shifts[d.shift]?.charAt(0)}
            </span>
            {' '}
            <span style={{ color: '#333' }}>
              {d.personnel?.dharmName || d.personnel?.fullName || '?'}
            </span>
          </li>
        ))}
        {dayDuties.length > 3 && (
          <li style={{ color: '#888', paddingLeft: 4 }}>+{dayDuties.length - 3}</li>
        )}
      </ul>
    );
  };

  const columns = [
    {
      title: t.dutySchedule.colDate,
      dataIndex: 'dutyDate',
      width: 160,
      render: (v) => dayjs(v).format('DD/MM/YYYY (ddd)'),
      sorter: (a, b) => a.dutyDate.localeCompare(b.dutyDate),
    },
    {
      title: t.dutySchedule.colDuty,
      dataIndex: 'dutyType',
      width: 180,
      render: (v) => t.dutySchedule.dutyTypes[v] || v,
    },
    {
      title: t.dutySchedule.colShift,
      dataIndex: 'shift',
      width: 90,
      render: (v) => <Tag color={shiftColors[v]}>{t.dutySchedule.shifts[v] || v}</Tag>,
    },
    {
      title: t.dutySchedule.colPerson,
      width: 160,
      render: (_, r) => {
        const p = r.personnel;
        return p ? (p.dharmName || p.fullName) : '—';
      },
    },
    {
      title: t.dutySchedule.colTime,
      width: 120,
      render: (_, r) => r.startTime && r.endTime ? `${r.startTime} - ${r.endTime}` : '—',
    },
    {
      title: t.common.status,
      dataIndex: 'status',
      width: 130,
      render: (v) => <Badge status={statusColors[v] || 'default'} text={t.dutySchedule.statuses[v] || v} />,
    },
    {
      title: t.common.actions,
      width: 100,
      render: (_, r) => canManage() && (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openModal(r)} />
          <Popconfirm title={t.dutySchedule.confirmDelete} onConfirm={() => handleDelete(r.id)} okText={t.common.delete} cancelText={t.common.cancel}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      {/* Toolbar */}
      <div className="duty-schedule-toolbar">
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
            disabled={viewMode === 'calendar'}
            placeholder={[t.dutySchedule.rangePickerFrom, t.dutySchedule.rangePickerTo]}
          />
        </Space>
        <Space>
          <Button icon={<FileExcelOutlined />} onClick={handleExport}
            style={{ color: '#217346', borderColor: '#217346' }}>
            Excel
          </Button>
          {canManage() && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}
              style={{ backgroundColor: '#1565c0', borderColor: '#1565c0' }}>
              {t.dutySchedule.addNew}
            </Button>
          )}
        </Space>
      </div>

      {/* View toggle */}
      <Tabs
        activeKey={viewMode}
        onChange={(k) => {
          setViewMode(k);
          if (k === 'calendar') {
            const start = calendarValue.startOf('month');
            const end = calendarValue.endOf('month');
            setDateRange([start, end]);
          }
        }}
        size="small"
        style={{ marginBottom: 8 }}
        items={[
          {
            key: 'table',
            label: <span><TableOutlined /> {t.dutySchedule.viewTable}</span>,
          },
          {
            key: 'calendar',
            label: <span><CalendarOutlined /> {t.dutySchedule.viewCalendar}</span>,
          },
        ]}
      />

      {/* Table view */}
      {viewMode === 'table' && (
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          className="personnel-table"
          scroll={{ x: 960 }}
        />
      )}

      {/* Calendar view */}
      {viewMode === 'calendar' && (
        <div className="duty-calendar-wrap">
          <Calendar
            value={calendarValue}
            onPanelChange={handleCalendarPanelChange}
            cellRender={(current, info) => {
              if (info.type === 'date') return calendarCellRender(current);
              return null;
            }}
            onSelect={(date, { source }) => {
              if (source === 'date' && canManage()) openModal(null, date);
            }}
          />
          <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {Object.entries(SHIFT_DOT).map(([k, color]) => (
              <span key={k} style={{ fontSize: 12, color: '#555' }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: color, marginRight: 4 }} />
                {t.dutySchedule.shifts[k]}
              </span>
            ))}
            <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>{t.dutySchedule.calendarClickHint}</span>
          </div>
        </div>
      )}

      {/* Form modal */}
      <Modal
        title={editRecord ? t.dutySchedule.editTitle : t.dutySchedule.addTitle}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editRecord ? t.common.update : t.common.add}
        cancelText={t.common.cancel}
        okButtonProps={{ style: { backgroundColor: '#8B4513', borderColor: '#8B4513' } }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="personnelId" label={t.dutySchedule.fields.person} rules={[{ required: true }]}>
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
              <Form.Item name="dutyDate" label={t.dutySchedule.fields.date} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dutyType" label={t.dutySchedule.fields.dutyType} rules={[{ required: true }]}>
                <Select>
                  {dutyTypeOptions.map(o => (
                    <Option key={o.value} value={o.value}>
                      {t.dutySchedule.dutyTypes[o.value] || o.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shift" label={t.dutySchedule.fields.shift} rules={[{ required: true }]}>
                <Select>
                  <Option value="sáng">{t.dutySchedule.shifts['sáng']}</Option>
                  <Option value="chiều">{t.dutySchedule.shifts['chiều']}</Option>
                  <Option value="tối">{t.dutySchedule.shifts['tối']}</Option>
                  <Option value="cả_ngày">{t.dutySchedule.shifts['cả_ngày']}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="startTime" label={t.dutySchedule.fields.startTime}>
                <Input placeholder="07:00" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="endTime" label={t.dutySchedule.fields.endTime}>
                <Input placeholder="12:00" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label={t.common.status} initialValue="chờ">
            <Select>
              <Option value="chờ">{t.dutySchedule.statuses['chờ']}</Option>
              <Option value="hoàn_thành">{t.dutySchedule.statuses['hoàn_thành']}</Option>
              <Option value="vắng">{t.dutySchedule.statuses['vắng']}</Option>
              <Option value="đổi_ca">{t.dutySchedule.statuses['đổi_ca']}</Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label={t.common.notes}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
