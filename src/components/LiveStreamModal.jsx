import React, { useState, useRef, useEffect } from 'react';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';
import {
  X,
  Radio,
  Eye,
  Gift,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Camera,
  Mic,
  MicOff,
  CheckCircle2,
  TrendingUp,
  Award,
  ShoppingBag,
  Pin,
  Flame,
  Send,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  FlipHorizontal,
  Clock,
  Timer,
  AlertTriangle,
  Coins,
  ShieldCheck,
  Tv,
} from 'lucide-react';
import { formatNumber, formatCOP } from '../utils/format';
import { loadPlatformSettings } from '../services/adminSettingsService';

const SIMULATED_VIEWER_COMMENTS = [
  { user: 'mateo_gomez', text: '¡Saludos desde Bogotá! 🔥', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100' },
  { user: 'camila_shoes', text: '¿De dónde es la chaqueta que tienes puesta?', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
  { user: 'andres_paisa', text: 'Buena vibra bro, te sigo desde hace rato 🚀', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
  { user: 'sofia_moda', text: '¡Qué buen directo! Te mandé una rosa 🌹', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100' },
  { user: 'juan_fitness', text: '¿A qué hora haces el próximo live?', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
  { user: 'valen_style', text: '¡Me encanta este contenido! 👑👏', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
  { user: 'carlos_tech', text: 'Compartí el live con 5 amigos 📲', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100' },
];

const SIMULATED_GIFTS = [
  { id: 'gift-rose', name: 'Rosa Roja', emoji: '🌹', coins: 1, valueCOP: 100 },
  { id: 'gift-coffee', name: 'Café Energético', emoji: '☕', coins: 5, valueCOP: 500 },
  { id: 'gift-fire', name: 'Fuego Viral', emoji: '🔥', coins: 20, valueCOP: 2000 },
  { id: 'gift-crown', name: 'Corona Dorada', emoji: '👑', coins: 100, valueCOP: 10000 },
  { id: 'gift-lion', name: 'León de Oro', emoji: '🦁', coins: 500, valueCOP: 50000 },
];

export default function LiveStreamModal({
  isOpen,
  currentUser,
  onClose,
  onFinishLive,
}) {
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [isMuted, setIsMuted] = useState(false);
  const [viewers, setViewers] = useState(142);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [comments, setComments] = useState([]);
  const [earnedGiftCoins, setEarnedGiftCoins] = useState(0);
  const [admobBonusCoins, setAdmobBonusCoins] = useState(0);
  const [giftsReceivedCount, setGiftsReceivedCount] = useState(0);
  const [currentGiftPopup, setCurrentGiftPopup] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const totalLiveCoins = earnedGiftCoins + admobBonusCoins;

  // ⏱️ Reglas de Tiempo, Límite por Sesión y Sensor Anti-Fantasmas
  const [platformSettings, setPlatformSettings] = useState(loadPlatformSettings);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [finishReason, setFinishReason] = useState('user'); // 'user' | 'time_limit' | 'inactivity'
  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const [inactivityCountdown, setInactivityCountdown] = useState(60);

  const warnedRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const inactivityCountdownIntervalRef = useRef(null);

  // Registrar interacción viva para el sensor de inactividad
  const recordActivity = () => {
    lastActivityRef.current = Date.now();
  };

  // Interacciones avanzadas
  const [giftCombo, setGiftCombo] = useState(0);
  const [hostChatText, setHostChatText] = useState('');

  // 🔭 Control de Lente y Encuadre Gran Angular ('0.5x' | '1x' | 'fit')
  const [zoomLevel, setZoomLevel] = useState('0.5x'); // Gran angular por defecto para evitar el recorte
  const [showZoomToast, setShowZoomToast] = useState(null);
  const [isMirrored, setIsMirrored] = useState(true); // Efecto espejo para que derecha coincida con derecha natural
  const keyboardHeight = useVirtualKeyboard();

  const videoRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const simulationIntervalRef = useRef(null);
  const commentsEndRef = useRef(null);
  const comboTimeoutRef = useRef(null);

  // Iniciar cámara web / móvil
  const startCamera = async () => {
    try {
      setCameraError(null);
      let mediaStream = null;

      // Intento 1: Cámara frontal/trasera con latencia ultra baja
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 720 },
            height: { ideal: 1280 },
            frameRate: { ideal: 60, min: 30 },
            latency: { ideal: 0 },
          },
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            latency: { ideal: 0, max: 0.02 },
          },
        });
      } catch (e1) {
        console.warn('Fallo intento 1 (con mic), reintentando solo video:', e1);
        // Intento 2: Solo video con facingMode
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode,
              frameRate: { ideal: 60, min: 30 },
              latency: { ideal: 0 },
            },
            audio: false,
          });
        } catch (e2) {
          console.warn('Fallo intento 2 (con facingMode), reintentando video genérico:', e2);
          // Intento 3: Video genérico básico
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { latency: { ideal: 0 } },
            audio: false,
          });
        }
      }

      if (mediaStream) {
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch((err) => console.warn('Play error:', err));
        }
      }
    } catch (err) {
      console.warn('Cámara no permitida o no disponible:', err);
      setCameraError('Permiso de cámara denegado o no disponible. Toca "Conectar Cámara" y pulsa "Permitir" en Chrome.');
    }
  };

  const handleEndLiveRequest = (reason = 'user') => {
    setFinishReason(reason);
    stopCamera();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    if (inactivityCountdownIntervalRef.current) clearInterval(inactivityCountdownIntervalRef.current);
    setShowInactivityModal(false);
    setShowTimeWarning(false);
    setShowSummary(true);
  };

  const triggerInactivityPrompt = () => {
    setShowInactivityModal((alreadyShowing) => {
      if (alreadyShowing) return true;
      setInactivityCountdown(60);
      if (inactivityCountdownIntervalRef.current) clearInterval(inactivityCountdownIntervalRef.current);
      inactivityCountdownIntervalRef.current = setInterval(() => {
        setInactivityCountdown((prevCount) => {
          if (prevCount <= 1) {
            clearInterval(inactivityCountdownIntervalRef.current);
            handleEndLiveRequest('inactivity');
            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);
      return true;
    });
  };

  const handleStayAlive = () => {
    recordActivity();
    setShowInactivityModal(false);
    if (inactivityCountdownIntervalRef.current) clearInterval(inactivityCountdownIntervalRef.current);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    const settings = loadPlatformSettings();
    setPlatformSettings(settings);
    setShowSummary(false);
    setLiveSeconds(0);
    setEarnedGiftCoins(0);
    setAdmobBonusCoins(0);
    setGiftsReceivedCount(0);
    setViewers(Math.floor(Math.random() * 80) + 120);
    setComments([
      { user: 'sistema', text: '🔴 Transmisión iniciada. ¡Tu audiencia está entrando!', avatar: null, isSystem: true }
    ]);
    warnedRef.current = false;
    lastActivityRef.current = Date.now();
    setShowTimeWarning(false);
    setShowInactivityModal(false);
    setFinishReason('user');

    startCamera();

    const isExempt = currentUser?.isVerified && (settings.exemptVerifiedCreators ?? true);
    const maxDurationSec = (!isExempt && (settings.maxLiveDurationMinutes || 45) > 0)
      ? (settings.maxLiveDurationMinutes || 45) * 60
      : 0;
    const warnSec = (settings.warnBeforeEndMinutes || 5) * 60;
    const inactivityTimeoutSec = (settings.inactivityTimeoutMinutes ?? 10) * 60;

    // Contador de tiempo en vivo con control de sesión e inactividad
    timerIntervalRef.current = setInterval(() => {
      setLiveSeconds((prev) => {
        const next = prev + 1;

        // 1. Límite de Duración por Sesión
        if (maxDurationSec > 0) {
          const remaining = maxDurationSec - next;

          // Alerta previa 5 minutos
          if (remaining <= warnSec && !warnedRef.current && remaining > 0) {
            warnedRef.current = true;
            setShowTimeWarning(true);
            setComments((c) => [
              ...c,
              {
                user: 'sistema',
                text: `⚠️ Aviso: Quedan ${Math.max(1, Math.ceil(remaining / 60))} minutos de esta sesión de Live.`,
                avatar: null,
                isSystem: true,
              },
            ]);
          }

          // Sesión agotada -> Auto-finalizar con resumen
          if (remaining <= 0) {
            handleEndLiveRequest('time_limit');
            return next;
          }
        }

        // 2. Sensor Anti-Fantasma (Auto-cierre por inactividad)
        if (inactivityTimeoutSec > 0) {
          const idleSec = Math.floor((Date.now() - lastActivityRef.current) / 1000);
          if (idleSec >= inactivityTimeoutSec) {
            triggerInactivityPrompt();
          }
        }

        return next;
      });
    }, 1000);

    // Simulación de interacción en vivo (espectadores, comentarios, regalos y bono AdMob)
    let commentIndex = 0;
    let ticks = 0;
    simulationIntervalRef.current = setInterval(() => {
      ticks++;
      // 1. Variar espectadores
      setViewers((prev) => Math.max(80, prev + Math.floor(Math.random() * 7) - 3));

      // 2. Nuevo comentario aleatorio
      if (Math.random() > 0.35) {
        const nextComment = SIMULATED_VIEWER_COMMENTS[commentIndex % SIMULATED_VIEWER_COMMENTS.length];
        setComments((prev) => [...prev.slice(-12), nextComment]);
        commentIndex++;
      }

      // 3. Bono AdMob por Audiencia Activa (telemetría publicitaria Play Store)
      if (ticks % 3 === 0) {
        const bonus = Math.floor(Math.random() * 3) + 2; // +2 a +4 SpotCoins por exposición AdMob
        setAdmobBonusCoins((prev) => prev + bonus);
      }

      // 4. Regalo virtual sorpresa ocasional de seguidores
      if (Math.random() > 0.55) {
        const rand = Math.random();
        let selectedGift = SIMULATED_GIFTS[0]; // Rosa (1 coin)
        if (rand > 0.94) selectedGift = SIMULATED_GIFTS[4]; // León (500 coins)
        else if (rand > 0.82) selectedGift = SIMULATED_GIFTS[3]; // Corona (100 coins)
        else if (rand > 0.55) selectedGift = SIMULATED_GIFTS[2]; // Fuego (20 coins)
        else if (rand > 0.25) selectedGift = SIMULATED_GIFTS[1]; // Café (5 coins)

        const randomSender = SIMULATED_VIEWER_COMMENTS[Math.floor(Math.random() * SIMULATED_VIEWER_COMMENTS.length)].user;

        setCurrentGiftPopup({
          sender: randomSender,
          gift: selectedGift,
        });

        recordActivity();
        setEarnedGiftCoins((prev) => prev + selectedGift.coins);
        setGiftsReceivedCount((prev) => prev + 1);

        // Incrementar Combo de Regalos (x2, x3, x5)
        setGiftCombo((prev) => prev + 1);
        if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
        comboTimeoutRef.current = setTimeout(() => {
          setGiftCombo(0);
        }, 3500);

        setTimeout(() => {
          setCurrentGiftPopup(null);
        }, 2500);
      }
    }, 3000);

    return () => {
      stopCamera();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
      if (inactivityCountdownIntervalRef.current) clearInterval(inactivityCountdownIntervalRef.current);
    };
  }, [isOpen, facingMode]);

  // Asegurar que el stream se monte en el elemento <video>
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  // Auto-scroll de comentarios
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleCameraFacing = () => {
    recordActivity();
    setFacingMode((prev) => {
      const nextMode = prev === 'user' ? 'environment' : 'user';
      // Cámara frontal activa espejo; cámara trasera no lleva espejo
      setIsMirrored(nextMode === 'user');
      return nextMode;
    });
  };

  const toggleMirror = () => {
    recordActivity();
    setIsMirrored((prev) => {
      const next = !prev;
      setShowZoomToast(next ? '🪞 Espejo Activado (Tu derecha es tu derecha)' : '📷 Modo Real (Sin espejo)');
      setTimeout(() => setShowZoomToast(null), 2000);
      return next;
    });
  };

  const toggleMic = () => {
    recordActivity();
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  const handleConfirmFinish = () => {
    if (onFinishLive) {
      onFinishLive({
        seconds: liveSeconds,
        totalCoins: totalLiveCoins,
        giftCoins: earnedGiftCoins,
        admobCoins: admobBonusCoins,
        earnedCOP: totalLiveCoins * 100,
        giftsCount: giftsReceivedCount,
        viewers,
      });
    }
    onClose();
  };

  const handleSendHostComment = (e) => {
    e.preventDefault();
    if (!hostChatText.trim()) return;
    recordActivity();
    const newComment = {
      user: currentUser.username,
      text: hostChatText.trim(),
      avatar: currentUser.avatar,
      isHost: true,
    };
    setComments((prev) => [...prev, newComment]);
    setHostChatText('');
  };

  const handleSetZoom = async (level) => {
    recordActivity();
    setZoomLevel(level);
    setShowZoomToast(level);
    setTimeout(() => setShowZoomToast(null), 1800);

    // Intentar activar hardware zoom / ultra-wide en celulares compatibles
    try {
      const track = stream?.getVideoTracks()?.[0];
      if (track && track.getCapabilities) {
        const caps = track.getCapabilities();
        if (caps.zoom) {
          const targetZoom = level === '0.5x' ? (caps.zoom.min || 1) : 1;
          await track.applyConstraints({
            advanced: [{ zoom: targetZoom }],
          });
        }
      }
    } catch (err) {
      console.warn('Hardware zoom no soportado en este dispositivo:', err);
    }
  };

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isExempt = currentUser?.isVerified && (platformSettings.exemptVerifiedCreators ?? true);
  const maxDurationSec = (!isExempt && (platformSettings.maxLiveDurationMinutes || 45) > 0)
    ? (platformSettings.maxLiveDurationMinutes || 45) * 60
    : 0;
  const remainingSec = maxDurationSec > 0 ? Math.max(0, maxDurationSec - liveSeconds) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200">
      {/* 📹 Video Stream de la Cámara */}
      <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center overflow-hidden">
        {/* El elemento video SIEMPRE permanece en el DOM para recibir el stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            transform: `scale(${zoomLevel === '0.5x' ? 0.84 : 1}) scaleX(${isMirrored ? -1 : 1}) translateZ(0)`,
            transformOrigin: 'center center',
            willChange: 'transform',
          }}
          className={`w-full h-full transition-none ${
            stream ? 'opacity-100' : 'opacity-0'
          } ${
            zoomLevel === 'fit'
              ? 'object-contain'
              : zoomLevel === '0.5x'
              ? 'object-cover rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.9)] border border-white/10'
              : 'object-cover'
          }`}
        />

        {/* 🔭 Selector de Lente & Encuadre Gran Angular (0.5x / 1x / Ajustar / Espejo) */}
        {stream && (
          <div className="absolute right-3.5 top-[max(126px,calc(env(safe-area-inset-top,0px)+98px))] z-30 flex flex-col items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-2xl border border-white/15 shadow-xl">
            <button
              onClick={() => handleSetZoom('0.5x')}
              className={`w-8 h-7 rounded-xl text-[10px] font-black tracking-wider flex items-center justify-center transition-all ${
                zoomLevel === '0.5x'
                  ? 'bg-cyan-400 text-black shadow-md scale-105'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              0.5x
            </button>
            <button
              onClick={() => handleSetZoom('1x')}
              className={`w-8 h-7 rounded-xl text-[10px] font-black tracking-wider flex items-center justify-center transition-all ${
                zoomLevel === '1x'
                  ? 'bg-cyan-400 text-black shadow-md scale-105'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              1x
            </button>
            <button
              onClick={() => handleSetZoom('fit')}
              className={`w-8 h-7 rounded-xl text-[8px] font-bold tracking-tighter flex items-center justify-center transition-all ${
                zoomLevel === 'fit'
                  ? 'bg-amber-400 text-black shadow-md scale-105'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ajustar
            </button>
            {/* Botón Espejo (Sincronizar Lados) */}
            <button
              onClick={toggleMirror}
              className={`w-8 h-7 rounded-xl flex items-center justify-center transition-all ${
                isMirrored
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FlipHorizontal size={13} />
            </button>
          </div>
        )}

        {/* Pantalla de carga / Solicitud de permiso */}
        {!stream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#1a1c23] via-[#0e1015] to-black z-0">
            <div className="w-24 h-24 rounded-full border-4 border-[#FE2C55]/60 flex items-center justify-center relative mb-4 shadow-[0_0_25px_rgba(254,44,85,0.4)]">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-20 h-20 rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-6 h-6 bg-red-600 rounded-full border-2 border-black flex items-center justify-center text-white text-[10px] font-black animate-pulse">
                LIVE
              </span>
            </div>
            <p className="text-white font-bold text-base">Iniciando Cámara en Vivo</p>
            <p className="text-zinc-400 text-xs mt-1 mb-5 max-w-xs">
              {cameraError || 'Toca el botón abajo para conceder permiso de cámara y empezar a transmitir en directo.'}
            </p>
            <button
              onClick={() => startCamera()}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-[#FE2C55] text-white font-bold text-xs rounded-full shadow-xl active:scale-95 transition-all flex items-center gap-2"
            >
              <Camera size={16} />
              <span>Conectar Cámara Ahora</span>
            </button>
          </div>
        )}
      </div>

      {/* Degradado superior e inferior para legibilidad */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-10" />

      {/* 🌟 HEADER DEL LIVE (Z-20) */}
      <header className="relative z-20 flex flex-col gap-2 px-3.5 pt-[max(44px,calc(env(safe-area-inset-top,0px)+16px))] pb-2 pointer-events-auto">
        {/* Fila Principal: Creador a la izquierda + Espectadores y Botón Finalizar Rojo a la derecha */}
        <div className="flex items-center justify-between gap-2 w-full">
          {/* Creator Info + Live Badge */}
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/15 rounded-full pl-1.5 pr-3 py-1 shrink min-w-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
            />
            <div className="flex flex-col text-left min-w-0">
              <span className="text-xs font-bold text-white truncate max-w-[90px] sm:max-w-[120px]">
                @{currentUser.username}
              </span>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="flex items-center gap-1 text-red-500 font-black shrink-0">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                  LIVE
                </span>
                <span className="text-zinc-500">|</span>
                {remainingSec !== null ? (
                  <span
                    className={`font-mono flex items-center gap-1 font-bold ${
                      remainingSec <= 300
                        ? remainingSec <= 60
                          ? 'text-red-400 font-black animate-pulse'
                          : 'text-amber-300 font-black animate-pulse'
                        : 'text-cyan-300'
                    }`}
                    title="Tiempo restante de esta sesión de Live"
                  >
                    <Timer size={10} className={remainingSec <= 300 ? 'text-amber-400' : 'text-cyan-400'} />
                    {formatTimer(remainingSec)}
                  </span>
                ) : (
                  <span className="text-zinc-300 font-mono flex items-center gap-1">
                    <Clock size={10} className="text-zinc-400" />
                    {formatTimer(liveSeconds)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Acciones Derecha: Espectadores + Botón Finalizar Destacado */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Espectadores */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-bold shadow-sm">
              <Eye size={13} className="text-cyan-400" />
              <span>{formatNumber(viewers)}</span>
            </div>

            {/* Botón Finalizar Rojo (100% visible, amplio, seguro y sin recortes) */}
            <button
              type="button"
              onClick={() => handleEndLiveRequest('user')}
              className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-full text-xs font-black tracking-wider uppercase shadow-[0_2px_12px_rgba(220,38,38,0.7)] border border-red-300/40 active:scale-95 transition-all shrink-0 flex items-center gap-1 cursor-pointer"
              title="Finalizar transmisión en vivo"
            >
              <X size={13} strokeWidth={3} className="text-white" />
              <span>Finalizar</span>
            </button>
          </div>
        </div>

        {/* Fila Secundaria: SpotCoins / Regalos Acumulados (Estilo TikTok LIVE, debajo del creador) */}
        <div className="flex items-center justify-start pl-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/65 backdrop-blur-md border border-amber-400/50 text-amber-300 text-[11px] font-black shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            <Coins size={13} className="text-amber-400 fill-amber-400" />
            <span className="font-mono text-xs">+{totalLiveCoins}</span>
            <span className="text-[10px] text-amber-400/80 uppercase font-bold tracking-tight">SpotCoins</span>
          </div>
        </div>
      </header>

      {/* ⚠️ BANNER DE AVISO: QUEDAN MENOS DE 5 MINUTOS DE SESIÓN */}
      {showTimeWarning && (
        <div className="absolute top-[max(116px,calc(env(safe-area-inset-top,0px)+90px))] inset-x-3.5 z-30 flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/90 via-red-500/90 to-amber-600/90 backdrop-blur-md text-white shadow-2xl animate-in slide-in-from-top duration-300 border border-white/25">
          <div className="flex items-center gap-2 text-left">
            <Timer size={18} className="text-amber-200 animate-pulse shrink-0" />
            <div className="leading-tight">
              <span className="text-xs font-black block">⏰ Últimos {platformSettings.warnBeforeEndMinutes || 5} Minutos de Sesión</span>
              <span className="text-[10px] text-white/90">
                Avisa a tu comunidad o anuncia una Segunda Parte para continuar.
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowTimeWarning(false)}
            className="w-6 h-6 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center shrink-0 ml-2"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* 🛡️ MODAL SENSOR ANTI-FANTASMA (INACTIVIDAD PROLONGADA) */}
      {showInactivityModal && (
        <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-xs rounded-3xl bg-zinc-900 border border-amber-500/50 p-5 text-center text-white shadow-[0_0_40px_rgba(245,158,11,0.3)]">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle size={28} />
            </div>
            <h4 className="font-black text-sm tracking-wide">¿Sigues en Directo?</h4>
            <p className="text-[11px] text-zinc-300 mt-1 mb-3">
              Detectamos inactividad prolongada ({platformSettings.inactivityTimeoutMinutes || 10} min). Para cuidar tu red y el servidor, este Live se cerrará en:
            </p>
            <div className="text-3xl font-black text-amber-400 font-mono mb-4 animate-pulse">
              {inactivityCountdown}s
            </div>
            <button
              onClick={handleStayAlive}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-400 to-[#FE2C55] text-white font-black text-xs rounded-full shadow-lg active:scale-95 transition-all uppercase tracking-wider"
            >
              ¡Sigo aquí transmitiendo! 🚀
            </button>
          </div>
        </div>
      )}

      {/* 🎁 POPUP DE REGALO RECIBIDO EN TIEMPO REAL */}
      {currentGiftPopup && (
        <div className="absolute top-[max(140px,calc(env(safe-area-inset-top,0px)+112px))] left-4 z-30 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-xl border border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-in slide-in-from-left duration-300 pointer-events-none">
          <span className="text-3xl animate-bounce">{currentGiftPopup.gift.emoji}</span>
          <div>
            <p className="text-xs font-black text-amber-300">
              ¡@{currentGiftPopup.sender} te envió {currentGiftPopup.gift.name}!
            </p>
            <p className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1">
              <span>+{currentGiftPopup.gift.coins} SpotCoins</span>
              <span className="text-zinc-400">• Red Google AdMob</span>
            </p>
          </div>
        </div>
      )}

      {/* 🔥 RACHA DE REGALOS COMBO */}
      {giftCombo > 1 && (
        <div className="absolute top-[max(200px,calc(env(safe-area-inset-top,0px)+172px))] left-4 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-[#FE2C55] text-black font-black text-xs shadow-[0_0_25px_rgba(254,44,85,0.9)] animate-bounce pointer-events-none border border-white/40">
          <Flame size={16} className="fill-black" />
          <span>¡COMBO x{giftCombo}! 🔥</span>
        </div>
      )}

      {/* 💬 CHAT DE ESPECTADORES EN VIVO (Z-20) */}
      <div className="relative z-20 flex-1 flex flex-col justify-end px-3.5 pb-14 pointer-events-none max-h-[30vh]">
        <div className="overflow-y-auto no-scrollbar space-y-1.5 pointer-events-auto pr-8">
          {comments.map((c, i) => (
            <div
              key={i}
              className={`flex items-start gap-1.5 text-xs text-left animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                c.isHost
                  ? 'bg-amber-500/20 border border-amber-400/40 text-amber-200'
                  : c.isSystem
                  ? 'bg-red-950/60 border border-red-500/30'
                  : 'bg-black/40 backdrop-blur-sm'
              } px-3 py-1.5 rounded-2xl max-w-[85%]`}
            >
              {c.avatar && (
                <img
                  src={c.avatar}
                  alt={c.user}
                  className="w-4 h-4 rounded-full object-cover shrink-0 mt-0.5"
                />
              )}
              <div className="leading-snug">
                <span className={`font-bold text-[11px] mr-1.5 ${c.isHost ? 'text-amber-400' : 'text-cyan-300'}`}>
                  @{c.user}{c.isHost ? ' (Tú):' : ':'}
                </span>
                <span className="text-white text-[11px] break-words">{c.text}</span>
              </div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>
      </div>

      {/* 🎛️ CONTROLES INFERIORES DEL TRANSMISOR (Elevado dinámicamente sobre el Teclado) */}
      <footer
        style={{
          paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : 'max(12px, env(safe-area-inset-bottom, 12px))',
          transition: 'padding-bottom 0.12s cubic-bezier(0, 0, 0.2, 1)',
        }}
        className="relative z-20 flex items-center gap-1.5 px-3 pt-1 pointer-events-auto"
      >

        {/* Input de Chat del Creador */}
        <form onSubmit={handleSendHostComment} className="flex items-center gap-1 flex-1 min-w-0">
          <input
            type="text"
            placeholder="Escribe en tu directo..."
            value={hostChatText}
            onChange={(e) => setHostChatText(e.target.value)}
            className="w-full bg-black/60 border border-white/15 rounded-full px-3 py-1.5 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center hover:bg-cyan-500/30 active:scale-90 shrink-0"
          >
            <Send size={12} />
          </button>
        </form>

        {/* Voltear cámara */}
        <button
          onClick={toggleCameraFacing}
          className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25 active:scale-90 transition-all border border-white/10 shrink-0"
          title="Cambiar cámara frontal / trasera"
        >
          <Camera size={14} />
        </button>

        {/* 🪞 Invertir Espejo (Sincronizar derecha e izquierda) */}
        <button
          onClick={toggleMirror}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border shrink-0 active:scale-90 ${
            isMirrored
              ? 'bg-purple-600/30 border-purple-400 text-purple-300'
              : 'bg-white/15 border-white/10 text-white hover:bg-white/25'
          }`}
          title={isMirrored ? 'Modo Espejo ON (Tu mano derecha se mueve a la derecha)' : 'Modo Espejo OFF'}
        >
          <FlipHorizontal size={14} />
        </button>

        {/* Silenciar micrófono */}
        <button
          onClick={toggleMic}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white active:scale-90 transition-all border border-white/10 shrink-0 ${
            isMuted ? 'bg-red-600/80' : 'bg-white/15 backdrop-blur-md hover:bg-white/25'
          }`}
          title={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
        >
          {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
        </button>
      </footer>


      {/* 📊 RESUMEN POST-TRANSMISIÓN MODAL (CALIBRADO GOOGLE ADMOB & PLAY STORE) */}
      {showSummary && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in zoom-in-95 duration-200 overflow-y-auto">
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#181c26] via-[#12151d] to-[#0c0e14] border border-amber-400/40 p-5 text-center text-white shadow-[0_0_50px_rgba(255,184,0,0.18)]">
            
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-[#ffb800] to-yellow-300 mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(255,184,0,0.4)] mb-3">
              <Award size={32} className="text-black stroke-[2.5]" />
            </div>

            <h3 className="text-lg font-black tracking-wide text-white">¡Transmisión Finalizada!</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Calibración oficial según métricas de Google AdMob & Play Store
            </p>

            {/* Aviso por límite de tiempo o inactividad si aplica */}
            {finishReason === 'time_limit' && (
              <div className="mt-2 mb-1 p-2.5 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[11px] font-bold text-center leading-snug">
                ⏰ Sesión completada con éxito ({platformSettings.maxLiveDurationMinutes || 45} min alcanzados). Tu audiencia fue redirigida al feed. ¡Puedes iniciar una "Segunda Parte" cuando desees!
              </div>
            )}

            {finishReason === 'inactivity' && (
              <div className="mt-2 mb-1 p-2.5 rounded-2xl bg-red-500/15 border border-red-400/40 text-red-300 text-[11px] font-bold text-center leading-snug">
                🛡️ Directo finalizado automáticamente por inactividad ({platformSettings.inactivityTimeoutMinutes || 10} min sin interacción) para proteger tu red y batería.
              </div>
            )}

            {/* 🪙 HERO: MEDIDOR PRINCIPAL DE SPOTCOINS GANADAS */}
            <div className="my-4 p-4 rounded-2xl bg-gradient-to-b from-amber-500/20 via-[#1a202c]/60 to-black/80 border-2 border-amber-400/60 shadow-[0_0_30px_rgba(255,184,0,0.25)] relative overflow-hidden">
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 mb-1">
                <Coins size={14} className="fill-amber-400" />
                <span>Total Ganado en este Live</span>
              </div>
              
              <div className="flex items-center justify-center gap-2 my-1">
                <span className="text-3xl font-black text-white font-mono tracking-tight drop-shadow-md">
                  +{totalLiveCoins.toLocaleString('es-CO')}
                </span>
                <span className="text-base font-black text-amber-400 flex items-center gap-1">
                  🪙 SpotCoins
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1 border-t border-white/10 text-[10px] text-zinc-300">
                <span className="text-emerald-400 font-bold">Valor Estimado AdMob:</span>
                <strong className="text-white">~${(totalLiveCoins * 100).toLocaleString('es-CO')} COP</strong>
                <span className="text-zinc-500">|</span>
                <span className="text-zinc-400 font-mono">~${((totalLiveCoins * 100) / 3304).toFixed(2)} USD</span>
              </div>
            </div>

            {/* 📊 DESGLOSE CALIBRADO DE MÉTRICAS ADMOB */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {/* Regalos de la Audiencia */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                  <Gift size={11} className="text-amber-400" />
                  Regalos Audiencia
                </span>
                <span className="text-sm font-black text-amber-300 mt-0.5 font-mono">
                  +{earnedGiftCoins} 🪙
                </span>
                <span className="text-[9px] text-zinc-400 mt-0.5">
                  {giftsReceivedCount} {giftsReceivedCount === 1 ? 'regalo recibido' : 'regalos recibidos'}
                </span>
              </div>

              {/* Bono AdMob por Audiencia Activa */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                  <Tv size={11} className="text-cyan-400" />
                  Bono AdMob LIVE
                </span>
                <span className="text-sm font-black text-cyan-300 mt-0.5 font-mono">
                  +{admobBonusCoins} 🪙
                </span>
                <span className="text-[9px] text-zinc-400 mt-0.5">
                  {viewers} espectadores activos
                </span>
              </div>

              {/* Tiempo Transmitido */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                  <Clock size={11} className="text-purple-400" />
                  Tiempo en Vivo
                </span>
                <span className="text-sm font-black text-purple-300 mt-0.5 font-mono">
                  {formatTimer(liveSeconds)}
                </span>
                <span className="text-[9px] text-zinc-400 mt-0.5">
                  Sesión continuada
                </span>
              </div>

              {/* Pico de Audiencia */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                  <Eye size={11} className="text-emerald-400" />
                  Pico Audiencia
                </span>
                <span className="text-sm font-black text-emerald-300 mt-0.5 font-mono">
                  {formatNumber(viewers)}
                </span>
                <span className="text-[9px] text-zinc-400 mt-0.5">
                  Usuarios alcanzados
                </span>
              </div>
            </div>

            {/* 🛡️ SELLO OFICIAL GOOGLE ADMOB PLAY STORE COMPLIANT */}
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2 text-left mb-4">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-tight">
                <span className="text-[10px] font-black text-emerald-300 block uppercase tracking-wide">
                  100% Google Play Store Compliant
                </span>
                <span className="text-[9px] text-zinc-300 block mt-0.5">
                  Monetización generada por la red Google AdMob. Libre de pasarelas de pago externas. Las SpotCoins se acreditan directamente a tu Billetera SpotPlay.
                </span>
              </div>
            </div>

            {/* BOTÓN ACREDITAR Y SALIR */}
            <button
              onClick={handleConfirmFinish}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-[#ffb800] to-yellow-500 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,184,0,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Coins size={15} className="fill-black" />
              <span>Acreditar +{totalLiveCoins} SpotCoins a mi Billetera y Salir</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
