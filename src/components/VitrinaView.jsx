import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ExternalLink, RefreshCw, ShoppingBag, ShieldCheck } from 'lucide-react';

export default function VitrinaView({ currentUser, onBack, openStore = false, isVisible = true }) {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(1);
  const iframeRef = useRef(null);

  // ⚡ Keep-Alive Auto-Ping: evita que el servidor gratuito de Render se duerma tras 15 min de inactividad
  useEffect(() => {
    const keepAlivePing = () => {
      try {
        fetch('https://vitrinaspot.onrender.com/api/pricing', { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
      } catch (e) {}
    };
    // Ping inmediato de calentamiento
    keepAlivePing();
    // Ping preventivo cada 8 minutos para garantizar respuesta en 0 segundos
    const interval = setInterval(keepAlivePing, 8 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Escuchar mensajes nativos de Vitrina (ej: retorno al feed)
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

  // Si openStore cambia dinámicamente, sincronizamos con la vitrina ya cargada
  useEffect(() => {
    if (openStore && iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({
          type: 'SPOTPLAY_OPEN_STORE',
          openStore: true,
          uid: currentUser?.id
        }, '*');
      } catch (err) {}
    }
  }, [openStore, currentUser]);

  // Temporizador de seguridad para ocultar spinner si la carga tarda más de 3.5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, [iframeKey]);

  // Detección de entorno: Render producción vs Túnel Cloudflare vs Desarrollo local
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const isTunnel = typeof window !== 'undefined' && window.location.hostname.includes('trycloudflare.com');
  const tunnelVitrinaUrl = 'https://shed-son-rated-elizabeth.trycloudflare.com/';

  const baseUrl = isLocal 
    ? 'http://127.0.0.1:4000/' 
    : (isTunnel ? tunnelVitrinaUrl : 'https://vitrinaspot.onrender.com/');
  const externalUrl = isTunnel ? tunnelVitrinaUrl : (isLocal ? 'http://127.0.0.1:4000/' : 'https://vitrinaspot.onrender.com/');

  const params = new URLSearchParams();
  params.set('v', '28.5');
  if (typeof window !== 'undefined') {
    params.set('spotplay_origin', window.location.origin);
  }

  // Si se solicita abrir la tienda del usuario directamente (ej. desde Perfil)
  if (openStore) {
    params.set('open_store', '1');
  }

  // SSO Automático: si el usuario está autenticado en Spot Play, lo identificamos en la Vitrina
  if (currentUser && currentUser.id && currentUser.id !== 'guest') {
    params.set('sso', '1');
    params.set('uid', currentUser.id);
    params.set('name', currentUser.name || currentUser.username || '');
    // Jamás pasar base64 en la URL para evitar errores 414 de URL demasiado larga
    if (currentUser.avatar && !currentUser.avatar.startsWith('data:') && currentUser.avatar.length < 300) {
      params.set('avatar', currentUser.avatar);
    }
    params.set('email', currentUser.email || '');
  }

  const vitrinaUrl = `${baseUrl}?${params.toString()}`;

  const handleOpenExternal = () => {
    window.open(`${externalUrl}?${params.toString()}`, '_blank');
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
    <div className="relative w-full h-full flex flex-col bg-[#0c0f14] z-20 pb-[64px]">
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
      <div className="px-3 py-1 bg-emerald-950/40 border-b border-emerald-500/20 flex items-center justify-between text-[10px] text-emerald-400 shrink-0">
        <div className="flex items-center gap-1">
          <ShieldCheck size={12} />
          <span>Catálogo Directo • Pedidos al Chat Directo</span>
        </div>
        <span className="text-zinc-400 text-[9px]">Sin intermediarios</span>
      </div>

      {/* Contenedor del Iframe / Webview */}
      <div className="relative flex-1 w-full min-h-0 overflow-hidden bg-[#0c0f14]">
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
          loading="eager"
          allow="camera; microphone; geolocation; clipboard-write"
        />
      </div>
    </div>
  );
}
