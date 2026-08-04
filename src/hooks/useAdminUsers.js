import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { fetchAdminUserStats } from '../services/admin.service';
import { logError } from '../utils/errorUtils';

export function useAdminUsers() {
  const [rawUsers, setRawUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  // Estadísticas en vivo (Cloud Function): se piden una sola vez al montar,
  // separadas del listener de Firestore — este dispara seguido (ej. al
  // extender un Pro) y no tiene sentido volver a llamar la función cada vez.
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      snap => {
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setRawUsers(data);
        setLoading(false);
      },
      error => {
        logError('useAdminUsers', error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    fetchAdminUserStats()
      .then(setStats)
      .catch(() => {}); // el panel sigue funcionando sin estas stats
  }, []);

  const users = useMemo(() => {
    if (!stats) return rawUsers;
    return rawUsers.map(u => {
      const s = stats[u.id];
      if (!s) return u;
      return { ...u, lastLoginAt: s.lastLoginAt, quotesThisMonthLive: s.quotesThisMonth };
    });
  }, [rawUsers, stats]);

  return { users, loading };
}
