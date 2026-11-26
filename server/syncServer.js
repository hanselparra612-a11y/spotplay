import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'public', 'uploads', 'data');
const VIDEOS_DIR = path.join(ROOT_DIR, 'public', 'uploads', 'videos');
const THUMBS_DIR = path.join(ROOT_DIR, 'public', 'uploads', 'thumbnails');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
if (!fs.existsSync(THUMBS_DIR)) fs.mkdirSync(THUMBS_DIR, { recursive: true });

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const VIDEOS_FILE = path.join(DATA_DIR, 'videos.json');

function readJson(file, defaultValue = []) {
  try {
    if (!fs.existsSync(file)) return defaultValue;
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return defaultValue;
  }
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error escribiendo archivo:', file, err);
  }
}

const server = http.createServer((req, res) => {
  // Configuración de CORS total para peticiones desde Vite y Cloudflare
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // 1.0. Endpoint dinámico de previsualización de video con imagen real para WhatsApp, Telegram y Redes Sociales (/v/:id o /api/share)
  if (req.method === 'GET' && (url.pathname.startsWith('/v/') || url.pathname === '/api/share')) {
    let videoId = '';
    if (url.pathname.startsWith('/v/')) {
      videoId = url.pathname.replace(/^\/v\//, '').split('/')[0].split('?')[0];
    } else {
      videoId = url.searchParams.get('id') || '';
    }

    const videos = readJson(VIDEOS_FILE, []);
    const video = videos.find(v => v.id === videoId);

    // Detección de protocolo y dominio público (soporta túneles Cloudflare, ngrok, localhost)
    let host = req.headers['x-forwarded-host'] || req.headers['host'];
    let proto = req.headers['x-forwarded-proto'] || (req.headers.referer?.startsWith('https') ? 'https' : 'http');
    
    // Si viene a través de túnel o proxy, asegurar HTTPS y el host público
    if (req.headers['cf-ray'] || req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']) {
      proto = 'https';
    }
    const origin = `${proto}://${host}`;

    // Extraer o generar la miniatura real del video
    let imageUrl = '';
    const thumbFileName = `${videoId}.jpg`;
    const thumbDiskPath = path.join(THUMBS_DIR, thumbFileName);

    if (fs.existsSync(thumbDiskPath)) {
      imageUrl = `${origin}/uploads/thumbnails/${thumbFileName}`;
    } else if (video && video.videoUrl) {
      const videoDiskPath = path.join(ROOT_DIR, 'public', video.videoUrl.replace(/^\//, ''));
      if (fs.existsSync(videoDiskPath)) {
        try {
          execSync(`ffmpeg -y -ss 00:00:01 -i "${videoDiskPath}" -vframes 1 -update 1 -q:v 2 "${thumbDiskPath}"`, { stdio: 'ignore', timeout: 10000 });
          if (fs.existsSync(thumbDiskPath)) {
            imageUrl = `${origin}/uploads/thumbnails/${thumbFileName}`;
          }
        } catch (e) {
          console.warn('No se pudo generar miniatura con ffmpeg:', e.message);
        }
      }
    }

    if (!imageUrl) {
      if (video?.thumbnail && !video.thumbnail.startsWith('data:')) {
        imageUrl = video.thumbnail.startsWith('http') ? video.thumbnail : `${origin}${video.thumbnail}`;
      } else if (video?.cover && !video.cover.startsWith('data:')) {
        imageUrl = video.cover.startsWith('http') ? video.cover : `${origin}${video.cover}`;
      } else if (video?.author?.avatar && video.author.avatar.startsWith('http')) {
        imageUrl = video.author.avatar;
      } else {
        imageUrl = `${origin}/apple-touch-icon.png`;
      }
    }

    const safeTitle = (video && video.description) 
      ? `🎬 ${video.description.slice(0, 70)} | Spot Play`
      : `🎬 Video de @${video?.author?.username || 'Leonardo'} en Spot Play`;
    const safeDesc = (video && video.description)
      ? `${video.description.slice(0, 140)}`
      : '🔥 ¡Mira este video en Spot Play y apoya a creadores con SpotCoins!';
    const authorName = video?.author?.username || video?.author?.name || 'Spot Play';
    const cleanVideoId = videoId || (video ? video.id : '');

    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  
  <!-- Open Graph / WhatsApp / Facebook / Telegram / Discord -->
  <meta property="og:type" content="video.other">
  <meta property="og:site_name" content="Spot Play">
  <meta property="og:url" content="${origin}/v/${cleanVideoId}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:secure_url" content="${imageUrl}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="720">
  <meta property="og:image:height" content="1280">
  <meta property="og:image:alt" content="Portada de video de @${authorName}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@SpotPlay">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <!-- Redirección Instantánea 0ms para Navegadores Humanos -->
  <meta http-equiv="refresh" content="0; url=/#video-${cleanVideoId}">
  <script>
    window.location.replace("/#video-" + encodeURIComponent("${cleanVideoId}"));
  </script>
  
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0c0f14;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      text-align: center;
    }
    .card {
      background: #141824;
      border: 1px solid rgba(255, 184, 0, 0.2);
      border-radius: 24px;
      padding: 28px 24px;
      max-width: 380px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .thumb {
      width: 100%;
      height: 260px;
      object-fit: cover;
      border-radius: 16px;
      margin-bottom: 20px;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 184, 0, 0.2);
      border-top-color: #ffb800;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { font-size: 18px; font-weight: 700; color: #ffb800; margin-bottom: 8px; }
    p { font-size: 13px; color: #a1a1aa; line-height: 1.4; margin-bottom: 20px; }
    .btn {
      background: linear-gradient(135deg, #ffb800, #ff9000);
      color: #000;
      font-weight: 800;
      font-size: 14px;
      padding: 14px 28px;
      border-radius: 99px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 15px rgba(255,184,0,0.3);
    }
  </style>
</head>
<body>
  <div class="card">
    <img src="${imageUrl}" class="thumb" alt="Miniatura">
    <div class="spinner"></div>
    <h2>Abriendo en Spot Play...</h2>
    <p>${safeDesc}</p>
    <a href="/#video-${cleanVideoId}" class="btn">▶ Ver Video Ahora</a>
  </div>
</body>
</html>`;

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    });
    res.end(html);
    return;
  }

  // 1.5. Servir archivos estáticos de /uploads/ y /videos/ con HTTP 206 Range Streaming ultra optimizado
  if ((req.method === 'GET' || req.method === 'HEAD') && (url.pathname.startsWith('/uploads/') || url.pathname.startsWith('/videos/'))) {
    const safePath = path.normalize(url.pathname).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(ROOT_DIR, 'public', safePath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const ext = path.extname(filePath).toLowerCase();
      const contentTypes = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mov': 'video/quicktime',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
      };
      const contentType = contentTypes[ext] || 'application/octet-stream';

      if (req.method === 'HEAD') {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000, immutable',
        });
        res.end();
        return;
      }

      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        // Buffer adaptativo: 3 MB en el arranque (TTFF instantáneo) y 6 MB en streaming continuo para evitar pausas/frenados
        const maxChunk = start === 0 ? 3 * 1024 * 1024 : 6 * 1024 * 1024;
        const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + maxChunk - 1, fileSize - 1);

        if (start >= fileSize || end >= fileSize) {
          res.writeHead(416, {
            'Content-Range': `bytes */${fileSize}`,
          });
          res.end();
          return;
        }

        const chunksize = end - start + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        });
        fileStream.pipe(res);
        return;
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000, immutable',
        });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Archivo no encontrado' }));
      return;
    }
  }

  // 1. Obtener videos sincronizados
  if (req.method === 'GET' && url.pathname === '/api/videos') {
    const videos = readJson(VIDEOS_FILE, []);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(videos));
    return;
  }

  // 2. Guardar nuevo video subido (con archivo base64 o metadata)
  if (req.method === 'POST' && url.pathname === '/api/videos') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);

        // 🚫 Bloqueo permanente de videos de prueba / anime descartados
        const BANNED_IDS = new Set([
          'uploaded-1795217678569',
          'uploaded-1795070804756',
          'uploaded-1795070474294',
          'uploaded-1795070274259',
          'uploaded-1795069901259'
        ]);
        if (BANNED_IDS.has(payload.id)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, reason: 'Banned test video' }));
          return;
        }

        let finalVideoUrl = payload.videoUrl;

        // Si el video viene en base64 (grabado desde la cámara o subido desde galería)
        if (payload.videoBase64) {
          const videoFileName = `video-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.mp4`;
          const filePath = path.join(VIDEOS_DIR, videoFileName);
          const rawBase64 = payload.videoBase64.includes(';base64,')
            ? payload.videoBase64.split(';base64,')[1]
            : payload.videoBase64.replace(/^data:video\/[^;]+;base64,/, '');
          fs.writeFileSync(filePath, Buffer.from(rawBase64, 'base64'));

          // Transcodificación y optimización web ultra-fluida con FFmpeg (+faststart)
          try {
            const tmpPath = filePath + '.opt.mp4';
            const stat = fs.statSync(filePath);
            // Si el video supera 8 MB, transcodificar a 720p / 2.5 Mbps H.264 para reproducción fluida sin pausas
            const ffmpegCmd = stat.size > 8 * 1024 * 1024
              ? `ffmpeg -i "${filePath}" -c:v libx264 -preset veryfast -crf 24 -maxrate 2800k -bufsize 5600k -pix_fmt yuv420p -vf "scale='min(720,iw)':-2" -c:a aac -b:a 128k -movflags +faststart "${tmpPath}" -y`
              : `ffmpeg -i "${filePath}" -c copy -movflags +faststart "${tmpPath}" -y`;

            execSync(ffmpegCmd, { stdio: 'ignore', timeout: 60000 });
            if (fs.existsSync(tmpPath) && fs.statSync(tmpPath).size > 0) {
              fs.unlinkSync(filePath);
              fs.renameSync(tmpPath, filePath);
            }
          } catch (e) {
            console.warn('FFmpeg transcoding warning (fallback activo):', e.message);
          }

          finalVideoUrl = `/uploads/videos/${videoFileName}`;

          // Generación automática de miniatura JPEG de alta resolución
          const videoId = payload.id || `uploaded-${Date.now()}`;
          const thumbFileName = `${videoId}.jpg`;
          const thumbDiskPath = path.join(THUMBS_DIR, thumbFileName);
          try {
            execSync(`ffmpeg -y -ss 00:00:01 -i "${filePath}" -vframes 1 -update 1 -q:v 2 "${thumbDiskPath}"`, { stdio: 'ignore', timeout: 15000 });
            payload.thumbnail = `/uploads/thumbnails/${thumbFileName}`;
            payload.cover = `/uploads/thumbnails/${thumbFileName}`;
          } catch (tErr) {
            console.warn('Miniatura automática warning:', tErr.message);
          }
        }

        const newVideo = {
          ...payload,
          id: payload.id || `uploaded-${Date.now()}`,
          videoUrl: finalVideoUrl,
          thumbnail: payload.thumbnail || (fs.existsSync(path.join(THUMBS_DIR, `${payload.id}.jpg`)) ? `/uploads/thumbnails/${payload.id}.jpg` : undefined),
          cover: payload.cover || (fs.existsSync(path.join(THUMBS_DIR, `${payload.id}.jpg`)) ? `/uploads/thumbnails/${payload.id}.jpg` : undefined),
          createdAt: new Date().toISOString()
        };
        delete newVideo.videoBase64;

        const currentVideos = readJson(VIDEOS_FILE, []);
        // Si ya existe lo actualiza, si no lo coloca de primero
        const existingIdx = currentVideos.findIndex(v => v.id === newVideo.id);
        if (existingIdx >= 0) {
          currentVideos[existingIdx] = newVideo;
        } else {
          currentVideos.unshift(newVideo);
        }

        writeJson(VIDEOS_FILE, currentVideos);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, video: newVideo }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 2.5. Actualizar metadata de un video existente
  if (req.method === 'PUT' && url.pathname.startsWith('/api/videos/')) {
    const targetId = url.pathname.replace('/api/videos/', '');
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const currentVideos = readJson(VIDEOS_FILE, []);
        let found = false;
        const updated = currentVideos.map(v => {
          if (v.id === targetId) {
            found = true;
            return { ...v, ...payload, id: targetId };
          }
          return v;
        });
        if (!found) {
          updated.push({ ...payload, id: targetId });
        }
        writeJson(VIDEOS_FILE, updated);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, id: targetId }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 2.6. Eliminar video permanentemente
  if (req.method === 'DELETE' && url.pathname.startsWith('/api/videos/')) {
    const targetId = url.pathname.replace('/api/videos/', '');
    const currentVideos = readJson(VIDEOS_FILE, []);
    const updated = currentVideos.filter(v => v.id !== targetId);
    writeJson(VIDEOS_FILE, updated);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, remaining: updated.length }));
    return;
  }

  // 2.6. Limpiar videos demo de fábrica y dejar solo videos subidos por el creador
  if (req.method === 'POST' && url.pathname === '/api/videos/clean-demos') {
    const currentVideos = readJson(VIDEOS_FILE, []);
    const onlyUser = currentVideos.filter(v => v.isUserUploaded || v.id.startsWith('uploaded-') || v.author?.id === 'me');
    writeJson(VIDEOS_FILE, onlyUser);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, count: onlyUser.length }));
    return;
  }

  // 3. Obtener perfiles de usuarios sincronizados
  if (req.method === 'GET' && url.pathname === '/api/users') {
    const users = readJson(USERS_FILE, []);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users));
    return;
  }

  // 4. Guardar o sincronizar perfil de creador
  if (req.method === 'POST' && url.pathname === '/api/users') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const user = JSON.parse(body);
        const users = readJson(USERS_FILE, []);
        const idx = users.findIndex(u => u.id === user.id || (u.email && u.email === user.email) || u.username === user.username);
        if (idx >= 0) {
          users[idx] = { ...users[idx], ...user };
        } else {
          users.push(user);
        }
        writeJson(USERS_FILE, users);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 5. Servir la aplicación compilada (dist/) en producción
  const DIST_DIR = path.join(ROOT_DIR, 'dist');
  if (fs.existsSync(DIST_DIR)) {
    let cleanPath = url.pathname === '/' ? '/index.html' : url.pathname;
    let distPath = path.join(DIST_DIR, cleanPath);
    if (!fs.existsSync(distPath) || !fs.statSync(distPath).isFile()) {
      distPath = path.join(DIST_DIR, 'index.html');
    }
    if (fs.existsSync(distPath) && fs.statSync(distPath).isFile()) {
      const ext = path.extname(distPath).toLowerCase();
      const contentTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.txt': 'text/plain; charset=utf-8',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.webmanifest': 'application/manifest+json',
      };
      const ct = contentTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': ct });
      fs.createReadStream(distPath).pipe(res);
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint no encontrado' }));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SpotPlay Sync Server activo en puerto ${PORT}`);
});
