import React, { useEffect, useState } from 'react';
import { Table, Select, DatePicker, Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import LotusEmpty from '../../components/LotusEmpty/LotusEmpty';
import { exportToExcel } from '../../utils/exportData';
import { vnd, softOf, presetRanges, ymd } from './financeShared';

const { RangePicker } = DatePicker;
const PAGE = 20;

export default function LedgerTab({ F, funds, refreshKey }) {
  const [fundId, setFundId] = useState(undefined);
  const [range, setRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const params = (extra = {}) => {
    const p = { fundId, ...extra };
    if (range?.[0]) p.startDate = ymd(range[0]);
    if (range?.[1]) p.endDate = ymd(range[1]);
    return p;
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get('/finance/ledger', { params: params({ page, limit: PAGE }) })
      .then(({ data: d }) => { if (alive) setData(d); })
      .catch(() => message.error(F.loadError))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [fundId, range?.[0]?.valueOf(), range?.[1]?.valueOf(), page, refreshKey]);

  const exportExcel = async () => {
    setExporting(true);
    try {
      const { data: all } = await api.get('/finance/ledger', { params: params({ page: 1, limit: 10000 }) });
      const fundName = funds.find(f => f.id === fundId)?.name || F.allFunds;
      exportToExcel([
        { date: '', code: '', party: F.openingRow, description: fundName, fund: '', income: '', expense: '', balance: all.opening },
        ...all.data.map(r => ({ date: dayjs(r.date).format('DD/MM/YYYY'), code: r.code, party: r.party, description: r.kind === 'expense' ? (F.categories[r.category] || r.description) : r.description, fund: r.fund?.name || '', income: r.income || '', expense: r.expense || '', balance: r.balance })),
        { date: '', code: '', party: F.closingRow, description: '', fund: '', income: all.totalIncome, expense: all.totalExpense, balance: all.closing },
      ], [
        { header: F.colDate, key: 'date' }, { header: F.colCode, key: 'code' }, { header: F.colParty, key: 'party' },
        { header: F.colDescription, key: 'description' }, { header: F.colFund, key: 'fund' },
        { header: F.colIncome, key: 'income' }, { header: F.colExpense, key: 'expense' }, { header: F.colBalance, key: 'balance' },
      ], `so-quy_${range?.[0] ? ymd(range[0]) : 'tat-ca'}_${range?.[1] ? ymd(range[1]) : ''}`);
    } catch {
      message.error(F.loadError);
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { title: F.colDate, dataIndex: 'date', width: 110, render: (v) => <span className="tbl-mono">{dayjs(v).format('DD/MM/YYYY')}</span> },
    { title: F.colCode, dataIndex: 'code', width: 120, render: (v) => <span className="tbl-mono fin-muted-code">{v || '—'}</span> },
    {
      title: F.colParty, key: 'party', width: 260,
      render: (_, r) => (
        <div className="fin-payee">
          <div className="fin-payee__name">{r.party || <span className="tbl-muted">—</span>}</div>
          <div className="fin-payee__desc">{r.kind === 'expense' ? (F.categories[r.category] || r.description) : r.description}</div>
        </div>
      ),
    },
    {
      title: F.colFund, key: 'fund', width: 130,
      render: (_, r) => {
        const c = r.fund?.color || '#c47f36';
        return r.fund ? <span className="tbl-pill" style={{ color: c, background: softOf(c) }}>{r.fund.name}</span> : null;
      },
    },
    { title: F.colIncome, dataIndex: 'income', width: 140, align: 'right', render: (v) => (v ? <span className="fin-in tbl-mono">+{vnd(v)}</span> : '') },
    { title: F.colExpense, dataIndex: 'expense', width: 140, align: 'right', render: (v) => (v ? <span className="fin-out tbl-mono">−{vnd(v)}</span> : '') },
    { title: F.colBalance, dataIndex: 'balance', width: 150, align: 'right', render: (v) => <strong className={`tbl-mono${v < 0 ? ' fin-out' : ''}`}>{vnd(v)}</strong> },
  ];

  return (
    <section className="fin-card fin-card--table section-anim section-d2">
      <div className="fin-filters">
        <Select allowClear className="fin-select" placeholder={F.allFunds} value={fundId} onChange={(v) => { setFundId(v); setPage(1); }}
          options={funds.map(f => ({ value: f.id, label: f.name }))} />
        <RangePicker className="fin-range" format="DD/MM/YYYY" value={range} onChange={(v) => { setRange(v); setPage(1); }}
          presets={presetRanges(F).map(p => ({ label: p.label, value: p.value }))} placeholder={[F.rangeFrom, F.rangeTo]} />
        <Button icon={<DownloadOutlined />} loading={exporting} onClick={exportExcel} disabled={!data?.total} style={{ marginLeft: 'auto' }}>{F.exportExcel}</Button>
      </div>

      {data && (
        <div className="fin-ledger-sum">
          <div><span>{F.openingRow}</span><strong>{vnd(data.opening)}</strong></div>
          <div className="is-in"><span>{F.colIncome}</span><strong>+{vnd(data.totalIncome)}</strong></div>
          <div className="is-out"><span>{F.colExpense}</span><strong>−{vnd(data.totalExpense)}</strong></div>
          <div><span>{F.closingRow}</span><strong className={data.closing < 0 ? 'fin-out' : ''}>{vnd(data.closing)}</strong></div>
        </div>
      )}

      <Table
        rowKey="key"
        className="personnel-table"
        dataSource={data?.data || []}
        columns={columns}
        loading={loading}
        scroll={{ x: 'max-content' }}
        rowClassName={(r) => (r.kind === 'expense' ? 'fin-row--out' : 'fin-row--in')}
        pagination={{ current: page, pageSize: PAGE, total: data?.total || 0, onChange: setPage, showTotal: (n, rg) => `${rg[0]}-${rg[1]} / ${n} ${F.rowsLabel}` }}
        locale={{ emptyText: <LotusEmpty description={F.emptyLedger} hint={F.emptyLedgerHint} /> }}
      />
    </section>
  );
}
