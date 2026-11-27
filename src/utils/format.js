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

