import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, X, Delete, KeyRound, Check, AlertCircle } from 'lucide-react';

const DEFAULT_MASTER_PIN = '1986';
const PIN_STORAGE_KEY = 'spotplay_master_pin';

export function getMasterPin() {
  try {
    return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_MASTER_PIN;
  } catch {
    return DEFAULT_MASTER_PIN;
  }
}

export function saveMasterPin(newPin) {
  try {
    localStorage.setItem(PIN_STORAGE_KEY, newPin);
    return true;
  } catch {
    return false;
  }
}

// Sonido nativo de desbloqueo o error sin archivos externos
function playAccessSound(isSuccess = true) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isSuccess) {
      // Doble tono agudo elegante de acceso concedido
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      // Tono grave de acceso denegado
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(140, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Si el navegador tiene políticas estrictas de audio, se ignora silenciosamente
  }
}

export default function MasterPinModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isChangeMode, setIsChangeMode] = useState(false);
  const [newPinStep, setNewPinStep] = useState(1); // 1: ingresar actual, 2: nuevo pin, 3: confirmar nuevo pin
  const [tempNewPin, setTempNewPin] = useState('');
  const [changeSuccessMsg, setChangeSuccessMsg] = useState('');

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setIsError(false);
      setErrorMessage('');
      setIsChangeMode(false);
      setNewPinStep(1);
      setTempNewPin('');
      setChangeSuccessMsg('');
    }
  }, [isOpen]);

  // Manejo de teclado físico
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, isChangeMode, newPinStep, tempNewPin]);

  if (!isOpen) return null;

  const currentSavedPin = getMasterPin();

  const handleDigitPress = (digit) => {
    if (pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setIsError(false);
    setErrorMessage('');

    // Si ya completó los 4 dígitos
    if (nextPin.length === 4) {
      setTimeout(() => {
        processPinVerification(nextPin);
      }, 120);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setIsError(false);
    setErrorMessage('');
  };

  const processPinVerification = (enteredPin) => {
    // Modo Normal de Acceso
    if (!isChangeMode) {
      if (enteredPin === currentSavedPin) {
        playAccessSound(true);
        if (navigator.vibrate) navigator.vibrate([40, 50, 40]);
        onSuccess();
      } else {
        triggerError('PIN incorrecto. Acceso denegado.');
      }
      return;
    }

    // Modo Cambio de PIN
    if (newPinStep === 1) {
      // Verificar PIN actual
      if (enteredPin === currentSavedPin) {
        setPin('');
        setNewPinStep(2);
      } else {
        triggerError('El PIN actual no coincide.');
      }
    } else if (newPinStep === 2) {
      // Guardar temporalmente el nuevo PIN
      setTempNewPin(enteredPin);
      setPin('');
      setNewPinStep(3);
    } else if (newPinStep === 3) {
      // Confirmar nuevo PIN
      if (enteredPin === tempNewPin) {
        saveMasterPin(enteredPin);
        playAccessSound(true);
        setChangeSuccessMsg('¡PIN maestro actualizado exitosamente!');
        setTimeout(() => {
          setIsChangeMode(false);
          setNewPinStep(1);
          setPin('');
          setChangeSuccessMsg('');
          onSuccess();
        }, 1200);
      } else {
        triggerError('Los nuevos PIN no coinciden. Intenta de nuevo.');
        setPin('');
        setNewPinStep(2);
      }
    }
  };

  const triggerError = (msg) => {
    playAccessSound(false);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    setIsError(true);
    setErrorMessage(msg);
    setTimeout(() => {
      setPin('');
      setIsError(false);
    }, 700);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[320px] bg-[#14151b] border border-amber-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-col items-center relative overflow-hidden transition-all duration-200 ${
          isError ? 'animate-shake border-red-500/60' : ''
        }`}
      >
        {/* Glow de fondo */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Botón cerrar discreto */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Ícono de Caja Fuerte / Seguridad Maestro */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-3 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          {isChangeMode ? <KeyRound size={26} /> : <Lock size={26} />}
        </div>

        {/* Título & Subtítulo */}
        <h3 className="text-base font-black text-white text-center tracking-tight">
          {isChangeMode
            ? newPinStep === 1
              ? 'PIN Actual Requerido'
              : newPinStep === 2
              ? 'Crea tu Nuevo PIN'
              : 'Confirma tu Nuevo PIN'
            : 'Acceso Maestro Spot Play'}
        </h3>

        <p className="text-[11px] text-zinc-400 text-center mt-1 mb-5">
          {isChangeMode
            ? newPinStep === 1
              ? 'Introduce tu PIN maestro vigente para cambiarlo'
              : newPinStep === 2
              ? 'Escribe 4 dígitos que recuerdes con facilidad'
              : 'Vuelve a escribir los 4 dígitos para confirmar'
            : 'Área restringida exclusiva para el Dueño'}
        </p>

        {/* 4 Indicadores de Dígitos (Dots) */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)] scale-110'
                    : isError
                    ? 'border-2 border-red-500 bg-red-500/20'
                    : 'border-2 border-zinc-600 bg-zinc-800/60'
                }`}
              />
            );
          })}
        </div>

        {/* Mensaje de error o éxito */}
        {errorMessage && (
          <div className="flex items-center gap-1.5 text-red-400 text-[11px] font-semibold mb-3 animate-in fade-in">
            <AlertCircle size={13} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {changeSuccessMsg && (
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold mb-3 animate-in fade-in">
            <Check size={13} className="shrink-0" />
            <span>{changeSuccessMsg}</span>
          </div>
        )}

        {/* Teclado Numérico Táctil */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-amber-400/20 active:text-amber-400 active:scale-95 border border-white/5 text-lg font-bold text-white transition-all flex items-center justify-center shadow-sm cursor-pointer"
            >
              {digit}
            </button>
          ))}

          {/* Fila inferior: Cancelar/Reset, Cero, Borrar */}
          <button
            type="button"
            onClick={() => setPin('')}
            className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/5 text-[11px] font-bold text-zinc-400 hover:text-white transition-all flex items-center justify-center cursor-pointer uppercase"
          >
            Limpiar
          </button>

          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-amber-400/20 active:text-amber-400 active:scale-95 border border-white/5 text-lg font-bold text-white transition-all flex items-center justify-center shadow-sm cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/5 text-zinc-400 hover:text-amber-400 transition-all flex items-center justify-center cursor-pointer"
            title="Borrar dígito"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Opción de cambiar PIN */}
        <div className="w-full pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
          <button
            type="button"
            onClick={() => {
              setIsChangeMode((prev) => !prev);
              setNewPinStep(1);
              setPin('');
              setErrorMessage('');
            }}
            className="text-zinc-400 hover:text-amber-400 transition-colors font-medium cursor-pointer"
          >
            {isChangeMode ? '← Volver a inicio' : '¿Cambiar PIN?'}
          </button>

          <span className="text-[10px] text-zinc-600 font-mono">
            {isChangeMode ? `Paso ${newPinStep} de 3` : 'SpotPlay Security'}
          </span>
        </div>
      </div>
    </div>
  );
}
