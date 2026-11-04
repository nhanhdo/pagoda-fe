import React, { useState } from 'react';
import {
  Card, Table, Button, Input, Space, Tag, Modal, Form,
  Popconfirm, Row, Col, DatePicker, InputNumber, Select, message as antMessage,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined,
  DollarOutlined, HeartOutlined, CalendarOutlined, UserOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDonationPage } from './useDonationPage';
import { useLanguage } from '../../i18n/LanguageContext';
import { exportToExcel } from '../../utils/exportData';
import api from '../../api/axios';
import './DonationPage.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

const METHOD_COLORS = {
  'tiền_mặt':     '#52c41a',
  'chuyển_khoản': '#1890ff',
  'khác':         '#faad14',
};

function formatAmount(val) {
  if (!val) return '—';
  return Number(val).toLocaleString('vi-VN') + ' ₫';
}

export default function DonationPage() {
  const { t } = useLanguage();
  const {
    data, loading, total, page, setPage,
    search, setSearch,
    dateRange, setDateRange,
    modalOpen, setModalOpen,
    editRecord, setEditRecord,
    followers, summary,
    handleSubmit, handleDelete,
    canManage, isAdmin, hasRole,
  } = useDonationPage();

  const [form] = Form.useForm();
  const [exporting, setExporting] = useState(false);

  const anonymousCount = data.filter(r => !r.buddhistFollowerId).length;

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = { page: 1, limit: 10000 };
      if (search) params.search = search;

      const start = dateRange?.[0];
      const end   = dateRange?.[1];
      if (start) params.startDate = start.format('YYYY-MM-DD');
      if (end)   params.endDate   = end.format('YYYY-MM-DD');

      const r = await api.get('/donations', { params });
      const rows = r.data.data;

      const dateLabel = start && end
        ? `${start.format('DD-MM-YYYY')}_${end.format('DD-MM-YYYY')}`
        : dayjs().format('YYYY-MM-DD');

      exportToExcel(rows, [
        { header: 'Ngày cúng dường', render: (row) => row.donationDate ? dayjs(row.donationDate).format('DD/MM/YYYY') : '' },
        { header: 'Phật tử / Người cúng', render: (row) => row.buddhistFollower
            ? (row.buddhistFollower.dharmName ? `${row.buddhistFollower.fullName} (${row.buddhistFollower.dharmName})` : row.buddhistFollower.fullName)
            : (row.donorName || 'Ẩn danh') },
        { header: 'Mã PT',          render: (row) => row.buddhistFollower?.code || '' },
        { header: 'Số tiền (VNĐ)',  render: (row) => Number(row.amount) || 0 },
        { header: 'Mục đích',       render: (row) => row.purpose || '' },
        { header: 'Hình thức',      render: (row) => ({ 'tiền_mặt': 'Tiền mặt', 'chuyển_khoản': 'Chuyển khoản', 'khác': 'Khác' }[row.paymentMethod] || '') },
        { header: 'Người nhận',     render: (row) => row.receivedBy || '' },
        { header: 'Ghi chú',        render: (row) => row.notes || '' },
      ], `danh-sach-cung-duong_${dateLabel}`);
    } catch {
      antMessage.error('Không thể xuất Excel');
    } finally {
      setExporting(false);
    }
  };

  const openModal = (record = null) => {
    setEditRecord(record);
    if (record) {
      form.setFieldsValue({
        ...record,
        donationDate: record.donationDate ? dayjs(record.donationDate) : null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ paymentMethod: 'tiền_mặt', donationDate: dayjs() });
    }
    setModalOpen(true);
  };

  const columns = [
    {
      title: t.donation.colDate,
      dataIndex: 'donationDate',
      width: 110,
      render: (v) => v ? dayjs(v).format('DD/MM/YYYY') : '—',
    },
    {
      title: t.donation.colDonor,
      width: 200,
      render: (_, r) => {
        const name = r.buddhistFollower
          ? (r.buddhistFollower.dharmName
              ? `${r.buddhistFollower.fullName} (${r.buddhistFollower.dharmName})`
              : r.buddhistFollower.fullName)
          : (r.donorName || <span style={{ color: '#bbb', fontStyle: 'italic' }}>Ẩn danh</span>);
        return <span style={{ fontWeight: 500 }}>{name}</span>;
      },
    },
    {
      title: t.donation.colAmount,
      dataIndex: 'amount',
      width: 140,
      render: (v) => <span style={{ fontWeight: 700, color: '#2e7d32' }}>{formatAmount(v)}</span>,
    },
    {
      title: t.donation.colPurpose,
      dataIndex: 'purpose',
      width: 200,
      render: (v) => v || <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: t.donation.colMethod,
      dataIndex: 'paymentMethod',
      width: 130,
      render: (v) => (
        <Tag style={{ color: METHOD_COLORS[v] || '#888', borderColor: METHOD_COLORS[v] || '#d9d9d9', background: 'transparent' }}>
          {t.donation.methods[v] || v}
        </Tag>
      ),
    },
    {
      title: t.donation.colReceivedBy,
      dataIndex: 'receivedBy',
      width: 130,
      render: (v) => v || <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: t.common.actions,
      width: 90,
      render: (_, r) => canManage() && (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openModal(r)} />
          {(isAdmin() || hasRole('truotri')) && (
            <Popconfirm title={t.donation.confirmDelete} onConfirm={() => handleDelete(r.id)} okText={t.common.delete} cancelText={t.common.cancel}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      {/* ── Summary stats ── */}
      <div className="donation-stats-row">
        {[
          { label: t.donation.statTotal,      value: formatAmount(summary.totalAmount), icon: <DollarOutlined />, color: '#2e7d32' },
          { label: t.donation.statCount,       value: summary.count,                   icon: <HeartOutlined />,  color: '#8B4513' },
          { label: t.donation.statThisMonth,   value: formatAmount(summary.thisMonthAmount), icon: <CalendarOutlined />, color: '#1890ff' },
          { label: t.donation.statAnonymous,   value: anonymousCount,                  icon: <UserOutlined />,   color: '#faad14' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="donation-stat-card" style={{ borderTopColor: color }}>
            <div style={{ fontSize: 22, color, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color, lineHeight: 1.2 }}>{value}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="page-toolbar">
        <Space wrap>
          <Input
            placeholder={t.donation.searchPlaceholder}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 260 }}
            allowClear
          />
          <RangePicker
            value={dateRange}
            onChange={(v) => { setDateRange(v); setPage(1); }}
            format="DD/MM/YYYY"
            placeholder={['Từ ngày', 'Đến ngày']}
            style={{ width: 240 }}
          />
        </Space>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            loading={exporting}
            onClick={handleExport}
            disabled={total === 0}
          >
            Xuất Excel
          </Button>
          {canManage() && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
              style={{ backgroundColor: '#2e7d32', borderColor: '#2e7d32' }}
            >
              {t.donation.addNew}
            </Button>
          )}
        </Space>
      </div>

      {/* ── Table ── */}
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 10,
          onChange: setPage,
          showTotal: (n, range) => `${range[0]}-${range[1]} / ${n} ${t.donation.totalLabel}`,
        }}
        size="small"
        className="personnel-table"
      />

      {/* ── Modal ── */}
      <Modal
        title={editRecord ? t.donation.editTitle : t.donation.addTitle}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditRecord(null); }}
        onOk={() => form.submit()}
        okText={editRecord ? t.common.update : t.common.add}
        cancelText={t.common.cancel}
        okButtonProps={{ style: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' } }}
        width={620}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="buddhistFollowerId" label={t.donation.form.follower}>
                <Select
                  allowClear
                  showSearch
                  placeholder={t.donation.form.followerPlaceholder}
                  filterOption={(input, opt) =>
                    String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={followers.map((f) => ({
                    value: f.id,
                    label: f.dharmName ? `${f.fullName} (${f.dharmName})` : f.fullName,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="donorName" label={t.donation.form.donorName}>
                <Input placeholder="Nhập tên nếu không có trong danh sách" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label={t.donation.form.amount} rules={[{ required: true, message: t.donation.form.amountRequired }]}>
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(v) => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                  parser={(v) => v ? v.replace(/,/g, '') : ''}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="donationDate" label={t.donation.form.date} rules={[{ required: true, message: t.donation.form.dateRequired }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="purpose" label={t.donation.form.purpose}>
                <Input placeholder={t.donation.form.purposePlaceholder} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paymentMethod" label={t.donation.form.method} initialValue="tiền_mặt">
                <Select>
                  <Option value="tiền_mặt">{t.donation.methods['tiền_mặt']}</Option>
                  <Option value="chuyển_khoản">{t.donation.methods['chuyển_khoản']}</Option>
                  <Option value="khác">{t.donation.methods['khác']}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="receivedBy" label={t.donation.form.receivedBy}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="notes" label={t.common.notes}>
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
}
