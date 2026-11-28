import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDjjnPqcGuViCJ6HsHOgA15jx7YCIW0A5w',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'spotplay-3f3ec.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'spotplay-3f3ec',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'spotplay-3f3ec.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '388872561555',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:388872561555:web:8f02a97934083de36abe66',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-FL05RV7GCF',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket
);

let app = null;
let db = null;
let storage = null;
let auth = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    console.log('✅ Firebase inicializado correctamente');
  } catch (error) {
    console.warn('⚠️ Error al inicializar Firebase:', error);
  }
} else {
  console.log('ℹ️ Firebase en modo Demostración local (agrega tus credenciales en .env.local para sincronizar con la nube).');
}

export { app, db, storage, auth };
