import React from 'react';

export default function StoriesBar({ creators = [], onSelectCreator }) {
  return (
    <div className="w-full px-3 py-1 flex items-center gap-3 overflow-x-auto no-scrollbar pointer-events-auto select-none">
      {creators.map((creator, idx) => {
        const isLive = idx % 2 === 0;
        return (
          <div
            key={creator.id || idx}
            onClick={() => onSelectCreator(creator)}
            className="flex flex-col items-center gap-1 cursor-pointer shrink-0 group active:scale-95 transition-transform"
          >
            {/* Avatar with Animated Gradient Neon Ring */}
            <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-amber-400 via-[#FE2C55] to-purple-600 shadow-[0_0_12px_rgba(245,158,11,0.4)] group-hover:scale-105 transition-all">
              <img
                src={creator.avatar}
                alt={creator.username}
                className="w-11 h-11 rounded-full object-cover border-2 border-black"
              />
              {/* LIVE or STORY Badge */}
              <span
                className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-wider text-white border border-black shadow ${
                  isLive ? 'bg-gradient-to-r from-red-600 to-pink-600 animate-pulse' : 'bg-cyan-500'
                }`}
              >
                {isLive ? 'LIVE' : 'NUEVO'}
              </span>
            </div>

            {/* Handle */}
            <span className="text-[10px] text-zinc-300 font-medium truncate max-w-[56px] text-center">
              @{creator.username}
            </span>
          </div>
        );
      })}
    </div>
  );
}
