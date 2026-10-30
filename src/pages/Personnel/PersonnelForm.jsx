import React, { useEffect, useState } from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col, Upload, message, Divider, Tabs } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { useLanguage } from '../../i18n/LanguageContext';

const { Option } = Select;
const { TabPane } = Tabs;

const positions = [
  'trụ_trì', 'phó_trụ_trì', 'tri_khách', 'thủ_quỹ', 'thư_ký',
  'ban_hộ_tự', 'trưởng_ban', 'phó_ban', 'thành_viên', 'tình_nguyện_viên',
];

export default function PersonnelForm({ record, onSuccess, onCancel }) {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    api.get('/departments').then(({ data }) => setDepartments(data));
  }, []);

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        ...record,
        dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth) : null,
        ordinationDate: record.ordinationDate ? dayjs(record.ordinationDate) : null,
        joinDate: record.joinDate ? dayjs(record.joinDate) : null,
      });
    } else {
      form.resetFields();
    }
  }, [record, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          if (k === 'photo' && v.fileList) {
            if (v.fileList[0]?.originFileObj) formData.append('photo', v.fileList[0].originFileObj);
          } else if (dayjs.isDayjs(v)) {
            formData.append(k, v.format('YYYY-MM-DD'));
          } else {
            formData.append(k, v);
          }
        }
      });

      if (record) {
        await api.put(`/personnel/${record.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        message.success(t.personnel.updateSuccess);
      } else {
        await api.post('/personnel', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        message.success(t.personnel.addSuccess);
      }
      onSuccess();
    } catch (error) {
      message.error(error.response?.data?.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Tabs defaultActiveKey="1" size="small">
        <TabPane tab={t.personnel.tabPersonalInfo} key="1">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fullName" label={t.common.name} rules={[{ required: true, message: t.personnel.form.fullNameRequired }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dharmName" label={t.personnel.form.dharmaName}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="gender" label={t.personnel.form.gender} rules={[{ required: true }]}>
                <Select>
                  <Option value="nam">{t.personnel.form.genderMale}</Option>
                  <Option value="nữ">{t.personnel.form.genderFemale}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dateOfBirth" label={t.personnel.form.dateOfBirth}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="idCard" label={t.personnel.form.idCard}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label={t.personnel.colPhone}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label={t.common.email}>
                <Input type="email" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="address" label={t.personnel.form.address}>
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="emergencyContact" label={t.personnel.form.emergencyContact}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="emergencyPhone" label={t.personnel.form.emergencyPhone}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="photo" label={t.personnel.colPhoto}>
                <Upload maxCount={1} beforeUpload={() => false} accept="image/*" listType="picture">
                  <Button icon={<UploadOutlined />}>{t.personnel.form.uploadPhoto}</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab={t.personnel.tabStudyInfo} key="2">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label={t.personnel.form.type} rules={[{ required: true }]}>
                <Select>
                  <Option value="tang_ni">{t.personnel.types.tang_ni}</Option>
                  <Option value="cu_si">{t.personnel.types.cu_si}</Option>
                  <Option value="phat_tu">{t.personnel.types.phat_tu}</Option>
                  <Option value="tinh_nguyen_vien">{t.personnel.types.tinh_nguyen_vien}</Option>
                  <Option value="nhan_vien">{t.personnel.types.nhan_vien}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="position" label={t.personnel.colPosition}>
                <Select allowClear>
                  {positions.map(p => <Option key={p} value={p}>{p.replace(/_/g, ' ')}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="departmentId" label={t.personnel.form.department}>
                <Select allowClear>
                  {departments.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ordinationDate" label={t.personnel.form.ordinationDate}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="preceptorName" label={t.personnel.form.preceptor}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="precept" label={t.personnel.form.precept}>
                <Input placeholder={t.personnel.form.preceptPlaceholder} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="buddhismEducation" label={t.personnel.form.buddhismEducation}>
                <Input placeholder={t.personnel.form.buddhismEducationPlaceholder} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="secularEducation" label={t.personnel.form.secularEducation}>
                <Input placeholder={t.personnel.form.secularEducationPlaceholder} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="joinDate" label={t.personnel.form.joinDate}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label={t.common.status}>
                <Select>
                  <Option value="đang_hoạt_động">{t.personnel.statuses['đang_hoạt_động']}</Option>
                  <Option value="tạm_nghỉ">{t.personnel.statuses['tạm_nghỉ']}</Option>
                  <Option value="đã_rời">{t.personnel.statuses['đã_rời']}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="notes" label={t.common.notes}>
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      <div style={{ textAlign: 'right', marginTop: 16 }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>{t.common.cancel}</Button>
        <Button type="primary" htmlType="submit" loading={loading}
          style={{ backgroundColor: '#8B4513', borderColor: '#8B4513' }}>
          {record ? t.common.update : t.personnel.form.addNew}
        </Button>
      </div>
    </Form>
  );
}
