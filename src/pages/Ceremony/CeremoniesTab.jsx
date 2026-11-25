import React, { useEffect, useRef, useState } from 'react';
import {
  Button, Modal, Form, Input, InputNumber, Select, Switch, DatePicker, Dropdown, Tooltip, message, Segmented,
} from 'antd';
import {
  EditOutlined, DeleteOutlined, EllipsisOutlined, EnvironmentOutlined, LockOutlined, UnlockOutlined,
  TeamOutlined, ArrowRightOutlined, CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import LotusEmpty from '../../components/LotusEmpty/LotusEmpty';
import CountUp from '../../components/CountUp/CountUp';
import { KIND_TONE, lunarLabel, daysUntil } from './ceremonyShared';
import { compactVnd } from '../Finance/financeShared';
import { initializeForm, guardedClose } from '../../utils/formGuard';

const PRESETS = [
  { key: 'thuong_nguyen', name: 'Đại lễ Rằm tháng Giêng (Thượng Nguyên)', lunarDay: 15, lunarMonth: 1, ceremonyType: 'cả_hai' },
  { key: 'vu_lan', name: 'Đại lễ Vu Lan báo hiếu', lunarDay: 15, lunarMonth: 7, ceremonyType: 'cầu_siêu' },
  { key: 'ha_nguyen', name: 'Lễ Rằm tháng Mười (Hạ Nguyên)', lunarDay: 15, lunarMonth: 10, ceremonyType: 'cả_hai' },
];

function CeremonyModal({ C, t, open, record, funds, onClose, onSaved }) {
  const [form] = Form.useForm();
  const [preview, setPreview] = useState(null);
  const [previewErr, setPreviewErr] = useState(null);
  const [override, setOverride] = useState(false);
  const [saving, setSaving] = useState(false);
  const lunarDay = Form.useWatch('lunarDay', form);
  const lunarMonth = Form.useWatch('lunarMonth', form);
  const year = Form.useWatch('year', form);

  useEffect(() => {
    if (!open) return;
    if (record) {
      initializeForm(form, { ...record, solarDate: record.solarDate ? dayjs(record.solarDate) : null });
      setOverride(false);
    } else {
      form.resetFields();
      initializeForm(form, { year: dayjs().year(), ceremonyType: 'cả_hai', registrationOpen: true });
      setOverride(false);
    }
  }, [open, record]);

  // Live lunar → solar preview (same algorithm as the server)
  useEffect(() => {
    if (!open || !lunarDay || !lunarMonth || !year) { setPreview(null); return undefined; }
    const id = setTimeout(async () => {
      try {
        const { data } = await api.get('/ceremonies/solar-date', { params: { lunarDay, lunarMonth, year } });
        setPreview(data.solarDate);
        setPreviewErr(null);
        if (!override) form.setFieldsValue({ solarDate: dayjs(data.solarDate) });
      } catch (e) {
        setPreview(null);
        setPreviewErr(e.response?.data?.message || C.invalidLunar);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [open, lunarDay, lunarMonth, year, override]);

  const applyPreset = (p) => form.setFieldsValue({ name: p.name, lunarDay: p.lunarDay, lunarMonth: p.lunarMonth, ceremonyType: p.ceremonyType });

  const submit = async (values) => {
    setSaving(true);
    try {
      const payload = { ...values, solarDate: override && values.solarDate ? values.solarDate.format('YYYY-MM-DD') : undefined };
      if (record) await api.put(`/ceremonies/${record.id}`, payload);
      else await api.post('/ceremonies', payload);
      message.success(record ? C.updated : C.created);
      onSaved();
    } catch (e) {
      message.error(e.response?.data?.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open} onCancel={() => guardedClose(form, onClose, t)} maskClosable={false} onOk={() => form.submit()} confirmLoading={saving}
      okButtonProps={{ disabled: !!previewErr }}
      title={record ? C.editCeremony : C.addCeremony} okText={record ? t.common.update : t.common.add} cancelText={t.common.cancel}
      width={600} destroyOnClose
    >
      {!record && (
        <div className="cer-presets">
          <span>{C.presetsLabel}</span>
          {PRESETS.map(p => <button type="button" key={p.key} className="cer-chip" onClick={() => applyPreset(p)}>{p.name}</button>)}
        </div>
      )}
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item name="name" label={C.fields.name} rules={[{ required: true, message: C.fields.nameRequired }]}>
          <Input placeholder={C.fields.namePlaceholder} />
        </Form.Item>
        <Form.Item name="ceremonyType" label={C.fields.type}>
          <Segmented block options={['cả_hai', 'cầu_an', 'cầu_siêu'].map(k => ({ value: k, label: C.types[k] }))} />
        </Form.Item>
        <div className="cer-form-row">
          <Form.Item name="lunarDay" label={C.fields.lunarDay} rules={[{ required: true, message: C.fields.required }]}>
            <InputNumber min={1} max={30} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="lunarMonth" label={C.fields.lunarMonth} rules={[{ required: true, message: C.fields.required }]}>
            <InputNumber min={1} max={12} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="year" label={C.fields.year} rules={[{ required: true, message: C.fields.required }]}>
            <InputNumber min={2000} max={2100} style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <div className={`cer-solar${previewErr ? ' is-error' : ''}`}>
          <CalendarOutlined />
          {previewErr
            ? <span>{previewErr}</span>
            : preview
              ? <span>{lunarLabel(lunarDay, lunarMonth)} {year} → <b>{dayjs(preview).format('dddd, DD/MM/YYYY')}</b></span>
              : <span>{C.solarHint}</span>}
        </div>
        <div className="cer-override">
          <Switch size="small" checked={override} onChange={setOverride} /> <span>{C.overrideSolar}</span>
        </div>
        {override && (
          <Form.Item name="solarDate" label={C.fields.solarDate}>
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
        )}
        <Form.Item name="location" label={C.fields.location}><Input placeholder={C.fields.locationPlaceholder} /></Form.Item>
        {funds.length > 0 && (
          <Form.Item name="defaultFundId" label={C.fields.defaultFund} extra={C.fields.defaultFundHint}>
            <Select allowClear placeholder={C.fields.defaultFundPlaceholder} options={funds.map(f => ({ value: f.id, label: f.name }))} />
          </Form.Item>
        )}
        <Form.Item name="registrationOpen" label={C.fields.registrationOpen} valuePropName="checked"><Switch /></Form.Item>
        <Form.Item name="notes" label={t.common.notes} style={{ marginBottom: 0 }}><Input.TextArea rows={2} /></Form.Item>
      </Form>
    </Modal>
  );
}

export default function CeremoniesTab({ C, t, lang, ceremonies, funds, canWrite, canCreate, canRemove, createSignal, onChanged, onOpenRegistrations }) {
  const [modal, setModal] = useState({ open: false, record: null });
  const firstSignal = useRef(createSignal);
  useEffect(() => {
    if (canCreate && createSignal !== firstSignal.current) setModal({ open: true, record: null });
    firstSignal.current = createSignal;
  }, [canCreate, createSignal]);

  const toggleOpen = async (c) => {
    try {
      await api.patch(`/ceremonies/${c.id}/registration`, { open: !c.registrationOpen });
      message.success(!c.registrationOpen ? C.openedMsg : C.closedMsg);
      onChanged();
    } catch (e) {
      message.error(e.response?.data?.message || t.common.error);
    }
  };

  const remove = (c) => Modal.confirm({
    title: C.confirmDeleteCeremony, content: c.name, okText: t.common.delete, cancelText: t.common.cancel,
    okButtonProps: { danger: true },
    onOk: async () => {
      try {
        await api.delete(`/ceremonies/${c.id}`);
        message.success(C.deleted);
        onChanged();
      } catch (e) {
        message.error(e.response?.data?.message || t.common.error);
      }
    },
  });

  // The modal must render in the empty state too, otherwise "Thêm đàn lễ" does nothing on a fresh install.
  const modalEl = (
    <CeremonyModal
      C={C} t={t} open={modal.open && (modal.record ? canWrite : canCreate)} record={modal.record} funds={funds}
      onClose={() => setModal({ open: false, record: null })}
      onSaved={() => { setModal({ open: false, record: null }); onChanged(); }}
    />
  );

  if (!ceremonies.length) {
    return (
      <>
        <section className="cer-card">
          <LotusEmpty description={C.emptyCeremonies} hint={canCreate ? C.emptyCeremoniesHint : ''} />
        </section>
        {modalEl}
      </>
    );
  }

  return (
    <>
      <div className="cer-grid">
        {ceremonies.map(c => {
          const tone = KIND_TONE[c.ceremonyType] || KIND_TONE['cả_hai'];
          const left = daysUntil(c.solarDate);
          const s = c.stats || {};
          const menu = {
            items: [
              { key: 'edit', icon: <EditOutlined />, label: t.common.edit },
              { key: 'toggle', icon: c.registrationOpen ? <LockOutlined /> : <UnlockOutlined />, label: c.registrationOpen ? C.closeRegistration : C.openRegistration },
              ...(canRemove ? [{ type: 'divider' }, { key: 'delete', icon: <DeleteOutlined />, label: t.common.delete, danger: true }] : []),
            ],
            onClick: ({ key }) => {
              if (key === 'edit') setModal({ open: true, record: c });
              if (key === 'toggle') toggleOpen(c);
              if (key === 'delete') remove(c);
            },
          };
          return (
            <article key={c.id} className={`cer-card cer-ceremony${left !== null && left < 0 ? ' is-past' : ''}`} style={{ '--tone': tone.c, '--tone-soft': tone.s }}>
              <div className="cer-ceremony__top">
                <div className="cer-date-tile">
                  <span>{c.solarDate ? dayjs(c.solarDate).format('MM/YYYY') : '—'}</span>
                  <strong>{c.solarDate ? dayjs(c.solarDate).format('DD') : '—'}</strong>
                </div>
                <div className="cer-ceremony__titles">
                  <h3>{c.name}</h3>
                  <div className="cer-ceremony__lunar">{lunarLabel(c.lunarDay, c.lunarMonth, lang)} · {c.lunarDay}/{c.lunarMonth} {C.lunarShort} {c.year}</div>
                </div>
                {canWrite && (
                  <Dropdown menu={menu} trigger={['click']} placement="bottomRight">
                    <Button type="text" className="cer-more" icon={<EllipsisOutlined style={{ fontSize: 18 }} />} />
                  </Dropdown>
                )}
              </div>

              <div className="cer-ceremony__tags">
                <span className="tbl-pill" style={{ color: tone.c, background: tone.s }}>{C.types[c.ceremonyType]}</span>
                <span className={`tbl-pill cer-state${c.registrationOpen ? ' is-open' : ''}`}>
                  {c.registrationOpen ? <UnlockOutlined /> : <LockOutlined />}{c.registrationOpen ? C.open : C.closed}
                </span>
                {left !== null && (
                  <span className={`cer-countdown${left === 0 ? ' is-today' : left < 0 ? ' is-past' : ''}`}>
                    {left === 0 ? C.today : left > 0 ? C.inDays.replace('{n}', left) : C.passed}
                  </span>
                )}
              </div>
              {c.location && <div className="cer-ceremony__loc"><EnvironmentOutlined /> {c.location}</div>}

              <div className="cer-ceremony__stats">
                <div><strong><CountUp value={s.names?.['cầu_an'] || 0} /></strong><span>{C.namesAn}</span></div>
                <div><strong><CountUp value={s.names?.['cầu_siêu'] || 0} /></strong><span>{C.namesSieu}</span></div>
                <div><strong>{compactVnd(s.offering || 0, lang)}</strong><span>{C.offering}</span></div>
              </div>

              <button type="button" className="cer-ceremony__cta" onClick={() => onOpenRegistrations(c.id)}>
                <TeamOutlined /> {C.viewRegistrations.replace('{n}', (s.registrations?.['cầu_an'] || 0) + (s.registrations?.['cầu_siêu'] || 0))}
                <ArrowRightOutlined className="cer-arrow" />
              </button>
            </article>
          );
        })}
      </div>
      {modalEl}
    </>
  );
}
