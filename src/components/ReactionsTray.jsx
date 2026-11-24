import React from 'react';

export const REACTIONS = [
  { id: 'heart', emoji: '❤️', label: 'Me encanta' },
  { id: 'fire', emoji: '🔥', label: 'Fuego' },
  { id: 'crown', emoji: '👑', label: 'Top' },
  { id: 'money', emoji: '💸', label: 'Negocio' },
  { id: 'clap', emoji: '👏', label: 'Bravo' },
];

export default function ReactionsTray({ isOpen, onSelectReaction, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute left-10 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1.5 p-1.5 rounded-full bg-black/85 backdrop-blur-xl border border-white/20 shadow-[0_0_25px_rgba(0,0,0,0.8)] animate-in slide-in-from-left duration-200 whitespace-nowrap"
    >
      {REACTIONS.map((r) => (
        <button
          key={r.id}
          onClick={(e) => {
            e.stopPropagation();
            onSelectReaction(r);
            onClose();
          }}
          className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center text-xl hover:scale-130 active:scale-95 transition-all select-none"
          title={r.label}
        >
          {r.emoji}
        </button>
      ))}
    </div>
  );
}
