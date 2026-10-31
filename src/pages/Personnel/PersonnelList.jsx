import React, { useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Card,
  Modal,
  Avatar,
  Popconfirm,
  Tooltip,
  Badge,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileExcelOutlined,
  TableOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { exportToExcel } from "../../utils/exportData";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import PersonnelForm from "./PersonnelForm";
import { usePersonnelList, typeColors, statusColors } from "./usePersonnelList";
import { useLanguage } from "../../i18n/LanguageContext";
import "./PersonnelList.css";

const { Option } = Select;

export default function PersonnelList() {
  const {
    data,
    loading,
    total,
    page,
    search,
    filterType,
    filterStatus,
    modalOpen,
    editRecord,
    setPage,
    setSearch,
    setFilterType,
    setFilterStatus,
    setModalOpen,
    setEditRecord,
    fetchData,
    handleDelete,
  } = usePersonnelList();

  const { canManage, isAdmin, hasRole } = useAuth();
  const navigate = useNavigate();
  const { t: tt } = useLanguage();
  const [viewMode, setViewMode] = useState("table");

  const handleExport = () => {
    exportToExcel(
      data,
      [
        { header: tt.personnel.colCode, key: "code" },
        { header: tt.common.name, key: "fullName" },
        { header: tt.personnel.dharmName, key: "dharmName" },
        {
          header: tt.common.type,
          render: (r) => tt.personnel.types[r.type] || r.type,
        },
        { header: tt.personnel.colPosition, key: "position" },
        { header: tt.personnel.colPhone, key: "phone" },
        { header: tt.common.email, key: "email" },
        {
          header: tt.common.status,
          render: (r) => tt.personnel.statuses[r.status] || r.status,
        },
      ],
      "nhan-su"
    );
  };

  const columns = [
    {
      title: tt.personnel.colCode,
      dataIndex: "code",
      width: 80,
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: tt.personnel.colPhoto,
      dataIndex: "photo",
      width: 60,
      render: (photo, r) =>
        photo ? (
          <Avatar src={photo} size={36} />
        ) : (
          <Avatar size={36} style={{ backgroundColor: "#8B4513" }}>
            {r.fullName?.[0]}
          </Avatar>
        ),
    },
    {
      title: tt.personnel.colName,
      width: 220,
      render: (_, r) => (
        <div>
          <div className="personnel-name-cell__main">{r.fullName}</div>
          {r.dharmName && (
            <div className="personnel-name-cell__dharm">{r.dharmName}</div>
          )}
        </div>
      ),
    },
    {
      title: tt.personnel.colType,
      dataIndex: "type",
      width: 110,
      render: (v) => (
        <Tag
          color={typeColors[v]}
          className="personnel-type-tag"
          style={{ color: typeColors[v] === "#8B4513" ? "#fff" : undefined }}
        >
          {tt.personnel.types[v]}
        </Tag>
      ),
    },
    {
      title: tt.personnel.colPosition,
      dataIndex: "position",
      width: 150,
      render: (v) => (v ? v.replace(/_/g, " ") : "—"),
    },
    {
      title: tt.personnel.colPhone,
      dataIndex: "phone",
      width: 120,
      render: (v) => v || "—",
    },
    {
      title: tt.common.status,
      dataIndex: "status",
      width: 140,
      render: (v) => (
        <Badge status={statusColors[v]} text={tt.personnel.statuses[v]} />
      ),
    },
    {
      title: tt.common.actions,
      width: 100,
      render: (_, r) => (
        <Space>
          <Tooltip title={tt.personnel.viewDetail}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/app/personnel/${r.id}`)}
            />
          </Tooltip>
          {canManage() && (
            <Tooltip title={tt.personnel.editTooltip}>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditRecord(r);
                  setModalOpen(true);
                }}
              />
            </Tooltip>
          )}
          {(isAdmin() || hasRole("truotri")) && (
            <Popconfirm
              title={tt.common.confirmDelete}
              onConfirm={() => handleDelete(r.id)}
              okText={tt.common.delete}
              cancelText={tt.common.cancel}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div className="personnel-list-toolbar">
        <Space wrap>
          <Input
            placeholder={tt.personnel.searchPlaceholder}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: "min(240px, 100%)" }}
            allowClear
          />
          <Select
            value={filterType}
            onChange={(v) => {
              setFilterType(v);
              setPage(1);
            }}
            style={{ width: "min(160px, 100%)" }}
            placeholder={tt.personnel.allTypes}
          >
            <Option value="">{tt.personnel.allTypes}</Option>
            {Object.entries(tt.personnel.types).map(([k, v]) => (
              <Option key={k} value={k}>
                {v}
              </Option>
            ))}
          </Select>
          <Select
            value={filterStatus}
            onChange={(v) => {
              setFilterStatus(v);
              setPage(1);
            }}
            style={{ width: "min(160px, 100%)" }}
          >
            <Option value="">{tt.personnel.allStatuses}</Option>
            {Object.entries(tt.personnel.statuses).map(([k, v]) => (
              <Option key={k} value={k}>
                {v}
              </Option>
            ))}
          </Select>
        </Space>
        <Space>
          {/* View toggle */}
          <div className="view-toggle">
            <Tooltip title={tt.personnel.tableView}>
              <Button
                type={viewMode === "table" ? "primary" : "default"}
                icon={<TableOutlined />}
                onClick={() => setViewMode("table")}
                style={
                  viewMode === "table"
                    ? { backgroundColor: "#8B4513", borderColor: "#8B4513" }
                    : {}
                }
              />
            </Tooltip>
            <Tooltip title={tt.personnel.cardView}>
              <Button
                type={viewMode === "card" ? "primary" : "default"}
                icon={<AppstoreOutlined />}
                onClick={() => setViewMode("card")}
                style={
                  viewMode === "card"
                    ? { backgroundColor: "#8B4513", borderColor: "#8B4513" }
                    : {}
                }
              />
            </Tooltip>
          </div>
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExport}
            style={{ color: "#217346", borderColor: "#217346" }}
          >
            Excel
          </Button>
          {canManage() && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditRecord(null);
                setModalOpen(true);
              }}
              style={{ backgroundColor: "#2e7d32", borderColor: "#2e7d32" }}
            >
              {tt.personnel.addNew}
            </Button>
          )}
        </Space>
      </div>

      {viewMode === "table" ? (
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 10,
            onChange: setPage,
            showTotal: (total) => `${total} ${tt.personnel.totalLabel}`,
          }}
          scroll={{ x: 980 }}
          size="small"
          className="personnel-table"
        />
      ) : (
        <div className="personnel-card-grid">
          {data.map((r) => (
            <div
              key={r.id}
              className="personnel-card"
              onClick={() => navigate(`/app/personnel/${r.id}`)}
            >
              {r.photo ? (
                <Avatar src={r.photo} size={80} />
              ) : (
                <Avatar
                  size={80}
                  style={{ backgroundColor: "#8B4513", fontSize: 32 }}
                >
                  {r.fullName?.[0]}
                </Avatar>
              )}
              <Tag style={{ marginTop: 6 }}>{r.code}</Tag>

              <div className="personnel-card__name">
                {r.dharmName || r.fullName}
              </div>
              {r.dharmName && (
                <div className="personnel-card__subname">{r.fullName}</div>
              )}

              <Tag
                color={typeColors[r.type]}
                style={{
                  color: typeColors[r.type] === "#8B4513" ? "#fff" : undefined,
                  fontSize: 11,
                }}
              >
                {tt.personnel.types[r.type] || r.type}
              </Tag>

              {r.position && (
                <div className="personnel-card__position">
                  {r.position.replace(/_/g, " ")}
                </div>
              )}

              <div className="personnel-card__status">
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background:
                      r.status === "đang_hoạt_động" ? "#52c41a" : "#bbb",
                  }}
                />
                <span style={{ fontSize: 11, color: "#888" }}>
                  {tt.personnel.statuses[r.status] || r.status}
                </span>
              </div>

              <div
                className="personnel-card__actions"
                onClick={(e) => e.stopPropagation()}
              >
                <Tooltip title={tt.personnel.viewDetail}>
                  <Button
                    size="small"
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/app/personnel/${r.id}`)}
                  />
                </Tooltip>
                {canManage() && (
                  <Tooltip title={tt.personnel.editTooltip}>
                    <Button
                      size="small"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setEditRecord(r);
                        setModalOpen(true);
                      }}
                    />
                  </Tooltip>
                )}
                {(isAdmin() || hasRole("truotri")) && (
                  <Popconfirm
                    title={tt.common.confirmDelete}
                    onConfirm={() => handleDelete(r.id)}
                    okText={tt.common.delete}
                    cancelText={tt.common.cancel}
                  >
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
          onSuccess={() => {
            setModalOpen(false);
            fetchData();
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </Card>
  );
}
