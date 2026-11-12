import React, { useState } from 'react';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import {
  Table, Button, Input, Select, Space, Card, Modal,
  Avatar, Popconfirm, Tooltip, Badge, Pagination,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, FileExcelOutlined, TableOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import { exportToExcel } from '../../utils/exportData';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PersonnelForm from './PersonnelForm';
import {
  usePersonnelList, typeColors, statusColors,
} from './usePersonnelList';
import { BASE_URL } from '../News/useNewsPage';
import { useLanguage } from '../../i18n/LanguageContext';
import './PersonnelList.css';

const imgSrc = (p) => !p ? null : p.startsWith('http') ? p : `${BASE_URL}${p}`;

const { Option } = Select;

const TYPE_TONE = {
  tang_ni:          { c: '#c47f36', s: '#fbf1e4' },
  cu_si:            { c: '#4f9a72', s: '#e8f4ed' },
  phat_tu:          { c: '#4d8fc7', s: '#e9f1fb' },
  tinh_nguyen_vien: { c: '#8b6fc9', s: '#f1edfb' },
  nhan_vien:        { c: '#d9646c', s: '#fdeeee' },
};
const toneOf = (type) => TYPE_TONE[type] || TYPE_TONE.tang_ni;
const TYPE_ACCENT = Object.fromEntries(Object.entries(TYPE_TONE).map(([k, v]) => [k, v.c]));

const STATUS_TONE = {
  'đang_hoạt_động': { c: '#3f8461', s: '#e8f4ed' },
  'tạm_nghỉ':       { c: '#b9841f', s: '#fdf3dc' },
  'đã_rời':         { c: '#8c7a6b', s: '#f2ede6' },
};

const initialOf = (name = '') => name.trim().split(/\s+/).pop()?.[0]?.toUpperCase() || '?';
const capitalize = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

export default function PersonnelList() {
  const {
    data, loading, total, page, search, filterType, filterStatus,
    modalOpen, editRecord,
    setPage, setSearch, setFilterType, setFilterStatus,
    setModalOpen, setEditRecord,
    fetchData, handleDelete,
  } = usePersonnelList();

  const { canManage, isAdmin, hasRole } = useAuth();
  const navigate = useNavigate();
  const { t: tt } = useLanguage();
  const [viewMode, setViewMode] = useState('table');

  const handleExport = () => {
    exportToExcel(data, [
      { header: tt.personnel.colCode, key: 'code' },
      { header: tt.common.name, key: 'fullName' },
      { header: tt.personnel.dharmName, key: 'dharmName' },
      { header: tt.common.type, render: (r) => tt.personnel.types[r.type] || r.type },
      { header: tt.personnel.colPosition, key: 'position' },
      { header: tt.personnel.colPhone, key: 'phone' },
      { header: tt.common.email, key: 'email' },
      { header: tt.common.status, render: (r) => tt.personnel.statuses[r.status] || r.status },
    ], 'nhan-su');
  };

  const ActionBtns = ({ r }) => (
    <div className="personnel-action-group" onClick={(e) => e.stopPropagation()}>
      <Tooltip title={tt.personnel.viewDetail}>
        <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/app/personnel/${r.id}`)} />
      </Tooltip>
      {canManage() && (
        <Tooltip title={tt.personnel.editTooltip}>
          <Button type="text" icon={<EditOutlined />} onClick={() => { setEditRecord(r); setModalOpen(true); }} />
        </Tooltip>
      )}
      {(isAdmin() || hasRole('truotri')) && (
        <Popconfirm title={tt.common.confirmDelete} onConfirm={() => handleDelete(r.id)} okText={tt.common.delete} cancelText={tt.common.cancel} okButtonProps={{ danger: true }}>
          <Tooltip title={tt.common.delete}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      )}
    </div>
  );

  const columns = [
    {
      title: tt.personnel.colName,
      key: 'name',
      width: 280,
      render: (_, r) => {
        const tone = toneOf(r.type);
        return (
          <div className="person-cell">
            {r.photo
              ? <Avatar src={imgSrc(r.photo)} size={40} className="person-cell__avatar" />
              : <Avatar size={40} className="person-cell__avatar" style={{ background: tone.s, color: tone.c }}>{initialOf(r.fullName)}</Avatar>}
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
      title: tt.personnel.colType,
      dataIndex: 'type',
      width: 150,
      render: (v) => {
        const tone = toneOf(v);
        return <span className="tbl-pill" style={{ color: tone.c, background: tone.s }}>{tt.personnel.types[v] || v}</span>;
      },
    },
    {
      title: tt.personnel.colPosition,
      dataIndex: 'position',
      width: 160,
      render: (v) => v
        ? <span style={{ color: '#5a4636' }}>{capitalize(v.replace(/_/g, ' '))}</span>
        : <span className="tbl-muted">—</span>,
    },
    {
      title: tt.personnel.colPhone,
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
        const tone = STATUS_TONE[v] || STATUS_TONE['đã_rời'];
        return (
          <span className="tbl-pill" style={{ color: tone.c, background: tone.s }}>
            <span className="tbl-pill__dot" />{tt.personnel.statuses[v] || v}
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

  if (loading && !data.length) return <PageSpinner />;

  return (
    <Card>
      {/* ── Toolbar ── */}
      <div className="personnel-list-toolbar section-anim section-d0">
        <Space wrap>
          <Input
            placeholder={tt.personnel.searchPlaceholder}
            prefix={<SearchOutlined style={{ color: '#c09070' }} />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 'min(240px, 100%)', borderColor: '#ddbfa0' }}
            allowClear
          />
          <Select value={filterType} onChange={(v) => { setFilterType(v); setPage(1); }}
            style={{ width: 'min(150px, 100%)' }}>
            <Option value="">{tt.personnel.allTypes}</Option>
            {Object.entries(tt.personnel.types).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
          </Select>
          <Select value={filterStatus} onChange={(v) => { setFilterStatus(v); setPage(1); }}
            style={{ width: 'min(160px, 100%)' }}>
            <Option value="">{tt.personnel.allStatuses}</Option>
            {Object.entries(tt.personnel.statuses).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
          </Select>
        </Space>
        <Space size={6}>
          <div className="view-toggle">
            <Button
              type={viewMode === 'table' ? 'primary' : 'text'}
              icon={<TableOutlined />}
              onClick={() => setViewMode('table')}
              style={viewMode === 'table' ? { backgroundColor: '#b06f2c', borderColor: '#b06f2c' } : {}}
            />
            <Button
              type={viewMode === 'card' ? 'primary' : 'text'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('card')}
              style={viewMode === 'card' ? { backgroundColor: '#b06f2c', borderColor: '#b06f2c' } : {}}
            />
          </div>
          <Button icon={<FileExcelOutlined />} onClick={handleExport}
            style={{ color: '#217346', borderColor: '#217346' }}>
            Excel
          </Button>
          {canManage() && (
            <Button type="primary" icon={<PlusOutlined />}
              onClick={() => { setEditRecord(null); setModalOpen(true); }}>
              {tt.personnel.addNew}
            </Button>
          )}
        </Space>
      </div>

      {/* ── Content ── */}
      <div className="section-anim section-d1">
        {viewMode === 'table' ? (
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              current: page, total, pageSize: 10, onChange: setPage,
              showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} ${tt.personnel.totalLabel}`,
            }}
            size="middle"
            className="personnel-table"
            scroll={{ x: 'max-content' }}
            onRow={(r) => ({
              style: { cursor: 'pointer' },
              onClick: () => navigate(`/app/personnel/${r.id}`),
            })}
          />
        ) : (
          <div className="personnel-card-grid">
            {data.map((r) => {
              const accent = TYPE_ACCENT[r.type] || '#b06f2c';
              return (
                <div key={r.id} className="personnel-card"
                  onClick={() => navigate(`/app/personnel/${r.id}`)}>

                  {/* accent top bar */}
                  <div className="personnel-card__accent"
                    style={{ background: `linear-gradient(90deg, ${accent}, ${accent}99)` }} />

                  {/* code badge */}
                  <span className="personnel-card__code">{r.code}</span>

                  <div className="personnel-card__body">
                    {/* avatar with ring */}
                    <div className="personnel-card__avatar">
                      {r.photo
                        ? <Avatar src={imgSrc(r.photo)} size={72} />
                        : <Avatar size={72}
                            style={{ background: accent, fontSize: 28, fontWeight: 800 }}>
                            {r.fullName?.[0]}
                          </Avatar>
                      }
                      <div className="personnel-card__avatar-ring"
                        style={{ borderColor: accent }} />
                    </div>

                    {/* type pill */}
                    <span className="personnel-type-pill"
                      style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}40` }}>
                      {tt.personnel.types[r.type] || r.type}
                    </span>

                    <div className="personnel-card__name">
                      {r.dharmName || r.fullName}
                    </div>
                    {r.dharmName && (
                      <div className="personnel-card__subname">{r.fullName}</div>
                    )}

                    {r.position && (
                      <div className="personnel-card__position">
                        {r.position.replace(/_/g, ' ')}
                      </div>
                    )}

                    <div className="personnel-card__status">
                      <span className="personnel-card__status-dot"
                        style={{ background: r.status === 'đang_hoạt_động' ? '#52c41a' : '#bbb' }} />
                      {tt.personnel.statuses[r.status] || r.status}
                    </div>
                  </div>

                  {/* action footer */}
                  <div className="personnel-card__footer"
                    onClick={(e) => e.stopPropagation()}>
                    <Tooltip title={tt.personnel.viewDetail}>
                      <Button size="small" className="personnel-action-btn view" type="text"
                        icon={<EyeOutlined style={{ color: '#1890ff' }} />}
                        onClick={() => navigate(`/app/personnel/${r.id}`)} />
                    </Tooltip>
                    {canManage() && (
                      <Tooltip title={tt.personnel.editTooltip}>
                        <Button size="small" className="personnel-action-btn edit" type="text"
                          icon={<EditOutlined style={{ color: '#d48806' }} />}
                          onClick={() => { setEditRecord(r); setModalOpen(true); }} />
                      </Tooltip>
                    )}
                    {(isAdmin() || hasRole('truotri')) && (
                      <Popconfirm title={tt.common.confirmDelete}
                        onConfirm={() => handleDelete(r.id)}
                        okText={tt.common.delete} cancelText={tt.common.cancel}>
                        <Button size="small" className="personnel-action-btn del" type="text"
                          icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />} />
                      </Popconfirm>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {viewMode === 'card' && total > 10 && (
          <div className="personnel-table" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Pagination
              current={page}
              total={total}
              pageSize={10}
              onChange={setPage}
              showSizeChanger={false}
              showTotal={(n, range) => `${range[0]}-${range[1]} / ${n} ${tt.personnel.totalLabel}`}
            />
          </div>
        )}
      </div>

      <Modal
        title={editRecord ? tt.personnel.editTitle : tt.personnel.addTitle}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        <PersonnelForm
          record={editRecord}
          onSuccess={() => { setModalOpen(false); fetchData(); }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </Card>
  );
}
