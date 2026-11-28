import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Radio, Upload, Button, Tabs, message } from 'antd';
import FormDialog from '../../components/FormDialog/FormDialog';
import { CameraOutlined, DeleteOutlined, PlusOutlined, MinusCircleOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import api from '../../api/axios';
import { useLanguage } from '../../i18n/LanguageContext';
import { initializeForm, guardedClose, rules as makeRules } from '../../utils/formGuard';
import { KINDS, figureImg, bioSectionsOf } from './libraryShared';
import FigureArt from './FigureArt';

const MAX_IMAGE = 8 * 1024 * 1024;
const TEXT_KEYS = ['name', 'kind', 'title', 'sortOrder', 'intro', 'vowsIntro', 'mantraText', 'mantraPhonetic', 'mantraMeaning'];

/** Reorder / remove buttons shared by the section and vow lists */
function RowTools({ index, count, move, remove, t }) {
  return (
    <div className="lib-list-tools">
      <Button type="text" size="small" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => move(index, index - 1)} aria-label="↑" />
      <Button type="text" size="small" icon={<ArrowDownOutlined />} disabled={index === count - 1} onClick={() => move(index, index + 1)} aria-label="↓" />
      <Button type="text" size="small" danger icon={<MinusCircleOutlined />} onClick={() => remove(index)} aria-label={t.common.delete} />
    </div>
  );
}

export default function FigureFormModal({ open, record, onClose, onSaved }) {
  const { t } = useLanguage();
  const L = t.library;
  const R = makeRules(t);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [tab, setTab] = useState('info');
  const kind = Form.useWatch('kind', form);
  const name = Form.useWatch('name', form);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setRemoveImage(false);
    setTab('info');
    setPreview(record?.image ? figureImg(record.image) : null);
    if (record) {
      initializeForm(form, {
        ...record,
        intro: record.intro || (record.bioSections?.length ? '' : record.description) || '',
        bioSections: bioSectionsOf(record, L),
        vows: record.vows || [],
        mantraText: record.mantraText || record.mantra || '',
        feastDays: record.feastDays || [],
      });
    } else {
      form.resetFields();
    }
  }, [open, record, form]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

  const touch = () => form.setFields([{ name: 'name', touched: true }]);

  const beforeUpload = (f) => {
    if (!f.type?.startsWith('image/')) { message.error(L.imageInvalid); return Upload.LIST_IGNORE; }
    if (f.size > MAX_IMAGE) { message.error(L.imageTooLarge); return Upload.LIST_IGNORE; }
    setFile(f);
    setRemoveImage(false);
    setPreview(URL.createObjectURL(f));
    touch();
    return false;
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      const fd = new FormData();
      TEXT_KEYS.forEach(k => {
        const v = values[k];
        if (v !== undefined && v !== null) fd.append(k, v);
        else if (record && k !== 'kind' && k !== 'name') fd.append(k, '');
      });
      fd.append('feastDays', JSON.stringify((values.feastDays || []).filter(x => x && x.day && x.month)));
      fd.append('bioSections', JSON.stringify((values.bioSections || []).filter(x => x && (x.heading || x.body))));
      fd.append('vows', JSON.stringify((values.vows || []).filter(x => x && x.text).map((x, i) => ({ no: x.no || i + 1, text: x.text }))));
      if (file) fd.append('image', file);
      else if (removeImage) fd.append('removeImage', 'true');
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } };
      const { data } = record ? await api.put(`/library/${record.id}`, fd, cfg) : await api.post('/library', fd, cfg);
      message.success(record ? L.updateSuccess : L.addSuccess);
      onSaved?.(data);
    } catch (err) {
      message.error(err?.response?.data?.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  // Jump to the tab holding the first invalid field
  const onFinishFailed = ({ errorFields }) => {
    const first = errorFields?.[0]?.name?.[0];
    if (first === 'bioSections') setTab('bio');
    else if (first === 'vows') setTab('vows');
    else setTab('info');
  };

  const previewFigure = { kind: kind || 'phat', name: name || '', image: removeImage ? null : (file ? preview : record?.image) };

  const infoTab = (
    <>
      <div className="lib-form-top">
        <div className="lib-form-img">
          <FigureArt figure={previewFigure} className="lib-form-img__art" />
          <div className="lib-form-img__actions">
            <Upload accept="image/*" showUploadList={false} beforeUpload={beforeUpload} maxCount={1}>
              <Button size="small" icon={<CameraOutlined />}>{previewFigure.image ? L.changeImage : L.chooseImage}</Button>
            </Upload>
            {previewFigure.image && (
              <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => { setFile(null); setPreview(null); setRemoveImage(true); touch(); }}>
                {L.removeImage}
              </Button>
            )}
            <span className="lib-form-hint">{L.imageHint}</span>
          </div>
        </div>
        <div className="lib-form-main">
          <Form.Item name="kind" label={L.kind}>
            <Radio.Group optionType="button" buttonStyle="solid" options={KINDS.map(k => ({ value: k, label: L.kinds[k] }))} />
          </Form.Item>
          <Form.Item name="name" label={L.name} rules={[{ ...R.required(L.name.toLowerCase()), whitespace: true }, { max: 120 }]}>
            <Input placeholder={L.namePlaceholder} maxLength={120} />
          </Form.Item>
          <Form.Item name="title" label={L.titleField} rules={[{ max: 200 }]}>
            <Input placeholder={L.titlePlaceholder} maxLength={200} />
          </Form.Item>
        </div>
      </div>

      <div className="ant-form-item-label lib-form-label"><label>{L.feastDays}</label></div>
      <Form.List name="feastDays">
        {(fields, { add, remove }) => (
          <div className="lib-feast-list">
            {fields.map(({ key, name: n, ...rest }) => (
              <div key={key} className="lib-feast-row">
                <Form.Item {...rest} name={[n, 'day']} rules={[{ required: true, message: L.dayRequired }]} noStyle>
                  <InputNumber min={1} max={30} placeholder={L.day} style={{ width: 84 }} />
                </Form.Item>
                <span className="lib-feast-row__sep">/</span>
                <Form.Item {...rest} name={[n, 'month']} rules={[{ required: true, message: L.monthRequired }]} noStyle>
                  <InputNumber min={1} max={12} placeholder={L.month} style={{ width: 84 }} />
                </Form.Item>
                <span className="lib-feast-row__unit">{L.lunarShort}</span>
                <Form.Item {...rest} name={[n, 'label']} noStyle>
                  <Input placeholder={L.feastLabelPlaceholder} maxLength={60} style={{ flex: 1, minWidth: 120 }} />
                </Form.Item>
                <Button type="text" icon={<MinusCircleOutlined />} onClick={() => remove(n)} aria-label={t.common.delete} />
              </div>
            ))}
            {fields.length < 8 && (
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({})} className="add-action lib-feast-add">{L.addFeast}</Button>
            )}
          </div>
        )}
      </Form.List>

      <Form.Item name="sortOrder" label={L.sortOrder} extra={L.sortOrderHint}>
        <InputNumber min={0} max={9999} style={{ width: 140 }} />
      </Form.Item>
    </>
  );

  const bioTab = (
    <>
      <Form.Item name="intro" label={L.introField} extra={L.descriptionHint} rules={[{ max: 20000 }]}>
        <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} placeholder={L.introPlaceholder} />
      </Form.Item>
      <div className="ant-form-item-label lib-form-label"><label>{L.sectionsField}</label></div>
      <Form.List name="bioSections">
        {(fields, { add, remove, move }) => (
          <div className="lib-edit-list">
            {fields.map(({ key, name: n, ...rest }, i) => (
              <div key={key} className="lib-edit-item">
                <div className="lib-edit-item__head">
                  <Form.Item {...rest} name={[n, 'heading']} noStyle rules={[{ max: 120 }]}>
                    <Input placeholder={L.sectionHeading} maxLength={120} className="lib-edit-item__heading" />
                  </Form.Item>
                  <RowTools index={i} count={fields.length} move={move} remove={remove} t={t} />
                </div>
                <Form.Item {...rest} name={[n, 'body']} noStyle rules={[{ max: 8000 }]}>
                  <Input.TextArea autoSize={{ minRows: 2, maxRows: 8 }} placeholder={L.sectionBody} />
                </Form.Item>
              </div>
            ))}
            {fields.length < 30 && (
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ heading: '', body: '' })} className="add-action lib-feast-add">{L.addSection}</Button>
            )}
          </div>
        )}
      </Form.List>
    </>
  );

  const vowsTab = (
    <>
      <Form.Item name="vowsIntro" label={L.vowsIntroField} rules={[{ max: 2000 }]}>
        <Input.TextArea autoSize={{ minRows: 1, maxRows: 4 }} placeholder={L.vowsIntroPlaceholder} />
      </Form.Item>
      <div className="ant-form-item-label lib-form-label"><label>{L.tab_vows}</label></div>
      <Form.List name="vows">
        {(fields, { add, remove, move }) => (
          <div className="lib-edit-list">
            {fields.map(({ key, name: n, ...rest }, i) => (
              <div key={key} className="lib-edit-item lib-edit-item--vow">
                <Form.Item {...rest} name={[n, 'no']} noStyle>
                  <InputNumber min={1} max={999} placeholder={String(i + 1)} className="lib-edit-item__no" aria-label={L.vowNo} />
                </Form.Item>
                <Form.Item {...rest} name={[n, 'text']} noStyle rules={[{ max: 3000 }]}>
                  <Input.TextArea autoSize={{ minRows: 1, maxRows: 6 }} placeholder={L.vowText} />
                </Form.Item>
                <RowTools index={i} count={fields.length} move={move} remove={remove} t={t} />
              </div>
            ))}
            {fields.length < 60 && (
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ text: '' })} className="add-action lib-feast-add">{L.addVow}</Button>
            )}
          </div>
        )}
      </Form.List>
    </>
  );

  const mantraTab = (
    <>
      <Form.Item name="mantraText" label={L.mantraTextField} rules={[{ max: 2000 }]}>
        <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} placeholder="VD: Om Mani Padme Hum" />
      </Form.Item>
      <Form.Item name="mantraPhonetic" label={L.mantraPhoneticField} rules={[{ max: 2000 }]}>
        <Input.TextArea autoSize={{ minRows: 1, maxRows: 4 }} placeholder="VD: Án Ma Ni Bát Di Hồng" />
      </Form.Item>
      <Form.Item name="mantraMeaning" label={L.meaning} rules={[{ max: 4000 }]}>
        <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} />
      </Form.Item>
    </>
  );

  return (
    <FormDialog
      title={record ? L.editTitle : L.addTitle}
      open={open}
      onCancel={() => guardedClose(form, onClose, t)}
      onOk={() => form.submit()}
      isAdding={!record}
      okText={record ? t.common.update : t.common.add}
      cancelText={t.common.cancel}
      confirmLoading={saving}
      maskClosable={false}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        initialValues={{ kind: 'phat', feastDays: [], bioSections: [], vows: [] }}
      >
        <Tabs
          activeKey={tab}
          onChange={setTab}
          className="lib-form-tabs"
          items={[
            { key: 'info', label: L.formTabInfo, children: infoTab, forceRender: true },
            { key: 'bio', label: L.tab_bio, children: bioTab, forceRender: true },
            { key: 'vows', label: L.tab_vows, children: vowsTab, forceRender: true },
            { key: 'mantra', label: L.tab_mantra, children: mantraTab, forceRender: true },
          ]}
        />
      </Form>
    </FormDialog>
  );
}
