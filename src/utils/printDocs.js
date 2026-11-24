// Printable finance and ceremony documents.
import { amountInWords } from './vnNumberWords';

const PAGODA = 'Chùa Tân Thành';
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const vnd = (v) => `${Number(v || 0).toLocaleString('vi-VN')} ₫`;
// Date-only values ("YYYY-MM-DD") are used as-is; timestamps (e.g. approvedAt, stored in UTC)
// are converted to the local calendar day — slicing the ISO string would be a day early before 07:00.
const ymdParts = (d) => {
  if (!d) return null;
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.split('-');
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  const p = (n) => String(n).padStart(2, '0');
  return [String(dt.getFullYear()), p(dt.getMonth() + 1), p(dt.getDate())];
};
const dmy = (d) => {
  const parts = ymdParts(d);
  if (!parts) return '';
  const [y, m, day] = parts;
  return `${day}/${m}/${y}`;
};
const longDate = (d) => {
  const parts = ymdParts(d);
  if (!parts) return '';
  const [y, m, day] = parts;
  return `ngày ${day} tháng ${m} năm ${y}`;
};

const METHODS = { 'tiền_mặt': 'Tiền mặt', 'chuyển_khoản': 'Chuyển khoản', 'khác': 'Khác' };

const BASE_CSS = `
  @page { size: A5 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Times New Roman', 'Noto Serif', serif; color: #2a1a0e; font-size: 13.5pt; }
  .doc { max-width: 190mm; margin: 0 auto; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .org { font-weight: 700; text-transform: uppercase; letter-spacing: .02em; }
  .org small { display: block; font-weight: 400; text-transform: none; font-size: 11pt; color: #6b5444; }
  .no { text-align: right; font-size: 11.5pt; }
  .no strong { font-size: 12.5pt; }
  h1 { margin: 12px 0 2px; text-align: center; font-size: 20pt; letter-spacing: .06em; }
  .date { text-align: center; font-style: italic; margin-bottom: 14px; }
  table.f { width: 100%; border-collapse: collapse; }
  table.f td { padding: 5px 0; vertical-align: top; }
  table.f td.k { width: 34%; color: #4a3626; }
  table.f td.v { border-bottom: 1px dotted #a8916f; font-weight: 600; }
  .amount { font-size: 15pt; }
  .words { font-style: italic; }
  .sign { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 22px; text-align: center; }
  .sign b { display: block; }
  .sign i { display: block; font-size: 10.5pt; color: #6b5444; }
  .sign .space { height: 64px; }
  .foot { margin-top: 10px; text-align: center; font-size: 10.5pt; color: #8a6a4a; }
`;

// iOS Safari / most mobile browsers ignore print() inside a hidden iframe – use a real tab there.
const isMobilePrint = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod|Android|Mobile/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

function printHtml(title, body, extraCss = '') {
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><style>${BASE_CSS}${extraCss}</style></head><body>${body}</body></html>`;
  if (isMobilePrint()) {
    const win = window.open('', '_blank');
    if (win) {
      win.opener = null;
      win.document.open();
      win.document.write(html);
      win.document.close();
      const go = () => { try { win.focus(); win.print(); } catch { /* user can print from the tab */ } };
      if (win.document.readyState === 'complete') setTimeout(go, 300);
      else win.addEventListener('load', () => setTimeout(go, 300));
      return;
    }
    // Popup blocked – fall back to the iframe below.
  }
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  doc.open();
  doc.write(html);
  doc.close();
  const cleanup = () => setTimeout(() => frame.remove(), 500);
  frame.contentWindow.onafterprint = cleanup;
  setTimeout(() => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    setTimeout(cleanup, 60000);
  }, 250);
}

const donorOf = (d) => (d.buddhistFollower
  ? (d.buddhistFollower.dharmName ? `${d.buddhistFollower.fullName} (Pháp danh: ${d.buddhistFollower.dharmName})` : d.buddhistFollower.fullName)
  : (d.donorName || 'Phật tử ẩn danh'));

export function printReceipt(d) {
  const body = `
  <div class="doc">
    <div class="head">
      <div class="org">${PAGODA}<small>Ban Thủ quỹ</small></div>
      <div class="no">Số: <strong>${esc(d.receiptNo || '—')}</strong></div>
    </div>
    <h1>PHIẾU THU</h1>
    <div class="date">${esc(longDate(d.donationDate))}</div>
    <table class="f">
      <tr><td class="k">Người cúng dường:</td><td class="v">${esc(donorOf(d))}</td></tr>
      <tr><td class="k">Số tiền:</td><td class="v amount">${vnd(d.amount)}</td></tr>
      <tr><td class="k">Bằng chữ:</td><td class="v words">${esc(amountInWords(d.amount))}</td></tr>
      <tr><td class="k">Quỹ:</td><td class="v">${esc(d.fund?.name || 'Quỹ chung')}</td></tr>
      <tr><td class="k">Mục đích:</td><td class="v">${esc(d.purpose || 'Cúng dường Tam Bảo')}</td></tr>
      <tr><td class="k">Hình thức:</td><td class="v">${esc(METHODS[d.paymentMethod] || '')}</td></tr>
    </table>
    <div class="sign">
      <div><b>Người nộp tiền</b><i>(Ký, ghi rõ họ tên)</i><div class="space"></div></div>
      <div><b>Người nhận</b><i>(Ký, ghi rõ họ tên)</i><div class="space"></div>${esc(d.receivedBy || '')}</div>
      <div><b>Trụ trì</b><i>(Ký, đóng dấu)</i><div class="space"></div></div>
    </div>
    <div class="foot">Nam Mô A Di Đà Phật</div>
  </div>`;
  printHtml(`Phiếu thu ${d.receiptNo || ''}`, body);
}

export function printThankYou(d) {
  const css = `
    @page { size: A4 portrait; margin: 18mm 20mm; }
    body { font-size: 14pt; line-height: 1.7; }
    .letter { max-width: 170mm; margin: 0 auto; border: 2px solid #c9a46a; padding: 18mm 16mm; position: relative; }
    .letter::before { content: ''; position: absolute; inset: 5px; border: 1px solid #e3cfa6; pointer-events: none; }
    .top { text-align: center; }
    .top .org { font-size: 15pt; }
    .wheel { font-size: 26pt; color: #b0812f; line-height: 1; }
    h1 { font-size: 24pt; color: #7a4a1e; margin: 10px 0 18px; }
    p { margin: 0 0 12px; text-align: justify; }
    .hl { font-weight: 700; color: #5a2c0e; }
    .end { margin-top: 22px; display: flex; justify-content: space-between; align-items: flex-end; }
    .end .sig { text-align: center; }
    .end .space { height: 70px; }
    .namo { text-align: center; margin-top: 18px; font-weight: 700; letter-spacing: .08em; color: #7a4a1e; }
  `;
  const body = `
  <div class="letter">
    <div class="top">
      <div class="wheel">☸︎</div>
      <div class="org">${PAGODA}</div>
      <h1>THƯ CẢM TẠ</h1>
    </div>
    <p>Kính gửi Quý Phật tử <span class="hl">${esc(donorOf(d))}</span>,</p>
    <p>Ban Trị sự ${PAGODA} xin chân thành tri ân tấm lòng thành kính hướng về Tam Bảo của Quý Phật tử
      qua sự đóng góp tịnh tài <span class="hl">${vnd(d.amount)}</span> (<i>${esc(amountInWords(d.amount))}</i>)
      vào <span class="hl">${esc(d.fund?.name || 'Quỹ chung')}</span>${d.purpose ? ` — ${esc(d.purpose)}` : ''}.</p>
    <p>Công đức hiến cúng của Quý Phật tử sẽ được sử dụng đúng mục đích, góp phần duy trì và phát triển
      ngôi Tam Bảo, hoằng dương Chánh pháp và lợi lạc chúng sinh.</p>
    <p>Nguyện cầu hồng ân Tam Bảo gia hộ Quý Phật tử cùng bửu quyến thân tâm thường an lạc,
      phước huệ song tu, vạn sự cát tường như ý.</p>
    <div class="end">
      <div>Số phiếu thu: ${esc(d.receiptNo || '—')}</div>
      <div class="sig">${PAGODA}, ${esc(longDate(d.donationDate))}<br/><b>TRỤ TRÌ</b><div class="space"></div></div>
    </div>
    <div class="namo">NAM MÔ A DI ĐÀ PHẬT</div>
  </div>`;
  printHtml(`Thư cảm tạ ${d.receiptNo || ''}`, body, css);
}

export function printExpenseVoucher(e, labels = {}) {
  const person = (u) => u?.personnel?.dharmName || u?.personnel?.fullName || u?.username || '';
  const body = `
  <div class="doc">
    <div class="head">
      <div class="org">${PAGODA}<small>Ban Thủ quỹ</small></div>
      <div class="no">Số: <strong>${esc(e.code || '—')}</strong></div>
    </div>
    <h1>PHIẾU CHI</h1>
    <div class="date">${esc(longDate(e.expenseDate))}</div>
    <table class="f">
      <tr><td class="k">Người nhận tiền:</td><td class="v">${esc(e.payee || '')}</td></tr>
      <tr><td class="k">Nội dung chi:</td><td class="v">${esc(e.description || '')}</td></tr>
      <tr><td class="k">Hạng mục:</td><td class="v">${esc(labels.category || e.category)}</td></tr>
      <tr><td class="k">Chi từ quỹ:</td><td class="v">${esc(e.fund?.name || '')}</td></tr>
      <tr><td class="k">Số tiền:</td><td class="v amount">${vnd(e.amount)}</td></tr>
      <tr><td class="k">Bằng chữ:</td><td class="v words">${esc(amountInWords(e.amount))}</td></tr>
      <tr><td class="k">Hình thức:</td><td class="v">${esc(METHODS[e.paymentMethod] || '')}</td></tr>
      <tr><td class="k">Người duyệt:</td><td class="v">${esc(person(e.approver))}${e.approvedAt ? ` — ${esc(dmy(e.approvedAt))}` : ''}</td></tr>
    </table>
    <div class="sign">
      <div><b>Người lập phiếu</b><i>(Ký, ghi rõ họ tên)</i><div class="space"></div>${esc(person(e.creator))}</div>
      <div><b>Người nhận tiền</b><i>(Ký, ghi rõ họ tên)</i><div class="space"></div>${esc(e.payee || '')}</div>
      <div><b>Trụ trì</b><i>(Ký, đóng dấu)</i><div class="space"></div></div>
    </div>
  </div>`;
  printHtml(`Phiếu chi ${e.code || ''}`, body);
}

const LUNAR_MONTHS = ['Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Mười một', 'Chạp'];
const lunarText = (day, month) => {
  if (!day || !month) return '';
  const d = day === 15 ? 'Rằm' : day <= 10 ? `Mùng ${day}` : `Ngày ${day}`;
  return `${d} tháng ${LUNAR_MONTHS[month - 1]}`;
};

/** Printable A4 prayer list. Registration and entry order come from the API. */
export function printSoList(ceremony, registrations, kind) {
  const isSieu = kind === 'cầu_siêu';
  const title = isSieu ? 'SỚ CẦU SIÊU' : 'SỚ CẦU AN';
  const has = (value) => value != null && String(value).trim() !== '';
  const closing = '<div class="so-closing">NAM MÔ A DI ĐÀ PHẬT</div>';

  const entryFor = (entry, number) => {
    const details = [];
    if (has(entry.dharmName)) details.push(`Pháp danh: ${esc(entry.dharmName)}`);
    if (isSieu) {
      if (has(entry.deathYear)) details.push(`mất năm ${esc(entry.deathYear)}`);
      if (has(entry.deathLunarDay) && has(entry.deathLunarMonth)) {
        details.push(`ngày ${esc(entry.deathLunarDay)} tháng ${esc(entry.deathLunarMonth)} ÂL`);
      }
      if (has(entry.ageAtDeath)) details.push(`hưởng thọ ${esc(entry.ageAtDeath)} tuổi`);
    } else {
      if (has(entry.birthYear)) details.push(`sinh năm ${esc(entry.birthYear)}`);
      if (has(entry.address)) details.push(esc(entry.address));
    }
    return `<div class="so-entry">
      <span class="so-entry-number">${number}.</span>
      <div>
        ${isSieu ? 'Hương linh ' : ''}<strong>${esc(entry.fullName)}</strong>
        ${details.length ? `<div class="so-details">${details.join(' · ')}</div>` : ''}
      </div>
    </div>`;
  };

  const total = registrations.reduce((sum, registration) => sum + (registration.entries?.length || 0), 0);
  const groups = registrations.map((registration, index) => {
    const entries = registration.entries || [];
    const isLastGroup = index === registrations.length - 1;
    const rows = entries.map((entry, entryIndex) => `<tr><td>
      ${entryFor(entry, entryIndex + 1)}
      ${isLastGroup && entryIndex === entries.length - 1 ? closing : ''}
    </td></tr>`).join('');
    // A table per registration repeats just its own heading on continuation pages.
    return `<table class="so-group">
      <thead><tr><th scope="col"><div class="so-group-heading">
        <span class="so-group-number">${index + 1}.</span>
        <div>
          ${has(registration.registrantName) ? `Gia chủ: <strong>${esc(registration.registrantName)}</strong>` : ''}
          ${has(registration.registrantAddress) ? `<div class="so-details">${esc(registration.registrantAddress)}</div>` : ''}
        </div>
        ${has(registration.code) ? `<span class="so-code">${esc(registration.code)}</span>` : ''}
      </div></th></tr></thead>
      <tbody>${rows || (isLastGroup ? `<tr><td>${closing}</td></tr>` : '')}</tbody>
    </table>`;
  }).join('');

  const css = `
    @page {
      size: A4 portrait;
      margin: 16mm 18mm 18mm;
      @bottom-center {
        content: "Trang " counter(page) " / " counter(pages);
        font: 9pt 'Times New Roman', 'Noto Serif', serif;
        color: #403832;
      }
    }
    body { background: #fff; font-size: 12.5pt; line-height: 1.4; color: #261d18; }
    .so { overflow-wrap: anywhere; }
    .so-head { text-align: center; padding-bottom: 4mm; border-bottom: 1px solid #745439; }
    .so-org { margin: 0; font-size: 12pt; font-weight: bold; letter-spacing: .09em; }
    .so-head h1 { margin: 1.5mm 0 2mm; font-size: 26pt; line-height: 1.15; color: #583d28; letter-spacing: .05em; }
    .so-ceremony { margin: 0; font-weight: bold; }
    .so-date { margin: 1mm 0 0; font-style: italic; }
    .so-intro { break-inside: avoid; break-after: avoid; }
    .so-meta { margin: 2.5mm 0 3mm; text-align: center; font-size: 11pt; color: #51453d; }
    .so-empty { margin: 0 0 3mm; text-align: center; font-style: italic; }
    .so-group { width: 100%; border-collapse: collapse; margin: 0 0 3mm; }
    .so-group thead { display: table-header-group; break-inside: avoid; }
    .so-group tr { break-inside: avoid; page-break-inside: avoid; }
    .so-group th { padding: 2mm 0 1.5mm; border-top: 1px solid #a69a8e; text-align: left; font-weight: normal; }
    .so-group td { padding: 0; vertical-align: top; }
    .so-group-heading { display: grid; grid-template-columns: auto 1fr auto; gap: 2mm; }
    .so-group-heading > div { min-width: 0; }
    .so-group-number { font-weight: bold; }
    .so-code { padding-top: .5mm; color: #51453d; font-size: 10pt; }
    .so-entry { display: grid; grid-template-columns: 7mm minmax(0, 1fr); padding: 1mm 0 1mm 6mm; }
    .so-entry-number { color: #51453d; font-variant-numeric: tabular-nums; }
    .so-details { font-size: 12pt; color: #51453d; }
    .so-closing { margin: 4mm 0 0; padding-top: 3mm; border-top: 1px solid #a69a8e;
      text-align: center; font-weight: bold; letter-spacing: .05em; }
    @media screen {
      .so { max-width: 210mm; margin: 0 auto; padding: clamp(12px, 5vw, 16mm) clamp(12px, 5vw, 18mm); }
    }
    @media print {
      .so { margin: 0; padding: 0; }
    }
  `;
  const when = [lunarText(ceremony.lunarDay, ceremony.lunarMonth), ceremony.year ? `năm ${ceremony.year}` : '', ceremony.solarDate ? `(${longDate(ceremony.solarDate)})` : '']
    .filter(Boolean).join(' ');
  const date = [when, ceremony.location].filter(has).map(esc).join(' · ');
  const body = `
    <main class="so">
      <div class="so-intro">
        <header class="so-head">
          <p class="so-org">CHÙA TÂN THÀNH</p>
          <h1>${title}</h1>
          <p class="so-ceremony">${esc(ceremony.name)}</p>
          ${date ? `<p class="so-date">${date}</p>` : ''}
        </header>
        <p class="so-meta">${registrations.length} gia chủ · ${total} ${isSieu ? 'hương linh' : 'người được cầu an'}</p>
      </div>
      ${groups || `<p class="so-empty">Chưa có đăng ký ${isSieu ? 'cầu siêu' : 'cầu an'}.</p>${closing}`}
    </main>`;
  printHtml(`${title} – ${ceremony.name}`, body, css);
}
