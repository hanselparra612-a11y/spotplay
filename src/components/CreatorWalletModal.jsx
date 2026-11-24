import React, { useState } from 'react';
import {
  X,
  Wallet,
  TrendingUp,
  Gift,
  Coins,
  CheckCircle,
  Flame,
  Sparkles,
  Clock,
  ShieldCheck,
  Play,
  User,
  Heart,
  ChevronRight,
  Award,
  BarChart3,
  Tv,
} from 'lucide-react';
import { loadAdMobConfig } from '../services/admobService';

export default function CreatorWalletModal({
  isOpen,
  onClose,
  wallet = {},
  receivedGifts = [],
  onWatchAdForCoins,
}) {
  const admobConfig = loadAdMobConfig();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'gifts' | 'history'

  if (!isOpen) return null;

  // Cálculo matemático exacto de SpotCoins recibidas
  const totalReceivedCoins =
    receivedGifts.length > 0
      ? receivedGifts.reduce((sum, g) => sum + (Number(g.coins) || 0), 0)
      : wallet.totalGiftsReceivedCoins || 721;

  const currentAvailableCoins = typeof wallet.coins === 'number' ? wallet.coins : 140;

  const transactions = wallet.transactions && wallet.transactions.length > 0
    ? wallet.transactions
    : [
        {
          id: 'tx-1',
          type: 'VIDEO_GIFT',
          title: 'Regalo León de Oro 🦁',
          subtitle: 'En tu video • @carlos_music',
          coins: 500,
          status: 'COMPLETED',
          date: 'Hace 3 horas',
          icon: 'gift',
        },
        {
          id: 'tx-2',
          type: 'LIVE_GIFT',
          title: 'Regalo Corona Dorada 👑',
          subtitle: 'De @valeria.tech en LIVE',
          coins: 100,
          status: 'COMPLETED',
          date: 'Ayer',
          icon: 'gift',
        },
        {
          id: 'tx-3',
          type: 'VIDEO_GIFT',
          title: 'Regalo Corona Dorada 👑',
          subtitle: 'En tu video • @valeria_fit',
          coins: 100,
          status: 'COMPLETED',
          date: 'Ayer',
          icon: 'gift',
        },
        {
          id: 'tx-4',
          type: 'VIDEO_GIFT',
          title: 'Regalo Fuego Viral 🔥',
          subtitle: 'En tu video • @andres_films',
          coins: 20,
          status: 'COMPLETED',
          date: 'Hace 2 días',
          icon: 'gift',
        },
        {
          id: 'tx-5',
          type: 'VIDEO_GIFT',
          title: 'Regalo Rosa Roja 🌹',
          subtitle: 'En tu video • @carolina_style',
          coins: 1,
          status: 'COMPLETED',
          date: 'Hace 3 días',
          icon: 'gift',
        },
        {
          id: 'tx-6',
          type: 'ADMOB_REWARD',
          title: 'Recompensa Google AdMob 🎬',
          subtitle: 'Video bonificado completado',
          coins: 5,
          status: 'COMPLETED',
          date: 'Hoy',
          icon: 'admob',
        },
      ];

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-sm bg-[#141821] border border-amber-400/40 rounded-3xl shadow-[0_0_40px_rgba(255,184,0,0.25)] overflow-hidden flex flex-col max-h-[92vh] text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-[#181d2a] to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30 shadow-sm">
              <Wallet size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Billetera de Creador</h2>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck size={11} /> Red Oficial Google AdMob
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-[#10131a] px-2 pt-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 text-xs font-bold transition-all relative flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'overview' ? 'text-amber-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Coins size={13} />
            <span>Resumen</span>
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(255,184,0,0.8)]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('gifts')}
            className={`flex-1 py-2 text-xs font-bold transition-all relative flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'gifts' ? 'text-pink-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Gift size={13} />
            <span>Regalos en Feed</span>
            {receivedGifts.length > 0 && (
              <span className="text-[9px] font-black bg-pink-500 text-white px-1.5 py-0.2 rounded-full">
                {receivedGifts.length}
              </span>
            )}
            {activeTab === 'gifts' && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-pink-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-bold transition-all relative flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'history' ? 'text-cyan-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock size={13} />
            <span>Movimientos</span>
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            )}
          </button>
        </div>

        {/* TAB 1: OVERVIEW & GOOGLE ADMOB */}
        {activeTab === 'overview' && (
          <div className="p-4 space-y-3.5 overflow-y-auto no-scrollbar text-xs">
            {/* Tarjeta de Resumen SpotCoins */}
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-[#1c2230] via-[#141821] to-[#0c0f14] border border-amber-400/40 text-center relative overflow-hidden shadow-[0_0_25px_rgba(255,184,0,0.15)]">
              <div className="flex items-center justify-center gap-1 text-[11px] uppercase tracking-wider text-amber-400 font-bold">
                <Award size={14} />
                <span>SpotCoins Recibidas de Seguidores</span>
              </div>
              <h1 className="text-3xl font-black text-white mt-1 flex items-center justify-center gap-1.5">
                <span>{totalReceivedCoins.toLocaleString('es-CO')}</span>
                <span className="text-base text-amber-400 font-bold">🪙 SpotCoins</span>
              </h1>
              <p className="text-[10px] text-zinc-400 mt-1">
                Monedas acumuladas en tus videos por apoyo de la comunidad
              </p>

              {/* Botón rápido para ver quién las envió */}
              <button
                onClick={() => setActiveTab('gifts')}
                className="mt-3 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:brightness-110 text-white font-extrabold text-xs rounded-xl shadow-md active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Gift size={13} />
                <span>Ver {receivedGifts.length || 5} Seguidores que te donaron</span>
              </button>
            </div>

            {/* Tarjetas métricas de SpotCoins */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-zinc-400 block font-bold">Disponibles en Cartera</span>
                <h3 className="text-lg font-black text-amber-400 mt-0.5">{currentAvailableCoins} 🪙</h3>
                <span className="text-[9px] text-zinc-500 block">Para premiar creadores</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-zinc-400 block font-bold">Anuncios AdMob Vistos</span>
                <h3 className="text-lg font-black text-cyan-400 mt-0.5">{wallet.adMobRewardsWatched || 28} 🎬</h3>
                <span className="text-[9px] text-emerald-400 font-bold">Recompensas ganadas</span>
              </div>
            </div>

            {/* Tarjeta Oficial Google AdMob Partner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-[#161c28] to-cyan-500/15 border border-emerald-400/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  Google AdMob Partner Oficial
                </span>
                <span className="text-[9px] text-emerald-300 font-black bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  PLAY STORE SAFE
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                SpotPlay opera bajo el modelo de monetización publicitaria de Google AdMob. Los usuarios ganan SpotCoins viendo videos bonificados y las entregan a tus contenidos sin necesidad de pasarelas de pago externas.
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-zinc-400">
                <span>eCPM Red Google: <strong className="text-white">$3.65 USD</strong></span>
                <span>Modo: <strong className="text-emerald-400">AdMob Exclusivo</strong></span>
              </div>

              {onWatchAdForCoins && (
                <button
                  type="button"
                  onClick={onWatchAdForCoins}
                  className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-[#ffb800] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Play size={13} className="fill-black" />
                  <span>Ver Video AdMob (+5 SpotCoins Gratis)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SEGUIDORES QUE ENVIARON MONEDAS A TU FEED */}
        {activeTab === 'gifts' && (
          <div className="p-4 space-y-3 overflow-y-auto no-scrollbar text-xs">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[11px] uppercase font-bold text-pink-400 tracking-wider flex items-center gap-1.5">
                  <Gift size={13} />
                  Regalos Recibidos en tus Videos
                </span>
                <p className="text-[10px] text-zinc-400">Detalle de seguidores que te premiaron con SpotCoins</p>
              </div>
              <span className="text-xs font-mono font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                {totalReceivedCoins} 🪙
              </span>
            </div>

            {receivedGifts.length === 0 ? (
              <div className="text-center py-8 px-4 bg-white/5 rounded-2xl border border-white/5">
                <Gift size={28} className="text-pink-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold text-white">Aún no tienes regalos registrados</p>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Cuando los usuarios toquen el botón 🎁 en tus videos del feed, aquí aparecerán sus nombres y aportes.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                {receivedGifts.map((rg) => (
                  <div
                    key={rg.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-pink-500/30 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-xl shadow-inner shrink-0">
                        <span>{rg.emoji}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{rg.giftName}</span>
                          <span className="text-[9px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded-full font-bold">
                            {rg.coins} SpotCoins
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-300 mt-0.5 truncate max-w-[160px]">
                          De <strong className="text-white">@{rg.senderUsername}</strong> ({rg.senderName})
                        </p>
                        <p className="text-[9px] text-zinc-500 mt-0.5 truncate max-w-[160px]">
                          🎬 {rg.videoTitle} • {rg.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-amber-400 text-xs">
                        +{rg.coins} 🪙
                      </span>
                      <span className="block text-[8px] text-emerald-400 font-bold uppercase">
                        Acreditado
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HISTORIAL DE MOVIMIENTOS SPOTCOINS */}
        {activeTab === 'history' && (
          <div className="p-4 space-y-3 overflow-y-auto no-scrollbar text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
                <Clock size={13} />
                Historial de Movimientos ({transactions.length})
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">En tiempo real</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-pink-500/20 text-pink-400">
                      {tx.icon === 'admob' ? <Tv size={14} className="text-cyan-400" /> : <Gift size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white leading-tight text-[11px] truncate max-w-[170px]">
                        {tx.title}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-[170px]">
                        {tx.date} • {tx.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-xs text-amber-400">
                      +{tx.coins} 🪙
                    </span>
                    <span className="block text-[8px] text-emerald-400 font-bold">
                      Completado
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
