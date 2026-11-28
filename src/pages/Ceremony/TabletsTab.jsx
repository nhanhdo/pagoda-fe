import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Table, Button, Form, Input, InputNumber, Select, Segmented, Tooltip, Popconfirm, message, AutoComplete, DatePicker, Avatar,
} from 'antd';
import FormDialog, { FormSectionHeading } from '../../components/FormDialog/FormDialog';
import {
  SearchOutlined, EditOutlined, DeleteOutlined, UnorderedListOutlined, AppstoreOutlined, PlusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import LotusEmpty from '../../components/LotusEmpty/LotusEmpty';
import { STATUS_TONE, displayName, fetchFollowersCached } from './ceremonyShared';
import { initializeForm, guardedClose } from '../../utils/formGuard';

function TabletModal({ C, t, open, record, preset, areas, followers, onClose, onSaved }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (record) initializeForm(form, { ...record, installedDate: record.installedDate ? dayjs(record.installedDate) : null });
    else initializeForm(form, { status: 'đang_thờ', installedDate: dayjs(), ...(preset || {}) });
  }, [open, record, preset]);

  const submit = async (values) => {
    setSaving(true);
    try {
      const payload = { ...values, installedDate: values.installedDate ? values.installedDate.format('YYYY-MM-DD') : null };
      if (record) await api.put(`/memorial-tablets/${record.id}`, payload);
      else await api.post('/memorial-tablets', payload);
      message.success(record ? C.tabletUpdated : C.tabletCreated);
      onSaved();
    } catch (e) {
      message.error(e.response?.data?.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      sections={[['spirit', C.spiritSection], ['location', C.locationSection], ['worshipper', C.worshipperSection]]}
      open={open} onCancel={() => guardedClose(form, onClose, t)} maskClosable={false} onOk={() => form.submit()} confirmLoading={saving} width={640} destroyOnClose
      title={record ? `${C.editTablet} · ${record.code}` : C.addTablet}
      isAdding={!record}
      okText={record ? t.common.update : t.common.add} cancelText={t.common.cancel}
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <FormSectionHeading section="spirit" className="cer-section">{C.spiritSection}</FormSectionHeading>
        <Form.Item name="spiritName" label={C.fields.spiritName} rules={[{ required: true, message: C.fields.nameRequired }]}><Input /></Form.Item>
        <div className="cer-form-row">
          <Form.Item name="birthYear" label={C.fields.birthYear}><InputNumber min={1850} max={dayjs().year()} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="deathYear" label={C.fields.deathYear}><InputNumber min={1850} max={dayjs().year()} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="ageAtDeath" label={C.fields.ageAtDeath}><InputNumber min={0} max={130} style={{ width: '100%' }} /></Form.Item>
        </div>
        <div className="cer-form-row">
          <Form.Item name="deathLunarDay" label={C.fields.deathLunarDay}><InputNumber min={1} max={30} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="deathLunarMonth" label={C.fields.deathLunarMonth}><InputNumber min={1} max={12} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="gender" label={C.fields.gender}>
            <Select allowClear options={[{ value: 'nam', label: C.male }, { value: 'nữ', label: C.female }]} />
          </Form.Item>
        </div>

        <FormSectionHeading section="location" className="cer-section">{C.locationSection}</FormSectionHeading>
        <div className="cer-form-row">
          <Form.Item name="area" label={C.fields.area} rules={[{ required: true, message: C.fields.areaRequired }]} style={{ flex: 2 }}>
            <AutoComplete options={areas.map(a => ({ value: a }))} placeholder={C.fields.areaPlaceholder} filterOption={(input, opt) => String(opt?.value ?? '').toLowerCase().includes(input.toLowerCase())} />
          </Form.Item>
          <Form.Item name="rowNo" label={C.fields.rowNo} rules={[{ required: true, message: C.fields.required }]}><InputNumber min={1} max={500} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="slotNo" label={C.fields.slotNo} rules={[{ required: true, message: C.fields.required }]}><InputNumber min={1} max={500} style={{ width: '100%' }} /></Form.Item>
        </div>
        <div className="cer-form-row">
          <Form.Item name="installedDate" label={C.fields.installedDate}><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="status" label={C.fields.status}>
            <Select options={['đang_thờ', 'đã_thỉnh_về'].map(s => ({ value: s, label: C.statuses[s] }))} />
          </Form.Item>
        </div>

        <FormSectionHeading section="worshipper" className="cer-section">{C.worshipperSection}</FormSectionHeading>
        <Form.Item name="buddhistFollowerId" label={C.fields.follower}>
          <Select
            allowClear showSearch placeholder={C.fields.followerPlaceholder}
            onChange={(id) => { const f = followers.find(x => x.id === id); if (f) form.setFieldsValue({ worshipperName: displayName(f), worshipperPhone: f.phone || form.getFieldValue('worshipperPhone') }); }}
            filterOption={(input, opt) => String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={(record?.buddhistFollower && !followers.some(f => f.id === record.buddhistFollower.id)
              ? [record.buddhistFollower, ...followers] : followers
            ).map(f => ({ value: f.id, label: displayName(f) }))}
          />
        </Form.Item>
        <div className="cer-form-row">
          <Form.Item name="worshipperName" label={C.fields.worshipperName} style={{ flex: 2 }}><Input /></Form.Item>
          <Form.Item name="worshipperPhone" label={C.fields.phone} style={{ flex: 1 }}><Input /></Form.Item>
        </div>
        <Form.Item name="notes" label={t.common.notes} style={{ marginBottom: 0 }}><Input.TextArea rows={2} /></Form.Item>
      </Form>
    </FormDialog>
  );
}

function LayoutView({ C, layout, canCreate, onAdd, onOpen }) {
  if (!layout.areas.length) return <LotusEmpty description={C.emptyTablets} hint={canCreate ? C.emptyTabletsHint : ''} />;
  return (
    <div className="cer-layout">
      {layout.areas.map(a => {
        const rows = Math.max(a.rows, 1) + (canCreate ? 1 : 0);
        const slots = Math.max(a.slots, 1) + (canCreate ? 1 : 0);
        const byPos = new Map(a.tablets.map(tb => [`${tb.rowNo}-${tb.slotNo}`, tb]));
        return (
          <section key={a.area} className="cer-area">
            <header className="cer-area__head">
              <strong>{a.area}</strong>
              <span>{a.tablets.length} {C.tabletUnit}</span>
            </header>
            <div className="cer-area__scroll">
              <div className="cer-grid-slots" style={{ gridTemplateColumns: `58px repeat(${slots}, minmax(54px, 1fr))` }}>
                <span className="cer-axis">{C.fields.slotNo}</span>
                {Array.from({ length: slots }, (_, i) => <span key={`h${i}`} className="cer-axis">{i + 1}</span>)}
                {Array.from({ length: rows }, (_, r) => (
                  <React.Fragment key={`r${r}`}>
                    <span className="cer-axis" title={`${C.fields.rowNo} ${r + 1}`}>{C.fields.rowNo} {r + 1}</span>
                    {Array.from({ length: slots }, (_, s) => {
                      const tb = byPos.get(`${r + 1}-${s + 1}`);
                      if (tb) {
                        return (
                          <Tooltip key={`${r}-${s}`} title={`${tb.code} · ${tb.spiritName}${tb.deathYear ? ` (${tb.deathYear})` : ''}${tb.worshipperName ? ` — ${tb.worshipperName}` : ''}`}>
                            <button type="button" className="cer-slot is-taken" onClick={() => onOpen(tb.id)}>{tb.spiritName.split(' ').slice(-1)[0]}</button>
                          </Tooltip>
                        );
                      }
                      return canCreate ? (
                        <button type="button" key={`${r}-${s}`} className="cer-slot add-action" onClick={() => onAdd({ area: a.area, rowNo: r + 1, slotNo: s + 1 })} aria-label={`${a.area} · ${C.fields.rowNo} ${r + 1} · ${C.fields.slotNo} ${s + 1}`}>
                          <PlusOutlined />
                        </button>
                      ) : <span key={`${r}-${s}`} className="cer-slot is-empty" />;
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function TabletsTab({ C, t, canCreate, canWrite, canRemove, createSignal }) {
  const [view, setView] = useState('layout');
  const [rows, setRows] = useState([]);
  const [layout, setLayout] = useState({ areas: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('đang_thờ');
  const [modal, setModal] = useState({ open: false, record: null, preset: null });
  const [followers, setFollowers] = useState([]);
  const lastSignal = useRef(createSignal);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status !== 'all') params.status = status;
      if (search.trim()) params.search = search.trim();
      const [list, lay] = await Promise.all([api.get('/memorial-tablets', { params }), api.get('/memorial-tablets/layout')]);
      setRows(list.data);
      setLayout(lay.data);
    } catch {
      message.error(C.loadError);
    } finally {
      setLoading(false);
    }
  }, [search, status, C.loadError]);

  useEffect(() => { const id = setTimeout(load, search ? 300 : 0); return () => clearTimeout(id); }, [load]);
  useEffect(() => { fetchFollowersCached().then(setFollowers); }, []);
  useEffect(() => {
    if (createSignal === lastSignal.current) return;
    lastSignal.current = createSignal;
    if (canCreate) setModal({ open: true, record: null, preset: null });
  }, [canCreate, createSignal]);

  const areas = layout.areas.map(a => a.area);
  const openById = async (id) => {
    try {
      const { data } = await api.get(`/memorial-tablets/${id}`);
      setModal({ open: canWrite, record: data, preset: null });
      if (!canWrite) message.info(`${data.code} · ${data.spiritName}`);
    } catch { message.error(t.common.error); }
  };
  const remove = async (r) => {
    try {
      await api.delete(`/memorial-tablets/${r.id}`);
      message.success(C.tabletDeleted);
      load();
    } catch (e) {
      message.error(e.response?.data?.message || t.common.error);
    }
  };

  const columns = [
    {
      title: C.cols.spirit, key: 'spirit', width: 260,
      render: (_, r) => (
        <div className="person-cell">
          <Avatar size={38} className="person-cell__avatar" style={{ background: '#f1edfb', color: '#7a5fc0' }}>{r.spiritName.trim().split(/\s+/).pop()?.[0]?.toUpperCase()}</Avatar>
          <div className="person-cell__text">
            <div className="person-cell__name">{r.spiritName}</div>
            <div className="person-cell__sub">
              <span className="tbl-mono">{r.code}</span>
              {r.deathYear && <><span className="person-cell__sep">·</span><span>{C.diedYear} {r.deathYear}</span></>}
              {r.ageAtDeath && <><span className="person-cell__sep">·</span><span>{C.age} {r.ageAtDeath}</span></>}
            </div>
          </div>
        </div>
      ),
    },
    { title: C.cols.position, key: 'pos', width: 190, render: (_, r) => <span className="cer-pos"><strong>{r.area}</strong> · {C.fields.rowNo} {r.rowNo} · {C.fields.slotNo} {r.slotNo}</span> },
    { title: C.cols.deathLunar, key: 'dl', width: 120, render: (_, r) => (r.deathLunarDay && r.deathLunarMonth ? `${r.deathLunarDay}/${r.deathLunarMonth} ${C.lunarShort}` : <span className="tbl-muted">—</span>) },
    { title: C.cols.worshipper, key: 'w', width: 200, render: (_, r) => (r.worshipperName ? <span>{r.worshipperName}{r.worshipperPhone && <span className="tbl-muted"> · {r.worshipperPhone}</span>}</span> : <span className="tbl-muted">—</span>) },
    { title: C.cols.status, dataIndex: 'status', width: 140, render: (v) => <span className="tbl-pill" style={{ color: STATUS_TONE[v].c, background: STATUS_TONE[v].s }}><span className="tbl-pill__dot" />{C.statuses[v]}</span> },
    {
      title: '', key: 'actions', width: 96, align: 'right',
      render: (_, r) => (
        <div className="personnel-action-group">
          {canWrite && <Tooltip title={t.common.edit}><Button aria-label={t.common.edit} type="text" icon={<EditOutlined />} onClick={() => setModal({ open: true, record: r, preset: null })} /></Tooltip>}
          {canRemove && (
            <Popconfirm title={C.confirmDeleteTablet} onConfirm={() => remove(r)} okText={t.common.delete} cancelText={t.common.cancel} okButtonProps={{ danger: true }}>
              <Tooltip title={t.common.delete}><Button aria-label={t.common.delete} type="text" danger icon={<DeleteOutlined />} /></Tooltip>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <section className="cer-card cer-card--table">
      <div className="cer-toolbar">
        <Segmented value={view} onChange={setView} options={[
          { value: 'layout', label: <span className="cer-seg"><AppstoreOutlined />{C.layoutView}</span> },
          { value: 'list', label: <span className="cer-seg"><UnorderedListOutlined />{C.listView}</span> },
        ]} />
        <span className="cer-total">{layout.total} {C.activeTablets}</span>
        {view === 'list' && (
          <>
            <Input className="cer-search" prefix={<SearchOutlined style={{ color: '#bfae99' }} />} placeholder={C.tabletSearch} value={search} onChange={e => setSearch(e.target.value)} allowClear />
            <Select value={status} onChange={setStatus} style={{ width: 170 }} options={[{ value: 'all', label: C.all }, ...['đang_thờ', 'đã_thỉnh_về'].map(s => ({ value: s, label: C.statuses[s] }))]} />
          </>
        )}
      </div>

      {view === 'layout' ? (
        <LayoutView C={C} layout={layout} canCreate={canCreate} onAdd={(preset) => setModal({ open: true, record: null, preset })} onOpen={openById} />
      ) : (
        <Table
          dataSource={rows} columns={columns} rowKey="id" loading={loading} className="personnel-table" scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, showTotal: (n, range) => `${range[0]}-${range[1]} / ${n} ${C.tabletUnit}` }}
          locale={{ emptyText: <LotusEmpty description={search ? C.emptyFiltered : C.emptyTablets} hint={canCreate && !search ? C.emptyTabletsHint : ''} /> }}
        />
      )}

      <TabletModal
        C={C} t={t} open={modal.open && (modal.record ? canWrite : canCreate)} record={modal.record} preset={modal.preset} areas={areas} followers={followers}
        onClose={() => setModal({ open: false, record: null, preset: null })}
        onSaved={() => { setModal({ open: false, record: null, preset: null }); load(); }}
      />
    </section>
  );
}
