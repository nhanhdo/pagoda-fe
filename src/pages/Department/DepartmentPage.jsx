import React, { useState } from 'react';
import {
  Row, Col, Card, Button, Space, Tag, Modal, Form, Input,
  message, Popconfirm, Avatar, Tooltip, Typography, Empty, Spin, Drawer, List,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
import api from '../../api/axios';
import { useDepartmentPage, getDeptColor } from './useDepartmentPage';
import { useLanguage } from '../../i18n/LanguageContext';
import './DepartmentPage.css';

const { Text } = Typography;

export default function DepartmentPage() {
  const { data, loading, canEdit, fetchData, handleDelete } = useDepartmentPage();
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [drawerDept, setDrawerDept] = useState(null);
  const [form] = Form.useForm();

  const openModal = (record = null) => {
    setEditRecord(record);
    if (record) form.setFieldsValue(record);
    else form.resetFields();
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editRecord) {
        await api.put(`/departments/${editRecord.id}`, values);
        message.success('Cập nhật thành công');
      } else {
        await api.post('/departments', values);
        message.success('Thêm ban thành công');
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>;

  return (
    <div>
      {/* Toolbar */}
      <div className="department-page-toolbar">
        <Text style={{ fontSize: 13, color: '#888' }}>
          <TeamOutlined style={{ marginRight: 6 }} />
          {data.length} {t.nav.departments.toLowerCase()}
        </Text>
        {canEdit && (
          <Button
            type="primary" icon={<PlusOutlined />} onClick={() => openModal()}
            style={{ backgroundColor: '#2e7d32', borderColor: '#2e7d32' }}
          >
            {t.department.addNew}
          </Button>
        )}
      </div>

      {/* Card Grid */}
      {data.length === 0 ? (
        <Empty description={t.department.emptyAll} />
      ) : (
        <Row gutter={[16, 16]}>
          {data.map(dept => {
            const { bg, text } = getDeptColor(dept.code);
            const members = dept.members || [];
            return (
              <Col xs={24} sm={12} lg={8} key={dept.id}>
                <Card className="dept-card" hoverable>
                  {/* Header: code tag + actions */}
                  <div className="dept-card-header">
                    <Tag
                      className="department-code-tag"
                      style={{ backgroundColor: bg, color: text, borderColor: bg }}
                    >
                      {dept.code}
                    </Tag>
                    {canEdit && (
                      <Space size={2}>
                        <Tooltip title={t.common.edit}>
                          <Button type="text" size="small" icon={<EditOutlined />}
                            style={{ color: '#8B4513' }} onClick={() => openModal(dept)} />
                        </Tooltip>
                        <Popconfirm
                          title={t.department.confirmDelete}
                          onConfirm={() => handleDelete(dept.id)}
                          okText={t.common.delete} cancelText={t.common.cancel}
                        >
                          <Tooltip title={t.common.delete}>
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                          </Tooltip>
                        </Popconfirm>
                      </Space>
                    )}
                  </div>

                  {/* Name + description */}
                  <div className="dept-name">{dept.name}</div>
                  {dept.description && (
                    <div className="dept-desc">{dept.description}</div>
                  )}

                  {/* Divider */}
                  <div className="dept-divider" />

                  {/* Members — click to open drawer */}
                  <div
                    className="dept-members-row"
                    style={{ cursor: members.length > 0 ? 'pointer' : 'default' }}
                    onClick={() => members.length > 0 && setDrawerDept(dept)}
                  >
                    <Text style={{ fontSize: 12, color: members.length > 0 ? '#8B4513' : '#888' }}>
                      <TeamOutlined style={{ marginRight: 4 }} />
                      {members.length} {t.department.members.toLowerCase()}
                      {members.length > 0 && (
                        <span style={{ fontSize: 11, color: '#aaa', marginLeft: 4 }}>· {t.department.viewMembers}</span>
                      )}
                    </Text>
                    {members.length > 0 && (
                      <Avatar.Group max={{ count: 4, style: { background: '#f0f0f0', color: '#888', fontSize: 11 } }} size={28}>
                        {members.map(m => (
                          <Avatar
                            key={m.id}
                            size={28}
                            style={{ background: bg, color: text, fontSize: 11, fontWeight: 700 }}
                          >
                            {(m.dharmName || m.fullName)?.[0]}
                          </Avatar>
                        ))}
                      </Avatar.Group>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Member Drawer */}
      <Drawer
        title={
          drawerDept && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Tag
                style={{
                  backgroundColor: getDeptColor(drawerDept.code).bg,
                  color: getDeptColor(drawerDept.code).text,
                  borderColor: getDeptColor(drawerDept.code).bg,
                  fontWeight: 700, borderRadius: 6,
                }}
              >
                {drawerDept.code}
              </Tag>
              <span>{drawerDept.name}</span>
            </div>
          )
        }
        open={!!drawerDept}
        onClose={() => setDrawerDept(null)}
        width={360}
        footer={
          <Text type="secondary" style={{ fontSize: 12 }}>
            <TeamOutlined style={{ marginRight: 6 }} />
            {drawerDept?.members?.length || 0} {t.department.members.toLowerCase()}
          </Text>
        }
      >
        {drawerDept?.members?.length === 0 ? (
          <Empty description={t.department.noMembers} />
        ) : (
          <List
            dataSource={drawerDept?.members || []}
            renderItem={(m) => {
              const { bg, text } = getDeptColor(drawerDept.code);
              return (
                <List.Item style={{ padding: '10px 0' }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar size={40} style={{ background: bg, color: text, fontWeight: 700, fontSize: 15 }}>
                        {(m.dharmName || m.fullName)?.[0]}
                      </Avatar>
                    }
                    title={
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {m.fullName && m.dharmName
                          ? `${m.fullName}(${m.dharmName})`
                          : m.dharmName || m.fullName}
                      </span>
                    }
                    description={
                      <span style={{ fontSize: 12, color: '#8B4513' }}>
                        {m.position ? m.position.replace(/_/g, ' ') : t.department.members}
                      </span>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Drawer>

      {/* Modal */}
      <Modal
        title={editRecord ? t.department.editTitle : t.department.addTitle}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editRecord ? t.common.update : t.common.add}
        cancelText={t.common.cancel}
        okButtonProps={{ style: { backgroundColor: '#8B4513', borderColor: '#8B4513' } }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="code" label={t.department.colCode} rules={[{ required: true, message: 'Nhập mã ban' }]}>
            <Input placeholder={t.department.codePlaceholder} style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="name" label={t.department.colName} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t.common.description}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
