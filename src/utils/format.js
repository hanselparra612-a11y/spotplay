export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  if (typeof num === 'string') {
    if (num.endsWith('K') || num.endsWith('M') || num.endsWith('k')) return num;
    const parsed = Number(num);
    if (!isNaN(parsed)) num = parsed;
    else return num;
  }
  if (isNaN(num)) return '0';

  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return Math.round(num).toString();
}

export function formatCOP(amount) {
  if (amount === null || amount === undefined) return '$0 COP';
  return `$${Math.round(amount).toLocaleString('es-CO')} COP`;
}

export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function normalizeWhatsAppNumber(rawPhone) {
  if (!rawPhone) return '573128525929';
  let cleaned = String(rawPhone).replace(/[^0-9]/g, '');
  if (!cleaned || cleaned === '573105558899' || cleaned === '3105558899') {
    return '573128525929';
  }
  // Si tiene 10 dígitos (ej. 3128525929 de Colombia), anteponer el código de país 57
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    cleaned = '57' + cleaned;
  }
  return cleaned;
}

export function normalizeTelegramUser(rawTelegram) {
  if (!rawTelegram) return '';
  return String(rawTelegram)
    .trim()
    .replace(/^@/, '')
    .replace(/^https?:\/\/t\.me\//i, '')
    .replace(/\/$/, '');
}

export function getTelegramLink(rawTelegram, message) {
  const user = normalizeTelegramUser(rawTelegram);
  if (!user) return null;
  const msgParam = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://t.me/${user}${msgParam}`;
}

export function buildProductOrderMessage(product, video) {
  const prodName = product?.name || 'este producto';
  const priceText = product?.price ? formatCOP(product.price) : '';
  const priceDetail = priceText ? ` (${priceText})` : '';

  // Detección de origen público para previsualización enriquecida con miniatura Open Graph en WhatsApp y Telegram
  const origin = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')
    ? window.location.origin
    : 'https://spotplay-1.onrender.com';

  const videoId = video?.id || '';
  const videoLink = videoId ? `${origin}/v/${videoId}` : origin;

  return `¡Hola! Me interesa pedir *${prodName}*${priceDetail} que vi en tu video de Spot Play.\n\n🛍️ *Producto:* ${prodName}${priceText ? '\n💰 *Precio:* ' + priceText : ''}\n🎬 *Ver video de la oferta:*\n${videoLink}`;
}

