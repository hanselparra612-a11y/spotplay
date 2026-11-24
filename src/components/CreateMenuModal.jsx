import React, { useState } from 'react';
import { X, Camera, ShoppingBag, Radio, Sparkles, Upload, Crown, ShieldCheck, Flame, ArrowRight } from 'lucide-react';

export default function CreateMenuModal({
  isOpen,
  currentUser,
  onClose,
  onRecordVideo,
  onUploadVideo,
  onSellProduct,
  onGoLive,
}) {
  const [showLiveGate, setShowLiveGate] = useState(false);

  if (!isOpen) return null;

  // Creador verificado o con más de 500 seguidores o cuenta dueña 'me'
  const numericFollowers = typeof currentUser?.followersCount === 'number'
    ? currentUser.followersCount
    : parseInt(String(currentUser?.followersCount || '0').replace(/\D/g, ''), 10) || 0;

  const isEligibleForLive = Boolean(
    currentUser?.isVerified ||
    currentUser?.id === 'me' ||
    numericFollowers >= 500
  );

  const handleLiveClick = () => {
    if (isEligibleForLive) {
      onClose();
      onGoLive();
    } else {
      setShowLiveGate(true);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col justify-end animate-in fade-in duration-200">
      <div className="flex-1" onClick={onClose} />

      <div className="p-5 pb-8 rounded-t-3xl bg-gradient-to-b from-[#1c2230] to-[#0c0f14] border-t-2 border-[#ffb800]/50 shadow-[0_-10px_35px_rgba(255,184,0,0.25)] text-white animate-in slide-in-from-bottom duration-200">
        {showLiveGate ? (
          /* 👑 PANTALLA DE CONTROL Y AHORRO DE RED: REGLA DE LIVE TIKTOK STYLE */
          <div className="space-y-3.5 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Crown size={15} className="text-amber-400" />
                Acceso a Transmisiones en Vivo
              </span>
              <button
                onClick={() => setShowLiveGate(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.4)] animate-pulse">
              <Radio size={28} className="text-white" />
            </div>

            <div>
              <h3 className="text-sm font-black text-white">Streaming Reservado para Creadores</h3>
              <p className="text-[11px] text-zinc-300 max-w-xs mx-auto mt-1 leading-relaxed">
                Para garantizar la máxima velocidad de la app y un consumo de red eficiente, los directos en vivo están habilitados para <strong>Creadores Verificados</strong> o con más de <strong>500 seguidores</strong>.
              </p>
            </div>

            {/* Barra de Progreso de Seguidores */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 max-w-xs mx-auto text-left">
              <div className="flex justify-between text-[11px] font-bold mb-1.5">
                <span className="text-zinc-400">Tu Audiencia Actual:</span>
                <span className="text-amber-400">{numericFollowers} / 500 seguidores</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, (numericFollowers / 500) * 100))}%` }}
                />
              </div>
            </div>

            {/* Botón Acción Principal: Subir de Galería */}
            <div className="pt-1 space-y-2">
              <button
                onClick={() => {
                  onClose();
                  onUploadVideo();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ffb800] via-[#ffa000] to-[#ff8800] text-black font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload size={15} className="stroke-[2.5]" />
                <span>Subir Video desde mi Galería HD</span>
              </button>

              <button
                onClick={() => setShowLiveGate(false)}
                className="text-xs text-zinc-400 hover:text-white underline pt-1 block mx-auto"
              >
                ← Volver al menú
              </button>
            </div>
          </div>
        ) : (
          /* MENÚ PRINCIPAL DE CREACIÓN */
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#ffb800]" />
                <h2 className="text-sm font-bold tracking-wide">¿Qué deseas crear hoy?</h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* 3 Action Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* 1. Grabar con Cámara */}
              <button
                onClick={() => {
                  onClose();
                  onRecordVideo();
                }}
                className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center text-center gap-2 group active:scale-95 transition-all shadow-lg cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff2d55] to-pink-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,45,85,0.4)] group-hover:scale-110 transition-transform">
                  <Camera size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Grabar</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5">Cámara y audio</p>
                </div>
              </button>

              {/* 2. Subir Video (Galería HD - Opción Estrella y Máxima Rentabilidad) */}
              <button
                onClick={() => {
                  onClose();
                  onUploadVideo();
                }}
                className="p-3.5 rounded-2xl bg-gradient-to-b from-[#ffb800]/15 to-amber-500/5 hover:bg-[#ffb800]/25 border-2 border-[#ffb800] flex flex-col items-center text-center gap-2 group active:scale-95 transition-all shadow-[0_0_20px_rgba(255,184,0,0.25)] cursor-pointer relative"
              >
                <span className="absolute -top-2 px-2 py-0.5 rounded-full bg-[#ffb800] text-black text-[8px] font-black uppercase tracking-wider shadow">
                  Recomendado
                </span>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ffb800] via-[#ffa000] to-[#ff8800] flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,184,0,0.5)] group-hover:scale-110 transition-transform">
                  <Upload size={22} className="stroke-[2.5]" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">Subir Video</p>
                  <p className="text-[9px] text-[#ffb800] font-bold mt-0.5">Galería HD</p>
                </div>
              </button>

              {/* 3. Transmitir en Vivo (Protegido por Regla de Creadores) */}
              <button
                onClick={handleLiveClick}
                className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center text-center gap-2 group active:scale-95 transition-all shadow-lg cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] group-hover:scale-110 transition-transform">
                  <Radio size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1 justify-center">
                    <span>En Vivo</span>
                    {!isEligibleForLive && <Crown size={10} className="text-amber-400" />}
                  </p>
                  <p className="text-[9px] text-purple-300 font-semibold mt-0.5">
                    {isEligibleForLive ? 'Iniciar Live' : 'Verificados'}
                  </p>
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
