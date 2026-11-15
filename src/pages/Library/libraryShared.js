import dayjs from 'dayjs';
import { solarToLunar } from '../../utils/lunarCalendar';
import { imgSrc } from '../Personnel/personnelShared';

export const KINDS = ['phat', 'bo_tat', 'thanh_tang'];
export const KIND_TONE = {
  phat:   { c: '#b8741f', s: '#fbf0de', halo: 'rgba(245, 196, 110, .55)' },
  bo_tat: { c: '#3a8a7a', s: '#e4f3ee', halo: 'rgba(150, 215, 195, .55)' },
  thanh_tang: { c: '#7d62b8', s: '#efeafa', halo: 'rgba(196, 178, 235, .5)' },
};

// Frontend /public assets (e.g. "/buddha.png") are served by the app itself; uploads come from the API
export const figureImg = (p) => (!p ? null : /^\/[^/]+\.(png|jpe?g|webp|gif)$/i.test(p) ? p : imgSrc(p));

/**
 * Map "day/month" (lunar, non-leap) → next solar date, scanning ~13 months from today.
 * Day 30 in a 29-day lunar month falls back to day 29 (as temples do).
 */
let cache = { key: '', map: null };
function upcomingLunarMap() {
  const today = dayjs().startOf('day');
  const key = today.format('YYYY-MM-DD');
  if (cache.key === key) return cache.map;
  const map = new Map();
  let prev = null;
  for (let i = 0; i <= 400; i++) {
    const d = today.add(i, 'day');
    const l = solarToLunar(d.date(), d.month() + 1, d.year());
    if (prev && !prev.l.leap && prev.l.day === 29 && l.day === 1) {
      const k30 = `30/${prev.l.month}`;
      if (!map.has(k30)) map.set(k30, prev.d);
    }
    if (!l.leap) {
      const k = `${l.day}/${l.month}`;
      if (!map.has(k)) map.set(k, d);
    }
    prev = { d, l };
  }
  cache = { key, map };
  return map;
}

/** Each feast day with its next solar date and days remaining, soonest first. */
export function feastSchedule(feastDays = []) {
  const map = upcomingLunarMap();
  const today = dayjs().startOf('day');
  return (feastDays || [])
    .map(f => {
      const date = map.get(`${f.day}/${f.month}`) || null;
      return { ...f, date, diff: date ? date.diff(today, 'day') : null };
    })
    .sort((a, b) => (a.diff ?? 9999) - (b.diff ?? 9999));
}

export const nextFeast = (feastDays) => feastSchedule(feastDays)[0] || null;

/** "Vía còn 5 ngày" / "Hôm nay là ngày vía" */
export const feastCountdown = (L, f) => {
  if (!f || f.diff == null) return '';
  if (f.diff === 0) return L.feastToday;
  return L.feastIn.replace('{n}', f.diff);
};

/** Tiểu sử sections; entries from the first library version fall back to their old fields. */
export function bioSectionsOf(f, L) {
  if (f?.bioSections?.length) return f.bioSections;
  return [
    f?.mantra && { heading: L.mantra, body: f.mantra },
    f?.otherNames && { heading: L.otherNames, body: f.otherNames },
    f?.realm && { heading: L.realm, body: f.realm },
    f?.symbols && { heading: L.symbols, body: f.symbols },
  ].filter(Boolean);
}
