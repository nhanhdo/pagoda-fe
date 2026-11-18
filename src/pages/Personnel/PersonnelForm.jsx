import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal, Form, Input, Select, DatePicker, Button, Row, Col, Upload, Radio, message,
} from 'antd';
import {
  UserOutlined, PhoneOutlined, ApartmentOutlined, ReadOutlined, CameraOutlined, FileTextOutlined, ScissorOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { useLanguage } from '../../i18n/LanguageContext';
import { guardedClose, rules as makeRules } from '../../utils/formGuard';
import { POSITIONS, positionLabel, imgSrc, initialOf } from './personnelShared';
import AvatarCropModal from '../../components/AvatarCrop/AvatarCropModal';
import './peopleShared.css';

// The original may be large (phone photos); what gets uploaded is the 512×512 crop.
const MAX_PHOTO = 20 * 1024 * 1024;
const DATE_FIELDS = ['dateOfBirth', 'ordinationDate', 'joinDate'];

/* Keeps "Enter" working as submit inside modal forms (antd modals render the OK button outside the <form>). */
export const HiddenSubmit = () => (
  <button type="submit" tabIndex={-1} aria-hidden="true"
    style={{ position: 'absolute', width: 0, height: 0, padding: 0, border: 0, opacity: 0, pointerEvents: 'none' }} />
);

function Section({ icon, title, children }) {
  return (
    <div className="pp-form-section">
      <div className="pp-form-section__title">{icon}{title}</div>
      {children}
    </div>
  );
}

/**
 * Add / edit personnel in a modal. Shared by the list and the detail page.
 * Props: open, record (null = create), onClose(), onSaved(savedRecord?)
 */
export default function PersonnelFormModal({ open, record, onClose, onSaved }) {
  const { t } = useLanguage();
  const P = t.personnel;
  const F = P.form;
  const R = makeRules(t);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);     // object URL of the original file (kept for re-adjusting)
  const [cropState, setCropState] = useState(null);
  const [cropOpen, setCropOpen] = useState(false);
  const fullName = Form.useWatch('fullName', form);

  useEffect(() => {
    if (!open) return;
    api.get('/departments').then(({ data }) => setDepartments(data || [])).catch(() => setDepartments([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setPhotoFile(null);
    setPhotoUrl(record?.photo ? imgSrc(record.photo) : null);
    setCropSrc(null);
    setCropState(null);
    setCropOpen(false);
    if (record) {
      const v = { ...record };
      DATE_FIELDS.forEach(k => { v[k] = record[k] ? dayjs(record[k]) : null; });
      delete v.photo;
      form.setFieldsValue(v);
    } else {
      form.resetFields();
    }
  }, [open, record, form]);

  // Release blob previews
  useEffect(() => () => { if (photoUrl?.startsWith('blob:')) URL.revokeObjectURL(photoUrl); }, [photoUrl]);
  useEffect(() => () => { if (cropSrc) URL.revokeObjectURL(cropSrc); }, [cropSrc]);

  const beforeUpload = (file) => {
    if (!file.type?.startsWith('image/')) { message.error(F.photoInvalid); return Upload.LIST_IGNORE; }
    if (file.size > MAX_PHOTO) { message.error(F.photoTooLarge); return Upload.LIST_IGNORE; }
    // Open the cropper; the photo only changes once the user confirms a crop
    setCropSrc(URL.createObjectURL(file));
    setCropState(null);
    setCropOpen(true);
    return false;
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        fd.append(k, dayjs.isDayjs(v) ? v.format('YYYY-MM-DD') : v);
      });
      if (photoFile) fd.append('photo', photoFile);
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } };
      const { data } = record
        ? await api.put(`/personnel/${record.id}`, fd, cfg)
        : await api.post('/personnel', fd, cfg);
      message.success(record ? P.updateSuccess : P.addSuccess);
      onSaved?.(data);
    } catch (error) {
      message.error(error.response?.data?.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const close = () => guardedClose(form, onClose, t);
  const deptOptions = useMemo(() => departments.map(d => ({ value: d.id, label: d.name })), [departments]);

  return (
    <Modal
      title={record ? P.editTitle : P.addTitle}
      open={open}
      onCancel={close}
      onOk={() => form.submit()}
      okText={record ? t.common.update : t.common.add}
      cancelText={t.common.cancel}
      confirmLoading={saving}
      maskClosable={false}
      width={760}
      destroyOnClose
      styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: 4 } }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} className="pp-form"
        initialValues={{ status: 'đang_hoạt_động' }}>
        <HiddenSubmit />

        {/* ── Basic ── */}
        <Section icon={<UserOutlined />} title={F.sectionBasic}>
          <div className="pp-photo">
            <div className="pp-photo__preview">
              {photoUrl ? <img src={photoUrl} alt="" /> : initialOf(fullName || '')}
            </div>
            <div className="pp-photo__actions">
              <Upload accept="image/*" showUploadList={false} beforeUpload={beforeUpload} maxCount={1}>
                <Button icon={<CameraOutlined />} size="small">{photoUrl ? F.changePhoto : F.uploadPhoto}</Button>
              </Upload>
              {photoFile && cropSrc && (
                <Button type="link" size="small" icon={<ScissorOutlined />} className="pp-photo__adjust" onClick={() => setCropOpen(true)}>
                  {t.common.cropAdjust}
                </Button>
              )}
              <span className="pp-form-hint">{F.photoHint}</span>
            </div>
          </div>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="fullName" label={t.common.name} rules={[{ required: true, whitespace: true, message: F.fullNameRequired }]}>
                <Input autoFocus />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="dharmName" label={F.dharmaName}><Input /></Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="gender" label={F.gender} rules={[R.select(F.gender.toLowerCase())]}>
                <Radio.Group optionType="button" buttonStyle="solid">
                  <Radio.Button value="nam">{F.genderMale}</Radio.Button>
                  <Radio.Button value="nữ">{F.genderFemale}</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="dateOfBirth" label={F.dateOfBirth} rules={[R.notFuture]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" disabledDate={(d) => d && d.isAfter(dayjs(), 'day')} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="type" label={F.type} rules={[R.select(F.type.toLowerCase())]}>
                <Select options={Object.entries(P.types).map(([k, v]) => ({ value: k, label: v }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="status" label={t.common.status}>
                <Select options={Object.entries(P.statuses).map(([k, v]) => ({ value: k, label: v }))} />
              </Form.Item>
            </Col>
          </Row>
        </Section>

        {/* ── Contact ── */}
        <Section icon={<PhoneOutlined />} title={F.sectionContact}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label={P.colPhone} rules={[R.phone]}><Input inputMode="tel" /></Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="email" label={t.common.email} rules={[R.email]}><Input inputMode="email" /></Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="idCard" label={F.idCard} rules={[R.cccd]}><Input inputMode="numeric" maxLength={12} /></Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="address" label={F.address}><Input /></Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="emergencyContact" label={F.emergencyContact}><Input /></Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="emergencyPhone" label={F.emergencyPhone} rules={[R.phone]}><Input inputMode="tel" /></Form.Item>
            </Col>
          </Row>
        </Section>

        {/* ── Work ── */}
        <Section icon={<ApartmentOutlined />} title={F.sectionWork}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="departmentId" label={F.department}>
                <Select allowClear showSearch optionFilterProp="label" options={deptOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="position" label={P.colPosition}>
                <Select allowClear options={POSITIONS.map(p => ({ value: p, label: positionLabel(t, p) }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="joinDate" label={F.joinDate} rules={[R.notFuture]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
        </Section>

        {/* ── Practice ── */}
        <Section icon={<ReadOutlined />} title={P.tabStudyInfo}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="ordinationDate" label={F.ordinationDate} rules={[R.notFuture]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="preceptorName" label={F.preceptor}><Input /></Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="precept" label={F.precept}><Input placeholder={F.preceptPlaceholder} /></Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="buddhismEducation" label={F.buddhismEducation}><Input placeholder={F.buddhismEducationPlaceholder} /></Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="secularEducation" label={F.secularEducation}><Input placeholder={F.secularEducationPlaceholder} /></Form.Item>
            </Col>
          </Row>
        </Section>

        {/* ── Notes ── */}
        <Section icon={<FileTextOutlined />} title={t.common.notes}>
          <Form.Item name="notes" style={{ marginBottom: 0 }}><Input.TextArea rows={3} /></Form.Item>
        </Section>
      </Form>
      <AvatarCropModal
        open={cropOpen}
        src={cropSrc}
        initial={cropState}
        onCancel={() => setCropOpen(false)}
        onDone={(file, url, state) => {
          setPhotoFile(file);
          setPhotoUrl(url);
          setCropState(state);
          setCropOpen(false);
          form.setFields([{ name: 'fullName', touched: true }]); // count as an unsaved change
        }}
      />
    </Modal>
  );
}
