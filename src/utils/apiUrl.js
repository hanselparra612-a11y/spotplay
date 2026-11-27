import { Capacitor } from '@capacitor/core';

export const BACKEND_URL = 'https://spotplay-1.onrender.com';

export function isNativeApp() {
  return typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
}

export function getApiUrl(path = '') {
  if (isNativeApp()) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BACKEND_URL}${cleanPath}`;
  }
  return path;
}

export function resolveMediaUrl(url = '') {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  if (isNativeApp()) {
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${BACKEND_URL}${cleanPath}`;
  }
  return url;
}
