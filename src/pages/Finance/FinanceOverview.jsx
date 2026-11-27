import React, { useEffect, useState } from 'react';
import { Alert, Button, DatePicker, Select, Tooltip } from 'antd';
import {
  RiseOutlined, FallOutlined, SwapOutlined, ClockCircleOutlined, CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import CountUp from '../../components/CountUp/CountUp';
import { useLanguage } from '../../i18n/LanguageContext';
import { vnd, compactVnd, CATEGORY_COLOR, softOf, presetRanges, ymd } from './financeShared';

const { RangePicker } = DatePicker;

function MonthlyChart({ data, F, lang }) {
  const [hover, setHover] = useState(null);
  const peak = Math.max(1, ...data.map(d => Math.max(d.income, d.expense)));
  const step = 10 ** Math.floor(Math.log10(Math.max(1, peak / 4)));
  const max = Math.ceil(peak / (4 * step)) * 4 * step;
  const padL = 82, padB = 27, H = 220, gap = 6;
  const W = Math.max(360, data.length * 46 + padL);
  const slot = (W - padL) / Math.max(1, data.length);
  const bw = Math.max(3, Math.min(26, (slot - gap * 3) / 2));
  const y = (v) => (H - padB) * (1 - v / max);
  return (
    <div className="fin-chart">
      <div className="fin-chart__plot">
      <svg viewBox={`0 -7 ${W} ${H + 7}`} style={{ minWidth: W }} role="group" aria-label={F.monthlyTitle}>
        {[0, .25, .5, .75, 1].map(p => (
          <g key={p} aria-hidden="true">
            <line x1={padL} x2={W} y1={y(max * p)} y2={y(max * p)} stroke="#e8ddcf" strokeWidth="1" />
            <text x={padL - 8} y={y(max * p)} dominantBaseline="middle" textAnchor="end" className="fin-chart__axis">{compactVnd(max * p, lang)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const start = padL + i * slot;
          const x = start + (slot - 2 * bw - gap) / 2;
          return (
            <g key={d.month} tabIndex={0} role="img"
              aria-label={`${d.month} · ${F.income}: ${vnd(d.income)} · ${F.expense}: ${vnd(d.expense)}`}
              onFocus={() => setHover(i)} onBlur={() => setHover(null)}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              onClick={() => setHover(i)}>
              <rect x={start} y="0" width={slot} height={H - padB} fill={hover === i ? '#fcf6ee' : 'transparent'} />
              <rect className="fin-chart__bar" x={x} y={y(d.income)} width={bw} height={(H - padB) - y(d.income)} rx="4" fill="#3e7556" />
              <rect className="fin-chart__bar" x={x + bw + gap} y={y(d.expense)} width={bw} height={(H - padB) - y(d.expense)} rx="4" fill="#ad5c53" />
              <text x={x + bw + gap / 2} y={H - 8} textAnchor="middle" className="fin-chart__label">
                {`T${Number(d.month.slice(5))}/${d.month.slice(2, 4)}`}
              </text>
            </g>
          );
        })}
      </svg>
      </div>
      <div className="fin-chart__legend">
        <span><i style={{ background: '#3e7556' }} />{F.income}</span>
        <span><i style={{ background: '#ad5c53' }} />{F.expense}</span>
        {hover !== null && data[hover] && (
          <span className="fin-chart__tip">
            <strong>{`T${Number(data[hover].month.slice(5))}/${data[hover].month.slice(0, 4)}`}</strong>
            {' · '}{F.income} {compactVnd(data[hover].income, lang)}{' · '}{F.expense} {compactVnd(data[hover].expense, lang)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function FinanceOverview({ F, funds, range, setRange, fundId, setFundId, refreshKey }) {
  const { lang, t } = useLanguage();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('thisMonth');
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setFailed(false);
    const params = { fundId };
    if (range?.[0]) params.startDate = ymd(range[0]);
    if (range?.[1]) params.endDate = ymd(range[1]);
    api.get('/finance/report', { params })
      .then(({ data }) => { if (alive) setReport(data); })
      .catch(() => { if (alive) setFailed(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [range?.[0]?.valueOf(), range?.[1]?.valueOf(), fundId, refreshKey, retry]);

  const presets = presetRanges(F);
  const pickPreset = (key) => {
    setPreset(key);
    if (key === 'allTime') setRange(null);
    else setRange(presets.find(p => p.key === key).value);
  };

  const tt = report?.totals || {};
  const catTotal = (report?.byCategory || []).reduce((s, c) => s + c.amount, 0);
  const kpis = [
    { key: 'in',  label: F.periodIncome,  value: tt.income,  icon: <RiseOutlined />,  tone: { c: '#3f8461', s: '#e8f4ed' } },
    { key: 'out', label: F.periodExpense, value: tt.expense, icon: <FallOutlined />,  tone: { c: '#c4545d', s: '#fdeeee' } },
    { key: 'net', label: F.periodNet,     value: tt.net,     icon: <SwapOutlined />,  tone: (tt.net || 0) >= 0 ? { c: '#3f7fb5', s: '#e9f1fb' } : { c: '#c4545d', s: '#fdeeee' } },
  ];

  return (
    <div className="fin-overview">
      {/* Period filters */}
      <div className="fin-toolbar section-anim section-d2">
        <div className="fin-presets">
          {[...presets.map(p => ({ key: p.key, label: p.label })), { key: 'allTime', label: F.presets.allTime }].map(p => (
            <button key={p.key} type="button" className={`fin-chip${preset === p.key ? ' is-active' : ''}`} aria-pressed={preset === p.key} onClick={() => pickPreset(p.key)}>{p.label}</button>
          ))}
        </div>
        <RangePicker
          value={range}
          onChange={(v) => { setRange(v); setPreset(null); }}
          format="DD/MM/YYYY"
          className="fin-range"
          placeholder={[F.rangeFrom, F.rangeTo]}
          allowClear
        />
        <Select
          allowClear
          className="fin-select"
          aria-label={F.allFunds}
          placeholder={F.allFunds}
          value={fundId}
          onChange={setFundId}
          options={funds.map(f => ({ value: f.id, label: f.name }))}
        />
      </div>

      {/* Fund cards */}
      <section className="fin-funds section-anim section-d1">
        {funds.filter(f => f.isActive !== false).map(f => {
          const color = f.color || '#c47f36';
          const negative = (f.balance || 0) < 0;
          return (
            <button
              type="button"
              key={f.id}
              className={`fin-fund${fundId === f.id ? ' is-selected' : ''}`}
              style={{ '--fund': color, '--fund-soft': softOf(color) }}
              onClick={() => setFundId(fundId === f.id ? undefined : f.id)}
              aria-pressed={fundId === f.id}
            >
              <div className="fin-fund__top">
                <span className="fin-fund__dot" />
                <span className="fin-fund__name">{f.name}</span>
                {negative && <span className="fin-fund__neg">{F.negative}</span>}
              </div>
              <div className={`fin-fund__balance${negative ? ' is-neg' : ''}`}>
                <CountUp value={f.balance || 0} format={(v) => compactVnd(v, lang)} />
              </div>
              <div className="fin-fund__flow">
                <span className="is-in">+{compactVnd(f.income, lang)}</span>
                <span className="is-out">−{compactVnd(f.expense, lang)}</span>
                {f.pendingCount > 0 && <span className="is-pending"><ClockCircleOutlined /> {f.pendingCount}</span>}
              </div>
              {Number(f.targetAmount) > 0 ? (
                <Tooltip title={`${F.target}: ${vnd(f.targetAmount)}`}>
                  <div className="fin-fund__progress">
                    <div className="fin-fund__track"><i style={{ width: `${Math.round((f.progress || 0) * 100)}%` }} /></div>
                    <span>{F.progress.replace('{p}', Math.round((f.progress || 0) * 100))}</span>
                  </div>
                </Tooltip>
              ) : (
                <div className="fin-fund__progress is-empty"><span>{F.noTarget}</span></div>
              )}
            </button>
          );
        })}
      </section>

      {failed && (
        <Alert type="error" showIcon message={t.common.loadError}
          action={<Button onClick={() => setRetry(value => value + 1)}>{t.common.retry}</Button>} />
      )}
      {loading && !report ? <div style={{ position: 'relative', minHeight: 260 }}><PageSpinner /></div> : report && !failed && (
        <>
          {/* KPIs */}
          <div className="fin-kpis section-anim section-d2">
            {kpis.map(k => (
              <div key={k.key} className="fin-kpi" style={{ '--k': k.tone.c, '--k-soft': k.tone.s }}>
                <span className="fin-kpi__icon">{k.icon}</span>
                <div className="fin-kpi__body">
                  <div className="fin-kpi__label">{k.label}</div>
                  <div className="fin-kpi__value"><CountUp value={k.value || 0} format={(v) => compactVnd(v, lang)} /></div>
                  <div className="fin-kpi__sub">{vnd(k.value)}</div>
                </div>
              </div>
            ))}
            <div className="fin-kpi" style={{ '--k': '#b9841f', '--k-soft': '#fdf3dc' }}>
              <span className="fin-kpi__icon"><ClockCircleOutlined /></span>
              <div className="fin-kpi__body">
                <div className="fin-kpi__label">{F.pending}</div>
                <div className="fin-kpi__value"><CountUp value={report.pendingCount || 0} /></div>
                <div className="fin-kpi__sub">{compactVnd(report.pendingAmount, lang)}</div>
              </div>
            </div>
          </div>

          {range?.[0] && (
            <div className="fin-balances section-anim section-d2">
              <span><CalendarOutlined /> {F.opening}: <strong>{vnd(tt.opening)}</strong></span>
              <span className="fin-balances__arrow">→</span>
              <span>{F.closing}: <strong className={(tt.closing || 0) < 0 ? 'is-neg' : ''}>{vnd(tt.closing)}</strong></span>
            </div>
          )}

          <div className="fin-grid section-anim section-d3">
            <section className="fin-card">
              <header className="fin-card__head">{F.monthlyTitle}</header>
              {report.monthly?.length
                ? <MonthlyChart data={report.monthly} F={F} lang={lang} />
                : <p className="fin-muted">{F.noMonthlyData}</p>}
            </section>
            <section className="fin-card">
              <header className="fin-card__head">{F.categoryTitle}</header>
              {report.byCategory.length === 0 ? (
                <div className="fin-muted">{F.noCategory}</div>
              ) : (
                <ul className="fin-cats">
                  {report.byCategory.map(c => {
                    const color = CATEGORY_COLOR[c.category] || '#a8978a';
                    const pct = catTotal ? Math.round((c.amount / catTotal) * 100) : 0;
                    return (
                      <li key={c.category} style={{ '--c': color }}>
                        <div className="fin-cats__line">
                          <span className="fin-cats__name"><i />{F.categories[c.category] || c.category}</span>
                          <strong>{compactVnd(c.amount, lang)}</strong>
                          <span className="fin-cats__pct">{pct}%</span>
                        </div>
                        <div className="fin-cats__track"><i style={{ width: `${pct}%` }} /></div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
