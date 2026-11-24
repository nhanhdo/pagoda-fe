import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Popover, Avatar, Tooltip, Popconfirm } from 'antd';
import {
  LeftOutlined, RightOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  ClockCircleOutlined, CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { solarToLunar } from '../../utils/lunarCalendar';

// Phones (≤767px) show shifts as bars only; the day's details live in the agenda below the grid,
// so a popover there would just cover the calendar.
const NARROW_QUERY = '(max-width: 767px)';
function useNarrow() {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(NARROW_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(NARROW_QUERY);
    if (!mq) return undefined;
    const on = () => setNarrow(mq.matches);
    on();
    // Safari < 14 only has the old addListener API
    if (mq.addEventListener) mq.addEventListener('change', on); else mq.addListener?.(on);
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', on); else mq.removeListener?.(on); };
  }, []);
  return narrow;
}

export const SHIFT_TONE = {
  'sáng':    { c: '#c98a1e', s: '#fdf3dc', dot: '#e0a83a' },
  'chiều':   { c: '#d0674b', s: '#fdece6', dot: '#e98a6a' },
  'tối':     { c: '#7a5fc0', s: '#f1edfb', dot: '#8b6fc9' },
  'cả_ngày': { c: '#3f8461', s: '#e8f4ed', dot: '#4f9a72' },
};
export const SHIFT_ORDER = ['sáng', 'chiều', 'tối', 'cả_ngày'];
export const STATUS_TONE = {
  'chờ':        { c: '#3f7fb5', s: '#e9f1fb' },
  'hoàn_thành': { c: '#3f8461', s: '#e8f4ed' },
  'vắng':       { c: '#c4545d', s: '#fdeeee' },
  'đổi_ca':     { c: '#b9841f', s: '#fdf3dc' },
};

/** Monday-first grid covering every day shown for the month. */
export function monthGridRange(month) {
  const first = month.startOf('month');
  const start = first.subtract((first.day() + 6) % 7, 'day').startOf('day');
  const last = month.endOf('month');
  const end = last.add(6 - ((last.day() + 6) % 7), 'day').endOf('day');
  return [start, end];
}

const dateKey = (v) => (typeof v === 'string' ? v.slice(0, 10) : dayjs(v).format('YYYY-MM-DD'));
const personName = (d) => d.personnel?.dharmName || d.personnel?.fullName || '—';
const initialOf = (name = '') => name.trim().split(/\s+/).pop()?.[0]?.toUpperCase() || '?';

export default function DutyCalendar({
  data, month, onMonthChange, canManage, onAdd, onEdit, onDelete, renderDetails, t, lang,
}) {
  const D = t.dutySchedule;
  const [selected, setSelected] = useState(dayjs());
  const [hiddenShifts, setHiddenShifts] = useState([]);
  const [openId, setOpenId] = useState(null);
  const narrow = useNarrow();
  const agendaRef = useRef(null);
  const revealTimer = useRef(null);
  // On phones, tapping a shift brings the selected day's details into view
  const revealAgenda = () => {
    clearTimeout(revealTimer.current);
    revealTimer.current = setTimeout(() => agendaRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }), 60);
  };
  useEffect(() => () => clearTimeout(revealTimer.current), []);
  // A popover left open would point at nothing once the layout switches to phone mode
  useEffect(() => { if (narrow) setOpenId(null); }, [narrow]);

  const byDate = useMemo(() => {
    const map = new Map();
    data.forEach(d => {
      const k = dateKey(d.dutyDate);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(d);
    });
    map.forEach(list => list.sort((a, b) =>
      SHIFT_ORDER.indexOf(a.shift) - SHIFT_ORDER.indexOf(b.shift) || String(a.startTime || '').localeCompare(String(b.startTime || ''))));
    return map;
  }, [data]);

  const [gridStart, gridEnd] = monthGridRange(month);
  const cellCount = gridEnd.startOf('day').diff(gridStart, 'day') + 1;
  const days = Array.from({ length: cellCount }, (_, i) => gridStart.add(i, 'day'));

  const inMonth = data.filter(d => dayjs(dateKey(d.dutyDate)).isSame(month, 'month'));
  const shiftCounts = SHIFT_ORDER.map(s => inMonth.filter(d => d.shift === s).length);
  const visible = (d) => !hiddenShifts.includes(d.shift);
  const toggleShift = (s) => setHiddenShifts(h => (h.includes(s) ? h.filter(x => x !== s) : [...h, s]));

  const monthTitle = lang === 'en'
    ? month.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : `Tháng ${month.month() + 1}, ${month.year()}`;

  const goMonth = (m) => {
    onMonthChange(m);
    setSelected(m.isSame(dayjs(), 'month') ? dayjs() : m.startOf('month'));
  };

  const selectedDuties = (byDate.get(selected.format('YYYY-MM-DD')) || []).filter(visible);
  const selLunar = solarToLunar(selected.date(), selected.month() + 1, selected.year());

  return (
    <div className="dc-root">
      {/* ── Toolbar ── */}
      <div className="dc-toolbar">
        <div className="dc-nav">
          <Tooltip title={D.prevMonth}>
            <Button aria-label={D.prevMonth} className="dc-nav__btn" icon={<LeftOutlined />} onClick={() => goMonth(month.subtract(1, 'month'))} />
          </Tooltip>
          <h3 className="dc-nav__title">{monthTitle}</h3>
          <Tooltip title={D.nextMonth}>
            <Button aria-label={D.nextMonth} className="dc-nav__btn" icon={<RightOutlined />} onClick={() => goMonth(month.add(1, 'month'))} />
          </Tooltip>
          {!month.isSame(dayjs(), 'month') && (
            <Button className="dc-today-btn" onClick={() => goMonth(dayjs())}>{D.today}</Button>
          )}
        </div>
        <div className="dc-filters" title={D.filterHint}>
          {SHIFT_ORDER.map((s, i) => {
            const tone = SHIFT_TONE[s];
            const off = hiddenShifts.includes(s);
            return (
              <button
                key={s}
                type="button"
                className={`dc-chip${off ? ' is-off' : ''}`}
                style={{ '--c': tone.c, '--s': tone.s, '--dot': tone.dot }}
                onClick={() => toggleShift(s)}
                aria-pressed={!off}
              >
                <span className="dc-chip__dot" />
                {D.shifts[s]}
                <strong>{shiftCounts[i]}</strong>
              </button>
            );
          })}
          <span className="dc-total">{D.monthTotal.replace('{n}', inMonth.length)}</span>
        </div>
      </div>

      <div className="dc-body">
        {/* ── Month grid ── */}
        <div className="dc-grid-wrap">
          <div className="dc-weekdays">
            {D.weekdaysShort.map((w, i) => (
              <div key={w} className={`dc-weekday${i >= 5 ? ' is-weekend' : ''}${i === 6 ? ' is-sun' : ''}`}>{w}</div>
            ))}
          </div>
          <div className="dc-grid">
            {days.map(day => {
              const key = day.format('YYYY-MM-DD');
              const duties = (byDate.get(key) || []).filter(visible);
              const outside = day.month() !== month.month();
              const isToday = day.isSame(dayjs(), 'day');
              const isSel = day.isSame(selected, 'day');
              const wd = (day.day() + 6) % 7;
              const lunar = solarToLunar(day.date(), day.month() + 1, day.year());
              const holyDay = lunar.day === 1 || lunar.day === 15;
              return (
                <div
                  key={key}
                  className={[
                    'dc-cell',
                    outside && 'is-outside',
                    isToday && 'is-today',
                    isSel && 'is-selected',
                    wd >= 5 && 'is-weekend',
                  ].filter(Boolean).join(' ')}
                  onClick={() => { setSelected(day); if (narrow && duties.length) revealAgenda(); }}
                  onDoubleClick={() => canManage && !outside && onAdd(day)}
                >
                  <div className="dc-cell__head">
                    <button type="button" className="dc-cell__num dc-day-button" aria-pressed={isSel}
                      aria-label={day.toDate().toLocaleDateString(lang === 'en' ? 'en-GB' : 'vi-VN', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}>
                      {day.date()}
                    </button>
                    <span className={`dc-cell__lunar${holyDay ? ' is-holy' : ''}`}>
                      {lunar.day === 1 ? `${lunar.day}/${lunar.month}` : lunar.day}
                    </span>
                    {canManage && !outside && (
                      <button
                        type="button"
                        className="dc-cell__add"
                        aria-label={D.addShift}
                        onClick={(e) => { e.stopPropagation(); onAdd(day); }}
                      >
                        <PlusOutlined />
                      </button>
                    )}
                  </div>
                  <div className="dc-cell__events">
                    {duties.slice(0, 3).map(d => {
                      const tone = SHIFT_TONE[d.shift] || SHIFT_TONE['cả_ngày'];
                      if (narrow) {
                        return (
                          <div
                            key={d.id}
                            className="dc-event"
                            style={{ '--c': tone.c, '--s': tone.s, '--dot': tone.dot }}
                            onClick={(e) => { e.stopPropagation(); setSelected(day); revealAgenda(); }}
                            onDoubleClick={(e) => e.stopPropagation()}
                          >
                            <span className="dc-event__dot" />
                            <span className="dc-event__name">{personName(d)}</span>
                            {d.startTime && <span className="dc-event__time">{d.startTime}</span>}
                          </div>
                        );
                      }
                      return (
                        <Popover
                          key={d.id}
                          open={openId === d.id}
                          onOpenChange={(v) => setOpenId(v ? d.id : null)}
                          trigger="click"
                          placement="rightTop"
                          autoAdjustOverflow
                          styles={{ root: { maxWidth: 'min(360px, calc(100vw - 24px))' } }}
                          title={<span className="dc-pop__title">{D.shifts[d.shift] || d.shift} · {dayjs(d.dutyDate).format('DD/MM')}</span>}
                          content={renderDetails(d, () => setOpenId(null))}
                        >
                          <button type="button"
                            aria-expanded={openId === d.id}
                            aria-label={`${personName(d)} · ${D.shifts[d.shift] || d.shift}`}
                            onKeyDown={event => { if (event.key === 'Escape') setOpenId(null); }}
                            className="dc-event"
                            style={{ '--c': tone.c, '--s': tone.s, '--dot': tone.dot }}
                            onClick={(e) => { e.stopPropagation(); setSelected(day); }}
                            onDoubleClick={(e) => e.stopPropagation()}
                          >
                            <span className="dc-event__dot" />
                            <span className="dc-event__name">{personName(d)}</span>
                            {d.startTime && <span className="dc-event__time">{d.startTime}</span>}
                          </button>
                        </Popover>
                      );
                    })}
                    {duties.length > 3 && (
                      <span className="dc-more">{D.moreShifts.replace('{n}', duties.length - 3)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Day agenda ── */}
        <aside className="dc-agenda" ref={agendaRef}>
          <div className="dc-agenda__head">
            <div className="dc-agenda__date">
              <span className="dc-agenda__day">{selected.format('DD')}</span>
              <div>
                <div className="dc-agenda__weekday">
                  {selected.toDate().toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', { weekday: 'long' })}
                </div>
                <div className="dc-agenda__full">{selected.format('DD/MM/YYYY')}</div>
                <div className="dc-agenda__lunar">
                  <CalendarOutlined /> {D.lunarPrefix} {selLunar.day}/{selLunar.month}{selLunar.leap ? '*' : ''} · {selLunar.yearName}
                </div>
              </div>
            </div>
            {canManage && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => onAdd(selected)} className="dc-agenda__add">
                {D.addShift}
              </Button>
            )}
          </div>

          {selectedDuties.length === 0 ? (
            <div className="dc-agenda__empty">
              <span className="dc-agenda__empty-icon"><CalendarOutlined /></span>
              <div>{D.dayEmpty}</div>
              {canManage && <div className="dc-agenda__empty-hint">{D.dayEmptyHint}</div>}
            </div>
          ) : (
            <ul className="dc-agenda__list">
              {selectedDuties.map(d => {
                const tone = SHIFT_TONE[d.shift] || SHIFT_TONE['cả_ngày'];
                const st = STATUS_TONE[d.status] || STATUS_TONE['chờ'];
                return (
                  <li key={d.id} className="dc-item" style={{ '--c': tone.c, '--s': tone.s, '--dot': tone.dot }}>
                    <div className="dc-item__rail" />
                    <div className="dc-item__main">
                      <div className="dc-item__top">
                        <span className="dc-item__shift">{D.shifts[d.shift] || d.shift}</span>
                        {(d.startTime || d.endTime) && (
                          <span className="dc-item__time"><ClockCircleOutlined /> {d.startTime || '—'} – {d.endTime || '—'}</span>
                        )}
                      </div>
                      <div className="dc-item__person">
                        <Avatar size={30} style={{ background: tone.s, color: tone.c, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                          {initialOf(personName(d))}
                        </Avatar>
                        <div style={{ minWidth: 0 }}>
                          <div className="dc-item__name">{personName(d)}</div>
                          <div className="dc-item__type">{D.dutyTypes[d.dutyType] || d.dutyType}</div>
                        </div>
                      </div>
                      <div className="dc-item__foot">
                        <span className="tbl-pill" style={{ color: st.c, background: st.s }}>
                          <span className="tbl-pill__dot" />{D.statuses[d.status] || d.status}
                        </span>
                        {canManage && (
                          <span className="dc-item__actions">
                            <Tooltip title={t.common.edit}>
                              <Button aria-label={t.common.edit} type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(d)} />
                            </Tooltip>
                            <Popconfirm title={D.confirmDelete} onConfirm={() => onDelete(d.id)} okText={t.common.delete} cancelText={t.common.cancel} okButtonProps={{ danger: true }}>
                              <Tooltip title={t.common.delete}>
                                <Button aria-label={t.common.delete} type="text" size="small" danger icon={<DeleteOutlined />} />
                              </Tooltip>
                            </Popconfirm>
                          </span>
                        )}
                      </div>
                      {d.notes && <div className="dc-item__notes">{d.notes}</div>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
