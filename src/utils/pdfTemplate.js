import { DISCOUNT_TYPE, QUOTE_STATUS_LABEL } from './constants';

const STATUS_COLOR = {
  draft: '#868E96',
  sent: '#339AF0',
  accepted: '#40C057',
  rejected: '#FA5252',
  paid: '#20C997',
};

function fmt(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n ?? 0);
}

function fmtDate(ts) {
  if (!ts) return '—';
  try {
    const d = ts.toDate ? ts.toDate() : new Date((ts.seconds ?? 0) * 1000);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

function padNum(n) {
  return '#' + String(n ?? 0).padStart(4, '0');
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

  const statusLabel = QUOTE_STATUS_LABEL[quote.status] ?? quote.status;
  const statusColor = STATUS_COLOR[quote.status] ?? '#868E96';

  // Filas de la tabla de ítems
  const itemRows = items
    .map(
      item => `
    <tr>
      <td>${item.description ?? '—'}</td>
      <td style="text-align:center;">${item.quantity}</td>
      <td style="text-align:right;">${fmt(item.unitPrice)}</td>
      <td style="text-align:right;font-weight:600;">${fmt(item.subtotal ?? item.quantity * item.unitPrice)}</td>
    </tr>`
    )
    .join('');

  // Bloque de descuento (solo si hay)
  const discountBlock =
    discountAmount > 0
      ? `<div class="tr">
          <span>Descuento${quote.discountType === DISCOUNT_TYPE.PERCENT ? ` (${quote.discount}%)` : ''}</span>
          <span style="color:#FA5252;">-${fmt(discountAmount)}</span>
         </div>`
      : '';

  // Bloque de anticipo y saldo (solo si hay anticipo)
  const advanceBlock =
    advance > 0
      ? `<div class="tr">
          <span>Anticipo</span>
          <span style="color:#FA5252;">-${fmt(advance)}</span>
         </div>
         <div class="tr divider">
          <span style="font-weight:700;">Saldo pendiente</span>
          <span style="font-weight:700;color:#339AF0;">${fmt(saldo)}</span>
         </div>`
      : '';

  // Logo
  const logoBlock = b.logoUrl
    ? `<img src="${b.logoUrl}" alt="Logo" style="max-width:100px;max-height:70px;object-fit:contain;" />`
    : `<div style="width:70px;height:70px;border-radius:12px;background:#EEF2FF;display:flex;align-items:center;justify-content:center;"></div>`;

  // Info adicional del negocio
  const bizLines = [b.whatsapp && `WhatsApp: ${b.whatsapp}`, b.email, b.address, b.cuit && `CUIT: ${b.cuit}`]
    .filter(Boolean)
    .map(l => `<div>${l}</div>`)
    .join('');

  // Notas y condiciones
  const notesBlock = quote.notes
    ? `<div style="margin-bottom:28px;">
        <div class="section-title">NOTAS</div>
        <div class="callout">${quote.notes.replace(/\n/g, '<br>')}</div>
       </div>`
    : '';

  const conditionsBlock = b.generalConditions
    ? `<div style="margin-bottom:28px;">
        <div class="section-title">CONDICIONES GENERALES</div>
        <div class="callout" style="border-color:#ADB5BD;color:#495057;font-size:12px;">${b.generalConditions.replace(/\n/g, '<br>')}</div>
       </div>`
    : '';

  const todayTs = { seconds: Math.floor(Date.now() / 1000) };

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
    padding: 40px;
    font-size: 14px;
    line-height: 1.5;
  }
  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 24px;
    margin-bottom: 28px;
    border-bottom: 3px solid #3B5BDB;
  }
  .biz-name {
    font-size: 20px;
    font-weight: bold;
    color: #3B5BDB;
    margin-bottom: 6px;
  }
  .biz-info {
    text-align: right;
    font-size: 12px;
    color: #495057;
    line-height: 1.8;
  }
  /* Meta */
  .meta-box {
    background: #F8F9FA;
    border-radius: 10px;
    padding: 18px 24px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .quote-num {
    font-size: 28px;
    font-weight: bold;
    color: #212529;
    margin-bottom: 6px;
  }
  .status-badge {
    display: inline-block;
    padding: 3px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }
  .meta-dates {
    text-align: right;
    font-size: 13px;
    color: #495057;
    line-height: 1.9;
  }
  /* Section title */
  .section-title {
    font-size: 10px;
    font-weight: bold;
    color: #868E96;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  /* Client */
  .client-box {
    border: 1px solid #DEE2E6;
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 24px;
  }
  .client-name {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 3px;
  }
  /* Table */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }
  thead th {
    background: #3B5BDB;
    color: #fff;
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 600;
    text-align: left;
  }
  thead th:nth-child(2) { text-align: center; width: 65px; }
  thead th:nth-child(3) { text-align: right; width: 120px; }
  thead th:nth-child(4) { text-align: right; width: 110px; }
  tbody tr:nth-child(even) { background: #F8F9FA; }
  tbody td {
    padding: 10px 14px;
    border-bottom: 1px solid #DEE2E6;
    font-size: 13px;
    vertical-align: middle;
  }
  tbody tr:last-child td { border-bottom: none; }
  /* Totals */
  .totals-wrap {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 28px;
  }
  .totals-box {
    width: 300px;
    border: 1px solid #DEE2E6;
    border-radius: 10px;
    overflow: hidden;
  }
  .tr {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 18px;
    font-size: 14px;
    color: #495057;
    border-bottom: 1px solid #F1F3F5;
  }
  .tr.main {
    padding: 12px 18px;
    font-size: 17px;
    font-weight: bold;
    color: #3B5BDB;
    background: #EEF2FF;
    border-bottom: none;
  }
  .tr.divider {
    background: #F8F9FA;
    border-top: 1px solid #DEE2E6;
    border-bottom: none;
  }
  /* Notes */
  .callout {
    background: #F8F9FA;
    border-left: 4px solid #3B5BDB;
    border-radius: 0 8px 8px 0;
    padding: 12px 16px;
    font-size: 13px;
    color: #495057;
  }
  /* Footer */
  .footer {
    margin-top: 48px;
    padding-top: 16px;
    border-top: 1px solid #DEE2E6;
    text-align: center;
    font-size: 11px;
    color: #ADB5BD;
  }
</style>
</head>
<body>

<div class="header">
  <div>${logoBlock}</div>
  <div class="biz-info">
    <div class="biz-name">${b.businessName ?? 'Mi negocio'}</div>
    ${bizLines}
  </div>
</div>

<div class="meta-box">
  <div>
    <div class="quote-num">${padNum(quote.quoteNumber)}</div>
    <span class="status-badge" style="background:${statusColor}22;color:${statusColor};">
      ${statusLabel}
    </span>
  </div>
  <div class="meta-dates">
    <div><strong>Fecha:</strong> ${fmtDate(quote.createdAt)}</div>
    ${quote.validUntil ? `<div><strong>Válido hasta:</strong> ${fmtDate(quote.validUntil)}</div>` : ''}
  </div>
</div>

<div class="section-title">Cliente</div>
<div class="client-box">
  <div class="client-name">${c.name ?? '—'}</div>
  ${c.phone ? `<div style="color:#495057;font-size:13px;">Tel: ${c.phone}</div>` : ''}
  ${c.email ? `<div style="color:#868E96;font-size:12px;">${c.email}</div>` : ''}
</div>

<div class="section-title">Ítems</div>
<table>
  <thead>
    <tr>
      <th>Descripción</th>
      <th>Cant.</th>
      <th>Precio unit.</th>
      <th>Subtotal</th>
    </tr>
  </thead>
  <tbody>${itemRows}</tbody>
</table>

<div class="totals-wrap">
  <div class="totals-box">
    <div class="tr"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
    ${discountBlock}
    <div class="tr main"><span>TOTAL</span><span>${fmt(total)}</span></div>
    ${advanceBlock}
  </div>
</div>

${notesBlock}
${conditionsBlock}

<div class="footer">
  Generado con PresuFácil · ${fmtDate(todayTs)}
</div>

</body>
</html>`;
}
