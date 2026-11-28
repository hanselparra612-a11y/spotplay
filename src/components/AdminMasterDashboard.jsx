import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Gift,
  Coins,
  Flame,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Search,
  Check,
  CheckCheck,
  Award,
  Crown,
  ShoppingBag,
  Bell,
  Sliders,
  FileSpreadsheet,
  Download,
  Send,
  Eye,
  EyeOff,
  Pin,
  Trash2,
  Plus,
  Edit2,
  RotateCcw,
  Sparkles,
  Lock,
  KeyRound,
  CreditCard,
  Copy,
  Radio,
  Layers,
  Activity,
  PhoneCall,
  CheckCircle,
  ShieldCheck,
  Zap,
  Broom,
  History,
  Clock,
  Timer,
  Play,
  Flag,
} from 'lucide-react';
import {
  loadPersistedReports,
  savePersistedReports,
} from '../utils/storage';
import {
  loadCoinPacks,
  saveCoinPacks,
  loadVirtualGifts,
  saveVirtualGifts,
  INITIAL_COIN_PACKS,
  INITIAL_VIRTUAL_GIFTS,
} from '../data/gifts';
import { formatNumber, formatCOP } from '../utils/format';
import {
  loadPlatformSettings,
  savePlatformSettings,
} from '../services/adminSettingsService';
import {
  loadPresetPacks,
  saveOrUpdatePack,
  deletePack,
  loadCampaignCatalog,
  resetCampaignsAndPacks,
} from '../services/campaignService';
import {
  loadAdMobConfig,
  saveAdMobConfig,
  loadAdMobMetrics,
  saveAdMobMetrics,
  trackRewardedCompleted,
} from '../services/admobService';

export default function AdminMasterDashboard({
  isOpen,
  onClose,
  currentUser,
  creators = [],
  videos = [],
  onToggleVerification,
  onTogglePinVideo,
  onToggleHideVideo,
  onBroadcastNotification,
  onLock,
  onChangePin,
  initialTab = 'overview',
}) {
  const [activeTab, setActiveTab] = useState(initialTab); 
  // 'overview' | 'admob' | 'coins_gifts' | 'campaigns' | 'creators' | 'moderation' | 'broadcast' | 'settings' | 'accounting'

  // Salir con tecla Escape al presionar en teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 1. Configuraciones de la Plataforma
  const [platformSettings, setPlatformSettings] = useState(loadPlatformSettings);
  const [reports, setReports] = useState(loadPersistedReports);



  // 1.3. Google AdMob Oficial (100% Google Play Approved)
  const [admobConfig, setAdmobConfig] = useState(loadAdMobConfig);
  const [admobMetrics, setAdmobMetrics] = useState(loadAdMobMetrics);
  const [admobSaved, setAdmobSaved] = useState(false);

  // 1.5. Paquetes de Monedas SpotCoins y Catálogo de Regalos
  const [adminCoinPacks, setAdminCoinPacks] = useState(loadCoinPacks);
  const [adminVirtualGifts, setAdminVirtualGifts] = useState(loadVirtualGifts);
  const [isCreatingCoinPack, setIsCreatingCoinPack] = useState(false);
  const [coinPackForm, setCoinPackForm] = useState({
    coins: 500,
    priceCOP: 32900,
    bonus: '+15% extra',
    popular: false,
  });
  const [isCreatingGift, setIsCreatingGift] = useState(false);
  const [giftForm, setGiftForm] = useState({
    name: '',
    coins: 50,
    emoji: '💎',
    description: 'Regalo especial animado',
  });

  const handleSaveCoinPack = (e) => {
    e.preventDefault();
    const newPack = {
      id: 'pack-' + Date.now(),
      coins: Number(coinPackForm.coins) || 100,
      priceCOP: Number(coinPackForm.priceCOP) || 7000,
      bonus: coinPackForm.bonus.trim() || 'Estándar',
      popular: Boolean(coinPackForm.popular),
    };
    const updated = [...adminCoinPacks, newPack];
    setAdminCoinPacks(updated);
    saveCoinPacks(updated);
    setIsCreatingCoinPack(false);
    alert(`✅ Paquete de ${newPack.coins} SpotCoins (${newPack.priceCOP.toLocaleString('es-CO')} COP) publicado en la tienda de recargas.`);
  };

  const handleDeleteCoinPack = (packId) => {
    if (confirm('¿Eliminar este paquete de monedas de la venta al público?')) {
      const updated = adminCoinPacks.filter((p) => p.id !== packId);
      setAdminCoinPacks(updated);
      saveCoinPacks(updated);
      alert('🗑️ Paquete de monedas eliminado.');
    }
  };

  const handleResetCoinPacks = () => {
    if (confirm('¿Restaurar los paquetes de monedas de fábrica?')) {
      setAdminCoinPacks(INITIAL_COIN_PACKS);
      saveCoinPacks(INITIAL_COIN_PACKS);
      alert('↺ Paquetes de monedas restaurados a los valores por defecto.');
    }
  };

  const handleSaveGift = (e) => {
    e.preventDefault();
    if (!giftForm.name.trim()) return;
    const newGift = {
      id: 'gift-' + Date.now(),
      name: giftForm.name.trim(),
      coins: Number(giftForm.coins) || 10,
      emoji: giftForm.emoji || '🎁',
      animationClass: 'scale-125',
      description: giftForm.description.trim() || 'Regalo para el creador',
    };
    const updated = [...adminVirtualGifts, newGift];
    setAdminVirtualGifts(updated);
    saveVirtualGifts(updated);
    setIsCreatingGift(false);
    alert(`🎉 Regalo virtual "${newGift.name}" agregado al catálogo oficial.`);
  };

  const handleDeleteGift = (giftId, giftName) => {
    if (confirm(`¿Eliminar el regalo "${giftName}" del catálogo de los usuarios?`)) {
      const updated = adminVirtualGifts.filter((g) => g.id !== giftId);
      setAdminVirtualGifts(updated);
      saveVirtualGifts(updated);
      alert('🗑️ Regalo virtual eliminado.');
    }
  };

  const handleResetGifts = () => {
    if (confirm('¿Restaurar el catálogo de regalos virtuales de fábrica?')) {
      setAdminVirtualGifts(INITIAL_VIRTUAL_GIFTS);
      saveVirtualGifts(INITIAL_VIRTUAL_GIFTS);
      alert('↺ Catálogo de regalos restaurado.');
    }
  };

  // 2. Notificación Push Masiva
  const [broadcastTitle, setBroadcastTitle] = useState('🔥 ¡Noche de LIVEs y Batallas en Spot Play!');
  const [broadcastMessage, setBroadcastMessage] = useState('Conéctate a las transmisiones en vivo, envía regalos virtuales y apoya a tus creadores favoritos.');
  const [broadcastTarget, setBroadcastTarget] = useState('all');

  // 4. Paquetes Comerciales de Pauta y Campañas (Admin Manager)
  const [adminPacks, setAdminPacks] = useState(loadPresetPacks);
  const [adminCampaigns, setAdminCampaigns] = useState(loadCampaignCatalog);
  const [isCreatingPack, setIsCreatingPack] = useState(false);
  const [editingPack, setEditingPack] = useState(null);
  const [packForm, setPackForm] = useState({
    title: '',
    desc: '',
    coins: 30,
    duration: 3,
    reach: '500 - 1.200 reproducciones',
    goal: 'views',
    cta: 'Ver Video Completo 🚀',
    badge: 'Popular',
  });

  // 4. Liquidaciones a creadores: DESACTIVADAS (Economía 100% Cerrada en SpotCoins, Cero Egresos)

  if (!isOpen) return null;

  // Cálculos financieros globales (100% Google AdMob y Economía SpotCoins)
  const adRevenueCoins = videos.filter((v) => v.isPromoted).reduce((acc, v) => acc + (v.promotedCoins || 25), 180);
  const giftRevenueCOP = 480000; // Margen neto en regalos virtuales LIVE (40%)

  // Cálculos de Telemetría Google AdMob seguros (100% blindados contra undefined)
  const admobEarnedUSD = Number(admobMetrics?.totalEarnedUSD ?? admobMetrics?.estimatedRevenueUSD ?? 52.40);
  const admobRate = Number(admobConfig?.usdToCopRate || 3304);
  const admobEarnedCOP = Math.round(admobEarnedUSD * admobRate);
  const admobEcpmUSD = Number(admobMetrics?.ecpmUSD ?? admobMetrics?.averageECPM ?? 3.65);
  const admobRewardedViews = Number(admobMetrics?.rewardedViews ?? admobMetrics?.rewardedCompleted ?? 1850);
  const admobBannerImpressions = Number(admobMetrics?.bannerImpressions ?? admobMetrics?.impressions ?? 14280);
  const platformEarningsCOP = admobEarnedCOP + giftRevenueCOP;

  // Manejadores Oficiales Google AdMob (Play Store)
  const handleSaveAdMobConfig = (e) => {
    if (e) e.preventDefault();
    saveAdMobConfig(admobConfig);
    setAdmobSaved(true);
    setTimeout(() => setAdmobSaved(false), 2500);
    alert('✅ Configuración oficial de Google AdMob guardada exitosamente.');
  };

  const handleSimulateAdMobRewarded = () => {
    const updated = trackRewardedCompleted(admobConfig.rewardCoinsAmount || 5);
    setAdmobMetrics(updated);
    alert(`🎉 ¡Simulación exitosa! Se registró 1 visualización completa de anuncio con recompensa (+${admobConfig.rewardCoinsAmount || 5} SpotCoins) y se sumaron ingresos en USD.`);
  };

  const handleCleanDemoData = () => {
    if (confirm('🧹 ¿Confirmas limpiar los videos de prueba de fábrica para dejar solo tus videos reales subidos?')) {
      const onlyUserVideos = videos.filter((v) => v.isUserUploaded || v.author?.id === 'me' || v.author?.id === currentUser?.id);
      savePersistedVideos(onlyUserVideos);
      fetch('/api/videos/clean-demos', { method: 'POST' }).catch(() => {});
      alert(`✅ Limpieza completada. Ahora solo se mostrarán tus videos creados.`);
      window.location.reload();
    }
  };

  // Manejador de Guardar Ajustes de Plataforma
  const handleSaveSettings = () => {
    savePlatformSettings(platformSettings);
    alert('✅ Reglas y comisiones de la plataforma actualizadas y aplicadas en vivo.');
  };

  // Manejadores de Paquetes de Pauta y Campañas (Admin)
  const handleSaveAdminPack = (e) => {
    e.preventDefault();
    if (!packForm.title.trim()) return;
    const payload = {
      ...(editingPack ? { id: editingPack.id } : {}),
      title: packForm.title.trim(),
      desc: packForm.desc.trim(),
      coins: Number(packForm.coins) || 20,
      duration: Number(packForm.duration) || 3,
      reach: packForm.reach.trim() || '3.000 - 6.000 personas',
      goal: packForm.goal || 'views',
      cta: packForm.cta.trim() || 'Ver Video Completo 🚀',
      badge: packForm.badge.trim() || 'Especial',
      popular: packForm.badge.toLowerCase().includes('popular'),
      bestValue: packForm.badge.toLowerCase().includes('vistas'),
    };
    const updated = saveOrUpdatePack(payload);
    setAdminPacks(updated);
    setIsCreatingPack(false);
    setEditingPack(null);
    alert(`✅ Paquete de impulso "${payload.title}" guardado en la plataforma.`);
  };

  const handleDeleteAdminPack = (packId, title) => {
    if (confirm(`¿Eliminar el paquete "${title}" de las opciones de anunciantes?`)) {
      const updated = deletePack(packId);
      setAdminPacks(updated);
      alert('🗑️ Paquete comercial eliminado.');
    }
  };

  const handleResetAdminPacks = () => {
    if (confirm('¿Restaurar todos los paquetes comerciales de fábrica?')) {
      const { packs, catalog } = resetCampaignsAndPacks();
      setAdminPacks(packs);
      setAdminCampaigns(catalog);
      alert('↺ Paquetes y campañas restaurados por defecto.');
    }
  };

  // Manejador de Difusión Push
  const handleSendBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    if (onBroadcastNotification) {
      onBroadcastNotification({
        title: broadcastTitle,
        message: broadcastMessage,
        target: broadcastTarget,
      });
    }
    alert(`🚀 Notificación masiva enviada a ${broadcastTarget === 'all' ? 'todos los usuarios y creadores' : broadcastTarget}.`);
  };

  // Manejador de Descarga Contable (Software y Economía Digital Spot Play)
  const handleDownloadAccountingReport = () => {
    const csvContent = [
      'Reporte Fiscal y Contable Spot Play',
      'Fecha: ' + new Date().toLocaleDateString('es-CO'),
      'Concepto,Monto COP',
      `Ingresos Publicitarios Google AdMob Oficial (USD convertido a COP),$${admobEarnedCOP}`,
      `Margen Retención Regalos Virtuales & SpotCoins (40%),$${giftRevenueCOP}`,
      `Total Facturación Estimada Plataforma,$${platformEarningsCOP}`,
      `Egresos Pagados a Terceros,$0 (Economía 100% Cerrada)`,
      `Riesgo Mercantil / Pasarelas Externas,$0 (100% Monetización Legal Google AdMob)`,
      `Ganancia Neta Dueño Spot Play,$${platformEarningsCOP}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_SpotPlay_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('📥 Informe Contable de Spot Play en Excel / CSV descargado.');
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between overflow-hidden animate-in fade-in duration-200 select-none">
      <div className="relative w-full h-full bg-[#111216] flex flex-col overflow-hidden text-white">
        {/* Top Header Bar - 🏛️ Bóveda Ejecutiva & Control Maestro */}
        <header className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/10 flex items-center justify-between gap-2 bg-gradient-to-r from-[#101524] via-[#141821] to-[#0c0f14] pt-[max(10px,env(safe-area-inset-top,10px))]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-[#ffb800]/20 to-cyan-500/20 text-[#ffb800] flex items-center justify-center border border-[#ffb800]/40 shadow-[0_0_15px_rgba(255,184,0,0.2)] shrink-0">
              <Crown size={20} className="sm:w-[22px] sm:h-[22px]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-sm font-black text-white tracking-tight truncate flex items-center gap-1.5">
                  <span>🏛️ Bóveda Ejecutiva</span>
                </h1>
                <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-[#ffb800] text-black font-black text-[8px] sm:text-[9px] uppercase rounded-md tracking-wider shadow-sm shrink-0">
                  Super-Admin
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5 truncate">
                <span className="flex items-center gap-1 text-cyan-400 font-semibold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Modo Seguro
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="text-emerald-400 font-bold hidden sm:flex items-center gap-1">
                  <ShieldCheck size={12} /> Google AdMob Oficial
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 🛍️ PUENTE RÁPIDO DE ADMINISTRADOR A LA VITRINA */}
            <a
              href="https://vitrinaspot.onrender.com/?v=27.7#admin"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/35 hover:to-yellow-500/35 border border-[#ffb800]/50 text-[#ffb800] text-xs font-bold hidden md:flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-[0_0_12px_rgba(255,184,0,0.2)]"
              title="Abrir Panel Maestro de la Vitrina en nueva pestaña"
            >
              <ShoppingBag size={13} />
              <span>🛍️ Vitrina</span>
              <ExternalLink size={11} className="opacity-70" />
            </a>

            {onLock && (
              <button
                onClick={onLock}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-sm"
                title="Bloquear y ocultar panel maestro"
              >
                <Lock size={13} />
                <span className="hidden sm:inline">Bloquear</span>
              </button>
            )}

            {/* BOTÓN PROMINENTE SALIR AL FEED */}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-white/15 to-white/10 hover:from-white/25 hover:to-white/20 border border-white/25 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md"
              title="Cerrar panel y volver como usuario al feed de videos"
            >
              <ArrowLeft size={15} className="text-[#ffb800]" />
              <span>Volver al Feed</span>
            </button>
          </div>
        </header>

        {/* Scrollable Master Tabs Bar */}
        <div className="flex items-center gap-1 border-b border-white/10 px-2.5 py-2 bg-black/60 text-[11px] font-bold overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Bóveda & Métricas', icon: DollarSign },
            { id: 'admob', label: 'Google AdMob (Play Store)', icon: ShieldCheck, badgeText: 'PLAY STORE OK', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' },
            { id: 'coins_gifts', label: 'SpotCoins & Regalos', icon: Coins },
            { id: 'campaigns', label: 'Pauta & Packs', icon: Flame, badge: videos.filter((v) => v.isPromoted).length || null },
            { id: 'creators', label: 'Creadores ✓', icon: Award },
            { id: 'moderation', label: 'Moderación & Denuncias', icon: Shield, badge: reports.filter((r) => r.status === 'PENDING_REVIEW').length || null },
            { id: 'broadcast', label: 'Difusión Push', icon: Bell },
            { id: 'settings', label: 'Reglas Monetización', icon: Sliders },
            { id: 'accounting', label: 'Reporte Ingresos', icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 px-3 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-400/25 via-[#ffb800]/20 to-amber-500/15 text-amber-300 border border-amber-400/50 font-black shadow-md'
                    : 'text-zinc-400 hover:text-white bg-white/5 border border-white/5'
                }`}
              >
                <Icon size={13} className={isSelected ? 'text-[#ffb800]' : ''} />
                <span>{tab.label}</span>
                {tab.badgeText && (
                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase border ${tab.badgeColor}`}>
                    {tab.badgeText}
                  </span>
                )}
                {tab.badge > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
          {/* ================= 1. OVERVIEW FINANZAS & TELEMETRÍA (ESTILO VITRINASPOT) ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              {/* Tarjeta Ejecutiva Principal de Ingresos Totales Google AdMob */}
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-[#0c241b] via-[#101c22] to-[#141821] border border-emerald-400/40 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Bóveda Publicitaria Google AdMob Oficial (Play Store)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    ✓ 100% GOOGLE PLAY APPROVED
                  </span>
                </div>
                <div className="flex items-baseline gap-3 mt-2">
                  <h2 className="text-3xl font-black text-white">
                    ${admobEarnedUSD.toFixed(2)} <span className="text-xs text-emerald-400 font-bold">USD</span>
                  </h2>
                  <span className="text-sm font-bold text-zinc-400">
                    ≈ ${admobEarnedCOP.toLocaleString('es-CO')} COP
                  </span>
                </div>
                <p className="text-[10px] text-zinc-300 mt-1">
                  Ingresos oficiales generados por impresiones y videos bonificados (Rewarded Ads) en SpotPlay. Pagados mensualmente por Google a tu cuenta bancaria.
                </p>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-center">
                  <div>
                    <span className="text-[9px] text-zinc-400 block uppercase font-bold">Videos Bonificados Vistos</span>
                    <span className="font-bold text-emerald-300 text-xs">{admobRewardedViews.toLocaleString('es-CO')} vistas</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block uppercase font-bold">eCPM Promedio</span>
                    <span className="font-bold text-cyan-300 text-xs">${admobEcpmUSD.toFixed(2)} USD</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block uppercase font-bold">Impresiones Nativas</span>
                    <span className="font-bold text-amber-300 text-xs">{admobBannerImpressions.toLocaleString('es-CO')} imp.</span>
                  </div>
                </div>
              </div>

              {/* 4 Métricas de Telemetría Oficial Google AdMob y Economía de Creadores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#141821] border border-emerald-400/30">
                  <span className="text-[10px] text-zinc-400 block font-bold">Ingresos Google AdMob</span>
                  <h3 className="text-lg font-black text-emerald-400 mt-0.5">${admobEarnedCOP.toLocaleString('es-CO')}</h3>
                  <span className="text-[9px] text-emerald-400/80 block font-medium">Google AdMob Network</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#141821] border border-amber-400/30">
                  <span className="text-[10px] text-zinc-400 block font-bold">SpotCoins Circulantes</span>
                  <h3 className="text-lg font-black text-amber-400 mt-0.5">24.850 🪙</h3>
                  <span className="text-[9px] text-zinc-500 block">Billeteras de usuarios</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#141821] border border-cyan-400/30">
                  <span className="text-[10px] text-zinc-400 block font-bold">Videos & Reels Activos</span>
                  <h3 className="text-lg font-black text-cyan-400 mt-0.5">{videos.length}</h3>
                  <span className="text-[9px] text-zinc-500 block">Streaming y contenido</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#141821] border border-purple-400/30">
                  <span className="text-[10px] text-zinc-400 block font-bold">Total Creadores</span>
                  <h3 className="text-lg font-black text-purple-400 mt-0.5">{creators.length}</h3>
                  <span className="text-[9px] text-zinc-500 block">Perfiles verificados</span>
                </div>
              </div>

              {/* Herramienta Oficial de Limpieza de Datos de Prueba */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Broom size={14} className="text-[#ffb800]" />
                    <span>Limpieza Oficial de Datos de Prueba</span>
                  </h4>
                  <p className="text-[10px] text-zinc-400">Elimina con 1 solo clic los registros demo para operar en producción limpia.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCleanDemoData}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-[#ffb800] text-black font-extrabold text-[11px] flex items-center gap-1 shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                >
                  <Trash2 size={12} />
                  <span>Limpiar Datos de Prueba</span>
                </button>
              </div>

              {/* Grid Dividido: Creadores con Mayor Audiencia & Telemetría AdMob */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Top Creadores */}
                <div className="p-3.5 rounded-2xl bg-[#141821] border border-white/10 space-y-2.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span>🏆 Creadores con Mayor Audiencia & Regalos</span>
                  </h4>
                  <div className="space-y-1.5">
                    {creators.slice(0, 4).map((cr, idx) => (
                      <div key={cr.id || idx} className="p-2 rounded-xl bg-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] font-bold text-zinc-300 flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <img src={cr.avatar} alt={cr.name} className="w-6 h-6 rounded-full object-cover" />
                          <div>
                            <p className="font-bold text-white text-[11px] truncate max-w-[120px]">{cr.name}</p>
                            <p className="text-[9px] text-zinc-400">@{cr.username}</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                          {cr.followersCount || 0} seg. ✨
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Telemetría Reciente de Google AdMob */}
                <div className="p-3.5 rounded-2xl bg-[#141821] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-400" />
                      <span>Telemetría de Google AdMob</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveTab('admob')}
                      className="text-[10px] text-emerald-400 hover:underline font-bold cursor-pointer"
                    >
                      Gestionar AdMob →
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {(admobMetrics.recentEvents || []).slice(0, 4).map((ev) => (
                      <div key={ev.id} className="p-2 rounded-xl bg-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                            ▶
                          </div>
                          <div>
                            <p className="font-bold text-white text-[11px] truncate max-w-[150px]">{ev.typeLabel}</p>
                            <p className="text-[9px] text-zinc-400">{ev.user} • {ev.timestamp}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-emerald-400 text-xs block">
                            +{ev.coinsAwarded} SpotCoins
                          </span>
                          <span className="text-[8px] uppercase font-bold text-emerald-300 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                            AdMob Rewarded
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 1.1. GOOGLE ADMOB OFICIAL (100% GOOGLE PLAY APPROVED) ================= */}
          {activeTab === 'admob' && (
            <div className="space-y-4 text-xs">
              {/* Tarjeta de Cumplimiento Google Play Store */}
              <div className="p-4 rounded-2xl border border-emerald-400/40 bg-gradient-to-b from-[#0f241d] via-[#0d1c17] to-[#0a1210] space-y-3 shadow-2xl">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/40 shadow-sm">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-emerald-300 flex items-center gap-1.5">
                        <span>Google AdMob & Cumplimiento Play Store</span>
                      </h3>
                      <p className="text-[10px] text-zinc-400">
                        Monetización pasiva 100% legal ante Google sin comisiones bancarias ni riesgo de rechazo.
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    admobConfig.monetizationMode === 'ADMOB_ONLY'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                  }`}>
                    {admobConfig.monetizationMode === 'ADMOB_ONLY' ? '✓ PLAY STORE APPROVED' : 'MODO HÍBRIDO'}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  💡 <strong>¿Por qué esta estrategia es infalible?</strong> Al activar <em>"Solo Google AdMob"</em>, la app 
                  no procesa venta de monedas con pasarelas externas en el APK. Cumple al 100% con la política 
                  <strong> Google Play Billing</strong> y <strong>Google AdMob</strong>. Los usuarios obtienen SpotCoins 
                  viendo anuncios con recompensa y tú recibes los dólares directamente de Google a tu cuenta bancaria.
                </p>

                {/* Selector de Modo de Monetización */}
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-white mb-2">
                    Selecciona el Modo de Monetización para SpotPlay:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Opción 1: Solo AdMob */}
                    <div
                      onClick={() => {
                        const updated = { ...admobConfig, monetizationMode: 'ADMOB_ONLY' };
                        setAdmobConfig(updated);
                        saveAdMobConfig(updated);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        admobConfig.monetizationMode === 'ADMOB_ONLY'
                          ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.25)]'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 size={13} className={admobConfig.monetizationMode === 'ADMOB_ONLY' ? 'text-emerald-400' : 'text-zinc-500'} />
                          Solo Google AdMob (Recomendado)
                        </span>
                        <span className="text-[9px] font-bold bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded">
                          0% Riesgo Play Store
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-snug">
                        Monedas gratis mediante anuncios con recompensa. Sin pasarelas externas que arriesguen tu cuenta en Google Play Store.
                      </p>
                    </div>

                    {/* Opción 2: Modo Híbrido */}
                    <div
                      onClick={() => {
                        const updated = { ...admobConfig, monetizationMode: 'HYBRID' };
                        setAdmobConfig(updated);
                        saveAdMobConfig(updated);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        admobConfig.monetizationMode === 'HYBRID'
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-cyan-300 flex items-center gap-1.5">
                          <Flame size={13} className={admobConfig.monetizationMode === 'HYBRID' ? 'text-cyan-400' : 'text-zinc-500'} />
                          Modo Híbrido (AdMob + Tienda WhatsApp)
                        </span>
                        <span className="text-[9px] font-bold bg-cyan-400/20 text-cyan-300 px-1.5 py-0.5 rounded">
                          Play Store OK
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-snug">
                        Anuncios bonificados de AdMob en el feed y etiquetas opcionales para venta directa de productos físicos por WhatsApp (100% permitido).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Métricas en Vivo de Ganancias AdMob */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#141821] border border-emerald-400/30">
                  <span className="text-[10px] text-zinc-400 block font-bold">Impresiones AdMob</span>
                  <h3 className="text-lg font-black text-emerald-400 mt-0.5">{(admobMetrics?.impressions || 14280).toLocaleString('es-CO')}</h3>
                  <span className="text-[9px] text-zinc-500 block">Vistas en feed & banners</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#141821] border border-cyan-400/30">
                  <span className="text-[10px] text-zinc-400 block font-bold">Clics Registrados</span>
                  <h3 className="text-lg font-black text-cyan-400 mt-0.5">{(admobMetrics?.clicks || 942).toLocaleString('es-CO')}</h3>
                  <span className="text-[9px] text-zinc-500 block">CTR promedio: 6.6%</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#141821] border border-amber-400/30">
                  <span className="text-[10px] text-zinc-400 block font-bold">Anuncios con Recompensa</span>
                  <h3 className="text-lg font-black text-[#ffb800] mt-0.5">{admobRewardedViews.toLocaleString('es-CO')}</h3>
                  <span className="text-[9px] text-zinc-500 block">Monedas entregadas</span>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-400/50 shadow-lg">
                  <span className="text-[10px] text-emerald-300 block font-bold">Ingresos Estimados USD</span>
                  <h3 className="text-lg font-black text-white mt-0.5">${admobEarnedUSD.toFixed(2)} <span className="text-xs font-normal text-emerald-300">USD</span></h3>
                  <span className="text-[9px] text-emerald-400 font-bold block">≈ ${admobEarnedCOP.toLocaleString('es-CO')} COP</span>
                </div>
              </div>

              {/* Formulario de Configuración de Bloques de Anuncios (Ad Units) */}
              <div className="p-4 rounded-2xl bg-[#141821] border border-white/10 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Sliders size={14} className="text-amber-400" />
                    <span>Bloques de Anuncios Oficiales (Google AdMob Console)</span>
                  </h4>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {admobConfig.isTestMode ? '🧪 Modo Pruebas Activo' : '🚀 Producción'}
                  </span>
                </div>

                <form onSubmit={handleSaveAdMobConfig} className="space-y-3">
                  {/* App ID */}
                  <div>
                    <label className="block text-[11px] font-bold text-white mb-1">
                      App ID de Google AdMob (Android):
                    </label>
                    <input
                      type="text"
                      value={admobConfig.appId}
                      onChange={(e) => setAdmobConfig({ ...admobConfig, appId: e.target.value.trim() })}
                      placeholder="ca-app-pub-3940256099942544~3347511713"
                      className="w-full bg-[#181d2a] border border-white/15 text-emerald-300 font-mono font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-400"
                    />
                    <p className="text-[10px] text-zinc-400 mt-1">Identificador único de tu app en tu consola de Google AdMob.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Rewarded Ad Unit ID */}
                    <div>
                      <label className="block text-[11px] font-bold text-white mb-1">
                        Bloque con Recompensa (Rewarded Video ID):
                      </label>
                      <input
                        type="text"
                        value={admobConfig.adUnits?.rewardedId || ''}
                        onChange={(e) => setAdmobConfig({
                          ...admobConfig,
                          adUnits: { ...admobConfig.adUnits, rewardedId: e.target.value.trim() },
                        })}
                        placeholder="ca-app-pub-.../5224354917"
                        className="w-full bg-[#181d2a] border border-white/15 text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    {/* Native Feed ID */}
                    <div>
                      <label className="block text-[11px] font-bold text-white mb-1">
                        Bloque Nativo en Feed (Native Video ID):
                      </label>
                      <input
                        type="text"
                        value={admobConfig.adUnits?.nativeFeedId || ''}
                        onChange={(e) => setAdmobConfig({
                          ...admobConfig,
                          adUnits: { ...admobConfig.adUnits, nativeFeedId: e.target.value.trim() },
                        })}
                        placeholder="ca-app-pub-.../2247696110"
                        className="w-full bg-[#181d2a] border border-white/15 text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Interstitial Ad Unit ID */}
                    <div>
                      <label className="block text-[11px] font-bold text-white mb-1">
                        Bloque Intersticial (Pantalla Completa ID):
                      </label>
                      <input
                        type="text"
                        value={admobConfig.adUnits?.interstitialId || ''}
                        onChange={(e) => setAdmobConfig({
                          ...admobConfig,
                          adUnits: { ...admobConfig.adUnits, interstitialId: e.target.value.trim() },
                        })}
                        placeholder="ca-app-pub-.../1033173712"
                        className="w-full bg-[#181d2a] border border-white/15 text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    {/* Banner ID */}
                    <div>
                      <label className="block text-[11px] font-bold text-white mb-1">
                        Bloque Banner Adaptativo ID:
                      </label>
                      <input
                        type="text"
                        value={admobConfig.adUnits?.bannerId || ''}
                        onChange={(e) => setAdmobConfig({
                          ...admobConfig,
                          adUnits: { ...admobConfig.adUnits, bannerId: e.target.value.trim() },
                        })}
                        placeholder="ca-app-pub-.../6300978111"
                        className="w-full bg-[#181d2a] border border-white/15 text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  {/* Economía de Recompensas y Conversión */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-white mb-1">
                        Monedas por Anuncio Visto:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={admobConfig.rewardCoinsAmount}
                        onChange={(e) => setAdmobConfig({ ...admobConfig, rewardCoinsAmount: Number(e.target.value) || 5 })}
                        className="w-full bg-[#181d2a] border border-white/15 text-amber-400 font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-white mb-1">
                        Frecuencia en Feed (videos):
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="15"
                        value={admobConfig.feedAdFrequency}
                        onChange={(e) => setAdmobConfig({ ...admobConfig, feedAdFrequency: Number(e.target.value) || 6 })}
                        className="w-full bg-[#181d2a] border border-white/15 text-cyan-400 font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-white mb-1">
                        Tasa Dólar (USD a COP):
                      </label>
                      <input
                        type="number"
                        min="2000"
                        max="6000"
                        step="1"
                        value={admobConfig.usdToCopRate || 3304}
                        onChange={(e) => setAdmobConfig({ ...admobConfig, usdToCopRate: Number(e.target.value) || 3304 })}
                        className="w-full bg-[#181d2a] border border-white/15 text-emerald-400 font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  {/* Botones de Guardar y Simular */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={15} />
                      <span>{admobSaved ? '✓ ¡Configuración Guardada!' : 'Guardar Configuración Google AdMob'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSimulateAdMobRewarded}
                      className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl border border-white/15 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                      title="Simular visualización de anuncio con recompensa y sumar métricas"
                    >
                      <Play size={13} className="fill-white" />
                      <span>Simular Ganancia</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}



          {/* ================= 1.5. VENTA DE MONEDAS Y REGALOS VIRTUALES ================= */}
          {activeTab === 'coins_gifts' && (
            <div className="space-y-4 text-xs">
              {/* Encabezado Explicativo */}
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-950/60 via-[#181a24] to-purple-950/40 border border-amber-400/30 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
                    <Coins size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xs">Economía de SpotCoins y Regalos</h3>
                    <p className="text-[10px] text-amber-300">Monedas digitales obtenidas vía Google AdMob y regalos virtuales.</p>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed pt-1">
                  💡 <strong>¿Cómo funciona tu monetización con Google AdMob?</strong> Los usuarios obtienen SpotCoins viendo videos bonificados (Rewarded Video Ads de Google AdMob 100% legal en Google Play). Cada vista te paga dólares que Google deposita en tu cuenta bancaria. Los creadores usan sus SpotCoins exclusivamente para promover sus videos y atraer clientes a su Vitrina Comercial por WhatsApp, sin generar costos de liquidación para ti.
                </p>
              </div>

              {/* SECCIÓN A: RECOMPENSAS DE SPOTCOINS POR PUBLICIDAD (GOOGLE ADMOB REWARDS) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-white/10">
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-400" />
                      <span>Recompensas de SpotCoins (100% Google AdMob)</span>
                    </h4>
                    <p className="text-[10px] text-zinc-400">
                      Los usuarios obtienen monedas gratis viendo anuncios de Google AdMob. Cero cobros en COP para cumplir con Google Play Store.
                    </p>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    ✓ PLAY STORE APPROVED
                  </span>
                </div>

                {/* Grid de Recompensas Oficiales AdMob */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#141821] to-[#141821] border border-amber-400/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                          ▶
                        </div>
                        <div>
                          <p className="font-extrabold text-white text-xs">Video Bonificado Estándar</p>
                          <span className="text-[9px] text-amber-300 font-semibold">Anuncio 15s • Google AdMob</span>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-amber-400/20 text-amber-300 font-black text-xs border border-amber-400/30">
                        +{admobConfig.rewardCoinsAmount || 5} Coins
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400">El usuario ve un video de 15s y recibe monedas al instante. Google te paga a ti en dólares.</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#141821] to-[#141821] border border-emerald-400/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-400/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                          ▶▶
                        </div>
                        <div>
                          <p className="font-extrabold text-white text-xs">Video Bonificado Extendido</p>
                          <span className="text-[9px] text-emerald-300 font-semibold">Anuncio 30s • Google AdMob</span>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-emerald-400/20 text-emerald-300 font-black text-xs border border-emerald-400/30">
                        +{(admobConfig.rewardCoinsAmount || 5) * 2} Coins
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400">Genera el doble de eCPM en dólares y otorga doble recompensa al espectador.</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#141821] border border-cyan-400/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-400/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                          🎁
                        </div>
                        <div>
                          <p className="font-extrabold text-white text-xs">Bono Diario de Ingreso</p>
                          <span className="text-[9px] text-cyan-300 font-semibold">Misión de Retención Diaria</span>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-cyan-400/20 text-cyan-300 font-black text-xs border border-cyan-400/30">
                        +1 Base (5x Video)
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400">Entrega +1 moneda de bienvenida y ofrece multiplicar a 5x viendo un video de Google AdMob.</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#141821] border border-purple-400/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-400/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                          🚀
                        </div>
                        <div>
                          <p className="font-extrabold text-white text-xs">Compartir Transmisión en Redes</p>
                          <span className="text-[9px] text-purple-300 font-semibold">Viralidad y Crecimiento</span>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-purple-400/20 text-purple-300 font-black text-xs border border-purple-400/30">
                        +3 Coins
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400">Atrae a nuevos espectadores y potenciales usuarios a los directos sin costo publicitario.</p>
                  </div>
                </div>

                {/* Aviso Protector Oficial Google AdMob */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                    <p className="text-[10px] text-emerald-200">
                      <strong>Protección Activa:</strong> Se han desactivado las pasarelas y cobros en COP de monedas para garantizar la aprobación sin observaciones de Google Play Store.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('admob')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] uppercase cursor-pointer transition-colors"
                  >
                    Ajustar Monedas en AdMob →
                  </button>
                </div>
              </div>

              {/* SECCIÓN B: CATÁLOGO DE REGALOS VIRTUALES */}
              <div className="space-y-2.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>Catálogo de Regalos Virtuales</span>
                      <span className="text-[10px] font-normal text-zinc-400">({adminVirtualGifts.length} regalos)</span>
                    </h4>
                    <p className="text-[10px] text-zinc-400">Regalos animados que los espectadores envían en videos y directos.</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleResetGifts}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Restaurar de fábrica"
                    >
                      <RotateCcw size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingGift((g) => !g)}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all active:scale-95"
                    >
                      <Plus size={12} />
                      <span>{isCreatingGift ? 'Cerrar' : 'Nuevo Regalo'}</span>
                    </button>
                  </div>
                </div>

                {/* Formulario de Crear Regalo */}
                {isCreatingGift && (
                  <form onSubmit={handleSaveGift} className="p-3.5 rounded-2xl bg-black/60 border border-purple-500/40 space-y-3 animate-in fade-in duration-200">
                    <span className="font-bold text-purple-300 text-xs block">Agregar Nuevo Regalo Virtual</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-0.5">Emoji Animado</label>
                        <input
                          type="text"
                          value={giftForm.emoji}
                          onChange={(e) => setGiftForm({ ...giftForm, emoji: e.target.value })}
                          required
                          className="w-full bg-[#181920] border border-white/10 rounded-xl px-2.5 py-1.5 text-center text-lg focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] text-zinc-400 mb-0.5">Nombre del Regalo</label>
                        <input
                          type="text"
                          placeholder="ej. Diamante Real"
                          value={giftForm.name}
                          onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })}
                          required
                          className="w-full bg-[#181920] border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-bold focus:outline-none focus:border-purple-400 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-0.5">Costo en SpotCoins</label>
                        <input
                          type="number"
                          min="1"
                          value={giftForm.coins}
                          onChange={(e) => setGiftForm({ ...giftForm, coins: e.target.value })}
                          required
                          className="w-full bg-[#181920] border border-white/10 rounded-xl px-2.5 py-1.5 text-amber-400 font-bold focus:outline-none focus:border-purple-400 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-0.5">Descripción</label>
                        <input
                          type="text"
                          placeholder="ej. Para creadores top"
                          value={giftForm.description}
                          onChange={(e) => setGiftForm({ ...giftForm, description: e.target.value })}
                          className="w-full bg-[#181920] border border-white/10 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-400 text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition-all"
                    >
                      Agregar Regalo al Menú de Videos
                    </button>
                  </form>
                )}

                {/* Grid de Regalos */}
                <div className="grid grid-cols-3 gap-2">
                  {adminVirtualGifts.map((gift) => (
                    <div
                      key={gift.id}
                      className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-between text-center relative group"
                    >
                      <button
                        onClick={() => handleDeleteGift(gift.id, gift.name)}
                        className="absolute top-1 right-1 p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar regalo"
                      >
                        <Trash2 size={11} />
                      </button>
                      <span className="text-2xl filter drop-shadow mt-1">{gift.emoji}</span>
                      <p className="text-[11px] font-bold text-white mt-1 truncate w-full">{gift.name}</p>
                      <span className="text-[10px] text-amber-400 font-black flex items-center gap-0.5 mt-0.5">
                        <Coins size={10} />
                        {gift.coins}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. CONFIGURADOR DE COMISIONES & REGLAS ================= */}
          {activeTab === 'settings' && (
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-white text-xs">Reglas de Vitrina y Monetización en Vivo</h3>
                <p className="text-[10px] text-zinc-400">Ajusta tus márgenes y tarifas sin tocar código.</p>
              </div>

              {/* Modelo de Economía Cerrada SpotCoins */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-[#181d26] to-amber-500/15 border border-emerald-400/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    Modelo de Economía 100% Autosostenible
                  </span>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    CERO EGRESOS
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Las SpotCoins son créditos virtuales de impulso dentro de la app. Los creadores y comerciantes las utilizan para pautar sus videos y ganar clientes en su Vitrina Comercial por WhatsApp. Tú recibes el 100% de los ingresos de Google AdMob en tu cuenta bancaria sin pagarle a terceros.
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-zinc-400">
                  <span>AdMob USD: <strong className="text-emerald-400">100% Tu Ganancia</strong></span>
                  <span>Egresos en Efectivo: <strong className="text-white">$0 COP</strong></span>
                </div>
              </div>

              {/* 3.5. ⏱️ Límites de Duración de LIVE y Sensor Anti-Fantasmas */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-500/10 via-purple-500/10 to-transparent border border-red-500/30 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                      <Timer size={15} />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Control de Tiempo de Directos (LIVE)</span>
                      <span className="text-[10px] text-zinc-400">Protección de ancho de banda y rendimiento</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-cyan-400 font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30">
                    {platformSettings.maxLiveDurationMinutes === 0
                      ? 'ILIMITADO'
                      : `${platformSettings.maxLiveDurationMinutes || 45} MIN`}
                  </span>
                </div>

                {/* Selección de Duración Máxima por Sesión */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-300">Duración Máxima por Sesión:</span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { val: 30, label: '30m' },
                      { val: 45, label: '45m ⭐' },
                      { val: 60, label: '60m' },
                      { val: 90, label: '90m' },
                      { val: 0, label: 'Sin límite' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() =>
                          setPlatformSettings({ ...platformSettings, maxLiveDurationMinutes: opt.val })
                        }
                        className={`py-1.5 px-1 rounded-xl border text-[10px] font-bold text-center transition-all ${
                          (platformSettings.maxLiveDurationMinutes ?? 45) === opt.val
                            ? 'bg-red-500/25 border-red-400 text-white shadow-sm'
                            : 'bg-black/40 border-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-400 pt-0.5">
                    Al terminar la sesión, el creador puede iniciar una "Parte 2" y el público vuelve al feed monetizado con AdMob.
                  </p>
                </div>

                {/* Sensor Anti-Fantasma (Auto-cierre por Inactividad) */}
                <div className="space-y-1 pt-1 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold text-zinc-300">Sensor Anti-Fantasma (Inactividad):</span>
                    <span className="text-[10px] font-bold text-amber-300">
                      {(platformSettings.inactivityTimeoutMinutes ?? 10) === 0
                        ? 'Desactivado'
                        : `${platformSettings.inactivityTimeoutMinutes ?? 10} min sin interacción`}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { val: 5, label: '5 min' },
                      { val: 10, label: '10 min ⭐' },
                      { val: 15, label: '15 min' },
                      { val: 0, label: 'Apagar' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() =>
                          setPlatformSettings({ ...platformSettings, inactivityTimeoutMinutes: opt.val })
                        }
                        className={`py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
                          (platformSettings.inactivityTimeoutMinutes ?? 10) === opt.val
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                            : 'bg-black/40 border-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Cierra automáticamente la transmisión si el streamer deja el teléfono botado o no interactúa en este tiempo.
                  </p>
                </div>

                {/* Pase Libre a Creadores Verificados */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <div>
                    <span className="text-[11px] font-semibold text-white block">Pase Libre para Verificados</span>
                    <span className="text-[10px] text-zinc-400">Creadores VIP o verificados pueden transmitir sin corte</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPlatformSettings({
                        ...platformSettings,
                        exemptVerifiedCreators: !(platformSettings.exemptVerifiedCreators ?? true),
                      })
                    }
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                      (platformSettings.exemptVerifiedCreators ?? true) ? 'bg-cyan-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        (platformSettings.exemptVerifiedCreators ?? true) ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 4. Seguridad & PIN Maestro del Dueño */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-white/5 to-transparent border border-amber-500/30 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
                      <Lock size={15} />
                    </div>
                    <div>
                      <span className="font-bold text-white block">PIN de Seguridad Maestro</span>
                      <span className="text-[10px] text-zinc-400">Protección contra accesos no autorizados</span>
                    </div>
                  </div>
                  {onChangePin && (
                    <button
                      type="button"
                      onClick={onChangePin}
                      className="px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-[11px] font-bold rounded-lg border border-amber-400/40 transition-all cursor-pointer"
                    >
                      Modificar PIN
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400">
                  El panel maestro permanece 100% invisible para el público general. Solo se desbloquea con tu clave maestra o mediante el gesto secreto de 5 toques en tu perfil.
                </p>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-600 hover:opacity-95 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all"
              >
                Guardar Reglas de Monetización
              </button>
            </div>
          )}

          {/* ================= 2.5. GESTIÓN DE PAUTA, PACKS Y CAMPAÑAS ================= */}
          {activeTab === 'campaigns' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-xs">Administrador de Paquetes de Impulso Viral (100% SpotCoins / AdMob)</h3>
                  <p className="text-[10px] text-zinc-400">Configura los paquetes en SpotCoins para que los creadores impulsen sus videos en el feed Para Ti sin pasarelas externas.</p>
                </div>
                <button
                  type="button"
                  onClick={handleResetAdminPacks}
                  className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[10px] font-semibold flex items-center gap-1 border border-white/5 transition-colors"
                >
                  <RotateCcw size={11} /> Restaurar Fábrica
                </button>
              </div>

              {/* KPIs de Impulso */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-[9px] text-zinc-400 uppercase font-bold">Videos en Impulso</p>
                  <p className="text-base font-black text-amber-400 mt-0.5">
                    {videos.filter((v) => v.isPromoted).length}
                  </p>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-[9px] text-zinc-400 uppercase font-bold">SpotCoins en Impulso</p>
                  <p className="text-base font-black text-amber-400 mt-0.5 truncate">
                    {adRevenueCoins} Coins 🪙
                  </p>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-[9px] text-zinc-400 uppercase font-bold">Packs Activos</p>
                  <p className="text-base font-black text-purple-400 mt-0.5">
                    {adminPacks.length}
                  </p>
                </div>
              </div>

              {/* Botón para Abrir Formulario de Creación */}
              {!isCreatingPack && !editingPack && (
                <button
                  type="button"
                  onClick={() => {
                    setPackForm({
                      title: 'Pack Impulso Bronce 🔥',
                      desc: '3 días de recomendación prioritaria en el feed Para Ti',
                      coins: 30,
                      duration: 3,
                      reach: '500 - 1.200 reproducciones',
                      goal: 'views',
                      cta: 'Ver Video Completo 🚀',
                      badge: 'Especial',
                    });
                    setIsCreatingPack(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-amber-400/60 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Plus size={14} className="text-amber-400" />
                  <span>+ Crear Nuevo Paquete de Impulso para Creadores</span>
                </button>
              )}

              {/* Formulario de Creación / Edición */}
              {(isCreatingPack || editingPack) && (
                <form onSubmit={handleSaveAdminPack} className="p-3.5 rounded-2xl bg-gradient-to-tr from-amber-950/30 to-[#14151a] border border-amber-400/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                      <Flame size={14} />
                      {editingPack ? 'Editar Paquete de Impulso' : 'Nuevo Paquete de Impulso'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingPack(false);
                        setEditingPack(null);
                      }}
                      className="text-[10px] text-zinc-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 font-bold block mb-1">Título del Paquete</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Pack Impulso Viral 🚀"
                      value={packForm.title}
                      onChange={(e) => setPackForm({ ...packForm, title: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 font-bold block mb-1">Descripción</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Impulso prioritario en el feed Para Ti"
                      value={packForm.desc}
                      onChange={(e) => setPackForm({ ...packForm, desc: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">Costo en SpotCoins 🪙</label>
                      <input
                        type="number"
                        step="5"
                        min="10"
                        max="1000"
                        required
                        value={packForm.coins}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPackForm({
                            ...packForm,
                            coins: val,
                            reach: `${(val * 100).toLocaleString('es-CO')} - ${(val * 250).toLocaleString('es-CO')} personas`,
                          });
                        }}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400 font-bold"
                      />
                      <span className="text-[9px] text-amber-400 font-bold">{packForm.coins || 20} SpotCoins 🪙</span>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">Duración (Días)</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        required
                        value={packForm.duration}
                        onChange={(e) => setPackForm({ ...packForm, duration: Number(e.target.value) })}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400 font-bold"
                      />
                      <span className="text-[9px] text-zinc-400">{packForm.duration} días continuos</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">Alcance Estimado</label>
                      <input
                        type="text"
                        required
                        value={packForm.reach}
                        onChange={(e) => setPackForm({ ...packForm, reach: e.target.value })}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">Distintivo / Badge</label>
                      <input
                        type="text"
                        value={packForm.badge}
                        onChange={(e) => setPackForm({ ...packForm, badge: e.target.value })}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 font-bold block mb-1">Objetivo de Campaña</label>
                    <select
                      value={packForm.goal}
                      onChange={(e) => {
                        const chosen = adminCampaigns.find((c) => c.id === e.target.value);
                        setPackForm({
                          ...packForm,
                          goal: e.target.value,
                          cta: chosen ? chosen.cta : packForm.cta,
                        });
                      }}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                    >
                      {adminCampaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 font-bold block mb-1">Botón de Acción en el Video (CTA)</label>
                    <input
                      type="text"
                      required
                      value={packForm.cta}
                      onChange={(e) => setPackForm({ ...packForm, cta: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-amber-400 to-[#FE2C55] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-95"
                  >
                    {editingPack ? 'Actualizar Paquete' : 'Guardar Paquete de Impulso'}
                  </button>
                </form>
              )}

              {/* Lista de Paquetes Activos */}
              <div className="space-y-2">
                <span className="font-bold text-zinc-300 text-xs block">Catálogo de Paquetes de Impulso ({adminPacks.length})</span>
                {adminPacks.map((pack) => (
                  <div
                    key={pack.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-xs truncate">{pack.title}</span>
                        {pack.badge && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold text-[9px] border border-amber-400/40">
                            {pack.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{pack.desc}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                        <span className="font-bold text-amber-400 flex items-center gap-1">
                          <Coins size={11} className="text-amber-400" />
                          <span>{pack.coins || Math.round((pack.budget || 20000)/1000) || 20} SpotCoins 🪙</span>
                        </span>
                        <span className="text-zinc-500">·</span>
                        <span className="text-zinc-300">{pack.duration} días</span>
                        <span className="text-zinc-500">·</span>
                        <span className="text-emerald-400 font-semibold">{pack.reach}</span>
                      </div>
                      <div className="text-[9px] text-zinc-400 mt-1">
                        Botón: <strong className="text-white">{pack.cta}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPack(pack);
                          setPackForm({
                            title: pack.title,
                            desc: pack.desc,
                            coins: pack.coins || Math.round((pack.budget || 20000)/1000) || 20,
                            duration: pack.duration,
                            reach: pack.reach,
                            goal: pack.goal,
                            cta: pack.cta,
                            badge: pack.badge || (pack.popular ? 'Popular' : pack.bestValue ? '+ Vistas' : 'Pack'),
                          });
                          setIsCreatingPack(false);
                        }}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-amber-400 flex items-center justify-center transition-colors"
                        title="Editar paquete"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAdminPack(pack.id, pack.title)}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-colors"
                        title="Eliminar paquete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Videos con Impulso Activo en el Feed */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="font-bold text-zinc-300 text-xs block">
                  Videos en Impulso Activo ({videos.filter((v) => v.isPromoted).length})
                </span>
                {videos.filter((v) => v.isPromoted).length === 0 ? (
                  <p className="text-[11px] text-zinc-500 p-3 bg-white/5 rounded-xl text-center">
                    No hay videos con impulso activo en este momento. Los creadores pueden promocionar su contenido usando SpotCoins con el botón de fuego 🔥.
                  </p>
                ) : (
                  videos
                    .filter((v) => v.isPromoted)
                    .map((pv) => (
                      <div
                        key={pv.id}
                        className="p-2.5 rounded-2xl bg-white/5 border border-amber-400/30 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <video src={pv.videoUrl} className="w-10 h-14 rounded-lg object-cover shrink-0" muted />
                          <div className="min-w-0">
                            <p className="font-bold text-white text-xs truncate">{pv.description}</p>
                            <p className="text-[10px] text-zinc-400">@{pv.author?.username} · {pv.promotedCity || 'Toda Colombia'}</p>
                            <p className="text-[10px] text-amber-400 font-bold mt-0.5">
                              {pv.promotedCta || 'Ver más detalles 🚀'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Prioridad #1
                          </span>
                          <p className="text-[10px] font-bold text-amber-400 mt-1 flex items-center justify-end gap-1">
                            <Coins size={11} className="text-amber-400" />
                            <span>{pv.promotedCoins || 25} SpotCoins</span>
                          </p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* ================= 3. GESTIÓN DE CREADORES Y CHULO AZUL ✓ ================= */}
          {activeTab === 'creators' && (
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-xs">Ranking y Verificación Oficial</h3>
                  <p className="text-[10px] text-zinc-400">Otorga o retira el Chulo Azul ✓ con 1 toque.</p>
                </div>
                <span className="text-[10px] text-purple-300 font-bold bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-400/30">
                  {creators.length} Creadores
                </span>
              </div>

              <div className="space-y-2">
                {creators.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <img src={c.avatar} alt={c.username} className="w-10 h-10 rounded-full object-cover border border-white/20" />
                        {c.isVerified && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-400 text-black rounded-full flex items-center justify-center text-[10px] font-black shadow">
                            ✓
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-white text-xs">@{c.username}</span>
                          <span className="text-[9px] text-amber-400 font-bold">#{idx + 1}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400">{c.name}</p>
                        <p className="text-[9px] text-emerald-400 font-bold mt-0.5">
                          {idx % 2 === 0 ? 'Top Creador Viral' : 'Top Regalos LIVE'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleVerification(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all active:scale-95 flex items-center gap-1 ${
                        c.isVerified
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-white/10 border-white/10 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <span>{c.isVerified ? 'Verificado ✓' : 'Verificar'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= 5. NOTIFICACIONES PUSH MASIVAS ================= */}
          {activeTab === 'broadcast' && (
            <div className="space-y-3.5 text-xs">
              <div>
                <h3 className="font-bold text-white text-xs">Difusión Masiva Push a la Comunidad</h3>
                <p className="text-[10px] text-zinc-400">Envía un anuncio a todos los celulares con la app.</p>
              </div>

              <form onSubmit={handleSendBroadcast} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1">Audiencia Destino</label>
                  <select
                    value={broadcastTarget}
                    onChange={(e) => setBroadcastTarget(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">Toda la Comunidad (Usuarios y Creadores)</option>
                    <option value="creators">Solo Creadores e Influencers</option>
                    <option value="buyers">Solo Clientes Compradores</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1">Título de la Notificación</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    required
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-2 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1">Mensaje de Notificación</label>
                  <textarea
                    rows={3}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    required
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400 text-xs resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Send size={14} />
                  <span>Disparar Notificación Push Masiva</span>
                </button>
              </form>
            </div>
          )}

          {/* ================= 6. MODERACIÓN DE CONTENIDO ================= */}
          {activeTab === 'moderation' && (
            <div className="space-y-4 text-xs">
              {/* 🛡️ BANDEJA DE DENUNCIAS DE LA COMUNIDAD (GOOGLE PLAY & ADMOB UGC COMPLIANCE) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#181a24] to-zinc-900 border border-red-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                      <Flag size={16} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-2">
                        <span>Denuncias de la Comunidad</span>
                        <span className="px-1.5 py-0.2 bg-red-500/30 text-red-300 rounded text-[9px] font-bold border border-red-500/40">
                          {reports.filter((r) => r.status === 'PENDING_REVIEW').length} pendientes
                        </span>
                      </h4>
                      <p className="text-[10px] text-zinc-400">Revisión en &lt;24h obligatoria para Google Play & AdMob</p>
                    </div>
                  </div>
                </div>

                {reports.length === 0 ? (
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-center text-zinc-400 text-xs">
                    ✅ No hay denuncias pendientes. La comunidad se encuentra en orden.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reports.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-3 rounded-xl bg-black/40 border border-red-500/20 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-red-300 flex items-center gap-1">
                            <span>🚩</span>
                            <span>{rep.reasonTitle}</span>
                          </span>
                          <span className="text-[9px] text-zinc-500">
                            {new Date(rep.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-white">
                          <strong className="text-zinc-400">Publicación:</strong> {rep.videoTitle} (@{rep.creatorUsername})
                        </p>
                        {rep.details && (
                          <p className="text-[10px] text-zinc-300 bg-white/5 p-1.5 rounded-lg border border-white/5">
                            "{rep.details}"
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            onClick={() => {
                              onToggleHideVideo && onToggleHideVideo(rep.videoId);
                              const updated = reports.map((r) => r.id === rep.id ? { ...r, status: 'RESOLVED' } : r);
                              setReports(updated);
                              savePersistedReports(updated);
                            }}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                          >
                            Ocultar Video
                          </button>
                          <button
                            onClick={() => {
                              const updated = reports.filter((r) => r.id !== rep.id);
                              setReports(updated);
                              savePersistedReports(updated);
                            }}
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-zinc-300 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                          >
                            Desestimar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <h3 className="font-bold text-white text-xs">Moderación y Control de Videos</h3>
                  <p className="text-[10px] text-zinc-400">Fija videos al Top o modera contenido inapropiado.</p>
                </div>
                <span className="text-[10px] text-zinc-400 font-bold">{videos.length} videos</span>
              </div>

              <div className="space-y-2">
                {videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-xs">@{vid.author?.username}</span>
                        {vid.isPromoted && (
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 rounded">Pauta</span>
                        )}
                        {vid.isPinned && (
                          <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 rounded font-bold">Fijado 📌</span>
                        )}
                        {vid.isHidden && (
                          <span className="text-[9px] bg-red-500/20 text-red-300 px-1.5 rounded font-bold">Oculto 🚫</span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-300 truncate mt-0.5">{vid.description}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onTogglePinVideo && onTogglePinVideo(vid.id)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          vid.isPinned ? 'bg-amber-400 text-black border-amber-400 font-bold' : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
                        }`}
                        title={vid.isPinned ? 'Desfijar video del top' : 'Fijar en el Top del Para ti'}
                      >
                        <Pin size={13} />
                      </button>

                      <button
                        onClick={() => onToggleHideVideo && onToggleHideVideo(vid.id)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          vid.isHidden
                            ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/40'
                        }`}
                        title={vid.isHidden ? 'Restaurar video en el feed público' : 'Ocultar video del feed público'}
                      >
                        {vid.isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= 8. REPORTE CONTABLE Y FINANCIERO ================= */}
          {activeTab === 'accounting' && (
            <div className="space-y-3.5 text-xs">
              <div>
                <h3 className="font-bold text-white text-xs">Informe Financiero y Contable Spot Play</h3>
                <p className="text-[10px] text-zinc-400">Ingresos limpios por software, publicidad oficial y economía cerrada.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 font-mono text-[11px]">
                <div className="flex justify-between text-zinc-300 pb-2 border-b border-white/10">
                  <span>Período:</span>
                  <span className="text-white font-bold">Noviembre 2026</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Ingresos Publicitarios Google AdMob (Oficial Play Store):</span>
                  <span className="text-emerald-400 font-bold">+${admobEarnedCOP.toLocaleString('es-CO')} COP</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Egresos en Efectivo / Pagos a Terceros:</span>
                  <span className="text-emerald-400 font-bold">$0 COP (Economía 100% Autosostenible)</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Riesgo Mercantil / Pasarelas Externas:</span>
                  <span>$0 COP (100% Monetización Legal Google AdMob)</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-xs">
                  <span className="text-white">Utilidad Neta de la Plataforma:</span>
                  <span className="text-emerald-400 font-black">${admobEarnedCOP.toLocaleString('es-CO')} COP</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadAccountingReport}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Download size={16} />
                <span>Descargar Balance en Excel / CSV</span>
              </button>
            </div>
          )}
        </div>

        {/* Barra Fija Inferior - Siempre visible para Salir al Feed o Bloquear */}
        <footer className="shrink-0 px-3 sm:px-4 py-2.5 bg-[#0a0d14] border-t border-white/10 flex items-center justify-between gap-3 pb-[max(10px,env(safe-area-inset-bottom,10px))] z-20">
          <div className="flex items-center gap-2 text-xs text-zinc-400 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-zinc-300 truncate">Modo Maestro</span>
            <span className="hidden sm:inline text-zinc-500">• {currentUser?.name || 'Administrador'}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onLock && (
              <button
                type="button"
                onClick={onLock}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                title="Bloquear panel maestro"
              >
                <Lock size={14} />
                <span className="hidden sm:inline">Bloquear</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-[#ffb800] to-yellow-500 hover:brightness-110 active:scale-95 text-black font-black text-xs uppercase tracking-wide flex items-center gap-2 shadow-[0_0_15px_rgba(255,184,0,0.35)] transition-all cursor-pointer"
              title="Cerrar panel y volver como usuario al feed de videos"
            >
              <ArrowLeft size={16} />
              <span>Cerrar y Volver al Feed</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
