/**
 * useHistoryQuotes — carga paginada de presupuestos para el historial.
 *
 * A diferencia de useQuotes (onSnapshot, tiempo real), este hook usa getDocs
 * (one-shot) con paginación real via startAfter. Esto evita traer toda la
 * colección cuando el usuario tiene muchos presupuestos.
 *
 * Mutaciones (delete, status change) se reflejan actualizando el estado local
 * directamente, sin re-fetch. useFocusEffect en HistoryScreen llama a refresh()
 * cuando el usuario regresa de otras pantallas.
 *
 * @param {{ statusFilter: string|null, dateFilter: string|null }} opts
 * @returns {{
 *   quotes: Array,
 *   loading: boolean,
 *   loadingMore: boolean,
 *   hasMore: boolean,
 *   loadMore: function,
 *   refresh: function,
 *   removeQuote: function,
 *   updateQuoteLocal: function,
 * }}
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { getDocs } from 'firebase/firestore';
import { useAuthContext } from '../context/AuthContext';
import { buildHistoryQuery, PAGE_SIZE } from '../services/quotes.service';

export function useHistoryQuotes({ statusFilter = null, dateFilter = null } = {}) {
  const { user } = useAuthContext();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const lastDocRef = useRef(null);

  const fetchFirst = useCallback(async () => {
    if (!user) {
      setQuotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    lastDocRef.current = null;
    try {
      const q = buildHistoryQuery(user.uid, { statusFilter, dateFilter, lastDoc: null });
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
      setQuotes(docs);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (e) {
      console.error('[useHistoryQuotes]', e);
      setQuotes([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter, dateFilter]);

  useEffect(() => {
    fetchFirst();
  }, [fetchFirst]);

  const loadMore = useCallback(async () => {
    if (!user || !hasMore || loadingMore || !lastDocRef.current) return;
    setLoadingMore(true);
    try {
      const q = buildHistoryQuery(user.uid, { statusFilter, dateFilter, lastDoc: lastDocRef.current });
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (snap.docs.length > 0) {
        lastDocRef.current = snap.docs[snap.docs.length - 1];
      }
      setQuotes(prev => [...prev, ...docs]);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (e) {
      console.error('[useHistoryQuotes loadMore]', e);
    } finally {
      setLoadingMore(false);
    }
  }, [user, statusFilter, dateFilter, hasMore, loadingMore]);

  const removeQuote = useCallback((quoteId) => {
    setQuotes(prev => prev.filter(q => q.id !== quoteId));
  }, []);

  const updateQuoteLocal = useCallback((quoteId, changes) => {
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, ...changes } : q));
  }, []);

  return {
    quotes,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh: fetchFirst,
    removeQuote,
    updateQuoteLocal,
  };
}
