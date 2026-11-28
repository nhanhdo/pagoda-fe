import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import CountUp from '../../components/CountUp/CountUp';
import {
  Button, Modal, Form, Input, message, Avatar, Drawer, Dropdown,
} from 'antd';
import FormDialog from '../../components/FormDialog/FormDialog';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, TeamOutlined, SearchOutlined,
  EllipsisOutlined, RightOutlined, SafetyCertificateOutlined, BookOutlined,
  WalletOutlined, HeartOutlined, ReadOutlined, ApartmentOutlined, UserOutlined, CloseOutlined,
} from '@ant-design/icons';
import api from '../../api/axios';
import { useDepartmentPage, getDeptTheme } from './useDepartmentPage';
import { useLanguage } from '../../i18n/LanguageContext';
import { initializeForm, guardedClose, rules as makeRules } from '../../utils/formGuard';
import PersonnelFormModal, { HiddenSubmit } from '../Personnel/PersonnelForm';
import { useAuth } from '../../contexts/AuthContext';
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
    <span aria-hidden="true" className="dept-icon" style={{ width: size, height: size, background: theme.soft, color: theme.accent, borderColor: theme.accent + '40', fontSize: size * 0.44 }}>
      {ICONS[theme.icon] || ICONS.apartment}
    </span>
  );
}

function searchKey(text) {
  return (text ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replaceAll('đ', 'd');
}

function DeptCard({ dept, active, canEdit, onOpen, onEdit, onDelete, t }) {
  const theme = getDeptTheme(dept.code);
  const count = dept.members?.length || 0;
  const menu = {
    items: [
      { key: 'edit', icon: <EditOutlined />, label: t.common.edit },
      { type: 'divider' },
      { key: 'delete', icon: <DeleteOutlined />, label: t.common.delete, danger: true },
    ],
    onClick: ({ key }) => key === 'edit' ? onEdit(dept) : onDelete(dept),
  };

  return (
    <article className="dept-card" data-selected={active}
      style={{ '--dept-accent': theme.accent, '--dept-soft': theme.soft }}>
      <button type="button" className="dept-card__open" aria-label={dept.name}
        aria-expanded={active} aria-controls={active ? 'department-detail' : undefined}
        onClick={event => onOpen(dept.id, event.currentTarget)}>
        <span className="dept-card__head">
          <DeptIcon theme={theme} size={42} />
          <span className="dept-card__titles">
            <span className="dept-card__name">{dept.name}</span>
            <span className="dept-card__code">{dept.code}</span>
          </span>
        </span>
        <span className="dept-card__desc">{dept.description || t.department.noDescription}</span>
        <span className="dept-card__foot">
          <span><TeamOutlined aria-hidden="true" /> {count
            ? (count === 1 ? t.department.memberCountOne : t.department.memberCountMany).replace('{n}', count)
            : t.department.noMembers}</span>
          <RightOutlined aria-hidden="true" />
        </span>
      </button>
      {canEdit && (
        <Dropdown menu={menu} trigger={['click']} placement="bottomRight">
          <Button type="text" className="dept-card__more" icon={<EllipsisOutlined />}
            aria-label={t.department.cardActions} />
        </Dropdown>
      )}
    </article>
  );
}

function DeptDetails({ dept, canEdit, canAddMember, onEdit, onAddMember, onClose, t }) {
  const theme = getDeptTheme(dept.code);
  const members = dept.members || [];
  return (
    <section id="department-detail" className="dept-detail" aria-labelledby="department-detail-title">
      <header className="dept-detail__head admin-nav-glass">
        <div className="dept-detail__top">
          <DeptIcon theme={theme} size={42} />
          <div className="dept-detail__identity">
            <h2 id="department-detail-title">{dept.name}</h2>
            <span className="dept-card__code">{dept.code}</span>
          </div>
          <div className="dept-detail__actions">
            {canEdit && (
              <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(dept)}>{t.department.editAction}</Button>
            )}
            <Button type="text" icon={<CloseOutlined />} aria-label={t.common.close} onClick={onClose} />
          </div>
        </div>
        {dept.description && <p>{dept.description}</p>}
      </header>
      <div className="dept-detail__members">
        <div className="dept-detail__section-head">
          <h3>{t.department.members} ({members.length})</h3>
          {canAddMember && (
            <Button type="primary" size="small" className="add-action" icon={<PlusOutlined />} onClick={onAddMember}>
              {t.department.addMember}
            </Button>
          )}
        </div>
        {members.length === 0 ? (
          <div className="dept-detail__empty"><UserOutlined aria-hidden="true" /> {t.department.emptyMembers}</div>
        ) : (
          <ul className="dept-member-list">
            {members.map(member => (
              <li key={member.id} className="dept-member">
                <Avatar size={36} style={{ background: theme.soft, color: theme.accent, flexShrink: 0 }}>
                  {memberInitial(member)}
                </Avatar>
                <div className="dept-member__identity">
                  <div className="dept-member__name">{memberName(member)}</div>
                  {member.dharmName && member.fullName && member.dharmName !== member.fullName && (
                    <div className="dept-member__sub">{member.fullName}</div>
                  )}
                </div>
                {member.position && <span className="dept-member__role">{positionLabel(t, member.position)}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default function DepartmentPage() {
  const { data, loading, canEdit, fetchData, handleDelete } = useDepartmentPage();
  const { t } = useLanguage();
  const { canManage } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [addingMember, setAddingMember] = useState(false);
  const [wide, setWide] = useState(false);
  const workspaceRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const scrollRestore = useRef(null);
  const selected = data.find(dept => dept.id === selectedId);

  const initialLoading = loading && !data.length;
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const observer = new ResizeObserver(([entry]) => setWide(entry.contentRect.width >= 960));
    observer.observe(workspace);
    return () => observer.disconnect();
  }, [initialLoading]);

  useLayoutEffect(() => {
    if (scrollRestore.current) {
      const { element, top } = scrollRestore.current;
      element.scrollTop = top;
      scrollRestore.current = null;
    }
  }, [selectedId]);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const R = makeRules(t);

  useEffect(() => {
    if (loading || selectedId === null || selected) return;
    setSelectedId(null);
    setAddingMember(false);
    if (wide) searchRef.current?.focus({ preventScroll: true });
  }, [loading, selected, selectedId, wide]);

  const filtered = useMemo(() => {
    const q = searchKey(query.trim());
    if (!q) return data;
    return data.filter(d => searchKey(d.name).includes(q) || searchKey(d.code).includes(q));
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

  const restoreFocus = () => {
    if (triggerRef.current?.isConnected) triggerRef.current.focus({ preventScroll: true });
    else searchRef.current?.focus({ preventScroll: true });
  };
  const closeDetails = () => {
    if (wide) {
      const element = workspaceRef.current?.closest('.app-content');
      if (element) scrollRestore.current = { element, top: element.scrollTop };
      restoreFocus();
    }
    setSelectedId(null);
  };
  const openDetails = (id, trigger) => {
    triggerRef.current = trigger;
    setSelectedId(id);
  };
  const detail = selected && (
    <DeptDetails dept={selected} canEdit={canEdit} canAddMember={canManage()}
      onEdit={openModal} onAddMember={() => setAddingMember(true)} onClose={closeDetails} t={t} />
  );

  if (initialLoading) return <PageSpinner />;

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
          ref={searchRef}
          className="dept-search"
          aria-label={t.department.searchPlaceholder}
          prefix={<SearchOutlined style={{ color: '#bfae99' }} />}
          placeholder={t.department.searchPlaceholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          allowClear
        />
        {canEdit && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} className="add-action dept-add-btn">
            {t.department.addNew}
          </Button>
        )}
      </div>

      {/* ── Grid ── */}
      <div ref={workspaceRef} className={`dept-workspace${wide && selected ? ' dept-workspace--split' : ''}`}>
        {data.length === 0 || filtered.length === 0 ? (
          <div className="dept-empty">
            <div className="dept-empty__icon"><ApartmentOutlined /></div>
            <div className="dept-empty__text">{data.length === 0 ? t.department.emptyAll : t.department.noResults}</div>
            {data.length === 0 && canEdit && (
              <Button className="add-action" type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>{t.department.addNew}</Button>
            )}
          </div>
        ) : (
          <div className="dept-grid">
            {filtered.map(dept => (
              <DeptCard
                key={dept.id}
                dept={dept}
                canEdit={canEdit}
                active={selectedId === dept.id}
                onOpen={openDetails}
                onEdit={openModal}
                onDelete={confirmDelete}
                t={t}
              />
            ))}
          </div>
        )}
        {wide && detail && <aside className="dept-detail-slot">{detail}</aside>}
      </div>

      {!wide && (
        <Drawer open={Boolean(selected)} onClose={closeDetails}
          afterOpenChange={visible => { if (!visible && !selected) restoreFocus(); }}
          width="min(460px, 100vw)" closable={false} className="dept-drawer"
          aria-labelledby="department-detail-title" keyboard={!modalOpen && !addingMember}
          styles={{ body: { padding: 0 }, mask: { background: 'rgba(48, 37, 29, .28)' } }}>
          {detail}
        </Drawer>
      )}

      {selected && canManage() && (
        <PersonnelFormModal open={addingMember} record={null} initialDepartmentId={selected.id}
          onClose={() => setAddingMember(false)}
          onSaved={() => { setAddingMember(false); fetchData(); }} />
      )}

      {/* ── Add / edit modal ── */}
      <FormDialog
        title={editRecord ? t.department.editTitle : t.department.addTitle}
        open={modalOpen}
        onCancel={() => guardedClose(form, () => setModalOpen(false), t)}
        maskClosable={false}
        onOk={() => form.submit()}
        isAdding={!editRecord}
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
      </FormDialog>
    </div>
  );
}
