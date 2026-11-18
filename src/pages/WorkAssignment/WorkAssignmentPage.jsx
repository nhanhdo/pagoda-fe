import { useCreateParam } from '../../utils/useCreateParam';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import LotusEmpty from '../../components/LotusEmpty/LotusEmpty';
import CountUp from '../../components/CountUp/CountUp';
import {
  Table, Button, Select, Modal, Form, Input, DatePicker, Popconfirm, Row, Col, Tooltip,
  Segmented, Dropdown, Avatar,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, TableOutlined, ProjectOutlined, UserOutlined,
  ClockCircleOutlined, SearchOutlined, CarryOutOutlined, SyncOutlined, CheckCircleOutlined,
  WarningOutlined, SwapOutlined, CheckOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useWorkAssignmentPage, WORK_STATUSES, PRIORITIES, STATUS_TONE, PRIORITY_TONE, isOverdue,
} from './useWorkAssignmentPage';
import { useLanguage } from '../../i18n/LanguageContext';
import { guardedClose, rules as makeRules } from '../../utils/formGuard';
import { HiddenSubmit } from '../Personnel/PersonnelForm';
import { personName, personOptionLabel, initialOf, TONES, pinLeft, PIN_RIGHT } from '../Personnel/personnelShared';
import '../Personnel/peopleShared.css';
import './WorkAssignmentPage.css';

const PRIORITY_RANK = Object.fromEntries(PRIORITIES.map((p, i) => [p, i]));

function Pill({ tone, dot, children }) {
  return (
    <span className="tbl-pill" style={{ color: tone.c, background: tone.s }}>
      {dot && <span className="tbl-pill__dot" />}{children}
    </span>
  );
}

/* Status menu: touch + keyboard alternative to drag & drop */
function StatusMenu({ record, W, onMove, children }) {
  const items = WORK_STATUSES.map(s => ({
    key: s,
    disabled: s === record.status,
    label: (
      <span className="wa-status-opt">
        <span className="wa-status-opt__dot" style={{ background: STATUS_TONE[s].c }} />
        {W.statuses[s]}
        {s === record.status && <CheckOutlined style={{ marginLeft: 'auto', color: STATUS_TONE[s].c }} />}
      </span>
    ),
  }));
  return (
    <Dropdown trigger={['click']} menu={{ items, onClick: ({ key, domEvent }) => { domEvent.stopPropagation(); onMove(record, key); } }}>
      {children}
    </Dropdown>
  );
}

/* ── Kanban card ──────────────────────────────────────── */
function KanbanCard({ record, W, t, canManage, onEdit, onDelete, onMove, onDragStart, onDragEnd }) {
  const overdue = isOverdue(record);
  const pr = PRIORITY_TONE[record.priority];
  return (
    <div
      className={`kanban-card${overdue ? ' is-overdue' : ''}`}
      draggable={canManage}
      onDragStart={(e) => onDragStart(e, record)}
      onDragEnd={onDragEnd}
      tabIndex={canManage ? 0 : -1}
      role={canManage ? 'button' : undefined}
      aria-label={record.title}
      onKeyDown={(e) => { if (canManage && e.key === 'Enter' && e.target === e.currentTarget) onEdit(record); }}
    >
      <div className="kanban-card__top">
        <div className="kanban-card__title">{record.title}</div>
        {canManage && (
          <div className="kanban-card__actions">
            <Tooltip title={t.common.edit}>
              <Button type="text" size="small" aria-label={t.common.edit} icon={<EditOutlined />} onClick={() => onEdit(record)} />
            </Tooltip>
            <Popconfirm title={W.confirmDelete} onConfirm={() => onDelete(record.id)}
              okText={t.common.delete} cancelText={t.common.cancel} okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger aria-label={t.common.delete} icon={<DeleteOutlined />} />
            </Popconfirm>
          </div>
        )}
      </div>

      {record.description && <div className="kanban-card__desc">{record.description}</div>}

      <div className="kanban-card__meta">
        {pr && <Pill tone={pr}>{W.priorities[record.priority] || record.priority}</Pill>}
        {record.personnel && (
          <span className="kanban-card__who"><UserOutlined /> {personName(record.personnel)}</span>
        )}
        {record.endDate && (
          <span className={`kanban-card__due${overdue ? ' is-overdue' : ''}`}>
            <ClockCircleOutlined /> {dayjs(record.endDate).format('DD/MM')}{overdue && ` · ${W.overdue}`}
          </span>
        )}
      </div>

      {canManage && (
        <StatusMenu record={record} W={W} onMove={onMove}>
          <button type="button" className="kanban-card__move" onClick={(e) => e.stopPropagation()}>
            <SwapOutlined /> {W.moveTo}
          </button>
        </StatusMenu>
      )}
    </div>
  );
}

/* ── Kanban board ─────────────────────────────────────── */
function KanbanBoard({ data, W, t, canManage, onEdit, onDelete, onMove }) {
  const [overCol, setOverCol] = useState(null);
  const dragCard = useRef(null);

  const handleDragStart = (e, record) => {
    dragCard.current = record;
    e.currentTarget.classList.add('kanban-card--dragging');
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('kanban-card--dragging');
    dragCard.current = null;
    setOverCol(null);
  };
  const handleDrop = (e, colKey) => {
    e.preventDefault();
    setOverCol(null);
    if (dragCard.current && dragCard.current.status !== colKey) onMove(dragCard.current, colKey);
  };

  return (
    <div className="kanban-board">
      {WORK_STATUSES.map(key => {
        const tone = STATUS_TONE[key];
        const cards = data.filter(d => d.status === key);
        return (
          <div
            key={key}
            className={`kanban-col${overCol === key ? ' kanban-col--over' : ''}`}
            style={{ '--tone': tone.c, '--tone-soft': tone.s }}
            onDragOver={(e) => { if (!canManage) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverCol(key); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOverCol(null); }}
            onDrop={(e) => handleDrop(e, key)}
          >
            <div className="kanban-col__header">
              <span className="kanban-col__label"><span className="tbl-pill__dot" style={{ background: tone.c }} />{W.statuses[key]}</span>
              <span className="kanban-col__count">{cards.length}</span>
            </div>
            {cards.map(record => (
              <KanbanCard
                key={record.id}
                record={record}
                W={W}
                t={t}
                canManage={canManage}
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMove}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            ))}
            {cards.length === 0 && <div className="kanban-col__empty">{W.emptyColumn}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ── Form modal ───────────────────────────────────────── */
function WorkFormModal({ open, record, personnel, saving, W, t, onClose, onSubmit }) {
  const [form] = Form.useForm();
  const R = makeRules(t);
  // Keep the current assignee selectable even if they are no longer active
  const people = record?.personnel && !personnel.some(p => p.id === record.personnel.id)
    ? [record.personnel, ...personnel] : personnel;

  useEffect(() => {
    if (!open) return;
    if (record) {
      form.setFieldsValue({
        ...record,
        personnelId: record.personnelId ?? record.personnel?.id,
        startDate: record.startDate ? dayjs(record.startDate) : null,
        endDate: record.endDate ? dayjs(record.endDate) : null,
      });
    } else {
      form.resetFields();
    }
  }, [open, record, form]);

  return (
    <Modal
      title={record ? W.editTitle : W.addTitle}
      open={open}
      onCancel={() => guardedClose(form, onClose, t)}
      onOk={() => form.submit()}
      okText={record ? t.common.update : t.common.add}
      cancelText={t.common.cancel}
      confirmLoading={saving}
      maskClosable={false}
      width={620}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} className="pp-form"
        initialValues={{ priority: 'trung_bình', status: 'chưa_bắt_đầu' }}>
        <HiddenSubmit />
        <Form.Item name="title" label={W.fieldTitle} rules={[{ ...R.required(W.fieldTitle.toLowerCase()), whitespace: true }]}>
          <Input autoFocus maxLength={200} />
        </Form.Item>
        <Form.Item name="description" label={t.common.description}><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="personnelId" label={W.colAssignee} rules={[R.select(W.colAssignee.toLowerCase())]}>
          <Select showSearch optionFilterProp="label" placeholder={W.assigneePlaceholder}
            options={people.map(p => ({ value: p.id, label: personOptionLabel(p) }))} />
        </Form.Item>
        <Form.Item name="priority" label={W.fieldPriority}>
          <Segmented block className="pp-seg" options={PRIORITIES.map(p => ({ value: p, label: W.priorities[p] }))} />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="startDate" label={W.fieldStartDate}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="endDate" label={W.colDeadline} dependencies={['startDate']}
              rules={[({ getFieldValue }) => R.notBefore(getFieldValue, 'startDate')]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="status" label={t.common.status}>
          <Select options={WORK_STATUSES.map(s => ({ value: s, label: W.statuses[s] }))} />
        </Form.Item>
        <Form.Item name="notes" label={t.common.notes} style={{ marginBottom: 0 }}><Input.TextArea rows={2} /></Form.Item>
      </Form>
    </Modal>
  );
}

/* ── Main page ────────────────────────────────────────── */
export default function WorkAssignmentPage() {
  const { t, lang } = useLanguage();
  const W = t.workAssignment;
  const {
    data, loading, saving,
    modalOpen, setModalOpen, editRecord, setEditRecord,
    personnel, handleSubmit, handleDelete, moveStatus, canManage,
  } = useWorkAssignmentPage();
  const manage = canManage();
  useCreateParam(() => openModal(), manage);
  const [viewMode, setViewMode] = useState('table');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const booted = useRef(false);
  const sawLoading = useRef(false);
  if (loading) sawLoading.current = true;
  else if (sawLoading.current) booted.current = true;

  const openModal = (record = null) => { setEditRecord(record); setModalOpen(true); };

  const assigneeOptions = useMemo(() => {
    const map = new Map();
    data.forEach(d => { if (d.personnel) map.set(d.personnel.id, personName(d.personnel)); });
    return [...map].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, lang));
  }, [data, lang]);

  // Board ignores the status filter (columns are the statuses)
  const base = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter(d => {
      if (filterAssignee && (d.personnel?.id ?? d.personnelId) !== filterAssignee) return false;
      if (filterPriority && d.priority !== filterPriority) return false;
      if (!q) return true;
      return [d.title, d.description, d.personnel?.fullName, d.personnel?.dharmName].some(v => v?.toLowerCase().includes(q));
    });
  }, [data, search, filterAssignee, filterPriority]);

  const rows = useMemo(() => {
    if (filterStatus === 'all') return base;
    if (filterStatus === 'overdue') return base.filter(isOverdue);
    return base.filter(d => d.status === filterStatus);
  }, [base, filterStatus]);

  const stats = useMemo(() => ({
    open: data.filter(d => d.status === 'chưa_bắt_đầu').length,
    doing: data.filter(d => d.status === 'đang_thực_hiện').length,
    done: data.filter(d => d.status === 'hoàn_thành').length,
    overdue: data.filter(isOverdue).length,
  }), [data]);

  const columns = [
    {
      fixed: pinLeft(),
      title: W.colTask, dataIndex: 'title', width: 300,
      sorter: (a, b) => String(a.title).localeCompare(String(b.title), lang),
      render: (v, r) => (
        <div style={{ minWidth: 0 }}>
          <div className="wa-task__title">{v}</div>
          {r.description && <div className="wa-task__desc">{r.description}</div>}
        </div>
      ),
    },
    {
      title: W.colAssignee, key: 'assignee', width: 200,
      sorter: (a, b) => personName(a.personnel).localeCompare(personName(b.personnel), lang),
      render: (_, r) => {
        const p = r.personnel;
        if (!p) return <span className="tbl-muted">—</span>;
        return (
          <div className="person-cell">
            <Avatar size={30} className="person-cell__avatar" style={{ background: TONES.amber.s, color: TONES.amber.c, fontWeight: 700 }}>{initialOf(p.fullName)}</Avatar>
            <div className="person-cell__text"><div className="person-cell__name">{personName(p)}</div></div>
          </div>
        );
      },
    },
    {
      title: W.fieldPriority, dataIndex: 'priority', width: 130,
      sorter: (a, b) => (PRIORITY_RANK[a.priority] ?? -1) - (PRIORITY_RANK[b.priority] ?? -1),
      render: (v) => (PRIORITY_TONE[v] ? <Pill tone={PRIORITY_TONE[v]}>{W.priorities[v] || v}</Pill> : <span className="tbl-muted">—</span>),
    },
    {
      title: W.colDeadline, dataIndex: 'endDate', width: 140,
      sorter: (a, b) => String(a.endDate || '9999').localeCompare(String(b.endDate || '9999')),
      render: (v, r) => {
        if (!v) return <span className="tbl-muted">—</span>;
        const overdue = isOverdue(r);
        return (
          <div>
            <div className="tbl-mono" style={{ color: overdue ? TONES.rose.c : '#3e2c1f', fontWeight: 600 }}>{dayjs(v).format('DD/MM/YYYY')}</div>
            {overdue && <div style={{ fontSize: 12, color: TONES.rose.c }}><WarningOutlined /> {W.overdue}</div>}
          </div>
        );
      },
    },
    {
      title: t.common.status, dataIndex: 'status', width: 170,
      sorter: (a, b) => WORK_STATUSES.indexOf(a.status) - WORK_STATUSES.indexOf(b.status),
      render: (v, r) => {
        const pill = <Pill dot tone={STATUS_TONE[v] || STATUS_TONE['chưa_bắt_đầu']}>{W.statuses[v] || v}</Pill>;
        return manage ? (
          <StatusMenu record={r} W={W} onMove={moveStatus}>
            <button type="button" className="wa-status-btn" aria-label={`${t.common.status}: ${W.statuses[v] || v}`}>{pill}</button>
          </StatusMenu>
        ) : pill;
      },
    },
    ...(manage ? [{
      title: '', key: 'actions', fixed: PIN_RIGHT, width: 96, align: 'right',
      render: (_, r) => (
        <div className="personnel-action-group">
          <Tooltip title={t.common.edit}>
            <Button type="text" aria-label={t.common.edit} icon={<EditOutlined />} onClick={() => openModal(r)} />
          </Tooltip>
          <Popconfirm title={W.confirmDelete} onConfirm={() => handleDelete(r.id)}
            okText={t.common.delete} cancelText={t.common.cancel} okButtonProps={{ danger: true }}>
            <Tooltip title={t.common.delete}>
              <Button type="text" danger aria-label={t.common.delete} icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    }] : []),
  ];

  if (!booted.current && !data.length) return <PageSpinner />;

  const statTiles = [
    { key: 'open', filter: 'chưa_bắt_đầu', label: W.statuses['chưa_bắt_đầu'], value: stats.open, icon: <CarryOutOutlined />, tone: TONES.amber },
    { key: 'doing', filter: 'đang_thực_hiện', label: W.statuses['đang_thực_hiện'], value: stats.doing, icon: <SyncOutlined />, tone: TONES.sky },
    { key: 'done', filter: 'hoàn_thành', label: W.statuses['hoàn_thành'], value: stats.done, icon: <CheckCircleOutlined />, tone: TONES.sage },
    { key: 'overdue', filter: 'overdue', label: W.overdue, value: stats.overdue, icon: <WarningOutlined />, tone: TONES.rose },
  ];
  const isFiltered = Boolean(search.trim() || filterAssignee || filterPriority || filterStatus !== 'all');

  return (
    <div className="pp-page">
      {/* ── Header ── */}
      <section className="pp-hero section-anim section-d0">
        <div className="pp-hero__main">
          <div className="pp-hero__icon"><CarryOutOutlined /></div>
          <div>
            <h1 className="pp-hero__title">{W.title}</h1>
            <p className="pp-hero__sub">{W.subtitle}</p>
          </div>
        </div>
        {manage && (
          <div className="pp-hero__actions">
            <Button type="primary" icon={<PlusOutlined />} className="pp-hero__btn" onClick={() => openModal()}>{W.addNew}</Button>
          </div>
        )}
      </section>

      {/* ── Stats ── */}
      <div className="pp-stats section-anim section-d1">
        {statTiles.map(s => (
          <button
            type="button"
            key={s.key}
            className={`pp-stat wa-stat${filterStatus === s.filter ? ' is-active' : ''}`}
            aria-pressed={filterStatus === s.filter}
            style={{ '--st': s.tone.c, '--st-soft': s.tone.s }}
            onClick={() => {
              setFilterStatus(cur => (cur === s.filter ? 'all' : s.filter));
              setViewMode('table');
            }}
          >
            <span className="pp-stat__icon">{s.icon}</span>
            <span className="pp-stat__body">
              <span className="pp-stat__value"><CountUp value={s.value} /></span>
              <span className="pp-stat__label">{s.label}</span>
            </span>
          </button>
        ))}
      </div>

      <section className="pp-card section-anim section-d2">
        {/* ── Toolbar ── */}
        <div className="pp-toolbar">
          <Segmented
            className="pp-seg"
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'table', icon: <TableOutlined />, label: W.tooltipTable },
              { value: 'kanban', icon: <ProjectOutlined />, label: W.tooltipKanban },
            ]}
          />
          <Input
            className="pp-search"
            placeholder={W.searchPlaceholder}
            prefix={<SearchOutlined style={{ color: '#bfae99' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          <Select className="pp-select" value={filterAssignee} onChange={setFilterAssignee} showSearch optionFilterProp="label"
            options={[{ value: '', label: W.allAssignees }, ...assigneeOptions]} />
          <Select className="pp-select" value={filterPriority} onChange={setFilterPriority}
            options={[{ value: '', label: W.allPriorities }, ...PRIORITIES.map(p => ({ value: p, label: W.priorities[p] }))]} />
          {viewMode === 'table' && (
            <Select className="pp-select" value={filterStatus} onChange={setFilterStatus}
              options={[
                { value: 'all', label: W.allStatuses },
                ...WORK_STATUSES.map(s => ({ value: s, label: W.statuses[s] })),
                { value: 'overdue', label: W.overdue },
              ]} />
          )}
        </div>

        {viewMode === 'table' ? (
          <Table
            dataSource={rows}
            columns={columns}
            rowKey="id"
            loading={loading}
            size="middle"
            className="personnel-table"
            scroll={{ x: 'max-content' }}
            pagination={rows.length > 10 ? { pageSize: 10, showSizeChanger: false } : false}
            locale={{
              emptyText: isFiltered
                ? <LotusEmpty description={W.emptyFiltered} hint={W.emptyFilteredHint} />
                : <LotusEmpty description={W.emptyTitle} hint={manage ? W.emptyHint : ''} />,
            }}
          />
        ) : (
          <KanbanBoard
            data={base}
            W={W}
            t={t}
            canManage={manage}
            onEdit={openModal}
            onDelete={handleDelete}
            onMove={moveStatus}
          />
        )}
      </section>

      <WorkFormModal
        open={modalOpen}
        record={editRecord}
        personnel={personnel}
        saving={saving}
        W={W}
        t={t}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
