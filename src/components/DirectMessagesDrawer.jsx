import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Send, Sparkles, CheckCheck, 
  Smile, Heart, Flame, Radio, Bell, Megaphone, ShieldCheck
} from 'lucide-react';
import { addOfficialBroadcast, loadPersistedBroadcasts } from '../utils/storage';

export default function DirectMessagesDrawer({ 
  isOpen, 
  onClose, 
  chatPartner,
  onBroadcastNotification,
  isMasterAdmin = false,
}) {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isBroadcastMode, setIsBroadcastMode] = useState(() => Boolean(chatPartner?.startInBroadcastMode));
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatPartner?.startInBroadcastMode) {
      setIsBroadcastMode(true);
    }
  }, [chatPartner]);

  const isSysChat = Boolean(
    chatPartner && (chatPartner.id === 'sys' || chatPartner.username === 'spotplay_soporte')
  );

  // Detección de teclado virtual en tiempo real
  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const vh = window.visualViewport.height;
        const wh = window.innerHeight;
        const diff = wh - vh;
        if (diff > 80) {
          setKeyboardHeight(diff);
        } else {
          setKeyboardHeight(0);
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, []);

  const handleInputFocus = () => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  // Clave de almacenamiento persistente para este contacto
  const storageKey = chatPartner ? `spotplay_chat_${chatPartner.id || chatPartner.username}` : null;

  // Mensajes por defecto de bienvenida
  const getInitialMessages = () => {
    if (isSysChat) {
      const persistedBroadcasts = loadPersistedBroadcasts();
      const seenMessages = new Set();
      const broadcastMessages = [];
      
      for (const b of persistedBroadcasts) {
        if (b && b.message && !seenMessages.has(b.message)) {
          seenMessages.add(b.message);
          broadcastMessages.push({
            id: `msg-${b.id}`,
            sender: 'partner',
            isBroadcast: true,
            title: b.title,
            text: `📢 COMUNICADO OFICIAL: ${b.title}\n\n${b.message}`,
            time: b.timestamp || 'Reciente',
            read: true,
          });
        }
      }

      const baseSys = [
        {
          id: 'sys-welcome',
          sender: 'partner',
          text: '🎉 ¡Bienvenido a Spot Play Oficial! Este es el canal institucional de la plataforma. Aquí recibirás novedades, soporte y comunicados directos para toda la comunidad.',
          time: 'Hoy',
          read: true,
        },
      ];

      return [...baseSys, ...broadcastMessages];
    }

    return [
      {
        id: 'm-1',
        sender: 'partner',
        text: `¡Hola! Gracias por apoyar mis videos en Spot Play ✨ ¿Qué tipo de contenido te gustaría ver en el próximo video?`,
        time: '10:40 AM',
        read: true,
      },
      {
        id: 'm-2',
        sender: 'me',
        text: '¡Hola! Me encantó la edición del último reel. ¡Sigue así!',
        time: '10:42 AM',
        read: true,
      },
      {
        id: 'm-3',
        sender: 'partner',
        text: '¡Muchas gracias por la buena vibra! Viene contenido exclusivo muy pronto 🚀🔥',
        time: '10:43 AM',
        read: true,
      },
    ];
  };

  const [messages, setMessages] = useState(() => {
    if (!storageKey) return getInitialMessages();
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return getInitialMessages();
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return getInitialMessages();
      return parsed;
    } catch {
      return getInitialMessages();
    }
  });

  // Guardar mensajes automáticamente cuando cambian
  useEffect(() => {
    if (storageKey && messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (e) {
        console.error('Error guardando chat en localStorage', e);
      }
    }
  }, [messages, storageKey]);

  // Escuchar comunicados que se emitan desde el Panel Maestro en vivo
  useEffect(() => {
    const handleLiveBroadcast = (e) => {
      if (isSysChat && e.detail) {
        const b = e.detail;
        setMessages((prev) => {
          if (prev.some((m) => m.text && m.text.includes(b.message))) {
            return prev;
          }
          const bcastMsg = {
            id: `msg-live-${b.id || Date.now()}`,
            sender: 'partner',
            isBroadcast: true,
            title: b.title,
            text: `📢 COMUNICADO OFICIAL: ${b.title}\n\n${b.message}`,
            time: b.timestamp || 'Ahora',
            read: true,
          };
          return [...prev, bcastMsg];
        });
      }
    };
    window.addEventListener('spotplay_broadcast', handleLiveBroadcast);
    return () => window.removeEventListener('spotplay_broadcast', handleLiveBroadcast);
  }, [isSysChat]);

  // Scroll automático hacia el último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen || !chatPartner) return null;

  // Enviar mensaje de texto
  const handleSendMessage = (textToSend = inputText) => {
    const cleanText = textToSend.trim();
    if (!cleanText) return;

    // 📢 SI ESTÁ EN MODO DIFUSIÓN A TODA LA COMUNIDAD (DUEÑO / ADMIN)
    if (isSysChat && isBroadcastMode) {
      // 1. Disparar banner en tiempo real en la app y persistir de forma única
      if (onBroadcastNotification) {
        onBroadcastNotification({
          title: '👑 Comunicado Oficial Spot Play',
          message: cleanText,
          target: 'all',
        });
      } else {
        addOfficialBroadcast({
          title: '👑 Comunicado Oficial Spot Play',
          message: cleanText,
          target: 'all',
        });
      }

      setInputText('');
      alert('🚀 ¡Comunicado difundido exitosamente a toda la comunidad de Spot Play!');
      return;
    }

    // Mensaje normal enviado por el usuario
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: cleanText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Si es chat con Spot Play Oficial (Soporte Inteligente)
    if (isSysChat) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const q = cleanText.toLowerCase();
        let reply = '¡Hola! Gracias por comunicarte con el Soporte Oficial de Spot Play. Nuestro equipo y sistema están activos para asistirte.';
        
        if (q.includes('monetiz') || q.includes('ganar') || q.includes('plata') || q.includes('dinero') || q.includes('regalo')) {
          reply = '💰 En Spot Play puedes monetizar mediante Regalos Virtuales patrocinados por Google AdMob que tus seguidores te envían en tus videos y transmisiones LIVE.';
        } else if (q.includes('vitrina') || q.includes('producto') || q.includes('tienda') || q.includes('vender') || q.includes('negocio')) {
          reply = '🛍️ En Vitrina Spot puedes publicar tus productos o servicios gratis. Los clientes se contactan directo a tu WhatsApp o Telegram.';
        } else if (q.includes('live') || q.includes('en vivo') || q.includes('transmitir') || q.includes('transmisi')) {
          reply = '🔴 Para emitir en vivo, toca el botón central "+" en el menú inferior y selecciona "Emitir En Vivo". ¡Podrás recibir regalos virtuales en tiempo real!';
        } else if (q.includes('spotcoins') || q.includes('coins') || q.includes('moneda') || q.includes('billetera')) {
          reply = '🪙 Tus SpotCoins se gestionan desde tu Perfil > Billetera. Puedes obtener más viendo anuncios de Google AdMob o recargando paquetes.';
        } else if (q.includes('difusion') || q.includes('comunicado') || q.includes('todos') || q.includes('comunidad')) {
          reply = '📢 Para emitir un comunicado masivo a toda la comunidad, puedes presionar el botón "Activar Difusión" arriba de este chat o usar la pestaña Difusión en el Panel Maestro.';
        } else if (q.includes('hola') || q.includes('buenas')) {
          reply = '¡Hola! Me alegra saludarte. Soy el canal oficial de Spot Play. ¿En qué podemos ayudarte hoy? ✨';
        }

        const botReply = {
          id: `msg-${Date.now() + 1}`,
          sender: 'partner',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: true,
        };

        setMessages((prev) => [...prev, botReply]);
      }, 1200);
      return;
    }

    // Simulación de respuesta del Creador (en chats normales)
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let replyText = '¡Totalmente de acuerdo! Gracias por ser parte de la comunidad de Spot Play 🙌✨';
      
      if (cleanText.toLowerCase().includes('en vivo') || cleanText.toLowerCase().includes('live')) {
        replyText = '¡Sí! Estaré haciendo un En Vivo exclusivo esta semana. ¡Atento a las notificaciones! 🔴';
      } else if (cleanText.toLowerCase().includes('hola')) {
        replyText = '¡Hola! ¿Cómo estás? Me alegra verte por aquí en Spot Play ✨';
      }

      const botReply = {
        id: `msg-${Date.now() + 1}`,
        sender: 'partner',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: true,
      };

      setMessages((prev) => [...prev, botReply]);
    }, 1600);
  };

  // Reacciones rápidas con 1 toque
  const quickReactions = ['🔥', '❤️', '👏', '🚀', '✨'];

  return (
    <div className="absolute inset-0 z-50 bg-[#0c0f14] flex flex-col text-white animate-in slide-in-from-right duration-200 select-none">
      
      {/* 1. TOP HEADER DEL CHAT */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-white/10 bg-[#12141c]/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all active:scale-90 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={chatPartner.avatar}
                alt={chatPartner.username}
                className="w-9 h-9 rounded-full object-cover border-1.5 border-[#ffb800]/50"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#12141c]" />
            </div>
            
            <div>
              <div className="flex items-center gap-1">
                <p className="text-xs font-black leading-tight text-white">{chatPartner.name || chatPartner.username}</p>
                {isSysChat ? (
                  <ShieldCheck size={13} className="text-[#ffb800]" />
                ) : (
                  <Sparkles size={11} className="text-[#ffb800]" />
                )}
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">
                @{chatPartner.username} • <span className="text-emerald-400 font-semibold">{isSysChat ? 'Canal Verificado' : 'En línea'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE DIFUSIÓN MASIVA (SOLO DISPONIBLE EN CANAL OFICIAL) */}
      {isSysChat && (
        <div className="px-3.5 py-2.5 bg-[#161822] border-b-2 border-amber-400/40 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${isBroadcastMode ? 'bg-amber-400 text-black animate-pulse' : 'bg-amber-400/20 text-amber-400 border border-amber-400/40'}`}>
              <Radio size={16} />
            </div>
            <div>
              <p className="text-xs font-black text-white leading-tight">
                {isBroadcastMode ? '📢 Modo Difusión Masiva Activo' : 'Canal Oficial & Soporte'}
              </p>
              <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                {isBroadcastMode ? 'Tu mensaje se enviará a TODA la comunidad en vivo' : 'Toca el botón para hablar a todos'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsBroadcastMode(!isBroadcastMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md active:scale-95 ${
              isBroadcastMode
                ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-[#FE2C55] text-black shadow-[0_0_15px_rgba(255,184,0,0.5)]'
                : 'bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-black border border-amber-400/60'
            }`}
          >
            {isBroadcastMode ? '📢 Transmitiendo a Todos' : '📢 Activar Difusión'}
          </button>
        </div>
      )}

      {/* 3. ÁREA DE MENSAJES (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 no-scrollbar">
        {messages.map((m) => {
          // Si es un comunicado oficial masivo
          if (m.isBroadcast) {
            return (
              <div
                key={m.id}
                className="w-full my-2 p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 via-[#181a24] to-zinc-900 border border-amber-400/50 shadow-[0_0_20px_rgba(255,184,0,0.15)] animate-in zoom-in-95 duration-200"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                    <Radio size={13} className="animate-pulse" />
                    <span>Difusión Oficial a la Comunidad</span>
                  </span>
                  <span className="text-[9px] text-zinc-400 font-mono">{m.time}</span>
                </div>
                <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">{m.text}</p>
              </div>
            );
          }

          const isMe = m.sender === 'me';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                  isMe
                    ? 'bg-gradient-to-tr from-[#261e0b] via-[#1a1710] to-[#2b210c] text-white rounded-br-xs border border-[#ffb800]/40 shadow-[0_0_15px_rgba(255,184,0,0.12)]'
                    : 'bg-[#181a24] text-zinc-100 rounded-bl-xs border border-white/5'
                }`}
              >
                {/* Texto del mensaje */}
                {m.text && <p className="leading-snug whitespace-pre-wrap">{m.text}</p>}
              </div>

              {/* Hora y Doble Check de Lectura */}
              <div className="flex items-center gap-1 mt-1 px-1">
                <span className="text-[9px] text-zinc-500 font-medium">{m.time}</span>
                {isMe && (
                  <CheckCheck size={12} className="text-[#ffb800]" title="Leído" />
                )}
              </div>
            </div>
          );
        })}

        {/* Indicador de "Escribiendo..." animado */}
        {isTyping && (
          <div className="flex items-center gap-2 text-zinc-400 text-xs animate-in fade-in duration-200">
            <div className="p-2.5 bg-[#181a24] rounded-2xl rounded-bl-xs border border-white/5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#ffb800] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-[#ffb800] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-[#ffb800] rounded-full animate-bounce" />
            </div>
            <span className="text-[10px] text-zinc-500 font-medium">@{chatPartner.username} está escribiendo...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer Elevado Dinámicamente sobre el Teclado */}
      <div
        style={{
          paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : 'max(8px, env(safe-area-inset-bottom, 8px))',
          transition: 'padding-bottom 0.12s cubic-bezier(0, 0, 0.2, 1)',
        }}
        className="bg-[#12141c] border-t border-white/10 shrink-0"
      >
        {/* 4. REACCIONES RÁPIDAS (EMOJIS) */}
        {!isBroadcastMode && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#10121a] border-b border-white/5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-zinc-500 font-semibold shrink-0">Reacción rápida:</span>
            {quickReactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSendMessage(emoji)}
                className="px-2 py-0.5 bg-white/5 hover:bg-white/10 active:scale-90 rounded-full text-xs transition-transform cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* 5. CAJA DE ENTRADA DE MENSAJES */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={
              isBroadcastMode
                ? '📢 Escribe el comunicado para toda la comunidad...'
                : isSysChat
                ? 'Escribe tu consulta al soporte oficial...'
                : 'Escribe un mensaje al creador...'
            }
            className={`flex-1 bg-[#1a1d28] border text-white placeholder-zinc-500 text-xs rounded-2xl py-2.5 px-3.5 focus:outline-none transition-all ${
              isBroadcastMode
                ? 'border-amber-400/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 placeholder-amber-400/50'
                : 'border-white/10 focus:border-[#ffb800] focus:ring-1 focus:ring-[#ffb800]'
            }`}
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`w-9 h-9 rounded-xl disabled:opacity-30 flex items-center justify-center shrink-0 active:scale-90 transition-transform font-bold cursor-pointer shadow-md ${
              isBroadcastMode
                ? 'bg-gradient-to-r from-amber-400 to-[#FE2C55] text-black shadow-[0_0_15px_rgba(255,184,0,0.5)]'
                : 'bg-gradient-to-r from-[#ffb800] to-[#ffa000] text-black'
            }`}
            title={isBroadcastMode ? 'Transmitir a toda la comunidad' : 'Enviar mensaje'}
          >
            {isBroadcastMode ? <Radio size={16} /> : <Send size={15} />}
          </button>
        </form>
      </div>

    </div>
  );
}
