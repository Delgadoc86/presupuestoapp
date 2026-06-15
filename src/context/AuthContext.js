/**
 * AuthContext — estado de autenticación y datos del usuario.
 *
 * Expone:
 *   - user          → objeto FirebaseUser (o null)
 *   - userData      → datos del documento users/{uid} en Firestore (o null)
 *   - loading       → true mientras se resuelve el estado inicial de autenticación
 *   - emailVerified → refleja auth.currentUser.emailVerified; se actualiza
 *                     vía reloadUser() porque onAuthStateChanged no se dispara
 *                     cuando emailVerified cambia server-side
 *   - reloadUser()  → llama reload() en Firebase, actualiza emailVerified,
 *                     retorna el nuevo valor (true/false)
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebase.config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    let userDocUnsubscribe = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
        userDocUnsubscribe = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        setEmailVerified(firebaseUser.emailVerified);
        userDocUnsubscribe = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (snap) => {
            setUserData(snap.exists() ? snap.data() : null);
            setLoading(false);
          },
          (error) => {
            console.error('Error escuchando usuario:', error);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setUserData(null);
        setEmailVerified(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (userDocUnsubscribe) userDocUnsubscribe();
    };
  }, []);

  async function reloadUser() {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const verified = auth.currentUser.emailVerified;
    setEmailVerified(verified);
    return verified;
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, emailVerified, reloadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext debe usarse dentro de AuthProvider');
  return ctx;
}
