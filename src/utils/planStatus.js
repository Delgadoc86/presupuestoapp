/**
 * Lógica de estado de plan calculada en cliente.
 * No modifica Firestore — solo lee campos del objeto userData.
 *
 * Estados posibles:
 *   'suspended'   — enabled === false
 *   'pro_active'  — planType === 'pro' y proExpiresAt no venció (o es null = sin vencimiento)
 *   'pro_expired' — planType === 'pro' y proExpiresAt < ahora
 *   'demo'        — plan gratuito con límite mensual
 */
import { APP_CONFIG } from '../config/appConfig';
import { getCurrentYearMonth, timestampToDate, formatDateAR, getDaysRemaining } from './dateUtils';

const PLAN_LABELS = {
  demo: 'Plan Demo',
  pro_active: 'Plan Pro',
  pro_expired: 'Pro vencido',
  suspended: 'Suspendido',
};

const PLAN_BADGE_COLORS = {
  demo: '#F08C00',
  pro_active: '#2F9E44',
  pro_expired: '#ADB5BD',
  suspended: '#FA5252',
};

/**
 * Determina el estado efectivo del plan y retorna un objeto completo con toda la
 * información derivada del userData. Fuente única de verdad para lógica de plan.
 *
 * @param {Object|null} userData - Documento users/{uid} de Firestore.
 * @returns {{
 *   status: 'demo'|'pro_active'|'pro_expired'|'suspended',
 *   label: string,
 *   isProActive: boolean,
 *   isSuspended: boolean,
 *   canCreateQuote: boolean,
 *   remainingDays: number|null,
 *   expiresAt: Date|null,
 *   expiryDateFormatted: string|null,
 *   quoteLimit: number,
 *   quotesThisMonth: number,
 *   demoRemainingQuotes: number,
 * }}
 */
export function getPlanStatus(userData) {
  // Determinar status string
  let status;
  if (!userData || userData.enabled === false) {
    status = !userData ? 'demo' : 'suspended';
  } else {
    const isPro = userData.pro === true || userData.planType === 'pro';
    if (!isPro) {
      status = 'demo';
    } else if (userData.proExpiresAt) {
      const expires = timestampToDate(userData.proExpiresAt);
      status = expires && expires < new Date() ? 'pro_expired' : 'pro_active';
    } else {
      status = 'pro_active';
    }
  }

  const isProActive = status === 'pro_active';
  const isSuspended = status === 'suspended';

  const expiresAt = timestampToDate(userData?.proExpiresAt ?? null);
  const remainingDays = userData?.proExpiresAt ? getDaysRemaining(userData.proExpiresAt) : null;
  const expiryDateFormatted = expiresAt ? formatDateAR(userData?.proExpiresAt) : null;

  const quoteLimit = userData?.quoteLimit ?? APP_CONFIG.demoQuoteLimit;
  const currentMonth = getCurrentYearMonth();
  const quotesThisMonth =
    (userData?.quoteMonth ?? '') === currentMonth ? (userData?.quotesThisMonth ?? 0) : 0;

  const canCreateQuote = !isSuspended && (isProActive || quotesThisMonth < quoteLimit);
  const demoRemainingQuotes = Math.max(0, quoteLimit - quotesThisMonth);

  return {
    status,
    label: PLAN_LABELS[status] ?? status,
    isProActive,
    isSuspended,
    canCreateQuote,
    remainingDays,
    expiresAt,
    expiryDateFormatted,
    quoteLimit,
    quotesThisMonth,
    demoRemainingQuotes,
  };
}

/**
 * Retorna true solo si el usuario tiene Pro vigente (no vencido).
 * Pro vencido = false (se trata como Demo).
 */
export function isEffectivelyPro(userData) {
  return getPlanStatus(userData).isProActive;
}

/**
 * Días hasta el vencimiento (positivo) o desde el vencimiento (negativo).
 * Retorna null si no hay fecha de vencimiento.
 */
export function getDaysUntilExpiry(userData) {
  return getPlanStatus(userData).remainingDays;
}

/** Formatea proExpiresAt como DD/MM/YYYY. Retorna null si no hay fecha. */
export function formatExpiryDate(userData) {
  return getPlanStatus(userData).expiryDateFormatted;
}

/** true si el usuario puede crear un nuevo presupuesto según su plan y límites. */
export function canCreateQuote(userData) {
  return getPlanStatus(userData).canCreateQuote;
}

/** Presupuestos restantes este mes para usuarios Demo. 0 si alcanzó el límite. */
export function getDemoRemainingQuotes(userData) {
  return getPlanStatus(userData).demoRemainingQuotes;
}

/** Etiqueta legible del plan actual. */
export function getPlanLabel(userData) {
  return getPlanStatus(userData).label;
}

/** Color de badge según el estado del plan. */
export function getPlanBadgeColor(userData) {
  return PLAN_BADGE_COLORS[getPlanStatus(userData).status] ?? PLAN_BADGE_COLORS.demo;
}

/** Info de vencimiento Pro en un solo objeto. */
export function getProExpirationInfo(userData) {
  const { remainingDays, expiresAt, expiryDateFormatted } = getPlanStatus(userData);
  return { remainingDays, expiresAt, expiryDateFormatted };
}
