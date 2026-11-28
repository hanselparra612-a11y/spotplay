import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Bookmark,
  Heart,
  Grid3X3,
  Edit3,
  Share2,
  Play,
  Wallet,
  ArrowRight,
  LogOut,
  LogIn,
  Shield,
  Crown,
  Sparkles,
  Flame,
  Gift,
  UserCheck,
  UserPlus,
  CheckCircle2,
  X,
  Menu,
  ChevronRight,
  Lock,
  MessageSquare,
  ShoppingBag,
  ShieldCheck,
  Trash2,
  Smartphone,
} from 'lucide-react';
import { formatNumber } from '../utils/format';
import { resolveMediaUrl } from '../utils/apiUrl';
import { extractVideoThumbnail } from '../utils/thumbnailUtils';

function ProfileVideoThumb({ vid }) {
  const [imgError, setImgError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [extractedThumb, setExtractedThumb] = useState(null);

  const rawThumb = vid.cover || vid.thumbnail;
  const isDataThumb = rawThumb && typeof rawThumb === 'string' && rawThumb.startsWith('data:image');
  const isUserUpload = Boolean(vid.isUserUploaded || (vid.id && vid.id.startsWith('uploaded-')));

  // Si es video subido por el usuario y no tiene miniatura data:image embebida,
  // omitir peticiones 404 a Render y activar extracción local inmediata
  const thumbUrl = (isUserUpload && !isDataThumb)
    ? ''
    : (rawThumb ? resolveMediaUrl(rawThumb) : '');
  const videoUrl = vid.videoUrl ? resolveMediaUrl(vid.videoUrl) : '';

  // Auto-recuperación de miniatura con Canvas si la imagen falla o no existe
  useEffect(() => {
    let isMounted = true;
    if ((imgError || !thumbUrl) && !extractedThumb && (vid.videoBlob || videoUrl)) {
      extractVideoThumbnail(vid.videoBlob || videoUrl, 0.2)
        .then((dataUrl) => {
          if (isMounted && dataUrl) {
            setExtractedThumb(dataUrl);
          }
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [imgError, thumbUrl, extractedThumb, vid.videoBlob, videoUrl]);

  if (isDataThumb) {
    return (
      <img
        src={rawThumb}
        alt={vid.description || 'Video'}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    );
  }

  if (extractedThumb) {
    return (
      <img
        src={extractedThumb}
        alt={vid.description || 'Video'}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    );
  }

  if (thumbUrl && !imgError) {
    return (
      <img
        src={thumbUrl}
        alt={vid.description || 'Video'}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
        onError={() => setImgError(true)}
      />
    );
  }

  if (videoUrl && !videoError) {
    const cleanSrc = videoUrl.startsWith('blob:') || videoUrl.startsWith('data:')
      ? videoUrl
      : `${videoUrl}#t=0.001`;

    return (
      <video
        src={cleanSrc}
        className="w-full h-full object-cover pointer-events-none"
        muted
        playsInline
        preload="auto"
        onLoadedData={(e) => {
          try {
            if (e.currentTarget.currentTime === 0) {
              e.currentTarget.currentTime = 0.1;
            }
          } catch (err) {}
        }}
        onError={() => setVideoError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex flex-col items-center justify-center p-2 text-center select-none">
      <Play size={18} className="text-amber-400 mb-1 opacity-80" />
      <span className="text-[9px] text-zinc-300 font-medium line-clamp-2 leading-tight">
        {vid.description || 'Spot Play'}
      </span>
    </div>
  );
}

export default function ProfileView({
  currentUser,
  userVideos = [],
  bookmarkedVideos = [],
  likedVideos = [],
  onSelectVideo,
  onOpenEditProfile,
  onOpenWallet,
  onOpenAuth,
  onLogout,
  onOpenAdmin,
  isMasterAdminAuthenticated = false,
  onRequestMasterAccess,
  onLockMasterAdmin,
  initialTab = 'videos',
  onExploreVideos,
  followedCreatorsList = [],
  allCreatorsList = [],
  onToggleFollow,
  onOpenCreatorProfile,
  onEditVideo,
  onOpenPromote,
  onOpenInbox,
  onOpenVitrina,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState('right'); // 'left' | 'right'

  // 🤫 Gesto Secreto del Dueño: 5 toques rápidos en menos de 2.5s en avatar/nombre/versión
  const secretTapCountRef = useRef(0);
  const secretTapTimerRef = useRef(null);

  const handleSecretTrigger = () => {
    secretTapCountRef.current += 1;
    if (secretTapTimerRef.current) clearTimeout(secretTapTimerRef.current);

    if (secretTapCountRef.current >= 5) {
      secretTapCountRef.current = 0;
      if (onRequestMasterAccess) {
        onRequestMasterAccess();
      }
      return;
    }

    secretTapTimerRef.current = setTimeout(() => {
      secretTapCountRef.current = 0;
    }, 2500);
  };

  const TABS = ['videos', 'bookmarks', 'likes', 'gifts'];
  const profileContainerRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const mouseStartXRef = useRef(null);
  const mouseStartYRef = useRef(null);
  const isMouseDownRef = useRef(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Gestos táctiles para deslizar entre pestañas (Swipe Horizontal)
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Si el deslizamiento es predominantemente horizontal (> 40px)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      const currentIndex = TABS.indexOf(activeTab);
      if (deltaX < 0 && currentIndex < TABS.length - 1) {
        // Deslizar izquierda -> siguiente pestaña
        setSlideDirection('right');
        setActiveTab(TABS[currentIndex + 1]);
      } else if (deltaX > 0 && currentIndex > 0) {
        // Deslizar derecha -> pestaña anterior
        setSlideDirection('left');
        setActiveTab(TABS[currentIndex - 1]);
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Soporte de arrastre con ratón para PC (Mouse Drag Swipe)
  const handleMouseDown = (e) => {
    mouseStartXRef.current = e.clientX;
    mouseStartYRef.current = e.clientY;
    isMouseDownRef.current = true;
  };

  const handleMouseUp = (e) => {
    if (!isMouseDownRef.current || mouseStartXRef.current === null) return;
    const deltaX = e.clientX - mouseStartXRef.current;
    const deltaY = e.clientY - (mouseStartYRef.current || e.clientY);

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      const currentIndex = TABS.indexOf(activeTab);
      if (deltaX < 0 && currentIndex < TABS.length - 1) {
        setSlideDirection('right');
        setActiveTab(TABS[currentIndex + 1]);
      } else if (deltaX > 0 && currentIndex > 0) {
        setSlideDirection('left');
        setActiveTab(TABS[currentIndex - 1]);
      }
    }
    isMouseDownRef.current = false;
    mouseStartXRef.current = null;
    mouseStartYRef.current = null;
  };

  const currentList =
    activeTab === 'videos'
      ? userVideos
      : activeTab === 'bookmarks'
      ? bookmarkedVideos
      : activeTab === 'likes'
      ? likedVideos
      : [];

  const receivedGifts = currentUser?.receivedGifts || [];
  const totalGiftsCount = receivedGifts.length;
  const totalReceivedCoins =
    receivedGifts.reduce((acc, g) => acc + (g.coins || 0), 0) ||
    (typeof currentUser?.wallet?.totalGiftsReceivedCoins === 'number'
      ? currentUser.wallet.totalGiftsReceivedCoins
      : 0);

  // 📈 Contador General Dinámico en Modo Real: Suma real de todos los Me gusta recibidos en los videos publicados
  const userPublishedLikes = userVideos.reduce(
    (sum, v) => sum + (typeof v.stats?.likes === 'number' ? v.stats.likes : 0),
    0
  );
  const totalLikesDisplay = userPublishedLikes;

  return (
    <div
      ref={profileContainerRef}
      className="flex-1 min-h-0 w-full bg-[#121316] overflow-y-auto overscroll-y-contain touch-pan-y no-scrollbar pt-[max(10px,env(safe-area-inset-top,10px))] pb-24 px-3 sm:px-3.5 flex flex-col items-center select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Top action bar (Alineada al mismo renglón exacto del riel superior de Inicio) */}
      <div className="w-full h-8 flex items-center justify-between text-white mb-4 shrink-0">
        <h2 className="text-base font-bold flex items-center h-8 leading-none">@{currentUser.username}</h2>
        <div className="flex items-center gap-1.5 h-8">
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
              alert('¡Enlace de tu perfil copiado!');
            }}
            className="w-8 h-8 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Compartir perfil"
          >
            <Share2 size={19} />
          </button>
          {onOpenInbox && (
            <button
              onClick={onOpenInbox}
              className="w-8 h-8 flex items-center justify-center text-zinc-300 hover:text-[#ffb800] hover:bg-white/10 rounded-full transition-colors cursor-pointer relative"
              title="Bandeja de mensajes y notificaciones"
            >
              <MessageSquare size={19} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff2d55] rounded-full ring-2 ring-[#121316]" />
            </button>
          )}
          <button
            onClick={() => setIsMenuDrawerOpen(true)}
            className="w-8 h-8 flex items-center justify-center text-zinc-300 hover:text-[#ffb800] hover:bg-white/10 rounded-full transition-colors cursor-pointer active:scale-90"
            title="Menú de opciones del perfil"
          >
            <Menu size={22} className="stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* Avatar con disparador secreto de 5 toques para el dueño */}
      <div
        onClick={handleSecretTrigger}
        className="relative mb-3 cursor-pointer active:scale-95 transition-transform"
        title="Foto de perfil"
      >
        <img
          src={resolveMediaUrl(currentUser.avatar)}
          alt={currentUser.name}
          className="w-24 h-24 rounded-full object-cover border-2 border-cyan-400 p-0.5 shadow-xl"
        />
        {isMasterAdminAuthenticated && (
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center border-2 border-[#121316] shadow-md animate-in zoom-in"
            title="👑 Modo Dueño Activo"
          >
            <Crown size={12} className="stroke-[2.5]" />
          </div>
        )}
      </div>

      {/* Name con disparador secreto */}
      <h1
        onClick={handleSecretTrigger}
        className="text-base font-bold text-white mb-2 cursor-pointer select-none"
      >
        {currentUser.name}
      </h1>

      {/* 🚀 BANNER INVITADO: REGISTRARSE / INICIAR SESIÓN */}
      {currentUser.id === 'guest' && (
        <div
          onClick={onOpenAuth}
          className="w-full max-w-xs mb-3 p-3 rounded-2xl bg-gradient-to-r from-[#ffb800]/20 via-[#ff2d55]/20 to-purple-600/20 border border-[#ffb800]/50 flex items-center justify-between cursor-pointer active:scale-95 transition-all shadow-[0_0_20px_rgba(255,184,0,0.2)]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ffb800] text-black flex items-center justify-center font-black text-sm">
              ✨
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white">Crea tu Cuenta Gratis</p>
              <p className="text-[10px] text-zinc-300">Recibe 50 SpotCoins de regalo</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-[#ffb800] bg-black/40 px-2.5 py-1 rounded-xl border border-[#ffb800]/30">
            Iniciar
          </span>
        </div>
      )}

      {/* Stats (Following, Followers, Likes) */}
      <div className="flex items-center justify-center gap-6 mb-4 text-center">
        <button
          type="button"
          onClick={() => setIsFollowingModalOpen(true)}
          className="group cursor-pointer active:scale-95 transition-transform px-2 py-0.5 rounded-xl hover:bg-white/5"
          title="Ver cuentas que sigues"
        >
          <p className="text-base font-bold text-white group-hover:text-[#ffb800] transition-colors leading-tight">
            {followedCreatorsList ? followedCreatorsList.length : (typeof currentUser.followingCount === 'number' ? currentUser.followingCount : 0)}
          </p>
          <p className="text-[11px] text-zinc-400 group-hover:text-zinc-200 transition-colors flex items-center justify-center gap-0.5">
            <span>Siguiendo</span>
          </p>
        </button>
        <div className="w-[1px] h-6 bg-white/10" />
        <div>
          <p className="text-base font-bold text-white leading-tight">
            {typeof currentUser.followersCount === 'number' ? currentUser.followersCount : 0}
          </p>
          <p className="text-[11px] text-zinc-400">Seguidores</p>
        </div>
        <div className="w-[1px] h-6 bg-white/10" />
        <div>
          <p className="text-base font-bold text-white leading-tight">
            {formatNumber(totalLikesDisplay)}
          </p>
          <p className="text-[11px] text-zinc-400">Me gusta</p>
        </div>
      </div>

      {/* 💰 BILLETERA DE CREADOR Y MONETIZACIÓN BANNER */}
      <div
        onClick={onOpenWallet}
        className="w-full max-w-xs mb-2 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-amber-950/40 border border-emerald-500/40 flex items-center justify-between cursor-pointer active:scale-98 transition-all shadow-lg hover:border-emerald-400"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-amber-400">Tu Billetera SpotPlay</p>
            <p className="text-sm font-black text-white flex items-center gap-1.5">
              <span>{typeof currentUser.wallet?.coins === 'number' ? currentUser.wallet.coins : 0} SpotCoins</span>
              <span className="text-[10px] text-zinc-400 font-normal">disponibles</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
          <span>Ver Saldo</span>
          <ArrowRight size={14} />
        </div>
      </div>

      {/* 🛍️ MI VITRINA COMERCIAL (INTEGRACIÓN ECOSISTEMA VITRINASPOT) */}
      <div
        onClick={onOpenVitrina}
        className="w-full max-w-xs mb-2 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-zinc-900 to-yellow-500/10 border border-[#ffb800]/50 flex items-center justify-between cursor-pointer active:scale-98 transition-all shadow-lg hover:border-[#ffb800]"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#ffb800]/20 text-[#ffb800] flex items-center justify-center font-bold text-lg border border-[#ffb800]/30">
            <ShoppingBag size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#ffb800]">Vitrina Comercial</p>
            <p className="text-sm font-black text-white flex items-center gap-1.5">
              <span>Mi Vitrina Comercial</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#ffb800]/25 text-[#ffb800] font-bold">Tienda</span>
            </p>
            <p className="text-[10px] text-zinc-400 font-normal">Tus productos en venta dentro de Spot Play</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[#ffb800] text-xs font-bold">
          <span>Entrar</span>
          <ArrowRight size={14} />
        </div>
      </div>


      {/* 👑 PANEL MAESTRO DE ADMINISTRADOR (SOLO DUEÑO - 100% INVISIBLE PARA EL PÚBLICO) */}
      {isMasterAdminAuthenticated && (
        <button
          onClick={onOpenAdmin}
          className="w-full max-w-xs mb-4 p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/25 via-zinc-900 to-amber-600/20 border border-amber-400/50 flex items-center justify-between cursor-pointer active:scale-98 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:border-amber-400 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/40">
              <Crown size={18} />
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase font-black text-amber-400 tracking-wider">Acceso Administrador</p>
              <p className="text-xs font-bold text-white">Panel Maestro de Control</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
            <span>Abrir</span>
            <ArrowRight size={14} />
          </div>
        </button>
      )}

      {/* Bio */}
      <p className="text-xs text-zinc-300 text-center max-w-xs whitespace-pre-line mb-4">
        {currentUser.bio}
      </p>

      {/* Tabs con Indicador Deslizante y soporte de Swipe */}
      <div className="w-full flex border-b border-white/10 mb-3 relative shrink-0">
        {/* Tab 1: Mis Videos (Cuadrícula) */}
        <button
          type="button"
          onClick={() => {
            setSlideDirection('left');
            setActiveTab('videos');
          }}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer relative ${
            activeTab === 'videos' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Mis videos (Desliza hacia los lados para cambiar)"
        >
          <Grid3X3 size={16} className={activeTab === 'videos' ? 'text-[#ffb800]' : ''} />
          <span className="hidden sm:inline">Videos</span>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none transition-colors ${
            activeTab === 'videos'
              ? 'bg-[#ffb800] text-black shadow-sm'
              : 'bg-white/10 text-zinc-400'
          }`}>
            {userVideos.length}
          </span>
          {activeTab === 'videos' && (
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#ffb800] rounded-full shadow-[0_0_8px_rgba(255,184,0,0.8)]" />
          )}
        </button>

        {/* Tab 2: Favoritos / Guardados (Bandera) */}
        <button
          type="button"
          onClick={() => {
            setSlideDirection(activeTab === 'videos' ? 'right' : 'left');
            setActiveTab('bookmarks');
          }}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer relative ${
            activeTab === 'bookmarks' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Favoritos guardados (Desliza para cambiar)"
        >
          <Bookmark size={16} className={activeTab === 'bookmarks' ? 'text-[#ffb800] fill-[#ffb800]' : ''} />
          <span className="hidden sm:inline">Favoritos</span>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none transition-colors ${
            activeTab === 'bookmarks'
              ? 'bg-[#ffb800] text-black shadow-sm'
              : 'bg-white/10 text-zinc-400'
          }`}>
            {bookmarkedVideos.length}
          </span>
          {activeTab === 'bookmarks' && (
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#ffb800] rounded-full shadow-[0_0_8px_rgba(255,184,0,0.8)]" />
          )}
        </button>

        {/* Tab 3: Videos que me gustan (Corazón) */}
        <button
          type="button"
          onClick={() => {
            setSlideDirection(activeTab === 'gifts' ? 'left' : 'right');
            setActiveTab('likes');
          }}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer relative ${
            activeTab === 'likes' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Videos que me gustan (Desliza para cambiar)"
        >
          <Heart size={16} className={activeTab === 'likes' ? 'text-[#FE2C55] fill-[#FE2C55]' : ''} />
          <span className="hidden sm:inline">Likes</span>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none transition-colors ${
            activeTab === 'likes'
              ? 'bg-[#FE2C55] text-white shadow-sm'
              : 'bg-white/10 text-zinc-400'
          }`}>
            {likedVideos.length}
          </span>
          {activeTab === 'likes' && (
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#FE2C55] rounded-full shadow-[0_0_8px_rgba(254,44,85,0.8)]" />
          )}
        </button>

        {/* Tab 4: Regalos recibidos (Regalo) */}
        <button
          type="button"
          onClick={() => {
            setSlideDirection('right');
            setActiveTab('gifts');
          }}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer relative ${
            activeTab === 'gifts' ? 'text-[#FE2C55]' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Regalos recibidos (Desliza para cambiar)"
        >
          <Gift size={16} className={activeTab === 'gifts' ? 'text-[#FE2C55]' : ''} />
          <span className="hidden sm:inline">Regalos</span>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none transition-colors ${
            activeTab === 'gifts'
              ? 'bg-[#FE2C55] text-white shadow-sm'
              : 'bg-white/10 text-zinc-400'
          }`}>
            {totalGiftsCount}
          </span>
          {activeTab === 'gifts' && (
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#FE2C55] rounded-full shadow-[0_0_8px_rgba(254,44,85,0.8)]" />
          )}
        </button>
      </div>

      {/* Contenedor del contenido con animación de deslizamiento (Slide Transition) */}
      <div
        key={activeTab}
        className={`w-full ${
          slideDirection === 'right' ? 'animate-in slide-in-from-right-3' : 'animate-in slide-in-from-left-3'
        } duration-200`}
      >
        {activeTab === 'gifts' ? (
        <div className="w-full space-y-3">
          {/* Header Resumen de Regalos */}
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-pink-950/40 via-[#181a24] to-[#121316] border border-pink-500/30 flex items-center justify-between shadow-lg">
            <div>
              <div className="flex items-center gap-1.5 text-pink-400 text-xs font-bold mb-1">
                <Gift size={15} />
                <span>Monetización de Regalos en Feed</span>
              </div>
              <h2 className="text-xl font-black text-white flex items-center gap-1.5">
                <span>{totalReceivedCoins}</span>
                <span className="text-xs text-amber-400 font-bold">SpotCoins</span>
              </h2>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {totalGiftsCount} regalo(s) de seguidores patrocinados por Google AdMob
              </p>
            </div>
            <button
              onClick={onOpenWallet}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-[#ffb800] hover:brightness-110 text-black font-extrabold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Wallet size={13} />
              <span>Ver Billetera</span>
            </button>
          </div>

          {/* Lista detallada de regalos */}
          {receivedGifts.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-14 h-14 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center mx-auto mb-3">
                <Gift size={28} />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Aún no has recibido regalos</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Cuando tus seguidores toquen el botón de regalo 🎁 en tus videos, aquí verás quién te los envió y cuántas SpotCoins recibiste.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">
                Historial de Regalos Recibidos ({receivedGifts.length})
              </span>
              {receivedGifts.map((rg) => (
                <div
                  key={rg.id}
                  className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-pink-500/30 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {/* Emoji animado del regalo */}
                    <div className="w-11 h-11 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
                      <span>{rg.emoji}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs">{rg.giftName}</span>
                        <span className="text-[9px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded-full font-bold">
                          {rg.coins} SpotCoins
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 mt-0.5 truncate max-w-[170px]">
                        Enviado por <strong className="text-white">@{rg.senderUsername}</strong>
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-[170px]">
                        🎬 {rg.videoTitle} • {rg.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-amber-400 text-xs">
                      +{rg.coins} 🪙
                    </span>
                    <span className="block text-[9px] text-emerald-400 font-bold">Acreditado</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Video Grid (Videos, Favoritos, Likes) */
        <div className="w-full grid grid-cols-3 gap-1">
          {currentList.length > 0 ? (
            currentList.map((vid) => (
              <div
                key={vid.id}
                onClick={() => onSelectVideo(vid.id)}
                className="relative aspect-3/4 bg-zinc-900 rounded overflow-hidden cursor-pointer group active:scale-[0.98] transition-transform"
              >
                <ProfileVideoThumb vid={vid} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 group-hover:opacity-40 transition-opacity" />

                {/* Botón Editar Video (Solo en tus videos) */}
                {activeTab === 'videos' && onEditVideo && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditVideo(vid);
                    }}
                    className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/80 hover:bg-amber-400 hover:text-black text-white border border-white/25 transition-all z-20 shadow-md active:scale-90 flex items-center gap-1 font-bold text-[9px] backdrop-blur-xs"
                    title="Editar este video"
                  >
                    <Edit3 size={10} />
                    <span>Editar</span>
                  </button>
                )}

                {/* Tag indicator for bookmarked tab */}
                {activeTab === 'bookmarks' && (
                  <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm p-1 rounded-md text-amber-400 z-10 shadow">
                    <Bookmark size={11} className="fill-amber-400" />
                  </div>
                )}

                {/* Badge de Regalos recibidos en este video (Mis Videos) */}
                {activeTab === 'videos' && vid.stats?.giftsCount > 0 && (
                  <div
                    className="absolute top-1.5 right-1.5 bg-black/75 backdrop-blur-xs text-[#FE2C55] px-1.5 py-0.5 rounded-md flex items-center gap-0.5 text-[9px] font-black border border-pink-500/30 z-20 shadow"
                    title={`${vid.stats.giftsCount} regalos recibidos`}
                  >
                    <Gift size={9} className="fill-[#FE2C55]" />
                    <span>{formatNumber(vid.stats.giftsCount)}</span>
                  </div>
                )}

                {/* Fila Inferior: Contador de Vistas (Izquierda) + Botón Impulsar (Derecha) */}
                <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between z-10 pointer-events-none gap-0.5">
                  <div className="flex items-center gap-0.5 text-[9.5px] text-white font-medium drop-shadow pointer-events-auto shrink-0">
                    <Play size={9} className="fill-white" />
                    <span>{formatNumber(typeof vid.stats?.views === 'number' ? vid.stats.views : (typeof vid.views === 'number' ? vid.views : 0))}</span>
                  </div>

                  {/* Botón Promocionar / Impulsar con SpotCoins (Solo en tus videos) */}
                  {activeTab === 'videos' && onOpenPromote && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPromote(vid);
                      }}
                      className="pointer-events-auto px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-[#ffb800] text-black font-black text-[8.5px] flex items-center gap-0.5 shadow-md active:scale-90 transition-all hover:brightness-110 cursor-pointer border border-amber-300/40 shrink-0"
                      title="Impulsar visibilidad de este video con SpotCoins"
                    >
                      <Flame size={9} className="fill-black stroke-black" />
                      <span>{vid.isPromoted ? 'En Pauta' : 'Impulsar'}</span>
                    </button>
                  )}

                  {activeTab === 'bookmarks' && (
                    <span className="text-[8.5px] text-amber-300/90 truncate max-w-[50px] drop-shadow pointer-events-auto">
                      @{vid.author?.username}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-10 px-4 flex flex-col items-center justify-center">
              {activeTab === 'videos' && (
                <p className="text-zinc-500 text-xs">
                  Aún no has publicado ningún video. ¡Toca el botón + para grabar o subir uno!
                </p>
              )}
              {activeTab === 'bookmarks' && (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
                    <Bookmark size={22} className="fill-amber-400/30 text-amber-400" />
                  </div>
                  <p className="text-white text-xs font-bold mb-1">No tienes favoritos guardados</p>
                  <p className="text-zinc-400 text-[11px] max-w-xs mb-3 leading-relaxed">
                    Toca la banderita vertical en cualquier video del feed para guardarlo en tu colección privada.
                  </p>
                  {onExploreVideos && (
                    <button
                      onClick={onExploreVideos}
                      className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-[11px] rounded-full shadow transition-all active:scale-95"
                    >
                      Explorar videos
                    </button>
                  )}
                </div>
              )}
              {activeTab === 'likes' && (
                <p className="text-zinc-500 text-xs">
                  No le has dado like a ningún video todavía.
                </p>
              )}
            </div>
          )}
        </div>
      )}
      </div>

      {/* 📱 MENÚ DESPLEGABLE DEL PERFIL (SLIDE BOTTOM SHEET TIKTOK STYLE) */}
      {isMenuDrawerOpen && (
        <div
          onClick={() => setIsMenuDrawerOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] bg-gradient-to-b from-[#151a28]/98 via-[#0e121d]/98 to-[#07090f]/98 backdrop-blur-2xl border-t border-amber-400/40 rounded-t-3xl p-5 shadow-[0_-20px_50px_rgba(0,0,0,0.95),0_0_35px_rgba(255,184,0,0.14)] animate-in slide-in-from-bottom duration-300 space-y-3.5 max-h-[85vh] overflow-y-auto no-scrollbar text-left"
          >
            {/* Barra táctil para deslizar hacia abajo */}
            <div
              className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-2 cursor-pointer hover:bg-white/40 transition-colors"
              onClick={() => setIsMenuDrawerOpen(false)}
            />

            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src={resolveMediaUrl(currentUser.avatar)}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#ffb800]/50"
                />
                <div>
                  <h3 className="text-sm font-black text-white">{currentUser.name}</h3>
                  <p className="text-[11px] text-zinc-400">@{currentUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuDrawerOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Opciones del menú estilo TikTok */}
            <div className="space-y-1.5 pt-1">
              {/* 0. Crear Cuenta / Registrar Nuevo Perfil */}
              {onOpenAuth && (
                <button
                  onClick={() => {
                    setIsMenuDrawerOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full p-3 rounded-2xl bg-gradient-to-r from-[#ffb800]/25 via-amber-500/20 to-orange-500/15 hover:bg-[#ffb800]/30 border border-[#ffb800]/50 flex items-center justify-between transition-all cursor-pointer group active:scale-98 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ffb800] to-[#ffa000] text-black flex items-center justify-center font-bold shadow-md">
                      <UserPlus size={18} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-black text-white block">Crear Perfil / Registrarse</span>
                      <span className="text-[10px] text-[#ffb800] font-bold">Crea tu @usuario y gana 50 SpotCoins</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#ffb800] group-hover:translate-x-0.5 transition-all" />
                </button>
              )}

              {/* 1. Billetera */}
              <button
                onClick={() => {
                  setIsMenuDrawerOpen(false);
                  if (onOpenWallet) onOpenWallet();
                }}
                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between transition-all cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Wallet size={18} />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">Tu Billetera SpotPlay</span>
                    <span className="text-[10px] text-amber-400 font-semibold">
                      {typeof currentUser.wallet?.coins === 'number' ? currentUser.wallet.coins : 0} SpotCoins Disponibles
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* 2. Panel Maestro Administrador (SOLO VISIBLE SI EL DUEÑO ESTÁ AUTENTICADO) */}
              {isMasterAdminAuthenticated && (
                <button
                  onClick={() => {
                    setIsMenuDrawerOpen(false);
                    if (onOpenAdmin) onOpenAdmin();
                  }}
                  className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-zinc-900 to-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 flex items-center justify-between transition-all cursor-pointer group active:scale-98 animate-in fade-in"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
                      <Crown size={18} />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block">Panel Maestro de Control</span>
                      <span className="text-[10px] text-amber-400">Acceso exclusivo Administrador</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              )}

              {/* Bloqueo discreto de sesión de administrador */}
              {isMasterAdminAuthenticated && onLockMasterAdmin && (
                <button
                  onClick={() => {
                    setIsMenuDrawerOpen(false);
                    onLockMasterAdmin();
                  }}
                  className="w-full p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/20 flex items-center justify-between transition-all cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Lock size={15} className="text-amber-400" />
                    <span className="text-xs font-bold text-amber-300">Bloquear Panel Maestro</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">Proteger</span>
                </button>
              )}

              {/* 3. Editar Perfil */}
              <button
                onClick={() => {
                  setIsMenuDrawerOpen(false);
                  if (onOpenEditProfile) onOpenEditProfile();
                }}
                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between transition-all cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Edit3 size={18} />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">Editar Perfil</span>
                    <span className="text-[10px] text-zinc-400">Foto, nombre, bio y WhatsApp de tienda</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* 4. Cuentas que sigues */}
              <button
                onClick={() => {
                  setIsMenuDrawerOpen(false);
                  setIsFollowingModalOpen(true);
                }}
                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between transition-all cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <UserCheck size={18} />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">Cuentas que sigues</span>
                    <span className="text-[10px] text-zinc-400">{followedCreatorsList.length} creadores</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Botón PWA Oficial: Instalar en Celular */}
              <button
                onClick={() => {
                  setIsMenuDrawerOpen(false);
                  window.dispatchEvent(new CustomEvent('spotplay_trigger_install'));
                }}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent hover:from-amber-500/30 border border-amber-500/40 flex items-center justify-between transition-all cursor-pointer group active:scale-98 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-[#ffb800] flex items-center justify-center border border-amber-500/30 shrink-0">
                    <Smartphone size={18} />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                      Instalar Spot Play <span className="text-[9px] bg-[#ffb800] text-black font-extrabold px-1.5 py-0.5 rounded-full uppercase">App</span>
                    </span>
                    <span className="text-[10px] text-zinc-300">Pantalla completa en tu celular</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#ffb800] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              {/* 5. Política de Privacidad & AdMob */}
              <a
                href="/privacidad.html"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuDrawerOpen(false)}
                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between transition-all cursor-pointer group active:scale-98 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">Política de Privacidad</span>
                    <span className="text-[10px] text-zinc-400">Términos legales y AdMob</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </a>

              {/* 6. Eliminar Cuenta (Google Play Compliance) */}
              <a
                href="/eliminar-cuenta.html"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuDrawerOpen(false)}
                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 flex items-center justify-between transition-all cursor-pointer group active:scale-98 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-400 group-hover:text-red-400 flex items-center justify-center">
                    <Trash2 size={16} />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-zinc-300 group-hover:text-red-300 block">Eliminar Cuenta y Datos</span>
                    <span className="text-[10px] text-zinc-500">Solicitud de borrado permanente</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-600 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
              </a>

              {/* 7. Cerrar Sesión */}
              <button
                onClick={() => {
                  setIsMenuDrawerOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full p-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-between transition-all cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                    <LogOut size={18} />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-red-400 block">Cerrar Sesión</span>
                    <span className="text-[10px] text-zinc-400">Cambiar de cuenta o salir</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-red-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Pie de menú con versión y disparador secreto de 5 toques */}
              <div
                onClick={handleSecretTrigger}
                className="pt-4 pb-2 text-center cursor-pointer select-none border-t border-white/5 active:opacity-75 transition-opacity"
                title="Versión Spot Play"
              >
                <p className="text-[11px] text-zinc-500 font-semibold">Spot Play v2.4.0 • Colombia</p>
                <p className="text-[9px] text-zinc-600">Sistema Seguro y Cifrado</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 👥 MODAL DE CUENTAS QUE SIGUES */}
      {isFollowingModalOpen && (
        <div
          onClick={() => setIsFollowingModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#141821] border border-[#ffb800]/30 rounded-3xl overflow-hidden shadow-[0_0_35px_rgba(0,0,0,0.8)] flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-[#181c26]">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-[#ffb800]" />
                <h3 className="text-xs font-extrabold text-white">
                  Cuentas que sigues ({followedCreatorsList.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFollowingModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 overflow-y-auto space-y-2 no-scrollbar">
              {followedCreatorsList.length > 0 ? (
                followedCreatorsList.map((creator) => (
                  <div
                    key={creator.id}
                    onClick={() => {
                      setIsFollowingModalOpen(false);
                      if (onOpenCreatorProfile) onOpenCreatorProfile(creator);
                    }}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <img
                        src={creator.avatar}
                        alt={creator.username}
                        className="w-10 h-10 rounded-full object-cover border border-[#ffb800]/40 shrink-0"
                      />
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                          <span>{creator.name}</span>
                          {creator.isVerified && <CheckCircle2 size={11} className="text-[#ffb800] shrink-0" />}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">@{creator.username}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleFollow) onToggleFollow(creator.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 text-zinc-200 border border-white/10 text-[10px] font-bold transition-all shrink-0"
                    >
                      Siguiendo
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 space-y-3">
                  <p className="text-xs font-bold text-white">Aún no sigues a ningún creador</p>
                  <p className="text-[11px] text-zinc-400">
                    Sigue a tus creadores favoritos para ver sus videos en la pestaña "Siguiendo".
                  </p>
                  {allCreatorsList.length > 0 && (
                    <div className="pt-2 space-y-2 text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#ffb800]">
                        Creadores sugeridos en Spot Play
                      </p>
                      {allCreatorsList.slice(0, 3).map((creator) => (
                        <div
                          key={creator.id}
                          className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <img
                              src={creator.avatar}
                              alt={creator.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-white truncate">{creator.name}</p>
                              <p className="text-[9px] text-zinc-400 truncate">@{creator.username}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onToggleFollow && onToggleFollow(creator.id)}
                            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#ffb800] to-[#ff8800] text-black font-extrabold text-[10px] flex items-center gap-1"
                          >
                            <UserPlus size={11} />
                            <span>Seguir</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
