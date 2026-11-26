// =====================================================================
// 🔐 SERVICIO DE AUTENTICACIÓN REAL FIREBASE - SPOTPLAY
// Soporta Registro con Correo/Password, Inicio con Google y sesión persistente.
// Incluye modo offline/demo transparente cuando Firebase no está activo.
// =====================================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './config';

const googleProvider = new GoogleAuthProvider();

/**
 * 📝 Registrar nuevo usuario en Firebase Auth + perfil en Firestore
 */
export async function registerWithFirebase({ email, password, name, username }) {
  if (!isFirebaseConfigured || !auth) {
    // Modo demostración offline
    const cleanUsername = (username || email.split('@')[0]).replace(/^@/, '').toLowerCase().trim();
    return {
      id: 'demo-' + Date.now(),
      name: name || cleanUsername,
      username: cleanUsername,
      email,
      avatar: `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 1000)}?w=200&auto=format&fit=crop&q=80`,
      bio: 'Creador oficial en Spot Play ✨🎥',
      followingCount: 0,
      followersCount: '0',
      likesCount: '0',
      wallet: {
        balanceCOP: 0,
        coins: 20, // 🎁 20 SpotCoins de bienvenida
        giftEarningsCOP: 0,
      },
    };
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;
  const cleanUsername = (username || email.split('@')[0]).replace(/^@/, '').toLowerCase().trim();
  const avatarUrl = `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 1000)}?w=200&auto=format&fit=crop&q=80`;

  await updateProfile(user, {
    displayName: name || cleanUsername,
    photoURL: avatarUrl,
  });

  const userProfile = {
    id: user.uid,
    name: name || cleanUsername,
    username: cleanUsername,
    email,
    avatar: avatarUrl,
    bio: 'Nuevo creador en Spot Play ✨🎥',
    followingCount: 0,
    followersCount: '0',
    likesCount: '0',
    wallet: {
      balanceCOP: 0,
      coins: 20, // 🎁 20 SpotCoins de regalo
      giftEarningsCOP: 0,
    },
    createdAt: serverTimestamp(),
  };

  if (db) {
    await setDoc(doc(db, 'users', user.uid), userProfile);
  }

  return userProfile;
}

/**
 * 🔑 Iniciar sesión con Correo y Contraseña
 */
export async function loginWithFirebase({ email, password }) {
  if (!isFirebaseConfigured || !auth) {
    const existingUsername = email.split('@')[0].toLowerCase();
    return {
      id: 'demo-' + Date.now(),
      name: existingUsername,
      username: existingUsername,
      email,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      bio: 'Bienvenido a Spot Play ✨',
      followingCount: 0,
      followersCount: '0',
      likesCount: '0',
      wallet: {
        balanceCOP: 0,
        coins: 20,
        giftEarningsCOP: 0,
      },
    };
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  if (db) {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      return { id: user.uid, ...userDoc.data() };
    }
  }

  return {
    id: user.uid,
    name: user.displayName || email.split('@')[0],
    username: email.split('@')[0].toLowerCase(),
    email: user.email,
    avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    followingCount: 0,
    followersCount: '0',
    likesCount: '0',
    wallet: { balanceCOP: 0, coins: 20, giftEarningsCOP: 0 },
  };
}

/**
 * 🌐 Iniciar sesión con Google (1 Toque)
 */
export async function loginWithGoogle() {
  if (!isFirebaseConfigured || !auth) {
    return {
      id: 'google-demo-' + Date.now(),
      name: 'Usuario Google',
      username: 'creador_google',
      email: 'creador@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      bio: 'Sesión iniciada con Google en Spot Play 🚀',
      followingCount: 5,
      followersCount: '340',
      likesCount: '1.5K',
      wallet: { balanceCOP: 0, coins: 20, giftEarningsCOP: 0, affiliateEarningsCOP: 0, pendingCOP: 0 },
    };
  }

  const credential = await signInWithPopup(auth, googleProvider);
  const user = credential.user;
  const cleanUsername = (user.email ? user.email.split('@')[0] : 'usuario_' + Date.now()).toLowerCase();

  let userProfile = {
    id: user.uid,
    name: user.displayName || cleanUsername,
    username: cleanUsername,
    email: user.email,
    avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bio: 'Creador en Spot Play 🚀',
    followingCount: 0,
    followersCount: '0',
    likesCount: '0',
    wallet: { balanceCOP: 0, coins: 20, giftEarningsCOP: 0 },
  };

  if (db) {
    const userRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userRef);
    if (existing.exists()) {
      userProfile = { id: user.uid, ...existing.data() };
    } else {
      await setDoc(userRef, { ...userProfile, createdAt: serverTimestamp() });
    }
  }

  return userProfile;
}

/**
 * 🚪 Cerrar sesión en Firebase
 */
export async function logoutFirebase() {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
}
