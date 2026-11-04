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
      <div className="duty-cell-events">
        {dayDuties.slice(0, 3).map((d) => (
          <Tooltip
            key={d.id}
            title={
              <div style={{ fontSize: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>
                  {t.dutySchedule.shifts[d.shift] || d.shift}
                </div>
                <div>{d.personnel?.dharmName || d.personnel?.fullName}</div>
                {d.startTime && d.endTime && (
                  <div style={{ color: '#ffd59e' }}>{d.startTime} – {d.endTime}</div>
                )}
                {d.notes && <div style={{ color: '#ccc', marginTop: 2 }}>{d.notes}</div>}
              </div>
            }
            mouseEnterDelay={0.4}
          >
            <div
              onClick={(e) => { e.stopPropagation(); openModal(d); }}
              className={`duty-event duty-shift-${d.shift?.replace('_', '-')}`}
            >
              <span className="duty-event-pill">
                {t.dutySchedule.shifts[d.shift]?.charAt(0) || '?'}
              </span>
              <span className="duty-event-name">
                {d.personnel?.dharmName || d.personnel?.fullName || '?'}
              </span>
              {d.startTime && (
                <span className="duty-event-time">{d.startTime}</span>
              )}
            </div>
          </Tooltip>
        ))}
        {dayDuties.length > 3 && (
          <div className="duty-event-more">+{dayDuties.length - 3} ca</div>
        )}
      </div>
    );
  };

  const columns = [
    {
      title: t.dutySchedule.colDate,
      dataIndex: 'dutyDate',
      width: 140,
      render: (v) => dayjs(v).format('DD/MM/YYYY (ddd)'),
      sorter: (a, b) => a.dutyDate.localeCompare(b.dutyDate),
    },
    {
      title: t.dutySchedule.colDuty,
      dataIndex: 'dutyType',
      width: 220,
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
      width: 150,
      render: (_, r) => {
        const p = r.personnel;
        return p ? (p.dharmName || p.fullName) : '—';
      },
    },
    {
      title: t.dutySchedule.colTime,
      width: 110,
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
      width: 90,
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
        />
      )}

      {/* Calendar view */}
      {viewMode === 'calendar' && (
        <div className="duty-calendar-wrap">
          {/* Stats row */}
          <div className="duty-stats-row">
            {Object.entries(SHIFT_DOT).map(([shift, color]) => {
              const count = data.filter((d) => d.shift === shift).length;
              return (
                <div key={shift} className="duty-stat-chip">
                  <span className="duty-stat-dot" style={{ background: color }} />
                  <span>{t.dutySchedule.shifts[shift]}</span>
                  <span className="duty-stat-count" style={{ color }}>{count}</span>
                </div>
              );
            })}
            <div className="duty-stat-chip" style={{ marginLeft: 'auto', background: '#f9f3ed', borderColor: '#d4b896' }}>
              <span style={{ color: '#8B4513', fontWeight: 700, fontSize: 13 }}>{data.length}</span>
              <span style={{ color: '#6b4226' }}>ca tổng</span>
            </div>
          </div>

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

          {/* Legend */}
          <div className="duty-legend-bar">
            {Object.entries(SHIFT_DOT).map(([k, color]) => (
              <div key={k} className="duty-legend-item">
                <span className="duty-legend-swatch" style={{ background: color }} />
                <span>{t.dutySchedule.shifts[k]}</span>
              </div>
            ))}
            {canManage() && (
              <span className="duty-legend-hint">{t.dutySchedule.calendarClickHint}</span>
            )}
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
