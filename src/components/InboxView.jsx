import React, { useState, useEffect } from 'react';
import { 
  Heart, UserPlus, MessageCircle, Sparkles, Send, 
  MessageSquare, ShoppingBag, CheckCheck, ChevronRight, Search, Gift, Bell, Radio
} from 'lucide-react';
import { loadPersistedBroadcasts } from '../utils/storage';

export default function InboxView({ onOpenChat }) {
  // Pestaña principal: 'messages' (Chats) o 'activity' (Notificaciones)
  const [mainTab, setMainTab] = useState('messages');
  const [activityFilter, setActivityFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [broadcasts, setBroadcasts] = useState(loadPersistedBroadcasts);

  useEffect(() => {
    const handleBroadcastUpdate = () => {
      setBroadcasts(loadPersistedBroadcasts());
    };
    window.addEventListener('spotplay_broadcast', handleBroadcastUpdate);
    window.addEventListener('storage', handleBroadcastUpdate);
    return () => {
      window.removeEventListener('spotplay_broadcast', handleBroadcastUpdate);
      window.removeEventListener('storage', handleBroadcastUpdate);
    };
  }, []);

  // Deduplicar comunicados por mensaje único
  const seenBcast = new Set();
  const uniqueBroadcasts = broadcasts.filter((b) => {
    if (!b || !b.message || seenBcast.has(b.message)) return false;
    seenBcast.add(b.message);
    return true;
  });

  const latestBroadcast = uniqueBroadcasts[0] || null;

  // Lista de Chats Activos con la plataforma
  const activeChats = [
    {
      id: 'chat-sys',
      user: {
        id: 'sys',
        name: 'Spot Play Oficial',
        username: 'spotplay_soporte',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        isVerified: true,
      },
      lastMessage: latestBroadcast
        ? `📢 ${latestBroadcast.title}: ${latestBroadcast.message}`
        : '🎉 ¡Bienvenido a Spot Play! Tu perfil de creador oficial está listo para monetizar con regalos virtuales.',
      time: latestBroadcast ? latestBroadcast.timestamp : 'Hoy',
      unread: latestBroadcast ? 1 : 0,
      isOnline: true,
    },
  ];

  // Lista de Notificaciones y Actividad (incluye comunicados masivos emitidos de forma única)
  const broadcastActivities = uniqueBroadcasts.map((b) => ({
    id: `bcast-${b.id}`,
    type: 'system',
    icon: Radio,
    iconColor: 'text-amber-400 bg-amber-500/10',
    title: `📢 ${b.title}: ${b.message}`,
    time: b.timestamp || 'Reciente',
    user: activeChats[0].user,
  }));

  const baseActivities = [
    {
      id: 0,
      type: 'system',
      icon: Sparkles,
      iconColor: 'text-amber-400 bg-amber-500/10',
      title: '¡Recibiste 50 SpotCoins de bienvenida en tu billetera!',
      time: 'Hoy',
      user: activeChats[0].user,
    },
    {
      id: 1,
      type: 'gift',
      icon: Gift,
      iconColor: 'text-[#FE2C55] bg-pink-500/10',
      title: '¡Tu función de Regalos Virtuales está activa en tus videos!',
      time: 'Hace un momento',
      user: activeChats[0].user,
    },
  ];

  const activities = [...broadcastActivities, ...baseActivities];

  const filteredChats = activeChats.filter((c) => {
    const q = searchFilter.toLowerCase();
    return c.user.name.toLowerCase().includes(q) || c.user.username.toLowerCase().includes(q);
  });

  const filteredActivities =
    activityFilter === 'all'
      ? activities
      : activities.filter((item) => item.type === activityFilter);

  return (
    <div className="w-full h-full bg-[#0c0f14] overflow-y-auto no-scrollbar pt-[max(16px,calc(env(safe-area-inset-top,14px)+10px))] pb-24 px-3.5 text-white select-none">
      
      {/* 1. HEADER DE BANDEJA DE ENTRADA CON PESTAÑAS PRINCIPALES */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2 p-1 bg-[#161822] rounded-xl border border-white/5">
          <button
            onClick={() => setMainTab('messages')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              mainTab === 'messages'
                ? 'bg-gradient-to-r from-[#ffb800] to-[#ffa000] text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MessageSquare size={13} />
            <span>Chats Privados</span>
            <span className="w-2 h-2 rounded-full bg-[#ff2d55]" />
          </button>

          <button
            onClick={() => setMainTab('activity')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              mainTab === 'activity'
                ? 'bg-gradient-to-r from-[#ffb800] to-[#ffa000] text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Heart size={13} />
            <span>Actividad</span>
          </button>
        </div>

        {/* Botón Iniciar Chat */}
        <button
          onClick={() => onOpenChat(activeChats[0].user)}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#ffb800] hover:text-black flex items-center justify-center text-zinc-300 transition-all cursor-pointer shadow-sm active:scale-90"
          title="Iniciar nuevo chat"
        >
          <Send size={14} />
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PESTAÑA 1: BANDEJA DE CHATS PRIVADOS (DMs)                     */}
      {/* ------------------------------------------------------------- */}
      {mainTab === 'messages' && (
        <div className="flex flex-col gap-3">
          {/* 📢 Banner de Acceso Rápido a Difusión a Toda la Comunidad */}
          <div
            onClick={() => onOpenChat({ ...activeChats[0].user, startInBroadcastMode: true })}
            className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-amber-500/25 via-[#1a1d28] to-[#12141c] border-2 border-amber-400/60 hover:border-amber-400 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,184,0,0.18)] active:scale-[0.98] group"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-amber-300 to-[#FE2C55] text-black flex items-center justify-center font-black shadow-md shrink-0">
                <Radio size={18} className="animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate">
                  <h4 className="text-xs font-black text-amber-300 group-hover:text-amber-200 transition-colors uppercase tracking-wide truncate">
                    Difusión Masiva
                  </h4>
                  <span className="px-1.5 py-0.2 bg-amber-400 text-black rounded text-[8px] font-black shrink-0">
                    ADMIN
                  </span>
                </div>
                <p className="text-[10px] text-zinc-300 leading-tight truncate mt-0.5">
                  Emitir comunicado a la comunidad
                </p>
              </div>
            </div>
            <button className="px-2.5 py-1.5 bg-gradient-to-r from-amber-400 to-[#ffa000] text-black text-[10px] font-black rounded-xl shadow-md shrink-0 group-hover:scale-105 active:scale-95 transition-transform cursor-pointer">
              Transmitir
            </button>
          </div>

          {/* Barra de Búsqueda rápida de contactos */}
          <div className="relative">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar en tus conversaciones..."
              className="w-full bg-[#161822] text-white placeholder-zinc-500 text-xs rounded-xl py-2 pl-8 pr-3 focus:outline-none focus:ring-1 focus:ring-[#ffb800] border border-white/5"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          </div>

          {/* Lista de Conversaciones */}
          <div className="space-y-2">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onOpenChat(chat.user)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#141620] hover:bg-[#1a1d28] border border-white/5 hover:border-[#ffb800]/30 transition-all cursor-pointer shadow-md group"
              >
                {/* Avatar con punto de conexión */}
                <div className="relative shrink-0">
                  <img
                    src={chat.user.avatar}
                    alt={chat.user.username}
                    className="w-12 h-12 rounded-full object-cover border border-[#ffb800]/40 group-hover:border-[#ffb800] transition-colors"
                  />
                  {chat.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[#141620]" />
                  )}
                </div>

                {/* Info del chat */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1 truncate">
                      <p className="text-xs font-black text-white truncate">{chat.user.name}</p>
                      {chat.user.isVerified && (
                        <Sparkles size={11} className="text-[#ffb800] shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 shrink-0">{chat.time}</span>
                  </div>

                  <p className="text-[11px] text-zinc-400 truncate group-hover:text-zinc-200 transition-colors">
                    {chat.lastMessage}
                  </p>
                </div>

                {/* Badge de No Leídos o Flechita */}
                {chat.unread > 0 ? (
                  <span className="w-5 h-5 rounded-full bg-gradient-to-r from-[#ff2d55] to-red-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    {chat.unread}
                  </span>
                ) : (
                  <ChevronRight size={15} className="text-zinc-600 group-hover:text-[#ffb800] shrink-0 transition-transform group-hover:translate-x-0.5" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PESTAÑA 2: ACTIVIDAD Y NOTIFICACIONES                         */}
      {/* ------------------------------------------------------------- */}
      {mainTab === 'activity' && (
        <div className="flex flex-col gap-3">
          {/* Filtros de Actividad */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'Todo' },
              { id: 'like', label: 'Me gusta' },
              { id: 'comment', label: 'Comentarios' },
              { id: 'follow', label: 'Seguidores' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivityFilter(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  activityFilter === tab.id
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Lista de Actividades */}
          <div className="space-y-2">
            {filteredActivities.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.user && item.user.id !== 'sys') {
                      onOpenChat(item.user);
                    }
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#141620] hover:bg-[#1a1d28] transition-colors cursor-pointer border border-white/5"
                >
                  <div className="relative shrink-0">
                    <img
                      src={item.user.avatar}
                      alt={item.user.username}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border border-[#141620] ${item.iconColor}`}
                    >
                      <Icon size={11} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-200 line-clamp-1">{item.title}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{item.time}</p>
                  </div>
                  {item.user.id !== 'sys' && (
                    <button className="px-3 py-1.5 bg-[#ffb800]/10 hover:bg-[#ffb800] text-[#ffb800] hover:text-black rounded-xl text-[10px] font-black shrink-0 transition-all">
                      Chatear
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
