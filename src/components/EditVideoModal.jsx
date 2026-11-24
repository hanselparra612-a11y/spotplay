import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  Trash2,
  Check,
  Tag,
  Hash,
  MapPin,
  Eye,
  EyeOff,
  Lock,
  Pin,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

const CATEGORIES = [
  'General',
  'Moda & Belleza',
  'Gastronomía & Comida',
  'Tecnología',
  'Música & Baile',
  'Humor & Comedia',
  'Fitness & Deporte',
  'Emprendimiento',
  'Educación & Tips',
  'Entretenimiento',
];

const CITIES = [
  'Toda Colombia',
  'Bogotá D.C.',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Bucaramanga',
  'Cartagena',
  'Pereira',
  'Manizales',
  'Cúcuta',
  'Santa Marta',
  'Ibagué',
  'Villavicencio',
];

export default function EditVideoModal({
  isOpen,
  video,
  onClose,
  onSave,
  onDelete,
}) {
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('General');
  const [city, setCity] = useState('Toda Colombia');
  const [visibility, setVisibility] = useState('public'); // 'public' | 'unlisted' | 'hidden'
  const [isPinned, setIsPinned] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (video && isOpen) {
      setDescription(video.description || video.caption || '');
      setCategory(video.category || 'General');
      setCity(video.promotedCity || video.location || 'Toda Colombia');
      setVisibility(video.isHidden ? 'hidden' : video.visibility || 'public');
      setIsPinned(Boolean(video.isPinned));
      setIsConfirmingDelete(false);

      if (Array.isArray(video.tags) && video.tags.length > 0) {
        setTags(video.tags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' '));
      } else if (typeof video.tags === 'string' && video.tags) {
        setTags(video.tags);
      } else {
        setTags('');
      }
    }
  }, [video, isOpen]);

  if (!isOpen || !video) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    // Parsear tags a un array limpio sin prefijo '#'
    const parsedTags = tags
      ? tags
          .split(/[,\s]+/)
          .map((t) => t.replace(/^#/, '').trim())
          .filter(Boolean)
      : (Array.isArray(video.tags) ? video.tags : []);

    const updatedVideo = {
      ...video,
      description: description.trim(),
      caption: description.trim(),
      category,
      tags: parsedTags,
      promotedCity: city,
      location: city,
      visibility,
      isHidden: visibility === 'hidden',
      isPinned,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedVideo);
    onClose();
  };

  const handleDeleteClick = () => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }
    onDelete(video.id);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#141821] border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] text-white"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-[#181d2a] to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
              <Edit3 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Editar Video Publicado</h3>
              <p className="text-[10px] text-zinc-400">Actualiza la descripción, hashtags y privacidad</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4 text-xs">
          {/* Preview Row */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
            <div className="w-14 h-20 rounded-xl bg-black overflow-hidden relative shrink-0 border border-white/10">
              <video
                src={video.videoUrl}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {description || 'Sin título'}
              </p>
              <p className="text-[10px] text-amber-400 font-medium mt-0.5">
                {category} • {city}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-1">
                <span>❤️ {video.stats?.likes || 0}</span>
                <span>💬 {video.stats?.comments || 0}</span>
                <span>🔁 {video.stats?.shares || 0}</span>
              </div>
            </div>
          </div>

          {/* 1. Descripción / Título */}
          <div>
            <label className="block text-[11px] font-bold text-white mb-1">
              Descripción y Título del Video
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escribe una descripción cautivadora para tus seguidores..."
              className="w-full bg-[#181d2a] border border-white/15 rounded-2xl p-3 text-white text-xs focus:outline-none focus:border-amber-400 leading-relaxed"
              maxLength={300}
              required
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>Incluye palabras clave para que te encuentren en Buscar</span>
              <span>{description.length}/300</span>
            </div>
          </div>

          {/* 2. Hashtags y Etiquetas */}
          <div>
            <label className="block text-[11px] font-bold text-white mb-1 flex items-center gap-1">
              <Hash size={12} className="text-amber-400" />
              <span>Hashtags & Temas</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="#moda #colombia #viral #humor"
              className="w-full bg-[#181d2a] border border-white/15 rounded-xl px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-amber-400"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Separa tus hashtags con espacio o coma para indexar tu video en el buscador.
            </p>
          </div>

          {/* 3. Categoría y Ubicación */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-white mb-1 flex items-center gap-1">
                <Tag size={12} className="text-amber-400" />
                <span>Categoría</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#181d2a] border border-white/15 rounded-xl px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white mb-1 flex items-center gap-1">
                <MapPin size={12} className="text-emerald-400" />
                <span>Ubicación / Ciudad</span>
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#181d2a] border border-white/15 rounded-xl px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Privacidad & Fijar Video */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-white mb-1 flex items-center gap-1">
                <Eye size={12} className="text-cyan-400" />
                <span>Privacidad</span>
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full bg-[#181d2a] border border-white/15 rounded-xl px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="public">🌐 Público (Para ti)</option>
                <option value="unlisted">🔗 Solo con enlace</option>
                <option value="hidden">🔒 Privado / Oculto</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white mb-1 flex items-center gap-1">
                <Pin size={12} className="text-amber-400" />
                <span>Fijar en tu perfil</span>
              </label>
              <button
                type="button"
                onClick={() => setIsPinned((prev) => !prev)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isPinned
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                    : 'bg-[#181d2a] border-white/15 text-zinc-400 hover:text-white'
                }`}
              >
                <Pin size={12} className={isPinned ? 'fill-amber-400' : ''} />
                <span>{isPinned ? 'Fijado al Inicio' : 'No Fijado'}</span>
              </button>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-400 via-[#ffa000] to-amber-500 hover:opacity-95 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>Guardar Cambios del Video</span>
            </button>

            {/* Eliminar Video */}
            <div className="pt-2">
              {isConfirmingDelete ? (
                <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/40 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <AlertTriangle size={15} />
                    <span>¿Eliminar este video definitivamente?</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Esta acción no se puede deshacer. Se borrarán las visitas y comentarios.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="flex-1 py-1.5 bg-white/10 hover:bg-white/15 rounded-xl text-white font-bold text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteClick}
                      className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md"
                    >
                      <Trash2 size={13} />
                      <span>Sí, Eliminar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Eliminar este video</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
