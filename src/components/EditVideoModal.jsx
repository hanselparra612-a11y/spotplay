import React, { useState, useEffect, useRef } from 'react';
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
  Image as ImageIcon,
  ShoppingBag,
} from 'lucide-react';
import { normalizeWhatsAppNumber } from '../utils/format';

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
  const [customThumbnail, setCustomThumbnail] = useState('');
  const [hasProduct, setHasProduct] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productWhatsApp, setProductWhatsApp] = useState('3128525929');
  const thumbnailInputRef = useRef(null);

  useEffect(() => {
    if (video && isOpen) {
      setDescription(video.description || video.caption || '');
      setCategory(video.category || 'General');
      setCity(video.promotedCity || video.location || 'Toda Colombia');
      setVisibility(video.isHidden ? 'hidden' : video.visibility || 'public');
      setIsPinned(Boolean(video.isPinned));
      setIsConfirmingDelete(false);
      setCustomThumbnail(video.thumbnail || video.cover || '');

      if (video.product) {
        setHasProduct(true);
        setProductName(video.product.name || '');
        setProductPrice(video.product.price ? String(video.product.price) : '');
        setProductWhatsApp((video.product.whatsapp || '3128525929').replace(/^57/, ''));
      } else {
        setHasProduct(false);
        setProductName('');
        setProductPrice('');
        setProductWhatsApp('3128525929');
      }

      if (Array.isArray(video.tags) && video.tags.length > 0) {
        setTags(video.tags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' '));
      } else if (typeof video.tags === 'string' && video.tags) {
        setTags(video.tags);
      } else {
        setTags('');
      }
    }
  }, [video, isOpen]);

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCustomThumbnail(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

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
      thumbnail: customThumbnail || video.thumbnail,
      cover: customThumbnail || video.cover,
      product: hasProduct && productName.trim() ? {
        id: video.product?.id || ('prod-' + Date.now()),
        name: productName.trim(),
        price: Number(productPrice.toString().replace(/[^0-9]/g, '')) || 0,
        whatsapp: normalizeWhatsAppNumber(productWhatsApp.trim() || '573128525929'),
      } : null,
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
              {customThumbnail ? (
                <img
                  src={customThumbnail}
                  alt="Miniatura"
                  className="w-full h-full object-cover"
                />
              ) : video.thumbnail || video.cover ? (
                <img
                  src={video.thumbnail || video.cover}
                  alt="Miniatura"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={video.videoUrl}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
              )}
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

          {/* Miniatura / Carátula Personalizada */}
          <div className="p-3.5 rounded-2xl bg-[#181d2a] border border-amber-400/20 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <ImageIcon size={14} className="text-amber-400" />
                <span>Miniatura / Portada del Video</span>
              </label>
              {customThumbnail && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold border border-emerald-400/30">
                  ✓ Portada personalizada lista
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-16 h-22 rounded-xl bg-black overflow-hidden border border-white/15 relative shrink-0 shadow-md">
                {customThumbnail ? (
                  <img
                    src={customThumbnail}
                    alt="Portada seleccionada"
                    className="w-full h-full object-cover"
                  />
                ) : video.thumbnail || video.cover ? (
                  <img
                    src={video.thumbnail || video.cover}
                    alt="Portada actual"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-1">
                    <ImageIcon size={16} />
                    <span className="text-[8px]">Sin foto</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <p className="text-[10px] text-zinc-400 leading-snug">
                  ¿La miniatura se ve oscura o quieres una imagen más llamativa? Elige cualquier foto de tu galería como carátula oficial.
                </p>
                <input
                  type="file"
                  ref={thumbnailInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailChange}
                />
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <ImageIcon size={13} />
                  <span>{customThumbnail ? 'Cambiar por otra foto' : 'Elegir foto de galería'}</span>
                </button>
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

          {/* 5. 🛍️ Producto Vinculado a Vitrina / Pedidos WhatsApp */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#181d2a] to-emerald-500/10 border border-amber-400/30 space-y-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setHasProduct((prev) => !prev)}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/40">
                  <ShoppingBag size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>Etiqueta de Pedidos WhatsApp</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-400/30 font-bold">
                      Tienda Directa
                    </span>
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    Muestra un botón dorado en tu video para recibir pedidos al chat
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                id="editHasProduct"
                checked={hasProduct}
                onChange={(e) => setHasProduct(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 accent-amber-400 cursor-pointer"
              />
            </div>

            {hasProduct && (
              <div className="space-y-2.5 pt-2 border-t border-white/10 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Nombre del Producto o Promoción *
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ej. Tienda de Mamá, Desayuno Sorpresa, Zapatillas..."
                    className="w-full bg-[#12151e] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400 font-medium"
                    required={hasProduct}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Precio en COP (Opcional)
                    </label>
                    <input
                      type="number"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="Ej. 45000"
                      className="w-full bg-[#12151e] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                      WhatsApp de Pedidos
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-emerald-400 font-bold text-[11px]">+57</span>
                      <input
                        type="tel"
                        value={productWhatsApp}
                        onChange={(e) => setProductWhatsApp(e.target.value)}
                        placeholder="Ej. 3128525929"
                        className="w-full bg-[#12151e] border border-white/15 rounded-xl pl-9 pr-2.5 py-2 text-white text-xs focus:outline-none focus:border-emerald-400 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-emerald-400/90 font-medium flex items-center gap-1">
                  ✓ Al tocar "Pedir 💬" en el video, se abrirá el chat al WhatsApp (+57) {productWhatsApp || '3128525929'}
                </p>
              </div>
            )}
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
