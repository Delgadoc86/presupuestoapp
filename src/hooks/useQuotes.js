/**
 * useQuotes — lista de presupuestos del usuario en tiempo real.
 *
 * Suscribe a la colección quotes filtrada por userId via onSnapshot.
 * Los cambios en Firestore (nuevo presupuesto, cambio de estado, eliminación)
 * se reflejan automáticamente en todas las pantallas que usen este hook.
 *
 * El sort por createdAt se hace en el cliente porque agregar orderBy('createdAt')
 * en la query requeriría un índice compuesto en Firestore (userId + createdAt).
 *
 * @returns {{ quotes: Array, loading: boolean }}
 */
import { useState, useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { useAuthContext } from '../context/AuthContext';
import { getQuotesQuery } from '../services/quotes.service';

export function useQuotes() {
  const { user } = useAuthContext();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setQuotes([]);
      setLoading(false);
      return;
    }

    const q = getQuotesQuery(user.uid);

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setQuotes(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando presupuestos:', error);
        setLoading(false);
      }
    );

    // Cancelar la suscripción cuando el componente se desmonta o el usuario cambia
    return unsubscribe;
  }, [user]);

  return { quotes, loading };
}
