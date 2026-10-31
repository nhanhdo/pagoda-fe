import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Switch,
  Tooltip,
  Typography,
  Avatar,
  Badge,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  UserOutlined,
  LockOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api/axios";
import { useUserManagementPage, ROLE_CONFIG } from "./useUserManagementPage";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import "./UserManagementPage.css";

const { Text } = Typography;

/* ── Reset Password Modal ─────────────────────────────── */
function ResetPasswordModal({ open, user, onClose }) {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async ({ newPassword }) => {
    setLoading(true);
    try {
      await api.put(`/users/${user.id}/reset-password`, { newPassword });
      message.success(
        t.users.resetPasswordSuccess.replace("{username}", user.username)
      );
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
        <>
          <KeyOutlined style={{ marginRight: 8, color: "#8B4513" }} />
          {t.users.resetPassword} — <Text code>@{user?.username}</Text>
        </>
      }
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={() => form.submit()}
      okText={t.users.resetPassword}
      cancelText={t.common.cancel}
      okButtonProps={{
        loading,
        style: { background: "#8B4513", borderColor: "#8B4513" },
      }}
      destroyOnClose
      width={420}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="newPassword"
          label={t.auth.newPassword}
          rules={[
            { required: true, message: t.users.passwordRequired },
            { min: 6, message: t.users.minSixChars },
          ]}
        >
          <Input.Password placeholder={t.users.newPasswordPlaceholder} />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label={t.auth.confirmPassword}
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: t.users.confirmPasswordRequired },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value)
                  return Promise.resolve();
                return Promise.reject(new Error(t.users.passwordMismatch));
              },
            }),
          ]}
        >
          <Input.Password placeholder={t.users.confirmPasswordPlaceholder} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/* ── Create / Edit Modal ──────────────────────────────── */
function UserFormModal({ open, editRecord, personnelList, onClose, onSaved }) {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (editRecord) {
        form.setFieldsValue({
          username: editRecord.username,
          role: editRecord.role,
          personnelId: editRecord.personnelId || undefined,
          isActive: editRecord.isActive,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ role: "user", isActive: true });
      }
    }
  }, [open, editRecord, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editRecord) {
        await api.put(`/users/${editRecord.id}`, values);
        message.success(t.users.updateSuccess);
      } else {
        await api.post("/users", values);
        message.success(t.users.createSuccess);
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#fdf5ee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserOutlined style={{ color: "#8B4513", fontSize: 18 }} />
          </div>
          <span style={{ fontWeight: 700 }}>
            {editRecord ? t.users.editTitle : t.users.addTitle}
          </span>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={editRecord ? t.common.update : t.users.addNew}
      cancelText={t.common.cancel}
      okButtonProps={{
        loading,
        style: { background: "#8B4513", borderColor: "#8B4513" },
      }}
      width={500}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: 8 }}
      >
        <Form.Item
          name="username"
          label={t.users.usernameLabel}
          rules={[
            { required: true, message: t.users.usernameRequired },
            { min: 3, message: t.users.minThreeChars },
            { pattern: /^[a-zA-Z0-9._]+$/, message: t.users.usernamePattern },
          ]}
        >
          <Input
            prefix={<UserOutlined style={{ color: "#ccc" }} />}
            placeholder={t.users.usernamePlaceholder}
            disabled={!!editRecord}
          />
        </Form.Item>

        {!editRecord && (
          <Form.Item
            name="password"
            label={t.users.passwordLabel}
            extra={t.users.passwordDefaultHint}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#ccc" }} />}
              placeholder={t.users.defaultPasswordPlaceholder}
            />
          </Form.Item>
        )}

        <Form.Item
          name="role"
          label={t.users.colRole}
          rules={[{ required: true }]}
        >
          <Select>
            {Object.entries(ROLE_CONFIG).map(([v, c]) => (
              <Select.Option key={v} value={v}>
                <Tag color={c.color} style={{ marginRight: 6 }}>
                  {c.label}
                </Tag>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="personnelId"
          label={t.users.personnelLinkLabel}
          extra={t.users.personnelLinkHint}
        >
          <Select
            showSearch
            allowClear
            placeholder={t.users.selectPersonnelPlaceholder}
            filterOption={(input, opt) =>
              opt?.label?.toLowerCase().includes(input.toLowerCase())
            }
            options={personnelList.map((p) => ({
              value: p.id,
              label: `${p.dharmName || p.fullName} (${p.code})`,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="isActive"
          label={t.common.status}
          valuePropName="checked"
        >
          <Switch
            checkedChildren={t.users.active}
            unCheckedChildren={t.users.locked}
            defaultChecked
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/* ── Main Page ────────────────────────────────────────── */
export default function UserManagementPage() {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const {
    users,
    personnelList,
    loading,
    modalOpen,
    setModalOpen,
    resetModal,
    setResetModal,
    editRecord,
    setEditRecord,
    fetchUsers,
    openCreate,
    openEdit,
    handleDelete,
    toggleActive,
  } = useUserManagementPage();

  const columns = [
    {
      title: t.users.colAccount,
      width: 240,
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            size={38}
            style={{
              background:
                ROLE_CONFIG[r.role]?.color === "default"
                  ? "#8B4513"
                  : ROLE_CONFIG[r.role]?.color,
              fontSize: 15,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {r.username.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>
              @{r.username}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#777",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: r.isActive ? "#52c41a" : "#ff4d4f",
                  flexShrink: 0,
                }}
              />
              {r.lastLogin
                ? `${t.users.lastLogin}: ${dayjs(r.lastLogin).format(
                    "DD/MM/YYYY HH:mm"
                  )}`
                : t.users.neverLoggedIn}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t.users.colRole,
      dataIndex: "role",
      width: 130,
      align: "center",
      render: (role) => {
        const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
        return (
          <Tag
            color={cfg.color}
            style={{
              borderRadius: 10,
              fontWeight: 600,
              minWidth: 88,
              textAlign: "center",
              display: "inline-block",
            }}
          >
            {t.users.roles[role] || cfg.label}
          </Tag>
        );
      },
    },
    {
      title: t.users.colPersonnel,
      width: 180,
      render: (_, r) =>
        r.personnel ? (
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>
              {r.personnel.dharmName || r.personnel.fullName}
            </div>
            <span style={{ fontSize: 11, color: "#666" }}>
              {r.personnel.code}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: "#666" }}>—</span>
        ),
    },
    {
      title: t.common.status,
      width: 130,
      align: "center",
      render: (_, r) => (
        <Tag
          icon={r.isActive ? <CheckCircleOutlined /> : <StopOutlined />}
          color={r.isActive ? "success" : "default"}
          style={{
            borderRadius: 10,
            minWidth: 88,
            textAlign: "center",
            display: "inline-block",
            cursor: isAdmin() ? "pointer" : "default",
          }}
          onClick={isAdmin() ? () => toggleActive(r) : undefined}
        >
          {r.isActive ? t.users.active : t.users.locked}
        </Tag>
      ),
    },
    {
      title: t.common.actions,
      width: 120,
      align: "center",
      render: (_, r) =>
        isAdmin() ? (
          <Space size={4}>
            <Tooltip title={t.common.edit}>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                style={{ color: "#8B4513" }}
                onClick={() => openEdit(r)}
              />
            </Tooltip>
            <Tooltip title={t.users.resetPassword}>
              <Button
                type="text"
                size="small"
                icon={<KeyOutlined />}
                style={{ color: "#1565c0" }}
                onClick={() => setResetModal({ open: true, user: r })}
              />
            </Tooltip>
            <Popconfirm
              title={t.users.confirmDelete}
              onConfirm={() => handleDelete(r.id)}
              okText={t.common.delete}
              cancelText={t.common.cancel}
            >
              <Tooltip title={t.common.delete}>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        ) : null,
    },
  ];

  const stats = [
    { label: t.users.totalAccounts, value: users.length, color: "#8B4513" },
    {
      label: t.users.activeAccounts,
      value: users.filter((u) => u.isActive).length,
      color: "#52c41a",
    },
    {
      label: t.users.lockedAccounts,
      value: users.filter((u) => !u.isActive).length,
      color: "#ff4d4f",
    },
    {
      label: t.users.adminAccounts,
      value: users.filter((u) => u.role === "admin").length,
      color: "#e74c3c",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="user-banner">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 12,
              background: "rgba(255,200,100,0.12)",
              border: "1px solid rgba(255,200,100,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserOutlined style={{ fontSize: 24, color: "#ffd59e" }} />
          </div>
          <div>
            <div style={{ color: "#ffd59e", fontWeight: 800, fontSize: 20 }}>
              {t.users.title}
            </div>
            <div
              style={{
                color: "rgba(255,210,160,0.6)",
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {t.users.subtitle}
            </div>
          </div>
        </div>
        {isAdmin() && (
          <Button
            icon={<PlusOutlined />}
            onClick={openCreate}
            style={{
              background: "#ffc44d",
              borderColor: "#ffa500",
              color: "#3d1a06",
              fontWeight: 700,
              height: 38,
              borderRadius: 10,
            }}
          >
            {t.users.addNew}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="user-stats-grid">
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "14px 18px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
              borderLeft: `4px solid ${s.color}`,
            }}
          >
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: s.color,
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          border: "1px solid #f0f0f0",
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `${total} ${t.users.totalLabel}`,
          }}
          rowClassName={(r) => (!r.isActive ? "row-inactive" : "")}
          className="personnel-table"
          scroll={{ x: 790 }}
          style={{ borderRadius: 12, overflow: "hidden" }}
        />
      </Card>

      <style>{`.row-inactive td { opacity: 0.5; }`}</style>

      <UserFormModal
        open={modalOpen}
        editRecord={editRecord}
        personnelList={personnelList}
        onClose={() => setModalOpen(false)}
        onSaved={fetchUsers}
      />

      <ResetPasswordModal
        open={resetModal.open}
        user={resetModal.user}
        onClose={() => setResetModal({ open: false, user: null })}
      />
    </div>
  );
}
