import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reemplazá estos valores con los de tu proyecto Firebase
// Firebase Console → Project Settings → Your apps → SDK config
const firebaseConfig = {
  apiKey: 'AIzaSyAA7ohw_lTLB6oiWC8f5Fu5vc39JMrzGxI',
  authDomain: 'presupuesto-99747.firebaseapp.com',
  projectId: 'presupuesto-99747',
  storageBucket: 'presupuesto-99747.firebasestorage.app',
  messagingSenderId: '880211527939',
  appId: '1:880211527939:web:91e58c23eb6d291ddf4136',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
