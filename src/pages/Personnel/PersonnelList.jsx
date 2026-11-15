import { useCreateParam } from '../../utils/useCreateParam';
import React, { useState } from 'react';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import LotusEmpty from '../../components/LotusEmpty/LotusEmpty';
import {
  Table, Button, Input, Select, Avatar, Popconfirm, Tooltip, Pagination, Segmented,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, FileExcelOutlined, TableOutlined, AppstoreOutlined, TeamOutlined,
} from '@ant-design/icons';
import { exportToExcel } from '../../utils/exportData';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PersonnelFormModal from './PersonnelForm';
import { usePersonnelList } from './usePersonnelList';
import {
  toneOf, statusToneOf, positionLabel, initialOf, imgSrc,
} from './personnelShared';
import { useLanguage } from '../../i18n/LanguageContext';
import './PersonnelList.css';
import './peopleShared.css';

export default function PersonnelList() {
  const {
    data, loading, total, page, search, filterType, filterStatus,
    modalOpen, editRecord,
    setPage, setSearch, setFilterType, setFilterStatus,
    setModalOpen, setEditRecord,
    fetchData, handleDelete,
  } = usePersonnelList();

  const { canManage, isAdmin, hasRole } = useAuth();
  useCreateParam(() => openEdit(null), canManage());
  const navigate = useNavigate();
  const { t: tt } = useLanguage();
  const P = tt.personnel;
  const [viewMode, setViewMode] = useState('table');
  const canRemove = isAdmin() || hasRole('truotri');
  const isFiltered = Boolean(search.trim() || filterType || filterStatus);

  const openDetail = (r) => navigate(`/app/personnel/${r.id}`);
  const openEdit = (r) => { setEditRecord(r); setModalOpen(true); };

  const handleExport = () => {
    exportToExcel(data, [
      { header: P.colCode, key: 'code' },
      { header: tt.common.name, key: 'fullName' },
      { header: P.dharmName, key: 'dharmName' },
      { header: tt.common.type, render: (r) => P.types[r.type] || r.type },
      { header: P.colPosition, render: (r) => positionLabel(tt, r.position) },
      { header: P.colPhone, key: 'phone' },
      { header: tt.common.email, key: 'email' },
      { header: tt.common.status, render: (r) => P.statuses[r.status] || r.status },
    ], 'nhan-su');
  };

  const ActionBtns = ({ r }) => (
    <div className="personnel-action-group" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Tooltip title={P.viewDetail}>
        <Button type="text" aria-label={P.viewDetail} icon={<EyeOutlined />} onClick={() => openDetail(r)} />
      </Tooltip>
      {canManage() && (
        <Tooltip title={P.editTooltip}>
          <Button type="text" aria-label={P.editTooltip} icon={<EditOutlined />} onClick={() => openEdit(r)} />
        </Tooltip>
      )}
      {canRemove && (
        <Popconfirm title={tt.common.confirmDelete} onConfirm={() => handleDelete(r.id)} okText={tt.common.delete} cancelText={tt.common.cancel} okButtonProps={{ danger: true }}>
          <Tooltip title={tt.common.delete}>
            <Button type="text" danger aria-label={tt.common.delete} icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      )}
    </div>
  );

  const avatarOf = (r, size) => {
    const tone = toneOf(r.type);
    return r.photo
      ? <Avatar src={imgSrc(r.photo)} size={size} className="person-cell__avatar" />
      : <Avatar size={size} className="person-cell__avatar" style={{ background: tone.s, color: tone.c, fontWeight: 700 }}>{initialOf(r.fullName)}</Avatar>;
  };

  const columns = [
    {
      title: P.colName,
      key: 'name',
      width: 280,
      render: (_, r) => (
        <div className="person-cell">
          {avatarOf(r, 40)}
          <div className="person-cell__text">
            <div className="person-cell__name">{r.fullName}</div>
            <div className="person-cell__sub">
              {r.dharmName && <span>{r.dharmName}</span>}
              {r.dharmName && r.code && <span className="person-cell__sep">·</span>}
              {r.code && <span className="tbl-mono">{r.code}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: P.colType,
      dataIndex: 'type',
      width: 150,
      render: (v) => {
        const tone = toneOf(v);
        return <span className="tbl-pill" style={{ color: tone.c, background: tone.s }}>{P.types[v] || v}</span>;
      },
    },
    {
      title: P.colPosition,
      dataIndex: 'position',
      width: 160,
      render: (v) => v
        ? <span style={{ color: '#5a4636' }}>{positionLabel(tt, v)}</span>
        : <span className="tbl-muted">—</span>,
    },
    {
      title: P.colPhone,
      dataIndex: 'phone',
      width: 140,
      render: (v) => v
        ? <span className="tbl-mono" style={{ color: '#5a4636' }}>{v}</span>
        : <span className="tbl-muted">—</span>,
    },
    {
      title: tt.common.status,
      dataIndex: 'status',
      width: 160,
      render: (v) => {
        const tone = statusToneOf(v);
        return (
          <span className="tbl-pill" style={{ color: tone.c, background: tone.s }}>
            <span className="tbl-pill__dot" />{P.statuses[v] || v}
          </span>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      align: 'right',
      render: (_, r) => <ActionBtns r={r} />,
    },
  ];

  if (loading && !data.length && !isFiltered) return <PageSpinner />;

  const emptyNode = isFiltered
    ? <LotusEmpty description={P.emptyFiltered} hint={P.emptyFilteredHint} />
    : <LotusEmpty description={P.emptyTitle} hint={canManage() ? P.emptyHint : ''} />;

  return (
    <div className="pp-page">
      {/* ── Header ── */}
      <section className="pp-hero section-anim section-d0">
        <div className="pp-hero__main">
          <div className="pp-hero__icon"><TeamOutlined /></div>
          <div>
            <h1 className="pp-hero__title">{P.title}</h1>
            <p className="pp-hero__sub">{P.subtitle}</p>
          </div>
        </div>
        {canManage() && (
          <div className="pp-hero__actions">
            <Button type="primary" icon={<PlusOutlined />} className="pp-hero__btn" onClick={() => openEdit(null)}>
              {P.addNew}
            </Button>
          </div>
        )}
      </section>

      <section className="pp-card section-anim section-d1">
        {/* ── Toolbar ── */}
        <div className="pp-toolbar">
          <Input
            className="pp-search"
            placeholder={P.searchPlaceholder}
            prefix={<SearchOutlined style={{ color: '#bfae99' }} />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            allowClear
          />
          <Select className="pp-select" value={filterType} onChange={(v) => { setFilterType(v); setPage(1); }}
            options={[{ value: '', label: P.allTypes }, ...Object.entries(P.types).map(([k, v]) => ({ value: k, label: v }))]} />
          <Select className="pp-select" value={filterStatus} onChange={(v) => { setFilterStatus(v); setPage(1); }}
            options={[{ value: '', label: P.allStatuses }, ...Object.entries(P.statuses).map(([k, v]) => ({ value: k, label: v }))]} />
          <div className="pp-toolbar__end">
            <Segmented
              className="pp-seg"
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: 'table', icon: <TableOutlined />, title: P.tableView },
                { value: 'card', icon: <AppstoreOutlined />, title: P.cardView },
              ]}
            />
            <Button className="pp-tool-btn" icon={<FileExcelOutlined />} onClick={handleExport} disabled={!data.length}>
              {tt.common.exportExcel}
            </Button>
          </div>
        </div>

        {/* ── Content ── */}
        {viewMode === 'table' ? (
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              current: page, total, pageSize: 10, onChange: setPage, showSizeChanger: false,
              showTotal: (n, range) => `${range[0]}-${range[1]} / ${n} ${P.totalLabel}`,
            }}
            size="middle"
            className="personnel-table"
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: emptyNode }}
            onRow={(r) => ({ style: { cursor: 'pointer' }, onClick: () => openDetail(r) })}
          />
        ) : !data.length ? emptyNode : (
          <div className="personnel-card-grid">
            {data.map((r) => {
              const tone = toneOf(r.type);
              const st = statusToneOf(r.status);
              return (
                <div
                  key={r.id}
                  className="personnel-card"
                  role="link"
                  tabIndex={0}
                  aria-label={`${P.viewDetail}: ${r.dharmName || r.fullName}`}
                  onClick={() => openDetail(r)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(r); } }}
                >
                  <div className="personnel-card__accent" style={{ background: `linear-gradient(90deg, ${tone.c}, ${tone.s})` }} />
                  {r.code && <span className="personnel-card__code tbl-mono">{r.code}</span>}

                  <div className="personnel-card__body">
                    <div className="personnel-card__avatar">
                      {avatarOf(r, 72)}
                      <div className="personnel-card__avatar-ring" style={{ borderColor: tone.c }} />
                    </div>
                    <span className="tbl-pill" style={{ color: tone.c, background: tone.s }}>{P.types[r.type] || r.type}</span>
                    <div className="personnel-card__name">{r.dharmName || r.fullName}</div>
                    {r.dharmName && <div className="personnel-card__subname">{r.fullName}</div>}
                    {r.position && <div className="personnel-card__position">{positionLabel(tt, r.position)}</div>}
                    <div className="personnel-card__status" style={{ color: st.c }}>
                      <span className="personnel-card__status-dot" style={{ background: st.c }} />
                      {P.statuses[r.status] || r.status}
                    </div>
                  </div>

                  <div className="personnel-card__footer">
                    <ActionBtns r={r} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {viewMode === 'card' && total > 10 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Pagination
              current={page}
              total={total}
              pageSize={10}
              onChange={setPage}
              showSizeChanger={false}
              showTotal={(n, range) => `${range[0]}-${range[1]} / ${n} ${P.totalLabel}`}
            />
          </div>
        )}
      </section>

      <PersonnelFormModal
        open={modalOpen}
        record={editRecord}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); fetchData(); }}
      />
    </div>
  );
}
