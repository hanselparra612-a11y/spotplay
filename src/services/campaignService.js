// Servicio de Gestión y Persistencia de Campañas y Paquetes de Impulso para Creadores
// 100% Google AdMob y Google Play Compliant (Ecosistema Cerrado con SpotCoins, Cero Pasarelas Externas)

const CAMPAIGNS_STORAGE_KEY = 'spotplay_creator_campaign_catalog_v3';
const PACKS_STORAGE_KEY = 'spotplay_creator_preset_packs_v3';

export const DEFAULT_CAMPAIGN_CATALOG = [
  {
    id: 'views',
    title: 'Más Vistas en Para Ti',
    badge: 'Viralidad',
    iconName: 'Target',
    desc: 'Multiplica el alcance y reproducciones de tu video en el feed principal de descubrimiento.',
    cta: 'Ver Video Completo 🚀',
    theme: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  },
  {
    id: 'followers',
    title: 'Crecimiento de Seguidores',
    badge: 'Comunidad',
    iconName: 'Users',
    desc: 'Convierte a nuevos espectadores en seguidores suscritos a tu canal y contenido.',
    cta: 'Seguir Creador ✨',
    theme: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
  },
  {
    id: 'live_stream',
    title: 'Audiencia para En Vivo (LIVE)',
    badge: 'Transmisión',
    iconName: 'Flame',
    desc: 'Atrae espectadores a tu sala de transmisión en vivo para recibir regalos virtuales.',
    cta: 'Unirse al En Vivo 🔴',
    theme: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
  },
  {
    id: 'engagement',
    title: 'Interacción y Comentarios',
    badge: 'Comunidad',
    iconName: 'MessageSquare',
    desc: 'Potencia la conversación, reacciones y compartidos orgánicos entre los usuarios.',
    cta: 'Comentar Video 💬',
    theme: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  },
];

export const DEFAULT_PRESET_PACKS = [
  {
    id: 'pack_bronze',
    title: 'Pack Impulso Bronce 🥉',
    desc: '48 horas de mayor visibilidad en el feed Para Ti para videos recién publicados.',
    coins: 20,
    duration: 2,
    reach: '250 - 600 reproducciones prioritarias',
    goal: 'views',
    cta: 'Ver Video Completo 🚀',
    badge: 'Básico',
  },
  {
    id: 'pack_silver',
    title: 'Pack Crecimiento Plata 🥈',
    desc: '4 días continuos de recomendación prioritaria para ganar seguidores y me gustas.',
    coins: 50,
    duration: 4,
    reach: '800 - 1.800 reproducciones en Para Ti',
    goal: 'followers',
    cta: 'Seguir Creador ✨',
    badge: 'Popular',
    popular: true,
  },
  {
    id: 'pack_gold',
    title: 'Pack Viral Oro 🥇',
    desc: '7 días de distribución masiva en toda la plataforma para lograr impacto viral.',
    coins: 100,
    duration: 7,
    reach: '2.500 - 5.000 reproducciones garantizadas',
    goal: 'views',
    cta: 'Ver Video Completo 🚀',
    badge: '+ Vistas',
    bestValue: true,
  },
  {
    id: 'pack_diamond',
    title: 'Pack Élite Diamante 💎',
    desc: '14 días de máxima difusión para creadores top y lanzamientos de transmisiones LIVE.',
    coins: 200,
    duration: 14,
    reach: '7.000+ reproducciones y máxima difusión',
    goal: 'live_stream',
    cta: 'Unirse al En Vivo 🔴',
    badge: 'Élite VIP',
  },
];

export function loadCampaignCatalog() {
  try {
    const raw = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    if (!raw) return DEFAULT_CAMPAIGN_CATALOG;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CAMPAIGN_CATALOG;
  } catch (err) {
    console.warn('Error leyendo catálogo de campañas:', err);
    return DEFAULT_CAMPAIGN_CATALOG;
  }
}

export function saveCampaignCatalog(catalog) {
  try {
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(catalog));
  } catch (err) {
    console.warn('Error guardando catálogo de campañas:', err);
  }
}

export function loadPresetPacks() {
  try {
    const raw = localStorage.getItem(PACKS_STORAGE_KEY);
    if (!raw) return DEFAULT_PRESET_PACKS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PRESET_PACKS;
  } catch (err) {
    console.warn('Error leyendo paquetes prediseñados:', err);
    return DEFAULT_PRESET_PACKS;
  }
}

export function savePresetPacks(packs) {
  try {
    localStorage.setItem(PACKS_STORAGE_KEY, JSON.stringify(packs));
  } catch (err) {
    console.warn('Error guardando paquetes prediseñados:', err);
  }
}

export function saveOrUpdatePack(packData) {
  const packs = loadPresetPacks();
  const index = packs.findIndex((p) => p.id === packData.id);

  let updated;
  if (index >= 0) {
    updated = packs.map((p, idx) => (idx === index ? { ...p, ...packData } : p));
  } else {
    const newPack = {
      ...packData,
      id: packData.id || `pack_${Date.now()}`,
    };
    updated = [newPack, ...packs];
  }

  savePresetPacks(updated);
  return updated;
}

export function deletePack(packId) {
  const packs = loadPresetPacks();
  const updated = packs.filter((p) => p.id !== packId);
  savePresetPacks(updated);
  return updated;
}

export function saveOrUpdateCampaign(campaignData) {
  const catalog = loadCampaignCatalog();
  const index = catalog.findIndex((c) => c.id === campaignData.id);

  let updated;
  if (index >= 0) {
    updated = catalog.map((c, idx) => (idx === index ? { ...c, ...campaignData } : c));
  } else {
    const newCamp = {
      ...campaignData,
      id: campaignData.id || `campaign_${Date.now()}`,
    };
    updated = [...catalog, newCamp];
  }

  saveCampaignCatalog(updated);
  return updated;
}

export function deleteCampaign(campaignId) {
  const catalog = loadCampaignCatalog();
  const updated = catalog.filter((c) => c.id !== campaignId);
  saveCampaignCatalog(updated);
  return updated;
}

export function resetCampaignsAndPacks() {
  saveCampaignCatalog(DEFAULT_CAMPAIGN_CATALOG);
  savePresetPacks(DEFAULT_PRESET_PACKS);
  return {
    catalog: DEFAULT_CAMPAIGN_CATALOG,
    packs: DEFAULT_PRESET_PACKS,
  };
}
