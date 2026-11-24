import React, { useState } from 'react';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import CountUp from '../../components/CountUp/CountUp';
import LotusEmpty from '../../components/LotusEmpty/LotusEmpty';
import {
  Table, Button, Input, Modal, Form, Popconfirm, Row, Col, DatePicker,
  InputNumber, Select, Segmented, Avatar, Tooltip, message as antMessage,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined,
  HeartOutlined, CalendarOutlined, UserOutlined, DownloadOutlined,
  WalletOutlined, BankOutlined, EllipsisOutlined, RiseOutlined, FallOutlined,
  EyeInvisibleOutlined, PrinterOutlined, FileDoneOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDonationPage } from './useDonationPage';
import { useLanguage } from '../../i18n/LanguageContext';
import { exportToExcel } from '../../utils/exportData';
import api from '../../api/axios';
import { printReceipt, printThankYou } from '../../utils/printDocs';
import { initializeForm, guardedClose, rules } from '../../utils/formGuard';
import './DonationPage.css';

const { RangePicker } = DatePicker;

const METHOD = {
  'tiền_mặt':     { c: '#4f9a72', s: '#e8f4ed', icon: <WalletOutlined /> },
  'chuyển_khoản': { c: '#4d8fc7', s: '#e9f1fb', icon: <BankOutlined /> },
  'khác':         { c: '#d39a2c', s: '#fdf3dc', icon: <EllipsisOutlined /> },
};
const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];

const vnd = (val) => `${Number(val || 0).toLocaleString('vi-VN')} ₫`;

function compactVnd(val, lang) {
  const n = Number(val || 0);
  const fmt = (x) => x.toLocaleString(lang === 'en' ? 'en-US' : 'vi-VN', { maximumFractionDigits: 1 });
  if (lang === 'en') {
    if (n >= 1e9) return `${fmt(n / 1e9)}B ₫`;
    if (n >= 1e6) return `${fmt(n / 1e6)}M ₫`;
    if (n >= 1e3) return `${fmt(n / 1e3)}K ₫`;
    return `${fmt(n)} ₫`;
  }
  if (n >= 1e9) return `${fmt(n / 1e9)} tỷ`;
  if (n >= 1e6) return `${fmt(n / 1e6)} triệu`;
  if (n >= 1e3) return `${fmt(n / 1e3)} nghìn`;
  return `${fmt(n)} ₫`;
}

const initialOf = (name = '') => name.trim().split(/\s+/).pop()?.[0]?.toUpperCase() || '?';

export default function DonationPage() {
  const { t, lang } = useLanguage();
  const D = t.donation;
  const {
    data, loading, total, page, setPage,
    search, setSearch,
    dateRange, setDateRange,
    funds, fundFilter, setFundFilter,
    modalOpen, setModalOpen, saving,
    editRecord, setEditRecord,
    followers, summary,
    handleSubmit, handleDelete,
    canManage, isAdmin, hasRole,
  } = useDonationPage();

  const [form] = Form.useForm();
  const [exporting, setExporting] = useState(false);
  const dateLocale = lang === 'en' ? 'en-US' : 'vi-VN';

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

      const X = D.exportCols || {};
      exportToExcel(rows, [
        { header: X.date || 'Ngày cúng dường', render: (row) => row.donationDate ? dayjs(row.donationDate).format('DD/MM/YYYY') : '' },
        { header: X.donor || 'Phật tử / Người cúng', render: (row) => row.buddhistFollower
            ? (row.buddhistFollower.dharmName ? `${row.buddhistFollower.fullName} (${row.buddhistFollower.dharmName})` : row.buddhistFollower.fullName)
            : (row.donorName || D.anonymous) },
        { header: X.code || 'Mã PT',          render: (row) => row.buddhistFollower?.code || '' },
        { header: X.amount || 'Số tiền (VNĐ)',  render: (row) => Number(row.amount) || 0 },
        { header: X.fund || 'Quỹ',            render: (row) => row.fund?.name || '' },
        { header: X.receiptNo || 'Số phiếu thu',   render: (row) => row.receiptNo || '' },
        { header: X.purpose || 'Mục đích',       render: (row) => row.purpose || '' },
        { header: X.method || 'Hình thức',      render: (row) => D.methods[row.paymentMethod] || '' },
        { header: X.receiver || 'Người nhận',     render: (row) => row.receivedBy || '' },
        { header: X.notes || 'Ghi chú',        render: (row) => row.notes || '' },
      ], `danh-sach-cung-duong_${dateLabel}`);
    } catch {
      antMessage.error(D.exportError || t.common.error);
    } finally {
      setExporting(false);
    }
  };

  const openModal = (record = null) => {
    setEditRecord(record);
    if (record) {
      initializeForm(form, { ...record, donationDate: record.donationDate ? dayjs(record.donationDate) : null });
    } else {
      form.resetFields();
      const general = funds.find(x => x.code === 'QUY_CHUNG');
      initializeForm(form, { paymentMethod: 'tiền_mặt', donationDate: dayjs(), fundId: general?.id });
    }
    setModalOpen(true);
  };

  /* ── Derived summary ── */
  const totalAmount = Number(summary.totalAmount || 0);
  const count = Number(summary.count || 0);
  const avg = count ? totalAmount / count : 0;
  const thisMonth = Number(summary.thisMonthAmount || 0);
  const lastMonth = Number(summary.lastMonthAmount || 0);
  const trend = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;
  const byMethod = (summary.byMethod || []).filter(m => m.amount > 0);
  const rangeLabel = dateRange?.[0] && dateRange?.[1]
    ? `${dateRange[0].format('DD/MM/YYYY')} – ${dateRange[1].format('DD/MM/YYYY')}`
    : D.allTime;
  const filtered = Boolean(search || dateRange?.[0]);

  const presets = [
    { label: D.presets.thisMonth,   value: [dayjs().startOf('month'), dayjs().endOf('month')] },
    { label: D.presets.lastMonth,   value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
    { label: D.presets.last3Months, value: [dayjs().subtract(2, 'month').startOf('month'), dayjs().endOf('month')] },
    { label: D.presets.thisYear,    value: [dayjs().startOf('year'), dayjs().endOf('year')] },
  ];

  const columns = [
    {
      title: D.colDate,
      dataIndex: 'donationDate',
      width: 130,
      render: (v, r) => v ? (
        <div className="dn-date">
          <div className="dn-date__main tbl-mono">{dayjs(v).format('DD/MM/YYYY')}</div>
          <div className="dn-date__sub">{new Date(v).toLocaleDateString(dateLocale, { weekday: 'long' })}</div>
          {r.receiptNo && <div className="dn-date__receipt tbl-mono">{r.receiptNo}</div>}
        </div>
      ) : <span className="tbl-muted">—</span>,
    },
    {
      title: D.colDonor,
      key: 'donor',
      width: 250,
      render: (_, r) => {
        const f = r.buddhistFollower;
        if (f) {
          return (
            <div className="person-cell">
              <Avatar size={38} className="person-cell__avatar" style={{ background: '#fbf1e4', color: '#c47f36' }}>{initialOf(f.fullName)}</Avatar>
              <div className="person-cell__text">
                <div className="person-cell__name">{f.fullName}</div>
                <div className="person-cell__sub">
                  {f.dharmName && <span>{f.dharmName}</span>}
                  {f.dharmName && f.code && <span className="person-cell__sep">·</span>}
                  {f.code && <span className="tbl-mono">{f.code}</span>}
                </div>
              </div>
            </div>
          );
        }
        if (r.donorName) {
          return (
            <div className="person-cell">
              <Avatar size={38} className="person-cell__avatar" style={{ background: '#f2ede6', color: '#8c7a6b' }}>{initialOf(r.donorName)}</Avatar>
              <div className="person-cell__text">
                <div className="person-cell__name">{r.donorName}</div>
                <div className="person-cell__sub">{D.outsideList}</div>
              </div>
            </div>
          );
        }
        return (
          <div className="person-cell">
            <Avatar size={38} className="person-cell__avatar" style={{ background: '#f4f0f9', color: '#9d8cc2' }} icon={<EyeInvisibleOutlined />} />
            <div className="person-cell__text">
              <div className="person-cell__name dn-anon">{D.anonymous}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: D.colAmount,
      dataIndex: 'amount',
      width: 160,
      align: 'right',
      sorter: (a, b) => Number(a.amount) - Number(b.amount),
      render: (v) => <span className="dn-amount tbl-mono">{vnd(v)}</span>,
    },
    {
      title: D.colFund,
      key: 'fund',
      width: 180,
      render: (_, r) => {
        const color = r.fund?.color || '#c47f36';
        return r.fund ? <span className="tbl-pill tbl-pill--wrap" style={{ color, background: `${color}1f` }}>{r.fund.name}</span> : <span className="tbl-muted">—</span>;
      },
    },
    {
      title: D.colPurpose,
      dataIndex: 'purpose',
      width: 220,
      render: (v) => v
        ? <Tooltip title={v}><span className="dn-purpose">{v}</span></Tooltip>
        : <span className="tbl-muted">—</span>,
    },
    {
      title: D.colMethod,
      dataIndex: 'paymentMethod',
      width: 164,
      render: (v) => {
        const m = METHOD[v] || METHOD['khác'];
        return <span className="tbl-pill" style={{ color: m.c, background: m.s }}>{m.icon}{D.methods[v] || v}</span>;
      },
    },
    {
      title: D.colReceivedBy,
      dataIndex: 'receivedBy',
      width: 140,
      render: (v) => v || <span className="tbl-muted">—</span>,
    },
    {
      title: '',
      key: 'actions',
      width: 170,
      align: 'right',
      render: (_, r) => (
        <div className="personnel-action-group">
          <Tooltip title={D.printReceipt}>
            <Button aria-label={D.printReceipt} type="text" icon={<PrinterOutlined />} onClick={() => printReceipt(r)} />
          </Tooltip>
          <Tooltip title={D.printThanks}>
            <Button aria-label={D.printThanks} type="text" icon={<FileDoneOutlined />} onClick={() => printThankYou(r)} />
          </Tooltip>
          {canManage() && (
            <Tooltip title={t.common.edit}>
              <Button aria-label={t.common.edit} type="text" icon={<EditOutlined />} onClick={() => openModal(r)} />
            </Tooltip>
          )}
          {(isAdmin() || hasRole('truotri')) && (
            <Popconfirm title={D.confirmDelete} onConfirm={() => handleDelete(r.id)} okText={t.common.delete} cancelText={t.common.cancel} okButtonProps={{ danger: true }}>
              <Tooltip title={t.common.delete}>
                <Button aria-label={t.common.delete} type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  if (loading && !data.length) return <PageSpinner />;

  return (
    <div className="dn-page">
      {/* ── Header ── */}
      <section className="dn-hero section-anim section-d0">
        <div className="dn-hero__main">
          <div className="dn-hero__icon"><HeartOutlined /></div>
          <div>
            <h1 className="dn-hero__title">{D.title}</h1>
            <p className="dn-hero__sub">{D.subtitle}</p>
          </div>
        </div>
        <div className="dn-hero__actions">
          <Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport} disabled={total === 0} className="dn-btn">
            {D.exportExcel}
          </Button>
          {canManage() && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} className="dn-btn">
              {D.addNew}
            </Button>
          )}
        </div>
      </section>

      {/* ── Summary ── */}
      <div className="dn-summary section-anim section-d1">
        <div className="dn-total">
          <div className="dn-total__top">
            <span className="dn-total__label">{D.statTotal}</span>
            <span className="dn-total__range"><CalendarOutlined /> {rangeLabel}</span>
          </div>
          <div className="dn-total__amount"><CountUp value={totalAmount} format={vnd} duration={1100} /></div>
          <div className="dn-total__meta">
            <span>≈ {compactVnd(totalAmount, lang)}</span>
            <span className="dn-dot" />
            <span>{D.fromCount.replace('{n}', count.toLocaleString(dateLocale))}</span>
            <span className="dn-dot" />
            <span>{D.perDonation}: <strong>{compactVnd(avg, lang)}</strong></span>
          </div>
          {byMethod.length > 0 && (
            <div className="dn-methods">
              <div className="dn-methods__bar">
                {byMethod.map(m => (
                  <Tooltip key={m.method} title={`${D.methods[m.method] || m.method}: ${vnd(m.amount)}`}>
                    <span style={{ flex: m.amount, background: (METHOD[m.method] || METHOD['khác']).c }} />
                  </Tooltip>
                ))}
              </div>
              <div className="dn-methods__legend">
                {byMethod.map(m => {
                  const tone = METHOD[m.method] || METHOD['khác'];
                  return (
                    <span key={m.method} className="dn-methods__item">
                      <i style={{ background: tone.c }} />
                      {D.methods[m.method] || m.method}
                      <strong>{Math.round((m.amount / totalAmount) * 100)}%</strong>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="dn-stat" style={{ '--st': '#4d8fc7', '--st-soft': '#e9f1fb' }}>
          <span className="dn-stat__icon"><CalendarOutlined /></span>
          <div className="dn-stat__label">{D.statThisMonth}</div>
          <div className="dn-stat__value"><CountUp value={thisMonth} format={(n) => compactVnd(n, lang)} /></div>
          {trend !== null ? (
            <div className={`dn-trend ${trend >= 0 ? 'is-up' : 'is-down'}`}>
              {trend >= 0 ? <RiseOutlined /> : <FallOutlined />} {Math.abs(trend)}% <span>{D.vsLastMonth}</span>
            </div>
          ) : (
            <div className="dn-stat__hint">{D.noPrevMonth}</div>
          )}
        </div>

        <div className="dn-stat" style={{ '--st': '#8b6fc9', '--st-soft': '#f1edfb' }}>
          <span className="dn-stat__icon"><UserOutlined /></span>
          <div className="dn-stat__label">{D.statAnonymous}</div>
          <div className="dn-stat__value"><CountUp value={Number(summary.anonymousCount || 0)} /></div>
          <div className="dn-stat__hint">{D.anonymousOf.replace('{n}', count.toLocaleString(dateLocale))}</div>
        </div>
      </div>

      {/* ── List ── */}
      <section className="dn-card section-anim section-d2">
        <div className="dn-toolbar">
          <Input
            className="dn-search"
            placeholder={D.searchPlaceholder}
            prefix={<SearchOutlined style={{ color: '#bfae99' }} />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            allowClear
          />
          <RangePicker
            value={dateRange}
            onChange={(v) => { setDateRange(v); setPage(1); }}
            format="DD/MM/YYYY"
            placeholder={[D.rangeFrom, D.rangeTo]}
            presets={presets}
            className="dn-range"
            allowClear
          />
          <Select
            allowClear
            className="dn-fund-filter"
            placeholder={D.allFunds}
            value={fundFilter}
            onChange={(v) => { setFundFilter(v); setPage(1); }}
            options={funds.map(x => ({ value: x.id, label: x.name }))}
          />
        </div>

        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page, total, pageSize: 10, onChange: setPage,
            showTotal: (n, range) => `${range[0]}-${range[1]} / ${n} ${D.totalLabel}`,
          }}
          scroll={{ x: 'max-content' }}
          className="personnel-table"
          locale={{
            emptyText: filtered
              ? <LotusEmpty description={D.emptyFiltered} hint={D.emptyFilteredHint} />
              : <LotusEmpty description={D.emptyTitle} hint={canManage() ? D.emptyHint : ''} />,
          }}
        />
      </section>

      {/* ── Add / edit ── */}
      <Modal
        title={editRecord ? D.editTitle : D.addTitle}
        open={modalOpen}
        onCancel={() => guardedClose(form, () => { setModalOpen(false); setEditRecord(null); }, t)}
        maskClosable={false}
        confirmLoading={saving}
        onOk={() => form.submit()}
        okText={editRecord ? t.common.update : t.common.add}
        cancelText={t.common.cancel}
        width={620}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="dn-form">
          <div className="dn-form__section">{D.donorSection}</div>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="buddhistFollowerId" label={D.form.follower}>
                <Select
                  allowClear
                  showSearch
                  placeholder={D.form.followerPlaceholder}
                  filterOption={(input, opt) => String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={(editRecord?.buddhistFollower && !followers.some(f => f.id === editRecord.buddhistFollower.id)
                    ? [editRecord.buddhistFollower, ...followers] : followers
                  ).map((f) => ({ value: f.id, label: f.dharmName ? `${f.fullName} (${f.dharmName})` : f.fullName }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="donorName" label={D.form.donorName}>
                <Input placeholder={D.donorNamePlaceholder} />
              </Form.Item>
            </Col>
          </Row>

          <div className="dn-form__section">{D.donationSection}</div>
          <Form.Item name="fundId" label={D.fieldFund}>
            <Select options={funds.filter(x => x.isActive !== false || x.id === editRecord?.fundId).map(x => ({
              value: x.id,
              label: <span className="dn-fund-opt"><i style={{ background: x.color || '#c47f36' }} />{x.name}</span>,
            }))} />
          </Form.Item>
          <Form.Item name="amount" label={D.form.amount} rules={[{ required: true, message: D.form.amountRequired }, rules(t).min(1)]} style={{ marginBottom: 8 }}>
            <InputNumber
              min={1}
              step={50000}
              size="large"
              style={{ width: '100%' }}
              addonAfter="₫"
              formatter={(v) => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
              parser={(v) => v ? v.replace(/\./g, '') : ''}
            />
          </Form.Item>
          <div className="dn-quick">
            <span className="dn-quick__label">{D.quickAmount}:</span>
            {QUICK_AMOUNTS.map(a => (
              <button key={a} type="button" className="dn-quick__chip" onClick={() => form.setFields([{ name: 'amount', value: a, touched: true, errors: [] }])}>
                {compactVnd(a, lang)}
              </button>
            ))}
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="donationDate" label={D.form.date} rules={[{ required: true, message: D.form.dateRequired }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="receivedBy" label={D.form.receivedBy}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="paymentMethod" label={D.form.method} initialValue="tiền_mặt">
                <Segmented
                  block
                  options={Object.keys(METHOD).map(k => ({
                    value: k,
                    label: <span className="dn-seg"><span style={{ color: METHOD[k].c }}>{METHOD[k].icon}</span>{D.methods[k]}</span>,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="purpose" label={D.form.purpose}>
                <Input placeholder={D.form.purposePlaceholder} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="notes" label={t.common.notes} style={{ marginBottom: 0 }}>
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
