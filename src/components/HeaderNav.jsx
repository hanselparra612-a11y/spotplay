import React, { useRef } from 'react';
import { Search, Tv, Play, Video } from 'lucide-react';

export default function HeaderNav({
  activeFeedTab,
  onSelectFeedTab,
  onOpenSearch,
  onOpenCreateMenu,
  onToggleStories,
  isStoriesOpen = false,
  onOpenAdmin,
  onRequestMasterAccess,
  followingCount = 0,
  onLogoClick,
}) {
  const logoTapCountRef = useRef(0);
  const logoTapTimerRef = useRef(null);

  const handleLogoTap = (e) => {
    if (onLogoClick) onLogoClick(e);

    logoTapCountRef.current += 1;
    if (logoTapTimerRef.current) clearTimeout(logoTapTimerRef.current);

    if (logoTapCountRef.current >= 3) {
      logoTapCountRef.current = 0;
      if (onRequestMasterAccess) {
        onRequestMasterAccess();
      } else if (onOpenAdmin) {
        onOpenAdmin();
      }
      return;
    }

    logoTapTimerRef.current = setTimeout(() => {
      logoTapCountRef.current = 0;
    }, 1500);
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-3.5 pt-[max(10px,env(safe-area-inset-top,10px))] pb-2 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none select-none max-w-full">
      {/* 1. Lado Izquierdo: Logo Oficial Spot Play + Botón LIVE (sin estorbar la cámara/isla central) */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto z-10 shrink-0">
        <button
          onClick={handleLogoTap}
          onDoubleClick={onRequestMasterAccess || onOpenAdmin}
          className="h-8 flex items-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 transition-transform focus:outline-none shrink-0"
          title="Spot Play"
        >
          <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-[9px] bg-gradient-to-r from-[#ffe28a] via-[#ffb800] to-[#d97706] flex items-center justify-center shadow-[0_0_12px_rgba(255,184,0,0.55)] border border-white/40 shrink-0">
            <Play size={11} className="fill-white text-white ml-0.5 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
          </div>
          <span className="text-[14px] sm:text-[15px] font-black tracking-tight leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] select-none whitespace-nowrap">
            Spot <span className="text-[#ffb800]">Play</span>
          </span>
        </button>

        {/* Botón LIVE integrado */}
        <button 
          onClick={onToggleStories}
          className={`h-6 sm:h-6.5 transition-all active:scale-95 flex items-center gap-1 text-[9px] sm:text-[10px] font-bold rounded-full px-1.5 sm:px-2 border cursor-pointer shrink-0 ${
            isStoriesOpen
              ? 'bg-gradient-to-r from-[#ffb800] to-[#ff8800] text-black font-extrabold shadow-[0_0_12px_rgba(255,184,0,0.7)] border-[#ffb800]'
              : 'bg-black/50 backdrop-blur-md text-white/90 hover:text-white border-white/15 shadow-sm'
          }`}
          title="Ver Historias y En Vivos"
        >
          <Tv size={11} className={isStoriesOpen ? 'text-black' : 'text-[#ffb800] animate-pulse'} />
          <span>LIVE</span>
        </button>
      </div>

      {/* 2. Lado Derecho: [Crear] + [Buscador] */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto z-10 shrink-0 pr-0.5">
        {/* Botón Crear (Cápsula Dorada Oficial Spot Play con Letras Blancas) */}
        <button
          onClick={onOpenCreateMenu}
          className="h-7 sm:h-7.5 px-2.5 sm:px-3 rounded-full bg-gradient-to-r from-[#ffe28a] via-[#ffb800] to-[#d97706] flex items-center gap-1 sm:gap-1.5 shadow-[0_0_12px_rgba(255,184,0,0.55)] border border-white/40 active:scale-95 hover:brightness-105 transition-all cursor-pointer shrink-0"
          title="Crear SPOT o publicar video"
        >
          <Video size={12} strokeWidth={2.4} className="text-white filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]" />
          <span className="text-[11px] sm:text-xs font-black tracking-wider text-white uppercase filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Crear</span>
        </button>

        {/* Botón Buscador */}
        <button
          onClick={onOpenSearch}
          className="h-7 sm:h-7.5 w-7 sm:w-7.5 rounded-full flex items-center justify-center text-white hover:text-white/90 active:scale-90 transition-transform bg-black/45 backdrop-blur-md border border-white/20 shadow-md cursor-pointer shrink-0"
          title="Buscar en Spot Play"
        >
          <Search size={14} strokeWidth={2.2} className="drop-shadow-md text-white" />
        </button>
      </div>
    </header>
  );
}
