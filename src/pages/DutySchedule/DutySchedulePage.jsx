import { useCreateParam } from '../../utils/useCreateParam';
import React, { useMemo, useRef, useState } from 'react';
import PageSpinner from '../../components/PageSpinner/PageSpinner';
import LotusEmpty from '../../components/LotusEmpty/LotusEmpty';
import CountUp from '../../components/CountUp/CountUp';
import {
  Table, Button, DatePicker, Popconfirm, Descriptions, Segmented, Tooltip, Avatar, Input, Select,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, UnorderedListOutlined, CalendarOutlined,
  FileExcelOutlined, ScheduleOutlined, ClockCircleOutlined, CheckCircleOutlined,
  StopOutlined, SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDutySchedulePage, DUTY_TYPES } from './useDutySchedulePage';
import { useLanguage } from '../../i18n/LanguageContext';
import { exportToExcel } from '../../utils/exportData';
import DutyCalendar, { monthGridRange, SHIFT_TONE, SHIFT_ORDER, STATUS_TONE } from './DutyCalendar';
import DutyFormModal from './DutyFormModal';
import { initialOf, personName, imgSrc, TONES } from '../Personnel/personnelShared';
import '../Personnel/peopleShared.css';
import './DutySchedulePage.css';

const { RangePicker } = DatePicker;

function Pill({ tone, dot, children }) {
  return (
    <span className="tbl-pill" style={{ color: tone.c, background: tone.s }}>
      {dot && <span className="tbl-pill__dot" />}{children}
    </span>
  );
}

export default function DutySchedulePage() {
  const {
    data, loading, dateRange, setDateRange,
    modalOpen, setModalOpen,
    editRecord, setEditRecord,
    personnel, canManage,
    fetchData, handleDelete,
  } = useDutySchedulePage();

  const { t, lang } = useLanguage();
  const D = t.dutySchedule;
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'calendar'
  const [calendarValue, setCalendarValue] = useState(dayjs());
  const [defaultDate, setDefaultDate] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const manage = canManage();
  useCreateParam(() => openModal(), manage);
  // Full-page spinner only until the first fetch settles (later range/month changes keep the layout)
  const sawLoading = useRef(false);
  const booted = useRef(false);
  if (loading) sawLoading.current = true;
  else if (sawLoading.current) booted.current = true;

  const openModal = (record = null, day = null) => {
    setEditRecord(record);
    setDefaultDate(day);
    setModalOpen(true);
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter(d => {
      if (filterType && d.dutyType !== filterType) return false;
      if (!q) return true;
      return [d.personnel?.fullName, d.personnel?.dharmName, d.notes].some(v => v?.toLowerCase().includes(q));
    });
  }, [data, search, filterType]);

  const stats = useMemo(() => ({
    total: data.length,
    pending: data.filter(d => d.status === 'chờ').length,
    done: data.filter(d => d.status === 'hoàn_thành').length,
    absent: data.filter(d => d.status === 'vắng' || d.status === 'đổi_ca').length,
  }), [data]);

  const handleExport = () => {
    exportToExcel(rows, [
      { header: D.fields.date, render: (r) => dayjs(r.dutyDate).format('DD/MM/YYYY') },
      { header: D.fields.dutyType, render: (r) => D.dutyTypes[r.dutyType] || r.dutyType },
      { header: D.colShift, render: (r) => D.shifts[r.shift] || r.shift },
      { header: D.colPerson, render: (r) => r.personnel?.dharmName || r.personnel?.fullName || '' },
      { header: D.fields.startTime, key: 'startTime' },
      { header: D.fields.endTime, key: 'endTime' },
      { header: t.common.status, render: (r) => D.statuses[r.status] || r.status },
      { header: t.common.notes, key: 'notes' },
    ], 'lich-truc');
  };

  // Load every day visible in the grid, including leading/trailing days of adjacent months
  const handleCalendarMonthChange = (value) => {
    setCalendarValue(value);
    setDateRange(monthGridRange(value));
  };

  const dutyPopoverContent = (d, close) => (
    <div style={{ width: 260 }}>
      <Descriptions column={1} size="small" style={{ marginBottom: manage ? 10 : 0 }}>
        <Descriptions.Item label={D.fields.person}><strong>{personName(d.personnel)}</strong></Descriptions.Item>
        <Descriptions.Item label={D.fields.date}>{dayjs(d.dutyDate).format('DD/MM/YYYY (ddd)')}</Descriptions.Item>
        <Descriptions.Item label={D.fields.dutyType}>{D.dutyTypes[d.dutyType] || d.dutyType}</Descriptions.Item>
        <Descriptions.Item label={D.fields.shift}>
          <Pill tone={SHIFT_TONE[d.shift] || SHIFT_TONE['cả_ngày']}>{D.shifts[d.shift] || d.shift}</Pill>
        </Descriptions.Item>
        {(d.startTime || d.endTime) && (
          <Descriptions.Item label={D.colTime}><span className="pp-time">{d.startTime} – {d.endTime}</span></Descriptions.Item>
        )}
        <Descriptions.Item label={t.common.status}>
          <Pill dot tone={STATUS_TONE[d.status] || STATUS_TONE['chờ']}>{D.statuses[d.status] || d.status}</Pill>
        </Descriptions.Item>
        {d.notes && <Descriptions.Item label={t.common.notes}>{d.notes}</Descriptions.Item>}
      </Descriptions>
      {manage && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #f3ebdf', paddingTop: 8 }}>
          <Popconfirm
            title={D.confirmDelete}
            onConfirm={() => { close(); handleDelete(d.id); }}
            okText={t.common.delete} cancelText={t.common.cancel}
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>{t.common.delete}</Button>
          </Popconfirm>
          <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => { close(); openModal(d); }}>
            {t.common.edit}
          </Button>
        </div>
      )}
    </div>
  );

  const isToday = (v) => dayjs(v).isSame(dayjs(), 'day');

  const columns = [
    {
      title: D.colDate,
      dataIndex: 'dutyDate',
      width: 150,
      render: (v) => (
        <div>
          <div className="tbl-mono" style={{ fontWeight: 600, color: '#3e2c1f' }}>{dayjs(v).format('DD/MM/YYYY')}</div>
          <div className="tbl-muted" style={{ fontSize: 12, textTransform: 'capitalize' }}>
            {isToday(v) ? <span style={{ color: TONES.sage.c, fontWeight: 600 }}>{D.today}</span> : dayjs(v).format('dddd')}
          </div>
        </div>
      ),
      sorter: (a, b) => String(a.dutyDate).localeCompare(String(b.dutyDate))
        || SHIFT_ORDER.indexOf(a.shift) - SHIFT_ORDER.indexOf(b.shift),
      defaultSortOrder: 'ascend',
    },
    {
      title: D.colPerson,
      key: 'person',
      width: 220,
      render: (_, r) => {
        const p = r.personnel;
        if (!p) return <span className="tbl-muted">—</span>;
        return (
          <div className="person-cell">
            {p.photo
              ? <Avatar src={imgSrc(p.photo)} size={34} className="person-cell__avatar" />
              : <Avatar size={34} className="person-cell__avatar" style={{ background: TONES.amber.s, color: TONES.amber.c, fontWeight: 700 }}>{initialOf(p.fullName)}</Avatar>}
            <div className="person-cell__text">
              <div className="person-cell__name">{personName(p)}</div>
              {p.dharmName && p.fullName && <div className="person-cell__sub"><span>{p.fullName}</span></div>}
            </div>
          </div>
        );
      },
      sorter: (a, b) => personName(a.personnel).localeCompare(personName(b.personnel), lang),
    },
    {
      title: D.colDuty,
      dataIndex: 'dutyType',
      width: 170,
      render: (v) => <span style={{ color: '#5a4636', fontWeight: 500 }}>{D.dutyTypes[v] || v}</span>,
    },
    {
      title: D.colShift,
      dataIndex: 'shift',
      width: 170,
      render: (v, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Pill tone={SHIFT_TONE[v] || SHIFT_TONE['cả_ngày']}>{D.shifts[v] || v}</Pill>
          {r.startTime && r.endTime && <span className="pp-time" style={{ fontSize: 12, fontWeight: 500 }}>{r.startTime}–{r.endTime}</span>}
        </div>
      ),
    },
    {
      title: t.common.status,
      dataIndex: 'status',
      width: 140,
      render: (v) => <Pill dot tone={STATUS_TONE[v] || STATUS_TONE['chờ']}>{D.statuses[v] || v}</Pill>,
    },
    ...(manage ? [{
      title: '',
      key: 'actions',
      width: 96,
      align: 'right',
      render: (_, r) => (
        <div className="personnel-action-group">
          <Tooltip title={t.common.edit}>
            <Button type="text" aria-label={t.common.edit} icon={<EditOutlined />} onClick={() => openModal(r)} />
          </Tooltip>
          <Popconfirm title={D.confirmDelete} onConfirm={() => handleDelete(r.id)} okText={t.common.delete} cancelText={t.common.cancel} okButtonProps={{ danger: true }}>
            <Tooltip title={t.common.delete}>
              <Button type="text" danger aria-label={t.common.delete} icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    }] : []),
  ];

  if (!booted.current && !data.length) return <PageSpinner />;

  const statTiles = [
    { key: 'total', label: D.statTotal, value: stats.total, icon: <ScheduleOutlined />, tone: TONES.amber },
    { key: 'pending', label: D.statuses['chờ'], value: stats.pending, icon: <ClockCircleOutlined />, tone: TONES.sky },
    { key: 'done', label: D.statuses['hoàn_thành'], value: stats.done, icon: <CheckCircleOutlined />, tone: TONES.sage },
    { key: 'absent', label: D.statAbsent, value: stats.absent, icon: <StopOutlined />, tone: TONES.rose },
  ];
  const isFiltered = Boolean(search.trim() || filterType);

  return (
    <div className="pp-page">
      {/* ── Header ── */}
      <section className="pp-hero section-anim section-d0">
        <div className="pp-hero__main">
          <div className="pp-hero__icon"><ScheduleOutlined /></div>
          <div>
            <h1 className="pp-hero__title">{D.title}</h1>
            <p className="pp-hero__sub">{D.subtitle}</p>
          </div>
        </div>
        {manage && (
          <div className="pp-hero__actions">
            <Button type="primary" icon={<PlusOutlined />} className="pp-hero__btn" onClick={() => openModal()}>
              {D.addNew}
            </Button>
          </div>
        )}
      </section>

      {/* ── Stats (current range) ── */}
      <div className="pp-stats section-anim section-d1">
        {statTiles.map(s => (
          <div key={s.key} className="pp-stat" style={{ '--st': s.tone.c, '--st-soft': s.tone.s }}>
            <span className="pp-stat__icon">{s.icon}</span>
            <div className="pp-stat__body">
              <div className="pp-stat__value"><CountUp value={s.value} /></div>
              <div className="pp-stat__label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <section className={`section-anim section-d2${viewMode === 'table' ? ' pp-card' : ''}`}>
        {/* ── Toolbar ── */}
        <div className={`pp-toolbar${viewMode === 'calendar' ? ' duty-toolbar--calendar' : ''}`}>
          <Segmented
            className="pp-seg"
            value={viewMode}
            onChange={(k) => {
              setViewMode(k);
              if (k === 'calendar') setDateRange(monthGridRange(calendarValue));
            }}
            options={[
              { value: 'table', icon: <UnorderedListOutlined />, label: D.viewTable },
              { value: 'calendar', icon: <CalendarOutlined />, label: D.viewCalendar },
            ]}
          />
          {viewMode === 'table' && (
            <>
              <RangePicker
                className="pp-picker"
                value={dateRange}
                onChange={setDateRange}
                format="DD/MM/YYYY"
                placeholder={[D.rangePickerFrom, D.rangePickerTo]}
                allowClear={false}
                presets={[
                  { label: D.presetThisWeek, value: [dayjs().startOf('week'), dayjs().endOf('week')] },
                  { label: D.presetNextWeek, value: [dayjs().add(1, 'week').startOf('week'), dayjs().add(1, 'week').endOf('week')] },
                  { label: D.presetThisMonth, value: [dayjs().startOf('month'), dayjs().endOf('month')] },
                ]}
              />
              <Input
                className="pp-search"
                placeholder={D.searchPlaceholder}
                prefix={<SearchOutlined style={{ color: '#bfae99' }} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
              />
              <Select className="pp-select" value={filterType} onChange={setFilterType}
                options={[{ value: '', label: D.allDutyTypes }, ...DUTY_TYPES.map(k => ({ value: k, label: D.dutyTypes[k] }))]} />
            </>
          )}
          <div className="pp-toolbar__end">
            <Button className="pp-tool-btn excel-export" icon={<FileExcelOutlined />} onClick={handleExport} disabled={!rows.length}>
              {t.common.exportExcel}
            </Button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <Table
            dataSource={rows}
            columns={columns}
            rowKey="id"
            loading={loading}
            size="middle"
            className="personnel-table"
            scroll={{ x: 'max-content' }}
            pagination={rows.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
            rowClassName={(r) => (isToday(r.dutyDate) ? 'duty-row--today' : '')}
            locale={{
              emptyText: isFiltered
                ? <LotusEmpty description={D.emptyFiltered} hint={D.emptyFilteredHint} />
                : <LotusEmpty description={D.emptyRange} hint={manage ? D.emptyRangeHint : ''} />,
            }}
          />
        ) : (
          <DutyCalendar
            data={data}
            month={calendarValue}
            onMonthChange={handleCalendarMonthChange}
            canManage={manage}
            onAdd={(day) => openModal(null, day)}
            onEdit={(d) => openModal(d)}
            onDelete={handleDelete}
            renderDetails={dutyPopoverContent}
            t={t}
            lang={lang}
          />
        )}
      </section>

      <DutyFormModal
        open={modalOpen}
        record={editRecord}
        defaultDate={defaultDate}
        personnel={personnel}
        t={t}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); fetchData(); }}
      />
    </div>
  );
}
