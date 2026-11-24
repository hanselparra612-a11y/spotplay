import React, { useState } from 'react';
import { 
  X, AlertTriangle, ShieldCheck, Flag, CheckCircle2, 
  EyeOff, UserX, ChevronRight, Lock
} from 'lucide-react';

const REPORT_REASONS = [
  {
    id: 'adult',
    icon: '🔞',
    title: 'Contenido para adultos o sexualmente explícito',
    description: 'Desnudez, pornografía o conductas de connotación sexual no permitidas.',
  },
  {
    id: 'violence',
    icon: '⚠️',
    title: 'Violencia, odio, amenazas o acoso',
    description: 'Agresiones, incitación al odio, discriminación o acoso a personas.',
  },
  {
    id: 'fraud',
    icon: '🚫',
    title: 'Estafa, fraude o productos prohibidos',
    description: 'Engaños económicos, venta de armas, medicamentos o artículos ilegales.',
  },
  {
    id: 'copyright',
    icon: '⚖️',
    title: 'Infracción de derechos de autor / Marca',
    description: 'Uso no autorizado de material con copyright o marcas comerciales.',
  },
  {
    id: 'spam',
    icon: '📢',
    title: 'Spam o publicidad engañosa',
    description: 'Contenido repetitivo, enlaces fraudulentos o falsas promociones.',
  },
  {
    id: 'dangerous',
    icon: '💊',
    title: 'Sustancias ilícitas o conductas peligrosas',
    description: 'Promoción de drogas, consumo indebido o desafíos que atentan contra la vida.',
  },
  {
    id: 'other',
    icon: '📝',
    title: 'Otro motivo no clasificado',
    description: 'Otras conductas que infrinjan los términos de uso y normas de Google Play.',
  },
];

export default function ReportModal({ isOpen, onClose, video, onSubmitReport }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [hideVideo, setHideVideo] = useState(true);
  const [blockCreator, setBlockCreator] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !video) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedReason) return;

    setIsSubmitting(true);

    const reportData = {
      id: `rep-${Date.now()}`,
      videoId: video.id,
      videoTitle: video.title || video.description?.slice(0, 60) || 'Video sin título',
      videoThumbnail: video.thumbnailUrl || video.cover || '',
      creatorId: video.author?.id || 'unknown',
      creatorUsername: video.author?.username || 'desconocido',
      reasonId: selectedReason,
      reasonTitle: REPORT_REASONS.find((r) => r.id === selectedReason)?.title || selectedReason,
      details: additionalDetails.trim(),
      hideVideo,
      blockCreator,
      createdAt: new Date().toISOString(),
      status: 'PENDING_REVIEW', // PENDING_REVIEW | RESOLVED | DISMISSED
    };

    setTimeout(() => {
      if (onSubmitReport) {
        onSubmitReport(reportData);
      }
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 600);
  };

  const handleClose = () => {
    setSelectedReason('');
    setAdditionalDetails('');
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#121318] border border-white/10 rounded-3xl p-5 text-white shadow-2xl relative max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <Flag size={16} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Denunciar Publicación</h2>
              <p className="text-[10px] text-zinc-400 font-medium">Normas de la Comunidad y Google Play</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pt-3 space-y-4 pr-1">
            {/* Tarjeta del video a denunciar */}
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="w-12 h-14 rounded-xl bg-zinc-800 overflow-hidden shrink-0 border border-white/10">
                {video.videoUrl ? (
                  <video src={video.videoUrl} className="w-full h-full object-cover" muted />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  @{video.author?.username || 'creador'}
                </p>
                <p className="text-[11px] text-zinc-300 line-clamp-1">
                  {video.description || video.title || 'Video de Spot Play'}
                </p>
                <span className="text-[9px] text-zinc-500">ID: {video.id}</span>
              </div>
            </div>

            {/* Selector de Motivos */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-2">
                Selecciona el motivo de la denuncia *:
              </label>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((reason) => {
                  const isSelected = selectedReason === reason.id;
                  return (
                    <div
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-red-500/15 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                          : 'bg-white/[0.03] border-white/5 hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0">{reason.icon}</span>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold ${isSelected ? 'text-red-300' : 'text-zinc-200'}`}>
                            {reason.title}
                          </p>
                          <p className="text-[10px] text-zinc-400 line-clamp-1">{reason.description}</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-red-400 bg-red-500' : 'border-zinc-600'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detalles adicionales */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Detalles adicionales (opcional):
              </label>
              <textarea
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Cuéntanos más sobre el problema o minuto específico..."
                rows={2}
                maxLength={300}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-red-400/50 resize-none"
              />
            </div>

            {/* Opciones de protección para el usuario */}
            <div className="p-3 rounded-2xl bg-black/30 border border-white/5 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={hideVideo}
                  onChange={(e) => setHideVideo(e.target.checked)}
                  className="rounded accent-red-500"
                />
                <span className="flex items-center gap-1.5">
                  <EyeOff size={13} className="text-zinc-400" />
                  <span>Ocultar este video inmediatamente de mi feed</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={blockCreator}
                  onChange={(e) => setBlockCreator(e.target.checked)}
                  className="rounded accent-red-500"
                />
                <span className="flex items-center gap-1.5">
                  <UserX size={13} className="text-zinc-400" />
                  <span>Bloquear a @{video.author?.username || 'este creador'}</span>
                </span>
              </label>
            </div>

            {/* Aviso de Compromiso Google */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[10px] text-amber-200/90 leading-tight">
              <AlertTriangle size={14} className="shrink-0 text-amber-400 mt-0.5" />
              <span>
                Las denuncias son anónimas y confidenciales. Nuestro equipo revisará el video en un plazo máximo de 24 horas y tomará medidas disciplinarias o de remoción si viola las normas.
              </span>
            </div>

            {/* Botón de Enviar */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!selectedReason || isSubmitting}
                className={`w-full py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  !selectedReason || isSubmitting
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                    : 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white hover:brightness-110 active:scale-98 shadow-red-500/20'
                }`}
              >
                {isSubmitting ? (
                  <span>Enviando denuncia...</span>
                ) : (
                  <>
                    <Flag size={14} className="stroke-[2.5]" />
                    <span>Enviar Denuncia</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Pantalla de Confirmación de Éxito */
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.3)]">
              <ShieldCheck size={36} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-white">Denuncia Registrada con Éxito</h3>
              <p className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed">
                Gracias por proteger la comunidad de Spot Play. Tu reporte ha sido recibido por el equipo de moderación oficial.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 max-w-xs mx-auto text-left space-y-1 text-[11px] text-zinc-400">
              <p className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 size={13} />
                <span>Video ocultado de tu feed</span>
              </p>
              {blockCreator && (
                <p className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 size={13} />
                  <span>Creador bloqueado en tu cuenta</span>
                </p>
              )}
              <p className="text-[10px] text-zinc-500 pt-1">
                Revisión estimada: Menos de 24 horas (Políticas Google Play & AdMob).
              </p>
            </div>

            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              Cerrar y volver al feed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
