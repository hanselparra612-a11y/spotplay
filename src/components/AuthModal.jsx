import React, { useState } from 'react';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';
import { X, Lock, Mail, User, Play, ArrowRight } from 'lucide-react';
import {
  registerWithFirebase,
  loginWithFirebase,
  loginWithGoogle,
} from '../firebase/authService';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialRegisterMode = true }) {
  const [isRegisterMode, setIsRegisterMode] = useState(initialRegisterMode);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const keyboardHeight = useVirtualKeyboard();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        const newUser = await registerWithFirebase({ email, password, name, username });
        alert(`🎉 ¡Bienvenido a Spot Play, @${newUser.username}!\nRecibiste 50 SpotCoins de bienvenida en tu billetera.`);
        onAuthSuccess(newUser);
      } else {
        const loggedUser = await loginWithFirebase({ email, password });
        onAuthSuccess(loggedUser);
      }
      onClose();
    } catch (err) {
      console.error('Error de autenticación:', err);
      alert(err.message || 'No se pudo completar la autenticación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      const googleUser = await loginWithGoogle();
      alert('✅ Sesión iniciada con Google con éxito.');
      onAuthSuccess(googleUser);
      onClose();
    } catch (err) {
      console.error('Error con Google login:', err);
      alert('No se pudo iniciar sesión con Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#141821] border border-[#ffb800]/40 rounded-3xl shadow-[0_0_35px_rgba(255,184,0,0.2)] overflow-hidden flex flex-col max-h-[92vh] text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-6.5 h-5 rounded-md bg-gradient-to-tr from-[#ffb800] to-[#ffa000] flex items-center justify-center shadow-sm shrink-0">
              <Play size={9} className="fill-black text-black ml-0.5" />
            </div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Spot <span className="text-[#ffb800]">Play</span></span>
              <span className="text-xs text-zinc-400 font-normal">| {isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          style={{
            paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 20}px` : undefined,
            transition: 'padding-bottom 0.15s ease-out',
          }}
          className="p-4 space-y-3.5 text-xs overflow-y-auto no-scrollbar"
        >
          {/* Brand Welcome */}
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <div className="w-9 h-7 rounded-lg bg-gradient-to-tr from-[#ffb800] to-[#ffa000] flex items-center justify-center shadow-md shadow-[#ffb800]/20 shrink-0">
                <Play size={12} className="fill-black text-black ml-0.5" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white select-none">
                Spot <span className="text-[#ffb800]">Play</span>
              </span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">
              {isRegisterMode ? 'Únete a la comunidad de creadores' : 'Bienvenido de nuevo'}
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {isRegisterMode
                ? 'Sube videos, haz transmisiones en vivo y gana regalos virtuales'
                : 'Ingresa a tu cuenta para ver tu perfil y billetera'}
            </p>
          </div>

          {/* Botón rápido con Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-2.5 bg-white hover:bg-zinc-100 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>

          <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-[1px] bg-white/10" />
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">O con correo</span>
            <div className="flex-1 h-[1px] bg-white/10" />
          </div>

          {/* Campos de Registro */}
          {isRegisterMode && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Nombre</label>
                <div className="relative flex items-center">
                  <User size={14} className="absolute left-3 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Tu nombre completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isRegisterMode}
                    className="w-full bg-[#202126] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Nombre de usuario (@handle)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-zinc-500 font-bold">@</span>
                  <input
                    type="text"
                    placeholder="usuario_creador"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={isRegisterMode}
                    className="w-full bg-[#202126] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </>
          )}

          {/* Correo */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Correo Electrónico
            </label>
            <div className="relative flex items-center">
              <Mail size={14} className="absolute left-3 text-zinc-500" />
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#202126] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <Lock size={14} className="absolute left-3 text-zinc-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#202126] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-[#ffb800] via-[#ffa000] to-[#ff8800] hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(255,184,0,0.5)] active:scale-95 transition-all flex items-center justify-center gap-1.5 mt-2"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Cargando...</span>
            ) : (
              <>
                <span>{isRegisterMode ? 'Crear mi Cuenta Gratis' : 'Iniciar Sesión'}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          {/* Toggle entre Iniciar sesión y Registrarse */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsRegisterMode((prev) => !prev)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              {isRegisterMode ? (
                <>
                  ¿Ya tienes una cuenta? <strong className="text-[#ffb800] underline">Inicia Sesión</strong>
                </>
              ) : (
                <>
                  ¿No tienes una cuenta aún? <strong className="text-[#ffb800] underline">Regístrate aquí</strong>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
