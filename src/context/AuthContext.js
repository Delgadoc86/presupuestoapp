/**
 * AuthContext — estado de autenticación y datos del usuario.
 *
 * Responsabilidad: mantener sincronizado el estado del usuario autenticado
 * con Firebase Auth y su documento en Firestore en tiempo real.
 *
 * Expone:
 *   - user     → objeto FirebaseUser (o null si no hay sesión)
 *   - userData → datos del documento users/{uid} en Firestore (o null)
 *   - loading  → true mientras se resuelve el estado inicial de autenticación
 *
 * Patrón de doble listener:
 *   1. onAuthStateChanged escucha si el usuario inicia/cierra sesión.
 *   2. Cuando hay usuario, onSnapshot escucha cambios en users/{uid} en tiempo real.
 *      Esto permite que AppNavigator reaccione automáticamente cuando
 *      onboardingComplete cambia de false a true.
 *   3. Al cerrar sesión, el listener de Firestore se cancela para evitar
 *      lecturas innecesarias y errores de permisos.
 *
 * Consumidores: AppNavigator (decide qué stack mostrar), cualquier pantalla
 * que necesite el uid del usuario o sus datos de cuenta.
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

  useEffect(() => {
    let userDocUnsubscribe = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Cancelar listener anterior si el usuario cambia (ej: cierre de sesión)
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
        userDocUnsubscribe = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        // Escucha en tiempo real el documento del usuario para detectar
        // el cambio de onboardingComplete y otras actualizaciones de cuenta
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
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (userDocUnsubscribe) userDocUnsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext debe usarse dentro de AuthProvider');
  return ctx;
}
