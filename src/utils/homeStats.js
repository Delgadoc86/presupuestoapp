/**
 * Deriva el estado de las 4 tarjetas de conteo de HomeScreen a partir del
 * resultado de Promise.allSettled sobre las 4 queries getCountFromServer
 * (una por estado). Separado en una función pura para poder testear el
 * manejo de fallos parciales sin necesitar el emulador ni Firestore real.
 *
 * @param {string[]} statuses - en el mismo orden que los resultados.
 * @param {PromiseSettledResult[]} results - resultado de Promise.allSettled,
 *   cada uno con forma { status: 'fulfilled', value: { data: () => ({count}) } }
 *   o { status: 'rejected', reason }.
 * @returns {Record<string, { value: number|null, error: boolean }>}
 */
export function deriveStatusCounts(statuses, results) {
  const next = {};
  statuses.forEach((status, i) => {
    const result = results[i];
    next[status] = result && result.status === 'fulfilled'
      ? { value: result.value.data().count, error: false }
      : { value: null, error: true };
  });
  return next;
}
