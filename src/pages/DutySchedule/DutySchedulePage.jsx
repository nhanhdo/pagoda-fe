import React, { useState } from 'react';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import {
  Card, Table, Button, Select, DatePicker, Space, Tag, Modal, Form,
  Input, message, Popconfirm, Badge, Row, Col, Tabs, Descriptions,
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
import DutyCalendar, { monthGridRange } from './DutyCalendar';
import './DutySchedulePage.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function DutySchedulePage() {
  const {
    data, loading, dateRange, setDateRange,
    modalOpen, setModalOpen,
    editRecord, setEditRecord,
    personnel, canManage,
    fetchData, handleDelete,
  } = useDutySchedulePage();

  const { t, lang } = useLanguage();
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

  // Load every day visible in the grid, including leading/trailing days of adjacent months
  const handleCalendarMonthChange = (value) => {
    setCalendarValue(value);
    setDateRange(monthGridRange(value));
  };

  const dutyPopoverContent = (d, close) => (
    <div style={{ width: 260 }}>
      <Descriptions column={1} size="small" style={{ marginBottom: canManage() ? 10 : 0 }}>
        <Descriptions.Item label={t.dutySchedule.fields.person}>
          <strong>{d.personnel?.dharmName || d.personnel?.fullName || '—'}</strong>
        </Descriptions.Item>
        <Descriptions.Item label={t.dutySchedule.fields.date}>
          {dayjs(d.dutyDate).format('DD/MM/YYYY (ddd)')}
        </Descriptions.Item>
        <Descriptions.Item label={t.dutySchedule.fields.dutyType}>
          {t.dutySchedule.dutyTypes[d.dutyType] || d.dutyType}
        </Descriptions.Item>
        <Descriptions.Item label={t.dutySchedule.fields.shift}>
          <Tag color={shiftColors[d.shift]}>{t.dutySchedule.shifts[d.shift] || d.shift}</Tag>
        </Descriptions.Item>
        {(d.startTime || d.endTime) && (
          <Descriptions.Item label={t.dutySchedule.colTime}>
            {d.startTime} – {d.endTime}
          </Descriptions.Item>
        )}
        <Descriptions.Item label={t.common.status}>
          <Badge status={statusColors[d.status] || 'default'} text={t.dutySchedule.statuses[d.status] || d.status} />
        </Descriptions.Item>
        {d.notes && (
          <Descriptions.Item label={t.common.notes}>{d.notes}</Descriptions.Item>
        )}
      </Descriptions>
      {canManage() && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
          <Popconfirm
            title={t.dutySchedule.confirmDelete}
            onConfirm={() => { close(); handleDelete(d.id); }}
            okText={t.common.delete} cancelText={t.common.cancel}
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>{t.common.delete}</Button>
          </Popconfirm>
          <Button
            size="small" type="primary" icon={<EditOutlined />}
            onClick={() => { close(); openModal(d); }}
          >
            {t.common.edit}
          </Button>
        </div>
      )}
    </div>
  );

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

  if (loading && !data.length) return <PageSpinner />;

  return (
    <Card>
      {/* Toolbar */}
      <div className="duty-schedule-toolbar section-anim section-d0">
        <Space wrap>
          {viewMode === 'table' && (
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              placeholder={[t.dutySchedule.rangePickerFrom, t.dutySchedule.rangePickerTo]}
            />
          )}
        </Space>
        <Space>
          <Button icon={<FileExcelOutlined />} onClick={handleExport}>
            Excel
          </Button>
          {canManage() && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              {t.dutySchedule.addNew}
            </Button>
          )}
        </Space>
      </div>

      {/* View toggle */}
      <div className="section-anim section-d1">
      <Tabs
        activeKey={viewMode}
        onChange={(k) => {
          setViewMode(k);
          if (k === 'calendar') setDateRange(monthGridRange(calendarValue));
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
          scroll={{ x: 'max-content' }}
        />
      )}

      {/* Calendar view */}
      {viewMode === 'calendar' && (
        <DutyCalendar
          data={data}
          month={calendarValue}
          onMonthChange={handleCalendarMonthChange}
          canManage={canManage()}
          onAdd={(day) => openModal(null, day)}
          onEdit={(d) => openModal(d)}
          onDelete={handleDelete}
          renderDetails={dutyPopoverContent}
          t={t}
          lang={lang}
        />
      )}
      </div>

      {/* Form modal */}
      <Modal
        title={editRecord ? t.dutySchedule.editTitle : t.dutySchedule.addTitle}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editRecord ? t.common.update : t.common.add}
        cancelText={t.common.cancel}
        okButtonProps={{ style: { backgroundColor: '#b06f2c', borderColor: '#b06f2c' } }}
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
