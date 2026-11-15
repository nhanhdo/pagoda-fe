// Printable finance documents (Phiếu thu, Thư cảm tạ, Phiếu chi) rendered into a hidden iframe.
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
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><style>${BASE_CSS}${extraCss}</style></head><body>${body}</body></html>`;
  if (isMobilePrint()) {
    const win = window.open('', '_blank');
    if (win) {
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
    <div class="date">${longDate(d.donationDate)}</div>
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
      <div class="sig">${PAGODA}, ${longDate(d.donationDate)}<br/><b>TRỤ TRÌ</b><div class="space"></div></div>
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
    <div class="date">${longDate(e.expenseDate)}</div>
    <table class="f">
      <tr><td class="k">Người nhận tiền:</td><td class="v">${esc(e.payee || '')}</td></tr>
      <tr><td class="k">Nội dung chi:</td><td class="v">${esc(e.description || '')}</td></tr>
      <tr><td class="k">Hạng mục:</td><td class="v">${esc(labels.category || e.category)}</td></tr>
      <tr><td class="k">Chi từ quỹ:</td><td class="v">${esc(e.fund?.name || '')}</td></tr>
      <tr><td class="k">Số tiền:</td><td class="v amount">${vnd(e.amount)}</td></tr>
      <tr><td class="k">Bằng chữ:</td><td class="v words">${esc(amountInWords(e.amount))}</td></tr>
      <tr><td class="k">Hình thức:</td><td class="v">${esc(METHODS[e.paymentMethod] || '')}</td></tr>
      <tr><td class="k">Người duyệt:</td><td class="v">${esc(person(e.approver))}${e.approvedAt ? ` — ${dmy(e.approvedAt)}` : ''}</td></tr>
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

/** Sớ list for a ceremony: header, then every registration's names (cầu an or cầu siêu). */
export function printSoList(ceremony, registrations, kind) {
  const isSieu = kind === 'cầu_siêu';
  const title = isSieu ? 'SỚ CẦU SIÊU' : 'SỚ CẦU AN';
  const has = (v) => v !== null && v !== undefined && v !== '';
  const lineFor = (e) => {
    if (isSieu) {
      const parts = [`Hương linh <b>${esc(e.fullName)}</b>`];
      if (has(e.deathYear)) parts.push(`mất năm ${esc(e.deathYear)}`);
      if (has(e.deathLunarDay) && has(e.deathLunarMonth)) parts.push(`ngày ${esc(e.deathLunarDay)} tháng ${esc(e.deathLunarMonth)} ÂL`);
      if (has(e.ageAtDeath)) parts.push(`hưởng thọ ${esc(e.ageAtDeath)} tuổi`);
      return parts.join(', ');
    }
    const parts = [`<b>${esc(e.fullName)}</b>`];
    if (has(e.birthYear)) parts.push(`sinh năm ${esc(e.birthYear)}`);
    if (e.address) parts.push(esc(e.address));
    return parts.join(', ');
  };
  const total = registrations.reduce((s, r) => s + (r.entries?.length || 0), 0);
  const blocks = registrations.map((r, i) => `
    <tr><td><section class="reg">
      <div class="reg-head"><span class="idx">${i + 1}.</span> Gia chủ: <b>${esc(r.registrantName)}</b>${r.registrantAddress ? ` — ${esc(r.registrantAddress)}` : ''}<span class="code">${esc(r.code || '')}</span></div>
      <ol>${(r.entries || []).map(e => `<li>${lineFor(e)}</li>`).join('')}</ol>
    </section></td></tr>`).join('');
  const css = `
    @page { size: A4 portrait; margin: 16mm 18mm 18mm;
      @bottom-center { content: "Trang " counter(page) " / " counter(pages); font-size: 9pt; color: #8a6a4a; } }
    body { font-size: 13pt; line-height: 1.6; }
    table.regs { width: 100%; border-collapse: collapse; }
    table.regs td { padding: 0; vertical-align: top; }
    table.regs tr { break-inside: avoid; page-break-inside: avoid; }
    table.regs thead { display: table-header-group; }
    .run { font-size: 9.5pt; color: #8a6a4a; text-align: left; font-weight: 400; padding: 0 0 6px; border-bottom: 1px solid #e6d6bb; }
    .run b { color: #7a4a1e; letter-spacing: .06em; }
    .so { max-width: 175mm; margin: 0 auto; }
    .top { text-align: center; border-bottom: 2px solid #c9a46a; padding-bottom: 10px; margin-bottom: 14px; }
    .top .org { font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
    .top h1 { margin: 8px 0 4px; font-size: 22pt; color: #7a4a1e; letter-spacing: .08em; }
    .top .when { font-style: italic; color: #4a3626; }
    .meta { display: flex; justify-content: space-between; font-size: 11pt; color: #6b5444; margin-bottom: 10px; }
    .reg { break-inside: avoid; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dotted #c9b28c; }
    .reg-head { font-size: 12pt; color: #4a3626; }
    .reg-head .idx { font-weight: 700; color: #7a4a1e; }
    .reg-head .code { float: right; font-size: 10pt; color: #a8916f; }
    ol { margin: 4px 0 0 24px; padding: 0; }
    li { margin: 2px 0; }
    .namo { text-align: center; margin-top: 18px; font-weight: 700; letter-spacing: .08em; color: #7a4a1e; }
  `;
  const when = [lunarText(ceremony.lunarDay, ceremony.lunarMonth), ceremony.year ? `năm ${ceremony.year}` : '', ceremony.solarDate ? `(${longDate(ceremony.solarDate)})` : '']
    .filter(Boolean).join(' ');
  const body = `
  <div class="so">
    <div class="top">
      <div class="org">${PAGODA}</div>
      <h1>${title}</h1>
      <div><b>${esc(ceremony.name)}</b></div>
      <div class="when">${esc(when)}${ceremony.location ? ` · ${esc(ceremony.location)}` : ''}</div>
    </div>
    <div class="meta"><span>${registrations.length} gia chủ</span><span>${total} ${isSieu ? 'hương linh' : 'người được cầu an'}</span></div>
    ${blocks ? `<table class="regs"><thead><tr><th class="run"><b>${title}</b> · ${esc(ceremony.name)}</th></tr></thead><tbody>${blocks}</tbody></table>` : '<p><i>Chưa có đăng ký.</i></p>'}
    <div class="namo">NAM MÔ A DI ĐÀ PHẬT</div>
  </div>`;
  printHtml(`${title} – ${ceremony.name}`, body, css);
}
