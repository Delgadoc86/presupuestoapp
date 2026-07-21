/**
 * useClientQuotes — historial de presupuestos de un cliente en tiempo real.
 *
 * Usa la query userId + clientId + orderBy(createdAt desc), respaldada por
 * el índice compuesto declarado en firestore.indexes.json. Es la fuente de
 * verdad real del historial y del conteo por cliente — no hay ningún
 * contador desnormalizado que pueda desincronizarse.
 *
 * @param {string|null} clientId
 * @returns {{ quotes: Array, loading: boolean }}
 */
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { useAuthContext } from '../context/AuthContext';
import { logError } from '../utils/errorUtils';

export function useClientQuotes(clientId) {
  const { user } = useAuthContext();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !clientId) {
      setQuotes([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'quotes'),
      where('userId', '==', user.uid),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setQuotes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        logError('useClientQuotes', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, clientId]);

  return { quotes, loading };
}
