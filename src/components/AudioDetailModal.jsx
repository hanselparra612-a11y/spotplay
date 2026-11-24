import React from 'react';
import { X, Disc, Play, Share2, Bookmark, Film } from 'lucide-react';

export default function AudioDetailModal({ isOpen, onClose, sound, videos = [], onUseSound, onSelectVideo }) {
  if (!isOpen || !sound) return null;

  // Filter videos that use this sound or similar
  const soundVideos = videos.filter(
    (v) => v.music?.title === sound.title || v.music?.author === sound.author
  );
  const displayVideos = soundVideos.length > 0 ? soundVideos : videos.slice(0, 3);

  return (
    <div className="absolute inset-0 z-50 bg-[#121316] overflow-y-auto no-scrollbar flex flex-col animate-in slide-in-from-right duration-200 text-white">
      {/* Top Navbar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[#121316]/90 backdrop-blur-md border-b border-white/10">
        <button onClick={onClose} className="p-1 text-white hover:text-zinc-300">
          <X size={22} />
        </button>
        <span className="text-sm font-bold">Detalle del Sonido</span>
        <button onClick={() => alert('¡Enlace de audio copiado!')} className="p-1 text-white hover:text-zinc-300">
          <Share2 size={20} />
        </button>
      </div>

      {/* Sound Hero Section */}
      <div className="p-5 flex items-center gap-4 border-b border-white/10">
        {/* Cover with spinning effect */}
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-2xl border border-white/10 group">
          <img
            src={sound.cover}
            alt={sound.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Disc size={28} className="text-white animate-spin-slow" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white line-clamp-2 leading-snug">
            {sound.title}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">@{sound.author}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {soundVideos.length * 120 + 340} videos publicados
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => onUseSound(sound)}
              className="px-4 py-1.5 bg-[#FE2C55] hover:bg-red-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 active:scale-95 shadow-lg"
            >
              <Film size={14} />
              <span>Usar este sonido</span>
            </button>
            <button
              onClick={() => alert('Guardado en tus sonidos favoritos ⭐')}
              className="p-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-zinc-300 hover:text-white"
            >
              <Bookmark size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="p-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
          Videos populares con este sonido
        </h3>
        <div className="grid grid-cols-3 gap-1">
          {displayVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => {
                onSelectVideo(video.id);
                onClose();
              }}
              className="relative aspect-3/4 bg-zinc-900 rounded overflow-hidden cursor-pointer group"
            >
              <video src={video.videoUrl} className="w-full h-full object-cover" muted />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
              <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-[10px] text-white font-medium drop-shadow">
                <Play size={10} className="fill-white" />
                <span>{video.stats?.likes || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
