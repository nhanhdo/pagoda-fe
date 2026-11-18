import { BASE_URL } from '../News/useNewsPage';

/* Shared palette + label helpers for the people pages (personnel, duty, work, department). */

export const TYPE_TONE = {
  tang_ni:          { c: '#c47f36', s: '#fbf1e4' },
  cu_si:            { c: '#4f9a72', s: '#e8f4ed' },
  phat_tu:          { c: '#4d8fc7', s: '#e9f1fb' },
  tinh_nguyen_vien: { c: '#8b6fc9', s: '#f1edfb' },
  nhan_vien:        { c: '#d9646c', s: '#fdeeee' },
};
export const toneOf = (type) => TYPE_TONE[type] || TYPE_TONE.tang_ni;

export const STATUS_TONE = {
  'đang_hoạt_động': { c: '#3f8461', s: '#e8f4ed' },
  'tạm_nghỉ':       { c: '#b9841f', s: '#fdf3dc' },
  'đã_rời':         { c: '#8c7a6b', s: '#f2ede6' },
};
export const statusToneOf = (s) => STATUS_TONE[s] || STATUS_TONE['đã_rời'];

export const POSITIONS = [
  'trụ_trì', 'phó_trụ_trì', 'tri_khách', 'thủ_quỹ', 'thư_ký',
  'ban_hộ_tự', 'trưởng_ban', 'phó_ban', 'thành_viên', 'tình_nguyện_viên',
];

export const TONES = {
  amber:    { c: '#c47f36', s: '#fbf1e4' },
  sage:     { c: '#4f9a72', s: '#e8f4ed' },
  sky:      { c: '#4d8fc7', s: '#e9f1fb' },
  lavender: { c: '#8b6fc9', s: '#f1edfb' },
  rose:     { c: '#d9646c', s: '#fdeeee' },
  gold:     { c: '#d39a2c', s: '#fdf3dc' },
  muted:    { c: '#8c7a6b', s: '#f2ede6' },
};

const capitalize = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

export const positionLabel = (t, p) => (!p ? '' : t.personnel.positions?.[p] || capitalize(p.replace(/_/g, ' ')));
export const genderLabel = (t, g) => (g === 'nam' ? t.personnel.form.genderMale : g === 'nữ' ? t.personnel.form.genderFemale : g || '');
export const initialOf = (name = '') => name.trim().split(/\s+/).pop()?.[0]?.toUpperCase() || '?';
export const personName = (p) => p?.dharmName || p?.fullName || '—';
export const personOptionLabel = (p) => (p.dharmName ? `${p.dharmName} (${p.fullName})` : p.fullName);
export const imgSrc = (p) => (!p ? null : p.startsWith('http') || p.startsWith('blob:') ? p : `${BASE_URL}${p}`);

/**
 * Column pinning for list tables. The actions column is always pinned right so edit/delete stay
 * reachable on phones; the identity column is pinned left only when there is room for it (≥768px),
 * otherwise a 260px pinned name would leave no space for anything else on a 360px screen.
 */
export const pinLeft = () => (typeof window !== 'undefined' && window.matchMedia?.('(min-width: 768px)').matches ? 'left' : undefined);
export const PIN_RIGHT = 'right';
