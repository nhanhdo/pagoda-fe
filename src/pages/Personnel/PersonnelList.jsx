import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Avatar, Button, ConfigProvider, Input, Modal, Pagination, Segmented, Select, Skeleton, Spin, Table, Tooltip,
} from 'antd';
import {
  AppstoreOutlined, DeleteOutlined, EditOutlined, EyeOutlined, FileExcelOutlined,
  PlusOutlined, SearchOutlined, TableOutlined,
} from '@ant-design/icons';
import { useReducedMotion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LotusEmpty from '../../components/LotusEmpty/LotusEmpty';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCreateParam } from '../../utils/useCreateParam';
import { exportToExcel } from '../../utils/exportData';
import PersonnelFormModal from './PersonnelForm';
import { usePersonnelList } from './usePersonnelList';
import { initialOf, imgSrc, positionLabel, statusToneOf, toneOf } from './personnelShared';
import './peopleShared.css';
import './PersonnelList.css';

// Only restore the matching history entry when returning from a personnel profile.
let listReturn;

function PersonIdentity({ record, link, onOpen, phoneLabel }) {
  const tone = toneOf(record.type);
  return (
    <div className="person-cell">
      <Avatar size={36} src={imgSrc(record.photo)} className="person-cell__avatar"
        style={{ background: tone.s, color: '#61452f' }}>
        {initialOf(record.fullName)}
      </Avatar>
      <div className="person-cell__text">
        <Link className="person-cell__name" {...link} onClick={onOpen}>{record.fullName}</Link>
        {(record.dharmName || record.code || (phoneLabel && record.phone)) && (
          <div className="person-cell__sub">
            {record.dharmName && <span>{record.dharmName}</span>}
            {record.dharmName && record.code && <span aria-hidden="true">·</span>}
            {record.code && <span className="tbl-mono">{record.code}</span>}
            {phoneLabel && record.phone && (
              <a className="personnel-phone" href={`tel:${record.phone}`} aria-label={`${phoneLabel}: ${record.phone}`}>
                {(record.dharmName || record.code) && <span aria-hidden="true">· </span>}
                {record.phone}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PersonBadge({ value, labels, status = false }) {
  const tone = status ? statusToneOf(value) : toneOf(value);
  return (
    <span className={`tbl-pill personnel-badge${status ? ' personnel-badge--status' : ''}`} style={{ background: tone.s }}>
      {status && <span className="tbl-pill__dot" style={{ background: tone.c }} />}
      {labels[value] || value || '—'}
    </span>
  );
}

export default function PersonnelList() {
  const {
    data, total, loading, loadError, page, search, filterType, filterStatus, viewChoice,
    setPage, setSearch, setFilterType, setFilterStatus, setViewChoice, clearFilters, refresh, handleDelete,
  } = usePersonnelList();
  const { canManage, isAdmin, hasRole } = useAuth();
  const { t } = useLanguage();
  const P = t.personnel;
  const location = useLocation();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 991px)').matches);
  const [editor, setEditor] = useState({ open: false, record: null });
  const [deletion, setDeletion] = useState({ open: false, record: null });
  const [deleting, setDeleting] = useState(false);
  const root = useRef(null);
  const searchInput = useRef(null);
  const dialogTrigger = useRef(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 991px)');
    const update = () => setNarrow(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const viewMode = ['table', 'card'].includes(viewChoice) ? viewChoice : narrow ? 'card' : 'table';
  const filtered = Boolean(search.trim() || filterType || filterStatus);
  const editable = canManage();
  const removable = isAdmin() || hasRole('truotri');

  const rememberTrigger = (event) => { dialogTrigger.current = event?.currentTarget ?? document.activeElement; };
  const restoreTrigger = () => {
    const trigger = dialogTrigger.current;
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    else searchInput.current?.focus({ preventScroll: true });
  };
  const openEditor = (record, event) => {
    rememberTrigger(event);
    setEditor({ open: true, record });
  };
  const closeEditor = () => setEditor(current => ({ ...current, open: false }));
  useCreateParam(() => openEditor(null), editable);

  const scrollContainer = () => root.current?.closest('.ant-layout-content');
  const detailLink = (r) => ({ to: `/app/personnel/${r.id}`, state: { personnelList: true } });
  const rememberList = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    listReturn = { key: location.key, top: scrollContainer()?.scrollTop ?? 0 };
    return true;
  };
  const openRow = (event, record) => {
    if (event.target.closest('a, button') || !rememberList(event)) return;
    const { to, state } = detailLink(record);
    navigate(to, { state });
  };
  useEffect(() => {
    if (loading || loadError || listReturn?.key !== location.key) return;
    const saved = listReturn;
    // Restore after the layout has handled route scrolling and rows are in the DOM.
    const frame = requestAnimationFrame(() => {
      const scroll = scrollContainer();
      if (!scroll || listReturn !== saved) return;
      scroll.scrollTop = saved.top;
      listReturn = undefined;
    });
    return () => cancelAnimationFrame(frame);
  }, [loading, loadError, location.key]);

  const confirmDelete = async () => {
    if (deleting || !deletion.open) return;
    setDeleting(true);
    const removed = await handleDelete(deletion.record.id);
    setDeleting(false);
    if (removed) {
      dialogTrigger.current = null;
      setDeletion(current => ({ ...current, open: false }));
    }
  };

  const handleExport = () => exportToExcel(data, [
    { header: P.colCode, key: 'code' },
    { header: t.common.name, key: 'fullName' },
    { header: P.dharmName, key: 'dharmName' },
    { header: t.common.type, render: (r) => P.types[r.type] || r.type },
    { header: P.colPosition, render: (r) => positionLabel(t, r.position) },
    { header: P.colPhone, key: 'phone' },
    { header: t.common.email, key: 'email' },
    { header: t.common.status, render: (r) => P.statuses[r.status] || r.status },
  ], 'nhan-su');

  const renderActions = (r) => (
    <div className="personnel-action-group">
      <Tooltip title={P.viewDetail}>
        <Link className="personnel-action personnel-action--view" aria-label={P.viewDetail} {...detailLink(r)} onClick={rememberList}>
          <EyeOutlined />
        </Link>
      </Tooltip>
      {editable && (
        <Tooltip title={P.editTooltip}>
          <Button className="personnel-action" type="text" aria-label={P.editTooltip}
            icon={<EditOutlined />} onClick={(event) => openEditor(r, event)} />
        </Tooltip>
      )}
      {removable && (
        <Tooltip title={t.common.delete}>
          <Button className="personnel-action" type="text" danger aria-label={t.common.delete}
            icon={<DeleteOutlined />} onClick={(event) => { rememberTrigger(event); setDeletion({ open: true, record: r }); }} />
        </Tooltip>
      )}
    </div>
  );

  const identity = (r, phoneLabel) => <PersonIdentity record={r} link={detailLink(r)} onOpen={rememberList} phoneLabel={phoneLabel} />;
  const typeBadge = (r) => <PersonBadge value={r.type} labels={P.types} />;
  const statusBadge = (r) => <PersonBadge value={r.status} labels={P.statuses} status />;
  const columns = [
    { title: P.colName, key: 'name', width: 260, render: (_, r) => identity(r, P.colPhone) },
    {
      title: P.positionAndType, key: 'position', width: 174, render: (_, r) => (
        <div className="personnel-role">
          {r.position && <span>{positionLabel(t, r.position)}</span>}
          {typeBadge(r)}
        </div>
      ),
    },
    { title: t.common.status, key: 'status', width: 148, render: (_, r) => statusBadge(r) },
    { title: t.common.actions, key: 'actions', width: 160, align: 'right', render: (_, r) => renderActions(r) },
  ];
  const showData = data.length > 0 && !loadError;

  return (
    <ConfigProvider theme={{ token: {
      motion: !reducedMotion, motionDurationFast: '0.14s', motionDurationMid: '0.22s', motionDurationSlow: '0.22s',
    } }}>
      <div className="personnel-page" ref={root}>
        <section className="personnel-heading personnel-enter">
          <div>
            <h1>{P.title}</h1>
            <p>{P.subtitle}</p>
          </div>
          {editable && (
            <Button type="primary" icon={<PlusOutlined aria-hidden="true" />} className="personnel-primary" onClick={(event) => openEditor(null, event)}>
              {P.addNew}
            </Button>
          )}
        </section>

        <section className="personnel-surface personnel-enter">
          <div className="personnel-toolbar">
            <div className="personnel-toolbar__filters">
              <Input className="pp-search" ref={searchInput} aria-label={P.searchPlaceholder} placeholder={P.searchPlaceholder}
                prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear />
              <Select className="pp-select" aria-label={P.colType} value={filterType} onChange={setFilterType}
                popupMatchSelectWidth={false}
                options={[{ value: '', label: P.allTypes }, ...Object.entries(P.types).map(([value, label]) => ({ value, label }))]} />
              <Select className="pp-select" aria-label={t.common.status} value={filterStatus} onChange={setFilterStatus}
                popupMatchSelectWidth={false}
                options={[{ value: '', label: P.allStatuses }, ...Object.entries(P.statuses).map(([value, label]) => ({ value, label }))]} />
            </div>
            <div className="personnel-toolbar__tools">
              <Segmented className="personnel-mode" aria-label={P.displayMode} value={viewMode} onChange={setViewChoice}
                options={[
                  { value: 'table', icon: <TableOutlined aria-hidden="true" />, label: P.tableView },
                  { value: 'card', icon: <AppstoreOutlined aria-hidden="true" />, label: P.cardView },
                ]} />
              <Button className="personnel-export" icon={<FileExcelOutlined aria-hidden="true" />} onClick={handleExport} disabled={!showData || loading}>
                {t.common.exportExcel}
              </Button>
            </div>
          </div>

          <div className="personnel-list" aria-busy={loading}>
            <div className="personnel-results" role="status">
              {!loading && !loadError && <span>{total} {P.totalLabel}</span>}
            </div>
            {loadError && !loading ? (
              <Alert className="personnel-feedback" showIcon type="error" message={P.loadError}
                action={<Button onClick={refresh}>{P.retry}</Button>} />
            ) : loading && !data.length ? (
              <div className="personnel-skeleton"><Skeleton active title={false} paragraph={{ rows: 5 }} /></div>
            ) : showData ? (
              <Spin spinning={loading} delay={160}>
                <div key={viewMode} className="personnel-view">
                  {viewMode === 'table' ? (
                    <Table className="personnel-table" dataSource={data} columns={columns} rowKey="id"
                      size="middle" pagination={false} scroll={{ x: 742 }}
                      onRow={(record) => ({ onClick: (event) => openRow(event, record) })} />
                  ) : (
                    <div className="personnel-card-grid">
                      {data.map(r => (
                        <article className="personnel-card" key={r.id}>
                          {identity(r)}
                          {r.position && <div className="personnel-card__position">{positionLabel(t, r.position)}</div>}
                          <div className="personnel-card__badges">{typeBadge(r)}{statusBadge(r)}</div>
                          <div className="personnel-card__footer">{renderActions(r)}</div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </Spin>
            ) : (
              <div className="personnel-feedback personnel-empty">
                <LotusEmpty description={filtered ? P.emptyFiltered : P.emptyTitle}
                  hint={filtered ? P.emptyFilteredHint : editable ? P.emptyHint : ''} />
                {filtered && <Button onClick={clearFilters}>{P.clearFilters}</Button>}
              </div>
            )}
            {showData && total > 10 && (
              <Pagination className="personnel-pagination" current={page} total={total} pageSize={10} onChange={setPage}
                responsive showSizeChanger={false} showTotal={(n, range) => `${range[0]}–${range[1]} / ${n}`} />
            )}
          </div>
        </section>

        <PersonnelFormModal open={editor.open} record={editor.record} onClose={closeEditor} afterClose={restoreTrigger}
          onSaved={() => { closeEditor(); refresh(); }} />
        <Modal className="personnel-dialog" open={deletion.open} title={t.common.confirmDelete}
          onCancel={() => { if (!deleting) setDeletion(current => ({ ...current, open: false })); }} onOk={confirmDelete}
          okText={t.common.delete} cancelText={t.common.cancel} confirmLoading={deleting}
          maskClosable={false} keyboard={!deleting} afterClose={restoreTrigger} focusTriggerAfterClose={false}
          cancelButtonProps={{ disabled: deleting, autoFocus: true }} okButtonProps={{ danger: true }}>
          <p>{deletion.record?.fullName}</p>
        </Modal>
      </div>
    </ConfigProvider>
  );
}
