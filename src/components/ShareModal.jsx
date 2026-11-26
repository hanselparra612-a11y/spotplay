import React, { useState } from 'react';
import { 
  X, Copy, Check, MessageCircle, Send, Download, 
  Share2, Sparkles, CheckCircle2, QrCode, Flag, EyeOff
} from 'lucide-react';

export default function ShareModal({ isOpen, onClose, video, onShareSuccess, onOpenReport, onHideVideo }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  if (!isOpen || !video) return null;

  // Construir URL limpia del video con soporte Open Graph para WhatsApp y Redes Sociales
  const shareUrl = `${window.location.origin}/v/${video.id}`;
  const shareTitle = `🎬 Mira este video de @${video.author?.username || 'Spot Play'}`;
  const shareText = `🔥 ¡Mira este video en Spot Play!: "${video.description?.slice(0, 80) || ''}..." 👇\n${shareUrl}`;

  const triggerShareCount = () => {
    if (onShareSuccess) {
      onShareSuccess(video.id);
    }
  };

  // 1. Motor de WhatsApp (Web y Móvil)
  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(shareText);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    triggerShareCount();
    onClose();
  };

  // 2. Motor de Telegram
  const handleShareTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
    triggerShareCount();
    onClose();
  };

  // 3. Motor Nativo del Celular (Web Share API para Instagram, Facebook, X, etc.)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        triggerShareCount();
        onClose();
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      // Si no tiene soporte nativo en desktop, copia el enlace directo
      handleCopyLink();
    }
  };

  // 4. Motor de Descarga de Video (.mp4)
  const handleDownloadVideo = async () => {
    if (!video.videoUrl) return;
    setDownloading(true);
    try {
      const response = await fetch(video.videoUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `SpotPlay-${video.author?.username || 'clip'}-${video.id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setFeedbackMsg('¡Video descargado!');
      triggerShareCount();
      setTimeout(() => {
        setFeedbackMsg('');
        onClose();
      }, 1200);
    } catch (e) {
      // Descarga directa por enlace si CORS restringe fetch
      const link = document.createElement('a');
      link.href = video.videoUrl;
      link.download = `SpotPlay-${video.id}.mp4`;
      link.target = '_blank';
      link.click();
      triggerShareCount();
      onClose();
    } finally {
      setDownloading(false);
    }
  };

  // 5. Motor de Copiar Enlace Directo
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        triggerShareCount();
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      triggerShareCount();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Canales de Compartir configurados
  const shareChannels = [
    {
      id: 'wa',
      name: 'WhatsApp',
      icon: MessageCircle,
      action: handleShareWhatsApp,
      color: 'bg-gradient-to-tr from-emerald-600 to-green-500 text-white shadow-emerald-500/20',
      badge: 'Popular',
    },
    {
      id: 'native',
      name: 'Más Apps',
      icon: Share2,
      action: handleNativeShare,
      color: 'bg-gradient-to-tr from-[#ffb800] to-[#ff8800] text-black shadow-amber-500/20',
      badge: 'Instagram/FB',
    },
    {
      id: 'tg',
      name: 'Telegram',
      icon: Send,
      action: handleShareTelegram,
      color: 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-sky-500/20',
    },
    {
      id: 'down',
      name: downloading ? 'Guardando...' : 'Descargar',
      icon: Download,
      action: handleDownloadVideo,
      color: 'bg-gradient-to-tr from-zinc-700 to-zinc-800 text-white border border-white/10',
    },
  ];

  return (
    <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200 select-none">
      {/* Fondo cerrable */}
      <div className="flex-1" onClick={onClose} />

      {/* Sheet Panel */}
      <div className="bg-gradient-to-b from-[#181a24] to-[#111219] rounded-t-3xl p-4.5 pb-7 shadow-2xl border-t border-white/10 animate-in slide-in-from-bottom duration-200 flex flex-col gap-4 text-white">
        
        {/* Cabecera del Modal con miniatura del video */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/50 border border-white/10 shrink-0 relative">
              <video
                src={video.videoUrl}
                poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                className="w-full h-full object-cover"
                muted
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
            <div className="truncate">
              <h3 className="text-xs font-black text-white flex items-center gap-1">
                <span>Compartir video</span>
                <Sparkles size={12} className="text-[#ffb800]" />
              </h3>
              <p className="text-[10px] text-zinc-400 truncate">
                de @{video.author?.username || 'creador'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer active:scale-90"
          >
            <X size={16} />
          </button>
        </div>

        {/* Canales de Compartir */}
        <div className="grid grid-cols-4 gap-3 text-center">
          {shareChannels.map((channel) => {
            const Icon = channel.icon;
            return (
              <button
                key={channel.id}
                onClick={channel.action}
                className="flex flex-col items-center gap-1.5 group active:scale-92 transition-transform cursor-pointer"
              >
                <div
                  className={`w-13 h-13 rounded-2xl ${channel.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-all`}
                >
                  <Icon size={22} className={channel.id === 'native' ? 'stroke-[2.5]' : ''} />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-zinc-200 group-hover:text-white transition-colors">
                    {channel.name}
                  </span>
                  {channel.badge && (
                    <span className="text-[8px] font-extrabold text-[#ffb800] uppercase tracking-tighter">
                      {channel.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Input de Copiar Enlace Directo */}
        <div className="flex items-center gap-2 bg-[#12141c] rounded-2xl p-1.5 pl-3 border border-white/10 shadow-inner">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent text-[11px] font-mono text-zinc-300 outline-none select-all truncate"
          />
          <button
            onClick={handleCopyLink}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-[#ffb800] to-[#ffa000] text-black shadow-md hover:scale-102 active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check size={14} className="stroke-[3]" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>

        {/* Acciones de Seguridad y Moderación (Obligatorio Google Play & AdMob) */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              onClose();
              if (onOpenReport) onOpenReport(video);
            }}
            className="flex-1 py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Denunciar video a moderación según normas Google"
          >
            <Flag size={14} className="stroke-[2.5]" />
            <span>Denunciar</span>
          </button>
          <button
            onClick={() => {
              onClose();
              if (onHideVideo) onHideVideo(video.id);
            }}
            className="flex-1 py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Ocultar esta publicación de tu feed"
          >
            <EyeOff size={14} />
            <span>No me interesa</span>
          </button>
        </div>

        {/* Mensaje de Feedback flotante si descarga */}
        {feedbackMsg && (
          <div className="text-center text-xs font-bold text-emerald-400 bg-emerald-500/10 py-1.5 rounded-xl border border-emerald-500/20 animate-in fade-in duration-150">
            {feedbackMsg}
          </div>
        )}

      </div>
    </div>
  );
}
