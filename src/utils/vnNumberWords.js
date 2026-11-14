// Vietnamese number → words for receipts ("Bằng chữ"), e.g. 1_250_000 → "Một triệu hai trăm năm mươi nghìn đồng".
const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const UNITS = ['', 'nghìn', 'triệu', 'tỷ'];

/** Reads a 0–999 group. `full` forces "không trăm"/"linh" when a higher group precedes it. */
function readGroup(n, full) {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;
  const parts = [];
  if (h > 0 || full) parts.push(`${DIGITS[h]} trăm`);
  if (t > 1) {
    parts.push(`${DIGITS[t]} mươi`);
    if (u === 1) parts.push('mốt');
    else if (u === 4) parts.push('tư');
    else if (u === 5) parts.push('lăm');
    else if (u > 0) parts.push(DIGITS[u]);
  } else if (t === 1) {
    parts.push('mười');
    if (u === 5) parts.push('lăm');
    else if (u > 0) parts.push(DIGITS[u]);
  } else if (u > 0) {
    if (h > 0 || full) parts.push('linh');
    parts.push(DIGITS[u]);
  }
  return parts.join(' ');
}

export function numberToVietnamese(value) {
  let n = Math.round(Math.abs(Number(value) || 0));
  if (n === 0) return 'không';
  const groups = [];
  while (n > 0) { groups.push(n % 1000); n = Math.floor(n / 1000); }

  // Groups of 3 digits, with "tỷ" repeating for very large numbers (nghìn tỷ, triệu tỷ…)
  const words = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) {
      if (i % 3 === 0 && i > 0 && words.length) words.push('tỷ');
      continue;
    }
    const isHighest = i === groups.length - 1;
    words.push(readGroup(g, !isHighest));
    const unit = UNITS[i % 3 === 0 && i > 0 ? 3 : i % 3];
    if (unit) words.push(unit);
    if (i % 3 === 0 && i > 3) words.push('tỷ');
  }
  return words.join(' ').replace(/\s+/g, ' ').replace(/(tỷ\s)+tỷ/g, 'tỷ').trim();
}

/** "Một triệu hai trăm nghìn đồng" (capitalised, with currency). */
export function amountInWords(value) {
  const s = numberToVietnamese(value);
  return `${s.charAt(0).toUpperCase()}${s.slice(1)} đồng`;
}
