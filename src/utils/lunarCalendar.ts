// Vietnamese Lunar Calendar (Âm lịch Việt Nam)
// Algorithm by Hồ Ngọc Đức — standard for Vietnamese lunar calendar
// Timezone: UTC+7

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

function getNewMoonDay(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * DR);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * DR) + 0.0021 * Math.sin(2 * DR * M);
  C1 -= 0.4068 * Math.sin(Mpr * DR) + 0.0161 * Math.sin(DR * 2 * Mpr);
  C1 -= 0.0004 * Math.sin(DR * 3 * Mpr);
  C1 += 0.0104 * Math.sin(DR * 2 * F) - 0.0051 * Math.sin(DR * (M + Mpr));
  C1 -= 0.0074 * Math.sin(DR * (M - Mpr)) + 0.0004 * Math.sin(DR * (2 * F + M));
  C1 -= 0.0004 * Math.sin(DR * (2 * F - M)) - 0.0006 * Math.sin(DR * (2 * F + Mpr));
  C1 += 0.001 * Math.sin(DR * (2 * F - Mpr)) + 0.0005 * Math.sin(DR * (M + 2 * Mpr));
  const deltaT = T < -11
    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Math.floor(Jd1 + C1 - deltaT + 0.5 + TZ / 24);
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
  can: string;
  chi: string;
  yearName: string;
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
  let leapMonthDiff = 0;
  let isLeap = false;

  if (b11 - a11 > 365) {
    const leapOffset = getLeapMonthOffset(a11);
    const leapMonth = leapOffset - Math.floor(leapOffset / 2);
    leapMonthDiff = leapOffset >= diff ? 0 : 1;
    if (diff >= leapOffset && diff - leapMonthDiff === leapMonth) isLeap = true;
  }

  let lunarMonth = ((diff + 11 - leapMonthDiff) % 12) + 1;
  if (lunarMonth >= 11 && diff < 4) lunarYear = yy - 1;

  const can = CAN[(lunarYear + 6) % 10];
  const chi = CHI[(lunarYear + 8) % 12];

  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    leap: isLeap,
    can,
    chi,
    yearName: `${can} ${chi}`,
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
      for (const h of LUNAR_HOLIDAYS) {
        if (lunar.month === h.month && lunar.day === h.day) {
          const key = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          addDay(key, h.name, !!h.major);
        }
      }

      // Mark every lunar 1st (Sóc) and 15th (Vọng/Rằm)
      if (lunar.day === 1) {
        const key = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        addDay(key, `Mùng 1 tháng ${lunar.month}`, false);
      }
      if (lunar.day === 15 && !LUNAR_HOLIDAYS.some(h => h.month === lunar.month && h.day === 15)) {
        const key = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        addDay(key, `Rằm tháng ${lunar.month}`, false);
      }
    }
  }

  return result;
}

export function formatLunarDate(l: LunarDate): string {
  return `${l.day}/${l.month}${l.leap ? ' (nhuận)' : ''} ${l.yearName}`;
}
