import { useCreateParam } from '../../utils/useCreateParam';
import React, { useMemo, useState } from 'react';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import CountUp from '../../components/CountUp/CountUp';
import {
  Table, Button, Input, Select, Space, Modal, Form, Avatar, Tooltip,
  Popconfirm, Row, Col, DatePicker, InputNumber,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined,
  HeartOutlined, TeamOutlined, FireOutlined, SmileOutlined, TrophyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useBuddhistFollowerPage } from './useBuddhistFollowerPage';
import { useLanguage } from '../../i18n/LanguageContext';
import { guardedClose, rules } from '../../utils/formGuard';
import './BuddhistFollowerPage.css';

const { Option } = Select;

/* ── Merit tiers — derived only from the real total hours ─────────── */
const TIERS = [
  { min: 0,   c: '#8fb87a', s: '#eef6e8' },
  { min: 20,  c: '#4f9a72', s: '#e8f4ed' },
  { min: 50,  c: '#d98a9a', s: '#fcecef' },
  { min: 100, c: '#d9646c', s: '#fdeeee' },
  { min: 200, c: '#d39a2c', s: '#fdf3dc' },
  { min: 500, c: '#8b6fc9', s: '#f1edfb' },
];

function meritOf(hours = 0) {
  let i = 0;
  while (i + 1 < TIERS.length && hours >= TIERS[i + 1].min) i++;
  const tier = TIERS[i];
  const next = TIERS[i + 1];
  const progress = next ? (hours - tier.min) / (next.min - tier.min) : 1;
  return { index: i, tier, next, progress: Math.max(0, Math.min(1, progress)), remaining: next ? next.min - hours : 0 };
}

const fmtHours = (h = 0) => (Number.isInteger(h) ? h : Number(h.toFixed(1))).toLocaleString('vi-VN');

const TYPE_KEY = { 'phật_tử': 'phat_tu', 'tình_nguyện_viên': 'tinh_nguyen_vien', 'cả_hai': 'ca_hai' };
const TYPE_TONE = {
  'phật_tử':          { c: '#4d8fc7', s: '#e9f1fb' },
  'tình_nguyện_viên': { c: '#d9646c', s: '#fdeeee' },
  'cả_hai':           { c: '#8b6fc9', s: '#f1edfb' },
};
const STATUS_TONE = {
  'đang_sinh_hoạt': { c: '#3f8461', s: '#e8f4ed' },
  'tạm_ngưng':      { c: '#b9841f', s: '#fdf3dc' },
  'đã_rời':         { c: '#8c7a6b', s: '#f2ede6' },
};
const isVolunteer = (r) => r.type === 'tình_nguyện_viên' || r.type === 'cả_hai';
const initialOf = (name = '') => name.trim().split(/\s+/).pop()?.[0]?.toUpperCase() || '?';

/* ── Visual atoms ──────────────────────────────────────────────────── */
function Lotus({ color, size = 28 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      {[-58, 58, -29, 29, 0].map((a, i) => (
        <g key={a} transform={`rotate(${a} 32 46)`}>
          <path d="M32 14 C39.5 23 39.5 36 32 46 C24.5 36 24.5 23 32 14 Z" fill={color} opacity={i < 2 ? 0.45 : i < 4 ? 0.7 : 1} />
        </g>
      ))}
      <path d="M16 48 Q32 55 48 48" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}

function MeritMedal({ hours, size = 96 }) {
  const m = meritOf(hours);
  const stroke = size >= 80 ? 6 : 4;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  return (
    <div className="bf-medal" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={m.tier.s} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={m.tier.c} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${C * m.progress} ${C}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="bf-medal__arc"
        />
      </svg>
      <div className="bf-medal__core" style={{ background: m.tier.s, inset: stroke + 4 }}>
        <Lotus color={m.tier.c} size={size * 0.5} />
      </div>
    </div>
  );
}

function Pill({ tone, children, dot }) {
  return (
    <span className="tbl-pill" style={{ color: tone.c, background: tone.s }}>
      {dot && <span className="tbl-pill__dot" />}{children}
    </span>
  );
}

/* ── Expanded row: merit journey ───────────────────────────────────── */
function MeritPanel({ person, ranking, totalHours, t }) {
  const M = t.buddhistFollower.merit;
  const hours = person.publicServiceHours || 0;
  const m = meritOf(hours);
  const rank = ranking.get(person.id);
  const share = totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0;

  return (
    <div className="bf-merit" style={{ '--tier': m.tier.c, '--tier-soft': m.tier.s }}>
      <div className="bf-merit__hero">
        <MeritMedal hours={hours} />
        <div>
          <div className="bf-merit__hours">{fmtHours(hours)}<span>{M.hours}</span></div>
          <div className="bf-merit__tier">{M.level} {m.index + 1} · {M.tiers[m.index]}</div>
        </div>
      </div>

      <div className="bf-merit__journey">
        <div className="bf-merit__label">{M.journey}</div>
        <div className="bf-merit__next">
          {m.next
            ? M.toNext.replace('{n}', fmtHours(m.remaining)).replace('{tier}', M.tiers[m.index + 1])
            : M.maxTier}
        </div>
        <div className="bf-ladder">
          {TIERS.map((tier, i) => {
            const state = i < m.index ? 'done' : i === m.index ? 'current' : 'todo';
            return (
              <Tooltip key={tier.min} title={`${M.tiers[i]} · ≥ ${tier.min} ${M.hours}`}>
                <div className={`bf-ladder__step is-${state}`} style={{ '--step': tier.c, '--step-soft': tier.s }}>
                  <div className="bf-ladder__bar">
                    <span style={{ width: state === 'done' ? '100%' : state === 'current' ? `${m.progress * 100}%` : 0 }} />
                  </div>
                  <span className="bf-ladder__name">{M.tiers[i]}</span>
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <div className="bf-merit__facts">
        <div className="bf-fact">
          <strong>{M.workDays.replace('{n}', fmtHours(Math.round((hours / 8) * 10) / 10))}</strong>
          <span>{t.buddhistFollower.merit.ladderHint}</span>
        </div>
        {rank && (
          <div className="bf-fact">
            <strong>#{rank.rank}<small> / {rank.of}</small></strong>
            <span>{M.rank}</span>
          </div>
        )}
        <div className="bf-fact">
          <strong>{share}%</strong>
          <span>{M.share} {M.shareHint}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────── */
export default function BuddhistFollowerPage() {
  const { t } = useLanguage();
  const B = t.buddhistFollower;
  const M = B.merit;
  const {
    data, allData, loading, total, page, setPage, search, setSearch,
    filterType, setFilterType, modalOpen, setModalOpen, saving, editRecord, setEditRecord,
    handleSubmit, handleDelete, canManage, isAdmin, hasRole,
  } = useBuddhistFollowerPage();
  useCreateParam(() => openModal(), canManage());

  const [form] = Form.useForm();
  const [showAllBoard, setShowAllBoard] = useState(false);
  const BOARD_LIMIT = 5;

  const summary = useMemo(() => {
    const everyone = allData.length ? allData : data;
    const contributors = everyone
      .filter(r => (r.publicServiceHours || 0) > 0)
      .sort((a, b) => (b.publicServiceHours || 0) - (a.publicServiceHours || 0));
    const ranking = new Map();
    contributors.forEach(r => {
      const higher = contributors.filter(x => (x.publicServiceHours || 0) > (r.publicServiceHours || 0)).length;
      ranking.set(r.id, { rank: higher + 1, of: contributors.length });
    });
    const tierCounts = TIERS.map(() => 0);
    contributors.forEach(r => { tierCounts[meritOf(r.publicServiceHours).index]++; });
    return {
      pure: everyone.filter(r => r.type === 'phật_tử').length,
      volunteers: everyone.filter(isVolunteer).length,
      totalHours: everyone.reduce((s, r) => s + (r.publicServiceHours || 0), 0),
      contributors,
      ranking,
      tierCounts,
    };
  }, [allData, data]);

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

  const topHours = summary.contributors[0]?.publicServiceHours || 1;

  const columns = [
    {
      title: B.colName,
      key: 'name',
      width: 260,
      render: (_, r) => {
        const tone = TYPE_TONE[r.type] || TYPE_TONE['phật_tử'];
        return (
          <div className="person-cell">
            <Avatar size={40} className="person-cell__avatar" style={{ background: tone.s, color: tone.c }}>{initialOf(r.fullName)}</Avatar>
            <div className="person-cell__text">
              <div className="person-cell__name">{r.fullName}</div>
              <div className="person-cell__sub">
                {r.dharmName && <span>{r.dharmName}</span>}
                {r.dharmName && r.code && <span className="person-cell__sep">·</span>}
                {r.code && <span className="tbl-mono">{r.code}</span>}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: B.colType,
      dataIndex: 'type',
      width: 150,
      render: (v) => <Pill tone={TYPE_TONE[v] || TYPE_TONE['phật_tử']}>{B.types[TYPE_KEY[v]] || v}</Pill>,
    },
    { title: B.colArea, dataIndex: 'region', width: 130, render: (v) => v || <span className="tbl-muted">—</span> },
    { title: B.colPhone, dataIndex: 'phone', width: 130, render: (v) => v ? <span className="tbl-mono">{v}</span> : <span className="tbl-muted">—</span> },
    {
      title: B.colServiceHours,
      dataIndex: 'publicServiceHours',
      width: 190,
      sorter: (a, b) => (a.publicServiceHours || 0) - (b.publicServiceHours || 0),
      render: (v) => {
        if (!v) return <span className="tbl-muted">—</span>;
        const m = meritOf(v);
        return (
          <Tooltip title={`${M.level} ${m.index + 1} · ${M.tiers[m.index]}`}>
            <div className="bf-hours-cell" style={{ '--tier': m.tier.c, '--tier-soft': m.tier.s }}>
              <span className="bf-hours-cell__icon"><Lotus color={m.tier.c} size={20} /></span>
              <div className="bf-hours-cell__text">
                <strong>{fmtHours(v)}h</strong>
                <span className="bf-hours-cell__bar"><i style={{ width: `${m.progress * 100}%` }} /></span>
              </div>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: t.common.status,
      dataIndex: 'status',
      width: 150,
      render: (v) => <Pill dot tone={STATUS_TONE[v] || STATUS_TONE['đã_rời']}>{B.statuses[v] || v?.replace(/_/g, ' ')}</Pill>,
    },
    {
      title: '',
      key: 'actions',
      width: 96,
      align: 'right',
      render: (_, r) => canManage() && (
        <div className="personnel-action-group" onClick={(e) => e.stopPropagation()}>
          <Tooltip title={t.common.edit}>
            <Button type="text" icon={<EditOutlined />} onClick={() => openModal(r)} />
          </Tooltip>
          {(isAdmin() || hasRole('truotri')) && (
            <Popconfirm title={t.common.confirmDelete} onConfirm={() => handleDelete(r.id)} okText={t.common.delete} cancelText={t.common.cancel} okButtonProps={{ danger: true }}>
              <Tooltip title={t.common.delete}>
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  if (loading && !data.length) return <PageSpinner />;

  const stats = [
    { label: B.statTotalList,         value: total,                                  icon: <TeamOutlined />,  tone: { c: '#c47f36', s: '#fbf1e4' } },
    { label: B.statPureBuddhist,      value: summary.pure,                           icon: <HeartOutlined />, tone: { c: '#4d8fc7', s: '#e9f1fb' } },
    { label: B.statVolunteers,        value: summary.volunteers,                     icon: <SmileOutlined />, tone: { c: '#d9646c', s: '#fdeeee' } },
    { label: B.statTotalServiceHours, value: summary.totalHours, format: (n) => `${fmtHours(n)}h`,     icon: <FireOutlined />,  tone: { c: '#d39a2c', s: '#fdf3dc' },
      hint: M.workDays.replace('{n}', fmtHours(Math.round(summary.totalHours / 8))) },
  ];

  return (
    <div className="bf-page">
      {/* ── Header ── */}
      <section className="bf-hero section-anim section-d0">
        <div className="bf-hero__main">
          <div className="bf-hero__icon"><HeartOutlined /></div>
          <div>
            <h1 className="bf-hero__title">{B.title}</h1>
            <p className="bf-hero__sub">{B.subtitle}</p>
          </div>
        </div>
        {canManage() && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} className="bf-hero__btn">
            {B.addNew}
          </Button>
        )}
      </section>

      {/* ── Stats ── */}
      <div className="bf-stats section-anim section-d1">
        {stats.map(s => (
          <div key={s.label} className="bf-stat" style={{ '--st': s.tone.c, '--st-soft': s.tone.s }}>
            <span className="bf-stat__icon">{s.icon}</span>
            <div className="bf-stat__body">
              <div className="bf-stat__value"><CountUp value={s.value} format={s.format} /></div>
              <div className="bf-stat__label">{s.label}</div>
              {s.hint && <div className="bf-stat__hint">{s.hint}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Honor board + tier ladder ── */}
      <div className="bf-grid section-anim section-d2">
        <section className="bf-card">
          <header className="bf-card__head">
            <span className="bf-card__icon" style={{ color: '#d39a2c', background: '#fdf3dc' }}><TrophyOutlined /></span>
            {M.leaderboard}
          </header>
          {summary.contributors.length === 0 ? (
            <div className="bf-empty"><FireOutlined /> {M.empty}</div>
          ) : (
            <ol className={`bf-board${showAllBoard ? ' is-expanded' : ''}`}>
              {(showAllBoard ? summary.contributors : summary.contributors.slice(0, BOARD_LIMIT)).map((r) => {
                const h = r.publicServiceHours || 0;
                const m = meritOf(h);
                const rank = summary.ranking.get(r.id)?.rank;
                return (
                  <li key={r.id} className={`bf-board__row${rank <= 3 ? ` is-top is-top-${rank}` : ''}`}>
                    <span className="bf-board__rank">{rank}</span>
                    <MeritMedal hours={h} size={40} />
                    <div className="bf-board__who">
                      <div className="bf-board__name">{r.dharmName || r.fullName}</div>
                      <div className="bf-board__tier" style={{ color: m.tier.c }}>{M.tiers[m.index]}</div>
                    </div>
                    <div className="bf-board__score">
                      <strong>{fmtHours(h)}h</strong>
                      <span className="bf-board__bar"><i style={{ width: `${(h / topHours) * 100}%`, background: m.tier.c }} /></span>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {summary.contributors.length > BOARD_LIMIT && (
            <button type="button" className="bf-board__toggle" onClick={() => setShowAllBoard(v => !v)}>
              {showAllBoard ? M.collapse : M.showAll.replace('{n}', summary.contributors.length)}
              <span className={`bf-board__chev${showAllBoard ? ' is-up' : ''}`}>›</span>
            </button>
          )}

          {summary.contributors.length > 0 && (
            <div className="bf-board__summary">
              <div className="bf-dist">
                <div className="bf-dist__label">{M.distribution}</div>
                <div className="bf-dist__bar">
                  {TIERS.map((tier, i) => summary.tierCounts[i] > 0 && (
                    <Tooltip key={tier.min} title={`${M.tiers[i]}: ${summary.tierCounts[i]} ${M.people}`}>
                      <span style={{ flex: summary.tierCounts[i], background: tier.c }} />
                    </Tooltip>
                  ))}
                </div>
                <div className="bf-dist__legend">
                  {TIERS.map((tier, i) => summary.tierCounts[i] > 0 && (
                    <span key={tier.min}><i style={{ background: tier.c }} />{M.tiers[i]} <strong>{summary.tierCounts[i]}</strong></span>
                  ))}
                </div>
              </div>
              <div className="bf-mini">
                <div className="bf-mini__item">
                  <strong>{fmtHours(Math.round((summary.totalHours / summary.contributors.length) * 10) / 10)}h</strong>
                  <span>{M.avgPerPerson}</span>
                </div>
                <div className="bf-mini__item">
                  <strong>{fmtHours(topHours)}h</strong>
                  <span>{M.topHours}</span>
                </div>
                <div className="bf-mini__item">
                  <strong>{summary.contributors.length}<small>/{Math.max(summary.volunteers, summary.contributors.length)}</small></strong>
                  <span>{M.participation}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="bf-card">
          <header className="bf-card__head">
            <span className="bf-card__icon"><Lotus color="#c47f36" size={18} /></span>
            {M.ladder}
          </header>
          <ul className="bf-tiers">
            {TIERS.map((tier, i) => (
              <li key={tier.min} className="bf-tiers__row">
                <span className="bf-tiers__icon" style={{ background: tier.s }}><Lotus color={tier.c} size={22} /></span>
                <div className="bf-tiers__text">
                  <div className="bf-tiers__name">{M.tiers[i]}</div>
                  <div className="bf-tiers__range">
                    {TIERS[i + 1] ? `${tier.min} – ${TIERS[i + 1].min - 1}` : `≥ ${tier.min}`} {M.hours}
                  </div>
                </div>
                <span className="bf-tiers__count" style={summary.tierCounts[i] ? { color: tier.c, background: tier.s } : undefined}>
                  {summary.tierCounts[i]} {M.people}
                </span>
              </li>
            ))}
          </ul>
          <div className="bf-tiers__hint">{M.ladderHint}</div>
        </section>
      </div>

      {/* ── List ── */}
      <section className="bf-card bf-card--table section-anim section-d3">
        <div className="bf-toolbar">
          <Input
            className="bf-search"
            placeholder={B.searchPlaceholder}
            prefix={<SearchOutlined style={{ color: '#bfae99' }} />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            allowClear
          />
          <Select value={filterType} onChange={(v) => { setFilterType(v); setPage(1); }} style={{ width: 180 }}>
            <Option value="">{B.allTypes}</Option>
            <Option value="phật_tử">{B.types['phat_tu']}</Option>
            <Option value="tình_nguyện_viên">{B.types['tinh_nguyen_vien']}</Option>
            <Option value="cả_hai">{B.types['ca_hai']}</Option>
          </Select>
        </div>

        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page, total, pageSize: 10, onChange: setPage,
            showTotal: (n, range) => `${range[0]}-${range[1]} / ${n} ${B.totalLabel}`,
          }}
          scroll={{ x: 'max-content' }}
          className="personnel-table"
          expandable={{
            expandedRowRender: (record) => (
              <MeritPanel person={record} ranking={summary.ranking} totalHours={summary.totalHours} t={t} />
            ),
            rowExpandable: (record) => (record.publicServiceHours || 0) > 0,
            expandRowByClick: true,
          }}
          onRow={(r) => ({ style: { cursor: (r.publicServiceHours || 0) > 0 ? 'pointer' : 'default' } })}
        />
      </section>

      {/* ── Modal ── */}
      <Modal
        title={editRecord ? B.editTitle : B.addTitle}
        open={modalOpen}
        onCancel={() => guardedClose(form, () => setModalOpen(false), t)}
        maskClosable={false}
        confirmLoading={saving}
        onOk={() => form.submit()}
        okText={editRecord ? t.common.update : t.common.add}
        cancelText={t.common.cancel}
        width={680}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="fullName" label={t.common.name} rules={[{ ...rules(t).required(t.common.name), whitespace: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="dharmName" label={B.form.dharmName}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="gender" label={B.form.gender}>
                <Select allowClear>
                  <Option value="nam">{B.form.genderMale}</Option>
                  <Option value="nữ">{B.form.genderFemale}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="dateOfBirth" label={B.form.dateOfBirth}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="type" label={B.colType} initialValue="phật_tử">
                <Select>
                  <Option value="phật_tử">{B.types['phat_tu']}</Option>
                  <Option value="tình_nguyện_viên">{B.types['tinh_nguyen_vien']}</Option>
                  <Option value="cả_hai">{B.types['ca_hai']}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label={B.form.phone} rules={[rules(t).phone]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="email" label={t.common.email} rules={[rules(t).email]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="occupation" label={B.form.occupation}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="region" label={B.colArea}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="preceptDate" label={B.form.preceptDate}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="preceptorName" label={B.form.preceptorName}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="publicServiceHours" label={B.form.serviceHours} initialValue={0}>
                <InputNumber min={0} step={0.5} style={{ width: '100%' }} addonAfter={M.hours} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="status" label={t.common.status} initialValue="đang_sinh_hoạt">
                <Select>
                  <Option value="đang_sinh_hoạt">{B.statuses['đang_sinh_hoạt']}</Option>
                  <Option value="tạm_ngưng">{B.statuses['tạm_ngưng']}</Option>
                  <Option value="đã_rời">{B.statuses['đã_rời']}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="address" label={B.form.address}>
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
    </div>
  );
}
