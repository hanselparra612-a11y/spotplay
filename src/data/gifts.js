// Catálogo de regalos virtuales animados y paquetes de monedas SpotPlay
export const INITIAL_VIRTUAL_GIFTS = [
  {
    id: 'gift-rose',
    name: 'Rosa Roja',
    coins: 1,
    emoji: '🌹',
    animationClass: 'animate-bounce',
    description: 'Un detalle cariñoso para el creador',
  },
  {
    id: 'gift-coffee',
    name: 'Café Energético',
    coins: 5,
    emoji: '☕',
    animationClass: 'animate-pulse',
    description: 'Para que siga creando videos geniales',
  },
  {
    id: 'gift-fire',
    name: 'Fuego Viral',
    coins: 20,
    emoji: '🔥',
    animationClass: 'animate-ping',
    description: '¡Este video merece ser viral!',
  },
  {
    id: 'gift-crown',
    name: 'Corona Dorada',
    coins: 100,
    emoji: '👑',
    animationClass: 'scale-125',
    description: 'Regalo VIP para creadores top',
  },
  {
    id: 'gift-lion',
    name: 'León de Oro',
    coins: 500,
    emoji: '🦁',
    animationClass: 'scale-150',
    description: '¡El mayor honor de la plataforma!',
  },
  {
    id: 'gift-rocket',
    name: 'Cohete Galáctico',
    coins: 1000,
    emoji: '🚀',
    animationClass: 'animate-bounce',
    description: '¡Impulso al espacio para el directo!',
  },
];

export const INITIAL_COIN_PACKS = [
  {
    id: 'reward-1',
    coins: 5,
    title: 'Video Bonificado AdMob',
    format: 'Anuncio Corto',
    source: 'Google AdMob Rewards',
    popular: true,
  },
  {
    id: 'reward-2',
    coins: 10,
    title: 'Video Extendido AdMob',
    format: 'Anuncio 30s',
    source: 'Google AdMob Rewards',
    popular: false,
  },
  {
    id: 'reward-3',
    coins: 1,
    title: 'Bono Diario de Ingreso',
    format: 'Racha Diaria (+1 Gratis / 5x con Video)',
    source: 'Misión SpotPlay',
    popular: false,
  },
  {
    id: 'reward-4',
    coins: 3,
    title: 'Compartir Transmisión',
    format: 'Viralidad y Amigos',
    source: 'Misión SpotPlay',
    popular: false,
  },
];

const COIN_PACKS_KEY = 'spotplay_coin_packs_v2';
const VIRTUAL_GIFTS_KEY = 'spotplay_virtual_gifts_v1';

export function loadCoinPacks() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(COIN_PACKS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.some(p => p.priceCOP !== undefined || p.coins === 15 || p.coins === 20)) {
          localStorage.setItem(COIN_PACKS_KEY, JSON.stringify(INITIAL_COIN_PACKS));
          return INITIAL_COIN_PACKS;
        }
        return parsed;
      }
    }
  } catch {
    return INITIAL_COIN_PACKS;
  }
  return INITIAL_COIN_PACKS;
}

export function saveCoinPacks(packs) {
  try {
    localStorage.setItem(COIN_PACKS_KEY, JSON.stringify(packs));
  } catch (e) {
    console.error(e);
  }
}

export function loadVirtualGifts() {
  try {
    const raw = localStorage.getItem(VIRTUAL_GIFTS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_VIRTUAL_GIFTS;
  } catch {
    return INITIAL_VIRTUAL_GIFTS;
  }
}

export function saveVirtualGifts(gifts) {
  try {
    localStorage.setItem(VIRTUAL_GIFTS_KEY, JSON.stringify(gifts));
  } catch (e) {
    console.error(e);
  }
}

export const VIRTUAL_GIFTS = INITIAL_VIRTUAL_GIFTS;
export const COIN_PACKS = INITIAL_COIN_PACKS;
