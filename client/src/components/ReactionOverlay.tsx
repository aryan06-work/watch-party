import React, { useEffect, useState } from 'react';
import { ReactionItem } from '../types';

interface ReactionOverlayProps {
  reactions: ReactionItem[];
}

export const ReactionOverlay: React.FC<ReactionOverlayProps> = ({ reactions }) => {
  const [activeReactions, setActiveReactions] = useState<ReactionItem[]>([]);

  useEffect(() => {
    if (reactions.length === 0) return;
    const latest = reactions[reactions.length - 1];

    // Assign random horizontal position (15% to 85%)
    const itemWithPos: ReactionItem = {
      ...latest,
      xOffset: Math.floor(Math.random() * 70) + 15,
    };

    setActiveReactions((prev) => [...prev.slice(-15), itemWithPos]);

    const timer = setTimeout(() => {
      setActiveReactions((prev) => prev.filter((r) => r.id !== latest.id));
    }, 2500);

    return () => clearTimeout(timer);
  }, [reactions]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {activeReactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute bottom-12 flex flex-col items-center animate-float-up"
          style={{ left: `${reaction.xOffset || 50}%` }}
        >
          <span className="text-4xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] filter">
            {reaction.emoji}
          </span>
          <span className="text-[10px] font-semibold tracking-wide text-white/90 bg-black/60 px-2 py-0.5 rounded-full mt-1 backdrop-blur-sm shadow">
            {reaction.senderName}
          </span>
        </div>
      ))}
    </div>
  );
};
