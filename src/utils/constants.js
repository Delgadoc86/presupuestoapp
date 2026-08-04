/**
 * Estados posibles de un presupuesto.
 * Se almacenan como strings en Firestore (campo status).
 */
export const QUOTE_STATUS = {
  DRAFT:    'draft',     // creado pero no enviado al cliente
  SENT:     'sent',      // enviado, esperando respuesta
  ACCEPTED: 'accepted',  // cliente confirmó
  REJECTED: 'rejected',  // cliente rechazó
  EXPIRED:  'expired',   // se venció el plazo sin respuesta
  // 'paid' se mantiene solo por compatibilidad con presupuestos existentes
  // y la transición accepted->paid — no se construye ninguna función nueva
  // alrededor de este estado, se retira cuando exista jobs.paymentStatus.
  PAID:     'paid',
};

/** Etiquetas en español para mostrar en la UI. */
export const QUOTE_STATUS_LABEL = {
  draft:    'Borrador',
  sent:     'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  expired:  'Vencido',
  paid:     'Pagado',
};

/** Colores asociados a cada estado (usados en badges y gráficos). */
export const QUOTE_STATUS_COLOR = {
  draft:    '#D97706',  // naranja
  sent:     '#7C3AED',  // violeta
  accepted: '#16A34A',  // verde
  rejected: '#DC2626',  // rojo
  expired:  '#64748B',  // gris — ni "éxito" ni "error", solo venció
  paid:     '#16A34A',  // verde
};

/** Fondos suaves para badges de estado (pasteles que combinan con cada color). */
export const QUOTE_STATUS_BG_COLOR = {
  draft:    '#FFFBEB',
  sent:     '#F5F3FF',
  accepted: '#F0FDF4',
  rejected: '#FEF2F2',
  expired:  '#F1F5F9',
  paid:     '#F0FDF4',
};

/**
 * Tipos de descuento aplicables a un presupuesto.
 * FIXED: monto fijo en pesos. PERCENT: porcentaje sobre el subtotal.
 */
export const DISCOUNT_TYPE = {
  FIXED:   'fixed',
  PERCENT: 'percent',
};

/** Métodos de pago seleccionables (opcional) para un presupuesto. */
export const PAYMENT_METHOD = {
  EFECTIVO: 'efectivo',
  TRANSFERENCIA: 'transferencia',
  TARJETA: 'tarjeta',
  CHEQUE: 'cheque',
};

/** Etiquetas en español para mostrar en la UI y el PDF. */
export const PAYMENT_METHOD_LABEL = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta de crédito',
  cheque: 'Cheque',
};

/** Opciones de unidad de medida para los ítems de plantillas. */
export const UNIT_OPTIONS = [
  'unidad',
  'hora',
  'día',
  'm2',
  'ml',
  'kg',
  'servicio',
  'viaje',
];

/** Opciones predefinidas de días de validez para el selector en el perfil del negocio. */
export const VALIDITY_DAYS_OPTIONS = [7, 15, 30, 60];

/** Lista de rubros/oficios precargados para el selector en el perfil del negocio. */
export const SECTOR_OPTIONS = [
  'Mecánico',
  'Electricista',
  'Plomero',
  'Albañil',
  'Jardinero',
  'Pintor',
  'Carpintero',
  'Herrero',
  'Técnico en refrigeración',
  'Técnico informático',
  'Costurero / arreglos de ropa',
  'Peluquero / barbería',
  'Fotógrafo',
  'DJ / sonido',
  'Diseñador gráfico',
  'Community manager',
  'Developer / desarrollo web',
  'Limpieza',
  'Fletes / mudanzas',
  'Otro',
];
