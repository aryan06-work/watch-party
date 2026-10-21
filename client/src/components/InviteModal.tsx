import React, { useState } from 'react';
import { X, Copy, Check, Share2, Users, ShieldCheck } from 'lucide-react';

interface InviteModalProps {
  roomCode: string;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  roomCode,
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const inviteUrl = `${window.location.origin}/?room=${roomCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    onShowToast('Invite link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-dark-surface border border-white/10 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Invite Friends</h3>
            <p className="text-xs text-slate-400">Share this link to watch together</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Direct Invitation Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 glass-input px-3 py-2 text-xs text-slate-300 rounded-xl select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-dark-card/60 border border-white/5 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-indigo-300 font-medium">
              <Users className="w-4 h-4 shrink-0" />
              <span>Room Rules & Capacity</span>
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-4">
              <li>Max capacity: <strong>5 participants</strong> (including host).</li>
              <li>Guests can join instantly without creating an account.</li>
              <li>The host controls video playback and track selection.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
