import React, { useState } from 'react';
import { Film, Users, Zap, Shield, Sparkles, MessageCircle, PlayCircle, Heart, Lock, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { extractRoomCode } from '../utils/format';

interface LandingProps {
  onCreateRoom: (hostName: string) => void;
  onJoinRoom: (code: string, name: string) => void;
  isCreating: boolean;
  joinError?: string | null;
  isJoining?: boolean;
}

export const Landing: React.FC<LandingProps> = ({
  onCreateRoom,
  onJoinRoom,
  isCreating,
  joinError,
  isJoining = false,
}) => {
  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    onCreateRoom(createName.trim());
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !joinName.trim()) return;
    const cleanCode = extractRoomCode(joinCode);
    onJoinRoom(cleanCode, joinName.trim());
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background radial gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/15 blur-[140px] pointer-events-none rounded-full" />

      {/* Navigation */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">Together</span>
            <span className="ml-2 text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              Free Watch Party
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-5xl mx-auto px-6 py-12 flex flex-col lg:flex-row items-center gap-12 relative z-10">
        {/* Left column: Tagline & copy */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>No account required • Instant synchronization</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            Watch together, <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
              wherever you are.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Create a private room, invite up to 4 friends, and watch supported online videos together with frame-accurate synchronized playback, live chat, and emoji reactions.
          </p>

          {/* Value points */}
          <div className="grid grid-cols-2 gap-3 pt-2 max-w-md mx-auto lg:mx-0 text-left">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Real-time playback sync</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Users className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Up to 5 friends per room</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Heart className="w-4 h-4 text-pink-400 shrink-0" />
              <span>Live floating emoji reactions</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Private & guest-friendly</span>
            </div>
          </div>
        </div>

        {/* Right column: Action Card */}
        <div className="w-full max-w-md">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
            {/* Tab selector */}
            <div className="flex p-1 rounded-xl bg-dark-bg/80 border border-white/5 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'create'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create a Room
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('join')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'join'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Join a Room
              </button>
            </div>

            {activeTab === 'create' ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                    Your Display Name (Host)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={24}
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full glass-input px-4 py-3 text-sm text-white placeholder-slate-500 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isCreating || !createName.trim()}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 group"
                  >
                    <span>{isCreating ? 'Creating Room...' : 'Start Watch Party'}</span>
                    <PlayCircle className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
                <p className="text-[11px] text-center text-slate-400">
                  Instant room creation with a private 24-hour invite link.
                </p>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                    Room Code or Shared Link
                  </label>
                  <input
                    type="text"
                    required
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="e.g. yykq-3r5u or paste invite link"
                    className="w-full glass-input px-4 py-3 text-sm text-white placeholder-slate-500 font-mono rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                    Your Display Name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={24}
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="e.g. Jordan"
                    className="w-full glass-input px-4 py-3 text-sm text-white placeholder-slate-500 rounded-xl focus:outline-none"
                  />
                </div>

                {joinError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{joinError}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isJoining || !joinCode.trim() || !joinName.trim()}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    {isJoining ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Joining Room...</span>
                      </>
                    ) : (
                      <span>Join Room</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Supported / Unsupported Video Guidelines section */}
      <section className="w-full max-w-5xl mx-auto px-6 py-10 relative z-10 border-t border-white/5">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6">
          Supported Video Sources
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-dark-surface/50 border border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <PlayCircle className="w-4 h-4" />
              <span>Supported Sources</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
              <li>
                <strong>Public YouTube videos</strong> embedded via official YouTube IFrame Player API.
              </li>
              <li>
                <strong>Direct HTTPS media links</strong> (MP4, WebM) with standard browser cross-origin headers.
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-dark-surface/50 border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Unsupported Sources</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
              <li>
                <strong>DRM-protected services</strong> (Netflix, Disney+, Prime Video, Hulu) cannot be embedded.
              </li>
              <li>
                Arbitrary webpages, video downloads, and private/age-restricted embeds.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 relative z-10 border-t border-white/5">
        Together • Watch together, wherever you are • Free & Open Web Application
      </footer>
    </div>
  );
};
