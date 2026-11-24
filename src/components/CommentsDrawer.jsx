import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Heart,
  Send,
  Smile,
  Pin,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import { formatNumber, formatCOP } from '../utils/format';

const QUICK_EMOJIS = ['❤️', '🔥', '😂', '😍', '👏', '🙌', '✨', '💯'];

export default function CommentsDrawer({
  isOpen,
  onClose,
  video,
  currentUser,
  onAddComment,
  onToggleCommentLike,
  onOpenCreatorProfile,
}) {
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // { id, username }
  const [expandedReplies, setExpandedReplies] = useState({}); // { [commentId]: boolean }
  const [activeFilter, setActiveFilter] = useState('top'); // 'top' | 'recent'
  const [likedAnimMap, setLikedAnimMap] = useState({}); // { [commentId]: boolean }
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const inputRef = useRef(null);
  const commentsListRef = useRef(null);

  // Detección en tiempo real de apertura del teclado virtual (visualViewport)
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
    }, 150);
  };

  // Auto-focus input when replying
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  if (!isOpen || !video) return null;

  const comments = video.comments || [];
  const videoAuthorUsername = video.author?.username;

  // Sorting
  const sortedComments = [...comments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    if (activeFilter === 'top') {
      return (b.likes || 0) - (a.likes || 0);
    }
    // 'recent'
    return 0; // keeps original newest-first order
  });

  const handleStartReply = (comment) => {
    setReplyingTo({ id: comment.id, username: comment.username });
    setCommentText(`@${comment.username} `);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleQuickEmoji = (emoji) => {
    setCommentText((prev) => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleLikeWithAnimation = (commentId, parentId = null) => {
    setLikedAnimMap((prev) => ({ ...prev, [commentId]: true }));
    setTimeout(() => {
      setLikedAnimMap((prev) => ({ ...prev, [commentId]: false }));
    }, 400);

    onToggleCommentLike(video.id, commentId, parentId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onAddComment(video.id, commentText.trim(), replyingTo ? replyingTo.id : null);

    // Si respondió a un comentario, expandir automáticamente ese hilo
    if (replyingTo) {
      setExpandedReplies((prev) => ({
        ...prev,
        [replyingTo.id]: true,
      }));
    }

    setCommentText('');
    setReplyingTo(null);

    // Scroll al tope del listado si es nuevo comentario raíz
    if (!replyingTo && commentsListRef.current) {
      commentsListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Helper to highlight @mentions in comment text
  const renderCommentText = (text) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={i}
            className="text-cyan-400 font-semibold hover:underline cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenCreatorProfile) {
                onOpenCreatorProfile({ username: part.replace('@', '') });
              }
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const totalCommentsCount = comments.reduce(
    (acc, curr) => acc + 1 + (curr.replies?.length || 0),
    0
  );

  return (
    <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex flex-col justify-end transition-opacity duration-300">
      {/* Backdrop clickable area para cerrar deslizando/tocando */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="bg-[#14161b] rounded-t-3xl max-h-[82%] sm:max-h-[76%] flex flex-col shadow-2xl border-t border-white/10 animate-in slide-in-from-bottom duration-250 overflow-hidden">
        {/* Drag handle pill estilo iOS / TikTok */}
        <div
          onClick={onClose}
          className="w-full pt-2.5 pb-1 flex justify-center cursor-pointer active:opacity-70 group"
          title="Deslizar para cerrar"
        >
          <div className="w-10 h-1 bg-white/20 group-hover:bg-white/40 rounded-full transition-all" />
        </div>

        {/* Header con conteo y filtros */}
        <div className="flex items-center justify-between px-4 pb-2.5 border-b border-white/5">
          {/* Filtros Relevantes / Recientes */}
          <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-full text-[11px]">
            <button
              onClick={() => setActiveFilter('top')}
              className={`px-2.5 py-0.5 rounded-full font-medium transition-all ${
                activeFilter === 'top'
                  ? 'bg-amber-400 text-black font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Top
            </button>
            <button
              onClick={() => setActiveFilter('recent')}
              className={`px-2.5 py-0.5 rounded-full font-medium transition-all ${
                activeFilter === 'recent'
                  ? 'bg-amber-400 text-black font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Nuevos
            </button>
          </div>

          <h3 className="text-xs font-bold text-white tracking-wide">
            {formatNumber(totalCommentsCount)} comentarios
          </h3>

          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white rounded-full transition-colors active:scale-90"
            title="Cerrar comentarios"
          >
            <X size={16} />
          </button>
        </div>


        {/* Comments List */}
        <div
          ref={commentsListRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar divide-y divide-white/5"
        >
          {sortedComments.length > 0 ? (
            sortedComments.map((comment) => {
              const isAuthor =
                comment.isAuthor ||
                comment.username === videoAuthorUsername;
              const hasReplies = comment.replies && comment.replies.length > 0;
              const isExpanded = Boolean(expandedReplies[comment.id]);
              const isLikedAnimating = Boolean(likedAnimMap[comment.id]);

              return (
                <div key={comment.id} className="pt-3 first:pt-0">
                  {/* Comentario Principal */}
                  <div className="flex items-start gap-3">
                    {/* Avatar con enlace al perfil */}
                    <button
                      onClick={() =>
                        onOpenCreatorProfile &&
                        onOpenCreatorProfile({ username: comment.username })
                      }
                      className="relative shrink-0 active:scale-95 transition-transform"
                    >
                      <img
                        src={comment.avatar}
                        alt={comment.username}
                        className={`w-9 h-9 rounded-full object-cover border ${
                          isAuthor ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-white/10'
                        }`}
                      />
                      {isAuthor && (
                        <div className="absolute -bottom-1 -right-1 bg-amber-400 text-black rounded-full p-0.5 shadow">
                          <Sparkles size={8} />
                        </div>
                      )}
                    </button>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      {/* Cabecera con insignias */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          onClick={() =>
                            onOpenCreatorProfile &&
                            onOpenCreatorProfile({ username: comment.username })
                          }
                          className="text-xs font-bold text-white hover:underline cursor-pointer"
                        >
                          @{comment.username}
                        </span>

                        {/* Badge de Creador */}
                        {isAuthor && (
                          <span className="px-1.5 py-0.2 bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-black rounded tracking-wide">
                            CREADOR
                          </span>
                        )}

                        {/* Badge de Comprador Verificado */}
                        {comment.isVerifiedBuyer && (
                          <span className="px-1.5 py-0.2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-semibold rounded flex items-center gap-0.5">
                            <CheckCircle2 size={9} /> Compra verificada
                          </span>
                        )}

                        {/* Badge de Fijado por el Creador */}
                        {comment.isPinned && (
                          <span className="px-1.5 py-0.2 bg-white/10 text-zinc-300 text-[9px] font-semibold rounded flex items-center gap-0.5">
                            <Pin size={9} className="rotate-45 text-amber-400" /> Fijado
                          </span>
                        )}
                      </div>

                      {/* Texto del comentario */}
                      <p className="text-zinc-100 text-xs mt-1 break-words leading-relaxed">
                        {renderCommentText(comment.text)}
                      </p>

                      {/* Acciones y Metadatos */}
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-400">
                        <span>{comment.timestamp}</span>

                        <button
                          onClick={() => handleStartReply(comment)}
                          className="hover:text-amber-400 font-bold transition-colors active:scale-95"
                        >
                          Responder
                        </button>

                        {/* Insignia: Le gustó al creador */}
                        {comment.likedByAuthor && (
                          <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1 bg-rose-500/10 px-1.5 py-0.5 rounded-full">
                            <Heart size={9} className="fill-rose-500 text-rose-500" /> Le gustó al autor
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botón de Like con animación reactiva */}
                    <button
                      onClick={() => handleLikeWithAnimation(comment.id)}
                      className="flex flex-col items-center gap-0.5 text-zinc-400 hover:text-rose-500 pt-1 transition-all active:scale-75"
                    >
                      <Heart
                        size={15}
                        className={`transition-all duration-200 ${
                          comment.isLiked
                            ? 'fill-rose-500 text-rose-500 scale-110 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                            : 'text-zinc-400'
                        } ${isLikedAnimating ? 'scale-125' : ''}`}
                      />
                      <span className="text-[10px] font-semibold">
                        {comment.likes || 0}
                      </span>
                    </button>
                  </div>

                  {/* 🧵 Hilos y Respuestas Anidadas */}
                  {hasReplies && (
                    <div className="ml-11 mt-2">
                      <button
                        onClick={() => toggleReplies(comment.id)}
                        className="text-[11px] font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 py-1 transition-colors"
                      >
                        <div className="w-5 h-px bg-white/20" />
                        <span>
                          {isExpanded
                            ? 'Ocultar respuestas'
                            : `Ver ${comment.replies.length} ${
                                comment.replies.length === 1 ? 'respuesta' : 'respuestas'
                              }`}
                        </span>
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {/* Lista de Respuestas Desplegadas */}
                      {isExpanded && (
                        <div className="space-y-3 mt-2 pl-3 border-l-2 border-white/10">
                          {comment.replies.map((reply) => {
                            const isReplyAuthor =
                              reply.isAuthor ||
                              reply.username === videoAuthorUsername;
                            const isReplyLikedAnimating = Boolean(likedAnimMap[reply.id]);

                            return (
                              <div key={reply.id} className="flex items-start gap-2.5">
                                <img
                                  src={reply.avatar}
                                  alt={reply.username}
                                  className={`w-7 h-7 rounded-full object-cover shrink-0 border ${
                                    isReplyAuthor
                                      ? 'border-amber-400'
                                      : 'border-white/10'
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white">
                                      @{reply.username}
                                    </span>
                                    {isReplyAuthor && (
                                      <span className="px-1 py-0.2 bg-amber-500/20 text-amber-300 text-[8px] font-black rounded">
                                        CREADOR
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-zinc-200 text-xs mt-0.5 break-words">
                                    {renderCommentText(reply.text)}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-400">
                                    <span>{reply.timestamp}</span>
                                    <button
                                      onClick={() => handleStartReply(comment)}
                                      className="hover:text-amber-400 font-semibold"
                                    >
                                      Responder
                                    </button>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleLikeWithAnimation(reply.id, comment.id)}
                                  className="flex flex-col items-center gap-0.5 text-zinc-400 hover:text-rose-500 pt-0.5 active:scale-75"
                                >
                                  <Heart
                                    size={13}
                                    className={`transition-all ${
                                      reply.isLiked
                                        ? 'fill-rose-500 text-rose-500'
                                        : 'text-zinc-400'
                                    } ${isReplyLikedAnimating ? 'scale-125' : ''}`}
                                  />
                                  <span className="text-[9px]">
                                    {reply.likes || 0}
                                  </span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 flex flex-col items-center justify-center text-zinc-400">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 mb-2">
                <MessageCircle size={22} />
              </div>
              <p className="text-white text-xs font-bold mb-1">Aún no hay comentarios</p>
              <p className="text-zinc-400 text-[11px]">
                ¡Sé el primero en iniciar la conversación! 💬
              </p>
            </div>
          )}
        </div>

        {/* Footer Interactivo de Comentarios (Elevado dinámicamente sobre el Teclado) */}
        <div
          style={{
            paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : 'max(8px, env(safe-area-inset-bottom, 8px))',
            transition: 'padding-bottom 0.12s cubic-bezier(0, 0, 0.2, 1)',
          }}
          className="bg-[#0e1014] border-t border-white/5 shrink-0"
        >
          {/* 🌟 BANDEJA DE EMOJIS RÁPIDOS DE 1-TOQUE */}
          <div className="px-3 pt-2 pb-1 bg-[#101115] border-b border-white/5 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleQuickEmoji(emoji)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-base active:scale-80 transition-transform shrink-0 cursor-pointer"
                title={`Añadir ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Banner de Modo "Respondiendo a..." */}
          {replyingTo && (
            <div className="px-3 py-1.5 bg-amber-400/10 border-b border-amber-400/20 flex items-center justify-between text-xs text-amber-300 font-medium">
              <span className="truncate">
                Respondiendo a <strong className="text-amber-400">@{replyingTo.username}</strong>
              </span>
              <button
                onClick={handleCancelReply}
                className="p-1 hover:text-white transition-colors cursor-pointer"
                title="Cancelar respuesta"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Comment Input Footer */}
          <form
            onSubmit={handleSubmit}
            className="px-3 py-2.5 flex items-center gap-2.5"
          >
            {/* Avatar dinámico del usuario logueado */}
            <img
              src={
                currentUser?.avatar ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
              }
              alt={currentUser?.name || 'Tu avatar'}
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/15"
            />

            <div className="flex-1 relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onFocus={handleInputFocus}
                placeholder={
                  replyingTo
                    ? `Responde a @${replyingTo.username}...`
                    : 'Añadir un comentario amable...'
                }
                className="w-full bg-[#1e2027] text-white placeholder-zinc-500 text-xs rounded-full py-2.5 pl-3.5 pr-9 focus:outline-none focus:ring-1 focus:ring-amber-400 border border-white/10 transition-all"
              />
              <button
                type="button"
                onClick={() => handleQuickEmoji('🔥')}
                className="absolute right-2.5 text-zinc-400 hover:text-amber-400 active:scale-90 transition-colors cursor-pointer"
                title="Emoji fuego"
              >
                <Smile size={16} />
              </button>
            </div>

            {/* Botón de Enviar */}
            <button
              type="submit"
              disabled={!commentText.trim()}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-85 shrink-0 ${
                commentText.trim()
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
              title="Publicar comentario"
            >
              <Send size={15} className={commentText.trim() ? 'translate-x-px' : ''} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
