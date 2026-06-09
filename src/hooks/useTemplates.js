/**
 * useTemplates — lista de plantillas del usuario en tiempo real.
 *
 * Mismo patrón que useQuotes: suscripción onSnapshot filtrada por userId,
 * con sort en el cliente para evitar índice compuesto en Firestore.
 *
 * Usado en:
 *   - TemplateListScreen (listado y gestión de plantillas)
 *   - QuoteFormScreen    (selector "Usar plantilla" al crear presupuesto)
 *
 * @returns {{ templates: Array, loading: boolean }}
 */
import { useState, useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { useAuthContext } from '../context/AuthContext';
import { getTemplatesQuery } from '../services/templates.service';

export function useTemplates() {
  const { user } = useAuthContext();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    const q = getTemplatesQuery(user.uid);

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          // Sort en cliente para evitar índice compuesto (userId + createdAt) en Firestore
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setTemplates(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando plantillas:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  return { templates, loading };
}
