import React, { useState } from 'react';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import {
  Table, Button, Input, Select, Space, Card, Modal,
  Avatar, Popconfirm, Tooltip, Badge,
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

/* type → accent color for card/ring */
const TYPE_ACCENT = {
  'tăng_ni':  '#8B4513',
  'cư_sĩ':    '#1890ff',
  'phật_tử':  '#52c41a',
};

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
    <div className="personnel-action-group">
      <Tooltip title={tt.personnel.viewDetail}>
        <Button className="personnel-action-btn view" type="text"
          icon={<EyeOutlined style={{ color: '#1890ff', fontSize: 14 }} />}
          onClick={() => navigate(`/app/personnel/${r.id}`)} />
      </Tooltip>
      {canManage() && (
        <Tooltip title={tt.personnel.editTooltip}>
          <Button className="personnel-action-btn edit" type="text"
            icon={<EditOutlined style={{ color: '#d48806', fontSize: 14 }} />}
            onClick={() => { setEditRecord(r); setModalOpen(true); }} />
        </Tooltip>
      )}
      {(isAdmin() || hasRole('truotri')) && (
        <Popconfirm title={tt.common.confirmDelete} onConfirm={() => handleDelete(r.id)} okText={tt.common.delete} cancelText={tt.common.cancel}>
          <Button className="personnel-action-btn del" type="text"
            icon={<DeleteOutlined style={{ color: '#ff4d4f', fontSize: 14 }} />} />
        </Popconfirm>
      )}
    </div>
  );

  const columns = [
    {
      title: tt.personnel.colCode,
      dataIndex: 'code',
      width: 90,
      render: (v) => <span className="personnel-code-chip">{v}</span>,
    },
    {
      title: tt.personnel.colPhoto,
      dataIndex: 'photo',
      width: 56,
      render: (photo, r) => {
        const accent = TYPE_ACCENT[r.type] || '#8B4513';
        return (
          <div style={{ position: 'relative', width: 40, height: 40 }}>
            {photo
              ? <Avatar src={imgSrc(photo)} size={40} style={{ border: `2.5px solid ${accent}` }} />
              : <Avatar size={40} style={{ background: accent, fontWeight: 700, fontSize: 16, border: `2.5px solid ${accent}` }}>{r.fullName?.[0]}</Avatar>
            }
          </div>
        );
      },
    },
    {
      title: tt.personnel.colName,
      width: 200,
      render: (_, r) => (
        <div>
          <div className="personnel-name-cell__main">{r.fullName}</div>
          {r.dharmName && <div className="personnel-name-cell__dharm">{r.dharmName}</div>}
        </div>
      ),
    },
    {
      title: tt.personnel.colType,
      dataIndex: 'type',
      width: 130,
      render: (v) => {
        const accent = TYPE_ACCENT[v] || '#8B4513';
        return (
          <span
            className="personnel-type-pill"
            style={{
              background: `${accent}18`,
              color: accent,
              border: `1px solid ${accent}40`,
            }}
          >
            {tt.personnel.types[v] || v}
          </span>
        );
      },
    },
    {
      title: tt.personnel.colPosition,
      dataIndex: 'position',
      width: 150,
      render: (v) => v
        ? <span style={{ color: '#5c3317', fontSize: 13 }}>{v.replace(/_/g, ' ')}</span>
        : <span style={{ color: '#ccc' }}>—</span>,
    },
    {
      title: tt.personnel.colPhone,
      dataIndex: 'phone',
      width: 130,
      render: (v) => v
        ? <span style={{ fontFamily: 'monospace', letterSpacing: 0.5 }}>{v}</span>
        : <span style={{ color: '#ccc' }}>—</span>,
    },
    {
      title: tt.common.status,
      dataIndex: 'status',
      width: 150,
      render: (v) => <Badge status={statusColors[v]} text={tt.personnel.statuses[v]} />,
    },
    {
      title: tt.common.actions,
      width: 110,
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
              style={viewMode === 'table' ? { backgroundColor: '#8B4513', borderColor: '#8B4513' } : {}}
            />
            <Button
              type={viewMode === 'card' ? 'primary' : 'text'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('card')}
              style={viewMode === 'card' ? { backgroundColor: '#8B4513', borderColor: '#8B4513' } : {}}
            />
          </div>
          <Button icon={<FileExcelOutlined />} onClick={handleExport}
            style={{ color: '#217346', borderColor: '#217346' }}>
            Excel
          </Button>
          {canManage() && (
            <Button type="primary" icon={<PlusOutlined />}
              onClick={() => { setEditRecord(null); setModalOpen(true); }}
              style={{ backgroundColor: '#2e7d32', borderColor: '#2e7d32' }}>
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
              const accent = TYPE_ACCENT[r.type] || '#8B4513';
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
