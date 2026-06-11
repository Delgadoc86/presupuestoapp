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

function _toDate(ts) {
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
}

/**
 * Retorna el estado efectivo del plan del usuario.
 * @param {Object|null} userData
 * @returns {'demo'|'pro_active'|'pro_expired'|'suspended'}
 */
export function getPlanStatus(userData) {
  if (!userData) return 'demo';
  if (userData.enabled === false) return 'suspended';

  const isPro = userData.pro === true || userData.planType === 'pro';
  if (!isPro) return 'demo';

  if (userData.proExpiresAt) {
    const expires = _toDate(userData.proExpiresAt);
    if (expires && expires < new Date()) return 'pro_expired';
  }
  return 'pro_active';
}

/**
 * Retorna true solo si el usuario tiene Pro vigente.
 * Pro vencido cuenta como false (= se trata como Demo).
 * @param {Object|null} userData
 * @returns {boolean}
 */
export function isEffectivelyPro(userData) {
  return getPlanStatus(userData) === 'pro_active';
}

/**
 * Días hasta el vencimiento del plan Pro.
 *   > 0  → restan N días
 *   = 0  → vence hoy
 *   < 0  → venció hace |N| días
 * Retorna null si no hay fecha de vencimiento configurada.
 * @param {Object|null} userData
 * @returns {number|null}
 */
export function getDaysUntilExpiry(userData) {
  if (!userData?.proExpiresAt) return null;
  const expires = _toDate(userData.proExpiresAt);
  if (!expires) return null;
  const diffMs = expires - new Date();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formatea proExpiresAt como DD/MM/YYYY para mostrar en UI.
 * @param {Object|null} userData
 * @returns {string|null}
 */
export function formatExpiryDate(userData) {
  if (!userData?.proExpiresAt) return null;
  const d = _toDate(userData.proExpiresAt);
  if (!d) return null;
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
