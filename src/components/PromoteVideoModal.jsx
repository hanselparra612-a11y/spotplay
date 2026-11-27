import React, { useState } from 'react';
import {
  X,
  Flame,
  Target,
  Users,
  MessageSquare,
  Check,
  Sparkles,
  MapPin,
  Wallet,
  Smartphone,
  Coins,
  ArrowRight,
  Zap,
  Globe,
  Ticket,
  FileText,
  Bike,
  MessageCircle,
  Package,
  Layers,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Sliders,
  DollarSign,
  HelpCircle,
  CheckCircle2,
  Clock,
  Eye,
} from 'lucide-react';
import { formatCOP } from '../utils/format';
import {
  loadCampaignCatalog,
  saveCampaignCatalog,
  loadPresetPacks,
  savePresetPacks,
  saveOrUpdatePack,
  deletePack,
  saveOrUpdateCampaign,
  deleteCampaign,
  resetCampaignsAndPacks,
} from '../services/campaignService';

const CITY_OPTIONS = [
  { id: 'Toda Colombia', label: 'Toda Colombia 🇨🇴', desc: 'Máximo alcance a nivel nacional' },
  { id: 'Medellín', label: 'Medellín y Valle de Aburrá 📍', desc: 'Ideal para domicilios el mismo día' },
  { id: 'Bogotá', label: 'Bogotá D.C. 📍', desc: 'Mayor volumen de compradores' },
  { id: 'Cali', label: 'Cali y Valle del Cauca 📍', desc: 'Alta interacción y ventas directas' },
  { id: 'Barranquilla', label: 'Barranquilla y Costa Caribe 📍', desc: 'Audiencia masiva y viral' },
  { id: 'Bucaramanga', label: 'Bucaramanga y Santanderes 📍', desc: 'Comercio y calzado local' },
  { id: 'Eje Cafetero', label: 'Eje Cafetero (Pereira/Manizales) 📍', desc: 'Excelente fidelización' },
];

const ICON_MAP = {
  MessageSquare,
  Zap,
  Bike,
  Ticket,
  MessageCircle,
  Globe,
  FileText,
  Target,
  Users,
  Flame,
  Package,
};

function getCampaignIcon(item) {
  if (item.icon && typeof item.icon !== 'string') return item.icon;
  if (item.iconName && ICON_MAP[item.iconName]) return ICON_MAP[item.iconName];
  return Target;
}

export default function PromoteVideoModal({
  isOpen,
  onClose,
  video,
  currentUser,
  onPromoteSuccess,
}) {
  // Catálogo dinámico y editable persistente
  const [campaignCatalog, setCampaignCatalog] = useState(loadCampaignCatalog);
  const [presetPacks, setPresetPacks] = useState(loadPresetPacks);

  // Estados de navegación interna
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'packs' | 'manager'
  const [selectedGoal, setSelectedGoal] = useState('chat');
  const [selectedPack, setSelectedPack] = useState(null);
  const [budget, setBudget] = useState(50);
  const [city, setCity] = useState('Toda Colombia');
  const [paymentMethod, setPaymentMethod] = useState('coins'); // 100% Google Play Compliant (SpotCoins)
  const [couponCode, setCouponCode] = useState('SPOT15');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [extraCoinsBonus, setExtraCoinsBonus] = useState(0);

  // Estados del Editor de Paquetes / Campañas
  const [editingPack, setEditingPack] = useState(null); // null o pack object
  const [isCreatingPack, setIsCreatingPack] = useState(false);
  const [packFormData, setPackFormData] = useState({
    title: '',
    desc: '',
    budget: 35000,
    duration: 3,
    reach: '4.000 - 8.000 personas',
    goal: 'chat',
    cta: 'Pedir por Chat 💬',
    badge: 'Popular',
  });

  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignFormData, setCampaignFormData] = useState({
    title: '',
    badge: '',
    desc: '',
    cta: '',
  });

  const [notificationMsg, setNotificationMsg] = useState(null);

  if (!isOpen || !video) return null;

  const showNotification = (msg) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const currentAvailableCoins = typeof currentUser?.wallet?.coins === 'number'
    ? currentUser.wallet.coins
    : (typeof currentUser?.coins === 'number' ? currentUser.coins : 0);
  const userCoins = currentAvailableCoins + extraCoinsBonus;
  const coinsNeeded = selectedPack ? (selectedPack.coins || 50) : (budget || 50);

  const budgetOptions = [
    { value: 50, coins: 50, reach: '1.000 - 2.500 reproducciones prioritarias', label: '50 SpotCoins 🪙 (Inicial)' },
    { value: 100, coins: 100, reach: '3.500 - 7.000 reproducciones en Para Ti', label: '100 SpotCoins 🪙 (Popular)', popular: true },
    { value: 250, coins: 250, reach: '10.000 - 20.000 reproducciones garantizadas', label: '250 SpotCoins 🪙 (Viral)' },
    { value: 500, coins: 500, reach: '35.000+ reproducciones y máxima difusión', label: '500 SpotCoins 🪙 (Élite VIP)' },
  ];

  const handleSelectPack = (pack) => {
    setSelectedPack(pack);
    setSelectedGoal(pack.goal || 'views');
    setBudget(pack.coins || 20);
  };

  // --- MANEJADORES DE EDICIÓN Y CREACIÓN DE PAQUETES ---
  const handleOpenCreatePack = () => {
    setPackFormData({
      title: 'Pack Impulso Creador 🔥',
      desc: '3 días de recomendación prioritaria en el feed Para Ti',
      coins: 30,
      duration: 3,
      reach: '4.000 - 8.000 personas',
      goal: 'views',
      cta: 'Ver Video Completo 🚀',
      badge: 'Nuevo',
    });
    setEditingPack(null);
    setIsCreatingPack(true);
  };

  const handleOpenEditPack = (pack, e) => {
    e.stopPropagation();
    setEditingPack(pack);
    setPackFormData({
      title: pack.title || '',
      desc: pack.desc || '',
      coins: pack.coins || Math.round((pack.budget || 20000) / 1000) || 20,
      duration: pack.duration || 3,
      reach: pack.reach || '4.000 - 8.000 personas',
      goal: pack.goal || 'views',
      cta: pack.cta || 'Ver Video Completo 🚀',
      badge: pack.badge || (pack.popular ? 'Popular' : pack.bestValue ? '+ Vistas' : 'Pack'),
    });
    setIsCreatingPack(false);
  };

  const handleSavePackForm = (e) => {
    e.preventDefault();
    if (!packFormData.title.trim()) {
      alert('Por favor ingresa un título para el paquete.');
      return;
    }

    const payload = {
      ...(editingPack ? { id: editingPack.id } : {}),
      title: packFormData.title.trim(),
      desc: packFormData.desc.trim(),
      coins: Number(packFormData.coins) || 20,
      duration: Number(packFormData.duration) || 3,
      reach: packFormData.reach.trim() || '3.000 - 6.000 personas',
      goal: packFormData.goal,
      cta: packFormData.cta.trim() || 'Ver Video Completo 🚀',
      badge: packFormData.badge.trim() || 'Especial',
      popular: packFormData.badge.toLowerCase().includes('popular'),
      bestValue: packFormData.badge.toLowerCase().includes('vistas'),
    };

    const updated = saveOrUpdatePack(payload);
    setPresetPacks(updated);
    setIsCreatingPack(false);
    setEditingPack(null);
    showNotification(`✅ Paquete "${payload.title}" guardado con éxito`);
  };

  const handleDeletePack = (packId, packTitle, e) => {
    e.stopPropagation();
    if (confirm(`¿Estás seguro de eliminar el paquete "${packTitle}"?`)) {
      const updated = deletePack(packId);
      setPresetPacks(updated);
      if (selectedPack?.id === packId) {
        setSelectedPack(null);
      }
      showNotification('🗑️ Paquete eliminado');
    }
  };

  // --- MANEJADORES DE EDICIÓN DE CAMPAÑAS ---
  const handleOpenEditCampaign = (camp, e) => {
    e.stopPropagation();
    setEditingCampaign(camp);
    setCampaignFormData({
      title: camp.title,
      badge: camp.badge,
      desc: camp.desc,
      cta: camp.cta,
    });
  };

  const handleSaveCampaignForm = (e) => {
    e.preventDefault();
    if (!campaignFormData.title.trim()) return;

    const payload = {
      ...editingCampaign,
      title: campaignFormData.title.trim(),
      badge: campaignFormData.badge.trim(),
      desc: campaignFormData.desc.trim(),
      cta: campaignFormData.cta.trim(),
    };

    const updated = saveOrUpdateCampaign(payload);
    setCampaignCatalog(updated);
    setEditingCampaign(null);
    showNotification(`✅ Campaña "${payload.title}" actualizada`);
  };

  const handleResetDefaults = () => {
    if (confirm('¿Deseas restaurar todas las campañas y paquetes a los valores originales de fábrica?')) {
      const { catalog, packs } = resetCampaignsAndPacks();
      setCampaignCatalog(catalog);
      setPresetPacks(packs);
      setSelectedPack(null);
      showNotification('↺ Catálogo restaurado por defecto');
    }
  };

  const handlePromote = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const chosenCampaign = campaignCatalog.find((c) => c.id === selectedGoal);
    const chosenCta = selectedPack ? selectedPack.cta : (chosenCampaign?.cta || 'Ver más detalles 🚀');

    setTimeout(() => {
      setIsSubmitting(false);
      setConfirmed(true);

      onPromoteSuccess({
        videoId: video.id,
        budget: effectiveBudget,
        goal: selectedGoal,
        city,
        paymentMethod,
        duration: selectedPack ? selectedPack.duration : 3,
        promotedCta: chosenCta,
        campaignType: selectedGoal,
        couponCode,
        packTitle: selectedPack ? selectedPack.title : null,
      });

      setTimeout(() => {
        setConfirmed(false);
        onClose();
      }, 4500);
    }, 1200);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#16171b] border border-amber-400/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        
        {/* Floating Toast Notification */}
        {notificationMsg && (
          <div className="absolute top-12 left-4 right-4 z-50 bg-emerald-500 text-black font-bold text-[11px] px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 size={14} />
            <span className="flex-1 truncate">{notificationMsg}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#121316]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center shadow">
              <Flame size={15} className="text-black fill-black" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-tight">
                Centro de Pauta & Anuncios
              </h2>
              <p className="text-[10px] text-amber-400 font-semibold">
                Spot Play Ads Manager
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              title="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* MONITOR EN VIVO SI EL VIDEO YA ESTÁ EN CAMPAÑA */}
        {video.isPromoted && !confirmed ? (
          <div className="p-4 space-y-4 text-xs overflow-y-auto no-scrollbar">
            <div className="p-3.5 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-zinc-900 border border-emerald-400/50 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  Campaña Activa en el Feed
                </span>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  Prioridad #1
                </span>
              </div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <Flame size={14} className="fill-amber-400 text-amber-400" />
                <span>{video.promotedCta || 'Pedir por Chat 💬'}</span>
              </h3>
              <p className="text-[11px] text-zinc-300 mt-1">
                📍 Audiencia: <strong className="text-amber-400">{video.promotedCity || 'Toda Colombia'}</strong>
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                ⚡ Ubicación: <strong className="text-emerald-300">Primeras posiciones del feed "Para Ti"</strong>
              </p>
            </div>

            {/* Métricas e Inversión Reales en SpotCoins */}
            {(() => {
              const bCoins = Number(video.promotedBudget) <= 500
                ? Number(video.promotedBudget || 5)
                : Math.round(Number(video.promotedBudget || 50000) / 1000);
              const reachText = bCoins >= 500 ? '35.000+ vistas' : bCoins >= 250 ? '10.000 - 20.000 vistas' : bCoins >= 100 ? '3.500 - 7.000 vistas' : '1.000 - 2.500 vistas';
              return (
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Alcance Prioritario</p>
                    <p className="text-sm font-black text-amber-400 mt-0.5">
                      ~{reachText}
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Inversión Usada</p>
                    <p className="text-sm font-black text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                      <Coins size={14} className="text-amber-400" />
                      <span>{bCoins} SpotCoins</span>
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
              <video src={video.videoUrl} className="w-10 h-14 rounded-lg object-cover bg-black" muted />
              <div className="min-w-0">
                <p className="font-bold text-white text-xs line-clamp-1">{video.description || 'Tu video publicitario'}</p>
                <p className="text-[10px] text-amber-400 font-medium">Insignia activa: 🔥 Patrocinado</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-[#ffb800] text-black font-black text-xs rounded-xl shadow active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Entendido, Ir al Feed</span>
              </button>
            </div>
          </div>
        ) : confirmed ? (
          /* SUCCESS SCREEN */
          <div className="p-6 text-center flex flex-col items-center justify-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.5)]">
              <Flame size={32} className="fill-amber-400 text-amber-400 animate-pulse" />
            </div>
            <h3 className="text-base font-black text-white">¡Campaña Publicitaria Activada!</h3>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-left space-y-1.5 w-full text-xs">
              <p className="text-zinc-200 font-semibold">
                🪙 <strong>Inversión:</strong> {coinsNeeded} SpotCoins deducidas.
              </p>
              <p className="text-zinc-200 font-semibold">
                🚀 <strong>Posición:</strong> Puesto #1 en el Feed Para Ti.
              </p>
              <p className="text-zinc-200 font-semibold">
                🏷️ <strong>Distintivo:</strong> Insignia «🔥 Patrocinado».
              </p>
              <p className="text-zinc-200 font-semibold">
                🎯 <strong>Botón directo:</strong> "{selectedPack ? selectedPack.cta : campaignCatalog.find((c) => c.id === selectedGoal)?.cta}".
              </p>
            </div>
            <p className="text-[11px] text-zinc-400">
              Cualquier usuario que abra la app verá tu video primero.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-[#ffb800] text-black font-black text-xs rounded-xl shadow active:scale-95 transition-all cursor-pointer"
            >
              ¡Ver mi Video en el Feed Ahora!
            </button>
          </div>
        ) : isCreatingPack || editingPack ? (
          /* ============================================================ */
          /* FORMULARIO DE CREACIÓN / EDICIÓN DE PAQUETE COMERCIAL       */
          /* ============================================================ */
          <form onSubmit={handleSavePackForm} className="flex-1 flex flex-col overflow-hidden text-xs">
            <div className="px-4 py-3 bg-[#121316] border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Package size={15} className="text-amber-400" />
                <span className="font-black text-white text-xs">
                  {editingPack ? 'Editar Paquete Comercial' : 'Crear Nuevo Paquete Comercial'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingPack(false);
                  setEditingPack(null);
                }}
                className="text-[11px] text-zinc-400 hover:text-white font-semibold"
              >
                Cancelar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
              {/* Título */}
              <div>
                <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Nombre del Paquete
                </label>
                <input
                  type="text"
                  required
                  value={packFormData.title}
                  onChange={(e) => setPackFormData({ ...packFormData, title: e.target.value })}
                  placeholder="Ej: Pack Quincena de Ventas 🔥"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Descripción Comercial
                </label>
                <textarea
                  rows={2}
                  required
                  value={packFormData.desc}
                  onChange={(e) => setPackFormData({ ...packFormData, desc: e.target.value })}
                  placeholder="Ej: 3 días de campaña publicitaria con botón directo al Chat"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Presupuesto y Días */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                    Costo en SpotCoins 🪙
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="10"
                    max="1000"
                    required
                    value={packFormData.coins}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const minP = val * 100;
                      const maxP = val * 250;
                      setPackFormData({
                        ...packFormData,
                        coins: val,
                        reach: `${minP.toLocaleString('es-CO')} - ${maxP.toLocaleString('es-CO')} personas`,
                      });
                    }}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 font-bold"
                  />
                  <span className="text-[10px] text-amber-400 mt-0.5 block font-semibold">
                    {packFormData.coins || 20} SpotCoins 🪙
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                    Duración (Días)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={packFormData.duration}
                    onChange={(e) => setPackFormData({ ...packFormData, duration: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 font-bold"
                  />
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">
                    {packFormData.duration} días continuos
                  </span>
                </div>
              </div>

              {/* Alcance Estimado */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                    Alcance Estimado
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const c = packFormData.coins || 20;
                      const minP = c * 100;
                      const maxP = c * 250;
                      setPackFormData({
                        ...packFormData,
                        reach: `${minP.toLocaleString('es-CO')} - ${maxP.toLocaleString('es-CO')} personas`,
                      });
                    }}
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <Sparkles size={11} /> Auto-Calcular
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={packFormData.reach}
                  onChange={(e) => setPackFormData({ ...packFormData, reach: e.target.value })}
                  placeholder="Ej: 5.000 - 10.000 personas"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Objetivo / Acción */}
              <div>
                <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Objetivo / Tipo de Campaña
                </label>
                <select
                  value={packFormData.goal}
                  onChange={(e) => {
                    const chosen = campaignCatalog.find((c) => c.id === e.target.value);
                    setPackFormData({
                      ...packFormData,
                      goal: e.target.value,
                      cta: chosen ? chosen.cta : packFormData.cta,
                    });
                  }}
                  className="w-full px-3 py-2 bg-[#202227] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  {campaignCatalog.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.badge})
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón CTA */}
              <div>
                <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Texto del Botón en el Video (CTA)
                </label>
                <input
                  type="text"
                  required
                  value={packFormData.cta}
                  onChange={(e) => setPackFormData({ ...packFormData, cta: e.target.value })}
                  placeholder="Ej: Pedir por Chat 💬"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Insignia / Badge */}
              <div>
                <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Insignia / Distintivo
                </label>
                <input
                  type="text"
                  value={packFormData.badge}
                  onChange={(e) => setPackFormData({ ...packFormData, badge: e.target.value })}
                  placeholder="Ej: Popular, + Ventas, Express, Quincena"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Footer Form */}
            <div className="p-3 bg-[#121316] border-t border-white/10 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingPack(false);
                  setEditingPack(null);
                }}
                className="w-1/3 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                <span>{editingPack ? 'Actualizar Paquete' : 'Guardar Nuevo Paquete'}</span>
              </button>
            </div>
          </form>
        ) : editingCampaign ? (
          /* ============================================================ */
          /* FORMULARIO DE EDICIÓN DE TIPO DE CAMPAÑA                     */
          /* ============================================================ */
          <form onSubmit={handleSaveCampaignForm} className="flex-1 flex flex-col overflow-hidden text-xs">
            <div className="px-4 py-3 bg-[#121316] border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Target size={15} className="text-amber-400" />
                <span className="font-black text-white text-xs">
                  Personalizar Campaña
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingCampaign(null)}
                className="text-[11px] text-zinc-400 hover:text-white font-semibold"
              >
                Cancelar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
              <div>
                <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Nombre de la Campaña
                </label>
                <input
                  type="text"
                  required
                  value={campaignFormData.title}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Etiqueta / Categoría
                </label>
                <input
                  type="text"
                  value={campaignFormData.badge}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, badge: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  required
                  value={campaignFormData.desc}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, desc: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Texto del Botón CTA en el Video
                </label>
                <input
                  type="text"
                  required
                  value={campaignFormData.cta}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, cta: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="p-3 bg-[#121316] border-t border-white/10 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditingCampaign(null)}
                className="w-1/3 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </form>
        ) : (
          /* ============================================================ */
          /* CONFIGURATION FORM & PAQUETES SELECTION                      */
          /* ============================================================ */
          <form onSubmit={handlePromote} className="flex-1 flex flex-col overflow-hidden text-xs">
            
            {/* Pestañas de Navegación: Campañas vs Packs */}
            <div className="flex border-b border-white/10 bg-[#121316] shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('campaigns');
                  setSelectedPack(null);
                }}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'campaigns'
                    ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Layers size={13} />
                <span>Campañas ({campaignCatalog.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('packs');
                  if (!selectedPack && presetPacks.length > 0) setSelectedPack(presetPacks[0]);
                }}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'packs'
                    ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Package size={13} />
                <span>Packs Listos ({presetPacks.length})</span>
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              
              {/* Recuadro de video a pautar */}
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5 shrink-0">
                <video src={video.videoUrl} className="w-10 h-14 rounded-lg object-cover" muted />
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] uppercase font-bold text-amber-400 flex items-center gap-1">
                    <Flame size={10} className="fill-amber-400" /> Video Seleccionado
                  </span>
                  <p className="font-semibold text-white line-clamp-1">{video.description}</p>
                  <p className="text-[10px] text-zinc-400">@{video.author?.username}</p>
                </div>
              </div>

              {/* PESTAÑA 1: CATÁLOGO DE CAMPAÑAS */}
              {activeTab === 'campaigns' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-zinc-300 uppercase tracking-wider text-[10px]">
                      1. Selecciona el Tipo de Campaña
                    </span>
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                      title="Restaurar valores de fábrica"
                    >
                      <RotateCcw size={10} /> Restaurar
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {campaignCatalog.map((item) => {
                      const Icon = getCampaignIcon(item);
                      const isSelected = selectedGoal === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedGoal(item.id)}
                          className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 group relative ${
                            isSelected
                              ? 'bg-amber-400/15 border-amber-400 text-white shadow-md'
                              : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-amber-400 text-black' : 'bg-white/10 text-zinc-300'
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-bold text-xs text-white leading-tight truncate">
                                {item.title}
                              </p>
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] uppercase font-black px-1.5 py-0.2 rounded bg-white/10 text-amber-300 shrink-0">
                                  {item.badge}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenEditCampaign(item, e)}
                                  className="w-5 h-5 rounded hover:bg-white/20 flex items-center justify-center text-zinc-400 hover:text-amber-400 transition-colors"
                                  title="Editar textos del objetivo"
                                >
                                  <Edit2 size={10} />
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">
                              {item.desc}
                            </p>
                            <p className="text-[10px] font-bold text-emerald-400 mt-1 flex items-center gap-1">
                              <span>Botón en el video:</span>
                              <span className="text-white bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
                                {item.cta}
                              </span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PESTAÑA 2: PAQUETES PREDISEÑADOS (PACKS) Y HERRAMIENTA DE CREACIÓN/EDICIÓN */}
              {activeTab === 'packs' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-zinc-300 uppercase tracking-wider text-[10px]">
                      1. Selecciona o Personaliza tu Paquete
                    </span>
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                      title="Restaurar paquetes originales"
                    >
                      <RotateCcw size={10} /> Restaurar
                    </button>
                  </div>

                  {/* Botón Acción para Crear Nuevo Paquete */}
                  <button
                    type="button"
                    onClick={handleOpenCreatePack}
                    className="w-full mb-2.5 py-2 px-3 rounded-2xl border border-dashed border-amber-400/60 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
                  >
                    <Plus size={14} className="text-amber-400" />
                    <span>+ Crear Nuevo Paquete Publicitario</span>
                  </button>

                  <div className="space-y-2">
                    {presetPacks.map((pack) => {
                      const isSelected = selectedPack?.id === pack.id;
                      return (
                        <div
                          key={pack.id}
                          onClick={() => handleSelectPack(pack)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all relative group ${
                            isSelected
                              ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-zinc-900 border-amber-400 text-white shadow-lg'
                              : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0 pr-1">
                              <p className="font-black text-xs text-white leading-tight">
                                {pack.title}
                              </p>
                              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                                {pack.desc}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0">
                              {pack.badge && (
                                <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-400 text-black shadow">
                                  {pack.badge}
                                </span>
                              )}
                              
                              {/* Botones de Administrar Paquete: Editar y Eliminar */}
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditPack(pack, e)}
                                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/25 text-zinc-300 hover:text-amber-400 flex items-center justify-center transition-colors"
                                title="Editar este paquete"
                              >
                                <Edit2 size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeletePack(pack.id, pack.title, e)}
                                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-red-500/30 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-colors"
                                title="Eliminar paquete"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/10 text-[11px]">
                            <span className="font-black text-amber-400 flex items-center gap-1">
                              <Coins size={12} className="text-amber-400" />
                              <span>{pack.coins || Math.round(pack.budget / 1000)} SpotCoins · {pack.duration} días</span>
                            </span>
                            <span className="text-emerald-400 font-semibold text-[10px]">
                              {pack.reach}
                            </span>
                          </div>

                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-400">
                            <span>Botón:</span>
                            <span className="text-white font-medium bg-black/40 px-1.5 py-0.5 rounded border border-white/10 truncate max-w-[200px]">
                              {pack.cta}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Segmentación de Ciudad / Región */}
              <div>
                <span className="font-bold text-zinc-300 uppercase tracking-wider text-[10px] block mb-2 flex items-center gap-1">
                  <MapPin size={12} className="text-amber-400" />
                  2. ¿En qué ciudad deseas pautar?
                </span>
                <div className="space-y-1">
                  {CITY_OPTIONS.map((c) => {
                    const isSelected = city === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setCity(c.id)}
                        className={`px-3 py-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-400/15 border-amber-400 text-white'
                            : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-xs text-white">{c.label}</p>
                          <p className="text-[10px] text-zinc-400">{c.desc}</p>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center shrink-0">
                            <Check size={11} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Presupuesto (Solo si eligió Campaña Libre) */}
              {!selectedPack && (
                <div>
                  <span className="font-bold text-zinc-300 uppercase tracking-wider text-[10px] block mb-2">
                    3. Presupuesto y Alcance Estimado
                  </span>
                  <div className="space-y-1.5">
                    {budgetOptions.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => setBudget(opt.value)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          budget === opt.value
                            ? 'bg-gradient-to-r from-amber-500/20 to-red-500/20 border-amber-400 text-white shadow-md'
                            : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        <div>
                          <p className="font-black text-xs text-white">{opt.label}</p>
                          <p className="text-[10px] text-emerald-400 font-semibold">
                            Alcance: {opt.reach}
                          </p>
                        </div>
                        {opt.popular && (
                          <span className="text-[9px] uppercase font-black text-amber-300 bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 rounded-full">
                            Más elegido
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Método de Activación 100% Google AdMob & Google Play Compliant */}
              <div>
                <span className="font-bold text-zinc-300 uppercase tracking-wider text-[10px] block mb-2 flex items-center justify-between">
                  <span>4. Método de Activación</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Coins size={12} className="text-amber-400" />
                    <span>{userCoins} SpotCoins disponibles</span>
                  </span>
                </span>
                
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-zinc-900 border border-amber-400/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black shadow">
                        <Coins size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-white">Monedas Oficiales Spot Play</p>
                        <p className="text-[10px] text-zinc-400">
                          Inversión requerida: <strong className="text-amber-400">{coinsNeeded} SpotCoins</strong>
                        </p>
                      </div>
                    </div>
                    {userCoins >= coinsNeeded ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Check size={11} /> Saldo OK
                      </span>
                    ) : (
                      <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-400/30 px-2 py-0.5 rounded-full font-bold">
                        Faltan {coinsNeeded - userCoins} monedas
                      </span>
                    )}
                  </div>

                  {/* Botón para ver video de Google AdMob y ganar monedas gratis */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-300">
                      ¿Necesitas más monedas para pautar?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setExtraCoinsBonus((prev) => prev + 5);
                        showNotification('🎬 ¡Has visto 1 anuncio de Google AdMob! +5 SpotCoins acreditadas');
                      }}
                      className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-black text-[10px] rounded-lg transition-transform active:scale-95 flex items-center gap-1 shadow"
                    >
                      <Sparkles size={11} className="fill-black" />
                      <span>+5 Monedas Gratis (AdMob)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer con Botón de Confirmación */}
            <div className="p-3 bg-[#121316] border-t border-white/10 shrink-0">
              <button
                type="submit"
                disabled={isSubmitting || userCoins < coinsNeeded}
                className={`w-full py-3 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform flex items-center justify-center gap-2 ${
                  userCoins >= coinsNeeded
                    ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black active:scale-95 cursor-pointer shadow-amber-400/20'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                }`}
              >
                {isSubmitting ? (
                  <span className="text-white animate-pulse">Activando en {city}...</span>
                ) : userCoins >= coinsNeeded ? (
                  <>
                    <Flame size={15} className="fill-black" />
                    <span>Activar Campaña con {coinsNeeded} SpotCoins</span>
                  </>
                ) : (
                  <>
                    <Coins size={14} />
                    <span>Faltan {coinsNeeded - userCoins} Monedas para Activar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
