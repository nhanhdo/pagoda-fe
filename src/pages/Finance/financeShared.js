import dayjs from 'dayjs';

export const vnd = (v) => `${Math.round(Number(v) || 0).toLocaleString('vi-VN')} ₫`;

export function compactVnd(val, lang = 'vi') {
  const n = Number(val || 0);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  const fmt = (x) => x.toLocaleString(lang === 'en' ? 'en-US' : 'vi-VN', { maximumFractionDigits: 1 });
  if (lang === 'en') {
    if (abs >= 1e9) return `${sign}${fmt(abs / 1e9)}B ₫`;
    if (abs >= 1e6) return `${sign}${fmt(abs / 1e6)}M ₫`;
    if (abs >= 1e3) return `${sign}${fmt(abs / 1e3)}K ₫`;
    return `${sign}${fmt(abs)} ₫`;
  }
  if (abs >= 1e9) return `${sign}${fmt(abs / 1e9)} tỷ`;
  if (abs >= 1e6) return `${sign}${fmt(abs / 1e6)} triệu`;
  if (abs >= 1e3) return `${sign}${fmt(abs / 1e3)} nghìn`;
  return `${sign}${fmt(abs)} ₫`;
}

export const STATUS_TONE = {
  'chờ_duyệt': { c: '#b9841f', s: '#fdf3dc' },
  'đã_duyệt':  { c: '#3f8461', s: '#e8f4ed' },
  'từ_chối':   { c: '#c4545d', s: '#fdeeee' },
};

export const CATEGORY_COLOR = {
  'điện_nước': '#4d8fc7', 'trai_phạn': '#e0a454', 'xây_dựng_sửa_chữa': '#8b6fc9',
  'lễ_hội': '#d9646c', 'từ_thiện': '#3a9483', 'văn_phòng_phẩm': '#b8893a', 'khác': '#a8978a',
};

export const softOf = (hex = '#c47f36') => `${hex}1f`;

export const personName = (u) => u?.personnel?.dharmName || u?.personnel?.fullName || u?.username || '—';

export const ymd = (d) => (d ? dayjs(d).format('YYYY-MM-DD') : undefined);

export function presetRanges(F) {
  return [
    { key: 'thisMonth',   label: F.presets.thisMonth,   value: [dayjs().startOf('month'), dayjs().endOf('month')] },
    { key: 'lastMonth',   label: F.presets.lastMonth,   value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
    { key: 'last3Months', label: F.presets.last3Months, value: [dayjs().subtract(2, 'month').startOf('month'), dayjs().endOf('month')] },
    { key: 'thisYear',    label: F.presets.thisYear,    value: [dayjs().startOf('year'), dayjs().endOf('year')] },
  ];
}

export const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];
