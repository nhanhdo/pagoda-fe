import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, Select, Segmented, Tooltip, Popconfirm, message, Avatar,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, PrinterOutlined, SearchOutlined, MinusCircleOutlined,
  FileTextOutlined, UserOutlined, LockOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import LotusEmpty from '../../components/LotusEmpty/LotusEmpty';
import { printReceipt, printSoList } from '../../utils/printDocs';
import { KIND_TONE, lunarLabel, displayName, QUICK_OFFERINGS, emptyEntry, daysUntil, fetchFollowersCached, slotLabel, entryHasData } from './ceremonyShared';
import { initializeForm, guardedClose } from '../../utils/formGuard';
import { vnd, compactVnd, softOf } from '../Finance/financeShared';

const METHODS = ['tiền_mặt', 'chuyển_khoản', 'khác'];

function RegistrationModal({ C, t, lang, open, record, ceremony, funds, followers, tablets, canRemove, onClose, onSaved }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const kind = Form.useWatch('kind', form);
  const allowedKinds = ceremony?.ceremonyType === 'cả_hai' ? ['cầu_an', 'cầu_siêu'] : [ceremony?.ceremonyType].filter(Boolean);

  useEffect(() => {
    if (!open) return;
    if (record) {
      initializeForm(form, {
        ...record,
        offeringAmount: Number(record.offeringAmount) || 0,
        entries: (record.entries || []).map(e => ({ ...e })),
      });
    } else {
      const k = allowedKinds[0] || 'cầu_an';
      form.resetFields();
      initializeForm(form, { kind: k, paymentMethod: 'tiền_mặt', offeringAmount: 0, fundId: ceremony?.defaultFundId || undefined, entries: [emptyEntry(k)] });
    }
  }, [open, record]);

  const applyKind = (k) => {
    const entries = (form.getFieldValue('entries') || []).map(e => ({ ...emptyEntry(k), fullName: e.fullName }));
    form.setFieldsValue({ kind: k, entries: entries.length ? entries : [emptyEntry(k)] });
  };
  const onKindChange = (k) => {
    const prev = kind;
    const hasData = (form.getFieldValue('entries') || []).some(entryHasData);
    if (!hasData) { applyKind(k); return; }
    form.setFieldsValue({ kind: prev });
    Modal.confirm({
      title: C.switchKindTitle,
      content: C.switchKindBody,
      okText: C.switchKindOk,
      cancelText: t.common.cancel,
      onOk: () => applyKind(k),
    });
  };
  // Non-admin/trụ trì may not lower an offering that already has a receipt (server enforces too)
  const prevOffering = Number(record?.offeringAmount) || 0;
  const lockLower = !!record?.donation && !canRemove;

  const onPickFollower = (id) => {
    const f = followers.find(x => x.id === id);
    if (f) form.setFieldsValue({ registrantName: displayName(f), registrantPhone: f.phone || form.getFieldValue('registrantPhone'), registrantAddress: f.address || form.getFieldValue('registrantAddress') });
  };

  const onPickTablet = (index, id) => {
    const tb = tablets.find(x => x.id === id);
    if (!tb) return;
    const entries = [...form.getFieldValue('entries')];
    entries[index] = {
      ...entries[index], memorialTabletId: id, fullName: entries[index].fullName || tb.spiritName,
      deathYear: entries[index].deathYear || tb.deathYear, deathLunarDay: entries[index].deathLunarDay || tb.deathLunarDay,
      deathLunarMonth: entries[index].deathLunarMonth || tb.deathLunarMonth, ageAtDeath: entries[index].ageAtDeath || tb.ageAtDeath,
    };
    form.setFieldsValue({ entries });
  };

  const submit = async (values) => {
    setSaving(true);
    try {
      const payload = { ...values, ceremonyId: ceremony.id, buddhistFollowerId: values.buddhistFollowerId || null };
      if (record) await api.put(`/registrations/${record.id}`, payload);
      else await api.post('/registrations', payload);
      message.success(record ? C.regUpdated : C.regCreated);
      onSaved();
    } catch (e) {
      message.error(e.response?.data?.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open} onCancel={() => guardedClose(form, onClose, t)} maskClosable={false} onOk={() => form.submit()} confirmLoading={saving} width={760} destroyOnClose
      title={<span>{record ? C.editRegistration : C.addRegistration}<span className="cer-modal-sub"> · {ceremony?.name}</span></span>}
      okText={record ? t.common.update : t.common.add} cancelText={t.common.cancel}
    >
      <Form form={form} layout="vertical" onFinish={submit} className="cer-reg-form">
        <Form.Item name="kind" label={C.fields.kind}>
          <Segmented block onChange={onKindChange} options={allowedKinds.map(k => ({ value: k, label: C.types[k] }))} />
        </Form.Item>

        <div className="cer-section">{C.registrantSection}</div>
        <Form.Item name="buddhistFollowerId" label={C.fields.follower} extra={C.fields.followerHint}>
          <Select
            allowClear showSearch placeholder={C.fields.followerPlaceholder} onChange={onPickFollower}
            filterOption={(input, opt) => String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={[
              // A follower who has since left the active list still shows by name when editing
              ...(record?.buddhistFollowerId && !followers.some(f => f.id === record.buddhistFollowerId)
                ? [{ value: record.buddhistFollowerId, label: record.registrantName || `#${record.buddhistFollowerId}` }] : []),
              ...followers.map(f => ({ value: f.id, label: displayName(f) })),
            ]}
          />
        </Form.Item>
        <div className="cer-form-row">
          <Form.Item name="registrantName" label={C.fields.registrantName} rules={[{ required: true, message: C.fields.registrantRequired }]} style={{ flex: 2 }}>
            <Input />
          </Form.Item>
          <Form.Item name="registrantPhone" label={C.fields.phone} style={{ flex: 1 }}><Input /></Form.Item>
        </div>
        <Form.Item name="registrantAddress" label={C.fields.address}><Input /></Form.Item>

        <div className="cer-section">{kind === 'cầu_siêu' ? C.spiritsSection : C.peopleSection}</div>
        <Form.List name="entries">
          {(fields, { add, remove }) => (
            <div className="cer-entries">
              {fields.map(({ key, name }, index) => (
                <div key={key} className="cer-entry">
                  <span className="cer-entry__idx">{index + 1}</span>
                  <div className="cer-entry__fields">
                    <Form.Item name={[name, 'fullName']} rules={[{ required: true, message: C.fields.nameRequired }]} className="cer-entry__name">
                      <Input placeholder={kind === 'cầu_siêu' ? C.fields.spiritName : C.fields.personName} />
                    </Form.Item>
                    {kind === 'cầu_siêu' ? (
                      <>
                        <Form.Item name={[name, 'deathYear']}><InputNumber placeholder={C.fields.deathYear} min={1850} max={dayjs().year()} style={{ width: '100%' }} /></Form.Item>
                        <Form.Item name={[name, 'deathLunarDay']}><InputNumber placeholder={C.fields.deathLunarDay} min={1} max={30} style={{ width: '100%' }} /></Form.Item>
                        <Form.Item name={[name, 'deathLunarMonth']}><InputNumber placeholder={C.fields.deathLunarMonth} min={1} max={12} style={{ width: '100%' }} /></Form.Item>
                        <Form.Item name={[name, 'ageAtDeath']}><InputNumber placeholder={C.fields.ageAtDeath} min={0} max={130} style={{ width: '100%' }} /></Form.Item>
                        {tablets.length > 0 && (
                          <Form.Item name={[name, 'memorialTabletId']} className="cer-entry__wide">
                            <Select
                              allowClear showSearch placeholder={C.fields.linkTablet} onChange={(id) => onPickTablet(index, id)}
                              filterOption={(input, opt) => String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                              options={tablets.map(tb => ({ value: tb.id, label: `${tb.code} · ${tb.spiritName} · ${slotLabel(tb, C)}` }))}
                            />
                          </Form.Item>
                        )}
                      </>
                    ) : (
                      <>
                        <Form.Item name={[name, 'birthYear']}><InputNumber placeholder={C.fields.birthYear} min={1850} max={dayjs().year()} style={{ width: '100%' }} /></Form.Item>
                        <Form.Item name={[name, 'address']} className="cer-entry__wide"><Input placeholder={C.fields.address} /></Form.Item>
                      </>
                    )}
                  </div>
                  <Button type="text" danger icon={<MinusCircleOutlined />} disabled={fields.length <= 1} onClick={() => remove(name)} aria-label={t.common.delete} />
                </div>
              ))}
              <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add(emptyEntry(kind))}>{kind === 'cầu_siêu' ? C.addSpirit : C.addPerson}</Button>
            </div>
          )}
        </Form.List>

        <div className="cer-section">{C.offeringSection}</div>
        <Form.Item
          name="offeringAmount" label={C.fields.offeringAmount}
          extra={lockLower ? C.lowerLockedHint.replace('{amount}', vnd(prevOffering)) : C.fields.offeringHint}
          style={{ marginBottom: 8 }}
          rules={lockLower ? [{ validator: (_, v) => (Number(v || 0) < prevOffering ? Promise.reject(new Error(C.lowerLocked)) : Promise.resolve()) }] : []}
        >
          <InputNumber
            min={lockLower ? prevOffering : 0} step={50000} style={{ width: '100%' }} addonAfter="₫"
            formatter={(v) => (v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
            parser={(v) => (v ? v.replace(/\./g, '') : '')}
          />
        </Form.Item>
        <div className="cer-quick">
          {QUICK_OFFERINGS.map(a => (
            <button key={a} type="button" className="cer-chip" onClick={() => form.setFieldsValue({ offeringAmount: a })}>{compactVnd(a, lang)}</button>
          ))}
        </div>
        <div className="cer-form-row">
          {funds.length > 0 && (
            <Form.Item name="fundId" label={C.fields.fund} style={{ flex: 1 }}>
              <Select options={funds.map(f => ({ value: f.id, label: f.name }))} placeholder={C.fields.fundDefault} allowClear />
            </Form.Item>
          )}
          <Form.Item name="paymentMethod" label={C.fields.method} style={{ flex: 1 }}>
            <Select options={METHODS.map(m => ({ value: m, label: t.donation?.methods?.[m] || m }))} />
          </Form.Item>
        </div>
        <Form.Item name="notes" label={t.common.notes} style={{ marginBottom: 0 }}><Input.TextArea rows={2} /></Form.Item>
      </Form>
    </Modal>
  );
}

export default function RegistrationsTab({ C, t, lang, ceremonies, funds, selectedId, setSelectedId, canWrite, canRemove, isAdmin, createSignal, onChanged }) {
  const ceremony = ceremonies.find(c => c.id === selectedId) || null;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [kindFilter, setKindFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, record: null });
  const [followers, setFollowers] = useState([]);
  const [tablets, setTablets] = useState([]);
  const firstSignal = useRef(createSignal);

  const load = useCallback(async () => {
    if (!selectedId) { setRows([]); return; }
    setLoading(true);
    try {
      const params = {};
      if (kindFilter !== 'all') params.kind = kindFilter;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get(`/ceremonies/${selectedId}/registrations`, { params });
      setRows(data);
    } catch {
      message.error(C.loadError);
    } finally {
      setLoading(false);
    }
  }, [selectedId, kindFilter, search, C.loadError]);

  useEffect(() => { const id = setTimeout(load, search ? 300 : 0); return () => clearTimeout(id); }, [load]);
  useEffect(() => {
    fetchFollowersCached().then(setFollowers);
    api.get('/memorial-tablets', { params: { status: 'đang_thờ' } }).then(r => setTablets(r.data || [])).catch(() => {});
  }, []);
  useEffect(() => {
    if (createSignal === firstSignal.current || !ceremony) return;
    if (!ceremony.registrationOpen && !isAdmin) { message.warning(C.closedForRegistration); return; }
    setModal({ open: true, record: null });
  }, [createSignal]);

  const remove = async (r) => {
    try {
      await api.delete(`/registrations/${r.id}`);
      message.success(C.regDeleted);
      load(); onChanged();
    } catch (e) {
      message.error(e.response?.data?.message || t.common.error);
    }
  };

  const printList = async (kind) => {
    try {
      const { data } = await api.get(`/ceremonies/${ceremony.id}/print-list`, { params: { kind } });
      printSoList(data.ceremony, data.registrations, kind);
    } catch (e) {
      message.error(e.response?.data?.message || t.common.error);
    }
  };

  const printRegReceipt = (r) => {
    if (!r.donation) return;
    printReceipt({ ...r.donation, fund: r.fund, buddhistFollower: r.buddhistFollower, donorName: r.donation.donorName || r.registrantName });
  };

  if (!ceremonies.length) {
    return <section className="cer-card"><LotusEmpty description={C.emptyCeremonies} hint={C.needCeremonyFirst} /></section>;
  }

  const allowed = ceremony?.ceremonyType === 'cả_hai' ? ['cầu_an', 'cầu_siêu'] : [ceremony?.ceremonyType].filter(Boolean);
  const left = daysUntil(ceremony?.solarDate);

  const columns = [
    {
      title: C.cols.registrant, key: 'registrant', width: 260,
      render: (_, r) => {
        const tone = KIND_TONE[r.kind];
        return (
          <div className="person-cell">
            <Avatar size={38} className="person-cell__avatar" style={{ background: tone.s, color: tone.c }} icon={<UserOutlined />} />
            <div className="person-cell__text">
              <div className="person-cell__name">{r.registrantName}</div>
              <div className="person-cell__sub"><span className="tbl-mono">{r.code}</span>{r.registrantPhone && <><span className="person-cell__sep">·</span><span>{r.registrantPhone}</span></>}</div>
            </div>
          </div>
        );
      },
    },
    { title: C.cols.kind, dataIndex: 'kind', width: 120, render: (v) => <span className="tbl-pill" style={{ color: KIND_TONE[v].c, background: KIND_TONE[v].s }}>{C.types[v]}</span> },
    {
      title: C.cols.names, key: 'names', width: 300,
      render: (_, r) => {
        const names = (r.entries || []).map(e => e.fullName);
        return (
          <Tooltip title={names.join(', ')}>
            <span className="cer-names">
              <strong>{names.length}</strong> {r.kind === 'cầu_siêu' ? C.spiritUnit : C.personUnit}
              <span className="cer-names__list">{names.slice(0, 2).join(', ')}{names.length > 2 ? '…' : ''}</span>
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: C.cols.offering, key: 'offering', width: 190, align: 'right',
      render: (_, r) => (Number(r.offeringAmount) > 0 ? (
        <div className="cer-offer">
          <span className="tbl-mono cer-offer__amount">{vnd(r.offeringAmount)}</span>
          {r.fund && <span className="tbl-pill tbl-pill--wrap" style={{ color: r.fund.color, background: softOf(r.fund.color) }}>{r.fund.name}</span>}
        </div>
      ) : <span className="tbl-muted">—</span>),
    },
    {
      title: '', key: 'actions', width: 130, align: 'right',
      render: (_, r) => (
        <div className="personnel-action-group" onClick={(e) => e.stopPropagation()}>
          {r.donation && <Tooltip title={C.printReceipt}><Button aria-label={C.printReceipt} type="text" icon={<PrinterOutlined />} onClick={() => printRegReceipt(r)} /></Tooltip>}
          {canWrite && <Tooltip title={t.common.edit}><Button aria-label={t.common.edit} type="text" icon={<EditOutlined />} onClick={() => setModal({ open: true, record: r })} /></Tooltip>}
          {canWrite && (!r.donation || canRemove) && (
            <Popconfirm title={C.confirmDeleteReg} description={r.donation ? C.deleteRegNote : undefined} onConfirm={() => remove(r)} okText={t.common.delete} cancelText={t.common.cancel} okButtonProps={{ danger: true }}>
              <Tooltip title={t.common.delete}><Button aria-label={t.common.delete} type="text" danger icon={<DeleteOutlined />} /></Tooltip>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <section className="cer-card cer-card--table">
      <div className="cer-reg-head">
        <Select
          className="cer-ceremony-pick" value={selectedId} onChange={setSelectedId}
          options={ceremonies.map(c => ({ value: c.id, label: `${c.name} · ${c.solarDate ? dayjs(c.solarDate).format('DD/MM/YYYY') : ''}` }))}
        />
        {ceremony && (
          <div className="cer-reg-meta">
            <span>{lunarLabel(ceremony.lunarDay, ceremony.lunarMonth, lang)} {ceremony.year}</span>
            {left !== null && <span className={`cer-countdown${left === 0 ? ' is-today' : left < 0 ? ' is-past' : ''}`}>{left === 0 ? C.today : left > 0 ? C.inDays.replace('{n}', left) : C.passed}</span>}
            {!ceremony.registrationOpen && <span className="tbl-pill cer-state"><LockOutlined />{C.closed}</span>}
          </div>
        )}
        <div className="cer-print">
          {allowed.includes('cầu_an') && <Button icon={<FileTextOutlined />} aria-describedby="so-print-hint" onClick={() => printList('cầu_an')}>{C.printAn}</Button>}
          {allowed.includes('cầu_siêu') && <Button icon={<FileTextOutlined />} aria-describedby="so-print-hint" onClick={() => printList('cầu_siêu')}>{C.printSieu}</Button>}
        </div>
        {allowed.length > 0 && <p id="so-print-hint" className="cer-print-hint">{C.printListHint}</p>}
      </div>

      <div className="cer-toolbar">
        <Input className="cer-search" prefix={<SearchOutlined style={{ color: '#bfae99' }} />} placeholder={C.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} allowClear />
        {allowed.length > 1 && (
          <Segmented value={kindFilter} onChange={setKindFilter} options={[{ value: 'all', label: C.all }, ...allowed.map(k => ({ value: k, label: C.types[k] }))]} />
        )}
      </div>

      <Table
        dataSource={rows} columns={columns} rowKey="id" loading={loading} className="personnel-table"
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 10, showTotal: (n, range) => `${range[0]}-${range[1]} / ${n} ${C.regUnit}` }}
        expandable={{
          expandRowByClick: true,
          expandedRowRender: (r) => (
            <ol className="cer-entry-list">
              {(r.entries || []).map(e => (
                <li key={e.id}>
                  <strong>{r.kind === 'cầu_siêu' ? `${C.spiritPrefix} ${e.fullName}` : e.fullName}</strong>
                  {r.kind === 'cầu_siêu' ? (
                    <span>
                      {e.deathYear != null && ` · ${C.diedYear} ${e.deathYear}`}
                      {e.deathLunarDay != null && e.deathLunarMonth != null && ` · ${e.deathLunarDay}/${e.deathLunarMonth} ${C.lunarShort}`}
                      {e.ageAtDeath != null && ` · ${C.age} ${e.ageAtDeath}`}
                      {e.tablet && <span className="cer-tablet-ref"> · {e.tablet.code} ({slotLabel(e.tablet, C)})</span>}
                    </span>
                  ) : (
                    <span>{e.birthYear != null && ` · ${C.bornYear} ${e.birthYear}`}{e.address ? ` · ${e.address}` : ''}</span>
                  )}
                </li>
              ))}
              {r.registrantAddress && <li className="cer-entry-list__addr">{C.fields.address}: {r.registrantAddress}</li>}
            </ol>
          ),
        }}
        locale={{ emptyText: <LotusEmpty description={search || kindFilter !== 'all' ? C.emptyFiltered : C.emptyRegistrations} hint={canWrite && !search ? C.emptyRegistrationsHint : ''} /> }}
      />

      <RegistrationModal
        C={C} t={t} lang={lang} open={modal.open} record={modal.record} ceremony={ceremony}
        funds={funds} followers={followers} tablets={tablets} canRemove={canRemove}
        onClose={() => setModal({ open: false, record: null })}
        onSaved={() => { setModal({ open: false, record: null }); load(); onChanged(); }}
      />
    </section>
  );
}
