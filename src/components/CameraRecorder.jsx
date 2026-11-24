import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Sparkles,
  Timer,
  Music,
  Check,
  Disc,
  ArrowLeft,
  Upload,
  Volume2,
  VolumeX,
  Sun,
  Zap,
  FlipHorizontal,
  Sliders,
  ZoomIn,
  Play,
  Pause,
  Mic,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { TRENDING_SOUNDS } from '../data/sounds';

export default function CameraRecorder({ isOpen, onClose, onFinishRecording }) {
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [activeFilter, setActiveFilter] = useState('none');
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [showSoundsMenu, setShowSoundsMenu] = useState(false);
  const [selectedSound, setSelectedSound] = useState(null);
  const [durationMode, setDurationMode] = useState(15); // 15s | 30s | 60s
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [countdownSetting, setCountdownSetting] = useState(0); // 0 (grabación instantánea al pulsar el botón estilo TikTok) | 3s | 10s
  const [cameraError, setCameraError] = useState(null);
  const [ringLightMode, setRingLightMode] = useState('none'); // 'none' | 'white' | 'warm' | 'glam'

  // 🔭 Graduación de Imagen: Zoom, Exposición y Espejo (1x Full Screen por defecto)
  const [zoomLevel, setZoomLevel] = useState('1x'); // '0.5x' | '1x' | '2x'
  const [exposureLevel, setExposureLevel] = useState(1.0); // 0.85, 1.0, 1.2, 1.35
  const [isMirrored, setIsMirrored] = useState(true);
  const [showToast, setShowToast] = useState(null);

  // 🎙️ VU Meter de Micrófono en Tiempo Real
  const [micVolume, setMicVolume] = useState(0); // 0 to 100
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const analyserRef = useRef(null);
  const micAnimFrameRef = useRef(null);

  // 🎬 Controles y Reproductor de Vista Previa (Review)
  const [isPreviewMuted, setIsPreviewMuted] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [showRetakeConfirm, setShowRetakeConfirm] = useState(false);

  const videoPreviewRef = useRef(null);
  const recordedVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // 🎙️ Iniciar Analizador de Micrófono
  const setupAudioMeter = (mediaStream) => {
    try {
      const audioTracks = mediaStream?.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) return;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.disconnect();
        } catch (e) {}
      }

      const source = ctx.createMediaStreamSource(new MediaStream([audioTracks[0]]));
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      audioSourceRef.current = source;
      analyserRef.current = analyser;

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      let lastTime = 0;

      const poll = (now) => {
        if (!analyserRef.current) return;
        if (now - lastTime > 250) { // Throttle a 250ms para 0% impacto en FPS de grabación
          lastTime = now;
          analyser.getByteFrequencyData(buffer);
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i];
          }
          const avg = sum / buffer.length;
          const newVol = Math.min(100, Math.round((avg / 128) * 100));
          // Solo disparar re-render si el cambio es significativo para no trabar los fotogramas del video
          setMicVolume((prev) => (Math.abs(prev - newVol) > 15 ? newVol : prev));
        }
        micAnimFrameRef.current = requestAnimationFrame(poll);
      };

      micAnimFrameRef.current = requestAnimationFrame(poll);
    } catch (e) {
      console.warn('Audio meter no disponible:', e);
    }
  };

  const stopAudioMeter = () => {
    if (micAnimFrameRef.current) {
      cancelAnimationFrame(micAnimFrameRef.current);
      micAnimFrameRef.current = null;
    }
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.disconnect();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch (e) {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setMicVolume(0);
  };

  const toggleRecordedAudio = () => {
    if (recordedVideoRef.current) {
      const nextMuted = !recordedVideoRef.current.muted;
      recordedVideoRef.current.muted = nextMuted;
      setIsPreviewMuted(nextMuted);
    }
  };

  // Filters definition
  const filters = [
    { id: 'none', name: 'Normal', css: '' },
    { id: 'beauty', name: 'Belleza ✨', css: 'brightness(1.08) contrast(1.04) saturate(1.15)' },
    { id: 'warm', name: 'Atardecer 🌅', css: 'saturate(1.3) brightness(1.04) sepia(0.18)' },
    { id: 'vintage', name: 'Vintage 🎞️', css: 'sepia(0.55) contrast(1.1) brightness(0.95)' },
    { id: 'neon', name: 'Cyberpunk ⚡', css: 'hue-rotate(90deg) saturate(1.7) contrast(1.15)' },
    { id: 'bw', name: 'B&W Film 🎬', css: 'grayscale(1) contrast(1.25)' },
  ];

  const stopCamera = () => {
    stopAudioMeter();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const resetRecordingState = () => {
    if (recordedVideoUrl) {
      try {
        URL.revokeObjectURL(recordedVideoUrl);
      } catch (e) {}
    }
    setRecordedVideoUrl(null);
    setRecordedBlob(null);
    setRecordedChunks([]);
    setIsRecording(false);
    setRecordingSeconds(0);
    setCountdown(null);
    setShowFiltersMenu(false);
    setShowSoundsMenu(false);
    setShowRetakeConfirm(false);
    setPreviewProgress(0);
    setPreviewCurrentTime(0);
    setZoomLevel('1x');
  };

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      resetRecordingState();
      return;
    }

    // Al abrir la cámara, SIEMPRE resetear a estado limpio desde cero
    resetRecordingState();
    let isMounted = true;

    async function initCamera() {
      try {
        setCameraError(null);
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1080 },
            height: { ideal: 1920 },
            frameRate: { ideal: 60, min: 30 },
            latency: { ideal: 0 },
          },
          audio: {
            echoCancellation: false, // ⚡ Cero buffer DSP: elimina 150-250ms de latencia acústica innecesaria
            noiseSuppression: false, // ⚡ Cero retraso en procesamiento de voz
            autoGainControl: false,  // ⚡ Cero retardo por compresión dinámica
            latency: { ideal: 0, max: 0.02 }, // ⚡ Latencia ultra baja en tiempo real
            sampleRate: { ideal: 48000 },
          },
        });

        if (isMounted) {
          setStream(userMediaStream);
          setupAudioMeter(userMediaStream);

          if (videoPreviewRef.current) {
            // Asignar exclusivamente la pista de video al visor en vivo.
            // Esto garantiza físicamente que el micrófono NUNCA se reproduzca en los altavoces, eliminando ecos y acoples.
            const videoOnlyStream = new MediaStream(userMediaStream.getVideoTracks());
            videoPreviewRef.current.srcObject = videoOnlyStream;
            videoPreviewRef.current.muted = true;
            videoPreviewRef.current.volume = 0;
          }
        }
      } catch (err) {
        console.warn('Error accediendo a cámara con audio HD, intentando fallback estándar:', err);
        // Fallback si el dispositivo no soporta constraints avanzadas de audio
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode,
              width: { ideal: 720 },
              height: { ideal: 1280 },
              frameRate: { ideal: 60, min: 30 },
              latency: { ideal: 0 },
            },
            audio: {
              echoCancellation: false,
              latency: 0,
            },
          });
          if (isMounted) {
            setStream(fallbackStream);
            setupAudioMeter(fallbackStream);

            if (videoPreviewRef.current) {
              const videoOnlyStream = new MediaStream(fallbackStream.getVideoTracks());
              videoPreviewRef.current.srcObject = videoOnlyStream;
              videoPreviewRef.current.muted = true;
              videoPreviewRef.current.volume = 0;
            }
          }
        } catch (fallbackErr) {
          if (isMounted) {
            setCameraError(
              'No se pudo acceder a la cámara o el micrófono. Puedes subir un video desde tu galería.'
            );
          }
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Flip Camera
  const toggleFacingMode = () => {
    stopCamera();
    setFacingMode((prev) => {
      const next = prev === 'user' ? 'environment' : 'user';
      setIsMirrored(next === 'user');
      return next;
    });
  };

  // Graduación de Lente / Zoom
  const handleSetZoom = async (level) => {
    setZoomLevel(level);
    setShowToast(level === '0.5x' ? '🔭 Gran Angular 0.5x' : level === '2x' ? '🔍 Zoom 2.0x' : '📱 Lente Normal 1.0x');
    setTimeout(() => setShowToast(null), 1600);

    try {
      const track = stream?.getVideoTracks()?.[0];
      if (track && track.getCapabilities) {
        const caps = track.getCapabilities();
        if (caps.zoom) {
          const targetZoom = level === '0.5x' ? (caps.zoom.min || 1) : level === '2x' ? Math.min(2, caps.zoom.max || 2) : 1;
          await track.applyConstraints({
            advanced: [{ zoom: targetZoom }],
          });
        }
      }
    } catch (e) {
      console.warn('Hardware zoom no disponible:', e);
    }
  };

  // Graduación de Exposición / Luz
  const cycleExposure = () => {
    const levels = [
      { val: 1.0, label: 'Luz Normal (1.0x)' },
      { val: 1.2, label: 'Luz Realzada (+20%)' },
      { val: 1.35, label: 'Luz Intensa (+35%)' },
      { val: 0.85, label: 'Luz Atenuada (-15%)' },
    ];
    const currentIndex = levels.findIndex((l) => l.val === exposureLevel);
    const next = levels[(currentIndex + 1) % levels.length];
    setExposureLevel(next.val);
    setShowToast(`☀️ ${next.label}`);
    setTimeout(() => setShowToast(null), 1600);
  };

  // Toggle Espejo
  const toggleMirror = () => {
    setIsMirrored((prev) => {
      const next = !prev;
      setShowToast(next ? '🪞 Modo Espejo (Natural)' : '📷 Modo Real (Sin espejo)');
      setTimeout(() => setShowToast(null), 1600);
      return next;
    });
  };

  // Ciclo de Aro de Luz Frontal (Luz de Belleza)
  const cycleRingLight = () => {
    const modes = ['none', 'white', 'warm', 'glam'];
    const labels = {
      none: 'Aro de Luz: Apagado',
      white: '💡 Aro de Luz: Blanco Estudio',
      warm: '🌅 Aro de Luz: Dorado Cálido',
      glam: '💖 Aro de Luz: Neón Glam',
    };
    const nextIdx = (modes.indexOf(ringLightMode) + 1) % modes.length;
    const next = modes[nextIdx];
    setRingLightMode(next);
    setShowToast(labels[next]);
    setTimeout(() => setShowToast(null), 1600);
  };

  // Ciclo de Temporizador (3s | 10s | 0s)
  const cycleCountdown = () => {
    const nextMap = { 3: 10, 10: 0, 0: 3 };
    const next = nextMap[countdownSetting] ?? 3;
    setCountdownSetting(next);
    setShowToast(next === 0 ? '⏱️ Temporizador: Desactivado' : `⏱️ Temporizador: ${next}s`);
    setTimeout(() => setShowToast(null), 1600);
  };

  // Start Countdown then Record
  const handleRecordButtonClick = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (countdownSetting === 0) {
      startActualRecording();
      return;
    }

    // Cuenta regresiva
    setCountdown(countdownSetting);
    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countInterval);
          startActualRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Actual Recording
  const startActualRecording = () => {
    if (!stream) return;

    try {
      const chunks = [];

      // Detección y selección de códec con aceleración por hardware (H.264 / AVC / VP9 / MP4) para máxima fluidez sin caídas de FPS
      const preferredMimes = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      const selectedMime = preferredMimes.find((m) => MediaRecorder.isTypeSupported(m));

      const options = {
        ...(selectedMime ? { mimeType: selectedMime } : {}),
        videoBitsPerSecond: 2500000, // 2.5 Mbps: resolución nítida y fluida a 30-60 FPS continuos
        audioBitsPerSecond: 128000,  // 128 kbps: audio nítido sin desfase
      };

      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (errOptions) {
        console.warn('Bitrate personalizado no soportado por este móvil, usando códec acelerado por defecto:', errOptions);
        mediaRecorder = new MediaRecorder(stream, selectedMime ? { mimeType: selectedMime } : {});
      }
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (chunks.length === 0) {
          console.warn('MediaRecorder finalizó sin datos grabados.');
          return;
        }
        const blob = new Blob(chunks, { type: selectedMime || 'video/webm' });
        setRecordedBlob(blob);
        setRecordedVideoUrl((prevUrl) => {
          if (prevUrl) {
            try {
              URL.revokeObjectURL(prevUrl);
            } catch (e) {}
          }
          return URL.createObjectURL(blob);
        });
        setRecordedChunks(chunks);

        // 🔇 Crucial: Detener el micrófono en vivo y limpiar el visor inmediatamente para liberar el hardware
        stopAudioMeter();
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
      };

      // Iniciar grabación en streaming continuo para latencia cero sin bloqueos de fotogramas
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= durationMode) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error al iniciar grabación:', err);
      alert('Error al iniciar la grabación con MediaRecorder');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error al detener MediaRecorder:', e);
      }
    }
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const handleRetake = async () => {
    resetRecordingState();
    // Reiniciar cámara en resolución móvil fluida de inmediato
    try {
      setCameraError(null);
      let userMediaStream;
      try {
        userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1080 },
            height: { ideal: 1920 },
            frameRate: { ideal: 60, min: 30 },
            latency: { ideal: 0 },
          },
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            latency: { ideal: 0, max: 0.02 },
            sampleRate: { ideal: 48000 },
          },
        });
      } catch (eHD) {
        userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 720 },
            height: { ideal: 1280 },
            frameRate: { ideal: 60, min: 30 },
            latency: { ideal: 0 },
          },
          audio: {
            echoCancellation: false,
            latency: 0,
          },
        });
      }
      setStream(userMediaStream);
      setupAudioMeter(userMediaStream);

      if (videoPreviewRef.current) {
        const videoOnlyStream = new MediaStream(userMediaStream.getVideoTracks());
        videoPreviewRef.current.srcObject = videoOnlyStream;
        videoPreviewRef.current.muted = true;
        videoPreviewRef.current.volume = 0;
      }
    } catch (err) {
      console.warn('Error reiniciando cámara:', err);
    }
  };

  const handleConfirm = () => {
    if (!recordedVideoUrl) return;
    const finalUrl = recordedVideoUrl;
    const finalBlob = recordedBlob;
    onFinishRecording({
      videoUrl: finalUrl,
      videoBlob: finalBlob,
      sound: selectedSound,
      filter: activeFilter,
    });
    // Limpiar estado completo
    stopCamera();
    setRecordedVideoUrl(null);
    setRecordedBlob(null);
    setRecordedChunks([]);
    setRecordingSeconds(0);
    setIsRecording(false);
    onClose();
  };

  // Controles del Reproductor de Vista Previa
  const togglePreviewPlayPause = () => {
    const vid = recordedVideoRef.current;
    if (!vid) return;
    if (vid.paused) {
      if (vid.currentTime >= (vid.duration || durationMode)) {
        vid.currentTime = 0;
      }
      vid.muted = isPreviewMuted;
      vid.play().then(() => setIsPreviewPlaying(true)).catch(() => {});
    } else {
      vid.pause();
      setIsPreviewPlaying(false);
    }
  };

  const handlePreviewEnded = () => {
    const vid = recordedVideoRef.current;
    if (!vid) return;
    vid.currentTime = 0;
    vid.muted = isPreviewMuted;
    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPreviewPlaying(true))
        .catch((err) => {
          console.warn('Replay loop falló:', err);
        });
    }
  };

  const handlePreviewTimeUpdate = () => {
    const vid = recordedVideoRef.current;
    if (vid && vid.duration) {
      setPreviewProgress((vid.currentTime / vid.duration) * 100);
      setPreviewCurrentTime(vid.currentTime);
      setPreviewDuration(vid.duration);
    }
  };

  const handlePreviewScrub = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const vid = recordedVideoRef.current;
    if (vid && vid.duration && isFinite(vid.duration)) {
      vid.currentTime = ratio * vid.duration;
      setPreviewProgress(ratio * 100);
      vid.muted = isPreviewMuted;
      vid.play().then(() => setIsPreviewPlaying(true)).catch(() => {});
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Asegurar reproducción con audio al generar la vista previa grabada
  useEffect(() => {
    if (recordedVideoUrl && recordedVideoRef.current) {
      const vid = recordedVideoRef.current;
      vid.muted = false;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPreviewMuted(false);
            setIsPreviewPlaying(true);
          })
          .catch((err) => {
            console.warn('El navegador bloqueó autoplay con audio, iniciando con botón para activar:', err);
            vid.muted = true;
            setIsPreviewMuted(true);
            vid.play().catch(() => {});
          });
      }
    }
  }, [recordedVideoUrl]);

  // Reanudar reproducción con audio si el usuario minimiza y regresa a la app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && recordedVideoUrl && recordedVideoRef.current) {
        const vid = recordedVideoRef.current;
        if (vid.paused && isPreviewPlaying) {
          vid.play().catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [recordedVideoUrl, isPreviewPlaying]);

  if (!isOpen) return null;

  const activeFilterCss = filters.find((f) => f.id === activeFilter)?.css || '';
  const filterStyle = activeFilterCss || exposureLevel !== 1.0
    ? `${activeFilterCss} ${exposureLevel !== 1.0 ? `brightness(${exposureLevel})` : ''}`.trim()
    : 'none';

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200">
      {/* Viewfinder Video */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
        {recordedVideoUrl ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
            <video
              key={recordedVideoUrl}
              ref={recordedVideoRef}
              src={recordedVideoUrl}
              style={{
                filter: filterStyle,
                transform: `scale(${zoomLevel === '2x' ? 1.5 : 1}) scaleX(${isMirrored ? -1 : 1})`,
                transformOrigin: 'center center',
              }}
              className="w-full h-full object-cover transition-all duration-200 cursor-pointer"
              autoPlay
              playsInline
              onClick={togglePreviewPlayPause}
              onTimeUpdate={handlePreviewTimeUpdate}
              onEnded={handlePreviewEnded}
            />

            {/* Play/Pause overlay icon when paused */}
            {!isPreviewPlaying && (
              <div
                onClick={togglePreviewPlayPause}
                className="absolute inset-0 flex items-center justify-center bg-black/25 cursor-pointer z-10 animate-in zoom-in-75 fade-in duration-150"
              >
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-[#ffb800]/40 via-[#ffa000]/25 to-transparent blur-xl animate-pulse pointer-events-none" />
                  <div className="relative w-18 h-18 rounded-full bg-black/50 backdrop-blur-2xl border border-white/35 flex items-center justify-center shadow-[0_0_30px_rgba(255,184,0,0.5),0_10px_30px_rgba(0,0,0,0.85)]">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#d97706] via-[#ffb800] to-[#fff3c4] flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.9)] border border-white/60">
                      <Play size={22} className="text-black fill-black ml-1 filter drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Bar on Preview: Status & Audio Toggle */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-auto">
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-[11px] font-bold">
                🎬 Vista Previa • {formatTimer(previewCurrentTime)} / {formatTimer(previewDuration || durationMode)}
              </span>

              {/* Botón flotante para activar o silenciar audio */}
              <button
                type="button"
                onClick={toggleRecordedAudio}
                className={`px-3.5 py-1.5 rounded-full backdrop-blur-md border text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all active:scale-95 ${
                  isPreviewMuted
                    ? 'bg-amber-400 text-black border-amber-300 animate-bounce'
                    : 'bg-black/75 text-white border-white/20'
                }`}
              >
                {isPreviewMuted ? (
                  <>
                    <VolumeX size={14} />
                    <span>Activar audio 🔊</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={14} className="text-cyan-400 animate-pulse" />
                    <span>Audio 100%</span>
                  </>
                )}
              </button>
            </div>

            {/* Scrub timeline bar at bottom of preview */}
            <div
              onClick={handlePreviewScrub}
              className="absolute bottom-24 inset-x-6 h-3 flex items-center cursor-pointer group z-20"
            >
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden relative group-hover:h-2 transition-all">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-[#FE2C55] rounded-full"
                  style={{ width: `${previewProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <video
            ref={videoPreviewRef}
            style={{
              filter: filterStyle,
              transform: `scale(${zoomLevel === '2x' ? 1.5 : 1}) scaleX(${isMirrored ? -1 : 1}) translateZ(0)`,
              transformOrigin: 'center center',
              willChange: 'transform',
            }}
            className="w-full h-full object-cover transition-none pointer-events-none"
            autoPlay
            playsInline
            muted
          />
        )}

        {/* ☀️ Virtual Ring Light / Halo de Belleza (Estudio / Cálido / Glam) */}
        {ringLightMode === 'white' && (
          <div className="absolute inset-0 pointer-events-none z-10 border-[14px] border-white/85 shadow-[inset_0_0_90px_rgba(255,255,255,0.7)]" />
        )}
        {ringLightMode === 'warm' && (
          <div className="absolute inset-0 pointer-events-none z-10 border-[14px] border-[#ffb800]/90 shadow-[inset_0_0_100px_rgba(255,184,0,0.7)]" />
        )}
        {ringLightMode === 'glam' && (
          <div className="absolute inset-0 pointer-events-none z-10 border-[14px] border-pink-300/85 shadow-[inset_0_0_100px_rgba(244,114,182,0.65)]" />
        )}

        {/* Camera error fallback */}
        {cameraError && !recordedVideoUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/90 text-white">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4">
              <X size={32} />
            </div>
            <p className="text-sm font-semibold mb-2">Permiso de cámara requerido</p>
            <p className="text-xs text-zinc-400 mb-6 max-w-xs">{cameraError}</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white text-black font-bold text-xs rounded-full active:scale-95 transition-transform"
            >
              Cerrar cámara
            </button>
          </div>
        )}

        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30">
            <span className="text-8xl font-black text-[#ffb800] animate-ping drop-shadow-[0_0_35px_rgba(255,184,0,0.8)]">
              {countdown}
            </span>
          </div>
        )}

        {/* Top Controls Overlay */}
        <div className="absolute top-0 inset-x-0 pt-4 px-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/70 to-transparent">
          {/* Close */}
          <button
            onClick={() => {
              stopCamera();
              resetRecordingState();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 active:scale-90"
          >
            <X size={20} />
          </button>

          {/* 🎙️ Indicador de Micrófono en Vivo (VU Meter Reactivo) */}
          {!recordedVideoUrl && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px]">
              <Mic size={12} className={micVolume > 12 ? 'text-emerald-400 animate-pulse' : 'text-zinc-400'} />
              <div className="flex items-end gap-[1.5px] h-2.5">
                <span className={`w-[2.5px] rounded-full transition-all duration-75 ${micVolume > 8 ? 'h-2 bg-emerald-400' : 'h-1 bg-white/20'}`} />
                <span className={`w-[2.5px] rounded-full transition-all duration-75 ${micVolume > 20 ? 'h-3 bg-emerald-400' : 'h-1 bg-white/20'}`} />
                <span className={`w-[2.5px] rounded-full transition-all duration-75 ${micVolume > 40 ? 'h-2.5 bg-emerald-400' : 'h-1 bg-white/20'}`} />
              </div>
              <span className={`text-[9px] font-mono font-bold ${micVolume > 12 ? 'text-emerald-300' : 'text-zinc-400'}`}>
                {micVolume > 12 ? 'Audio OK' : 'Mic listo'}
              </span>
            </div>
          )}

          {/* Flip camera */}
          {!recordedVideoUrl && (
            <button
              onClick={toggleFacingMode}
              className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 active:scale-90"
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>

        {/* 🟡 Barra de Progreso Superior estilo SpotPlay con gradiente dorado */}
        {isRecording && (
          <div className="absolute top-0 inset-x-0 h-1.5 bg-black/40 z-30 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#ffb800] via-[#ffa000] to-[#ff8800] transition-all duration-300 ease-linear shadow-[0_0_15px_rgba(255,184,0,0.9)]"
              style={{ width: `${Math.min(100, (recordingSeconds / durationMode) * 100)}%` }}
            />
          </div>
        )}

        {/* Right side studio tools (Graduación de Imagen: Zoom, Luz, Espejo, Filtros, Timer) */}
        {!recordedVideoUrl && !isRecording && (
          <div className="absolute right-3 top-16 z-20 flex flex-col items-center gap-2.5">
            {/* 🔭 Graduador de Zoom / Lente (0.5x Gran Angular / 1x / 2x) */}
            <div className="flex flex-col items-center gap-1 bg-black/50 backdrop-blur-md p-1 rounded-2xl border border-white/15 shadow-xl">
              <button
                onClick={() => handleSetZoom('0.5x')}
                className={`w-8 h-6 rounded-xl text-[9px] font-black tracking-wider flex items-center justify-center transition-all ${
                  zoomLevel === '0.5x'
                    ? 'bg-cyan-400 text-black shadow-md scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                0.5x
              </button>
              <button
                onClick={() => handleSetZoom('1x')}
                className={`w-8 h-6 rounded-xl text-[9px] font-black tracking-wider flex items-center justify-center transition-all ${
                  zoomLevel === '1x'
                    ? 'bg-cyan-400 text-black shadow-md scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                1x
              </button>
              <button
                onClick={() => handleSetZoom('2x')}
                className={`w-8 h-6 rounded-xl text-[9px] font-black tracking-wider flex items-center justify-center transition-all ${
                  zoomLevel === '2x'
                    ? 'bg-cyan-400 text-black shadow-md scale-105'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                2x
              </button>
            </div>

            {/* ☀️ Graduación de Luz / Exposición */}
            <button
              onClick={cycleExposure}
              className="flex flex-col items-center gap-0.5 text-white hover:text-amber-300 active:scale-90"
            >
              <div className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center border ${
                exposureLevel !== 1.0 ? 'bg-amber-400/30 border-amber-300 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]' : 'bg-black/40 border-white/10 text-white'
              }`}>
                <Sliders size={16} />
              </div>
              <span className="text-[9px] font-bold drop-shadow">
                {exposureLevel === 1.0 ? 'Luz' : `${exposureLevel}x`}
              </span>
            </button>

            {/* 🪞 Modo Espejo (Sincronizar derecha e izquierda) */}
            <button
              onClick={toggleMirror}
              className={`flex flex-col items-center gap-0.5 transition-all active:scale-90 ${
                isMirrored ? 'text-purple-300' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <div className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center border ${
                isMirrored ? 'bg-purple-600/30 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.6)]' : 'bg-black/40 border-white/10'
              }`}>
                <FlipHorizontal size={15} />
              </div>
              <span className="text-[9px] font-bold drop-shadow">{isMirrored ? 'Espejo' : 'Real'}</span>
            </button>

            {/* Filters Button */}
            <button
              onClick={() => setShowFiltersMenu((prev) => !prev)}
              className="flex flex-col items-center gap-0.5 text-white hover:text-cyan-400 active:scale-90"
            >
              <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center">
                <Sparkles size={16} className="text-cyan-400" />
              </div>
              <span className="text-[9px] font-medium drop-shadow">Filtros</span>
            </button>

            {/* 💡 Aro de Luz Frontal / Ring Light (Blanco / Cálido / Glam) */}
            <button
              onClick={cycleRingLight}
              className={`flex flex-col items-center gap-0.5 transition-all active:scale-90 ${
                ringLightMode !== 'none' ? 'text-amber-300' : 'text-white hover:text-amber-300'
              }`}
            >
              <div className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center border ${
                ringLightMode !== 'none' ? 'bg-amber-400/30 border-amber-300 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'bg-black/40 border-white/10'
              }`}>
                <Sun size={16} />
              </div>
              <span className="text-[9px] font-medium drop-shadow">
                {ringLightMode === 'none' ? 'Aro' : ringLightMode === 'white' ? 'Blanco' : ringLightMode === 'warm' ? 'Dorado' : 'Glam'}
              </span>
            </button>

            {/* ⏱️ Temporizador (3s / 10s / OFF) */}
            <button
              onClick={cycleCountdown}
              className="flex flex-col items-center gap-0.5 text-white hover:text-amber-400 active:scale-90"
            >
              <div className={`w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center ${
                countdownSetting > 0 ? 'bg-amber-500/25 border-amber-400/50 text-amber-300' : 'bg-black/40 border-white/10 text-white'
              }`}>
                <Timer size={16} />
              </div>
              <span className="text-[9px] font-medium drop-shadow">
                {countdownSetting === 0 ? 'OFF' : `${countdownSetting}s`}
              </span>
            </button>
          </div>
        )}

        {/* Filters Picker Drawer */}
        {showFiltersMenu && !recordedVideoUrl && (
          <div className="absolute bottom-28 inset-x-3 z-30 bg-[#16171b]/95 backdrop-blur-md rounded-2xl p-3 border border-white/10 animate-in slide-in-from-bottom duration-150">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">Efectos y Filtros</span>
              <button
                onClick={() => setShowFiltersMenu(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    activeFilter === f.id
                      ? 'bg-cyan-400 text-black shadow-lg scale-105'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sounds Picker Drawer */}
        {showSoundsMenu && (
          <div className="absolute inset-x-0 bottom-0 top-16 z-40 bg-[#141518]/95 backdrop-blur-md rounded-t-2xl p-4 flex flex-col border-t border-white/10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Disc size={18} className="text-[#FE2C55]" />
                Sonidos en Tendencia
              </h3>
              <button onClick={() => setShowSoundsMenu(false)} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
              {TRENDING_SOUNDS.map((snd) => (
                <div
                  key={snd.id}
                  onClick={() => {
                    setSelectedSound(snd);
                    setShowSoundsMenu(false);
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
                >
                  <img
                    src={snd.cover}
                    alt={snd.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{snd.title}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{snd.author} • {snd.duration}</p>
                    <span className="text-[9px] text-cyan-400 font-bold">{snd.usesCount} videos</span>
                  </div>
                  <button className="px-3 py-1 bg-[#FE2C55] hover:bg-red-600 text-white font-bold text-[11px] rounded-lg">
                    Usar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de confirmación para descartar toma */}
        {showRetakeConfirm && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-150">
            <div className="bg-[#181920] border border-white/15 rounded-3xl p-5 max-w-xs w-full text-center shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">¿Descartar este video?</h3>
              <p className="text-xs text-zinc-400 mb-5">
                Se borrará esta toma para que puedas volver a grabar una nueva desde cero.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowRetakeConfirm(false)}
                  className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowRetakeConfirm(false);
                    handleRetake();
                  }}
                  className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold active:scale-95 transition-all shadow-lg"
                >
                  Descartar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM CONTROLS */}
        <div className="absolute bottom-0 inset-x-0 pb-6 pt-10 px-6 z-20 flex flex-col items-center bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          {recordedVideoUrl ? (
            /* PREVIEW CONFIRMATION CONTROLS */
            <div className="w-full flex items-center justify-around">
              {/* Retake with confirm */}
              <button
                onClick={() => setShowRetakeConfirm(true)}
                className="flex flex-col items-center gap-1.5 text-white hover:text-zinc-300 active:scale-95"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <ArrowLeft size={22} />
                </div>
                <span className="text-xs font-medium">Volver a grabar</span>
              </button>

              {/* Confirm & Publish */}
              <button
                onClick={handleConfirm}
                className="flex flex-col items-center gap-1.5 text-white active:scale-95"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#ffb800] via-[#ffa000] to-[#ff8800] text-black flex items-center justify-center shadow-[0_0_25px_rgba(255,184,0,0.75)] animate-pulse">
                  <Check size={32} strokeWidth={3} className="text-black" />
                </div>
                <span className="text-xs font-bold text-white">Siguiente</span>
              </button>
            </div>
          ) : (
            /* RECORDING CONTROLS */
            <>
              {/* Duration selector pills (15s | 30s | 60s) */}
              {!isRecording && (
                <div className="flex items-center gap-2 mb-4 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/15 shadow-lg">
                  {[15, 30, 60].map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setDurationMode(dur)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        durationMode === dur
                          ? 'bg-[#ffb800] text-black shadow-md scale-105'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              )}

              {/* Gold/Red Record Button */}
              <div className="flex items-center justify-center">
                <button
                  onClick={handleRecordButtonClick}
                  className={`relative flex items-center justify-center transition-all ${
                    isRecording ? 'scale-110' : 'hover:scale-105 active:scale-95'
                  }`}
                >
                  {/* Outer ring */}
                  <div className="w-20 h-20 rounded-full border-4 border-[#ffb800] flex items-center justify-center shadow-[0_0_25px_rgba(255,184,0,0.6)]">
                    {/* Inner red dot */}
                    <div
                      className={`transition-all duration-200 ${
                        isRecording
                          ? 'w-8 h-8 rounded-md bg-[#ff2d55] animate-pulse'
                          : 'w-16 h-16 rounded-full bg-gradient-to-tr from-[#ff2d55] to-[#ff4b72]'
                      }`}
                    />
                  </div>
                </button>
              </div>

              {/* Recording status timer */}
              {isRecording && (
                <div className="flex items-center gap-2 mt-2 bg-black/60 px-3 py-0.5 rounded-full border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-mono font-bold text-white">
                    00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / {durationMode}s
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
