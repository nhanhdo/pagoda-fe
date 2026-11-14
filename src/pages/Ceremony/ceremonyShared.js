import dayjs from 'dayjs';

export const KIND_TONE = {
  'cầu_an':   { c: '#3f8461', s: '#e8f4ed' },
  'cầu_siêu': { c: '#7a5fc0', s: '#f1edfb' },
  'cả_hai':   { c: '#b06f2c', s: '#fbf1e4' },
};

export const STATUS_TONE = {
  'đang_thờ':    { c: '#b06f2c', s: '#fbf1e4' },
  'đã_thỉnh_về': { c: '#8c7a6b', s: '#f2ede6' },
};

const MONTHS_VI = ['Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Mười một', 'Chạp'];

/** "Rằm tháng Giêng", "Mùng 8 tháng Tư", "Ngày 19 tháng Chín" (vi) or "Lunar 15/1" (en). */
export function lunarLabel(day, month, lang = 'vi') {
  if (!day || !month) return '';
  if (lang === 'en') return `Lunar ${day}/${month}`;
  const dayPart = day === 15 ? 'Rằm' : day <= 10 ? `Mùng ${day}` : `Ngày ${day}`;
  return `${dayPart} tháng ${MONTHS_VI[month - 1]}`;
}

export const daysUntil = (dateStr) => (dateStr ? dayjs(dateStr).startOf('day').diff(dayjs().startOf('day'), 'day') : null);

export const displayName = (f) => (f ? (f.dharmName ? `${f.fullName} (${f.dharmName})` : f.fullName) : '');

export const QUICK_OFFERINGS = [100000, 200000, 300000, 500000, 1000000, 2000000];

export const emptyEntry = (kind) => (kind === 'cầu_an'
  ? { fullName: '', birthYear: null, address: '' }
  : { fullName: '', deathYear: null, deathLunarDay: null, deathLunarMonth: null, ageAtDeath: null, memorialTabletId: null });
