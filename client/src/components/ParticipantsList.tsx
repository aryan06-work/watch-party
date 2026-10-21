import React from 'react';
import { Participant } from '../types';
import { Users, Crown, ArrowRightLeft } from 'lucide-react';

interface ParticipantsListProps {
  participants: Participant[];
  currentUserToken: string;
  isCurrentUserHost: boolean;
  maxParticipants: number;
  onTransferHost: (targetToken: string) => void;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  currentUserToken,
  isCurrentUserHost,
  maxParticipants,
  onTransferHost,
}) => {
  return (
    <div className="glass-panel p-4 rounded-2xl border border-white/5 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Participants</h3>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
          {participants.length} / {maxParticipants}
        </span>
      </div>

      <div className="space-y-2">
        {participants.map((p) => {
          const isMe = p.sessionToken === currentUserToken;
          const initials = p.name ? p.name.slice(0, 2).toUpperCase() : 'G';

          return (
            <div
              key={p.sessionToken}
              className="flex items-center justify-between p-2 rounded-xl bg-dark-card/60 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    p.isHost
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  {initials}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-200 truncate">
                      {p.name} {isMe && <span className="text-[10px] text-slate-400 font-normal">(You)</span>}
                    </span>
                    {p.isHost && (
                      <span title="Room Host">
                        <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Host transfer button */}
              {isCurrentUserHost && !p.isHost && (
                <button
                  onClick={() => onTransferHost(p.sessionToken)}
                  title="Make this participant the room host"
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-white/5 hover:border-amber-500/30 text-[10px] font-medium flex items-center gap-1 transition-all"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Pass Host</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
