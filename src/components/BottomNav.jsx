import React from 'react';
import { Home, ShoppingBag, User } from 'lucide-react';

export default function BottomNav({ activeTab, onSelectTab }) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around min-h-[64px] pb-[max(12px,env(safe-area-inset-bottom,12px))] pt-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-6 select-none pointer-events-auto">
      {/* 1. Inicio */}
      <button
        onClick={() => onSelectTab('feed')}
        className="flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 group focus:outline-none cursor-pointer"
        title="Inicio"
      >
        <Home
          size={23}
          strokeWidth={activeTab === 'feed' ? 2.6 : 1.8}
          className={`transition-all duration-200 ${
            activeTab === 'feed'
              ? 'text-white scale-105 drop-shadow-sm'
              : 'text-zinc-500 group-hover:text-zinc-300'
          }`}
        />
        <span
          className={`text-[10px] transition-colors mt-0.5 ${
            activeTab === 'feed' ? 'text-white font-extrabold' : 'text-zinc-500 group-hover:text-zinc-400 font-medium'
          }`}
        >
          Inicio
        </span>
        {activeTab === 'feed' ? (
          <span className="w-1.5 h-1.5 rounded-full bg-white mt-0.5 opacity-90 animate-in fade-in zoom-in duration-200 shadow-[0_0_6px_rgba(255,255,255,0.7)]" />
        ) : (
          <span className="w-1.5 h-1.5 mt-0.5 opacity-0" />
        )}
      </button>

      {/* 2. Vitrina Comercial (Integración VitrinaSpot - Botón Estrella Central) */}
      <button
        onClick={() => onSelectTab('vitrina')}
        className="flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 group focus:outline-none cursor-pointer"
        title="Vitrina Comercial"
      >
        <div className="relative">
          <ShoppingBag
            size={24}
            strokeWidth={activeTab === 'vitrina' ? 2.6 : 1.8}
            className={`transition-all duration-200 ${
              activeTab === 'vitrina'
                ? 'text-[#ffb800] scale-110 filter drop-shadow-[0_0_8px_rgba(255,184,0,0.5)]'
                : 'text-zinc-500 group-hover:text-amber-400/80'
            }`}
          />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffb800] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffb800]"></span>
          </span>
        </div>
        <span
          className={`text-[10px] transition-colors mt-0.5 whitespace-nowrap ${
            activeTab === 'vitrina'
              ? 'font-black drop-shadow-[0_0_6px_rgba(255,184,0,0.4)]'
              : 'font-medium text-zinc-500 group-hover:text-zinc-300'
          }`}
        >
          <span className={activeTab === 'vitrina' ? 'text-white' : ''}>Spot</span>{' '}
          <span className={activeTab === 'vitrina' ? 'text-[#ffb800]' : 'text-amber-400/80 group-hover:text-amber-400'}>Vitrina</span>
        </span>
        {activeTab === 'vitrina' ? (
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffb800] mt-0.5 opacity-95 animate-in fade-in zoom-in duration-200 shadow-[0_0_8px_rgba(255,184,0,0.8)]" />
        ) : (
          <span className="w-1.5 h-1.5 mt-0.5 opacity-0" />
        )}
      </button>

      {/* 3. Perfil */}
      <button
        onClick={() => onSelectTab('profile')}
        className="flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 group focus:outline-none cursor-pointer"
        title="Mi Perfil"
      >
        <User
          size={23}
          strokeWidth={activeTab === 'profile' ? 2.6 : 1.8}
          className={`transition-all duration-200 ${
            activeTab === 'profile'
              ? 'text-white scale-105 drop-shadow-sm'
              : 'text-zinc-500 group-hover:text-zinc-300'
          }`}
        />
        <span
          className={`text-[10px] transition-colors mt-0.5 ${
            activeTab === 'profile' ? 'text-white font-extrabold' : 'text-zinc-500 group-hover:text-zinc-400 font-medium'
          }`}
        >
          Perfil
        </span>
        {activeTab === 'profile' ? (
          <span className="w-1.5 h-1.5 rounded-full bg-white mt-0.5 opacity-90 animate-in fade-in zoom-in duration-200 shadow-[0_0_6px_rgba(255,255,255,0.7)]" />
        ) : (
          <span className="w-1.5 h-1.5 mt-0.5 opacity-0" />
        )}
      </button>
    </nav>
  );
}
