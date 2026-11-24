import React, { useState } from 'react';
import { X, Gift, Coins, Plus, Sparkles, Check, Play, ShieldCheck, Flame, ArrowRight } from 'lucide-react';
import { loadVirtualGifts, loadCoinPacks } from '../data/gifts';
import { loadAdMobConfig } from '../services/admobService';

export default function GiftsDrawer({
  isOpen,
  onClose,
  targetCreator,
  currentUserCoins,
  onSendGift,
  onRechargeCoins,
  onWatchAdForCoins,
}) {
  const virtualGifts = loadVirtualGifts();
  const coinPacks = loadCoinPacks();
  const [selectedGift, setSelectedGift] = useState(() => virtualGifts[0] || {});
  const [showRechargePacks, setShowRechargePacks] = useState(false);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const admobConfig = loadAdMobConfig();
  const isAdMobOnly = admobConfig.monetizationMode === 'ADMOB_ONLY';

  if (!isOpen || !targetCreator) return null;

  const handleSend = () => {
    if (currentUserCoins < selectedGift.coins) {
      setShowRechargePacks(true);
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      onSendGift({
        gift: selectedGift,
        creator: targetCreator,
      });
      setIsSending(false);
      onClose();
    }, 400);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
      <div className="flex-1" onClick={onClose} />

      <div className="bg-[#141821] rounded-t-3xl max-h-[82%] flex flex-col shadow-2xl border-t-2 border-[#ffb800]/50 text-white animate-in slide-in-from-bottom duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Gift size={16} className="text-[#ffb800]" />
            <span className="text-xs font-bold">Enviar regalo a @{targetCreator.username}</span>
          </div>

          {/* User Coins Balance */}
          <div className="flex items-center gap-2">
            <div
              onClick={() => setShowRechargePacks(true)}
              className="flex items-center gap-1 bg-[#ffb800]/10 hover:bg-[#ffb800]/20 border border-[#ffb800]/40 px-2.5 py-1 rounded-full cursor-pointer transition-colors shadow-[0_0_10px_rgba(255,184,0,0.2)]"
            >
              <Coins size={13} className="text-[#ffb800]" />
              <span className="text-xs font-bold text-[#ffb800]">{currentUserCoins}</span>
              <Plus size={11} className="text-[#ffb800] ml-0.5" />
            </div>
            <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        {showRechargePacks ? (
          /* COIN RECHARGE VIEW (100% GOOGLE PLAY COMPLIANT) */
          <div className="p-4 space-y-3 overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Coins size={16} />
                Obtener SpotCoins Gratis (SpotPlay)
              </span>
              <button
                onClick={() => setShowRechargePacks(false)}
                className="text-xs text-zinc-400 hover:underline"
              >
                Volver a regalos
              </button>
            </div>

            {/* Banner Oficial Google AdMob Rewards */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-purple-500/20 border border-amber-400/40 shadow-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  <Flame size={12} className="text-amber-400 fill-amber-400 animate-pulse" />
                  Monetización Google AdMob
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  100% Gratis
                </span>
              </div>
              <h4 className="text-xs font-extrabold text-white mb-1">
                Gana SpotCoins viendo anuncios patrocinados
              </h4>
              <p className="text-[11px] text-zinc-300 leading-relaxed mb-3">
                No necesitas pagar dinero real ni tarjetas. Mira un breve video publicitario de Google para recargar monedas de inmediato y apoyar a tus creadores.
              </p>

              {/* Botón Principal: Ver Anuncio de Google AdMob */}
              <button
                type="button"
                onClick={() => {
                  setShowRechargePacks(false);
                  if (onWatchAdForCoins) {
                    onWatchAdForCoins();
                  } else {
                    onRechargeCoins(admobConfig.rewardCoinsAmount || 5);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-[#ffa000] to-amber-500 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,184,0,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play size={14} className="fill-black" />
                <span>Ver Anuncio y Ganar +{admobConfig.rewardCoinsAmount || 5} Monedas</span>
              </button>
            </div>

            {/* Banner Opcional de Multiplicador tras reclamar bono diario */}
            {dailyRewardClaimed && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-amber-500/20 to-orange-500/20 border border-amber-400/50 flex items-center justify-between animate-in zoom-in-95">
                <div>
                  <p className="text-xs font-black text-amber-300">🎉 ¡Reclamaste +1 SpotCoin!</p>
                  <p className="text-[10px] text-zinc-300">¿Multiplicar a 5x (+5 monedas) con video?</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setDailyRewardClaimed(false);
                      setShowRechargePacks(false);
                      if (onWatchAdForCoins) onWatchAdForCoins();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-[#ff8800] text-black font-black text-[11px] shadow-md active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Play size={10} className="fill-black" />
                    <span>Ver Video (5x)</span>
                  </button>
                  <button
                    onClick={() => setDailyRewardClaimed(false)}
                    className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Misiones Gratuitas Adicionales */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-zinc-400 px-1">Otras formas de conseguir monedas:</p>

              {/* Misión 1: Racha Diaria (Modelo Multiplicador Rentable) */}
              <div
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/50 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-cyan-400/20 text-cyan-400 flex items-center justify-center font-black text-xs">
                    🎁
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Recompensa Diaria de Ingreso</p>
                    <p className="text-[10px] text-cyan-300">+1 SpotCoin base • Multiplica a 5x con video</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      onRechargeCoins(1);
                      setDailyRewardClaimed(true);
                    }}
                    className="px-2.5 py-1 bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-300 font-bold text-[11px] rounded-lg border border-cyan-400/30 cursor-pointer active:scale-95 transition-all"
                  >
                    +1 Gratis
                  </button>
                  <button
                    onClick={() => {
                      setShowRechargePacks(false);
                      if (onWatchAdForCoins) onWatchAdForCoins();
                    }}
                    className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-[#ff8800] text-black font-extrabold text-[11px] rounded-lg shadow-[0_0_8px_rgba(255,184,0,0.4)] cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                  >
                    <Play size={10} className="fill-black" />
                    <span>5x</span>
                  </button>
                </div>
              </div>

              {/* Misión 2: Video Bonificado Extendido AdMob */}
              <div
                onClick={() => {
                  setShowRechargePacks(false);
                  if (onWatchAdForCoins) {
                    onWatchAdForCoins();
                  } else {
                    onRechargeCoins((admobConfig.rewardCoinsAmount || 5) * 2);
                  }
                }}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/50 flex items-center justify-between cursor-pointer active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center font-black text-xs">
                    ▶
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Anuncio Bonificado Extendido</p>
                    <p className="text-[10px] text-amber-300">+{(admobConfig.rewardCoinsAmount || 5) * 2} SpotCoins por ver video de 30s</p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-amber-400/20 text-amber-300 font-bold text-[11px] rounded-lg border border-amber-400/30">
                  Ver Video
                </button>
              </div>

              {/* Misión 3: Compartir LIVE */}
              <div
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: 'SpotPlay LIVE', url: window.location.href }).catch(() => {});
                  }
                  onRechargeCoins(3);
                  setShowRechargePacks(false);
                  alert('🎉 ¡Gracias por compartir! Ganaste +3 SpotCoins gratis.');
                }}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-400/50 flex items-center justify-between cursor-pointer active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-400/20 text-purple-400 flex items-center justify-center font-black text-xs">
                    🚀
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Compartir Transmisión</p>
                    <p className="text-[10px] text-purple-300">+3 SpotCoins por invitar amigos</p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-purple-400/20 text-purple-300 font-bold text-[11px] rounded-lg border border-purple-400/30">
                  Compartir
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* GIFTS GRID */
          <>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-2.5 no-scrollbar">
              {virtualGifts.map((gift) => {
                const isSelected = selectedGift.id === gift.id;
                return (
                  <div
                    key={gift.id}
                    onClick={() => setSelectedGift(gift)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-[#ffb800]/20 border-[#ffb800] shadow-[0_0_15px_rgba(255,184,0,0.3)] scale-105'
                        : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <span className="text-3xl mb-1 filter drop-shadow">{gift.emoji}</span>
                    <span className="text-[11px] font-bold text-white truncate max-w-full">
                      {gift.name}
                    </span>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <Coins size={11} className="text-[#ffb800]" />
                      <span className="text-[10px] font-bold text-[#ffb800]">{gift.coins}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Footer Bar */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400">Monedas requeridas:</span>
                <div className="flex items-center gap-1">
                  <Coins size={15} className="text-[#ffb800]" />
                  <span className="text-sm font-extrabold text-[#ffb800]">
                    {selectedGift.coins || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentUserCoins < (selectedGift.coins || 0) && (
                  <button
                    onClick={() => setShowRechargePacks(true)}
                    className="px-3 py-2 rounded-xl bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/40 text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Play size={13} className="fill-amber-300" />
                    <span>Ver Anuncio (+{admobConfig.rewardCoinsAmount || 5})</span>
                  </button>
                )}
                <button
                  disabled={isSending}
                  onClick={handleSend}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ffb800] to-[#ff8800] hover:brightness-110 text-black font-extrabold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles size={14} className="text-black" />
                  <span>{isSending ? 'Enviando...' : 'Enviar Regalo'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
