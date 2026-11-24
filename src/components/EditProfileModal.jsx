import React, { useState, useRef } from 'react';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';
import { X, Camera, Check, Upload, Link as LinkIcon, Image, Sparkles } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

export default function EditProfileModal({ isOpen, onClose, currentUser, onSave }) {
  const [name, setName] = useState(currentUser.name || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState('');
  const fileInputRef = useRef(null);
  const keyboardHeight = useVirtualKeyboard();

  if (!isOpen) return null;

  // Elegir foto desde la galería o cámara del celular con Auto-Compresión Inteligente
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
        return;
      }
      try {
        // 🚀 Auto-Compresión inteligente idéntica a VitrinaSpot:
        // Fotos de 10 MB - 15 MB de iPhone/Samsung se reducen a ~45 KB en milisegundos
        const compressedBase64 = await compressImage(file, {
          maxWidth: 600,
          maxHeight: 600,
          quality: 0.8,
        });
        setAvatar(compressedBase64);
      } catch (err) {
        console.warn('Error comprimiendo foto:', err);
      }
    }
  };

  // Pegar URL directa de foto
  const handleApplyUrl = (e) => {
    e.preventDefault();
    if (tempUrl.trim()) {
      setAvatar(tempUrl.trim());
      setShowUrlInput(false);
      setTempUrl('');
    }
  };

  // Avatares rápidos recomendados
  const presetAvatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...currentUser,
      name,
      username: username.replace(/^@/, '').trim(),
      bio,
      avatar,
    });
    alert('✅ ¡Perfil y foto actualizados con éxito!');
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#16171b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
          <h2 className="text-sm font-bold">Editar perfil</h2>
          <button
            onClick={handleSubmit}
            className="px-3 py-1 bg-cyan-400 text-black font-bold text-xs rounded-full hover:bg-cyan-300"
          >
            Guardar
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          style={{
            paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 20}px` : undefined,
            transition: 'padding-bottom 0.15s ease-out',
          }}
          className="p-4 space-y-4 overflow-y-auto no-scrollbar text-xs"
        >
          {/* Avatar edit section */}
          <div className="flex flex-col items-center justify-center">
            {/* Foto de perfil actual */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative cursor-pointer group mb-2"
              title="Toca para subir foto de tu galería"
            >
              <img
                src={avatar}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-3 border-cyan-400 p-0.5 shadow-xl"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-[1px]">
                <Camera size={22} className="text-cyan-400" />
                <span className="text-[10px] font-bold mt-1">Cambiar</span>
              </div>
            </div>

            {/* Input oculto para subir archivo del celular */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Botones para cambiar foto */}
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-xl text-white text-[11px] font-semibold flex items-center gap-1.5 border border-white/10"
              >
                <Upload size={13} className="text-cyan-400" />
                <span>Elegir de Galería</span>
              </button>
              <button
                type="button"
                onClick={() => setShowUrlInput((prev) => !prev)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-xl text-white text-[11px] font-semibold flex items-center gap-1.5 border border-white/10"
              >
                <LinkIcon size={13} className="text-amber-400" />
                <span>Pegar Link/URL</span>
              </button>
            </div>

            {/* Campo desplegable para pegar URL de foto */}
            {showUrlInput && (
              <div className="w-full mt-3 p-2.5 bg-[#202126] rounded-xl border border-white/10 space-y-2">
                <span className="text-[10px] text-zinc-400 block font-semibold">
                  Pega el enlace directo de tu foto (JPG, PNG):
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="https://ejemplo.com/mifoto.jpg"
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-3 py-1.5 bg-amber-400 text-black font-bold text-xs rounded-lg active:scale-95"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}

            {/* Avatares sugeridos rápidos */}
            <div className="w-full mt-3 pt-2 border-t border-white/5">
              <span className="text-[10px] text-zinc-400 block mb-1.5 text-center font-semibold">
                O elige un avatar rápido:
              </span>
              <div className="flex justify-center gap-2">
                {presetAvatars.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt="preset"
                    onClick={() => setAvatar(url)}
                    className={`w-9 h-9 rounded-full object-cover cursor-pointer border-2 transition-all ${
                      avatar === url ? 'border-cyan-400 scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-[#202126] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>

          {/* Nombre de usuario */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Nombre de usuario (@handle)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-zinc-500 font-bold">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-[#202126] border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Descripción corta (Bio)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntale a la comunidad sobre ti..."
              className="w-full bg-[#202126] border border-white/10 rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 resize-none text-xs"
            />
          </div>

          {/* Guardar cambios */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-cyan-400 to-[#FE2C55] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-1.5 mt-2"
          >
            <Check size={16} />
            <span>Guardar cambios</span>
          </button>
        </form>
      </div>
    </div>
  );
}
