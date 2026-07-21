/**
 * useClients — lista completa de clientes del usuario (activos y archivados)
 * en tiempo real.
 *
 * Devuelve TODOS los clientes sin filtrar por archived: cada pantalla que lo
 * consume deriva la vista que necesita (activos para el listado/selector,
 * archivados para la vista de restauración) filtrando en el cliente — mismo
 * criterio que ya usa el resto de la app (useQuotes + filtros locales) para
 * no multiplicar hooks por cada combinación de filtro.
 *
 * @returns {{ clients: Array, loading: boolean }}
 */
import { useState, useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { useAuthContext } from '../context/AuthContext';
import { getClientsQuery } from '../services/clients.service';
import { logError } from '../utils/errorUtils';

export function useClients() {
  const { user } = useAuthContext();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setClients([]);
      setLoading(false);
      return;
    }

    const q = getClientsQuery(user.uid);

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'es', { sensitivity: 'base' }));
        setClients(data);
        setLoading(false);
      },
      (error) => {
        logError('useClients', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  return { clients, loading };
}
