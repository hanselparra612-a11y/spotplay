// Capa de persistencia permanente en IndexedDB para videos grabados y subidos
import { extractVideoThumbnail } from './thumbnailUtils.js';

const DB_NAME = 'VideoSpotMediaDB';
const LEGACY_DB_NAME = 'TokTikMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'recorded_videos';

function openDB(customDbName = DB_NAME) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no soportado en este entorno'));
      return;
    }
    const request = indexedDB.open(customDbName, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

/**
 * Guarda un video y su archivo binario en almacenamiento permanente IndexedDB.
 * En Android WebView, un objeto 'File' directo suele lanzar DataCloneError o perder permisos de content://.
 * Convertir a ArrayBuffer garantiza persistencia binaria 100% libre de fallos de clonación.
 */
export async function saveVideoToIndexedDB(videoItem, blob) {
  try {
    const db = await openDB(DB_NAME);

    // Si no se proporcionó un nuevo blob, intentar preservar el binary blob previo
    let binaryData = blob;
    let mimeType = blob?.type;

    if (!blob) {
      try {
        const existingRecord = await new Promise((res) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(videoItem.id);
          req.onsuccess = () => res(req.result || null);
          req.onerror = () => res(null);
        });
        if (existingRecord) {
          binaryData = existingRecord.videoBlob;
          mimeType = existingRecord.mimeType || mimeType;
        }
      } catch (exErr) {}
    }

    mimeType = mimeType || 'video/mp4';

    if (blob instanceof Blob || (typeof File !== 'undefined' && blob instanceof File)) {
      try {
        binaryData = await blob.arrayBuffer();
      } catch (abErr) {
        binaryData = blob;
      }
    }

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record = {
        ...videoItem,
        videoBlob: binaryData,
        mimeType,
        createdAt: videoItem.createdAt || Date.now(),
      };
      // Eliminar videoUrl temporal para no persistir URLs muertas
      delete record.videoUrl;

      const req = store.put(record);
      req.onsuccess = () => {
        // Backup de metadatos liviano en localStorage para visibilidad inmediata
        try {
          const metaKey = 'spotplay_user_uploaded_meta_v2';
          const existingMeta = JSON.parse(localStorage.getItem(metaKey) || '[]');
          const withoutCurrent = existingMeta.filter((v) => v.id !== videoItem.id);
          const metaToSave = { ...videoItem, mimeType };
          delete metaToSave.videoUrl;
          delete metaToSave.videoBlob;
          localStorage.setItem(metaKey, JSON.stringify([metaToSave, ...withoutCurrent]));
        } catch (mErr) {}
        resolve(true);
      };
      req.onerror = () => {
        console.warn('Error en request put de IndexedDB:', req.error);
        resolve(false);
      };
      tx.onerror = () => {
        console.warn('Error en transacción IndexedDB:', tx.error);
        resolve(false);
      };
      tx.onabort = () => {
        console.warn('Transacción abortada en IndexedDB:', tx.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('Error guardando video en IndexedDB:', err);
    return false;
  }
}

/**
 * Carga todos los videos guardados en IndexedDB y regenera URLs válidas para la sesión activa,
 * con migración automática desde TokTikMediaDB si es necesario.
 */
export async function loadVideosFromIndexedDB() {
  try {
    const db = await openDB(DB_NAME);
    let records = await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    // Si la nueva base de datos está vacía, intentar migrar desde la base de datos previa
    if (records.length === 0) {
      try {
        const legacyDb = await openDB(LEGACY_DB_NAME);
        const legacyRecords = await new Promise((resolve) => {
          const tx = legacyDb.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });

        if (legacyRecords.length > 0) {
          records = legacyRecords;
        }
      } catch (legacyErr) {
        // No hay base de datos previa o no se pudo acceder
      }
    }

    const activeVideos = await Promise.all(
      records.map(async (rec) => {
        if (!rec.videoBlob) return null;
        try {
          // Convertir ArrayBuffer a Blob si fue guardado como buffer binario
          let usableBlob = rec.videoBlob;
          if (usableBlob instanceof ArrayBuffer) {
            usableBlob = new Blob([usableBlob], { type: rec.mimeType || 'video/mp4' });
          } else if (usableBlob && !(usableBlob instanceof Blob)) {
            usableBlob = new Blob([usableBlob], { type: rec.mimeType || 'video/mp4' });
          }

          const freshUrl = URL.createObjectURL(usableBlob);
          let thumb = rec.thumbnail || rec.cover;
          const isRealDataThumb = thumb && typeof thumb === 'string' && thumb.startsWith('data:image');
          // Si la miniatura no es base64 embebido (p. ej. rutas rotas /uploads/thumbnails/... o nulas),
          // extraerla de inmediato desde el Blob y persistirla en IndexedDB para que cargue en 0ms
          if (!isRealDataThumb && usableBlob) {
            try {
              const generatedThumb = await extractVideoThumbnail(usableBlob, 0.2);
              if (generatedThumb) {
                thumb = generatedThumb;
                rec.thumbnail = generatedThumb;
                rec.cover = generatedThumb;
                saveVideoToIndexedDB(rec, usableBlob).catch(() => {});
              }
            } catch (tErr) {}
          }
          return {
            ...rec,
            videoUrl: freshUrl,
            videoBlob: usableBlob,
            thumbnail: thumb || rec.thumbnail,
            cover: thumb || rec.cover,
          };
        } catch (e) {
          return null;
        }
      })
    );

    return activeVideos
      .filter(Boolean)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.warn('Error leyendo videos de IndexedDB:', err);
    return [];
  }
}

/**
 * Elimina un video de IndexedDB por ID
 */
export async function deleteVideoFromIndexedDB(id) {
  try {
    const db = await openDB(DB_NAME);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error eliminando video de IndexedDB:', err);
    return false;
  }
}

/**
 * Recupera el archivo binario de un video desde IndexedDB si está disponible localmente
 */
export async function getVideoBlobFromIndexedDB(id) {
  if (!id) return null;
  try {
    const db = await openDB(DB_NAME);
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const rec = req.result;
        if (!rec) return resolve(null);
        if (rec.videoBlob) return resolve(rec.videoBlob);
        if (rec.arrayBuffer) {
          const b = new Blob([rec.arrayBuffer], { type: rec.mimeType || 'video/mp4' });
          return resolve(b);
        }
        resolve(null);
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}
