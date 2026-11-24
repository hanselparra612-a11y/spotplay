import React, { useState, useEffect } from 'react';
import { X, Play, Coins, Sparkles, CheckCircle2, ShieldCheck, Flame, Volume2, VolumeX } from 'lucide-react';
import { trackRewardedCompleted, trackAdClick, loadAdMobConfig } from '../services/admobService';

export default function AdMobRewardedModal({
  isOpen,
  onClose,
  onRewardEarned,
}) {
  const [config] = useState(loadAdMobConfig);
  const rewardCoins = config.rewardCoinsAmount || 5;
  const [secondsLeft, setSecondsLeft] = useState(6);
  const [isRewardReady, setIsRewardReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setSecondsLeft(6);
    setIsRewardReady(false);

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRewardReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaimReward = () => {
    trackRewardedCompleted(rewardCoins);
    if (onRewardEarned) {
      onRewardEarned(rewardCoins);
    }
    onClose();
  };

  const handleAdClick = () => {
    trackAdClick('REWARDED');
    window.open('https://play.google.com/store', '_blank');
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 text-white animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Google AdMob Anuncio
          </span>
          <span className="text-zinc-500 text-xs">|</span>
          <span className="text-[11px] font-bold text-zinc-300">
            {isRewardReady ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> ¡Recompensa lista!
              </span>
            ) : (
              `Recompensa en ${secondsLeft}s`
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted((prev) => !prev)}
            className="w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          {isRewardReady ? (
            <button
              onClick={handleClaimReward}
              className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold hover:scale-105 transition-all shadow-lg shadow-emerald-500/30"
              title="Cerrar y reclamar"
            >
              <X size={18} strokeWidth={3} />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full bg-black/40 border border-white/5 flex items-center justify-center text-zinc-500 text-xs font-mono">
              {secondsLeft}s
            </div>
          )}
        </div>
      </div>

      {/* Main Interactive Ad Creative */}
      <div className="flex-1 my-4 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#141824] via-[#0d1017] to-black shadow-2xl">
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Sponsor Banner */}
        <div className="mb-3 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-cyan-400" />
          <span>Red Oficial Google Mobile Ads</span>
        </div>

        {/* Dynamic Ad Preview */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#FE2C55] via-amber-500 to-[#ffb800] p-1 shadow-[0_0_40px_rgba(255,184,0,0.3)] mb-4 flex items-center justify-center animate-bounce">
          <div className="w-full h-full bg-[#0e1118] rounded-xl flex items-center justify-center text-amber-400">
            <Coins size={38} className="animate-pulse" />
          </div>
        </div>

        <h3 className="text-xl font-black text-white mb-1 tracking-tight">
          ¡Gana <span className="text-amber-400">+{rewardCoins} SpotCoins</span> Gratis!
        </h3>
        <p className="text-xs text-zinc-300 max-w-xs mb-5 leading-relaxed">
          Gracias por apoyar a los creadores de SpotPlay. Mira el video hasta el final para recibir tus monedas sin pagar un solo peso.
        </p>

        {/* Progress Bar */}
        <div className="w-full max-w-xs bg-white/10 rounded-full h-2 mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${((6 - secondsLeft) / 6) * 100}%` }}
          />
        </div>

        {/* CTA Button */}
        <button
          onClick={handleAdClick}
          className="w-full max-w-xs py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Instalar Anunciante Patrocinador</span>
        </button>
      </div>

      {/* Bottom Claim Bar */}
      <div className="text-center">
        {isRewardReady ? (
          <button
            onClick={handleClaimReward}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-black font-black text-sm uppercase tracking-wide shadow-[0_0_25px_rgba(52,211,153,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 animate-bounce cursor-pointer"
          >
            <Sparkles size={18} className="text-black" />
            <span>Reclamar Mis +{rewardCoins} SpotCoins Ahora</span>
          </button>
        ) : (
          <p className="text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-500" />
            La recompensa se liberará automáticamente al terminar el temporizador
          </p>
        )}
      </div>
    </div>
  );
}
