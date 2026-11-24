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

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

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

  // 1.5. Servir archivos estáticos de /uploads/ y /videos/ con HTTP 206 Range Streaming ultra optimizado
  if (req.method === 'GET' && (url.pathname.startsWith('/uploads/') || url.pathname.startsWith('/videos/'))) {
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
      };
      const contentType = contentTypes[ext] || 'application/octet-stream';

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
        let finalVideoUrl = payload.videoUrl;

        // Si el video viene en base64 (grabado desde la cámara o subido desde galería)
        if (payload.videoBase64) {
          const videoFileName = `video-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.mp4`;
          const filePath = path.join(VIDEOS_DIR, videoFileName);
          const rawBase64 = payload.videoBase64.includes(';base64,')
            ? payload.videoBase64.split(';base64,')[1]
            : payload.videoBase64.replace(/^data:video\/[^;]+;base64,/, '');
          fs.writeFileSync(filePath, Buffer.from(rawBase64, 'base64'));

          // Optimización instantánea con FFmpeg (+faststart) para mover metadatos moov al inicio
          try {
            const tmpPath = filePath + '.fast.mp4';
            execSync(`ffmpeg -i "${filePath}" -c copy -movflags +faststart "${tmpPath}" -y`, { stdio: 'ignore' });
            if (fs.existsSync(tmpPath) && fs.statSync(tmpPath).size > 0) {
              fs.unlinkSync(filePath);
              fs.renameSync(tmpPath, filePath);
            }
          } catch (e) {
            console.warn('FFmpeg faststart warning:', e.message);
          }

          finalVideoUrl = `/uploads/videos/${videoFileName}`;
        }

        const newVideo = {
          ...payload,
          id: payload.id || `uploaded-${Date.now()}`,
          videoUrl: finalVideoUrl,
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
