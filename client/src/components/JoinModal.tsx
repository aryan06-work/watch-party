import React, { useState } from 'react';
import { LogIn, Users, AlertCircle, ArrowLeft } from 'lucide-react';

interface JoinModalProps {
  roomCode: string;
  isOpen: boolean;
  onJoin: (name: string) => void;
  onCancel: () => void;
  error?: string | null;
  loading?: boolean;
}

export const JoinModal: React.FC<JoinModalProps> = ({
  roomCode,
  isOpen,
  onJoin,
  onCancel,
  error,
  loading = false,
}) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onJoin(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-dark-surface border border-white/10 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Join Watch Party</h3>
            <p className="text-xs text-slate-400">
              Room Code: <span className="font-mono text-indigo-400 font-semibold">{roomCode}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 block">
              Your Display Name
            </label>
            <input
              type="text"
              autoFocus
              required
              maxLength={24}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex, Sam, Jordan..."
              className="w-full glass-input px-3.5 py-2.5 text-sm text-white placeholder-slate-400 rounded-xl focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {loading ? 'Joining Room...' : 'Join Party'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
