import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from './config';
import { INITIAL_VIDEOS } from '../data/mockVideos';

const COLLECTION_NAME = 'videos';

/**
 * Escucha en tiempo real la colección de videos de Firestore
 */
export function subscribeVideos(onVideosUpdate, onError) {
  if (!isFirebaseConfigured || !db) {
    // Si Firebase no está configurado en modo cloud, no sobreescribir la lista local del usuario
    return () => {};
  }

  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // Si la base de datos está vacía, entregamos los videos base
          onVideosUpdate(INITIAL_VIDEOS);
        } else {
          const loadedVideos = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          onVideosUpdate(loadedVideos);
        }
      },
      (error) => {
        console.warn('Error al escuchar videos de Firestore:', error);
        if (onError) onError(error);
        onVideosUpdate(INITIAL_VIDEOS);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.warn('Error inicializando Firestore listener:', error);
    onVideosUpdate(INITIAL_VIDEOS);
    return () => {};
  }
}

/**
 * Sube un archivo de video a Firebase Storage y guarda el documento en Firestore
 */
export async function uploadVideoToFirebase(file, videoMeta, onProgress) {
  if (!isFirebaseConfigured || !db || !storage) {
    // Si no está configurado Firebase aún, retornamos el video con URL local
    return {
      id: 'local-' + Date.now(),
      videoUrl: URL.createObjectURL(file),
      ...videoMeta,
      stats: { likes: 0, comments: 0, bookmarks: 0, shares: 0 },
      isLiked: false,
      isBookmarked: false,
      comments: [],
    };
  }

  // 1. Subir el archivo binario a Storage
  const fileExt = (file.name && typeof file.name === 'string') ? (file.name.split('.').pop() || 'mp4') : 'mp4';
  const filePath = `videos/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const storageRef = ref(storage, filePath);
  const uploadTask = uploadBytesResumable(storageRef, file);

  const downloadURL = await new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });

  // 2. Guardar metadata en Firestore
  const newDoc = {
    videoUrl: downloadURL,
    author: videoMeta.author,
    description: videoMeta.description || '',
    tags: videoMeta.tags || [],
    music: videoMeta.music || {
      title: 'Sonido original',
      author: videoMeta.author?.username || 'creador',
      cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80',
    },
    thumbnail: videoMeta.thumbnail || videoMeta.cover || '',
    cover: videoMeta.cover || videoMeta.thumbnail || '',
    product: videoMeta.product || null,
    whatsapp: videoMeta.whatsapp || '',
    telegram: videoMeta.telegram || '',
    primaryChat: videoMeta.primaryChat || 'whatsapp',
    isUserUploaded: true,
    stats: {
      likes: 0,
      comments: 0,
      bookmarks: 0,
      shares: 0,
      giftsCount: 0,
    },
    comments: [],
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), newDoc);

  return {
    id: docRef.id,
    ...newDoc,
    isLiked: false,
    isBookmarked: false,
  };
}

/**
 * Incrementa o decrementa likes en Firestore
 */
export async function toggleFirestoreLike(videoId, shouldLike) {
  if (!isFirebaseConfigured || !db) return;

  try {
    const videoRef = doc(db, COLLECTION_NAME, videoId);
    await updateDoc(videoRef, {
      'stats.likes': increment(shouldLike ? 1 : -1),
    });
  } catch (error) {
    console.warn('Error al actualizar like en Firestore:', error);
  }
}

/**
 * Incrementa o decrementa bookmarks (favoritos) en Firestore
 */
export async function toggleFirestoreBookmark(videoId, shouldBookmark) {
  if (!isFirebaseConfigured || !db) return;

  try {
    const videoRef = doc(db, COLLECTION_NAME, videoId);
    await updateDoc(videoRef, {
      'stats.bookmarks': increment(shouldBookmark ? 1 : -1),
    });
  } catch (error) {
    console.warn('Error al actualizar bookmark en Firestore:', error);
  }
}

/**
 * Agrega un nuevo comentario a Firestore
 */
export async function addFirestoreComment(videoId, comment) {
  if (!isFirebaseConfigured || !db) return;

  try {
    const videoRef = doc(db, COLLECTION_NAME, videoId);
    await updateDoc(videoRef, {
      comments: arrayUnion(comment),
      'stats.comments': increment(1),
    });
  } catch (error) {
    console.warn('Error al guardar comentario en Firestore:', error);
  }
}
