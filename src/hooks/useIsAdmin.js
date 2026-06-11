import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { useAuthContext } from '../context/AuthContext';

export function useIsAdmin() {
  const { user } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    getDoc(doc(db, 'admins', user.uid))
      .then(snap => setIsAdmin(snap.exists()))
      .catch(() => setIsAdmin(false))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  return { isAdmin, loading };
}
