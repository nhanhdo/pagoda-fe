import React, { useState, useEffect, useMemo } from 'react';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import CountUp from '../../components/CountUp/CountUp';
import LotusEmpty from '../../components/LotusEmpty/LotusEmpty';
import {
  Table, Button, Modal, Form, Input, Select, message, Popconfirm, Switch,
  Tooltip, Avatar,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, UserOutlined,
  LockOutlined, UnlockOutlined, SearchOutlined, CrownOutlined,
  SafetyCertificateOutlined, FileTextOutlined, TeamOutlined, CheckCircleOutlined,
  StopOutlined, ClockCircleOutlined, SafetyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import api from '../../api/axios';
import { useUserManagementPage, ROLE_CONFIG, ROLE_ORDER } from './useUserManagementPage';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { guardedClose } from '../../utils/formGuard';
import './UserManagementPage.css';
import { pinLeft, PIN_RIGHT } from '../Personnel/personnelShared';

dayjs.extend(relativeTime);

const ROLE_ICON = {
  admin: <CrownOutlined />,
  truotri: <SafetyCertificateOutlined />,
  thuki: <FileTextOutlined />,
  truongban: <TeamOutlined />,
  user: <UserOutlined />,
};

const toneOf = (role) => ROLE_CONFIG[role] || ROLE_CONFIG.user;

function RolePill({ role, label }) {
  const tone = toneOf(role);
  return (
    <span className="tbl-pill" style={{ color: tone.c, background: tone.s }}>
      {ROLE_ICON[role] || ROLE_ICON.user}{label}
    </span>
  );
}

/* ── Reset password ─────────────────────────────────────── */
function ResetPasswordModal({ open, user, onClose }) {
  const { t } = useLanguage();
  const U = t.users;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async ({ newPassword }) => {
    if (loading) return;
    setLoading(true);
    try {
      await api.put(`/users/${user.id}/reset-password`, { newPassword });
      message.success(U.resetPasswordSuccess.replace('{username}', user.username));
      form.resetFields();
      onClose();
    } catch (err) {
      message.error(err.response?.data?.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="um-modal-title">
          <span className="um-modal-title__icon" style={{ color: '#4d8fc7', background: '#e9f1fb' }}><KeyOutlined /></span>
          <div>
            <div>{U.resetPassword}</div>
            <div className="um-modal-title__sub">{U.resetFor} <span className="tbl-mono">@{user?.username}</span></div>
          </div>
        </div>
      }
      open={open}
      onCancel={() => guardedClose(form, () => { form.resetFields(); onClose(); }, t)}
      maskClosable={false}
      onOk={() => form.submit()}
      okText={U.resetPassword}
      cancelText={t.common.cancel}
      confirmLoading={loading}
      destroyOnClose
      width={440}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 12 }}>
        <Form.Item
          name="newPassword"
          label={t.auth.newPassword}
          rules={[{ required: true, message: U.passwordRequired }, { min: 6, message: U.minSixChars }]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: '#c9b49a' }} />} placeholder={U.newPasswordPlaceholder} />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label={t.auth.confirmPassword}
          dependencies={['newPassword']}
          rules={[
            { required: true, message: U.confirmPasswordRequired },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                return Promise.reject(new Error(U.passwordMismatch));
              },
            }),
          ]}
          style={{ marginBottom: 0 }}
        >
          <Input.Password prefix={<LockOutlined style={{ color: '#c9b49a' }} />} placeholder={U.confirmPasswordPlaceholder} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/* ── Create / edit ──────────────────────────────────────── */
function UserFormModal({ open, editRecord, personnelList, users, currentUserId, onClose, onSaved }) {
  const { t } = useLanguage();
  const U = t.users;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isSelf = !!editRecord && editRecord.id === currentUserId;

  useEffect(() => {
    if (!open) return;
    if (editRecord) {
      form.setFieldsValue({
        username: editRecord.username,
        role: editRecord.role,
        personnelId: editRecord.personnelId || undefined,
        isActive: editRecord.isActive,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ role: 'user', isActive: true });
    }
  }, [open, editRecord, form]);

  const linkedTo = useMemo(() => {
    const map = new Map();
    users.forEach(u => { if (u.personnelId && u.id !== editRecord?.id) map.set(u.personnelId, u.username); });
    return map;
  }, [users, editRecord]);

  const handleSubmit = async (values) => {
    const payload = { ...values };
    if (isSelf) { delete payload.isActive; delete payload.role; }
    if (loading) return;
    setLoading(true);
    try {
      if (editRecord) {
        await api.put(`/users/${editRecord.id}`, payload);
        message.success(U.updateSuccess);
      } else {
        await api.post('/users', payload);
        message.success(U.createSuccess);
      }
      onSaved();
      onClose();
    } catch (err) {
      message.error(err.response?.data?.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="um-modal-title">
          <span className="um-modal-title__icon"><UserOutlined /></span>
          <div>{editRecord ? U.editTitle : U.addTitle}</div>
        </div>
      }
      open={open}
      onCancel={() => guardedClose(form, onClose, t)}
      maskClosable={false}
      onOk={() => form.submit()}
      okText={editRecord ? t.common.update : U.addNew}
      cancelText={t.common.cancel}
      confirmLoading={loading}
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 12 }}>
        <Form.Item
          name="username"
          label={U.usernameLabel}
          rules={[
            { required: true, message: U.usernameRequired },
            { min: 3, message: U.minThreeChars },
            { pattern: /^[a-zA-Z0-9._]+$/, message: U.usernamePattern },
          ]}
        >
          <Input prefix={<span className="um-at">@</span>} placeholder={U.usernamePlaceholder} disabled={!!editRecord} />
        </Form.Item>

        {!editRecord && (
          <Form.Item name="password" label={U.passwordLabel} extra={U.passwordDefaultHint}>
            <Input.Password prefix={<LockOutlined style={{ color: '#c9b49a' }} />} placeholder={U.defaultPasswordPlaceholder} />
          </Form.Item>
        )}

        <Form.Item name="role" label={U.colRole} rules={[{ required: true }]} extra={isSelf ? U.selfRoleHint : undefined}>
          <Select
            disabled={isSelf}
            options={ROLE_ORDER.map(r => ({
              value: r,
              label: <span className="um-role-option"><span style={{ color: toneOf(r).c }}>{ROLE_ICON[r]}</span>{U.roles[r] || r}</span>,
            }))}
          />
        </Form.Item>

        <Form.Item name="personnelId" label={U.personnelLinkLabel} extra={U.personnelLinkHint}>
          <Select
            showSearch
            allowClear
            placeholder={U.selectPersonnelPlaceholder}
            optionFilterProp="search"
            options={personnelList.map(p => {
              const owner = linkedTo.get(p.id);
              return {
                value: p.id,
                disabled: !!owner,
                search: `${p.fullName || ''} ${p.dharmName || ''} ${p.code || ''}`.toLowerCase(),
                label: (
                  <span className="um-person-option">
                    <span>{p.dharmName || p.fullName}</span>
                    <span className="tbl-mono">{p.code}</span>
                    {owner && <span className="um-person-option__taken">@{owner} · {U.alreadyLinked}</span>}
                  </span>
                ),
              };
            })}
          />
        </Form.Item>

        <Form.Item name="isActive" label={t.common.status} valuePropName="checked" style={{ marginBottom: 0 }}>
          <Switch checkedChildren={U.active} unCheckedChildren={U.locked} disabled={isSelf} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function UserManagementPage() {
  const { t } = useLanguage();
  const U = t.users;
  const { isAdmin, user: me } = useAuth();
  const {
    users, personnelList, loading,
    modalOpen, setModalOpen,
    resetModal, setResetModal,
    editRecord,
    fetchUsers, openCreate, openEdit,
    handleDelete, toggleActive,
  } = useUserManagementPage(t);

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(u => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter === 'active' && !u.isActive) return false;
      if (statusFilter === 'locked' && u.isActive) return false;
      if (!q) return true;
      const p = u.personnel || {};
      return [u.username, p.fullName, p.dharmName, p.code].some(v => v?.toLowerCase().includes(q));
    });
  }, [users, query, roleFilter, statusFilter]);

  const admin = isAdmin();
  const monthAgo = dayjs().subtract(30, 'day');
  const stats = [
    { label: U.totalAccounts,  value: users.length, icon: <UserOutlined />, tone: { c: '#c47f36', s: '#fbf1e4' },
      hint: U.unlinkedCount.replace('{n}', users.filter(u => !u.personnelId).length) },
    { label: U.activeAccounts, value: users.filter(u => u.isActive).length, icon: <CheckCircleOutlined />, tone: { c: '#4f9a72', s: '#e8f4ed' },
      hint: `${U.onlineCount.replace('{n}', users.filter(u => u.online).length)} · ${U.recentLogin.replace('{n}', users.filter(u => u.lastLogin && dayjs(u.lastLogin).isAfter(monthAgo)).length)}` },
    { label: U.lockedAccounts, value: users.filter(u => !u.isActive).length, icon: <StopOutlined />, tone: { c: '#8c7a6b', s: '#f2ede6' } },
    { label: U.adminAccounts,  value: users.filter(u => u.role === 'admin').length, icon: <CrownOutlined />, tone: { c: '#d9646c', s: '#fdeeee' } },
  ];

  const columns = [
    {
      fixed: pinLeft(),
      title: U.colAccount,
      key: 'account',
      width: 300,
      render: (_, r) => {
        const tone = toneOf(r.role);
        const p = r.personnel;
        const isMe = r.id === me?.id;
        return (
          <div className="person-cell">
            <Tooltip title={r.online ? U.onlineNow : null}>
              <span className={`um-presence${r.online ? ' is-online' : ''}`} aria-label={r.online ? U.onlineNow : undefined}>
                <Avatar size={40} className="person-cell__avatar" style={{ background: tone.s, color: tone.c }}>
                  {r.username.charAt(0).toUpperCase()}
                </Avatar>
              </span>
            </Tooltip>
            <div className="person-cell__text">
              <div className="person-cell__name">
                <span className="um-username">@{r.username}</span>
                {isMe && <span className="um-you">{U.you}</span>}
              </div>
              <div className="person-cell__sub">
                {p ? (
                  <>
                    <span>{p.dharmName || p.fullName}</span>
                    {p.code && <><span className="person-cell__sep">·</span><span className="tbl-mono">{p.code}</span></>}
                  </>
                ) : <span className="um-unlinked">{U.noPersonnelLinked}</span>}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: U.colRole,
      dataIndex: 'role',
      width: 150,
      render: (role) => <RolePill role={role} label={U.roles[role] || role} />,
    },
    {
      title: t.common.status,
      dataIndex: 'isActive',
      width: 140,
      render: (v) => (
        <span className="tbl-pill" style={v ? { color: '#3f8461', background: '#e8f4ed' } : { color: '#8c7a6b', background: '#f2ede6' }}>
          <span className="tbl-pill__dot" />{v ? U.active : U.locked}
        </span>
      ),
    },
    {
      title: U.colLastLogin,
      dataIndex: 'lastLogin',
      width: 170,
      sorter: (a, b) => (a.lastLogin ? dayjs(a.lastLogin).valueOf() : 0) - (b.lastLogin ? dayjs(b.lastLogin).valueOf() : 0),
      render: (v) => v ? (
        <Tooltip title={dayjs(v).format('DD/MM/YYYY HH:mm')}>
          <span className="um-login"><ClockCircleOutlined />{dayjs(v).fromNow()}</span>
        </Tooltip>
      ) : <span className="tbl-muted">{U.neverLoggedIn}</span>,
    },
    ...(admin ? [{
      title: '',
      key: 'actions', fixed: PIN_RIGHT,
      width: 160,
      align: 'right',
      render: (_, r) => {
        const isMe = r.id === me?.id;
        return (
          <div className="personnel-action-group" onClick={(e) => e.stopPropagation()}>
            <Tooltip title={t.common.edit}>
              <Button aria-label={t.common.edit} type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
            </Tooltip>
            <Tooltip title={U.resetPassword}>
              <Button aria-label={U.resetPassword} type="text" icon={<KeyOutlined />} onClick={() => setResetModal({ open: true, user: r })} />
            </Tooltip>
            {isMe ? (
              <Tooltip title={U.selfActionBlocked}>
                <Button aria-label={U.selfActionBlocked} type="text" icon={<LockOutlined />} disabled />
              </Tooltip>
            ) : (
              <Popconfirm
                title={r.isActive ? U.confirmLock : U.confirmUnlock}
                description={r.isActive ? U.lockNote : undefined}
                onConfirm={() => toggleActive(r)}
                okText={r.isActive ? U.lockAction : U.unlockAction}
                cancelText={t.common.cancel}
                okButtonProps={r.isActive ? { danger: true } : undefined}
              >
                <Tooltip title={r.isActive ? U.lockAction : U.unlockAction}>
                  <Button aria-label={r.isActive ? U.lockAction : U.unlockAction} type="text" icon={r.isActive ? <LockOutlined /> : <UnlockOutlined />} />
                </Tooltip>
              </Popconfirm>
            )}
            {isMe ? (
              <Tooltip title={U.selfActionBlocked}>
                <Button aria-label={U.selfActionBlocked} type="text" danger icon={<DeleteOutlined />} disabled />
              </Tooltip>
            ) : (
              <Popconfirm
                title={U.confirmDelete}
                description={U.deleteNote}
                onConfirm={() => handleDelete(r.id)}
                okText={t.common.delete}
                cancelText={t.common.cancel}
                okButtonProps={{ danger: true }}
              >
                <Tooltip title={t.common.delete}>
                  <Button aria-label={t.common.delete} type="text" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            )}
          </div>
        );
      },
    }] : []),
  ];

  if (loading && !users.length) return <PageSpinner />;

  const isFiltered = Boolean(query || roleFilter || statusFilter);

  return (
    <div className="um-page">
      {/* ── Header ── */}
      <section className="um-hero section-anim section-d0">
        <div className="um-hero__main">
          <div className="um-hero__icon"><SafetyOutlined /></div>
          <div>
            <h1 className="um-hero__title">{U.title}</h1>
            <p className="um-hero__sub">{U.subtitle}</p>
          </div>
        </div>
        {admin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className="um-hero__btn">
            {U.addNew}
          </Button>
        )}
      </section>

      {/* ── Stats ── */}
      <div className="um-stats section-anim section-d1">
        {stats.map(s => (
          <div key={s.label} className="um-stat" style={{ '--st': s.tone.c, '--st-soft': s.tone.s }}>
            <span className="um-stat__icon">{s.icon}</span>
            <div className="um-stat__body">
              <div className="um-stat__value"><CountUp value={s.value} /></div>
              <div className="um-stat__label">{s.label}</div>
              {s.hint && <div className="um-stat__hint">{s.hint}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* ── List ── */}
      <section className="um-card section-anim section-d2">
        <div className="um-toolbar">
          <Input
            className="um-search"
            placeholder={U.searchPlaceholder}
            prefix={<SearchOutlined style={{ color: '#bfae99' }} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            allowClear
          />
          <Select
            className="um-filter"
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: '', label: U.allRoles },
              ...ROLE_ORDER.map(r => ({ value: r, label: <span className="um-role-option"><span style={{ color: toneOf(r).c }}>{ROLE_ICON[r]}</span>{U.roles[r]}</span> })),
            ]}
          />
          <Select
            className="um-filter"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: U.allStatuses },
              { value: 'active', label: U.active },
              { value: 'locked', label: U.locked },
            ]}
          />
        </div>

        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            hideOnSinglePage: false,
            showTotal: (n, range) => `${range[0]}-${range[1]} / ${n} ${U.totalLabel}`,
          }}
          rowClassName={(r) => (r.isActive ? '' : 'um-row-locked')}
          className="personnel-table"
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: isFiltered
              ? <LotusEmpty description={U.emptyFiltered} hint={U.emptyFilteredHint} />
              : <LotusEmpty description={U.emptyTitle} hint={admin ? U.emptyHint : ''} />,
          }}
        />
      </section>

      <UserFormModal
        open={modalOpen}
        editRecord={editRecord}
        personnelList={personnelList}
        users={users}
        currentUserId={me?.id}
        onClose={() => setModalOpen(false)}
        onSaved={() => fetchUsers()}
      />

      <ResetPasswordModal
        open={resetModal.open}
        user={resetModal.user}
        onClose={() => setResetModal({ open: false, user: null })}
      />
    </div>
  );
}
