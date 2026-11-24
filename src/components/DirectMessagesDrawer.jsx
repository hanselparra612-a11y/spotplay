import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Send, Sparkles, CheckCheck, 
  Smile, Heart, Flame
} from 'lucide-react';

export default function DirectMessagesDrawer({ isOpen, onClose, chatPartner }) {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  // Mensajes por defecto de interacción social
  const defaultInitialMessages = [
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

  const [messages, setMessages] = useState(() => {
    if (!storageKey) return defaultInitialMessages;
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return defaultInitialMessages;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return defaultInitialMessages;
      return parsed;
    } catch {
      return defaultInitialMessages;
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

  // Scroll automático hacia el último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen || !chatPartner) return null;

  // Enviar mensaje de texto
  const handleSendMessage = (textToSend = inputText) => {
    const cleanText = textToSend.trim();
    if (!cleanText) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: cleanText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Simulación inteligente de respuesta del Creador
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
                <Sparkles size={11} className="text-[#ffb800]" />
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">
                @{chatPartner.username} • <span className="text-emerald-400 font-semibold">En línea</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ÁREA DE MENSAJES (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 no-scrollbar">
        {messages.map((m) => {
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
                {m.text && <p className="leading-snug">{m.text}</p>}
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
        {/* 3. REACCIONES RÁPIDAS (EMOJIS) */}
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

        {/* 4. CAJA DE ENTRADA DE MENSAJES */}
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
            placeholder="Escribe un mensaje al creador..."
            className="flex-1 bg-[#1a1d28] border border-white/10 text-white placeholder-zinc-500 text-xs rounded-2xl py-2.5 px-3.5 focus:outline-none focus:border-[#ffb800] focus:ring-1 focus:ring-[#ffb800] transition-all"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#ffb800] to-[#ffa000] disabled:opacity-30 text-black flex items-center justify-center shrink-0 active:scale-90 transition-transform font-bold cursor-pointer shadow-md"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

    </div>
  );
}
