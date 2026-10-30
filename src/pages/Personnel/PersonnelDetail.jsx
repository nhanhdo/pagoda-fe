import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Avatar, Tag, Button, Descriptions, Spin, Tabs, Table, Badge,
  Typography, Space, Empty,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

/* ── Vertical timeline component ─────────────────────── */
function JourneyTimeline({ events, t }) {
  if (!events.length) return <Empty description={t.personnel.journeyEmpty} style={{ padding: '32px 0' }} />;
  return (
    <div style={{ position: 'relative', paddingLeft: 32, paddingTop: 8, paddingBottom: 8 }}>
      {/* Vertical connecting line */}
      <div style={{
        position: 'absolute', left: 11, top: 0, bottom: 0, width: 2,
        background: 'linear-gradient(to bottom, #8B4513, #d4a017, #8B4513)',
        opacity: 0.25, borderRadius: 1,
      }} />

      {events.map((ev, i) => (
        <div key={i} style={{ position: 'relative', marginBottom: 28, paddingLeft: 16 }}>
          {/* Dot */}
          <div style={{
            position: 'absolute', left: -21, top: 4,
            width: 14, height: 14, borderRadius: '50%',
            background: ev.color || '#8B4513',
            border: '2.5px solid #fff',
            boxShadow: `0 0 0 2.5px ${ev.color || '#8B4513'}55, 0 2px 6px rgba(0,0,0,0.15)`,
            zIndex: 1,
          }} />

          {/* Card */}
          <div style={{
            background: '#fafafa',
            border: '1px solid #f0ebe3',
            borderLeft: `3px solid ${ev.color || '#8B4513'}`,
            borderRadius: '0 10px 10px 0',
            padding: '10px 14px',
            transition: 'box-shadow 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.09)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{ev.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#222', flex: 1 }}>{ev.title}</span>
              <span style={{
                fontSize: 11, color: '#fff', background: ev.color || '#8B4513',
                padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap', opacity: 0.88,
              }}>{ev.dateStr}</span>
            </div>
            {ev.subtitle && (
              <div style={{ fontSize: 12, color: '#777', marginTop: 4, paddingLeft: 26 }}>{ev.subtitle}</div>
            )}
          </div>
        </div>
      ))}

      {/* "Now" marker */}
      <div style={{ position: 'relative', paddingLeft: 16 }}>
        <div style={{
          position: 'absolute', left: -18, top: 4,
          width: 8, height: 8, borderRadius: '50%',
          background: '#52c41a', border: '2px solid #fff',
          boxShadow: '0 0 0 2px #52c41a66',
        }} />
        <Text style={{ fontSize: 12, color: '#52c41a', fontWeight: 600 }}>{t.personnel.journeyNow}</Text>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────── */
export default function PersonnelDetail() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManage } = useAuth();
  const [person, setPerson]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [trainings, setTrainings] = useState([]);
  const [rewards, setRewards]     = useState([]);
  const [duties, setDuties]       = useState([]);

  const typeLabels = {
    tang_ni: t.personnel.types.tang_ni,
    cu_si: t.personnel.types.cu_si,
    phat_tu: t.personnel.types.phat_tu,
    tinh_nguyen_vien: t.personnel.types.tinh_nguyen_vien,
    nhan_vien: t.personnel.types.nhan_vien,
  };

  useEffect(() => {
    api.get(`/personnel/${id}`)
      .then(({ data }) => setPerson(data))
      .finally(() => setLoading(false));

    // Load sub-data for journey tab (best-effort)
    api.get(`/training?personnelId=${id}`).then(({ data }) => setTrainings(Array.isArray(data) ? data : data.data || [])).catch(() => {});
    api.get(`/reward-discipline?personnelId=${id}`).then(({ data }) => setRewards(Array.isArray(data) ? data : data.data || [])).catch(() => {});
    api.get(`/duty-schedules?personnelId=${id}&limit=20`).then(({ data }) => setDuties(Array.isArray(data) ? data : data.data || [])).catch(() => {});
  }, [id]);

  /* Build timeline events */
  const buildJourneyEvents = () => {
    const events = [];
    const push = (ts, obj) => { if (ts && dayjs(ts).isValid()) events.push({ ts: dayjs(ts).valueOf(), dateStr: dayjs(ts).format('DD/MM/YYYY'), ...obj }); };

    // Birth
    push(person?.dateOfBirth, { icon: '🗓️', title: t.personnel.dateOfBirth, color: '#e74c3c' });

    // Join temple
    push(person?.joinDate || person?.createdAt, {
      icon: '🏛️', title: t.personnel.journeyJoinTemple,
      subtitle: person?.department?.name ? `${t.personnel.journeyDeptPrefix}: ${person.department.name}` : undefined,
      color: '#8B4513',
    });

    // Ordination / precept
    push(person?.ordinationDate, {
      icon: '☸️', title: t.personnel.journeyOrdination,
      subtitle: person?.precept ? `${t.personnel.precept}: ${person.precept}` : (person?.preceptorName ? `${t.personnel.preceptorName}: ${person.preceptorName}` : undefined),
      color: '#722ed1',
    });

    // Training completions
    trainings.forEach(tr => {
      const date = tr.endDate || tr.startDate;
      push(date, {
        icon: '📚', title: tr.name || t.personnel.journeyTrainingDefault,
        subtitle: tr.type ? `${t.common.type}: ${tr.type.replace(/_/g, ' ')}` : undefined,
        color: '#1890ff',
      });
    });

    // Rewards only (not discipline)
    rewards
      .filter(r => r.recordType === 'khen_thuong' || r.type === 'khen_thuong' || r.category === 'reward')
      .forEach(r => {
        push(r.issuedDate || r.date, {
          icon: '🏆', title: r.title || r.reason || t.personnel.journeyRewardDefault,
          subtitle: r.description || undefined,
          color: '#d4b106',
        });
      });

    // 3 most recent duty dates
    const sortedDuties = [...duties]
      .filter(d => d.dutyDate)
      .sort((a, b) => dayjs(b.dutyDate).valueOf() - dayjs(a.dutyDate).valueOf())
      .slice(0, 3);
    sortedDuties.forEach(d => {
      push(d.dutyDate, {
        icon: '📅', title: `${t.personnel.journeyDutyPrefix} ${d.dutyType || t.personnel.journeyDutyTemple}`,
        subtitle: d.shift ? `${t.common.shift}: ${d.shift}` : undefined,
        color: '#2e7d32',
      });
    });

    return events.sort((a, b) => a.ts - b.ts);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!person) return <div>{t.personnel.notFound}</div>;

  const journeyEvents = buildJourneyEvents();

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/app/personnel')}>{t.common.back}</Button>
      </div>

      <Card>
        <Row gutter={24}>
          <Col xs={24} sm={6} style={{ textAlign: 'center' }}>
            {person.photo
              ? <Avatar src={person.photo} size={120} />
              : <Avatar size={120} style={{ backgroundColor: '#8B4513', fontSize: 48 }}>{person.fullName?.[0]}</Avatar>
            }
            <div style={{ marginTop: 12 }}>
              <Tag>{person.code}</Tag>
            </div>
          </Col>
          <Col xs={24} sm={18}>
            <Title level={3} style={{ margin: 0, color: '#5c3317' }}>{person.fullName}</Title>
            {person.dharmName && (
              <Title level={5} style={{ color: '#8B4513', margin: '4px 0 12px' }}>{person.dharmName}</Title>
            )}
            <Space wrap>
              <Tag color="#8B4513" style={{ color: '#fff' }}>{typeLabels[person.type]}</Tag>
              {person.position && <Tag>{person.position.replace(/_/g, ' ')}</Tag>}
              <Badge
                status={person.status === 'đang_hoạt_động' ? 'success' : 'default'}
                text={person.status}
              />
            </Space>
            {canManage() && (
              <div style={{ marginTop: 16 }}>
                <Button icon={<EditOutlined />} onClick={() => navigate(`/app/personnel/${id}/edit`)}>{t.common.edit}</Button>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Tabs defaultActiveKey="info">
          <TabPane tab={t.personnel.tabPersonalInfo} key="info">
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label={t.personnel.gender}>{person.gender}</Descriptions.Item>
              <Descriptions.Item label={t.personnel.dateOfBirth}>
                {person.dateOfBirth ? dayjs(person.dateOfBirth).format('DD/MM/YYYY') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t.personnel.idCard}>{person.idCard || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.personnel.colPhone}>{person.phone || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.common.email}>{person.email || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.personnel.address} span={2}>{person.address || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.personnel.emergencyContact}>{person.emergencyContact || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.personnel.emergencyPhone}>{person.emergencyPhone || '—'}</Descriptions.Item>
            </Descriptions>
          </TabPane>

          <TabPane tab={t.personnel.tabStudyInfo} key="study">
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label={t.personnel.ordinationDate}>
                {person.ordinationDate ? dayjs(person.ordinationDate).format('DD/MM/YYYY') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t.personnel.preceptorName}>{person.preceptorName || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.personnel.precept}>{person.precept || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.personnel.buddhismEducation}>{person.buddhismEducation || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.personnel.secularEducation}>{person.secularEducation || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.personnel.departmentLabel}>{person.department?.name || '—'}</Descriptions.Item>
              <Descriptions.Item label={t.personnel.joinDate}>
                {person.joinDate ? dayjs(person.joinDate).format('DD/MM/YYYY') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t.common.notes} span={2}>{person.notes || '—'}</Descriptions.Item>
            </Descriptions>
          </TabPane>

          <TabPane
            tab={<span>🛤️ {t.personnel.tabJourney} {journeyEvents.length > 0 && <Tag color="#8B4513" style={{ marginLeft: 4, fontSize: 11, color: '#fff' }}>{journeyEvents.length}</Tag>}</span>}
            key="journey"
          >
            <div style={{ maxWidth: 640, margin: '0 auto', padding: '8px 0' }}>
              {/* Summary bar */}
              {journeyEvents.length > 0 && (
                <div style={{
                  display: 'flex', gap: 16, flexWrap: 'wrap',
                  background: 'linear-gradient(135deg, #fdf6ee, #fff9f4)',
                  border: '1px solid #f0e8db', borderRadius: 10,
                  padding: '12px 16px', marginBottom: 24,
                }}>
                  {person.joinDate && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#8B4513' }}>
                        {dayjs().diff(dayjs(person.joinDate), 'year')}
                      </div>
                      <div style={{ fontSize: 11, color: '#999' }}>{t.personnel.statYearsOfPractice}</div>
                    </div>
                  )}
                  {trainings.length > 0 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#1890ff' }}>{trainings.length}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{t.personnel.statTrainings}</div>
                    </div>
                  )}
                  {duties.length > 0 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#2e7d32' }}>{duties.length}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{t.personnel.statDuties}</div>
                    </div>
                  )}
                  {rewards.filter(r => r.recordType === 'khen_thuong' || r.type === 'khen_thuong' || r.category === 'reward').length > 0 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#d4b106' }}>
                        {rewards.filter(r => r.recordType === 'khen_thuong' || r.type === 'khen_thuong' || r.category === 'reward').length}
                      </div>
                      <div style={{ fontSize: 11, color: '#999' }}>{t.personnel.statRewards}</div>
                    </div>
                  )}
                </div>
              )}
              <JourneyTimeline events={journeyEvents} t={t} />
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}
