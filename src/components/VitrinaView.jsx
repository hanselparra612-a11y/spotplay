import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

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

  // Detección de entorno: Nativo Android (APK) vs Render producción vs Túnel Cloudflare vs Desarrollo local
  const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
  const isLocal = !isNative && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const isTunnel = typeof window !== 'undefined' && window.location.hostname.includes('trycloudflare.com');
  const tunnelVitrinaUrl = 'https://attended-flags-incorporated-bacteria.trycloudflare.com/';

  // En la App Nativa APK, siempre usar la URL segura oficial de producción (HTTPS)
  const baseUrl = isNative
    ? 'https://vitrinaspot.onrender.com/'
    : (isTunnel ? tunnelVitrinaUrl : (isLocal ? 'http://127.0.0.1:4000/' : 'https://vitrinaspot.onrender.com/'));
  const externalUrl = isNative
    ? 'https://vitrinaspot.onrender.com/'
    : (isTunnel ? tunnelVitrinaUrl : (isLocal ? 'http://127.0.0.1:4000/' : 'https://vitrinaspot.onrender.com/'));

  const params = new URLSearchParams();
  params.set('v', '29.7');
  params.set('embedded', '1');
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
    <div
      className="relative w-full h-full flex flex-col bg-[#121723] z-20 pb-[max(78px,calc(env(safe-area-inset-bottom,14px)+66px))]"
      style={{ paddingTop: 'max(1px, calc(env(safe-area-inset-top, 10px) - 9px))' }}
    >
      {/* Contenedor del Iframe / Webview a Pantalla Completa Nativa */}
      <div className="relative flex-1 w-full min-h-0 overflow-hidden bg-[#0c0f14]">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0c0f14] z-10">
            <div className="w-10 h-10 border-3 border-[#ffb800]/20 border-t-[#ffb800] rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-xs font-bold text-white">Conectando con Spot Vitrina...</p>
              <p className="text-[10px] text-zinc-400">Cargando catálogo comercial seguro</p>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          key={iframeKey}
          src={vitrinaUrl}
          title="Spot Vitrina Comercial"
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          loading="eager"
          allow="camera; microphone; geolocation; clipboard-write"
        />
      </div>
    </div>
  );
}
