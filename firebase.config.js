import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reemplazá estos valores con los de tu proyecto Firebase
// Firebase Console → Project Settings → Your apps → SDK config
const firebaseConfig = {
  apiKey: 'AIzaSyByGGHp3pU-P-kqVqqf3XnANEn_DcO_Geg',
  authDomain: 'presupuesto-7d9e2.firebaseapp.com',
  projectId: 'presupuesto-7d9e2',
  storageBucket: 'presupuesto-7d9e2.firebasestorage.app',
  messagingSenderId: '1079531352489',
  appId: '1:1079531352489:android:05cf080506713a5200d4b8',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
