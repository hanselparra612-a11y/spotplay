/**
 * Extrae de forma ultra-robusta un fotograma de video y genera una miniatura Base64 JPEG.
 * Compatible con Blob, File y URLs (blob:, http:, https:).
 * Funciona tanto en navegadores de escritorio como en WebViews de Android e iOS.
 */
export function extractVideoThumbnail(videoSource, targetTime = 0.2) {
  return new Promise((resolve) => {
    try {
      if (!videoSource) return resolve(null);

      const vid = document.createElement('video');
      vid.crossOrigin = 'anonymous';
      vid.muted = true;
      vid.playsInline = true;
      vid.preload = 'auto';

      let objectUrl = null;
      if (videoSource instanceof Blob || (typeof File !== 'undefined' && videoSource instanceof File)) {
        objectUrl = URL.createObjectURL(videoSource);
        vid.src = objectUrl;
      } else if (typeof videoSource === 'string') {
        vid.src = videoSource;
      } else {
        return resolve(null);
      }

      let isFinished = false;

      const finish = (result) => {
        if (isFinished) return;
        isFinished = true;
        clearTimeout(timer);
        if (objectUrl) {
          try { URL.revokeObjectURL(objectUrl); } catch (e) {}
        }
        vid.removeAttribute('src');
        try { vid.load(); } catch (e) {}
        resolve(result);
      };

      // Timeout de seguridad para no bloquear nunca la interfaz
      const timer = setTimeout(() => {
        finish(null);
      }, 7000);

      const drawFrame = () => {
        try {
          const width = vid.videoWidth || 360;
          const height = vid.videoHeight || 640;
          if (width === 0 || height === 0) {
            return finish(null);
          }
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(width, 480);
          canvas.height = Math.round((canvas.width / width) * height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          if (dataUrl && dataUrl.length > 200) {
            finish(dataUrl);
          } else {
            finish(null);
          }
        } catch (err) {
          finish(null);
        }
      };

      vid.onloadedmetadata = () => {
        try {
          const duration = vid.duration || 1;
          const seekPos = Math.min(targetTime, Math.max(0.05, duration / 3));
          vid.currentTime = seekPos;
        } catch (e) {
          drawFrame();
        }
      };

      vid.onseeked = () => {
        drawFrame();
      };

      vid.onerror = () => {
        finish(null);
      };
    } catch (err) {
      resolve(null);
    }
  });
}
