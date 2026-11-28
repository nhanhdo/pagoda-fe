import React, { useState } from 'react';
import { Button, Form, Input, InputNumber, Switch, Popconfirm, Tooltip, message } from 'antd';
import FormDialog from '../../components/FormDialog/FormDialog';
import { PlusOutlined, EditOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../../api/axios';
import { useLanguage } from '../../i18n/LanguageContext';
import { guardedClose, initializeForm } from '../../utils/formGuard';
import { vnd, compactVnd, softOf } from './financeShared';

const SWATCHES = ['#c47f36', '#4d8fc7', '#d9646c', '#4f9a72', '#8b6fc9', '#3a9483', '#d39a2c', '#b8893a'];

export default function FundsTab({ F, funds, onChanged }) {
  const { t, lang } = useLanguage();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const open = (fund = null) => {
    setEditing(fund || 'new');
    form.resetFields();
    initializeForm(form, fund
      ? { ...fund, targetAmount: fund.targetAmount ? Number(fund.targetAmount) : null }
      : { color: SWATCHES[(funds.length) % SWATCHES.length], isActive: true });
  };

  const save = async (values) => {
    setSaving(true);
    try {
      const payload = { ...values, targetAmount: values.targetAmount || null };
      if (editing !== 'new') await api.put(`/funds/${editing.id}`, payload);
      else await api.post('/funds', { ...payload, sortOrder: funds.length + 1 });
      message.success(F.fundSaved);
      setEditing(null);
      onChanged();
    } catch (e) {
      message.error(e.response?.data?.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (f) => {
    try {
      await api.put(`/funds/${f.id}`, { isActive: !f.isActive });
      onChanged();
    } catch (e) {
      message.error(e.response?.data?.message || t.common.error);
    }
  };

  const remove = async (f) => {
    try {
      await api.delete(`/funds/${f.id}`);
      message.success(t.finance.deleted);
      onChanged();
    } catch (e) {
      message.error(e.response?.data?.message || t.common.error);
    }
  };

  return (
    <section className="fin-card section-anim section-d2">
      <header className="fin-card__head">
        {F.fundsTitle}
        <Button className="add-action" type="primary" icon={<PlusOutlined />} onClick={() => open()} style={{ marginLeft: 'auto' }}>{F.addFund}</Button>
      </header>
      <ul className="fin-fundlist">
        {funds.map(f => {
          const color = f.color || '#c47f36';
          const isDefault = f.code === 'QUY_CHUNG';
          const used = (f.donationCount || 0) + (f.expenseCount || 0) + (f.pendingCount || 0);
          return (
            <li key={f.id} className={`fin-fundrow${f.isActive === false ? ' is-off' : ''}`} style={{ '--fund': color, '--fund-soft': softOf(color) }}>
              <span className="fin-fundrow__swatch" />
              <div className="fin-fundrow__info">
                <div className="fin-fundrow__name">
                  {f.name}
                  <span className="tbl-mono fin-fundrow__code">{f.code}</span>
                  {f.isActive === false && <span className="fin-fundrow__off">{F.inactive}</span>}
                </div>
                {f.description && <div className="fin-fundrow__desc">{f.description}</div>}
                <div className="fin-fundrow__meta">
                  <span>{F.balance}: <strong className={(f.balance || 0) < 0 ? 'fin-out' : ''}>{compactVnd(f.balance, lang)}</strong></span>
                  <span>{F.donationsCount.replace('{n}', f.donationCount || 0)}</span>
                  <span>{F.expensesCount.replace('{n}', f.expenseCount || 0)}</span>
                  {Number(f.targetAmount) > 0 && <span>{F.target}: {vnd(f.targetAmount)}</span>}
                </div>
              </div>
              <div className="personnel-action-group">
                <Tooltip title={t.common.edit}><Button aria-label={t.common.edit} type="text" icon={<EditOutlined />} onClick={() => open(f)} /></Tooltip>
                {!isDefault && (
                  <Tooltip title={f.isActive === false ? F.activate : F.deactivate}>
                    <Button aria-label={f.isActive === false ? F.activate : F.deactivate} type="text" icon={f.isActive === false ? <CheckCircleOutlined /> : <StopOutlined />} onClick={() => toggle(f)} />
                  </Tooltip>
                )}
                {!isDefault && !used && (
                  <Popconfirm title={F.deleteFundConfirm} okText={t.common.delete} cancelText={t.common.cancel} okButtonProps={{ danger: true }} onConfirm={() => remove(f)}>
                    <Tooltip title={t.common.delete}><Button aria-label={t.common.delete} type="text" danger icon={<DeleteOutlined />} /></Tooltip>
                  </Popconfirm>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <FormDialog
        open={!!editing}
        title={editing && editing !== 'new' ? F.editFund : F.addFund}
        onCancel={() => guardedClose(form, () => setEditing(null), t)}
        onOk={() => form.submit()}
        maskClosable={false}
        isAdding={editing === 'new'}
        okText={editing && editing !== 'new' ? t.common.update : t.common.add}
        cancelText={t.common.cancel}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="name" label={F.fieldName} rules={[{ required: true, whitespace: true, message: F.nameRequired }]}><Input /></Form.Item>
          <Form.Item name="description" label={F.fieldFundDescription}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="targetAmount" label={F.fieldTarget}>
            <InputNumber min={0} step={1000000} style={{ width: '100%' }} addonAfter="₫"
              formatter={(v) => (v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
              parser={(v) => (v ? v.replace(/\./g, '') : '')} />
          </Form.Item>
          <Form.Item name="color" label={F.fieldColor}>
            <ColorSwatches />
          </Form.Item>
          {!(editing && editing !== 'new' && editing.code === 'QUY_CHUNG') && (
            <Form.Item name="isActive" label={F.fieldActive} valuePropName="checked"><Switch /></Form.Item>
          )}
        </Form>
      </FormDialog>
    </section>
  );
}

function ColorSwatches({ value, onChange }) {
  return (
    <div className="fin-swatches">
      {SWATCHES.map(c => (
        <button
          key={c}
          type="button"
          className={`fin-swatch${value === c ? ' is-active' : ''}`}
          style={{ background: c }}
          onClick={() => onChange?.(c)}
          aria-label={c}
        />
      ))}
    </div>
  );
}
