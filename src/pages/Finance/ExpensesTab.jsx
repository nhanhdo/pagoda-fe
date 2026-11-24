import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Table, Button, Input, Select, DatePicker, Modal, Form, InputNumber, Segmented, Tooltip, Popconfirm, message,
} from 'antd';
import {
  SearchOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, PrinterOutlined,
  WalletOutlined, BankOutlined, EllipsisOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import LotusEmpty from '../../components/LotusEmpty/LotusEmpty';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { printExpenseVoucher } from '../../utils/printDocs';
import { guardedClose, initializeForm } from '../../utils/formGuard';
import { vnd, compactVnd, STATUS_TONE, CATEGORY_COLOR, softOf, personName, presetRanges, ymd, QUICK_AMOUNTS } from './financeShared';
import { pinLeft, PIN_RIGHT } from '../Personnel/personnelShared';

const { RangePicker } = DatePicker;
const METHOD_ICON = { 'tiền_mặt': <WalletOutlined />, 'chuyển_khoản': <BankOutlined />, 'khác': <EllipsisOutlined /> };
const PAGE = 10;

export default function ExpensesTab({ F, t, admin, funds, allFunds, createSignal, onCreateHandled, onChanged, focusExpenseId, focusKey }) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [form] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', fundId: undefined, status: undefined, category: undefined, range: null });
  const [editing, setEditing] = useState(null);       // null | 'new' | expense
  const [saving, setSaving] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [rejectSaving, setRejectSaving] = useState(false);
  const watchFundId = Form.useWatch('fundId', form);
  const watchAmount = Form.useWatch('amount', form);
  const [focusId, setFocusId] = useState(focusExpenseId ? Number(focusExpenseId) : null);

  // Typing waits 300ms before searching; a slower, older response never overwrites a newer one
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => { const id = setTimeout(() => setDebouncedSearch(filters.search), 300); return () => clearTimeout(id); }, [filters.search]);
  const reqId = useRef(0);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const params = { page, limit: PAGE, search: debouncedSearch || undefined, fundId: filters.fundId, status: filters.status, category: filters.category };
      if (filters.range?.[0]) params.startDate = ymd(filters.range[0]);
      if (filters.range?.[1]) params.endDate = ymd(filters.range[1]);
      const { data } = await api.get('/expenses', { params });
      if (id !== reqId.current) return;
      setRows(data.data);
      setTotal(data.total);
    } catch {
      if (id === reqId.current) message.error(F.loadError);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
    // filters.search is intentionally read through debouncedSearch
  }, [page, debouncedSearch, filters.fundId, filters.status, filters.category, filters.range, F.loadError]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  // Notification deep link: fetch that voucher even if it's not on page 1, then highlight it
  useEffect(() => {
    if (!focusExpenseId) return undefined;
    const id = Number(focusExpenseId);
    setFocusId(id);
    api.get(`/expenses/${id}`).then(({ data }) => {
      setRows(r => (r.some(x => x.id === id) ? r : [data, ...r]));
    }).catch(() => {});
    const timer = setTimeout(() => setFocusId(null), 4000);
    return () => clearTimeout(timer);
  }, [focusExpenseId, focusKey]);
  useEffect(() => {
    if (!focusId) return;
    const el = document.querySelector(`[data-row-key="${focusId}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusId, rows]);

  const openForm = (record = null) => {
    setEditing(record || 'new');
    form.resetFields();
    if (record) {
      initializeForm(form, { ...record, amount: Number(record.amount), expenseDate: dayjs(record.expenseDate) });
    } else {
      const general = funds.find(f => f.code === 'QUY_CHUNG') || funds[0];
      initializeForm(form, { fundId: general?.id, expenseDate: dayjs(), paymentMethod: 'tiền_mặt' });
    }
  };
  useEffect(() => {
    if (!createSignal) return;
    openForm();
    onCreateHandled();
  }, [createSignal]);

  const save = async (values) => {
    setSaving(true);
    try {
      const payload = { ...values, expenseDate: values.expenseDate.format('YYYY-MM-DD') };
      if (editing && editing !== 'new') await api.put(`/expenses/${editing.id}`, payload);
      else await api.post('/expenses', payload);
      message.success(F.saved);
      setEditing(null);
      load();
      onChanged();
    } catch (e) {
      message.error(e.response?.data?.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const approve = async (r) => {
    try {
      const { data } = await api.patch(`/expenses/${r.id}/approve`);
      message.success(F.approved);
      if (data.negativeBalance) {
        Modal.warning({ title: F.approved, content: F.negativeWarn.replace('{fund}', r.fund?.name || '').replace('{amount}', vnd(Math.abs(data.fundBalance))) });
      }
      load();
      onChanged();
    } catch (e) {
      message.error(e.response?.data?.message || t.common.error);
    }
  };

  const reject = async ({ reason }) => {
    setRejectSaving(true);
    try {
      await api.patch(`/expenses/${rejecting.id}/reject`, { reason });
      message.success(F.rejected);
      setRejecting(null);
      load();
      onChanged();
    } catch (e) {
      message.error(e.response?.data?.message || t.common.error);
    } finally {
      setRejectSaving(false);
    }
  };

  const remove = async (r) => {
    try {
      await api.delete(`/expenses/${r.id}`);
      message.success(F.deleted);
      load();
      onChanged();
    } catch (e) {
      message.error(e.response?.data?.message || t.common.error);
    }
  };

  const setFilter = (k, v) => { setPage(1); setFilters(f => ({ ...f, [k]: v })); };
  const filtered = Boolean(filters.search || filters.fundId || filters.status || filters.category || filters.range);

  const columns = [
    {
      fixed: pinLeft(),
      title: F.colCode, dataIndex: 'code', width: 130,
      render: (v, r) => (
        <div className="fin-code">
          <span className="tbl-mono">{v}</span>
          <span className="fin-code__date">{dayjs(r.expenseDate).format('DD/MM/YYYY')}</span>
        </div>
      ),
    },
    {
      title: F.colPayee, key: 'payee', width: 260,
      render: (_, r) => (
        <div className="fin-payee">
          <div className="fin-payee__name">{r.payee || <span className="tbl-muted">—</span>}</div>
          {r.description && <Tooltip title={r.description}><div className="fin-payee__desc">{r.description}</div></Tooltip>}
          {r.status === 'từ_chối' && r.rejectReason && <div className="fin-payee__reject">{F.reasonLabel}: {r.rejectReason}</div>}
        </div>
      ),
    },
    {
      title: F.colFund, key: 'fund', width: 140,
      render: (_, r) => {
        const color = r.fund?.color || '#c47f36';
        return <span className="tbl-pill" style={{ color, background: softOf(color) }}>{r.fund?.name}</span>;
      },
    },
    {
      title: F.colCategory, dataIndex: 'category', width: 160,
      render: (v) => (
        <span className="fin-cat"><i style={{ background: CATEGORY_COLOR[v] || '#a8978a' }} />{F.categories[v] || v}</span>
      ),
    },
    {
      title: F.colAmount, dataIndex: 'amount', width: 150, align: 'right',
      render: (v, r) => (
        <div className="fin-amount">
          <span className="tbl-mono">{vnd(v)}</span>
          <span className="fin-amount__method">{METHOD_ICON[r.paymentMethod]} {t.donation.methods[r.paymentMethod]}</span>
        </div>
      ),
    },
    {
      title: F.colStatus, dataIndex: 'status', width: 170,
      render: (v, r) => {
        const tone = STATUS_TONE[v] || STATUS_TONE['chờ_duyệt'];
        return (
          <div className="fin-status">
            <span className="tbl-pill" style={{ color: tone.c, background: tone.s }}><span className="tbl-pill__dot" />{F.statuses[v] || v}</span>
            <span className="fin-status__by">
              {v === 'chờ_duyệt' ? `${t.layout.createdByShort} ${personName(r.creator)}` : `${personName(r.approver)}${r.approvedAt ? ` · ${dayjs(r.approvedAt).format('DD/MM')}` : ''}`}
            </span>
          </div>
        );
      },
    },
    {
      title: '', key: 'actions', fixed: PIN_RIGHT, width: 170, align: 'right',
      render: (_, r) => {
        const pending = r.status === 'chờ_duyệt';
        const mine = r.createdBy === user?.id;
        return (
          <div className="personnel-action-group" onClick={(e) => e.stopPropagation()}>
            {admin && pending && (
              <>
                <Popconfirm title={F.approveConfirm} description={F.approveHint} okText={F.approve} cancelText={t.common.cancel} onConfirm={() => approve(r)}>
                  <Tooltip title={F.approve}><Button aria-label={F.approve} type="text" className="fin-act fin-act--ok" icon={<CheckOutlined />} /></Tooltip>
                </Popconfirm>
                <Tooltip title={F.reject}><Button aria-label={F.reject} type="text" danger icon={<CloseOutlined />} onClick={() => { rejectForm.resetFields(); setRejecting(r); }} /></Tooltip>
              </>
            )}
            {pending && (admin || mine) && (
              <Tooltip title={t.common.edit}><Button aria-label={t.common.edit} type="text" icon={<EditOutlined />} onClick={() => openForm(r)} /></Tooltip>
            )}
            {r.status === 'đã_duyệt' && (
              <Tooltip title={F.print}><Button aria-label={F.print} type="text" icon={<PrinterOutlined />} onClick={() => printExpenseVoucher(r, { category: F.categories[r.category] })} /></Tooltip>
            )}
            {(pending || r.status === 'từ_chối') && (admin || (mine && pending)) && (
              <Popconfirm title={F.deleteConfirm} okText={t.common.delete} cancelText={t.common.cancel} okButtonProps={{ danger: true }} onConfirm={() => remove(r)}>
                <Tooltip title={t.common.delete}><Button aria-label={t.common.delete} type="text" danger icon={<DeleteOutlined />} /></Tooltip>
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <section className="fin-card fin-card--table section-anim section-d2">
      <div className="fin-filters">
        <Input
          className="fin-search"
          allowClear
          prefix={<SearchOutlined style={{ color: '#bfae99' }} />}
          placeholder={F.searchPlaceholder}
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
        />
        <Select allowClear className="fin-select" placeholder={F.allFunds} value={filters.fundId} onChange={(v) => setFilter('fundId', v)}
          options={allFunds.map(f => ({ value: f.id, label: f.name }))} />
        <Select allowClear className="fin-select" placeholder={F.allStatuses} value={filters.status} onChange={(v) => setFilter('status', v)}
          options={Object.entries(F.statuses).map(([value, label]) => ({ value, label }))} />
        <Select allowClear className="fin-select" placeholder={F.allCategories} value={filters.category} onChange={(v) => setFilter('category', v)}
          options={Object.entries(F.categories).map(([value, label]) => ({ value, label }))} />
        <RangePicker className="fin-range" format="DD/MM/YYYY" value={filters.range} onChange={(v) => setFilter('range', v)}
          presets={presetRanges(F).map(p => ({ label: p.label, value: p.value }))} placeholder={[F.rangeFrom, F.rangeTo]} />
      </div>

      <Table
        rowKey="id"
        className="personnel-table"
        dataSource={rows}
        columns={columns}
        loading={loading}
        scroll={{ x: 'max-content' }}
        rowClassName={(r) => (r.id === focusId ? 'fin-row--focus' : '')}
        pagination={{ current: page, pageSize: PAGE, total, onChange: setPage, showTotal: (n, rg) => `${rg[0]}-${rg[1]} / ${n} ${F.totalLabel}` }}
        locale={{
          emptyText: filtered
            ? <LotusEmpty description={F.emptyFiltered} hint={F.emptyFilteredHint} />
            : <LotusEmpty description={F.emptyExpenses} hint={F.emptyExpensesHint} />,
        }}
      />

      {/* Create / edit */}
      <Modal
        open={!!editing}
        title={editing && editing !== 'new' ? `${F.editExpense} · ${editing.code}` : F.addExpense}
        onCancel={() => guardedClose(form, () => setEditing(null), t)}
        maskClosable={false}
        onOk={() => form.submit()}
        okText={editing && editing !== 'new' ? t.common.update : t.common.add}
        cancelText={t.common.cancel}
        confirmLoading={saving}
        width={620}
        destroyOnClose
      >
        <div className="fin-note"><InfoCircleOutlined /> {F.approvalNote}</div>
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="fundId" label={F.fieldFund} rules={[{ required: true, message: F.fundRequired }]}>
            <Select options={funds.map(f => ({
              value: f.id,
              label: (
                <span className="fin-fund-opt">
                  <i style={{ background: f.color || '#c47f36' }} />{f.name}
                  {f.balance !== undefined && <em>{compactVnd(f.balance, lang)}</em>}
                </span>
              ),
            }))} />
          </Form.Item>
          <Form.Item name="amount" label={F.fieldAmount} rules={[{ required: true, message: F.amountRequired }]} style={{ marginBottom: 8 }}>
            <InputNumber min={1} step={50000} size="large" style={{ width: '100%' }} addonAfter="₫"
              formatter={(v) => (v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
              parser={(v) => (v ? v.replace(/\./g, '') : '')} />
          </Form.Item>
          {(() => {
            const fund = funds.find(f => f.id === watchFundId);
            const bal = fund?.balance !== undefined ? Number(fund.balance) : null;
            return bal !== null && Number(watchAmount || 0) > bal ? (
              <div className="fin-note fin-note--warn" style={{ color: '#b4532a', background: '#fdf0e8', marginBottom: 8 }}>
                <InfoCircleOutlined /> {F.overBalanceWarn.replace('{fund}', fund.name).replace('{balance}', vnd(bal))}
              </div>
            ) : null;
          })()}
          <div className="dn-quick">
            <span className="dn-quick__label">{F.quickAmount}:</span>
            {QUICK_AMOUNTS.map(a => (
              <button key={a} type="button" className="dn-quick__chip" onClick={() => form.setFields([{ name: 'amount', value: a, touched: true, errors: [] }])}>{compactVnd(a, lang)}</button>
            ))}
          </div>
          <div className="fin-form-row">
            <Form.Item name="expenseDate" label={F.fieldDate} rules={[{ required: true, message: F.dateRequired }]}>
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="category" label={F.fieldCategory} rules={[{ required: true, message: t.common.validation.select.replace('{field}', F.fieldCategory) }]}>
              <Select placeholder={F.fieldCategory} options={Object.entries(F.categories).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
          </div>
          <Form.Item name="payee" label={F.fieldPayee}><Input /></Form.Item>
          <Form.Item name="description" label={F.fieldDescription}><Input placeholder={F.descriptionPlaceholder} /></Form.Item>
          <Form.Item name="paymentMethod" label={F.fieldMethod}>
            <Segmented block options={Object.keys(METHOD_ICON).map(k => ({ value: k, label: <span className="dn-seg">{METHOD_ICON[k]}{t.donation.methods[k]}</span> }))} />
          </Form.Item>
          <Form.Item name="notes" label={F.fieldNotes} style={{ marginBottom: 0 }}><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* Reject */}
      <Modal
        open={!!rejecting}
        title={`${F.rejectTitle} · ${rejecting?.code || ''}`}
        onCancel={() => setRejecting(null)}
        onOk={() => rejectForm.submit()}
        okText={F.reject}
        okButtonProps={{ danger: true }}
        confirmLoading={rejectSaving}
        cancelText={t.common.cancel}
        destroyOnClose
      >
        <Form form={rejectForm} layout="vertical" onFinish={reject}>
          <Form.Item name="reason" label={F.rejectReason} rules={[{ required: true, whitespace: true, message: F.rejectReasonRequired }]}>
            <Input.TextArea rows={3} autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
}
