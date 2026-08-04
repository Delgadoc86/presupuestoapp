import { DISCOUNT_TYPE, PAYMENT_METHOD, PAYMENT_METHOD_LABEL } from './constants';
import { formatDateAR } from './dateUtils';
import { APP_CONFIG } from '../config/appConfig';

// Conservative thresholds — accounts for row height variability (long descriptions wrap)
const ITEMS_FIRST_PAGE = APP_CONFIG.pdf.firstPageItems;
const ITEMS_PER_PAGE = APP_CONFIG.pdf.itemsPerPage;

function fmt(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n ?? 0);
}

function fmtDate(ts) {
  return formatDateAR(ts) ?? '—';
}

function padNum(n) {
  return '#' + String(n ?? 0).padStart(5, '0');
}

// Split items into page buckets: first page gets fewer items to leave room for the header block
function splitIntoPages(items) {
  if (items.length === 0) return [[]];
  const pages = [];
  let remaining = [...items];
  pages.push(remaining.splice(0, ITEMS_FIRST_PAGE));
  while (remaining.length > 0) {
    pages.push(remaining.splice(0, ITEMS_PER_PAGE));
  }
  return pages;
}

function buildTableRows(items) {
  return items
    .map(
      item => `
    <tr>
      <td class="td-desc">${item.description ?? '—'}</td>
      <td class="td-qty">${item.quantity}</td>
      <td class="td-price">${fmt(item.unitPrice)}</td>
      <td class="td-sub">${fmt(item.subtotal ?? item.quantity * item.unitPrice)}</td>
    </tr>`
    )
    .join('');
}

function buildTable(items) {
  return `
  <table>
    <thead>
      <tr>
        <th class="th-desc">Descripción</th>
        <th class="th-qty">Cant.</th>
        <th class="th-price">Precio unit.</th>
        <th class="th-sub">Subtotal</th>
      </tr>
    </thead>
    <tbody>${buildTableRows(items)}</tbody>
  </table>`;
}

export function buildQuoteHTML(quote) {
  const b = quote.business ?? {};
  const c = quote.client ?? {};
  const items = quote.items ?? [];

  const subtotal = quote.subtotal ?? 0;
  const discountAmount =
    quote.discountType === DISCOUNT_TYPE.PERCENT
      ? subtotal * ((quote.discount ?? 0) / 100)
      : (quote.discount ?? 0);
  const total = Math.max(0, subtotal - discountAmount);
  const advance = quote.advance ?? 0;
  const saldo = Math.max(0, total - advance);

  const quoteNumStr = padNum(quote.quoteNumber);
  const todayStr = fmtDate({ seconds: Math.floor(Date.now() / 1000) });

  const hasLogo = !!b.logoUrl;
  // Si hay nombre de empresa, se muestra grande y el nombre propio como subtítulo.
  // Si no hay empresa, el nombre propio es el título principal (sin subtítulo duplicado).
  const displayBizName = b.businessName || b.ownerName || 'Mi negocio';
  const showOwnerLine = !!(b.ownerName && b.businessName);

  const logoSlot = hasLogo
    ? `<div class="logo-slot"><img src="${b.logoUrl}" alt="Logo" /></div>`
    : '';

  const bizLines = [
    b.whatsapp && `<span>&#128222; ${b.whatsapp}</span>`,
    b.email && `<span>${b.email}</span>`,
    b.address && `<span>${b.address}</span>`,
    b.cuit && `<span>CUIT: ${b.cuit}</span>`,
  ]
    .filter(Boolean)
    .join('');

  const discountBlock =
    discountAmount > 0
      ? `<div class="tot-row">
          <span>Descuento${quote.discountType === DISCOUNT_TYPE.PERCENT ? ` (${quote.discount}%)` : ''}</span>
          <span class="amount-neg">-${fmt(discountAmount)}</span>
         </div>`
      : '';

  const advanceBlock =
    advance > 0
      ? `<div class="tot-row">
          <span>Anticipo</span>
          <span class="amount-neg">-${fmt(advance)}</span>
         </div>
         <div class="tot-row tot-saldo">
          <span>Saldo pendiente</span>
          <span class="amount-saldo">${fmt(saldo)}</span>
         </div>`
      : '';

  const notesBlock = quote.notes
    ? `<div class="block-section">
        <div class="label-sm">NOTAS</div>
        <div class="callout">${quote.notes.replace(/\n/g, '<br>')}</div>
       </div>`
    : '';

  const conditionsBlock = b.generalConditions
    ? `<div class="block-section">
        <div class="label-sm">CONDICIONES GENERALES</div>
        <div class="callout callout-grey">${b.generalConditions.replace(/\n/g, '<br>')}</div>
       </div>`
    : '';

  const paymentMethodBlock = quote.paymentMethod
    ? `<div class="block-section">
        <div class="label-sm">MÉTODO DE PAGO</div>
        <div class="payment-methods">
          ${Object.values(PAYMENT_METHOD)
            .map(method => {
              const active = method === quote.paymentMethod;
              return `<span class="payment-chip${active ? ' payment-chip-active' : ''}">${active ? '&#10003; ' : ''}${PAYMENT_METHOD_LABEL[method]}</span>`;
            })
            .join('')}
        </div>
       </div>`
    : '';

  // Totals + notes + conditions wrapped together so they never split across pages
  const finalBlock = `
  <div class="final-block">
    <div class="totals-wrap">
      <div class="totals-box">
        <div class="tot-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
        ${discountBlock}
        <div class="tot-row tot-main"><span>TOTAL</span><span>${fmt(total)}</span></div>
        ${advanceBlock}
      </div>
    </div>
    ${notesBlock}
    ${conditionsBlock}
    ${paymentMethodBlock}
  </div>`;

  const pages = splitIntoPages(items);
  const totalPages = pages.length;

  const pageSections = pages
    .map((pageItems, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === totalPages - 1;
      const pageNum = idx + 1;
      const breakStyle = isLast ? '' : 'page-break-after: always;';

      const header = isFirst
        ? `<div class="accent-bar"></div>
           <div class="${hasLogo ? 'page-header' : 'page-header header-nologo'}">
             ${logoSlot}
             <div class="biz-block">
               <div class="biz-name">${displayBizName}</div>
               ${showOwnerLine ? `<div class="biz-owner">${b.ownerName}</div>` : ''}
               <div class="biz-contact">${bizLines}</div>
             </div>
           </div>
           <div class="meta-row-outer">
             <div class="meta-left">
               <div class="label-sm" style="margin-bottom:2px;">Presupuesto N°:</div>
               <div class="quote-num">${quoteNumStr}</div>
             </div>
             <div class="meta-right">
               <div class="meta-line"><span class="meta-key">Fecha</span>${fmtDate(quote.createdAt)}</div>
               ${quote.validUntil ? `<div class="meta-line"><span class="meta-key">Válido hasta</span>${fmtDate(quote.validUntil)}</div>` : ''}
             </div>
           </div>
           <div class="section-divider"></div>
           <div class="label-sm">PRESUPUESTO A</div>
           <div class="client-box">
             <div class="client-name">${c.name ?? '—'}</div>
             ${c.phone ? `<div class="client-detail">&#128222; ${c.phone}</div>` : ''}
             ${c.email ? `<div class="client-detail">${c.email}</div>` : ''}
           </div>
           <div class="label-sm" style="margin-bottom:10px;">DETALLE DE ÍTEMS</div>`
        : `<div class="accent-bar"></div>
           <div class="continuation-header">
             <span class="biz-name-sm">${displayBizName}</span>
             <span class="continuation-label">Presupuesto ${quoteNumStr} — continuación (pág. ${pageNum} de ${totalPages})</span>
           </div>`;

      const footer = `
      <div class="page-footer">
        Generado con <strong>PresúFácil</strong> &nbsp;·&nbsp; ${todayStr} &nbsp;·&nbsp; Página ${pageNum} de ${totalPages}
      </div>`;

      return `<div style="${breakStyle}">
        ${header}
        ${buildTable(pageItems)}
        ${isLast ? finalBlock : ''}
        ${footer}
      </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #212529;
    background: #fff;
    padding: 36px 44px;
    font-size: 15px;
    line-height: 1.5;
  }

  /* Never split a table row across pages */
  tr { page-break-inside: avoid; break-inside: avoid; }
  /* Keep totals + notes + conditions as one block */
  .final-block { page-break-inside: avoid; break-inside: avoid; }
  /* Repeat thead on every printed page */
  thead { display: table-header-group; }

  /* ── Accent bar ── */
  .accent-bar {
    height: 5px;
    background: #3B5BDB;
    border-radius: 2px;
    margin-bottom: 28px;
  }

  /* ── Page 1 header ── */
  .page-header {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    padding-bottom: 22px;
    margin-bottom: 22px;
    border-bottom: 1px solid #DEE2E6;
  }
  .header-nologo .biz-block { flex: 1; }
  .logo-slot { flex-shrink: 0; }
  .logo-slot img { max-width: 155px; max-height: 125px; object-fit: contain; display: block; }
  .biz-block { flex: 1; text-align: right; }
  .header-nologo .biz-block { text-align: left; }
  .biz-name { font-size: 26px; font-weight: 700; color: #212529; margin-bottom: 3px; }
  .biz-owner { font-size: 14px; color: #495057; margin-bottom: 6px; }
  .biz-contact { display: flex; flex-direction: column; gap: 2px; font-size: 13px; color: #495057; line-height: 1.7; }
  .biz-contact span { display: block; }

  /* ── Meta row (quote number + dates) ── */
  .meta-row-outer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #F8F9FA;
    border: 1px solid #E9ECEF;
    border-radius: 10px;
    padding: 16px 22px;
    margin-bottom: 20px;
  }
  .meta-left { display: flex; flex-direction: column; gap: 6px; }
  .quote-num { font-size: 22px; font-weight: 800; color: #212529; letter-spacing: -0.3px; }
  .meta-right { text-align: right; }
  .meta-line { font-size: 14px; color: #495057; line-height: 2; }
  .meta-key { font-weight: 600; color: #212529; margin-right: 6px; }

  /* ── Section helpers ── */
  .section-divider { height: 1px; background: #E9ECEF; margin: 16px 0; }
  .label-sm {
    font-size: 11px;
    font-weight: 700;
    color: #868E96;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  /* ── Client box ── */
  .client-box {
    border-left: 3px solid #3B5BDB;
    padding: 10px 14px;
    margin-bottom: 22px;
    background: #F8F9FA;
    border-radius: 0 8px 8px 0;
  }
  .client-name { font-size: 18px; font-weight: 700; color: #212529; margin-bottom: 3px; }
  .client-detail { font-size: 13px; color: #495057; line-height: 1.8; }

  /* ── Table ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th {
    background: #3B5BDB;
    color: #fff;
    padding: 9px 12px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
  }
  .th-desc { text-align: left; }
  .th-qty { text-align: center; width: 56px; }
  .th-price { text-align: right; width: 110px; }
  .th-sub { text-align: right; width: 100px; }
  thead th:first-child { border-radius: 6px 0 0 0; }
  thead th:last-child { border-radius: 0 6px 0 0; }

  tbody tr:nth-child(even) { background: #F8F9FA; }
  tbody tr:hover { background: #EEF2FF; }
  tbody td {
    padding: 9px 12px;
    border-bottom: 1px solid #E9ECEF;
    font-size: 14px;
    vertical-align: middle;
    color: #343A40;
  }
  tbody tr:last-child td { border-bottom: none; }
  .td-desc { font-weight: 500; }
  .td-qty { text-align: center; color: #495057; }
  .td-price { text-align: right; color: #495057; }
  .td-sub { text-align: right; font-weight: 600; color: #212529; }

  /* ── Totals ── */
  .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 24px; }
  .totals-box { width: 280px; border: 1px solid #DEE2E6; border-radius: 10px; overflow: hidden; }
  .tot-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    font-size: 14px;
    color: #495057;
    border-bottom: 1px solid #F1F3F5;
  }
  .tot-row:last-child { border-bottom: none; }
  .tot-main {
    padding: 14px 16px;
    font-size: 22px;
    font-weight: 800;
    color: #3B5BDB;
    background: #EEF2FF;
    border-top: 2px solid #3B5BDB;
    border-bottom: none;
  }
  .tot-saldo { background: #F8F9FA; font-weight: 700; font-size: 15px; }
  .amount-neg { color: #FA5252; }
  .amount-saldo { color: #339AF0; font-weight: 700; }

  /* ── Notes / conditions ── */
  .block-section { margin-bottom: 18px; }
  .callout {
    background: #F8F9FA;
    border-left: 3px solid #3B5BDB;
    border-radius: 0 8px 8px 0;
    padding: 12px 16px;
    font-size: 14px;
    color: #343A40;
    line-height: 1.7;
  }
  .callout-grey { border-left-color: #ADB5BD; color: #495057; font-size: 13px; }

  /* ── Método de pago ── */
  .payment-methods { display: flex; flex-wrap: wrap; gap: 8px; }
  .payment-chip {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 20px;
    border: 1.5px solid #DEE2E6;
    font-size: 12px;
    font-weight: 600;
    color: #ADB5BD;
  }
  .payment-chip-active {
    border-color: #3B5BDB;
    background: #EEF2FF;
    color: #3B5BDB;
  }

  /* ── Continuation header (pages 2+) ── */
  .continuation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 14px;
    margin-bottom: 20px;
    border-bottom: 2px solid #3B5BDB;
  }
  .biz-name-sm { font-size: 17px; font-weight: 700; color: #3B5BDB; }
  .continuation-label { font-size: 13px; color: #868E96; font-style: italic; }

  /* ── Page footer ── */
  .page-footer {
    margin-top: 30px;
    padding-top: 10px;
    border-top: 1px solid #DEE2E6;
    text-align: center;
    font-size: 12px;
    color: #ADB5BD;
    letter-spacing: 0.3px;
  }
</style>
</head>
<body>
${pageSections}
</body>
</html>`;
}
