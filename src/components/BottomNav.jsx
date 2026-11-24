import React from 'react';
import { Home, Compass, ShoppingBag, User } from 'lucide-react';

export default function BottomNav({ activeTab, onSelectTab }) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around min-h-[60px] pb-[max(12px,env(safe-area-inset-bottom,12px))] pt-1.5 bg-[#0c0f14]/90 backdrop-blur-xl border-t border-white/10 px-4 select-none shadow-[0_-4px_12px_rgba(0,0,0,0.3)]">
      {/* 1. Inicio */}
      <button
        onClick={() => onSelectTab('feed')}
        className="flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 group focus:outline-none cursor-pointer"
      >
        <Home
          size={22}
          strokeWidth={activeTab === 'feed' ? 2.6 : 1.8}
          className={`transition-colors ${
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
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffb800] mt-0.5 shadow-[0_0_6px_rgba(255,184,0,0.8)] animate-in fade-in zoom-in duration-200" />
        ) : (
          <span className="w-1.5 h-1.5 mt-0.5 opacity-0" />
        )}
      </button>

      {/* 2. Explorar */}
      <button
        onClick={() => onSelectTab('explore')}
        className="flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 group focus:outline-none cursor-pointer"
      >
        <Compass
          size={22}
          strokeWidth={activeTab === 'explore' ? 2.6 : 1.8}
          className={`transition-colors ${
            activeTab === 'explore'
              ? 'text-white scale-105 drop-shadow-sm'
              : 'text-zinc-500 group-hover:text-zinc-300'
          }`}
        />
        <span
          className={`text-[10px] transition-colors mt-0.5 ${
            activeTab === 'explore' ? 'text-white font-extrabold' : 'text-zinc-500 group-hover:text-zinc-400 font-medium'
          }`}
        >
          Explorar
        </span>
        {activeTab === 'explore' ? (
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffb800] mt-0.5 shadow-[0_0_6px_rgba(255,184,0,0.8)] animate-in fade-in zoom-in duration-200" />
        ) : (
          <span className="w-1.5 h-1.5 mt-0.5 opacity-0" />
        )}
      </button>

      {/* 3. Vitrina Comercial (Integración VitrinaSpot) */}
      <button
        onClick={() => onSelectTab('vitrina')}
        className="flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 group focus:outline-none cursor-pointer"
      >
        <div className="relative">
          <ShoppingBag
            size={22}
            strokeWidth={activeTab === 'vitrina' ? 2.6 : 1.8}
            className={`transition-colors ${
              activeTab === 'vitrina'
                ? 'text-[#ffb800] scale-105 drop-shadow-sm'
                : 'text-zinc-500 group-hover:text-[#ffb800]/80'
            }`}
          />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffb800] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffb800]"></span>
          </span>
        </div>
        <span
          className={`text-[10px] transition-colors mt-0.5 ${
            activeTab === 'vitrina' ? 'text-[#ffb800] font-extrabold' : 'text-zinc-500 group-hover:text-zinc-400 font-medium'
          }`}
        >
          Vitrina
        </span>
        {activeTab === 'vitrina' ? (
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffb800] mt-0.5 shadow-[0_0_6px_rgba(255,184,0,0.8)] animate-in fade-in zoom-in duration-200" />
        ) : (
          <span className="w-1.5 h-1.5 mt-0.5 opacity-0" />
        )}
      </button>

      {/* 4. Perfil */}
      <button
        onClick={() => onSelectTab('profile')}
        className="flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 group focus:outline-none cursor-pointer"
      >
        <User
          size={22}
          strokeWidth={activeTab === 'profile' ? 2.6 : 1.8}
          className={`transition-colors ${
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
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffb800] mt-0.5 shadow-[0_0_6px_rgba(255,184,0,0.8)] animate-in fade-in zoom-in duration-200" />
        ) : (
          <span className="w-1.5 h-1.5 mt-0.5 opacity-0" />
        )}
      </button>
    </nav>
  );
}
