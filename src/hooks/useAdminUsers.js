import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { logError } from '../utils/errorUtils';

export function useAdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      snap => {
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setUsers(data);
        setLoading(false);
      },
      error => {
        logError('useAdminUsers', error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { users, loading };
}
