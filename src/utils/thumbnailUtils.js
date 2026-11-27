/**
 * Extrae de forma ultra-robusta un fotograma de video y genera una miniatura Base64 JPEG.
 * Compatible con Blob, File y URLs (blob:, http:, https:).
 * Diseñado específicamente para WebViews de Android (Capacitor/Cordova) y navegadores móviles.
 */
export function extractVideoThumbnail(videoSource, targetTime = 0.2) {
  return new Promise((resolve) => {
    try {
      if (!videoSource) return resolve(null);

      const vid = document.createElement('video');
      vid.crossOrigin = 'anonymous';
      vid.muted = true;
      vid.defaultMuted = true;
      vid.playsInline = true;
      vid.setAttribute('playsinline', 'true');
      vid.setAttribute('webkit-playsinline', 'true');
      vid.preload = 'auto';

      // 🚀 En WebViews móviles de Android/Capacitor, elementos de video desconectados del DOM
      // frecuentemente sufren optimizaciones de ahorro de energía y NO decodifican fotogramas.
      // Insertarlo temporalmente en el DOM asegura decodificación por hardware al 100%.
      vid.style.cssText =
        'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1000;';
      if (typeof document !== 'undefined' && document.body) {
        document.body.appendChild(vid);
      }

      let objectUrl = null;
      if (videoSource instanceof Blob || (typeof File !== 'undefined' && videoSource instanceof File)) {
        objectUrl = URL.createObjectURL(videoSource);
        vid.src = objectUrl;
      } else if (typeof videoSource === 'string') {
        vid.src = videoSource;
      } else {
        if (vid.parentNode) vid.parentNode.removeChild(vid);
        return resolve(null);
      }

      let isFinished = false;

      const finish = (result) => {
        if (isFinished) return;
        isFinished = true;
        clearTimeout(timer);
        clearTimeout(kickTimer);

        if (vid.parentNode) {
          try {
            vid.parentNode.removeChild(vid);
          } catch (e) {}
        }
        if (objectUrl) {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch (e) {}
        }
        vid.removeAttribute('src');
        try {
          vid.load();
        } catch (e) {}
        resolve(result);
      };

      // Timeout de seguridad máximo (3 segundos)
      const timer = setTimeout(() => {
        finish(null);
      }, 3500);

      const drawFrame = () => {
        try {
          const width = vid.videoWidth || 360;
          const height = vid.videoHeight || 640;
          if (width === 0 || height === 0) {
            return;
          }
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(width, 480);
          canvas.height = Math.round((canvas.width / width) * height);
          const ctx = canvas.getContext('2d');
          if (!ctx) return finish(null);

          ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          if (dataUrl && dataUrl.length > 200) {
            finish(dataUrl);
          }
        } catch (err) {
          // Si canvas está sucio o falla CORS, resolver null
          finish(null);
        }
      };

      let seekAttempted = false;
      const doSeek = () => {
        if (seekAttempted || isFinished) return;
        seekAttempted = true;
        try {
          const duration = vid.duration || 1;
          const seekPos = Math.min(targetTime, Math.max(0.05, duration / 4));
          vid.currentTime = seekPos;
        } catch (e) {
          drawFrame();
        }
      };

      vid.onloadedmetadata = doSeek;
      vid.onloadeddata = doSeek;
      vid.oncanplay = doSeek;
      vid.onseeked = drawFrame;
      vid.ontimeupdate = () => {
        if (vid.videoWidth > 0) drawFrame();
      };

      vid.onerror = () => {
        finish(null);
      };

      // Iniciar carga explícita
      try {
        vid.load();
      } catch (e) {}

      // "Kick" de decodificación para WebViews que requieren un micro-play
      const kickTimer = setTimeout(() => {
        if (isFinished) return;
        if (vid.videoWidth > 0) {
          drawFrame();
        } else {
          try {
            const p = vid.play();
            if (p && p.then) {
              p.then(() => {
                setTimeout(() => {
                  try { vid.pause(); } catch (e) {}
                  drawFrame();
                }, 60);
              }).catch(() => {
                drawFrame();
              });
            }
          } catch (e) {
            drawFrame();
          }
        }
      }, 350);

    } catch (err) {
      resolve(null);
    }
  });
}
