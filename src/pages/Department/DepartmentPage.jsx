import React, { useMemo, useState } from 'react';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import CountUp from '../../components/CountUp/CountUp';
import {
  Button, Modal, Form, Input, message, Avatar, Tooltip, Drawer, Dropdown,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, TeamOutlined, SearchOutlined,
  EllipsisOutlined, RightOutlined, SafetyCertificateOutlined, BookOutlined,
  WalletOutlined, HeartOutlined, ReadOutlined, ApartmentOutlined, UserOutlined,
} from '@ant-design/icons';
import api from '../../api/axios';
import { useDepartmentPage, getDeptTheme } from './useDepartmentPage';
import { useLanguage } from '../../i18n/LanguageContext';
import { initializeForm, guardedClose, rules as makeRules } from '../../utils/formGuard';
import { HiddenSubmit } from '../Personnel/PersonnelForm';
import { positionLabel } from '../Personnel/personnelShared';
import './DepartmentPage.css';

const ICONS = {
  safety: <SafetyCertificateOutlined />,
  book: <BookOutlined />,
  wallet: <WalletOutlined />,
  heart: <HeartOutlined />,
  read: <ReadOutlined />,
  apartment: <ApartmentOutlined />,
};

const memberName = (m) => m.dharmName || m.fullName || '';
const memberInitial = (m) => memberName(m).trim().split(/\s+/).pop()?.[0]?.toUpperCase() || '?';

function DeptIcon({ theme, size = 48 }) {
  return (
    <div className="dept-icon" style={{ width: size, height: size, background: theme.soft, color: theme.accent, fontSize: size * 0.44 }}>
      {ICONS[theme.icon] || ICONS.apartment}
    </div>
  );
}

function DeptCard({ dept, canEdit, onOpen, onEdit, onDelete, t }) {
  const theme = getDeptTheme(dept.code);
  const members = dept.members || [];

  const menu = {
    items: [
      { key: 'edit', icon: <EditOutlined />, label: t.common.edit },
      { type: 'divider' },
      { key: 'delete', icon: <DeleteOutlined />, label: t.common.delete, danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'edit') onEdit(dept);
      if (key === 'delete') onDelete(dept);
    },
  };

  return (
    <div
      className="dept-card"
      onClick={() => onOpen(dept)}
      style={{ '--dept-accent': theme.accent, '--dept-soft': theme.soft, '--dept-tint': theme.tint }}
    >
      <div className="dept-card__head">
        <DeptIcon theme={theme} />
        <div className="dept-card__titles">
          <button type="button" className="dept-card__name dept-card__open"
            onClick={(event) => { event.stopPropagation(); onOpen(dept); }}>{dept.name}</button>
          <div className="dept-card__code">{dept.code}</div>
        </div>
        {canEdit && (
          <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <Dropdown menu={menu} trigger={['click']} placement="bottomRight">
              <Button
                type="text"
                className="dept-card__more"
                icon={<EllipsisOutlined style={{ fontSize: 18 }} />}
                aria-label={t.department.cardActions}
              />
            </Dropdown>
          </span>
        )}
      </div>

      <p className={`dept-card__desc${dept.description ? '' : ' is-empty'}`}>
        {dept.description || t.department.noDescription}
      </p>

      <div className="dept-card__foot">
        {members.length > 0 ? (
          <div className="dept-card__members">
            <Avatar.Group max={{ count: 4, style: { background: theme.soft, color: theme.accent, fontSize: 11, fontWeight: 700 } }} size={30}>
              {members.map(m => (
                <Tooltip key={m.id} title={memberName(m)}>
                  <Avatar size={30} style={{ background: theme.soft, color: theme.accent, fontSize: 12, fontWeight: 700, border: '2px solid #fff' }}>
                    {memberInitial(m)}
                  </Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
            <span className="dept-card__count">
              <strong>{members.length}</strong> {t.department.members.toLowerCase()}
            </span>
          </div>
        ) : (
          <div className="dept-card__members is-empty">
            <span className="dept-card__ghost"><UserOutlined /></span>
            <span className="dept-card__count">{t.department.noMembers}</span>
          </div>
        )}
        <span className="dept-card__cta">
          {t.department.viewDetails} <RightOutlined />
        </span>
      </div>
    </div>
  );
}

export default function DepartmentPage() {
  const { data, loading, canEdit, fetchData, handleDelete } = useDepartmentPage();
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [drawerDept, setDrawerDept] = useState(null);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const R = makeRules(t);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter(d => d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q));
  }, [data, query]);

  const totalMembers = data.reduce((s, d) => s + (d.members?.length || 0), 0);
  const emptyDepts = data.filter(d => !d.members?.length).length;

  const openModal = (record = null) => {
    setEditRecord(record);
    if (record) initializeForm(form, record);
    else form.resetFields();
    setModalOpen(true);
  };

  const confirmDelete = (dept) => {
    Modal.confirm({
      title: t.department.confirmDelete,
      content: dept.members?.length ? t.department.deleteWarn : dept.name,
      okText: t.common.delete,
      cancelText: t.common.cancel,
      okButtonProps: { danger: true },
      onOk: () => handleDelete(dept.id),
    });
  };

  const handleSubmit = async (values) => {
    const payload = { ...values, code: values.code?.trim().toUpperCase() };
    setSaving(true);
    try {
      if (editRecord) {
        await api.put(`/departments/${editRecord.id}`, payload);
        message.success(t.department.updateSuccess);
      } else {
        await api.post('/departments', payload);
        message.success(t.department.addSuccess);
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  // Full-page spinner only for the very first load; later refreshes keep the page in place
  if (loading && !data.length) return <PageSpinner />;

  const drawerTheme = drawerDept ? getDeptTheme(drawerDept.code) : null;

  return (
    <div className="dept-page">
      {/* ── Header ── */}
      <section className="dept-hero section-anim section-d0">
        <div className="dept-hero__main">
          <div className="dept-hero__icon"><ApartmentOutlined /></div>
          <div>
            <h1 className="dept-hero__title">{t.department.title}</h1>
            <p className="dept-hero__sub">{t.department.subtitle}</p>
          </div>
        </div>
        <div className="dept-hero__stats">
          <div className="dept-stat"><strong><CountUp value={data.length} /></strong><span>{t.department.statDepartments}</span></div>
          <div className="dept-stat"><strong><CountUp value={totalMembers} /></strong><span>{t.department.statMembers}</span></div>
          <div className="dept-stat"><strong className={emptyDepts ? 'is-warn' : ''}><CountUp value={emptyDepts} /></strong><span>{t.department.statEmpty}</span></div>
        </div>
      </section>

      {/* ── Toolbar ── */}
      <div className="dept-toolbar section-anim section-d1">
        <Input
          className="dept-search"
          prefix={<SearchOutlined style={{ color: '#bfae99' }} />}
          placeholder={t.department.searchPlaceholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          allowClear
        />
        {canEdit && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} className="dept-add-btn">
            {t.department.addNew}
          </Button>
        )}
      </div>

      {/* ── Grid ── */}
      <div className="section-anim section-d2">
        {data.length === 0 || filtered.length === 0 ? (
          <div className="dept-empty">
            <div className="dept-empty__icon"><ApartmentOutlined /></div>
            <div className="dept-empty__text">{data.length === 0 ? t.department.emptyAll : t.department.noResults}</div>
            {data.length === 0 && canEdit && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>{t.department.addNew}</Button>
            )}
          </div>
        ) : (
          <div className="dept-grid">
            {filtered.map(dept => (
              <DeptCard
                key={dept.id}
                dept={dept}
                canEdit={canEdit}
                onOpen={setDrawerDept}
                onEdit={openModal}
                onDelete={confirmDelete}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Member drawer ── */}
      <Drawer
        open={!!drawerDept}
        onClose={() => setDrawerDept(null)}
        width={400}
        title={null}
        closable
        className="dept-drawer"
        styles={{ body: { padding: 0 } }}
      >
        {drawerDept && (
          <>
            <div className="dept-drawer__hero" style={{ background: `linear-gradient(160deg, ${drawerTheme.soft} 0%, ${drawerTheme.tint} 100%)` }}>
              <DeptIcon theme={drawerTheme} size={56} />
              <div className="dept-drawer__name">{drawerDept.name}</div>
              <div className="dept-drawer__code" style={{ color: drawerTheme.accent }}>{drawerDept.code}</div>
              {drawerDept.description && <p className="dept-drawer__desc">{drawerDept.description}</p>}
              {canEdit && (
                <Button size="small" icon={<EditOutlined />} onClick={() => { const d = drawerDept; setDrawerDept(null); openModal(d); }} style={{ marginTop: 12 }}>
                  {t.common.edit}
                </Button>
              )}
            </div>

            <div className="dept-drawer__section">
              <div className="dept-drawer__label">
                <TeamOutlined /> {t.department.members}
                <span className="dept-drawer__badge" style={{ background: drawerTheme.soft, color: drawerTheme.accent }}>
                  {drawerDept.members?.length || 0}
                </span>
              </div>

              {!drawerDept.members?.length ? (
                <div className="dept-drawer__empty">
                  <span className="dept-card__ghost"><UserOutlined /></span>
                  {t.department.noMembers}
                </div>
              ) : (
                <ul className="dept-member-list">
                  {drawerDept.members.map(m => (
                    <li key={m.id} className="dept-member">
                      <Avatar size={40} style={{ background: drawerTheme.soft, color: drawerTheme.accent, fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                        {memberInitial(m)}
                      </Avatar>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="dept-member__name">{memberName(m)}</div>
                        {m.dharmName && m.fullName && <div className="dept-member__sub">{m.fullName}</div>}
                      </div>
                      {m.position && (
                        <span className="dept-member__role" style={{ background: drawerTheme.soft, color: drawerTheme.accent }}>
                          {positionLabel(t, m.position)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </Drawer>

      {/* ── Add / edit modal ── */}
      <Modal
        title={editRecord ? t.department.editTitle : t.department.addTitle}
        open={modalOpen}
        onCancel={() => guardedClose(form, () => setModalOpen(false), t)}
        maskClosable={false}
        onOk={() => form.submit()}
        okText={editRecord ? t.common.update : t.common.add}
        cancelText={t.common.cancel}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 12 }}>
          <HiddenSubmit />
          <Form.Item name="name" label={t.department.colName} rules={[{ ...R.required(t.department.colName.toLowerCase()), whitespace: true }]}>
            <Input placeholder={t.department.namePlaceholder} autoFocus />
          </Form.Item>
          <Form.Item name="code" label={t.department.colCode} rules={[{ ...R.required(t.department.colCode.toLowerCase()), whitespace: true }, { pattern: /^\s*[A-Za-z0-9_-]+\s*$/, message: t.department.codeFormat }]}>
            <Input placeholder={t.department.codePlaceholder} style={{ textTransform: 'uppercase', fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="description" label={t.common.description}>
            <Input.TextArea rows={3} showCount maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
