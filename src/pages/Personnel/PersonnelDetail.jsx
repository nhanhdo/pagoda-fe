import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, Button, Tabs } from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, CalendarOutlined, HomeOutlined, SafetyCertificateOutlined,
  ReadOutlined, TrophyOutlined, ScheduleOutlined, ClockCircleOutlined, ReloadOutlined,
  UserOutlined, PhoneOutlined, MailOutlined, IdcardOutlined, EnvironmentOutlined, AlertOutlined,
  ApartmentOutlined, BookOutlined, NodeIndexOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import LotusEmpty from '../../components/LotusEmpty/LotusEmpty';
import CountUp from '../../components/CountUp/CountUp';
import PersonnelFormModal from './PersonnelForm';
import {
  toneOf, statusToneOf, positionLabel, genderLabel, initialOf, imgSrc, TONES,
} from './personnelShared';
import './peopleShared.css';
import './PersonnelDetail.css';

const fmt = (d) => (d ? dayjs(d).format('DD/MM/YYYY') : null);
const asList = (data) => (Array.isArray(data) ? data : data?.data || []);

/* ── Vertical timeline ─────────────────────────────────── */
function JourneyTimeline({ events, t }) {
  if (!events.length) return <LotusEmpty description={t.personnel.journeyEmpty} hint={t.personnel.journeyEmptyHint} />;
  return (
    <ol className="pd-tl">
      {events.map((ev) => (
        <li key={ev.key} className="pd-tl__item" style={{ '--tone': ev.tone.c, '--tone-soft': ev.tone.s }}>
          <span className="pd-tl__dot" aria-hidden="true">{ev.icon}</span>
          <div className="pd-tl__card">
            <div className="pd-tl__head">
              <span className="pd-tl__title">{ev.title}</span>
              <span className="pd-tl__date tbl-mono">{ev.dateStr}</span>
            </div>
            {ev.subtitle && <div className="pd-tl__sub">{ev.subtitle}</div>}
          </div>
        </li>
      ))}
      <li className="pd-tl__item pd-tl__item--now" style={{ '--tone': TONES.sage.c, '--tone-soft': TONES.sage.s }}>
        <span className="pd-tl__dot pd-tl__dot--now" aria-hidden="true" />
        <span className="pd-tl__now">{t.personnel.journeyNow}</span>
      </li>
    </ol>
  );
}

function InfoGrid({ items }) {
  return (
    <dl className="pd-info">
      {items.map(it => (
        <div key={it.label} className={`pd-info__row${it.wide ? ' is-wide' : ''}`}>
          <dt>{it.icon}{it.label}</dt>
          <dd className={it.value ? '' : 'tbl-muted'}>{it.value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ── Page ──────────────────────────────────────────────── */
export default function PersonnelDetail() {
  const { t } = useLanguage();
  const P = t.personnel;
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManage } = useAuth();
  const [person, setPerson] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | notFound | error
  const [trainings, setTrainings] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [duties, setDuties] = useState([]);
  const [editOpen, setEditOpen] = useState(false);

  const loadPerson = useCallback(async () => {
    try {
      const { data } = await api.get(`/personnel/${id}`);
      setPerson(data);
      setState(data ? 'ok' : 'notFound');
    } catch (e) {
      setState(e.response?.status === 404 ? 'notFound' : 'error');
    }
  }, [id]);

  useEffect(() => {
    setState('loading');
    loadPerson();
    const pid = Number(id);
    // Journey sub-data (best effort). /trainings has no person filter, so match on the participant list.
    api.get('/trainings')
      .then(({ data }) => setTrainings(asList(data)
        .map(tr => ({ ...tr, me: (tr.participants || []).find(p => Number(p.personnelId ?? p.personnel?.id) === pid) }))
        .filter(tr => tr.me)))
      .catch(() => setTrainings([]));
    api.get('/reward-disciplines', { params: { personnelId: id, type: 'khen_thưởng' } })
      .then(({ data }) => setRewards(asList(data).filter(r => r.type === 'khen_thưởng' && Number(r.personnelId) === pid)))
      .catch(() => setRewards([]));
    api.get('/duty-schedules', { params: { personnelId: id } })
      .then(({ data }) => setDuties(asList(data).filter(d => Number(d.personnelId ?? d.personnel?.id) === pid)))
      .catch(() => setDuties([]));
  }, [id, loadPerson]);

  const journeyEvents = useMemo(() => {
    if (!person) return [];
    const events = [];
    const push = (key, ts, obj) => {
      if (ts && dayjs(ts).isValid()) events.push({ key, ts: dayjs(ts).valueOf(), dateStr: fmt(ts), ...obj });
    };

    push('dob', person.dateOfBirth, { icon: <CalendarOutlined />, title: P.dateOfBirth, tone: TONES.rose });
    push('join', person.joinDate || person.createdAt, {
      icon: <HomeOutlined />, title: P.journeyJoinTemple, tone: TONES.amber,
      subtitle: person.department?.name ? `${P.journeyDeptPrefix}: ${person.department.name}` : undefined,
    });
    push('ord', person.ordinationDate, {
      icon: <SafetyCertificateOutlined />, title: P.journeyOrdination, tone: TONES.lavender,
      subtitle: person.precept ? `${P.precept}: ${person.precept}` : (person.preceptorName ? `${P.preceptorName}: ${person.preceptorName}` : undefined),
    });
    trainings.forEach(tr => push(`tr-${tr.id}`, tr.endDate || tr.startDate, {
      icon: <ReadOutlined />, title: tr.name || P.journeyTrainingDefault, tone: TONES.sky,
      subtitle: [t.training.courseTypes?.[tr.type] || tr.type, tr.me?.result ? t.training.results?.[tr.me.result] : null].filter(Boolean).join(' · '),
    }));
    rewards.forEach(r => push(`rw-${r.id}`, r.issuedDate, {
      icon: <TrophyOutlined />, title: r.title || P.journeyRewardDefault, tone: TONES.gold,
      subtitle: [r.reason, r.issuedBy].filter(Boolean).join(' · ') || undefined,
    }));
    // The 3 most recent duties that already happened
    duties
      .filter(d => d.dutyDate && !dayjs(d.dutyDate).isAfter(dayjs(), 'day'))
      .sort((a, b) => dayjs(b.dutyDate).valueOf() - dayjs(a.dutyDate).valueOf())
      .slice(0, 3)
      .forEach(d => push(`du-${d.id}`, d.dutyDate, {
        icon: <ScheduleOutlined />, tone: TONES.sage,
        title: t.dutySchedule.dutyTypes[d.dutyType] || `${P.journeyDutyPrefix} ${P.journeyDutyTemple}`,
        subtitle: d.shift ? `${t.common.shift}: ${t.dutySchedule.shifts[d.shift] || d.shift}` : undefined,
      }));

    return events.sort((a, b) => a.ts - b.ts);
  }, [person, trainings, rewards, duties, t]);

  if (state === 'loading') return <PageSpinner />;

  if (state !== 'ok') {
    return (
      <div className="pp-page">
        <section className="pp-card">
          <LotusEmpty
            description={state === 'notFound' ? P.notFound : P.loadDetailError}
            hint={state === 'notFound' ? P.notFoundHint : ''}
          />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/app/personnel')}>{P.backToList}</Button>
            {state === 'error' && <Button type="primary" icon={<ReloadOutlined />} onClick={() => { setState('loading'); loadPerson(); }}>{P.retry}</Button>}
          </div>
        </section>
      </div>
    );
  }

  const tone = toneOf(person.type);
  const st = statusToneOf(person.status);
  const sinceDate = person.ordinationDate || person.joinDate;
  const years = sinceDate ? Math.max(0, dayjs().diff(dayjs(sinceDate), 'year')) : 0;
  const upcomingDuties = duties.filter(d => d.dutyDate && !dayjs(d.dutyDate).isBefore(dayjs(), 'day')).length;

  const stats = [
    { label: P.statYearsOfPractice, value: years, icon: <ClockCircleOutlined />, tone: TONES.amber },
    { label: P.statTrainings, value: trainings.length, icon: <ReadOutlined />, tone: TONES.sky },
    { label: P.statDuties, value: duties.length, icon: <ScheduleOutlined />, tone: TONES.sage, hint: upcomingDuties ? (P.upcomingDuties || '+{n}').replace('{n}', upcomingDuties) : null },
    { label: P.statRewards, value: rewards.length, icon: <TrophyOutlined />, tone: TONES.gold },
  ];

  const tabItems = [
    {
      key: 'info',
      label: <span><UserOutlined /> {P.tabPersonalInfo}</span>,
      children: (
        <InfoGrid items={[
          { label: P.gender, value: genderLabel(t, person.gender), icon: <UserOutlined /> },
          { label: P.dateOfBirth, value: fmt(person.dateOfBirth), icon: <CalendarOutlined /> },
          { label: P.idCard, value: person.idCard && <span className="tbl-mono">{person.idCard}</span>, icon: <IdcardOutlined /> },
          { label: P.colPhone, value: person.phone && <a href={`tel:${person.phone}`} className="tbl-mono">{person.phone}</a>, icon: <PhoneOutlined /> },
          { label: t.common.email, value: person.email && <a href={`mailto:${person.email}`}>{person.email}</a>, icon: <MailOutlined /> },
          { label: P.address, value: person.address, icon: <EnvironmentOutlined />, wide: true },
          { label: P.emergencyContact, value: person.emergencyContact, icon: <AlertOutlined /> },
          { label: P.emergencyPhone, value: person.emergencyPhone && <a href={`tel:${person.emergencyPhone}`} className="tbl-mono">{person.emergencyPhone}</a>, icon: <PhoneOutlined /> },
        ]} />
      ),
    },
    {
      key: 'study',
      label: <span><BookOutlined /> {P.tabStudyInfo}</span>,
      children: (
        <InfoGrid items={[
          { label: P.ordinationDate, value: fmt(person.ordinationDate), icon: <SafetyCertificateOutlined /> },
          { label: P.preceptorName, value: person.preceptorName, icon: <UserOutlined /> },
          { label: P.precept, value: person.precept, icon: <SafetyCertificateOutlined /> },
          { label: P.buddhismEducation, value: person.buddhismEducation, icon: <ReadOutlined /> },
          { label: P.secularEducation, value: person.secularEducation, icon: <BookOutlined /> },
          { label: P.departmentLabel, value: person.department?.name, icon: <ApartmentOutlined /> },
          { label: P.joinDate, value: fmt(person.joinDate), icon: <HomeOutlined /> },
          { label: t.common.notes, value: person.notes, wide: true },
        ]} />
      ),
    },
    {
      key: 'journey',
      label: (
        <span>
          <NodeIndexOutlined /> {P.tabJourney}
          {journeyEvents.length > 0 && <span className="pd-tab-count">{journeyEvents.length}</span>}
        </span>
      ),
      children: <div className="pd-journey"><JourneyTimeline events={journeyEvents} t={t} /></div>,
    },
  ];

  return (
    <div className="pp-page">
      <div className="section-anim section-d0">
        <Button type="text" icon={<ArrowLeftOutlined />} className="pd-back" onClick={() => navigate('/app/personnel')}>
          {P.backToList}
        </Button>
      </div>

      {/* ── Hero ── */}
      <section className="pp-hero pd-hero section-anim section-d0">
        <div className="pp-hero__main">
          {person.photo
            ? <Avatar src={imgSrc(person.photo)} size={88} className="pd-hero__avatar" />
            : <Avatar size={88} className="pd-hero__avatar" style={{ background: tone.s, color: tone.c, fontSize: 34, fontWeight: 800 }}>{initialOf(person.fullName)}</Avatar>}
          <div style={{ minWidth: 0 }}>
            <h1 className="pp-hero__title">{person.dharmName || person.fullName}</h1>
            {person.dharmName && <div className="pd-hero__secular">{person.fullName}</div>}
            <div className="pp-hero__sub" style={{ marginTop: 8 }}>
              <span className="tbl-pill" style={{ color: tone.c, background: tone.s }}>{P.types[person.type] || person.type}</span>
              {person.position && <span className="tbl-pill" style={{ color: '#5a4636', background: '#f6efe4' }}>{positionLabel(t, person.position)}</span>}
              <span className="tbl-pill" style={{ color: st.c, background: st.s }}><span className="tbl-pill__dot" />{P.statuses[person.status] || person.status}</span>
              {person.code && <span className="tbl-mono tbl-muted">{person.code}</span>}
            </div>
          </div>
        </div>
        {canManage() && (
          <div className="pp-hero__actions">
            <Button icon={<EditOutlined />} className="pp-hero__btn" onClick={() => setEditOpen(true)}>{t.common.edit}</Button>
          </div>
        )}
      </section>

      {/* ── Stats ── */}
      <div className="pp-stats section-anim section-d1">
        {stats.map(s => (
          <div key={s.label} className="pp-stat" style={{ '--st': s.tone.c, '--st-soft': s.tone.s }}>
            <span className="pp-stat__icon">{s.icon}</span>
            <div className="pp-stat__body">
              <div className="pp-stat__value"><CountUp value={s.value} /></div>
              <div className="pp-stat__label">{s.label}</div>
              {s.hint && <div className="pd-stat__hint" style={{ color: s.tone.c }}>{s.hint}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <section className="pp-card pd-tabs section-anim section-d2">
        <Tabs defaultActiveKey="info" items={tabItems} />
      </section>

      <PersonnelFormModal
        open={editOpen}
        record={person}
        onClose={() => setEditOpen(false)}
        onSaved={() => { setEditOpen(false); loadPerson(); }}
      />
    </div>
  );
}
