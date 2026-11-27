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
 * Guarda un video y su archivo binario (Blob) en almacenamiento permanente IndexedDB
 */
export async function saveVideoToIndexedDB(videoItem, blob) {
  try {
    const db = await openDB(DB_NAME);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record = {
        ...videoItem,
        videoBlob: blob,
        createdAt: videoItem.createdAt || Date.now(),
      };
      // Eliminar videoUrl temporal para no persistir URLs muertas
      delete record.videoUrl;

      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
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
    let records = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    // Si la nueva base de datos está vacía, intentar migrar desde la base de datos previa
    if (records.length === 0) {
      try {
        const legacyDb = await openDB(LEGACY_DB_NAME);
        const legacyRecords = await new Promise((resolve, reject) => {
          const tx = legacyDb.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });

        if (legacyRecords.length > 0) {
          records = legacyRecords;
          // Migrar registros en segundo plano
          for (const rec of legacyRecords) {
            if (rec.videoBlob) {
              await saveVideoToIndexedDB(rec, rec.videoBlob);
            }
          }
        }
      } catch (legacyErr) {
        // No hay base de datos previa o no se pudo acceder
      }
    }

    const activeVideos = await Promise.all(
      records.map(async (rec) => {
        if (!rec.videoBlob) return null;
        try {
          const freshUrl = URL.createObjectURL(rec.videoBlob);
          let thumb = rec.thumbnail || rec.cover;
          const isRealDataThumb = thumb && typeof thumb === 'string' && thumb.startsWith('data:image');
          // Si la miniatura no es base64 embebido (p. ej. rutas rotas /uploads/thumbnails/... o nulas),
          // extraerla de inmediato desde el Blob y persistirla en IndexedDB para que cargue en 0ms
          if (!isRealDataThumb && rec.videoBlob) {
            try {
              const generatedThumb = await extractVideoThumbnail(rec.videoBlob, 0.2);
              if (generatedThumb) {
                thumb = generatedThumb;
                rec.thumbnail = generatedThumb;
                rec.cover = generatedThumb;
                saveVideoToIndexedDB(rec, rec.videoBlob).catch(() => {});
              }
            } catch (tErr) {}
          }
          return {
            ...rec,
            videoUrl: freshUrl,
            videoBlob: rec.videoBlob,
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

    return activeVideos;
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
