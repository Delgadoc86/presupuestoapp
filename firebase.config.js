import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Proyecto actual usado como compatibilidad si no hay variables de entorno.
const fallbackConfig = {
  apiKey: 'AIzaSyByGGHp3pU-P-kqVqqf3XnANEn_DcO_Geg',
  authDomain: 'presupuesto-7d9e2.firebaseapp.com',
  projectId: 'presupuesto-7d9e2',
  storageBucket: 'presupuesto-7d9e2.firebasestorage.app',
  messagingSenderId: '1079531352489',
  appId: '1:1079531352489:android:05cf080506713a5200d4b8',
};

const environmentConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const configuredValues = Object.values(environmentConfig).filter(Boolean);
if (configuredValues.length > 0 && configuredValues.length !== Object.keys(environmentConfig).length) {
  throw new Error('La configuración EXPO_PUBLIC_FIREBASE_* está incompleta');
}

// Sin variables de entorno se conserva el proyecto actual para no romper
// instalaciones ni desarrollo local durante la migración.
const firebaseConfig = configuredValues.length > 0 ? environmentConfig : fallbackConfig;

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');
