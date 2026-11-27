import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Music,
  Plus,
  Check,
  Volume2,
  VolumeX,
  Gift,
  ArrowRight,
  Sparkles,
  Flame,
  Edit3,
  MoreVertical,
  Flag,
  ShoppingBag,
  Send,
  X,
} from 'lucide-react';
import { formatNumber, formatTime, formatCOP, normalizeWhatsAppNumber, normalizeTelegramUser, getTelegramLink, buildProductOrderMessage } from '../utils/format';
import { resolveMediaUrl } from '../utils/apiUrl';
import { getVideoBlobFromIndexedDB } from '../utils/videoDB';
import ReactionsTray from './ReactionsTray';

function VideoCard({
  video,
  isActive,
  preloadMode = 'auto',
  shouldMountMedia = true,
  isMuted,
  onToggleMute,
  onToggleLike,
  onToggleBookmark,
  onToggleFollow,
  onOpenComments,
  onOpenShare,
  onOpenAudioDetail,
  onOpenCreatorProfile,
  onOpenGifts,
  onOpenPromote,
  onOpenDirectChat,
  currentUserId,
  currentUser,
  onEditVideo,
  onOpenMyProfile,
  onOpenReport,
}) {
  const authorObj = video.author || {};
  const isOwnVideo = Boolean(
    authorObj.id === 'me' ||
    authorObj.id === currentUserId ||
    (currentUser && (authorObj.id === currentUser.id || authorObj.username === currentUser.username))
  );
  const rawAvatar = (isOwnVideo && currentUser?.avatar)
    ? currentUser.avatar
    : (authorObj.avatar || currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80');
  const authorAvatar = resolveMediaUrl(rawAvatar);
  const authorUsername = authorObj.username || (isOwnVideo ? (currentUser?.username || 'tú') : 'creador');
  const musicObj = video.music || { title: 'Sonido Original - Spot Play', author: 'Spot Play' };
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [progress, setProgress] = useState(0);
  const [showReactions, setShowReactions] = useState(false);
  const [activeReactionEmoji, setActiveReactionEmoji] = useState(null);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isFrameReady, setIsFrameReady] = useState(false);
  const rawPoster = video.cover || video.thumbnail || (video.id ? `/uploads/thumbnails/${video.id}.jpg` : '');
  const posterUrl = resolveMediaUrl(rawPoster);

  // 🚀 Estados para Aceleración y Scrubbing de Video en la Barra Horizontal
  const [videoSrc, setVideoSrc] = useState(() => resolveMediaUrl(video.videoUrl));
  const [hasPlaybackError, setHasPlaybackError] = useState(false);
  const [showMultiChatModal, setShowMultiChatModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const initialSrc = resolveMediaUrl(video.videoUrl);
    setVideoSrc(initialSrc || '');
    setHasPlaybackError(false);

    // Si la URL inicial está vacía o es un video local de IndexedDB, cargar el blob directamente
    const needsBlob = !initialSrc || initialSrc.startsWith('blob:') || (video.id && (video.id.startsWith('uploaded-') || video.isUserUploaded));
    if (needsBlob) {
      getVideoBlobFromIndexedDB(video.id)
        .then((blob) => {
          if (isMounted && blob) {
            const freshBlobUrl = URL.createObjectURL(blob);
            setVideoSrc(freshBlobUrl);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [video.id, video.videoUrl]);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const progressBarRef = useRef(null);
  const wasPlayingBeforeScrubRef = useRef(false);

  const isPlayPendingRef = useRef(false);
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef(null);
  const likeHoldTimerRef = useRef(null);
  const idleTimerRef = useRef(null);

  // 🎬 Reset Auto-Fade Timer (Modo Cine)
  const resetIdleTimer = () => {
    setIsCinemaMode(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (isPlaying && !showReactions) {
      idleTimerRef.current = setTimeout(() => {
        setIsCinemaMode(true);
      }, 2200);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      resetIdleTimer();
    } else {
      setIsCinemaMode(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    }
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isPlaying, showReactions]);

  // Play / Pause continuo y ultra fluido basado ÚNICAMENTE en isActive (Sin pausas al cambiar volumen ni re-renders)
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    let isSubscribed = true;

    if (isActive) {
      if (vid.currentTime > 0.3 && vid.ended) {
        vid.currentTime = 0;
      }
      vid.muted = !isActive || isMuted;
      vid.volume = 1.0;
      vid.playbackRate = 1.0;
      vid.defaultPlaybackRate = 1.0;
      isPlayPendingRef.current = true;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isPlayPendingRef.current = false;
            if (!isSubscribed) {
              vid.pause();
              vid.muted = true;
              setIsPlaying(false);
              setIsFrameReady(false);
            } else {
              setIsPlaying(true);
            }
          })
          .catch((err) => {
            isPlayPendingRef.current = false;
            // Si el navegador bloqueó el autoplay por falta de interacción, intentar silenciado
            if (vid && isSubscribed && err && err.name === 'NotAllowedError') {
              vid.muted = true;
              vid.play()
                .then(() => {
                  if (isSubscribed) setIsPlaying(true);
                })
                .catch(() => {});
            }
            // En caso de AbortError (interrupción por scroll rápido), no ejecutar bucles
          });
      }
    } else {
      // 🔇 SILENCIO Y PAUSA TOTAL AL SALIR DE LA PANTALLA ACTIVA
      setIsFrameReady(false);
      if (isPlayPendingRef.current) {
        vid.muted = true;
        setTimeout(() => {
          if (videoRef.current && !isActive) {
            videoRef.current.pause();
            videoRef.current.muted = true;
            setIsPlaying(false);
            setIsFrameReady(false);
          }
        }, 60);
      } else {
        vid.pause();
        vid.muted = true;
        setIsPlaying(false);
        setIsFrameReady(false);
      }
    }

    return () => {
      isSubscribed = false;
    };
  }, [isActive]);

  // Sincronizar volumen/silenciado de manera continua sin interrumpir jamás la reproducción
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) {
      vid.muted = !isActive || isMuted;
      if (isActive && !isMuted) {
        vid.volume = 1.0;
      }
    }
  }, [isMuted, isActive]);

  // Track playback progress
  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (vid && vid.duration && !isScrubbing) {
      setProgress((vid.currentTime / vid.duration) * 100);
      setScrubTime(vid.currentTime);
      if (!videoDuration || videoDuration !== vid.duration) {
        setVideoDuration(vid.duration);
      }
    }
  };

  // 🚀 Cálculo y aplicación inmediata de salto/adelanto en el video (Scrubbing / Fast-Forward)
  const applySeek = (clientX) => {
    if (!progressBarRef.current || !videoRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    if (!rect.width) return;
    const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (clickX / rect.width) * 100;
    const dur = videoRef.current.duration || videoDuration || 0;
    if (dur > 0 && isFinite(dur)) {
      const targetTime = (clickX / rect.width) * dur;
      videoRef.current.currentTime = targetTime;
      setProgress(percentage);
      setScrubTime(targetTime);
    }
  };

  const handleScrubPointerDown = (e) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    wasPlayingBeforeScrubRef.current = videoRef.current ? !videoRef.current.paused : false;
    setIsScrubbing(true);
    resetIdleTimer();
    applySeek(e.clientX);
  };

  const handleScrubPointerMove = (e) => {
    e.stopPropagation();
    if (!isScrubbing) return;
    resetIdleTimer();
    applySeek(e.clientX);
  };

  const handleScrubPointerUp = (e) => {
    e.stopPropagation();
    try {
      if (e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (_) {}

    setIsScrubbing(false);
    resetIdleTimer();

    // Reanudar reproducción fluida tras soltar si estaba reproduciéndose
    if (videoRef.current && (wasPlayingBeforeScrubRef.current || isActive)) {
      videoRef.current.playbackRate = 1.0;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Handle tap / double tap refinado profesional (estilo TikTok nativo)
  const handleVideoClick = (e) => {
    resetIdleTimer();

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 280;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // 💖 Doble tap detectado: cancelar inmediatamente el timer de single-tap para no pausar el video
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const heartId = 'heart-' + Date.now();
      setFloatingHearts((prev) => [...prev, { id: heartId, x, y }]);
      setTimeout(() => {
        setFloatingHearts((prev) => prev.filter((h) => h.id !== heartId));
      }, 900);

      if (!video.isLiked) {
        onToggleLike(video.id);
      }
      lastTapRef.current = 0; // Reset para evitar que un 3er tap dispare otro toggle
    } else {
      lastTapRef.current = now;
      // Single tap demorado 240ms: si no llega un segundo tap, ejecuta play/pause
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = setTimeout(() => {
        singleTapTimerRef.current = null;
        if (!isActive) return;
        const vid = videoRef.current;
        if (vid) {
          if (vid.paused) {
            vid.muted = isMuted;
            vid.play().then(() => setIsPlaying(true)).catch(() => {});
          } else {
            vid.pause();
            setIsPlaying(false);
          }
        }
      }, 240);
    }
  };

  return (
    <div
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none"
      onPointerMove={resetIdleTimer}
      onTouchStart={resetIdleTimer}
    >
      {/* 🎬 Poster Suave Absoluto en Alta Resolución (Elimina el salto de pantalla negra entre videos) */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt="Vista previa video"
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-[2] transition-opacity duration-300 ${
            isPlaying && isFrameReady && !isBuffering && !hasPlaybackError ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          loading="eager"
        />
      )}

      {/* Video Element con loop nativo en GPU y Preload Inteligente */}
      <video
        ref={videoRef}
        src={shouldMountMedia && videoSrc ? videoSrc : undefined}
        poster={posterUrl || undefined}
        className="w-full h-full object-cover cursor-pointer z-[1]"
        style={{ transform: 'translateZ(0)', willChange: 'transform' }}
        autoPlay={isActive}
        playsInline
        webkit-playsinline="true"
        loop
        preload={preloadMode}
        muted={!isActive || isMuted}
        controls={false}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsFrameReady(true);
          setHasPlaybackError(false);
          if (videoRef.current) {
            videoRef.current.playbackRate = 1.0;
          }
        }}
        onCanPlay={() => {
          setIsBuffering(false);
          if (videoRef.current) {
            videoRef.current.playbackRate = 1.0;
          }
        }}
        onLoadedData={() => {
          setIsBuffering(false);
          if (isActive) setIsFrameReady(true);
          if (videoRef.current) {
            videoRef.current.playbackRate = 1.0;
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => {
          setIsBuffering(false);
          if (e.target.duration) {
            setVideoDuration(e.target.duration);
          }
        }}
        onClick={handleVideoClick}
        onError={(err) => {
          setIsBuffering(false);
          console.warn('Playback error on video:', video.id, err);
          // Intentar recuperación binaria inmediata desde IndexedDB
          getVideoBlobFromIndexedDB(video.id)
            .then((blob) => {
              if (blob) {
                const freshBlobUrl = URL.createObjectURL(blob);
                setVideoSrc(freshBlobUrl);
              } else {
                setHasPlaybackError(true);
              }
            })
            .catch(() => {
              setHasPlaybackError(true);
            });
        }}
        onEnded={() => {
          const vid = videoRef.current;
          if (vid && isActive) {
            vid.currentTime = 0;
            vid.play().catch(() => {});
          }
        }}
      />

      {/* ⚠️ Alerta suave si un video no tiene archivo reproducible */}
      {hasPlaybackError && isActive && (
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-[3] pointer-events-none">
          <p className="text-white text-xs font-bold mb-1">Video en sincronización</p>
          <p className="text-zinc-400 text-[10px] max-w-xs mb-3">
            El archivo de este video se está sincronizando. Desliza hacia abajo para continuar con el feed.
          </p>
          <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-full text-zinc-300 font-semibold border border-white/10">
            ↓ Desliza para el siguiente
          </span>
        </div>
      )}

      {/* Indicador de Carga / Buffer TikTok Style */}
      {isBuffering && isActive && !hasPlaybackError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 transition-opacity">
          <div className="w-12 h-12 rounded-full border-3 border-amber-400/30 border-t-amber-400 animate-spin" />
        </div>
      )}

      {/* Floating Hearts & Reactions from Double-tap or Reaction pick */}
      {floatingHearts.map((heart) => (
        <div
          key={heart.id}
          style={{ left: heart.x - 30, top: heart.y - 30 }}
          className="absolute pointer-events-none z-30 animate-float-heart"
        >
          {heart.emoji ? (
            <span className="text-5xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.7)]">{heart.emoji}</span>
          ) : (
            <Heart size={64} className="fill-[#FE2C55] text-[#FE2C55] drop-shadow-xl" />
          )}
        </div>
      ))}

      {/* Controles Superiores Derechos: Audio + 3 Puntos Denunciar/Opciones (100% Google Play & AdMob) */}
      <div className="absolute top-[max(86px,calc(env(safe-area-inset-top,14px)+68px))] right-4 z-20 flex items-center gap-2">
        {/* Audio Mute/Unmute */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className={`w-7 h-7 rounded-full backdrop-blur-xl flex items-center justify-center transition-all active:scale-90 shadow-[0_4px_16px_rgba(0,0,0,0.6)] ${
            isMuted
              ? 'bg-black/55 border border-white/20 text-white/80 hover:text-white hover:border-white/40'
              : 'bg-black/75 border border-[#ffb800]/70 text-[#ffb800] shadow-[0_0_15px_rgba(255,184,0,0.4)]'
          }`}
          title={isMuted ? 'Activar sonido' : 'Silenciar'}
        >
          {isMuted ? (
            <VolumeX size={13} className="text-white/70" />
          ) : (
            <Volume2 size={13} className="text-[#ffb800] drop-shadow-[0_0_8px_rgba(255,184,0,0.8)] animate-pulse" />
          )}
        </button>

        {/* Botón 3 Puntos: Denunciar / Reportar Video (Visible a primera vista para Google Play) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenReport) {
              onOpenReport(video);
            } else if (onOpenShare) {
              onOpenShare(video);
            }
          }}
          className="w-7 h-7 rounded-full backdrop-blur-xl flex items-center justify-center bg-black/55 hover:bg-black/75 border border-white/20 hover:border-white/40 text-white/80 hover:text-white transition-all active:scale-90 shadow-[0_4px_16px_rgba(0,0,0,0.6)] cursor-pointer"
          title="Denunciar publicación a moderación"
        >
          <MoreVertical size={14} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Bottom Gradient Overlay (Sutil y transparente para máxima claridad) */}
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none z-10" />

      {/* Bottom Video Info (Con ancho completo y libre de solapamientos) */}
      <div className="video-bottom-info absolute bottom-[calc(max(106px,calc(env(safe-area-inset-bottom,12px)+92px)))] left-3.5 right-4 z-20 pointer-events-none text-left will-change-[opacity,transform] origin-bottom-left">
        {/* Creator Handle + Promoted Tag */}
        <div className="flex items-center gap-1.5 mb-1.5 pointer-events-auto">
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (isOwnVideo) {
                if (onOpenMyProfile) onOpenMyProfile();
              } else {
                onOpenCreatorProfile(authorObj);
              }
            }}
            className="font-bold text-white text-sm drop-shadow-md cursor-pointer hover:underline"
          >
            @{authorUsername}
          </span>
          {authorObj.isVerified && (
            <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 text-black flex items-center justify-center text-[9px] font-black">
              ✓
            </span>
          )}
        </div>

        {/* 🔥 BADGE DE VIDEO PROMOCIONADO / ANUNCIO IN-FEED */}
        {video.isPromoted && (
          <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/60 text-amber-300 text-[10px] font-black backdrop-blur-sm shadow-md pointer-events-auto">
            <Flame size={11} className="fill-amber-400 text-amber-400 animate-pulse" />
            <span>Patrocinado · {video.promotedCta || 'Destacado 🚀'}</span>
          </div>
        )}

        {/* 🛍️ CÁPSULA COMERCIAL DE PRODUCTO (VIDEO COMMERCE ESTILO TIKTOK SHOP) */}
        {video.product && (() => {
          const rawWa = video.product.whatsapp || authorObj?.whatsapp || (isOwnVideo && currentUser?.whatsapp) || '573128525929';
          const cleanWa = normalizeWhatsAppNumber(rawWa);
          const rawTg = video.product.telegram || authorObj?.telegram || (isOwnVideo && currentUser?.telegram) || '';
          const cleanTg = normalizeTelegramUser(rawTg);
          const primaryChat = video.product.primaryChat || authorObj?.primaryChat || (isOwnVideo && currentUser?.primaryChat) || (cleanTg && !video.product.whatsapp ? 'telegram' : 'whatsapp');

          const orderMsg = buildProductOrderMessage(video.product, video);
          const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(orderMsg)}`;
          const tgUrl = cleanTg ? getTelegramLink(cleanTg, orderMsg) : null;

          const handleProductClick = (e) => {
            e.stopPropagation();
            if (primaryChat === 'both' && tgUrl && waUrl) {
              setShowMultiChatModal(true);
            } else if (primaryChat === 'telegram' && tgUrl) {
              window.open(tgUrl, '_blank', 'noopener,noreferrer');
            } else {
              window.open(waUrl, '_blank', 'noopener,noreferrer');
            }
          };

          return (
            <div className="mb-2 pointer-events-auto">
              <button
                type="button"
                onClick={handleProductClick}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#ffb800] via-[#ffa000] to-[#ff8800] text-black font-extrabold text-xs shadow-[0_4px_16px_rgba(255,184,0,0.55)] border border-amber-200 backdrop-blur-md active:scale-95 hover:brightness-110 transition-all cursor-pointer group"
              >
                <div className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center shrink-0">
                  <ShoppingBag size={12} className="stroke-[2.6] text-black" />
                </div>
                <span className="truncate max-w-[130px] font-black">{video.product.name}</span>
                {Boolean(video.product.price) && (
                  <span className="bg-black/85 text-[#ffb800] px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                    {formatCOP(video.product.price)}
                  </span>
                )}
                {primaryChat === 'telegram' && cleanTg ? (
                  <span className="text-[10px] bg-sky-900/90 text-sky-200 px-1.5 py-0.5 rounded-full font-bold border border-sky-400/40 flex items-center gap-0.5 shadow-sm">
                    <Send size={10} className="stroke-[2.5]" />
                    <span>Pedir ✈️</span>
                  </span>
                ) : primaryChat === 'both' && cleanTg ? (
                  <span className="text-[10px] bg-purple-900/90 text-purple-200 px-1.5 py-0.5 rounded-full font-bold border border-purple-400/40 flex items-center gap-0.5 shadow-sm">
                    Pedir ✨
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-900/90 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold border border-emerald-400/40 flex items-center gap-0.5 shadow-sm">
                    Pedir 💬
                  </span>
                )}
              </button>
            </div>
          );
        })()}

        {/* Caption */}
        <p className="text-xs text-white/95 line-clamp-2 leading-relaxed drop-shadow mb-1.5 select-text pointer-events-auto">
          {video.description}
        </p>

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2 pointer-events-auto">
            {video.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] font-semibold text-white/90 hover:text-cyan-300 cursor-pointer drop-shadow"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Music Sound Ticker */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onOpenAudioDetail(musicObj);
          }}
          className="flex items-center gap-1.5 text-white/85 text-xs pointer-events-auto cursor-pointer hover:text-white group"
        >
          <Music size={12} className="shrink-0 animate-pulse text-[#FE2C55]" />
          <div className="overflow-hidden whitespace-nowrap w-44">
            <span className="inline-block text-[11px] drop-shadow group-hover:underline">
              {musicObj.title}
            </span>
          </div>
        </div>
      </div>

      {/* 🚀 BOTONES DE ACCIÓN FLOTANTES DIRECTOS (Subidos al lado izquierdo superior, alineados con el botón de apagar sonido) */}
      <div className="video-side-actions absolute top-[max(86px,calc(env(safe-area-inset-top,14px)+68px))] left-3 z-20 flex flex-col items-center gap-3 select-none pointer-events-auto will-change-[opacity,transform] origin-top-left">
        {/* Author Avatar */}
        <div className="relative">
          <img
            onClick={(e) => {
              e.stopPropagation();
              if (isOwnVideo) {
                if (onOpenMyProfile) onOpenMyProfile();
              } else {
                onOpenCreatorProfile(authorObj);
              }
            }}
            src={authorAvatar}
            alt={authorUsername}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
            }}
            className={`w-10 h-10 rounded-full border-2 object-cover shadow-lg cursor-pointer hover:scale-105 transition-transform ${
              isOwnVideo ? 'border-[#ffb800]' : 'border-[#ffb800]/80 shadow-[0_0_8px_rgba(255,184,0,0.35)]'
            }`}
          />
          {!isOwnVideo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFollow(authorObj.id || 'creator', authorUsername);
              }}
              className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 shadow-md active:scale-75 ${
                authorObj.isFollowing
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-black border border-black/40 scale-95'
                  : 'bg-gradient-to-tr from-[#ffb800] to-[#ff8800] text-black font-black hover:scale-110 shadow-[0_0_8px_rgba(255,184,0,0.6)]'
              }`}
              title={authorObj.isFollowing ? 'Siguiendo (Toca para dejar de seguir)' : 'Seguir creador'}
            >
              {authorObj.isFollowing ? (
                <Check size={11} strokeWidth={3} className="text-black" />
              ) : (
                <Plus size={12} strokeWidth={3} className="text-black" />
              )}
            </button>
          )}
        </div>

        {/* Like Button with Hold-to-React */}
        <div className="relative flex flex-col items-center">
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              likeHoldTimerRef.current = setTimeout(() => {
                setShowReactions(true);
              }, 300);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              if (likeHoldTimerRef.current) {
                clearTimeout(likeHoldTimerRef.current);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!showReactions) {
                onToggleLike(video.id);
              }
            }}
            className="w-8 h-8 flex items-center justify-center transition-transform active:scale-75 text-white hover:text-white/80"
          >
            {activeReactionEmoji ? (
              <span className="text-2xl animate-bounce">{activeReactionEmoji}</span>
            ) : (
              <Heart
                size={24}
                className={`transition-colors drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] stroke-[2.2] ${
                  video.isLiked
                    ? 'fill-[#FE2C55] text-[#FE2C55] scale-110 animate-bounce drop-shadow-[0_0_12px_rgba(254,44,85,0.7)]'
                    : 'text-white hover:text-white/80'
                }`}
              />
            )}
          </button>
          <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {formatNumber(video.stats?.likes || 0)}
          </span>

          {/* Reactions Tray Drawer */}
          <ReactionsTray
            isOpen={showReactions}
            onClose={() => setShowReactions(false)}
            onSelectReaction={(r) => {
              setActiveReactionEmoji(r.emoji);
              setShowReactions(false);
              if (!video.isLiked) {
                onToggleLike(video.id);
              }
              // Spawn floating reaction
              const reactionId = 'react-' + Date.now();
              setFloatingHearts((prev) => [
                ...prev,
                { id: reactionId, x: window.innerWidth * 0.16, y: window.innerHeight * 0.32, emoji: r.emoji },
              ]);
              setTimeout(() => {
                setFloatingHearts((prev) => prev.filter((h) => h.id !== reactionId));
              }, 1200);
            }}
          />
        </div>

        {/* Comment Button (Muestra la cantidad EXACTA Y REAL de comentarios y respuestas) */}
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments(video);
            }}
            className="w-8 h-8 flex items-center justify-center text-white hover:text-white/80 transition-transform active:scale-75"
            title="Ver comentarios reales"
          >
            <MessageCircle size={23} className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] stroke-[2.3]" />
          </button>
          <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {formatNumber(
              Array.isArray(video.comments)
                ? video.comments.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0)
                : (video.stats?.comments || 0)
            )}
          </span>
        </div>

        {/* 🎁 VIRTUAL GIFTS BUTTON (Activo Rojo/Rosa al Enviar Regalo) */}
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenGifts(authorObj);
            }}
            className="w-8 h-8 flex items-center justify-center transition-transform active:scale-75 relative text-white hover:text-white/80"
          >
            <Gift
              size={23}
              className={`drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-all duration-300 stroke-[2.2] ${
                video.hasUserGifted
                  ? 'text-[#FE2C55] fill-[#FE2C55] scale-110 drop-shadow-[0_0_12px_rgba(254,44,85,0.85)]'
                  : 'text-white hover:text-white/80'
              }`}
            />
          </button>
          <span className={`text-[10px] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] ${video.hasUserGifted ? 'text-[#FE2C55]' : 'text-white'}`}>
            {formatNumber(video.stats?.giftsCount || 0)}
          </span>
        </div>

        {/* Bookmark Button (Banderita / Guardar en Favoritos - Modo Real) */}
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(video.id);
            }}
            className="w-8 h-8 flex items-center justify-center transition-transform active:scale-75 relative text-white hover:text-white/80"
            title="Guardar en favoritos"
          >
            <Bookmark
              size={23}
              className={`transition-all duration-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] stroke-[2.2] ${
                video.isBookmarked
                  ? 'fill-[#ffb800] text-[#ffb800] scale-110 drop-shadow-[0_0_10px_rgba(255,184,0,0.75)]'
                  : 'text-white hover:text-white/80'
              }`}
            />
          </button>
          <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {formatNumber(video.stats?.bookmarks || 0)}
          </span>
        </div>

        {/* Share Button (Compartir - Modo Real) */}
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenShare(video);
            }}
            className="w-8 h-8 flex items-center justify-center text-white hover:text-white/80 transition-transform active:scale-75"
            title="Compartir"
          >
            <Share2 size={22} className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] stroke-[2.3]" />
          </button>
          <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {formatNumber(video.stats?.shares || 0)}
          </span>
        </div>

        {/* 🔥 Botón Promocionar / Impulsar Video con SpotCoins (Visible en videos propios) */}
        {isOwnVideo && onOpenPromote && (
          <div className="flex flex-col items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenPromote(video);
              }}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-[#ffb800] flex items-center justify-center transition-transform active:scale-75 shadow-[0_0_12px_rgba(255,184,0,0.8)] border border-white/30 text-black hover:brightness-110"
              title="Impulsar visibilidad de este video con SpotCoins"
            >
              <Flame size={18} className="fill-black stroke-black" />
            </button>
            <span className="text-[9px] font-black text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {video.isPromoted ? 'Pautado' : 'Impulsar'}
            </span>
          </div>
        )}
      </div>

      {/* 🚀 BARRA DE PROGRESO HORIZONTAL INTERACTIVA (ADELANTAR / RETROCEDER / SCRUBBING CON GESTO Y TOQUE) */}
      <div
        ref={progressBarRef}
        onPointerDown={handleScrubPointerDown}
        onPointerMove={handleScrubPointerMove}
        onPointerUp={handleScrubPointerUp}
        onPointerCancel={handleScrubPointerUp}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="absolute bottom-[calc(max(82px,calc(env(safe-area-inset-bottom,12px)+68px)))] left-0 right-0 h-6 z-30 flex items-center cursor-pointer select-none group touch-none"
      >
        {/* Floating Timestamp Tooltip Pill estilo TikTok / Reels */}
        {isScrubbing && (
          <div
            className="absolute -top-10 px-3 py-1 bg-black/90 backdrop-blur-md border border-amber-400 text-amber-300 font-mono font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.5)] -translate-x-1/2 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100 pointer-events-none whitespace-nowrap z-40"
            style={{
              left: `${Math.max(14, Math.min(86, progress))}%`
            }}
          >
            <span className="text-amber-400">⏱️</span>
            <span>{formatTime(scrubTime)}</span>
            <span className="text-zinc-500">/</span>
            <span className="text-zinc-300">{formatTime(videoDuration || videoRef.current?.duration || 0)}</span>
          </div>
        )}

        {/* Pista de progreso de fondo */}
        <div
          className={`w-full bg-white/25 transition-all duration-150 relative overflow-visible ${
            isScrubbing ? 'h-[6px]' : 'h-[3px] group-hover:h-[5px]'
          }`}
        >
          {/* Relleno de progreso cargado con gradiente dorado de alto contraste */}
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-[#FE2C55] shadow-[0_0_10px_rgba(251,191,36,0.9)] relative transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          >
            {/* Cabezal de arrastre (Scrubber Knob) */}
            <div
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] transition-all ${
                isScrubbing
                  ? 'w-4 h-4 ring-4 ring-amber-400/60 scale-125'
                  : 'w-2.5 h-2.5 opacity-0 group-hover:opacity-100'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 🛍️ Modal Selección de Chat de Pedido (WhatsApp / Telegram) */}
      {showMultiChatModal && video.product && (() => {
        const rawWa = video.product.whatsapp || authorObj?.whatsapp || (isOwnVideo && currentUser?.whatsapp) || '573128525929';
        const cleanWa = normalizeWhatsAppNumber(rawWa);
        const rawTg = video.product.telegram || authorObj?.telegram || (isOwnVideo && currentUser?.telegram) || '';
        const cleanTg = normalizeTelegramUser(rawTg);
        const orderMsg = buildProductOrderMessage(video.product, video);
        const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(orderMsg)}`;
        const tgUrl = cleanTg ? getTelegramLink(cleanTg, orderMsg) : null;

        return (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150 pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              setShowMultiChatModal(false);
            }}
          >
            <div
              className="w-full max-w-xs bg-[#16171d] border border-white/10 rounded-3xl p-4 shadow-2xl space-y-3.5 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center">
                    <ShoppingBag size={15} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-black text-white truncate max-w-[160px]">{video.product.name}</h4>
                    <p className="text-[10px] text-amber-300 font-mono font-bold">
                      {video.product.price ? formatCOP(video.product.price) : 'Hacer pedido'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMultiChatModal(false)}
                  className="p-1 rounded-full bg-white/10 text-zinc-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-[11px] text-zinc-300 font-medium">
                ¿Por cuál app prefieres enviar tu pedido al vendedor?
              </p>

              <div className="space-y-2 pt-1">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowMultiChatModal(false)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-decoration-none"
                >
                  <MessageCircle size={16} />
                  <span>Pedir por WhatsApp</span>
                </a>

                {tgUrl && (
                  <a
                    href={tgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowMultiChatModal(false)}
                    className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all text-decoration-none"
                  >
                    <Send size={15} />
                    <span>Pedir por Telegram</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default React.memo(VideoCard, (prevProps, nextProps) => {
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.isMuted === nextProps.isMuted &&
    prevProps.preloadMode === nextProps.preloadMode &&
    prevProps.shouldMountMedia === nextProps.shouldMountMedia &&
    prevProps.video.id === nextProps.video.id &&
    prevProps.video.feedInstanceId === nextProps.video.feedInstanceId &&
    prevProps.video.isLiked === nextProps.video.isLiked &&
    prevProps.video.isBookmarked === nextProps.video.isBookmarked &&
    prevProps.video.stats?.likes === nextProps.video.stats?.likes &&
    prevProps.video.stats?.comments === nextProps.video.stats?.comments &&
    prevProps.video.stats?.shares === nextProps.video.stats?.shares &&
    prevProps.video.author?.isFollowing === nextProps.video.author?.isFollowing &&
    prevProps.video.product?.name === nextProps.video.product?.name &&
    prevProps.video.product?.price === nextProps.video.product?.price &&
    prevProps.video.product?.telegram === nextProps.video.product?.telegram &&
    prevProps.video.product?.primaryChat === nextProps.video.product?.primaryChat &&
    prevProps.currentUserId === nextProps.currentUserId
  );
});
