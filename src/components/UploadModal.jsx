import React, { useState, useRef, useEffect } from 'react';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';
import { X, UploadCloud, Film, Music, Hash, Check, Camera, ShoppingBag, Gift, Sparkles, Volume2, VolumeX, Store, Search, TrendingUp, DollarSign, CheckCircle2, ArrowLeft, ArrowRight, Play, RefreshCw } from 'lucide-react';
import { uploadVideoToFirebase } from '../firebase/videoService';
import { isFirebaseConfigured } from '../firebase/config';
import { formatCOP } from '../utils/format';
import { getApiUrl } from '../utils/apiUrl';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function extractClientThumbnail(blob) {
  return new Promise((resolve) => {
    try {
      const vid = document.createElement('video');
      vid.crossOrigin = 'anonymous';
      vid.muted = true;
      vid.playsInline = true;
      const url = URL.createObjectURL(blob);
      vid.src = url;
      vid.currentTime = 0.5;
      vid.onloadeddata = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = vid.videoWidth || 720;
          canvas.height = vid.videoHeight || 1280;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          URL.revokeObjectURL(url);
          resolve(dataUrl);
        } catch (e) {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };
      vid.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
    } catch (err) {
      resolve(null);
    }
  });
}

export default function UploadModal({
  isOpen,
  onClose,
  initialVideoUrl,
  initialVideoBlob,
  initialSound,
  onUploadSuccess,
  onOpenCamera,
  currentUser,
}) {
  const [videoFile, setVideoFile] = useState(null);
  const [videoBlob, setVideoBlob] = useState(initialVideoBlob || null);
  const [videoPreview, setVideoPreview] = useState(initialVideoUrl || null);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('parati, viral, creador');
  const [musicTitle, setMusicTitle] = useState(
    initialSound ? `${initialSound.title}` : 'Sonido original - Mi Perfil'
  );
  const [enableGifts, setEnableGifts] = useState(true);

  // 🛍️ Video Commerce Fields
  const [isCommercialVideo, setIsCommercialVideo] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productWhatsApp, setProductWhatsApp] = useState(currentUser?.whatsapp || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccessSubmitted, setIsSuccessSubmitted] = useState(false);
  const [publishedVideoInfo, setPublishedVideoInfo] = useState(null);
  const fileInputRef = useRef(null);
  const uploadVideoRef = useRef(null);
  const [isUploadMuted, setIsUploadMuted] = useState(false);
  const keyboardHeight = useVirtualKeyboard();

  const handleResetForm = () => {
    if (uploadVideoRef.current) {
      uploadVideoRef.current.pause();
    }
    setVideoFile(null);
    setVideoBlob(null);
    setVideoPreview(null);
    setCaption('');
    setTags('parati, viral, creador');
    setIsCommercialVideo(false);
    setProductName('');
    setProductPrice('');
    setProductWhatsApp(currentUser?.whatsapp || '');
    setIsSuccessSubmitted(false);
    setPublishedVideoInfo(null);
    setUploadProgress(0);
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadAnother = () => {
    handleResetForm();
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }, 120);
  };

  useEffect(() => {
    if (initialVideoUrl) {
      setVideoPreview(initialVideoUrl);
    }
  }, [initialVideoUrl]);

  useEffect(() => {
    if (initialVideoBlob) {
      setVideoBlob(initialVideoBlob);
    }
  }, [initialVideoBlob]);

  useEffect(() => {
    if (!isOpen) {
      handleResetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialSound) {
      setMusicTitle(initialSound.title);
    }
  }, [initialSound]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Por favor selecciona un archivo de video válido (MP4 o WebM).');
      return;
    }

    // 🔒 Límite de seguridad de 50 MB para garantizar subida fluida y evitar costos excesivos de nube
    const MAX_MB = 50;
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`⚠️ Este video pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB.\nEl límite recomendado en Spot Play es de hasta ${MAX_MB} MB (aprox. hasta 2 minutos de video). Por favor recorta o comprime el video antes de subirlo.`);
      e.target.value = '';
      return;
    }

    // ⏱️ Validación de duración de video (hasta 2 minutos / 120s con margen de 125s)
    try {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      const tempUrl = URL.createObjectURL(file);
      tempVideo.src = tempUrl;
      tempVideo.onloadedmetadata = () => {
        URL.revokeObjectURL(tempUrl);
        if (tempVideo.duration > 125) {
          alert(`⏱️ El video dura ${(tempVideo.duration / 60).toFixed(1)} minutos (${Math.round(tempVideo.duration)}s).\nPara una mejor experiencia móvil en Spot Play, la duración máxima permitida es de 2 minutos (120 segundos).`);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setVideoFile(null);
          setVideoBlob(null);
          setVideoPreview(null);
        }
      };
    } catch (vErr) {}

    if (videoFile && videoPreview && videoPreview !== initialVideoUrl) {
      try {
        URL.revokeObjectURL(videoPreview);
      } catch (err) {}
    }
    setVideoFile(file);
    setVideoBlob(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoPreview) {
      alert('Por favor selecciona o graba un video para publicar');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(15);

    try {
      const videoMeta = {
        author: {
          id: currentUser?.id || 'me',
          name: currentUser?.name || 'Mi Perfil Creador',
          username: currentUser?.username || 'nuevo_creador',
          avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          isFollowing: false,
          isVerified: true,
          whatsapp: productWhatsApp.trim() || currentUser?.whatsapp || '573105558899',
        },
        description: caption || '¡Mi nuevo video en Spot Play! 🚀🎬',
        tags: tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean),
        enableGifts,
        product: isCommercialVideo && productName.trim() ? {
          id: 'prod-' + Date.now(),
          name: productName.trim(),
          price: Number(productPrice.toString().replace(/[^0-9]/g, '')) || 0,
          whatsapp: productWhatsApp.trim() || currentUser?.whatsapp || '573105558899',
        } : null,
        music: {
          title: musicTitle || 'Sonido original',
          author: currentUser?.username || 'nuevo_creador',
          cover:
            initialSound?.cover ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80',
        },
      };

      let uploadedVideo;
      const targetBlob = videoBlob || videoFile;

      if (videoFile && isFirebaseConfigured) {
        uploadedVideo = await uploadVideoToFirebase(videoFile, videoMeta, (prog) => {
          setUploadProgress(prog);
        });
      } else {
        // 💾 Persistencia Real y Permanente en Disco (Accesible en Celular y PC sin perderse)
        let persistentUrl = videoPreview;
        const uploadId = 'uploaded-' + Date.now();
        let clientThumbnail = null;

        if (targetBlob) {
          try {
            setUploadProgress(30);
            // Extraer miniatura nítida con Canvas en el navegador
            clientThumbnail = await extractClientThumbnail(targetBlob);
            setUploadProgress(50);

            const base64Data = await blobToBase64(targetBlob);
            setUploadProgress(75);

            const syncRes = await fetch(getApiUrl('/api/videos'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: uploadId,
                ...videoMeta,
                videoBase64: base64Data,
                thumbnailBase64: clientThumbnail,
                isUserUploaded: true,
              }),
            });

            if (syncRes.ok) {
              const resData = await syncRes.json();
              if (resData.video && resData.video.videoUrl) {
                persistentUrl = resData.video.videoUrl;
              }
            } else if (syncRes.status === 413) {
              throw new Error('El video es demasiado pesado para la nube (máx 50 MB). Por favor recórtalo a 2 minutos máximo.');
            }
          } catch (syncErr) {
            console.warn('Sync server fallback to memory:', syncErr);
            if (syncErr.message && syncErr.message.includes('50 MB')) {
              throw syncErr;
            }
          }
        }

        const thumbPath = `/uploads/thumbnails/${uploadId}.jpg`;
        uploadedVideo = {
          id: uploadId,
          videoUrl: persistentUrl,
          thumbnail: clientThumbnail || thumbPath,
          cover: clientThumbnail || thumbPath,
          ...videoMeta,
          isUserUploaded: true,
          stats: { likes: 1, comments: 0, bookmarks: 0, shares: 0, giftsCount: 0 },
          isLiked: true,
          isBookmarked: false,
          comments: [],
        };
      }

      setUploadProgress(100);
      onUploadSuccess(uploadedVideo, targetBlob);
      setPublishedVideoInfo(uploadedVideo);
      setIsSuccessSubmitted(true);
    } catch (err) {
      console.error('Error al subir video:', err);
      alert('Hubo un error al subir el video: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#0e111a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(255,184,0,0.12)] overflow-hidden flex flex-col max-h-[92vh] text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-[#131622]/80 backdrop-blur-md">
          {isSuccessSubmitted ? (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full border border-white/15 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <ArrowLeft size={14} />
              <span>Volver al Feed</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-5.5 rounded-md bg-gradient-to-tr from-[#ffb800] to-[#ffa000] flex items-center justify-center shadow-sm">
                <Film size={12} className="text-black" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">Publicar Video HD</h2>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title={isSuccessSubmitted ? "Volver al Feed" : "Cerrar"}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {isSuccessSubmitted ? (
          <div className="p-5 overflow-y-auto space-y-4 no-scrollbar text-center animate-in fade-in zoom-in-95 duration-300">
            {/* 1. Hero Celebration Badge con Aura Dorada/Esmeralda */}
            <div className="flex flex-col items-center justify-center pt-1 space-y-2.5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#ffb800]/25 via-emerald-500/20 to-[#ffa000]/20 border-2 border-[#ffb800] flex items-center justify-center text-[#ffb800] shadow-[0_0_35px_rgba(255,184,0,0.45)] animate-in zoom-in-75 duration-300">
                  <CheckCircle2 size={40} className="stroke-[2.5] text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-tr from-[#ffb800] to-[#ffa000] text-black flex items-center justify-center shadow-md animate-bounce">
                  <Sparkles size={14} className="fill-black" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black tracking-wider uppercase shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Video Publicado en Spot Play
                </span>
                <h3 className="text-lg font-black text-white tracking-tight pt-0.5">¡Tu contenido ya está en vivo!</h3>
                <p className="text-[11px] text-zinc-300 max-w-[280px] mx-auto leading-relaxed">
                  Ya está circulando en el feed <strong>Para Ti</strong> recibiendo vistas, likes y regalos virtuales.
                </p>
              </div>
            </div>

            {/* 2. Tarjeta Showcase Cinematográfica del Video Publicado */}
            {publishedVideoInfo && (
              <div className="p-3.5 bg-gradient-to-b from-[#1b1e2a]/80 to-[#10121a]/95 border border-white/10 rounded-2xl text-left space-y-2.5 shadow-xl backdrop-blur-md relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#ffb800]/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-20 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/15 shadow-md">
                    {publishedVideoInfo.videoUrl && (
                      <video
                        src={publishedVideoInfo.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        autoPlay
                        loop
                        playsInline
                      />
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                      <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center">
                        <Play size={10} className="text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                        HD 1080p
                      </span>
                      <span className="text-[9px] font-bold text-zinc-400">Ahora mismo</span>
                    </div>
                    <p className="text-xs font-bold text-white line-clamp-2 leading-snug">
                      {publishedVideoInfo.description || 'Nuevo video en Spot Play'}
                    </p>
                    {publishedVideoInfo.tags && publishedVideoInfo.tags.length > 0 && (
                      <p className="text-[10px] text-[#ffb800] truncate font-semibold">
                        {publishedVideoInfo.tags.map((t) => `#${t}`).join(' ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Banner de Monetización con Regalos Virtuales */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 border border-pink-500/20 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎁</span>
                    <div>
                      <span className="font-extrabold text-white text-[10px] block leading-tight">Regalos SpotCoins Activos</span>
                      <span className="text-[9px] text-zinc-400">Los espectadores pueden enviarte monedas</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[9px] border border-emerald-400/30">
                    ✓ Monetizando
                  </span>
                </div>
              </div>
            )}

            {/* 3. Acciones de Creador (Botones Studio de Alta Gama) */}
            <div className="space-y-2.5 pt-1">
              {/* Botón 1: Subir otro video de la galería */}
              <button
                type="button"
                onClick={handleUploadAnother}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#ffb800] via-[#ffa000] to-[#ff8800] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 shadow-[0_8px_25px_rgba(255,184,0,0.35)] active:scale-95 transition-all cursor-pointer"
              >
                <UploadCloud size={18} strokeWidth={2.5} />
                <span>Subir otro video de la galería</span>
              </button>

              {/* Botón 2: Grabar nuevo con cámara HD */}
              <button
                type="button"
                onClick={() => {
                  handleResetForm();
                  if (onOpenCamera) onOpenCamera();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <Camera size={18} className="text-[#ffb800]" />
                <span>Grabar nuevo con la Cámara HD</span>
              </button>

              {/* Botón 3: Ver mi video en el Feed */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Ir al Feed para verlo en vivo</span>
              </button>
            </div>
          </div>
        ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 24}px` : undefined,
            transition: 'padding-bottom 0.15s ease-out',
          }}
          className="p-4 overflow-y-auto space-y-4 no-scrollbar text-xs"
        >
          {/* Opción rápida: Grabar con Cámara */}
          {!videoPreview && (
            <button
              type="button"
              onClick={onOpenCamera}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-red-600/15 via-pink-600/15 to-purple-600/15 border border-red-500/30 hover:border-red-400 text-white font-bold text-xs flex items-center justify-between transition-all active:scale-98 shadow-md group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                  <Camera size={17} />
                </div>
                <div className="text-left">
                  <span className="font-extrabold text-white text-xs block">Grabar con Cámara en Vivo</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Abre el visor Full HD para grabar ahora</span>
                </div>
              </div>
              <ArrowRight size={15} className="text-zinc-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
          )}

          {/* Bóveda de selección de Galería (Studio Upload Portal) */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all ${
              videoPreview
                ? 'border-2 border-white/20 shadow-2xl h-56'
                : 'border-2 border-dashed border-[#ffb800]/40 hover:border-[#ffb800] bg-gradient-to-b from-[#181c28]/90 via-[#11131c]/95 to-[#0b0c12] hover:shadow-[0_0_30px_rgba(255,184,0,0.15)] p-5 flex flex-col items-center justify-center text-center min-h-[175px] group'
            }`}
          >
            {videoPreview ? (
              <div className="relative w-full h-full bg-black">
                <video
                  ref={uploadVideoRef}
                  src={videoPreview}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted={isUploadMuted}
                  onEnded={() => {
                    if (uploadVideoRef.current) {
                      uploadVideoRef.current.currentTime = 0;
                      uploadVideoRef.current.muted = isUploadMuted;
                      uploadVideoRef.current.play().catch(() => {});
                    }
                  }}
                />
                
                {/* Botón flotante para cambiar video */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="absolute top-2.5 left-2.5 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw size={11} className="text-[#ffb800]" />
                  <span>Cambiar video</span>
                </button>

                {/* Botón de Audio */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUploadMuted(!isUploadMuted);
                  }}
                  className={`absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-[10px] font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer ${
                    isUploadMuted ? 'bg-amber-400 text-black border-amber-300' : 'bg-black/75 text-white border-white/20'
                  }`}
                >
                  {isUploadMuted ? <VolumeX size={12} /> : <Volume2 size={12} className="text-[#ffb800]" />}
                  <span>{isUploadMuted ? 'Activar sonido 🔊' : 'Sonido ON'}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5 text-center pointer-events-none">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#ffb800]/20 via-[#ffa000]/10 to-transparent border border-[#ffb800]/40 flex items-center justify-center text-[#ffb800] shadow-[0_0_20px_rgba(255,184,0,0.2)] group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(255,184,0,0.4)] transition-all duration-300">
                  <UploadCloud size={26} strokeWidth={2.2} />
                </div>
                
                <div>
                  <p className="text-sm font-extrabold text-white group-hover:text-[#ffb800] transition-colors">
                    Toca para elegir video de la galería
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Formatos MP4 o WebM en alta definición vertical
                  </p>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-zinc-300">
                    📱 9:16 Vertical
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-emerald-300">
                    ⚡ HD 1080p
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-cyan-300">
                    🎵 Sonido Estéreo
                  </span>
                </div>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/*"
              className="hidden"
            />
          </div>

          {/* Descripción del Video */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
              Descripción del video
            </label>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escribe un título llamativo para tu video... #tendencia"
              className="w-full bg-[#161822]/90 border border-white/10 rounded-2xl p-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffb800] focus:ring-1 focus:ring-[#ffb800]/40 transition-all text-xs"
            />
          </div>

          {/* Hashtags y Categorías */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Hash size={13} className="text-[#ffb800]" />
                Hashtags en Tendencia
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">Toca para añadir</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="parati, spot play, viral, entretenimiento"
              className="w-full bg-[#161822]/90 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffb800] focus:ring-1 focus:ring-[#ffb800]/40 transition-all text-xs"
            />
            {/* Quick Hashtag Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {['#colombia', '#spotplay', '#parati', '#viral', '#musica', '#live', '#entretenimiento'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const clean = tag.replace('#', '');
                    const current = tags.split(',').map((t) => t.trim()).filter(Boolean);
                    if (!current.includes(clean)) {
                      setTags(current.length > 0 ? `${tags}, ${clean}` : clean);
                    }
                  }}
                  className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-[10px] font-medium hover:bg-[#ffb800]/20 hover:border-[#ffb800]/40 hover:text-[#ffb800] active:scale-95 transition-all cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 🎁 Tarjeta de Regalos Virtuales SpotCoins */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#171a26] to-[#12141d] border border-[#ffb800]/30 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ffb800]/20 to-[#ffa000]/10 border border-[#ffb800]/40 flex items-center justify-center text-xl shrink-0 shadow-sm">
                🎁
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  Permitir Regalos Virtuales
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ffb800]/20 text-[#ffb800] border border-[#ffb800]/40">
                    SpotCoins
                  </span>
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Tus seguidores podrán enviarte monedas que se abonan directo a tu billetera
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
              <input
                type="checkbox"
                checked={enableGifts}
                onChange={(e) => setEnableGifts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#ffb800] peer-checked:to-[#ffa000]"></div>
            </label>
          </div>

          {/* 🛍️ Módulo de Video Commerce: Vincular Producto a la Vitrina / WhatsApp */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#171a26] to-[#12141d] border border-amber-500/30 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
                  <ShoppingBag size={20} className="stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    ¿Es un Video Comercial?
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                      Vitrina
                    </span>
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Agrega un botón sobre el video para pedir este producto por WhatsApp
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
                <input
                  type="checkbox"
                  checked={isCommercialVideo}
                  onChange={(e) => setIsCommercialVideo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-amber-400 peer-checked:to-amber-500"></div>
              </label>
            </div>

            {/* Inputs de Producto Expandibles si está activo */}
            {isCommercialVideo && (
              <div className="pt-2 border-t border-white/10 space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Nombre del Producto o Promoción *
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ej. Hamburguesa Doble, Zapatillas Streetwear, Vestido..."
                    className="w-full bg-[#161822] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Precio en COP ($)
                    </label>
                    <input
                      type="number"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="Ej. 35000"
                      className="w-full bg-[#161822] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      WhatsApp de Pedidos
                    </label>
                    <input
                      type="tel"
                      value={productWhatsApp}
                      onChange={(e) => setProductWhatsApp(e.target.value)}
                      placeholder="Ej. 3101234567"
                      className="w-full bg-[#161822] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {isSubmitting && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-zinc-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ffb800] animate-pulse" />
                  Publicando video en Spot Play...
                </span>
                <span className="text-[#ffb800]">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#ffb800] via-[#ffa000] to-[#ff8800] transition-all duration-200 shadow-[0_0_12px_rgba(255,184,0,0.8)]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!videoPreview || isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-[#ffb800] via-[#ffa000] to-[#ff8800] hover:brightness-110 disabled:opacity-40 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_10px_25px_rgba(255,184,0,0.35)] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Publicando en Spot Play...</span>
            ) : (
              <>
                <Check size={18} strokeWidth={2.8} />
                <span>Publicar Video Ahora</span>
              </>
            )}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
