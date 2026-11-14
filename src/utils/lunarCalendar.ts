// Vietnamese Lunar Calendar (Âm lịch Việt Nam), UTC+7.
// Hồ Ngọc Đức's month/leap-month structure with Meeus' full new-moon algorithm — the simplified
// series put some near-midnight new moons on the wrong day (e.g. Vu Lan 2026). Mirrors backend/src/utils/lunar.js.

const TZ = 7;
const DR = Math.PI / 180;

function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

/* ── New moon: Jean Meeus, Astronomical Algorithms (2nd ed.) ch. 49, full series ──
   k follows Hồ Ngọc Đức's numbering (k = 0 near 1900-01-01); Meeus' k = k − 1237.
   Returns the local (UTC+7) Julian day number of the new moon. */
function deltaTSeconds(y: number): number {
  if (y < 1860) { const u = (y - 1820) / 100; return -20 + 32 * u * u; }
  if (y < 1900) { const t = y - 1860; return 7.62 + 0.5737 * t - 0.251754 * t * t + 0.01680668 * t ** 3 - 0.0004473624 * t ** 4 + t ** 5 / 233174; }
  if (y < 1920) { const t = y - 1900; return -2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t ** 3 - 0.000197 * t ** 4; }
  if (y < 1941) { const t = y - 1920; return 21.20 + 0.84493 * t - 0.0761 * t * t + 0.0020936 * t ** 3; }
  if (y < 1961) { const t = y - 1950; return 29.07 + 0.407 * t - t * t / 233 + t ** 3 / 2547; }
  if (y < 1986) { const t = y - 1975; return 45.45 + 1.067 * t - t * t / 260 - t ** 3 / 718; }
  if (y < 2005) { const t = y - 2000; return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5; }
  if (y < 2050) { const t = y - 2000; return 62.92 + 0.32217 * t + 0.005589 * t * t; }
  if (y < 2150) { return -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y); }
  const u = (y - 1820) / 100; return -20 + 32 * u * u;
}

/** Exact new-moon instant as a Julian Date in UT. */
function newMoonJDUT(kHo: number): number {
  const k = kHo - 1237;
  const T = k / 1236.85;
  const T2 = T * T; const T3 = T2 * T; const T4 = T3 * T;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = (2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3) * DR;
  const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4) * DR;
  const F = (160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4) * DR;
  const Om = (124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3) * DR;
  const s = Math.sin;
  jde += -0.40720 * s(Mp)
    + 0.17241 * E * s(M)
    + 0.01608 * s(2 * Mp)
    + 0.01039 * s(2 * F)
    + 0.00739 * E * s(Mp - M)
    - 0.00514 * E * s(Mp + M)
    + 0.00208 * E * E * s(2 * M)
    - 0.00111 * s(Mp - 2 * F)
    - 0.00057 * s(Mp + 2 * F)
    + 0.00056 * E * s(2 * Mp + M)
    - 0.00042 * s(3 * Mp)
    + 0.00042 * E * s(M + 2 * F)
    + 0.00038 * E * s(M - 2 * F)
    - 0.00024 * E * s(2 * Mp - M)
    - 0.00017 * s(Om)
    - 0.00007 * s(Mp + 2 * M)
    + 0.00004 * s(2 * Mp - 2 * F)
    + 0.00004 * s(3 * M)
    + 0.00003 * s(Mp + M - 2 * F)
    + 0.00003 * s(2 * Mp + 2 * F)
    - 0.00003 * s(Mp + M + 2 * F)
    + 0.00003 * s(Mp - M + 2 * F)
    - 0.00002 * s(Mp - M - 2 * F)
    - 0.00002 * s(3 * Mp + M)
    + 0.00002 * s(4 * Mp);
  const A: number[][] = [
    [299.77, 0.107408, -0.009173, 0.000325], [251.88, 0.016321, 0, 0.000165], [251.83, 26.651886, 0, 0.000164],
    [349.42, 36.412478, 0, 0.000126], [84.66, 18.206239, 0, 0.000110], [141.74, 53.303771, 0, 0.000062],
    [207.14, 2.453732, 0, 0.000060], [154.84, 7.30686, 0, 0.000056], [34.52, 27.261239, 0, 0.000047],
    [207.19, 0.121824, 0, 0.000042], [291.34, 1.844379, 0, 0.000040], [161.72, 24.198154, 0, 0.000037],
    [239.56, 25.513099, 0, 0.000035], [331.55, 3.592518, 0, 0.000023],
  ];
  for (const [a0, a1, a2, c] of A) jde += c * s((a0 + a1 * k + a2 * T2) * DR);
  const year = 2000 + (jde - 2451545) / 365.25;
  return jde - deltaTSeconds(year) / 86400;
}

function getNewMoonDay(k: number): number {
  return Math.floor(newMoonJDUT(k) + 0.5 + TZ / 24);
}

function getSunLongitude(jdn: number): number {
  const T = (jdn - 2451545.5 - TZ / 24) / 36525;
  const T2 = T * T;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(DR * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(DR * 2 * M) + 0.00029 * Math.sin(DR * 3 * M);
  const L = L0 + DL;
  const lNorm = ((L / 360) - Math.floor(L / 360)) * 360;
  return Math.floor(lNorm / 30);
}

function getLunarMonth11(yy: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k);
  if (getSunLongitude(nm) >= 9) nm = getNewMoonDay(k - 1);
  return nm;
}

function getLeapMonthOffset(a11: number): number {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i));
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i));
  } while (arc !== last && i < 14);
  return i - 1;
}

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean;
  can: string;      // year can
  chi: string;      // year chi
  yearName: string;
  dayCan: string;
  dayChi: string;
  dayCanChi: string;
  monthCan: string;
  monthChi: string;
  monthCanChi: string;
}

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

export function solarToLunar(dd: number, mm: number, yy: number): LunarDate {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k);

  let a11 = getLunarMonth11(yy);
  let b11 = a11;
  let lunarYear: number;

  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let isLeap = false;
  let lunarMonth = diff + 11;

  // Hồ Ngọc Đức's rule: months after the leap month shift back by one; the leap month repeats the previous number.
  if (b11 - a11 > 365) {
    const leapOffset = getLeapMonthOffset(a11);
    if (diff >= leapOffset) {
      lunarMonth = diff + 10;
      if (diff === leapOffset) isLeap = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

  const yearCanIdx = (lunarYear + 6) % 10;
  const can = CAN[yearCanIdx];
  const chi = CHI[(lunarYear + 8) % 12];

  // Day Can-Chi from Julian Day Number
  const dayCan  = CAN[(dayNumber + 6) % 10];
  const dayChi  = CHI[(dayNumber + 10) % 12];

  // Month Can-Chi
  const monthCanIdx = ((yearCanIdx % 5) * 2 + lunarMonth + 1) % 10;
  const monthCan    = CAN[monthCanIdx];
  const monthChi    = CHI[(lunarMonth + 1) % 12];

  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    leap: isLeap,
    can,
    chi,
    yearName: `${can} ${chi}`,
    dayCan,
    dayChi,
    dayCanChi: `${dayCan} ${dayChi}`,
    monthCan,
    monthChi,
    monthCanChi: `${monthCan} ${monthChi}`,
  };
}

// ─── Buddhist holidays (lunar dates) ─────────────────────────
const LUNAR_HOLIDAYS: { month: number; day: number; name: string; major?: boolean }[] = [
  { month: 1, day: 1,  name: 'Tết Nguyên Đán', major: true },
  { month: 1, day: 15, name: 'Rằm Thượng Nguyên', major: true },
  { month: 2, day: 8,  name: 'Phật Thích Ca xuất gia' },
  { month: 2, day: 15, name: 'Phật Thích Ca Niết Bàn' },
  { month: 2, day: 19, name: 'Quan Âm Bồ Tát đản sinh', major: true },
  { month: 3, day: 21, name: 'Phổ Hiền Bồ Tát đản sinh' },
  { month: 4, day: 4,  name: 'Văn Thù Bồ Tát đản sinh' },
  { month: 4, day: 15, name: 'Đại lễ Phật Đản (Vesak)', major: true },
  { month: 6, day: 3,  name: 'Hộ Pháp Bồ Tát đản sinh' },
  { month: 6, day: 19, name: 'Quan Âm Bồ Tát thành đạo', major: true },
  { month: 7, day: 13, name: 'Đại lễ Vu Lan', major: true },
  { month: 7, day: 15, name: 'Rằm tháng 7 – Vu Lan', major: true },
  { month: 7, day: 30, name: 'Địa Tạng Bồ Tát đản sinh' },
  { month: 9, day: 9,  name: 'Quan Âm Bồ Tát xuất gia' },
  { month: 9, day: 19, name: 'Quan Âm Bồ Tát đắc đạo', major: true },
  { month: 10, day: 5, name: 'Đạt Ma Tổ Sư đản sinh' },
  { month: 11, day: 17, name: 'A Di Đà Phật đản sinh', major: true },
  { month: 12, day: 8,  name: 'Phật Thích Ca thành đạo', major: true },
];

// Returns a Map from YYYY-MM-DD to { names, major }
export function getBuddhistHolidays(year: number): Map<string, { names: string[]; major: boolean }> {
  const result = new Map<string, { names: string[]; major: boolean }>();

  const addDay = (key: string, name: string, major: boolean) => {
    if (!result.has(key)) result.set(key, { names: [], major: false });
    const entry = result.get(key)!;
    entry.names.push(name);
    if (major) entry.major = true;
  };

  // Scan all days of the year
  for (let m = 1; m <= 12; m++) {
    const daysInMonth = new Date(year, m, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const lunar = solarToLunar(d, m, year);

      // Check Buddhist holidays
      // Festivals fall in the regular month, never in its leap repeat
      for (const h of LUNAR_HOLIDAYS) {
        if (!lunar.leap && lunar.month === h.month && lunar.day === h.day) {
          const key = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          addDay(key, h.name, !!h.major);
        }
      }

      // Mark every lunar 1st (Sóc) and 15th (Vọng/Rằm)
      if (lunar.day === 1) {
        const key = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        addDay(key, `Mùng 1 tháng ${lunar.month}${lunar.leap ? ' nhuận' : ''}`, false);
      }
      if (lunar.day === 15 && (lunar.leap || !LUNAR_HOLIDAYS.some(h => h.month === lunar.month && h.day === 15))) {
        const key = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        addDay(key, `Rằm tháng ${lunar.month}${lunar.leap ? ' nhuận' : ''}`, false);
      }
    }
  }

  return result;
}

export function formatLunarDate(l: LunarDate): string {
  return `${l.day}/${l.month}${l.leap ? ' (nhuận)' : ''} ${l.yearName}`;
}

// ─── Giờ Hoàng Đạo ───────────────────────────────────────
const CHI_TIMES = ['23h-1h','1h-3h','3h-5h','5h-7h','7h-9h','9h-11h','11h-13h','13h-15h','15h-17h','17h-19h','19h-21h','21h-23h'];
const HD_OFFSETS = [0, 1, 4, 5, 7, 10]; // positions of 6 hoàng đạo thần

export function getHoangDaoHours(dayChiIdx: number): { chi: string; time: string }[] {
  const start = dayChiIdx % 2 === 0 ? 0 : 2; // even day chi → start Tý(0), odd → start Dần(2)
  return HD_OFFSETS
    .map(o => { const i = (start + o) % 12; return { chi: CHI[i], time: CHI_TIMES[i] }; })
    .sort((a, b) => CHI.indexOf(a.chi) - CHI.indexOf(b.chi));
}

// ─── Solar terms (Tiết khí) ──────────────────────────────
const SOLAR_TERMS = [
  'Xuân phân','Thanh minh','Cốc vũ','Lập hạ','Tiểu mãn','Mang chủng',
  'Hạ chí','Tiểu thử','Đại thử','Lập thu','Xử thử','Bạch lộ',
  'Thu phân','Hàn lộ','Sương giáng','Lập đông','Tiểu tuyết','Đại tuyết',
  'Đông chí','Tiểu hàn','Đại hàn','Lập xuân','Vũ thủy','Kinh trập',
];

function getSunLongitudeDeg(jdn: number): number {
  const T  = (jdn - 2451545.5 - TZ / 24) / 36525;
  const T2 = T * T;
  const M  = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL   = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(DR * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(DR * 2 * M) + 0.00029 * Math.sin(DR * 3 * M);
  return ((L0 + DL) % 360 + 360) % 360;
}

export function getSolarTerm(dd: number, mm: number, yy: number): string {
  const deg = getSunLongitudeDeg(jdFromDate(dd, mm, yy));
  return SOLAR_TERMS[Math.floor(deg / 15) % 24];
}

// ─── Thập nhị trực ───────────────────────────────────────
export interface TrucInfo {
  name: string;
  hoangDao: boolean;
  shouldDo: string[];
  shouldAvoid: string[];
}

const TRUC_LIST: TrucInfo[] = [
  { name: 'Kiến', hoangDao: false, shouldDo: ['cúng tế', 'tế lễ'], shouldAvoid: ['động thổ', 'cưới hỏi', 'xuất hành', 'mở kho'] },
  { name: 'Trừ',  hoangDao: true,  shouldDo: ['chữa bệnh', 'tắm gội', 'vệ sinh', 'cắt may'], shouldAvoid: ['cưới hỏi', 'đặt nền móng', 'khai trương'] },
  { name: 'Mãn',  hoangDao: false, shouldDo: ['khai trương', 'giao dịch', 'nhập trạch'], shouldAvoid: ['tang sự', 'kiện tụng'] },
  { name: 'Bình', hoangDao: true,  shouldDo: ['cưới hỏi', 'xuất hành', 'giao dịch', 'khai trương'], shouldAvoid: ['kiện tụng', 'tang sự'] },
  { name: 'Định', hoangDao: true,  shouldDo: ['cưới hỏi', 'đặt nền móng', 'khai trương', 'ký kết'], shouldAvoid: ['kiện tụng', 'tranh luận'] },
  { name: 'Chấp', hoangDao: false, shouldDo: ['trồng cây', 'chăn nuôi', 'gieo giống'], shouldAvoid: ['khai trương', 'cưới hỏi', 'xuất hành'] },
  { name: 'Phá',  hoangDao: false, shouldDo: ['phá dỡ công trình cũ'], shouldAvoid: ['cưới hỏi', 'khai trương', 'ký kết', 'xuất hành'] },
  { name: 'Nguy', hoangDao: true,  shouldDo: ['cúng tế', 'lên núi'], shouldAvoid: ['xuất hành xa', 'bơi lội'] },
  { name: 'Thành',hoangDao: true,  shouldDo: ['cưới hỏi', 'khai trương', 'nhập trạch', 'ký kết', 'xuất hành'], shouldAvoid: ['kiện tụng', 'tang sự'] },
  { name: 'Thu',  hoangDao: false, shouldDo: ['thu hoạch', 'thu nợ', 'nạp tài'], shouldAvoid: ['xuất hành', 'cưới hỏi', 'khai trương'] },
  { name: 'Khai', hoangDao: true,  shouldDo: ['khai trương', 'xuất hành', 'cưới hỏi', 'nhập trạch', 'ký kết'], shouldAvoid: ['tang sự', 'mai táng'] },
  { name: 'Bế',   hoangDao: false, shouldDo: ['mai táng', 'tích trữ'], shouldAvoid: ['khai trương', 'xuất hành', 'cưới hỏi'] },
];

export function getTruc(lunarDay: number, lunarMonth: number, lunarYear: number): TrucInfo {
  const yearChiIdx = (lunarYear + 8) % 12;
  const offset = [0, 2, 10][yearChiIdx % 3];
  const idx = (lunarMonth * 2 + lunarDay + offset) % 12;
  return TRUC_LIST[idx];
}
