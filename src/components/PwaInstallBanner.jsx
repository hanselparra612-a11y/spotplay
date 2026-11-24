import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, Check, Play } from 'lucide-react';

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya está corriendo como App Standalone (sin barra de Chrome/Safari)
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(standaloneMode);
    if (standaloneMode) return; // Si ya está instalada, no mostrar nada

    // 2. Detectar si es iOS (Safari)
    const isApple = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isApple);

    // 3. Capturar evento oficial PWA beforeinstallprompt en Android / Chrome
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('spotplay_pwa_dismissed');
      // Mostrar si no fue descartado recientemente
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    // 4. Capturar cuando el usuario completa la instalación
    const handleAppInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 4000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Si pasaron 3 segundos en Android y no se ha mostrado aún y no se ha cerrado:
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem('spotplay_pwa_dismissed');
      if (!dismissed && !standaloneMode) {
        setShowBanner(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Flujo nativo 1-Clic de Android / Chrome
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
        setInstalledSuccess(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // Mostrar guía interactiva para iPhone
      setShowIOSGuide(true);
    } else {
      // Fallback para navegadores móviles con prompt bloqueado
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Recordar por 24 horas para no ser intrusivo
    localStorage.setItem('spotplay_pwa_dismissed', Date.now().toString());
  };

  if (isStandalone) return null;

  return (
    <>
      {/* 🎉 Toast de Instalación Exitosa */}
      {installedSuccess && (
        <div className="fixed top-5 inset-x-4 z-50 max-w-sm mx-auto bg-emerald-600 text-white p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300 border border-emerald-400">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Check size={18} />
          </div>
          <div className="text-left text-xs leading-tight">
            <span className="font-bold block text-sm">¡SpotPlay Instalada!</span>
            <span className="text-white/90">Ya puedes abrirla desde tu pantalla principal sin la barra de Chrome.</span>
          </div>
        </div>
      )}

      {/* 📲 BANNER FLOTANTE DE INSTALACIÓN PWA (Diseño Oficial Opción A) */}
      {showBanner && (
        <div className="fixed bottom-16 inset-x-3.5 z-40 max-w-md mx-auto bg-gradient-to-r from-zinc-900/95 via-black/95 to-zinc-900/95 backdrop-blur-xl border border-amber-400/40 rounded-2xl p-3 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(251,191,36,0.25)] flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#ffe28a] via-[#ffb800] to-[#ff9500] blur-sm opacity-75 animate-pulse" />
              <div className="relative w-10 h-10 rounded-[13px] bg-gradient-to-b from-[#fff5d0] via-[#ffb800] to-[#b45309] flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.85),inset_0_2px_3px_rgba(255,255,255,0.95)] border border-white/60">
                <Play size={16} className="fill-black text-black ml-0.5 filter drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)]" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-[8px] font-black text-white border border-black shadow-md animate-bounce">
                ★
              </span>
            </div>
            <div className="text-left truncate">
              <span className="font-black text-white text-xs block truncate tracking-wide">
                Instalar Spot<span className="text-[#ffb800]">Play</span>
              </span>
              <span className="text-[10px] text-zinc-400 block truncate">
                Usar como App completa sin barra de Chrome
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full text-zinc-400 hover:text-white flex items-center justify-center text-sm"
              title="Cerrar"
            >
              <X size={15} />
            </button>
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 bg-gradient-to-b from-[#ffe28a] via-[#ffb800] to-[#c97500] hover:brightness-105 text-black font-black text-xs rounded-xl shadow-[0_0_15px_rgba(255,184,0,0.4)] active:scale-95 transition-all flex items-center gap-1.5 uppercase tracking-wider border border-white/30"
            >
              <Download size={13} className="stroke-[2.8] text-black" />
              <span>Instalar</span>
            </button>
          </div>
        </div>
      )}

      {/* 📖 MODAL DE GUÍA MANUAL PARA CELULARES (iOS Safari o Menú de Chrome) */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-white/20 p-5 text-white shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Smartphone size={20} className="text-amber-400" />
                <h4 className="font-bold text-sm">Cómo Instalar SpotPlay</h4>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-zinc-300">
                <p>Para ver SpotPlay en <strong>pantalla completa sin la barra de Safari</strong> en tu iPhone:</p>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-white">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center text-[10px]">1</span>
                    <span>Toca el botón <strong>Compartir</strong> <Share size={14} className="inline text-cyan-400" /> en Safari abajo.</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center text-[10px]">2</span>
                    <span>Desliza y selecciona <strong>"Agregar a pantalla de inicio"</strong> <PlusSquare size={14} className="inline text-emerald-400" />.</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center text-[10px]">3</span>
                    <span>Pulsa <strong>"Agregar"</strong> y ¡listo!</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-zinc-300">
                <p>Para abrir SpotPlay como <strong>App sin el buscador de Chrome</strong>:</p>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-white">
                    <span className="w-5 h-5 rounded-full bg-cyan-400 text-black font-bold flex items-center justify-center text-[10px]">1</span>
                    <span>Toca los <strong>3 puntos verticales (⋮)</strong> arriba a la derecha en Chrome.</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <span className="w-5 h-5 rounded-full bg-cyan-400 text-black font-bold flex items-center justify-center text-[10px]">2</span>
                    <span>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <span className="w-5 h-5 rounded-full bg-cyan-400 text-black font-bold flex items-center justify-center text-[10px]">3</span>
                    <span>Ábrela desde el ícono que aparecerá en tu teléfono: ¡se abrirá a pantalla completa sin barra de navegación!</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-[#FE2C55] text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition-all uppercase tracking-wider"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
