import React, { useMemo, useState } from 'react';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import CountUp from '../../components/CountUp/CountUp';
import LotusEmpty from '../../components/LotusEmpty/LotusEmpty';
import {
  Table, Button, Select, Modal, Form, Input, InputNumber, DatePicker, Row, Col,
  Avatar, Tooltip, Popconfirm, Segmented,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, SearchOutlined,
  BookOutlined, HomeOutlined, SafetyCertificateOutlined, RiseOutlined, AppstoreOutlined,
  CalendarOutlined, EnvironmentOutlined, UserOutlined, ClockCircleOutlined, CheckCircleOutlined,
  ReadOutlined, CloseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTrainingPage, TRAINING_TYPES, effectiveStatus } from './useTrainingPage';
import { useLanguage } from '../../i18n/LanguageContext';
import './TrainingPage.css';

const { Option } = Select;

const TYPE_STYLE = {
  'khóa_phật_học': { c: '#4d8fc7', s: '#e9f1fb', icon: <BookOutlined /> },
  'an_cư_kiết_hạ': { c: '#4f9a72', s: '#e8f4ed', icon: <HomeOutlined /> },
  'giới_đàn':      { c: '#c47f36', s: '#fbf1e4', icon: <SafetyCertificateOutlined /> },
  'bồi_dưỡng':     { c: '#8b6fc9', s: '#f1edfb', icon: <RiseOutlined /> },
  'khác':          { c: '#b8893a', s: '#f8f0dc', icon: <AppstoreOutlined /> },
};
const STATUS_TONE = {
  'sắp_diễn_ra':  { c: '#4d8fc7', s: '#e9f1fb' },
  'đang_diễn_ra': { c: '#3f8461', s: '#e8f4ed' },
  'hoàn_thành':   { c: '#8c7a6b', s: '#f2ede6' },
  'hủy':          { c: '#d9646c', s: '#fdeeee' },
};
const RESULT_TONE = {
  'đạt':           { c: '#3f8461', s: '#e8f4ed' },
  'không_đạt':     { c: '#d9646c', s: '#fdeeee' },
  'chưa_đánh_giá': { c: '#8c7a6b', s: '#f2ede6' },
};
const STATUS_ORDER = ['sắp_diễn_ra', 'đang_diễn_ra', 'hoàn_thành', 'hủy'];

const personName = (p) => p?.dharmName || p?.fullName || '—';
const initialOf = (name = '') => name.trim().split(/\s+/).pop()?.[0]?.toUpperCase() || '?';

function Pill({ tone, dot, children }) {
  return (
    <span className="tbl-pill" style={{ color: tone.c, background: tone.s }}>
      {dot && <span className="tbl-pill__dot" />}{children}
    </span>
  );
}

/* Relative timing line: "Còn 5 ngày", "Ngày 3/8", "Kết thúc 4 ngày trước" */
function timingOf(r, status, T) {
  const today = dayjs().startOf('day');
  const start = dayjs(r.startDate);
  const end = dayjs(r.endDate);
  const total = end.diff(start, 'day') + 1;
  if (status === 'hủy') return null;
  if (status === 'sắp_diễn_ra') {
    const n = start.diff(today, 'day');
    return n <= 0 ? T.startsToday : T.startsIn.replace('{n}', n);
  }
  if (status === 'đang_diễn_ra') {
    const d = today.diff(start, 'day') + 1;
    return T.dayOf.replace('{d}', d).replace('{n}', total);
  }
  const ago = today.diff(end, 'day');
  return ago <= 0 ? T.endsToday : T.endedAgo.replace('{n}', ago);
}

export default function TrainingPage() {
  const { t } = useLanguage();
  const T = t.training;
  const {
    data, loading, saving,
    modalOpen, setModalOpen, editRecord, setEditRecord,
    participantModal, setParticipantModal,
    personnel, selectedPersonnelIds, setSelectedPersonnelIds,
    handleSubmit, handleDelete, addParticipants, updateResult, removeParticipant,
    canManage, canDelete,
  } = useTrainingPage();

  const [form] = Form.useForm();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const rows = useMemo(() => data.map(r => ({ ...r, _status: effectiveStatus(r) })), [data]);

  const stats = useMemo(() => {
    const participants = rows.reduce((s, r) => s + (r.participants?.length || 0), 0);
    const passed = rows.reduce((s, r) => s + (r.participants || []).filter(p => p.result === 'đạt').length, 0);
    return {
      total: rows.length,
      ongoing: rows.filter(r => r._status === 'đang_diễn_ra').length,
      upcoming: rows.filter(r => r._status === 'sắp_diễn_ra').length,
      done: rows.filter(r => r._status === 'hoàn_thành').length,
      participants,
      passed,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (filterType && r.type !== filterType) return false;
      if (filterStatus !== 'all' && r._status !== filterStatus) return false;
      if (!q) return true;
      return [r.name, r.location, r.instructor].some(v => v?.toLowerCase().includes(q));
    });
  }, [rows, search, filterType, filterStatus]);

  const isFiltered = Boolean(search.trim() || filterType || filterStatus !== 'all');

  const openModal = (record = null) => {
    setEditRecord(record);
    if (record) {
      form.setFieldsValue({
        ...record,
        startDate: record.startDate ? dayjs(record.startDate) : null,
        endDate: record.endDate ? dayjs(record.endDate) : null,
      });
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const typeLabel = (v) => T.courseTypes[v] || v;

  const columns = [
    {
      title: T.colName,
      dataIndex: 'name',
      width: 300,
      render: (v, r) => {
        const ty = TYPE_STYLE[r.type] || TYPE_STYLE['khác'];
        return (
          <div className="tr-course">
            <span className="tr-course__icon" style={{ color: ty.c, background: ty.s }}>{ty.icon}</span>
            <div className="tr-course__text">
              <div className="tr-course__name">{v}</div>
              <div className="tr-course__sub">
                <span style={{ color: ty.c, fontWeight: 600 }}>{typeLabel(r.type)}</span>
                {r.instructor && <><span className="person-cell__sep">·</span><span><UserOutlined /> {r.instructor}</span></>}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: T.colTime,
      key: 'time',
      width: 220,
      sorter: (a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf(),
      render: (_, r) => {
        const days = dayjs(r.endDate).diff(dayjs(r.startDate), 'day') + 1;
        const timing = timingOf(r, r._status, T);
        return (
          <div className="tr-time">
            <div className="tr-time__range tbl-mono">
              {dayjs(r.startDate).format('DD/MM')} → {dayjs(r.endDate).format('DD/MM/YYYY')}
            </div>
            <div className="tr-time__meta">
              <span>{T.durationDays.replace('{n}', days)}</span>
              {timing && <><span className="person-cell__sep">·</span><span className={`tr-time__rel is-${r._status}`}>{timing}</span></>}
            </div>
          </div>
        );
      },
    },
    {
      title: T.colLocation,
      dataIndex: 'location',
      width: 160,
      render: (v) => v ? <span className="tr-loc"><EnvironmentOutlined /> {v}</span> : <span className="tbl-muted">—</span>,
    },
    {
      title: T.colStudents,
      key: 'students',
      width: 190,
      render: (_, r) => {
        const list = r.participants || [];
        const max = r.maxParticipants;
        const pct = max ? Math.min(100, (list.length / max) * 100) : null;
        return (
          <div className="tr-students">
            {list.length > 0 ? (
              <Avatar.Group max={{ count: 3, style: { background: '#f4ece0', color: '#9a8470', fontSize: 11, fontWeight: 700 } }} size={28}>
                {list.map(p => (
                  <Tooltip key={p.id} title={personName(p.personnel)}>
                    <Avatar size={28} style={{ background: '#fbf1e4', color: '#c47f36', fontSize: 11, fontWeight: 700, border: '2px solid #fff' }}>
                      {initialOf(personName(p.personnel))}
                    </Avatar>
                  </Tooltip>
                ))}
              </Avatar.Group>
            ) : <span className="tr-students__ghost"><UserOutlined /></span>}
            <div className="tr-students__info">
              <span className="tr-students__count">
                <strong>{list.length}</strong>{max ? <span> / {max}</span> : null}
              </span>
              {pct !== null && (
                <span className={`tr-cap${pct >= 100 ? ' is-full' : pct >= 80 ? ' is-near' : ''}`}><i style={{ width: `${pct}%` }} /></span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: t.common.status,
      key: 'status',
      width: 150,
      render: (_, r) => <Pill dot tone={STATUS_TONE[r._status] || STATUS_TONE['hoàn_thành']}>{T.statuses[r._status] || r._status}</Pill>,
    },
    {
      title: '',
      key: 'actions',
      width: 130,
      align: 'right',
      render: (_, r) => canManage() && (
        <div className="personnel-action-group" onClick={(e) => e.stopPropagation()}>
          <Tooltip title={T.manageParticipants}>
            <Button type="text" icon={<TeamOutlined />} onClick={() => setParticipantModal(r)} />
          </Tooltip>
          <Tooltip title={t.common.edit}>
            <Button type="text" icon={<EditOutlined />} onClick={() => openModal(r)} />
          </Tooltip>
          {canDelete() && (
            <Popconfirm
              title={T.confirmDelete}
              description={r.participants?.length ? T.deleteWarn.replace('{n}', r.participants.length) : undefined}
              onConfirm={() => handleDelete(r.id)}
              okText={t.common.delete} cancelText={t.common.cancel} okButtonProps={{ danger: true }}
            >
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

  const statTiles = [
    { label: T.statTotalCourses,          value: stats.total,        icon: <ReadOutlined />,        tone: { c: '#c47f36', s: '#fbf1e4' }, hint: T.doneCount.replace('{n}', stats.done) },
    { label: T.statuses['đang_diễn_ra'],  value: stats.ongoing,      icon: <ClockCircleOutlined />, tone: { c: '#3f8461', s: '#e8f4ed' } },
    { label: T.statuses['sắp_diễn_ra'],   value: stats.upcoming,     icon: <CalendarOutlined />,    tone: { c: '#4d8fc7', s: '#e9f1fb' } },
    { label: T.statParticipants,          value: stats.participants, icon: <TeamOutlined />,        tone: { c: '#8b6fc9', s: '#f1edfb' }, hint: T.passedCount.replace('{n}', stats.passed) },
  ];

  const enrolledIds = new Set((participantModal?.participants || []).map(p => p.personnelId ?? p.personnel?.id));
  const pm = participantModal;
  const pmType = pm ? (TYPE_STYLE[pm.type] || TYPE_STYLE['khác']) : null;
  const pmStatus = pm ? effectiveStatus(pm) : null;

  return (
    <div className="tr-page">
      {/* ── Header ── */}
      <section className="tr-hero section-anim section-d0">
        <div className="tr-hero__main">
          <div className="tr-hero__icon"><BookOutlined /></div>
          <div>
            <h1 className="tr-hero__title">{T.title}</h1>
            <p className="tr-hero__sub">{T.subtitle}</p>
          </div>
        </div>
        {canManage() && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} className="tr-hero__btn">
            {T.addNew}
          </Button>
        )}
      </section>

      {/* ── Stats ── */}
      <div className="tr-stats section-anim section-d1">
        {statTiles.map(s => (
          <div key={s.label} className="tr-stat" style={{ '--st': s.tone.c, '--st-soft': s.tone.s }}>
            <span className="tr-stat__icon">{s.icon}</span>
            <div className="tr-stat__body">
              <div className="tr-stat__value"><CountUp value={s.value} /></div>
              <div className="tr-stat__label">{s.label}</div>
              {s.hint && <div className="tr-stat__hint">{s.hint}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* ── List ── */}
      <section className="tr-card section-anim section-d2">
        <div className="tr-toolbar">
          <Input
            className="tr-search"
            placeholder={T.searchPlaceholder}
            prefix={<SearchOutlined style={{ color: '#bfae99' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          <Select value={filterType} onChange={setFilterType} className="tr-type-filter">
            <Option value="">{T.allTypes}</Option>
            {TRAINING_TYPES.map(k => <Option key={k} value={k}>{typeLabel(k)}</Option>)}
          </Select>
          <Segmented
            className="tr-status-filter"
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: t.common.all },
              ...STATUS_ORDER.map(s => ({ value: s, label: T.statuses[s] })),
            ]}
          />
        </div>

        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={loading}
          className="personnel-table"
          scroll={{ x: 'max-content' }}
          pagination={filtered.length > 10 ? { pageSize: 10, showTotal: (n, range) => `${range[0]}-${range[1]} / ${n} ${T.totalLabel}` } : false}
          locale={{
            emptyText: isFiltered
              ? <LotusEmpty description={T.emptyFiltered} hint={T.emptyFilteredHint} />
              : <LotusEmpty description={T.emptyTitle} hint={canManage() ? T.emptyHint : ''} />,
          }}
          expandable={{
            rowExpandable: (r) => (r.participants?.length || 0) > 0,
            expandRowByClick: true,
            expandedRowRender: (r) => (
              <div className="tr-expand">
                <div className="tr-expand__label"><TeamOutlined /> {T.colStudents} ({r.participants.length})</div>
                <div className="tr-expand__list">
                  {r.participants.map(p => {
                    const tone = RESULT_TONE[p.result] || RESULT_TONE['chưa_đánh_giá'];
                    return (
                      <span key={p.id} className="tr-chip">
                        <Avatar size={24} style={{ background: '#fbf1e4', color: '#c47f36', fontSize: 11, fontWeight: 700 }}>
                          {initialOf(personName(p.personnel))}
                        </Avatar>
                        <span className="tr-chip__name">{personName(p.personnel)}</span>
                        <span className="tr-chip__result" style={{ color: tone.c, background: tone.s }}>{T.results[p.result] || p.result}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            ),
          }}
          onRow={(r) => ({ style: { cursor: (r.participants?.length || 0) > 0 ? 'pointer' : 'default' } })}
        />
      </section>

      {/* ── Course form ── */}
      <Modal
        title={editRecord ? T.editTitle : T.addTitle}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editRecord ? t.common.update : t.common.add}
        cancelText={t.common.cancel}
        confirmLoading={saving}
        width={620}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="tr-form">
          <Form.Item name="name" label={T.colName} rules={[{ required: true, message: T.colName }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label={T.colType} rules={[{ required: true, message: T.colType }]}>
            <Select placeholder={T.colType}>
              {TRAINING_TYPES.map(k => {
                const ty = TYPE_STYLE[k];
                return (
                  <Option key={k} value={k}>
                    <span className="tr-opt"><span style={{ color: ty.c }}>{ty.icon}</span>{typeLabel(k)}</span>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="startDate" label={T.fieldStartDate} rules={[{ required: true, message: T.fieldStartDate }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="endDate"
                label={T.fieldEndDate}
                dependencies={['startDate']}
                rules={[
                  { required: true, message: T.fieldEndDate },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const start = getFieldValue('startDate');
                      if (!value || !start || !value.isBefore(start, 'day')) return Promise.resolve();
                      return Promise.reject(new Error(T.endBeforeStart));
                    },
                  }),
                ]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="location" label={T.colLocation}>
                <Input prefix={<EnvironmentOutlined style={{ color: '#bfae99' }} />} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="instructor" label={T.fieldInstructor}>
                <Input prefix={<UserOutlined style={{ color: '#bfae99' }} />} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="maxParticipants" label={T.fieldCapacity}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="status" label={t.common.status} initialValue="sắp_diễn_ra" extra={T.statusAutoHint}>
                <Select>
                  {STATUS_ORDER.map(s => <Option key={s} value={s}>{T.statuses[s]}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label={t.common.description} style={{ marginBottom: 0 }}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Participants ── */}
      <Modal
        open={!!pm}
        onCancel={() => setParticipantModal(null)}
        footer={null}
        width={620}
        title={null}
        className="tr-pm"
        destroyOnClose
      >
        {pm && (
          <div>
            <div className="tr-pm__head">
              <span className="tr-course__icon tr-course__icon--lg" style={{ color: pmType.c, background: pmType.s }}>{pmType.icon}</span>
              <div style={{ minWidth: 0 }}>
                <div className="tr-pm__eyebrow">{T.manageParticipants}</div>
                <div className="tr-pm__title">{pm.name}</div>
                <div className="tr-pm__meta">
                  <span><CalendarOutlined /> {dayjs(pm.startDate).format('DD/MM')} → {dayjs(pm.endDate).format('DD/MM/YYYY')}</span>
                  <Pill tone={STATUS_TONE[pmStatus]}>{T.statuses[pmStatus]}</Pill>
                </div>
              </div>
            </div>

            <div className="tr-pm__add">
              <Select
                mode="multiple"
                style={{ flex: 1, minWidth: 0 }}
                placeholder={T.selectPersonnelPlaceholder}
                value={selectedPersonnelIds}
                onChange={setSelectedPersonnelIds}
                showSearch
                optionFilterProp="label"
                maxTagCount="responsive"
                options={personnel.map(p => ({
                  value: p.id,
                  label: p.dharmName ? `${p.dharmName} (${p.fullName})` : p.fullName,
                  disabled: enrolledIds.has(p.id),
                }))}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={addParticipants} disabled={!selectedPersonnelIds.length}>
                {T.addParticipantsBtn}
              </Button>
            </div>
            {pm.maxParticipants && (pm.participants?.length || 0) >= pm.maxParticipants && (
              <div className="tr-pm__full">{T.capacityFull}</div>
            )}

            <div className="tr-pm__listhead">
              <span>{T.colStudents}</span>
              <span className="tr-pm__count">
                {pm.participants?.length || 0}{pm.maxParticipants ? ` / ${pm.maxParticipants}` : ''}
              </span>
            </div>

            {!(pm.participants?.length) ? (
              <div className="tr-pm__empty"><UserOutlined /> {T.noParticipants}</div>
            ) : (
              <ul className="tr-pm__list">
                {pm.participants.map(p => (
                  <li key={p.id} className="tr-pm__row">
                    <Avatar size={36} style={{ background: '#fbf1e4', color: '#c47f36', fontWeight: 700, flexShrink: 0 }}>
                      {initialOf(personName(p.personnel))}
                    </Avatar>
                    <div className="tr-pm__who">
                      <div className="tr-pm__name">{personName(p.personnel)}</div>
                      {p.personnel?.dharmName && p.personnel?.fullName && <div className="tr-pm__sub">{p.personnel.fullName}</div>}
                    </div>
                    <Select
                      size="small"
                      value={p.result || 'chưa_đánh_giá'}
                      onChange={(v) => updateResult(p.id, v)}
                      className={`tr-result tr-result--${p.result || 'chưa_đánh_giá'}`}
                      popupMatchSelectWidth={false}
                      options={Object.keys(RESULT_TONE).map(k => ({
                        value: k,
                        label: <span className="tr-opt">{k === 'đạt' ? <CheckCircleOutlined style={{ color: RESULT_TONE[k].c }} /> : k === 'không_đạt' ? <CloseOutlined style={{ color: RESULT_TONE[k].c }} /> : <ClockCircleOutlined style={{ color: RESULT_TONE[k].c }} />}{T.results[k]}</span>,
                      }))}
                    />
                    <Popconfirm title={T.removeParticipant} onConfirm={() => removeParticipant(p.id)} okText={t.common.delete} cancelText={t.common.cancel} okButtonProps={{ danger: true }}>
                      <Tooltip title={T.removeParticipant}>
                        <Button type="text" danger size="small" icon={<DeleteOutlined />} className="tr-pm__remove" />
                      </Tooltip>
                    </Popconfirm>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
