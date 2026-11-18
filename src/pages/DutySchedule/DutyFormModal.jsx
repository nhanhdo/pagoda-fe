import React, { useEffect, useRef, useState } from 'react';
import {
  Modal, Form, Select, DatePicker, TimePicker, Input, Row, Col, Segmented, message,
} from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { guardedClose, rules as makeRules } from '../../utils/formGuard';
import { HiddenSubmit } from '../Personnel/PersonnelForm';
import { personOptionLabel } from '../Personnel/personnelShared';
import { DUTY_TYPES, DUTY_STATUSES, SHIFT_HOURS } from './useDutySchedulePage';
import { SHIFT_ORDER } from './DutyCalendar';
import '../Personnel/peopleShared.css';

const TIME_FMT = 'HH:mm';
const toTime = (s) => {
  if (!s || !/^\d{1,2}:\d{2}$/.test(s)) return null;
  const [h, m] = s.split(':').map(Number);
  return dayjs().hour(h).minute(m).second(0).millisecond(0);
};
const overlaps = (a, b) => a === b || a === 'cả_ngày' || b === 'cả_ngày';

/**
 * Add / edit a duty. `record` = existing duty (edit) or null; `defaultDate` prefills the day (calendar click).
 */
export default function DutyFormModal({ open, record, defaultDate, personnel, t, onClose, onSaved }) {
  const D = t.dutySchedule;
  const R = makeRules(t);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const personnelId = Form.useWatch('personnelId', form);
  const dutyDate = Form.useWatch('dutyDate', form);
  const shift = Form.useWatch('shift', form);
  const lastShift = useRef(null);
  // Keep the current person selectable even if they are no longer active
  const people = record?.personnel && !personnel.some(p => p.id === record.personnel.id)
    ? [record.personnel, ...personnel] : personnel;

  useEffect(() => {
    if (!open) return;
    setConflicts([]);
    if (record) {
      form.setFieldsValue({
        ...record,
        dutyDate: dayjs(record.dutyDate),
        startTime: toTime(record.startTime),
        endTime: toTime(record.endTime),
      });
      lastShift.current = record.shift;
    } else {
      form.resetFields();
      form.setFieldsValue({ dutyDate: defaultDate || dayjs(), status: 'chờ', shift: 'sáng' });
      lastShift.current = null;
    }
  }, [open, record, defaultDate, form]);

  // Prefill hours from the shift, unless the user already typed custom times
  useEffect(() => {
    if (!open || !shift || shift === lastShift.current) return;
    const prev = lastShift.current ? SHIFT_HOURS[lastShift.current] : null;
    const cur = form.getFieldsValue(['startTime', 'endTime']);
    const curStart = cur.startTime?.format?.(TIME_FMT);
    const curEnd = cur.endTime?.format?.(TIME_FMT);
    const untouched = (!curStart && !curEnd) || (prev && curStart === prev[0] && curEnd === prev[1]);
    if (untouched && SHIFT_HOURS[shift]) {
      form.setFieldsValue({ startTime: toTime(SHIFT_HOURS[shift][0]), endTime: toTime(SHIFT_HOURS[shift][1]) });
      form.validateFields(['endTime']).catch(() => {});
    }
    lastShift.current = shift;
  }, [open, shift, form]);

  // Double-booking check: same person, same day, overlapping shift
  useEffect(() => {
    if (!open || !personnelId || !dutyDate || !shift) { setConflicts([]); return undefined; }
    let cancelled = false;
    const day = dutyDate.format('YYYY-MM-DD');
    const id = setTimeout(async () => {
      try {
        const { data } = await api.get('/duty-schedules', { params: { personnelId, startDate: day, endDate: day } });
        if (cancelled) return;
        setConflicts((data || []).filter(d =>
          d.id !== record?.id
          && Number(d.personnelId ?? d.personnel?.id) === Number(personnelId)
          && dayjs(d.dutyDate).isSame(dutyDate, 'day')
          && overlaps(d.shift, shift)));
      } catch {
        if (!cancelled) setConflicts([]);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(id); };
  }, [open, personnelId, dutyDate, shift, record]);

  const submit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        dutyDate: values.dutyDate.format('YYYY-MM-DD'),
        startTime: values.startTime ? values.startTime.format(TIME_FMT) : null,
        endTime: values.endTime ? values.endTime.format(TIME_FMT) : null,
      };
      if (record) await api.put(`/duty-schedules/${record.id}`, payload);
      else await api.post('/duty-schedules', payload);
      message.success(record ? D.updateSuccess : D.addSuccess);
      onSaved();
    } catch (e) {
      message.error(e.response?.data?.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const endAfterStart = ({ getFieldValue }) => ({
    validator: (_, v) => {
      const s = getFieldValue('startTime');
      return v && s && v.format(TIME_FMT) <= s.format(TIME_FMT)
        ? Promise.reject(new Error(D.endAfterStart)) : Promise.resolve();
    },
  });

  return (
    <Modal
      title={record ? D.editTitle : D.addTitle}
      open={open}
      onCancel={() => guardedClose(form, onClose, t)}
      onOk={() => form.submit()}
      okText={record ? t.common.update : t.common.add}
      cancelText={t.common.cancel}
      confirmLoading={saving}
      maskClosable={false}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={submit} className="pp-form">
        <HiddenSubmit />
        <Form.Item name="personnelId" label={D.fields.person} rules={[R.select(D.fields.person.toLowerCase())]}>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder={D.personPlaceholder}
            options={people.map(p => ({ value: p.id, label: personOptionLabel(p) }))}
          />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="dutyDate" label={D.fields.date} rules={[R.select(D.fields.date.toLowerCase())]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="dutyType" label={D.fields.dutyType} rules={[R.select(D.fields.dutyType.toLowerCase())]}>
              <Select options={DUTY_TYPES.map(k => ({ value: k, label: D.dutyTypes[k] || k }))} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="shift" label={D.fields.shift} rules={[R.select(D.fields.shift.toLowerCase())]}>
          <Segmented block className="pp-seg" options={SHIFT_ORDER.map(k => ({ value: k, label: D.shifts[k] }))} />
        </Form.Item>
        {conflicts.length > 0 && (
          <div className="pp-warn" role="alert">
            <WarningOutlined />
            <span>
              {D.doubleBooked}{' '}
              <b>{conflicts.map(c => `${D.dutyTypes[c.dutyType] || c.dutyType} (${D.shifts[c.shift] || c.shift})`).join(', ')}</b>
            </span>
          </div>
        )}
        <Row gutter={16}>
          <Col xs={12}>
            <Form.Item name="startTime" label={D.fields.startTime}>
              <TimePicker format={TIME_FMT} minuteStep={5} style={{ width: '100%' }} needConfirm={false}
                onChange={() => form.validateFields(['endTime']).catch(() => {})} />
            </Form.Item>
          </Col>
          <Col xs={12}>
            <Form.Item name="endTime" label={D.fields.endTime} dependencies={['startTime']} rules={[endAfterStart]}>
              <TimePicker format={TIME_FMT} minuteStep={5} style={{ width: '100%' }} needConfirm={false} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="status" label={t.common.status}>
          <Select options={DUTY_STATUSES.map(k => ({ value: k, label: D.statuses[k] }))} />
        </Form.Item>
        <Form.Item name="notes" label={t.common.notes} style={{ marginBottom: 0 }}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
