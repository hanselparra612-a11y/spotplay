import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ExternalLink, RefreshCw, ShoppingBag, ShieldCheck } from 'lucide-react';

export default function VitrinaView({ currentUser, onBack }) {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(1);
  const iframeRef = useRef(null);

  // Escuchar mensajes nativos de VitrinaSpot (ej: retorno al feed)
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'SPOTPLAY_NAVIGATE') {
        if (event.data.tab === 'feed' && onBack) {
          onBack();
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onBack]);

  // Catálogo comercial integrado en el mismo origen (0ms latencia, sin bloqueos cross-origin)
  const baseUrl = '/vitrinaspot/index.html';
  const externalUrl = 'https://vitrinaspot.onrender.com/';
  const params = new URLSearchParams();
  params.set('v', '27.7');
  if (typeof window !== 'undefined') {
    params.set('spotplay_origin', window.location.origin);
  }
  // SSO Automático: si el usuario está autenticado en Spot Play, lo identificamos en la Vitrina
  if (currentUser && currentUser.id && currentUser.id !== 'guest') {
    params.set('sso', '1');
    params.set('uid', currentUser.id);
    params.set('name', currentUser.name || currentUser.username || '');
    params.set('avatar', currentUser.avatar || '');
    params.set('email', currentUser.email || '');
  }

  const vitrinaUrl = `${baseUrl}?${params.toString()}`;

  const handleOpenExternal = () => {
    const fullParams = new URLSearchParams(params.toString());
    if (typeof window !== 'undefined') {
      fullParams.set('spotplay_origin', window.location.origin);
    }
    window.open(`${externalUrl}?${fullParams.toString()}`, '_blank');
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    if (iframeRef.current && iframeRef.current.contentWindow && currentUser && currentUser.id !== 'guest') {
      try {
        iframeRef.current.contentWindow.postMessage({
          type: 'SPOTPLAY_AUTH_SYNC',
          user: {
            id: currentUser.id,
            name: currentUser.name || currentUser.username || '',
            avatar: currentUser.avatar || '',
            email: currentUser.email || '',
          }
        }, '*');
      } catch (err) {
        // Safe cross-origin ignore
      }
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0c0f14] z-20 pb-[72px]">
      {/* Barra Superior de Navegación del Ecosistema */}
      <header className="flex items-center justify-between px-3.5 py-2.5 bg-[#0c0f14]/95 backdrop-blur-md border-b border-white/10 shrink-0 select-none">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer border border-white/10"
        >
          <ArrowLeft size={16} />
          <span>Spot Play</span>
        </button>

        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-[#ffb800]/20 text-[#ffb800] flex items-center justify-center">
            <ShoppingBag size={12} className="stroke-[2.5]" />
          </div>
          <span className="text-xs font-black text-white tracking-wide">
            Vitrina
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#ffb800]/20 text-[#ffb800] font-bold border border-[#ffb800]/40">
            Comercio
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRefresh}
            title="Recargar Vitrina"
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center justify-center transition-all active:scale-90 border border-white/5 cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-[#ffb800]' : ''} />
          </button>
          <button
            type="button"
            onClick={handleOpenExternal}
            title="Abrir en pantalla completa"
            className="w-8 h-8 rounded-xl bg-[#ffb800]/15 hover:bg-[#ffb800]/25 text-[#ffb800] flex items-center justify-center transition-all active:scale-90 border border-[#ffb800]/30 cursor-pointer"
          >
            <ExternalLink size={13} />
          </button>
        </div>
      </header>

      {/* Indicador de Seguridad y Pedidos al Chat Directo */}
      <div className="px-3 py-1 bg-emerald-950/40 border-b border-emerald-500/20 flex items-center justify-between text-[10px] text-emerald-400">
        <div className="flex items-center gap-1">
          <ShieldCheck size={12} />
          <span>Catálogo Directo • Pedidos al Chat Directo</span>
        </div>
        <span className="text-zinc-400 text-[9px]">Sin intermediarios</span>
      </div>

      {/* Contenedor del Iframe / Webview */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#0c0f14]">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0c0f14] z-10">
            <div className="w-10 h-10 border-3 border-[#ffb800]/20 border-t-[#ffb800] rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-xs font-bold text-white">Conectando con la Vitrina...</p>
              <p className="text-[10px] text-zinc-400">Cargando catálogo comercial seguro</p>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          key={iframeKey}
          src={vitrinaUrl}
          title="Vitrina Comercial Spot Play"
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          allow="camera; microphone; geolocation; clipboard-write"
        />
      </div>
    </div>
  );
}
