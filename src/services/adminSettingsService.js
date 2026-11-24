// Configuración y Reglas Maestras de la Plataforma (SpotPlay)

const SETTINGS_STORAGE_KEY = 'videospot_admin_settings_v1';
const COUPONS_STORAGE_KEY = 'videospot_coupons_v1';
const LEGACY_SETTINGS_KEY = 'toktik_admin_settings_1986_v1';
const LEGACY_COUPONS_KEY = 'toktik_coupons_1986_v1';

export const DEFAULT_PLATFORM_SETTINGS = {
  modelType: 'VITRINA_DESCENTRALIZADA', // Modelo Idéntico a VitrinaSpot
  giftMarginRate: 0.40, // 40% de retención en regalos virtuales de vivos
  verifiedStoreMonthlyFeeCOP: 39000, // Suscripción mensual de Tienda Verificada Vitrina ($39.000 COP)
  adMinDailyBudgetCOP: 15000, // Presupuesto mínimo de pauta publicitaria diaria ($15.000 COP)
  minWithdrawalCOP: 20000, // Mínimo de retiro a Nequi de creadores ($20.000 COP)
  allowGuestPurchases: true,
  autoApproveVerifiedCreators: false,
  // ⏱️ Reglas de Tiempo y Rendimiento de Directos LIVE (Anti-Fantasmas & Protección de Red)
  maxLiveDurationMinutes: 45, // 45 minutos estándar por sesión (0 = Ilimitado)
  warnBeforeEndMinutes: 5, // Alerta previa 5 minutos antes del cierre
  inactivityTimeoutMinutes: 10, // Cierre automático tras 10 min sin actividad o 0 interacción
  exemptVerifiedCreators: true, // Creadores verificados tienen pase libre sin corte forzado
};

export const INITIAL_COUPONS = [
  {
    code: 'BIENVENIDO10',
    discountPercent: 10,
    minOrderCOP: 50000,
    description: '10% de descuento en tu primera compra',
    usesCount: 42,
    isActive: true,
  },
  {
    code: 'DOMICILIOGRATIS',
    discountPercent: 0,
    freeShipping: true,
    minOrderCOP: 40000,
    description: 'Domicilio 100% gratis directo con la tienda',
    usesCount: 89,
    isActive: true,
  },
  {
    code: 'BURGERFEST',
    discountAmount: 10000,
    minOrderCOP: 45000,
    description: '$10.000 COP de descuento en combos de comida',
    usesCount: 65,
    isActive: true,
  },
];

export function loadPlatformSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY) || localStorage.getItem(LEGACY_SETTINGS_KEY);
    return raw ? { ...DEFAULT_PLATFORM_SETTINGS, ...JSON.parse(raw) } : DEFAULT_PLATFORM_SETTINGS;
  } catch (err) {
    return DEFAULT_PLATFORM_SETTINGS;
  }
}

export function savePlatformSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Error guardando configuración:', err);
  }
}

export function loadCoupons() {
  try {
    const raw = localStorage.getItem(COUPONS_STORAGE_KEY) || localStorage.getItem(LEGACY_COUPONS_KEY);
    if (!raw) return INITIAL_COUPONS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_COUPONS;
    return parsed.map((c) => ({
      ...c,
      code: c.code === 'ENVIOGRATIS' ? 'DOMICILIOGRATIS' : c.code,
      description: typeof c.description === 'string'
        ? c.description
            .replace(/con Coordinadora o Envía/gi, 'directo con la tienda')
            .replace(/Flete/gi, 'Domicilio')
        : c.description,
    }));
  } catch (err) {
    return INITIAL_COUPONS;
  }
}

export function saveCoupons(coupons) {
  try {
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupons));
  } catch (err) {
    console.warn('Error guardando cupones:', err);
  }
}
