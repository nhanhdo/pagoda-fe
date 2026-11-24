import React, { useMemo, useState } from 'react';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import CountUp from '../../components/CountUp/CountUp';
import LotusEmpty from '../../components/LotusEmpty/LotusEmpty';
import {
  Table, Button, Select, Modal, Form, Input, message, Popconfirm, Row, Col,
  DatePicker, Segmented, Avatar, Tooltip,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, TrophyOutlined, WarningOutlined,
  SearchOutlined, CalendarOutlined, StarOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { useRewardDisciplinePage, rewardSubTypes, disciplineSubTypes } from './useRewardDisciplinePage';
import { useLanguage } from '../../i18n/LanguageContext';
import { initializeForm, guardedClose } from '../../utils/formGuard';
import './RewardDisciplinePage.css';
import { pinLeft, PIN_RIGHT } from '../Personnel/personnelShared';

const { Option } = Select;

const REWARD = 'khen_thưởng';
const DISCIPLINE = 'kỷ_luật';

const KIND = {
  [REWARD]:     { c: '#c47f36', s: '#fbf1e4', icon: <TrophyOutlined /> },
  [DISCIPLINE]: { c: '#d9646c', s: '#fdeeee', icon: <WarningOutlined /> },
};

const SUB_TONE = {
  'giấy_khen':         { c: '#4f9a72', s: '#e8f4ed' },
  'công_đức_xuất_sắc': { c: '#c47f36', s: '#fbf1e4' },
  'bằng_khen':         { c: '#b9841f', s: '#fdf3dc' },
  'khiển_trách':       { c: '#c98a6a', s: '#fbefe8' },
  'cảnh_cáo':          { c: '#d9646c', s: '#fdeeee' },
  'tạm_đình_chỉ':      { c: '#c4545d', s: '#fbe6e7' },
  'đình_chỉ':          { c: '#a8404a', s: '#f8dfe1' },
};

const initialOf = (name = '') => name.trim().split(/\s+/).pop()?.[0]?.toUpperCase() || '?';
const personName = (p) => (p ? p.dharmName || p.fullName : '');

export default function RewardDisciplinePage() {
  const { t, lang } = useLanguage();
  const R = t.rewardDiscipline;
  const {
    data, loading,
    modalOpen, setModalOpen,
    editRecord, setEditRecord,
    personnel, canEdit,
    fetchData, handleDelete,
  } = useRewardDisciplinePage();

  const [form] = Form.useForm();
  const formType = Form.useWatch('type', form);
  const [kind, setKind] = useState('all');
  const [year, setYear] = useState('all');
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const subLabel = (v) => R.subTypes?.[v] || v?.replace(/_/g, ' ');
  const kindLabel = (v) => (v === REWARD ? R.tabReward : R.tabDiscipline);
  const today = dayjs().startOf('day');
  const isActive = (r) => r.type === DISCIPLINE && (!r.validUntil || !dayjs(r.validUntil).isBefore(today));

  /* ── Stats over every record (not just the visible filter) ── */
  const stats = useMemo(() => {
    const thisYear = dayjs().year();
    const rewards = data.filter(d => d.type === REWARD);
    const disciplines = data.filter(d => d.type === DISCIPLINE);
    const inYear = (d) => d.issuedDate && dayjs(d.issuedDate).year() === thisYear;
    return {
      thisYear,
      rewards: rewards.length,
      disciplines: disciplines.length,
      rewardsThisYear: rewards.filter(inYear).length,
      disciplinesThisYear: disciplines.filter(inYear).length,
      activeDisciplines: disciplines.filter(isActive).length,
      honored: new Set(rewards.map(d => d.personnelId)).size,
      years: [...new Set(data.filter(d => d.issuedDate).map(d => dayjs(d.issuedDate).year()))].sort((a, b) => b - a),
    };
  }, [data]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter(d => {
      if (kind !== 'all' && d.type !== kind) return false;
      if (year !== 'all' && (!d.issuedDate || dayjs(d.issuedDate).year() !== year)) return false;
      if (!q) return true;
      const p = d.personnel || {};
      return [p.fullName, p.dharmName, d.title, d.reason, d.issuedBy, subLabel(d.subType)]
        .some(v => v && String(v).toLowerCase().includes(q));
    });
  }, [data, kind, year, query, lang]);

  const openModal = (record = null) => {
    setEditRecord(record);
    if (record) {
      initializeForm(form, {
        ...record,
        issuedDate: record.issuedDate ? dayjs(record.issuedDate) : null,
        validUntil: record.validUntil ? dayjs(record.validUntil) : null,
      });
    } else {
      form.resetFields();
      initializeForm(form, { type: kind === DISCIPLINE ? DISCIPLINE : REWARD, issuedDate: dayjs() });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    const payload = {
      ...values,
      issuedDate: values.issuedDate?.format('YYYY-MM-DD'),
      validUntil: values.type === DISCIPLINE && values.validUntil ? values.validUntil.format('YYYY-MM-DD') : null,
    };
    setSaving(true);
    try {
      if (editRecord) {
        await api.put(`/reward-disciplines/${editRecord.id}`, payload);
        message.success(R.updateSuccess);
      } else {
        await api.post('/reward-disciplines', payload);
        message.success(R.addSuccess);
      }
      setModalOpen(false);
      fetchData();
    } catch {
      message.error(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  /* Inactive staff can't receive new records, but stay selectable on their own existing record */
  const personnelOptions = personnel
    .filter(p => p.status === 'đang_hoạt_động' || p.id === editRecord?.personnelId)
    .map(p => ({ value: p.id, label: p.dharmName ? `${p.dharmName} (${p.fullName})` : p.fullName }));
  if (editRecord?.personnel && !personnelOptions.some(o => o.value === editRecord.personnelId)) {
    personnelOptions.push({ value: editRecord.personnelId, label: personName(editRecord.personnel) });
  }

  const columns = [
    {
      fixed: pinLeft(),
      title: R.colPerson,
      key: 'person',
      width: 230,
      render: (_, r) => {
        const p = r.personnel;
        const tone = KIND[r.type] || KIND[REWARD];
        return (
          <div className="person-cell">
            <Avatar size={38} className="person-cell__avatar" style={{ background: tone.s, color: tone.c }}>
              {initialOf(p?.fullName || p?.dharmName)}
            </Avatar>
            <div className="person-cell__text">
              <div className="person-cell__name">{personName(p) || '—'}</div>
              {p?.dharmName && p?.fullName && <div className="person-cell__sub">{p.fullName}</div>}
            </div>
          </div>
        );
      },
    },
    {
      title: R.colType,
      dataIndex: 'subType',
      width: 190,
      filters: [...rewardSubTypes, ...disciplineSubTypes].map(s => ({ text: subLabel(s), value: s })),
      onFilter: (v, r) => r.subType === v,
      render: (v, r) => {
        const tone = SUB_TONE[v] || KIND[r.type] || KIND[REWARD];
        return (
          <span className="tbl-pill" style={{ color: tone.c, background: tone.s }}>
            {(KIND[r.type] || KIND[REWARD]).icon}{subLabel(v)}
          </span>
        );
      },
    },
    {
      title: R.colTitle,
      dataIndex: 'title',
      width: 300,
      render: (v, r) => (
        <div className="rd-title">
          <div className="rd-title__main">{v}</div>
          {r.reason && <div className="rd-title__sub">{r.reason}</div>}
        </div>
      ),
    },
    {
      title: R.colDate,
      dataIndex: 'issuedDate',
      width: 120,
      sorter: (a, b) => dayjs(a.issuedDate).valueOf() - dayjs(b.issuedDate).valueOf(),
      defaultSortOrder: 'descend',
      render: (v) => v ? <span className="tbl-mono">{dayjs(v).format('DD/MM/YYYY')}</span> : <span className="tbl-muted">—</span>,
    },
    {
      title: R.colSigner,
      dataIndex: 'issuedBy',
      width: 140,
      render: (v) => v || <span className="tbl-muted">—</span>,
    },
    {
      title: R.colValidity,
      key: 'validity',
      width: 170,
      render: (_, r) => {
        if (r.type !== DISCIPLINE) return <span className="tbl-muted">—</span>;
        if (!r.validUntil) return <span className="tbl-pill rd-valid is-open"><span className="tbl-pill__dot" />{R.noExpiry}</span>;
        const active = isActive(r);
        return (
          <Tooltip title={`${R.validUntil} ${dayjs(r.validUntil).format('DD/MM/YYYY')}`}>
            <span className={`tbl-pill rd-valid ${active ? 'is-active' : 'is-expired'}`}>
              <span className="tbl-pill__dot" />
              {active ? `${R.activeUntil} ${dayjs(r.validUntil).format('DD/MM/YYYY')}` : R.expired}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: '',
      key: 'actions', fixed: PIN_RIGHT,
      width: 96,
      align: 'right',
      render: (_, r) => canEdit && (
        <div className="personnel-action-group" onClick={(e) => e.stopPropagation()}>
          <Tooltip title={t.common.edit}>
            <Button aria-label={t.common.edit} type="text" icon={<EditOutlined />} onClick={() => openModal(r)} />
          </Tooltip>
          <Popconfirm title={R.confirmDelete} onConfirm={() => handleDelete(r.id)} okText={t.common.delete} cancelText={t.common.cancel} okButtonProps={{ danger: true }}>
            <Tooltip title={t.common.delete}>
              <Button aria-label={t.common.delete} type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  if (loading && !data.length) return <PageSpinner />;

  const statTiles = [
    { key: 'reward', label: R.statTotalReward, value: stats.rewards, icon: <TrophyOutlined />, tone: KIND[REWARD],
      hint: R.statInYear.replace('{n}', stats.rewardsThisYear).replace('{y}', stats.thisYear) },
    { key: 'discipline', label: R.statTotalDiscipline, value: stats.disciplines, icon: <WarningOutlined />, tone: KIND[DISCIPLINE],
      hint: R.statActive.replace('{n}', stats.activeDisciplines) },
    { key: 'year', label: `${R.statYear} ${stats.thisYear}`, value: stats.rewardsThisYear + stats.disciplinesThisYear, icon: <CalendarOutlined />,
      tone: { c: '#4d8fc7', s: '#e9f1fb' },
      hint: R.statYearSplit.replace('{r}', stats.rewardsThisYear).replace('{d}', stats.disciplinesThisYear) },
    { key: 'honored', label: R.statHonored, value: stats.honored, icon: <StarOutlined />, tone: { c: '#4f9a72', s: '#e8f4ed' },
      hint: R.statHonoredHint },
  ];

  const filtered = Boolean(query.trim() || kind !== 'all' || year !== 'all');
  const subTypes = (formType || REWARD) === DISCIPLINE ? disciplineSubTypes : rewardSubTypes;

  return (
    <div className="rd-page">
      {/* ── Header ── */}
      <section className="rd-hero section-anim section-d0">
        <div className="rd-hero__main">
          <div className="rd-hero__icon"><SafetyCertificateOutlined /></div>
          <div>
            <h1 className="rd-hero__title">{R.title}</h1>
            <p className="rd-hero__sub">{R.subtitle}</p>
          </div>
        </div>
        {canEdit && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} className="rd-btn">
            {R.addNew}
          </Button>
        )}
      </section>

      {/* ── Stats ── */}
      <div className="rd-stats section-anim section-d1">
        {statTiles.map(s => (
          <div key={s.key} className="rd-stat" style={{ '--st': s.tone.c, '--st-soft': s.tone.s }}>
            <span className="rd-stat__icon">{s.icon}</span>
            <div className="rd-stat__body">
              <div className="rd-stat__value"><CountUp value={s.value} /></div>
              <div className="rd-stat__label">{s.label}</div>
              <div className="rd-stat__hint">{s.hint}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── List ── */}
      <section className="rd-card section-anim section-d2">
        <div className="rd-toolbar">
          <Segmented
            className="rd-kind"
            value={kind}
            onChange={setKind}
            options={[
              { value: 'all', label: <span className="rd-seg">{R.segAll}<b>{data.length}</b></span> },
              { value: REWARD, label: <span className="rd-seg rd-seg--reward"><TrophyOutlined />{R.tabReward}<b>{stats.rewards}</b></span> },
              { value: DISCIPLINE, label: <span className="rd-seg rd-seg--discipline"><WarningOutlined />{R.tabDiscipline}<b>{stats.disciplines}</b></span> },
            ]}
          />
          <div className="rd-toolbar__right">
            <Input
              className="rd-search"
              placeholder={R.searchPlaceholder}
              prefix={<SearchOutlined style={{ color: '#bfae99' }} />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              allowClear
            />
            <Select value={year} onChange={setYear} className="rd-year" popupMatchSelectWidth={false}>
              <Option value="all">{R.allYears}</Option>
              {stats.years.map(y => <Option key={y} value={y}>{R.statYear} {y}</Option>)}
            </Select>
          </div>
        </div>

        <Table
          dataSource={visible}
          columns={columns}
          rowKey="id"
          loading={loading}
          className="personnel-table"
          scroll={{ x: 'max-content' }}
          pagination={{
            pageSize: 10,
            hideOnSinglePage: true,
            showTotal: (n, range) => `${range[0]}-${range[1]} / ${n} ${R.totalLabel}`,
          }}
          expandable={{
            expandedRowRender: (r) => (
              <div className="rd-detail" style={{ '--kind': (KIND[r.type] || KIND[REWARD]).c, '--kind-soft': (KIND[r.type] || KIND[REWARD]).s }}>
                <div className="rd-detail__block">
                  <div className="rd-detail__label">{R.fieldReason}</div>
                  <div className="rd-detail__text">{r.reason || '—'}</div>
                </div>
                {r.notes && (
                  <div className="rd-detail__block">
                    <div className="rd-detail__label">{t.common.notes}</div>
                    <div className="rd-detail__text">{r.notes}</div>
                  </div>
                )}
                <div className="rd-detail__meta">
                  <span>{kindLabel(r.type)} · {subLabel(r.subType)}</span>
                  {r.issuedDate && <span>{R.colDate}: {dayjs(r.issuedDate).format('DD/MM/YYYY')}</span>}
                  {r.issuedBy && <span>{R.colSigner}: {r.issuedBy}</span>}
                </div>
              </div>
            ),
            expandRowByClick: true,
          }}
          onRow={() => ({ style: { cursor: 'pointer' } })}
          locale={{
            emptyText: filtered
              ? <LotusEmpty description={R.emptyFiltered} hint={R.emptyFilteredHint} />
              : <LotusEmpty description={R.emptyTitle} hint={canEdit ? R.emptyHint : ''} />,
          }}
        />
      </section>

      {/* ── Add / edit ── */}
      <Modal
        title={editRecord ? R.editTitle : R.addTitle}
        open={modalOpen}
        onCancel={() => guardedClose(form, () => setModalOpen(false), t)}
        onOk={() => form.submit()}
        okText={editRecord ? t.common.update : t.common.add}
        cancelText={t.common.cancel}
        okButtonProps={{ danger: formType === DISCIPLINE }}
        confirmLoading={saving}
        maskClosable={false}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="rd-form">
          <Form.Item name="type" label={R.fieldType} initialValue={REWARD}>
            <Segmented
              block
              onChange={() => form.setFieldsValue({ subType: undefined })}
              options={[
                { value: REWARD, label: <span className="rd-seg rd-seg--reward"><TrophyOutlined />{R.tabReward}</span> },
                { value: DISCIPLINE, label: <span className="rd-seg rd-seg--discipline"><WarningOutlined />{R.tabDiscipline}</span> },
              ]}
            />
          </Form.Item>
          <Form.Item name="personnelId" label={R.colPerson} rules={[{ required: true, message: R.personRequired }]}>
            <Select
              showSearch
              placeholder={R.personPlaceholder}
              options={personnelOptions}
              filterOption={(input, opt) => String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="subType" label={R.fieldSubType} rules={[{ required: true, message: R.subTypeRequired }]}>
                <Select placeholder={R.subTypePlaceholder}>
                  {subTypes.map(s => (
                    <Option key={s} value={s}>
                      <span className="rd-opt"><i style={{ background: (SUB_TONE[s] || {}).c }} />{subLabel(s)}</span>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="issuedDate" label={R.colDate} rules={[{ required: true, message: R.dateRequired }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label={R.colTitle} rules={[{ required: true, message: R.titleRequired }]}>
            <Input placeholder={R.titlePlaceholder} />
          </Form.Item>
          <Form.Item name="reason" label={R.fieldReason} rules={[{ required: true, message: R.reasonRequired }]}>
            <Input.TextArea rows={3} showCount maxLength={1000} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={formType === DISCIPLINE ? 12 : 24}>
              <Form.Item name="issuedBy" label={R.colSigner}>
                <Input />
              </Form.Item>
            </Col>
            {formType === DISCIPLINE && (
              <Col xs={24} sm={12}>
                <Form.Item
                  name="validUntil"
                  label={R.validUntil}
                  extra={R.validUntilHint}
                  dependencies={['issuedDate']}
                  rules={[({ getFieldValue }) => ({
                    validator(_, v) {
                      const issued = getFieldValue('issuedDate');
                      if (!v || !issued || !v.isBefore(issued, 'day')) return Promise.resolve();
                      return Promise.reject(new Error(R.validUntilError));
                    },
                  })]}
                >
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            )}
          </Row>
          <Form.Item name="notes" label={t.common.notes} style={{ marginBottom: 0 }}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
