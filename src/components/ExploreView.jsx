import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Flame, TrendingUp, Play, X, UserPlus, UserCheck, 
  Sparkles, CheckCircle2, ChevronRight, Tag, ArrowLeft, Heart, ShoppingBag
} from 'lucide-react';
import { formatNumber, formatCOP } from '../utils/format';
import { resolveMediaUrl } from '../utils/apiUrl';
import { extractVideoThumbnail } from '../utils/thumbnailUtils';

function ExploreVideoThumb({ video, className = "w-full h-full object-cover" }) {
  const [imgError, setImgError] = useState(false);
  const [extractedThumb, setExtractedThumb] = useState(null);

  const rawThumb = video?.cover || video?.thumbnail;
  const isDataThumb = rawThumb && typeof rawThumb === 'string' && rawThumb.startsWith('data:image');
  const isUserUpload = Boolean(video?.isUserUploaded || (video?.id && video?.id.startsWith('uploaded-')));

  const resolvedThumb = (isUserUpload && !isDataThumb)
    ? ''
    : (rawThumb ? resolveMediaUrl(rawThumb) : '');
  const resolvedVideo = video?.videoUrl ? resolveMediaUrl(video.videoUrl) : '';

  useEffect(() => {
    let isMounted = true;
    if ((imgError || !resolvedThumb) && !extractedThumb && (video?.videoBlob || resolvedVideo)) {
      extractVideoThumbnail(video?.videoBlob || resolvedVideo, 0.2)
        .then((dataUrl) => {
          if (isMounted && dataUrl) {
            setExtractedThumb(dataUrl);
          }
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [imgError, resolvedThumb, extractedThumb, video?.videoBlob, resolvedVideo]);

  if (isDataThumb) {
    return (
      <img
        src={rawThumb}
        alt={video?.description || 'Video'}
        className={className}
      />
    );
  }

  if (extractedThumb) {
    return (
      <img
        src={extractedThumb}
        alt={video?.description || 'Video'}
        className={className}
      />
    );
  }

  if (resolvedThumb && !imgError) {
    return (
      <img
        src={resolvedThumb}
        alt={video?.description || 'Video'}
        className={className}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    );
  }

  const cleanSrc = resolvedVideo.startsWith('blob:') || resolvedVideo.startsWith('data:')
    ? resolvedVideo
    : `${resolvedVideo}#t=0.001`;

  return (
    <video
      src={cleanSrc}
      className={className}
      muted
      playsInline
      preload="auto"
      onLoadedData={(e) => {
        try {
          if (e.currentTarget.currentTime === 0) {
            e.currentTarget.currentTime = 0.1;
          }
        } catch (err) {}
      }}
    />
  );
}

// Tendencias destacadas del momento en Colombia
const TRENDING_TOPICS = [
  { id: 't-1', tag: 'ModaColombiana', category: 'Moda & Calzado', views: '1.8M', rank: 1, hot: true },
  { id: 't-2', tag: 'BurgerMaster', category: 'Gastronomía', views: '980K', rank: 2, hot: true },
  { id: 't-3', tag: 'TechColombia', category: 'Tecnología', views: '640K', rank: 3, hot: false },
  { id: 't-4', tag: 'FitnessGym', category: 'Salud & Deporte', views: '420K', rank: 4, hot: false },
];

export default function ExploreView({ 
  videos = [], 
  onSelectVideo, 
  onSelectCreator,
  onToggleFollow,
  onBack 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('top'); // 'top' | 'videos' | 'creators'

  // Extraer creadores únicos a partir de los videos
  const uniqueCreators = useMemo(() => {
    const map = new Map();
    videos.forEach((v) => {
      if (v.author && !map.has(v.author.id)) {
        map.set(v.author.id, {
          ...v.author,
          stats: v.stats,
          sampleVideo: v.videoUrl,
        });
      }
    });
    return Array.from(map.values());
  }, [videos]);

  // Manejo de seguir/dejar de seguir sincronizado directamente con el estado global en App.jsx
  const toggleFollow = (creatorId, e) => {
    e.stopPropagation();
    if (onToggleFollow) {
      onToggleFollow(creatorId);
    }
  };

  // Filtrado de Videos
  const filteredVideos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return videos;
    return videos.filter((v) => {
      const desc = v.description?.toLowerCase() || '';
      const author = v.author?.username?.toLowerCase() || '';
      const name = v.author?.name?.toLowerCase() || '';
      const tags = v.tags?.map((t) => t.toLowerCase()) || [];
      return desc.includes(q) || author.includes(q) || name.includes(q) || tags.some((t) => t.includes(q));
    });
  }, [videos, searchQuery]);

  // 🏆 Videos clasificados para pestaña TOP (ordenados de mayor a menor por likes)
  const topVideos = useMemo(() => {
    return [...filteredVideos].sort(
      (a, b) => (b.stats?.likes || 0) - (a.stats?.likes || 0)
    );
  }, [filteredVideos]);

  // Filtrado de Creadores
  const filteredCreators = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return uniqueCreators;
    return uniqueCreators.filter((c) => {
      const name = c.name?.toLowerCase() || '';
      const username = c.username?.toLowerCase() || '';
      return name.includes(q) || username.includes(q);
    });
  }, [uniqueCreators, searchQuery]);

  // 🛍️ Filtrado de Productos Comerciales (Video Commerce de la Vitrina)
  const allProductVideos = useMemo(() => {
    return videos.filter((v) => v.product && v.product.name);
  }, [videos]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allProductVideos;
    return allProductVideos.filter((v) => {
      const prodName = v.product.name?.toLowerCase() || '';
      const author = v.author?.name?.toLowerCase() || '';
      const username = v.author?.username?.toLowerCase() || '';
      const tags = v.tags?.map((t) => t.toLowerCase()) || [];
      return prodName.includes(q) || author.includes(q) || username.includes(q) || tags.some((t) => t.includes(q));
    });
  }, [allProductVideos, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="w-full h-full bg-[#0c0f14] overflow-y-auto no-scrollbar pt-[max(16px,calc(env(safe-area-inset-top,14px)+10px))] pb-24 px-3.5 flex flex-col text-white select-none">
      
      {/* 🔍 1. BARRA DE BÚSQUEDA INTELIGENTE CON BOTÓN VOLVER (FLECHA) */}
      <div className="flex items-center gap-2 mb-3.5 shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#161922] hover:bg-[#1f222e] border border-white/5 active:scale-90 text-white transition-all shrink-0 cursor-pointer shadow-md group"
            title="Volver a los videos"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform text-white/90 group-hover:text-[#ffb800]" />
          </button>
        )}

        <div className="relative flex-1 flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar videos, creadores o tendencias..."
            className="w-full bg-[#161922] text-white placeholder-zinc-500 text-xs rounded-2xl py-3 pl-10 pr-10 focus:outline-none focus:ring-1.5 focus:ring-[#ffb800] border border-white/5 shadow-inner transition-all"
          />
          <Search size={16} className="absolute left-3.5 text-zinc-400 pointer-events-none" />
          
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 w-5 h-5 flex items-center justify-center rounded-full bg-zinc-700/80 hover:bg-zinc-600 text-white transition-colors cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODO 1: ESTADO DE DESCUBRIMIENTO (CUANDO NO SE ESTÁ BUSCANDO) */}
      {/* ------------------------------------------------------------- */}
      {!isSearching ? (
        <div className="flex flex-col gap-5">
          
          {/* A. CREADORES DESTACADOS CON BOTÓN '+ SEGUIR' */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#ffb800]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Creadores Destacados
                </h4>
              </div>
              <span className="text-[10px] text-zinc-500 font-semibold">Recomendados</span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {uniqueCreators.map((creator) => {
                const isFollowing = Boolean(creator.isFollowing);
                return (
                  <div
                    key={creator.id}
                    onClick={() => onSelectCreator && onSelectCreator(creator)}
                    className="w-28 p-2.5 bg-gradient-to-b from-[#181a24] to-[#12141c] rounded-2xl flex flex-col items-center text-center shrink-0 border border-white/5 cursor-pointer hover:border-[#ffb800]/30 transition-all shadow-md group"
                  >
                    <div className="relative mb-2">
                      <img
                        src={creator.avatar}
                        alt={creator.username}
                        className="w-13 h-13 rounded-full object-cover border-2 border-[#ffb800]/40 group-hover:border-[#ffb800] transition-colors"
                      />
                      {creator.isVerified && (
                        <CheckCircle2 size={13} className="absolute bottom-0 right-0 text-[#ffb800] fill-black" />
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-white truncate w-full leading-tight">
                      {creator.name}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate w-full mb-2">
                      @{creator.username}
                    </p>
                    
                    {/* Botón directo de Seguir */}
                    <button
                      onClick={(e) => toggleFollow(creator.id, e)}
                      className={`w-full py-1 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                        isFollowing
                          ? 'bg-zinc-800 text-zinc-300 border border-white/10'
                          : 'bg-gradient-to-r from-[#ffb800] to-[#ffa000] text-black shadow-[0_0_10px_rgba(255,184,0,0.3)] hover:scale-102'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck size={11} />
                          <span>Siguiendo</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={11} />
                          <span>Seguir</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🛍️ PRODUCTOS DESTACADOS EN SPOT PLAY (VITRINA COMERCIAL) */}
          {allProductVideos.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-[#ffb800]/20 text-[#ffb800] flex items-center justify-center">
                    <ShoppingBag size={12} className="stroke-[2.5]" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Vitrina Comercial Spot Play
                  </h4>
                </div>
                <span className="text-[10px] text-amber-400 font-bold">Pedidos WhatsApp 💬</span>
              </div>

              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {allProductVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => onSelectVideo && onSelectVideo(video.id)}
                    className="w-36 p-2 bg-gradient-to-b from-[#181a24] to-[#12141c] rounded-2xl shrink-0 border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer shadow-md group flex flex-col"
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black mb-1.5">
                      <ExploreVideoThumb
                        video={video}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      {Boolean(video.product.price) && (
                        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-mono font-black shadow">
                          {formatCOP(video.product.price)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-extrabold text-white truncate w-full group-hover:text-amber-400 transition-colors">
                      {video.product.name}
                    </p>
                    <p className="text-[9px] text-zinc-400 truncate w-full mb-1">
                      @{video.author?.username}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const phone = (video.product.whatsapp || video.author?.whatsapp || '573105558899').replace(/[^0-9]/g, '');
                        const msg = encodeURIComponent(`¡Hola! Vi *${video.product.name}* en Explorar Spot Play y quiero pedirlo. ¿Está disponible?`);
                        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                      }}
                      className="w-full py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[9px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all mt-auto"
                    >
                      <span>Pedir 💬</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* B. TOP TENDENCIAS DEL MOMENTO (CON RANKING #1, #2...) */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Flame size={14} className="text-red-500 fill-red-500" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Tendencias en Colombia
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {TRENDING_TOPICS.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => setSearchQuery(topic.tag)}
                  className="p-2.5 bg-[#161822] hover:bg-[#1e202d] border border-white/5 hover:border-[#ffb800]/40 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`text-xs font-black ${
                      topic.rank === 1 ? 'text-[#ffb800]' : topic.rank === 2 ? 'text-zinc-300' : 'text-zinc-500'
                    }`}>
                      #{topic.rank}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-white group-hover:text-[#ffb800] transition-colors truncate">
                        #{topic.tag}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {topic.views} vistas
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-zinc-600 group-hover:text-[#ffb800] shrink-0 transition-transform group-hover:translate-x-0.5" />
                </div>
              ))}
            </div>
          </div>

          {/* C. EXPLORAR VIDEOS POPULARES (GRID 2 COLUMNAS) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Explorar Videos ({videos.length})
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {videos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => onSelectVideo && onSelectVideo(video.id)}
                  className="group relative aspect-9/14 bg-[#14161f] rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-white/5 hover:border-[#ffb800]/40 transition-all"
                >
                  <ExploreVideoThumb
                    video={video}
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                    <p className="text-[11px] font-semibold line-clamp-2 leading-tight drop-shadow mb-1.5 text-white/95">
                      {video.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-300">
                      <span className="font-medium truncate max-w-[70px]">@{video.author?.username}</span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Play size={10} className="fill-white text-white" />
                        <span>{formatNumber(video.stats?.likes || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* ----------------------------------------------------------- */
        /* MODO 2: ESTADO DE BÚSQUEDA ACTIVA (RESULTADOS Y PESTAÑAS)   */
        /* ----------------------------------------------------------- */
        <div className="flex flex-col gap-3">
          {/* Pestañas de Filtro: Top | Videos | Vitrina | Creadores */}
          <div className="flex items-center gap-1.5 p-1 bg-[#161822] rounded-xl border border-white/5">
            {[
              { id: 'top', label: 'Top' },
              { id: 'videos', label: `Videos (${filteredVideos.length})` },
              { id: 'products', label: `🛍️ Vitrina (${filteredProducts.length})` },
              { id: 'creators', label: `Creadores (${filteredCreators.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#ffb800] to-[#ffa000] text-black shadow-md font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* CONTENIDO SEGÚN LA PESTAÑA ACTIVA */}
          
          {/* PESTAÑA: TOP (Resumen completo con lo mejor de cada categoría) */}
          {activeTab === 'top' && (
            <div className="flex flex-col gap-4">
              {/* Creadores coincidentes si existen */}
              {filteredCreators.length > 0 && (
                <div>
                  <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Creadores encontrados
                  </h5>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {filteredCreators.map((creator) => (
                      <div
                        key={creator.id}
                        onClick={() => onSelectCreator && onSelectCreator(creator)}
                        className="flex items-center gap-2 p-2 bg-[#171924] rounded-xl border border-white/5 shrink-0 cursor-pointer hover:border-[#ffb800]/40"
                      >
                        <img src={creator.avatar} alt={creator.username} className="w-8 h-8 rounded-full object-cover" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-white leading-tight">{creator.name}</p>
                          <p className="text-[10px] text-zinc-400">@{creator.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos coincidentes en Top (ordenados por likes) */}
              <div>
                <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Videos más populares ({topVideos.length})
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  {topVideos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => onSelectVideo && onSelectVideo(video.id)}
                      className="group relative aspect-9/14 bg-[#14161f] rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-white/5 hover:border-[#ffb800]/40 transition-all"
                    >
                      <ExploreVideoThumb
                        video={video}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <p className="text-[11px] font-semibold line-clamp-2 leading-tight drop-shadow mb-1">
                          {video.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-zinc-300">
                          <span className="font-medium truncate max-w-[70px]">@{video.author?.username}</span>
                          <div className="flex items-center gap-0.5 shrink-0 text-rose-400 font-bold">
                            <Heart size={10} className="fill-rose-400" />
                            <span>{formatNumber(video.stats?.likes || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: SOLO VIDEOS */}
          {activeTab === 'videos' && (
            <div className="grid grid-cols-2 gap-2">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => onSelectVideo && onSelectVideo(video.id)}
                  className="group relative aspect-9/14 bg-[#14161f] rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-white/5"
                >
                  <ExploreVideoThumb
                    video={video}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 text-white">
                    <p className="text-[11px] font-semibold line-clamp-2 leading-tight drop-shadow mb-1">
                      {video.description}
                    </p>
                    <span className="text-[10px] text-zinc-300">@{video.author?.username}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PESTAÑA: PRODUCTOS DE VITRINA */}
          {activeTab === 'products' && (
            <div className="grid grid-cols-2 gap-2.5">
              {filteredProducts.map((video) => (
                <div
                  key={video.id}
                  onClick={() => onSelectVideo && onSelectVideo(video.id)}
                  className="group relative bg-[#141822] rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-amber-500/20 hover:border-amber-400 transition-all flex flex-col"
                >
                  <div className="relative aspect-9/12 bg-black">
                    <ExploreVideoThumb
                    video={video}
                    className="w-full h-full object-cover"
                  />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[#ffb800] text-[9px] font-bold border border-amber-400/40 flex items-center gap-1">
                      <ShoppingBag size={10} />
                      <span>Vitrina</span>
                    </span>
                    {Boolean(video.product.price) && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-mono font-extrabold shadow">
                        {formatCOP(video.product.price)}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5 text-left space-y-1">
                    <p className="text-xs font-black text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                      {video.product.name}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      Vendido por @{video.author?.username}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const phone = (video.product.whatsapp || video.author?.whatsapp || '573105558899').replace(/[^0-9]/g, '');
                        const msg = encodeURIComponent(`¡Hola! Vi *${video.product.name}* en Explorar Spot Play y quiero pedirlo. ¿Está disponible?`);
                        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                      }}
                      className="w-full mt-1 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold flex items-center justify-center gap-1 active:scale-95 transition-all"
                    >
                      <span>Pedir WhatsApp 💬</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PESTAÑA: SOLO CREADORES */}
          {activeTab === 'creators' && (
            <div className="flex flex-col gap-2">
              {filteredCreators.map((creator) => {
                const isFollowing = Boolean(creator.isFollowing);
                return (
                  <div
                    key={creator.id}
                    onClick={() => onSelectCreator && onSelectCreator(creator)}
                    className="p-3 bg-[#161822] rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer hover:border-[#ffb800]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img src={creator.avatar} alt={creator.username} className="w-11 h-11 rounded-full object-cover border border-[#ffb800]/40" />
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-white">{creator.name}</span>
                          {creator.isVerified && <CheckCircle2 size={12} className="text-[#ffb800]" />}
                        </div>
                        <p className="text-[11px] text-zinc-400">@{creator.username}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => toggleFollow(creator.id, e)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                        isFollowing
                          ? 'bg-zinc-800 text-zinc-300 border border-white/10'
                          : 'bg-gradient-to-r from-[#ffb800] to-[#ffa000] text-black font-extrabold shadow-md'
                      }`}
                    >
                      {isFollowing ? 'Siguiendo' : '+ Seguir'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ESTADO VACÍO SI NO HAY NADA */}
          {filteredVideos.length === 0 && filteredCreators.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
              <Search size={36} className="text-zinc-600 mb-2 stroke-[1.5]" />
              <p className="text-xs font-bold text-zinc-300 mb-1">No se encontraron resultados</p>
              <p className="text-[11px]">Intenta buscar con otra palabra como "moda", "burger" o "tech"</p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
