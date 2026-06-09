/**
 * Estados posibles de un presupuesto.
 * Se almacenan como strings en Firestore (campo status).
 */
export const QUOTE_STATUS = {
  DRAFT:    'draft',     // creado pero no enviado al cliente
  SENT:     'sent',      // enviado, esperando respuesta
  ACCEPTED: 'accepted',  // cliente confirmó
  REJECTED: 'rejected',  // cliente rechazó
  PAID:     'paid',      // trabajo abonado
};

/** Etiquetas en español para mostrar en la UI. */
export const QUOTE_STATUS_LABEL = {
  draft:    'Borrador',
  sent:     'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  paid:     'Pagado',
};

/** Colores asociados a cada estado (usados en badges y gráficos). */
export const QUOTE_STATUS_COLOR = {
  draft:    '#868E96',  // gris
  sent:     '#339AF0',  // azul
  accepted: '#40C057',  // verde
  rejected: '#FA5252',  // rojo
  paid:     '#20C997',  // verde agua
};

/**
 * Tipos de descuento aplicables a un presupuesto.
 * FIXED: monto fijo en pesos. PERCENT: porcentaje sobre el subtotal.
 */
export const DISCOUNT_TYPE = {
  FIXED:   'fixed',
  PERCENT: 'percent',
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
