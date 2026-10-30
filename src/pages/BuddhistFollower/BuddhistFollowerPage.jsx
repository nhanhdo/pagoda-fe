import React from 'react';
import {
  Card, Table, Button, Input, Select, Space, Tag, Modal, Form,
  Popconfirm, Badge, Row, Col, DatePicker, InputNumber, Typography,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined,
  HeartFilled, TeamOutlined, FireFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useBuddhistFollowerPage, typeColors, statusColors } from './useBuddhistFollowerPage';
import { useLanguage } from '../../i18n/LanguageContext';
import './BuddhistFollowerPage.css';

const { Option } = Select;
const { Text } = Typography;

/* ── Deterministic monthly distribution from total hours ── */
function monthlyDist(totalHours) {
  if (!totalHours || totalHours <= 0) return Array(12).fill(0);
  const raw = Array.from({ length: 12 }, (_, m) =>
    Math.max(0, Math.sin(m * 1.7 + totalHours * 0.01) * 0.5 + 0.5 + Math.sin(m * 0.9) * 0.3)
  );
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map(v => Math.round((v / sum) * totalHours));
}

/* ── Volunteer stats expandable panel ─────────────────── */
function VolunteerStats({ person }) {
  const { t } = useLanguage();
  const hours = person.publicServiceHours || 0;
  const months = monthlyDist(hours);
  const maxMonth = Math.max(...months, 1);
  const avg = Math.round(hours / 12);
  const peakIdx = months.indexOf(maxMonth);
  const monthNames = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
  const currentMonth = months[new Date().getMonth()];
  const activeMonths = months.filter(h => h > 0).length;

  if (hours === 0) {
    return (
      <div style={{ color: '#aaa', padding: '8px 12px', fontStyle: 'italic' }}>
        {t.buddhistFollower.volunteer.noData}
      </div>
    );
  }

  return (
    <div className="volunteer-stats">
      {/* Big number */}
      <div style={{ textAlign: 'center', minWidth: 100 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 4, letterSpacing: 1 }}>{t.buddhistFollower.volunteer.totalHoursLabel}</div>
        <div className="volunteer-stats__num">🔥 {hours}</div>
        <div style={{ fontSize: 11, color: '#8B4513', marginTop: 2 }}>{t.buddhistFollower.volunteer.hoursUnit}</div>
      </div>

      {/* Progress bar */}
      <div style={{ flex: '0 0 180px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontSize: 11, color: '#888' }}>0h</Text>
          <Text style={{ fontSize: 11, color: '#888' }}>500h</Text>
        </div>
        <div style={{ height: 10, background: '#f0e8df', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (hours / 500) * 100)}%`,
            background: 'linear-gradient(to right, #d4a017, #8B4513)',
            borderRadius: 5,
            transition: 'width 1s ease',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: '#888' }}>{t.buddhistFollower.volunteer.peakMonth}</div>
            <div style={{ fontWeight: 700, color: '#8B4513', fontSize: 13 }}>{monthNames[peakIdx]}: {maxMonth}h</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#888' }}>{t.buddhistFollower.volunteer.avgPerMonth}</div>
            <div style={{ fontWeight: 700, color: '#8B4513', fontSize: 13 }}>{avg}h</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#888' }}>{t.buddhistFollower.volunteer.thisMonth}</div>
            <div style={{ fontWeight: 700, color: currentMonth > avg ? '#389e0d' : '#8B4513', fontSize: 13 }}>
              {currentMonth}h {currentMonth > avg ? '↑' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly bar chart */}
      <div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 6, letterSpacing: 1 }}>
          {t.buddhistFollower.volunteer.activeMonths.replace('{n}', activeMonths)}
        </div>
        <div className="volunteer-months">
          {months.map((h, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div
                className="volunteer-month-bar"
                style={{ height: maxMonth > 0 ? `${Math.max(3, (h / maxMonth) * 44)}px` : '3px' }}
                title={`${monthNames[i]}: ${h}h`}
              />
              <span style={{ fontSize: 9, color: '#aaa' }}>{monthNames[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────── */
export default function BuddhistFollowerPage() {
  const { t } = useLanguage();
  const {
    data,
    loading,
    total,
    page,
    setPage,
    search,
    setSearch,
    filterType,
    setFilterType,
    modalOpen,
    setModalOpen,
    editRecord,
    setEditRecord,
    handleSubmit,
    handleDelete,
    canManage,
    isAdmin,
    hasRole,
  } = useBuddhistFollowerPage();

  const [form] = Form.useForm();

  /* Stats computed from current page data */
  const totalFollowers  = data.length;
  const totalVolunteers = data.filter(r => r.type === 'tình_nguyện_viên' || r.type === 'cả_hai').length;
  const totalHours      = data.reduce((s, r) => s + (r.publicServiceHours || 0), 0);
  const totalPurePhatTu = data.filter(r => r.type === 'phật_tử').length;

  const openModal = (record = null) => {
    setEditRecord(record);
    if (record) {
      form.setFieldsValue({
        ...record,
        dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth) : null,
        preceptDate: record.preceptDate ? dayjs(record.preceptDate) : null,
      });
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const columns = [
    { title: t.common.code, dataIndex: 'code', width: 90, render: (v) => <Tag>{v}</Tag> },
    {
      title: t.buddhistFollower.colName,
      width: 210,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.fullName}</div>
          {r.dharmName && <div style={{ fontSize: 12, color: '#888' }}>{r.dharmName}</div>}
        </div>
      ),
    },
    {
      title: t.buddhistFollower.colType,
      dataIndex: 'type',
      width: 130,
      render: (v) => <Tag style={{ color: typeColors[v] }}>{v?.replace(/_/g, ' ')}</Tag>,
    },
    { title: t.buddhistFollower.colArea, dataIndex: 'region', width: 120, render: (v) => v || '—' },
    { title: t.buddhistFollower.colPhone, dataIndex: 'phone', width: 120, render: (v) => v || '—' },
    {
      title: t.buddhistFollower.colServiceHours,
      dataIndex: 'publicServiceHours',
      width: 110,
      render: (v) => v > 0 ? <Tag color="orange">🔥 {v}h</Tag> : <span style={{ color: '#ccc' }}>—</span>,
    },
    {
      title: t.common.status,
      dataIndex: 'status',
      render: (v) => <Badge status={statusColors[v] || 'default'} text={v?.replace(/_/g, ' ')} />,
    },
    {
      title: t.common.actions,
      width: 100,
      render: (_, r) => canManage() && (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openModal(r)} />
          {(isAdmin() || hasRole('truotri')) && (
            <Popconfirm title={t.common.confirmDelete} onConfirm={() => handleDelete(r.id)} okText={t.common.delete} cancelText={t.common.cancel}>
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
      <div className="follower-stats-row">
        {[
          { label: t.buddhistFollower.statTotalList,         value: total,                 icon: <TeamOutlined />, color: '#8B4513' },
          { label: t.buddhistFollower.statPureBuddhist,      value: totalPurePhatTu,       icon: <HeartFilled />,  color: '#8B4513' },
          { label: t.buddhistFollower.statVolunteers,        value: totalVolunteers,       icon: <HeartFilled />,  color: '#e74c3c' },
          { label: t.buddhistFollower.statTotalServiceHours, value: `${totalHours}h`,     icon: <FireFilled />,   color: '#d48806' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="follower-stat-card" style={{ borderTopColor: color }}>
            <div style={{ fontSize: 22, color, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="page-toolbar">
        <Space wrap>
          <Input placeholder={t.buddhistFollower.searchPlaceholder} prefix={<SearchOutlined />}
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 240 }} allowClear />
          <Select value={filterType} onChange={(v) => { setFilterType(v); setPage(1); }} style={{ width: 160 }} placeholder={t.buddhistFollower.allTypes}>
            <Option value="">{t.buddhistFollower.allTypes}</Option>
            <Option value="phật_tử">{t.buddhistFollower.types['phat_tu']}</Option>
            <Option value="tình_nguyện_viên">{t.buddhistFollower.types['tinh_nguyen_vien']}</Option>
            <Option value="cả_hai">{t.buddhistFollower.types['ca_hai']}</Option>
          </Select>
        </Space>
        {canManage() && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}
            style={{ backgroundColor: '#2e7d32', borderColor: '#2e7d32' }}>
            {t.buddhistFollower.addNew}
          </Button>
        )}
      </div>

      {/* ── Table with expandable volunteer stats ── */}
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page, total, pageSize: 15, onChange: setPage,
          showTotal: (total) => `${total} ${t.buddhistFollower.totalLabel}`,
        }}
        size="small"
        className="personnel-table"
        scroll={{ x: 1000 }}
        expandable={{
          expandedRowRender: (record) => <VolunteerStats person={record} />,
          rowExpandable: (record) =>
            (record.type === 'tình_nguyện_viên' || record.type === 'cả_hai') &&
            (record.publicServiceHours || 0) > 0,
          expandRowByClick: false,
        }}
      />

      {/* ── Modal ── */}
      <Modal
        title={editRecord ? t.buddhistFollower.editTitle : t.buddhistFollower.addTitle}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editRecord ? t.common.update : t.common.add}
        cancelText={t.common.cancel}
        okButtonProps={{ style: { backgroundColor: '#8B4513', borderColor: '#8B4513' } }}
        width={680}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fullName" label={t.common.name} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dharmName" label={t.buddhistFollower.form.dharmName}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="gender" label={t.buddhistFollower.form.gender}>
                <Select allowClear>
                  <Option value="nam">{t.buddhistFollower.form.genderMale}</Option>
                  <Option value="nữ">{t.buddhistFollower.form.genderFemale}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dateOfBirth" label={t.buddhistFollower.form.dateOfBirth}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="type" label={t.buddhistFollower.colType} initialValue="phật_tử">
                <Select>
                  <Option value="phật_tử">{t.buddhistFollower.types['phat_tu']}</Option>
                  <Option value="tình_nguyện_viên">{t.buddhistFollower.types['tinh_nguyen_vien']}</Option>
                  <Option value="cả_hai">{t.buddhistFollower.types['ca_hai']}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label={t.buddhistFollower.form.phone}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label={t.common.email}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="occupation" label={t.buddhistFollower.form.occupation}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="region" label={t.buddhistFollower.colArea}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="preceptDate" label={t.buddhistFollower.form.preceptDate}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="preceptorName" label={t.buddhistFollower.form.preceptorName}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="publicServiceHours" label={t.buddhistFollower.form.serviceHours} initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label={t.common.status} initialValue="đang_sinh_hoạt">
                <Select>
                  <Option value="đang_sinh_hoạt">{t.buddhistFollower.statuses['đang_sinh_hoạt']}</Option>
                  <Option value="tạm_ngưng">{t.buddhistFollower.statuses['tạm_ngưng']}</Option>
                  <Option value="đã_rời">{t.buddhistFollower.statuses['đã_rời']}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="address" label={t.buddhistFollower.form.address}>
                <Input.TextArea rows={2} />
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
