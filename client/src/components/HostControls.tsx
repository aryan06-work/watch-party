import React, { useState } from 'react';
import { Play, RefreshCw, AlertCircle, CheckCircle2, Film } from 'lucide-react';

interface HostControlsProps {
  currentUrl?: string;
  onSetVideo: (url: string) => Promise<boolean>;
  onForceSync: () => void;
}

export const HostControls: React.FC<HostControlsProps> = ({
  currentUrl = '',
  onSetVideo,
  onForceSync,
}) => {
  const [inputUrl, setInputUrl] = useState(currentUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setError(null);
    setLoading(true);

    // Client-side quick check for DRM
    if (/netflix\.com|disneyplus\.com|primevideo\.com|hulu\.com|hbomax\.com/i.test(inputUrl)) {
      setError('DRM-protected streaming services like Netflix and Disney+ cannot be synchronized legally or technically.');
      setLoading(false);
      return;
    }

    const success = await onSetVideo(inputUrl.trim());
    if (!success) {
      setError('Unable to load this video. Please ensure it is a public YouTube video or a direct HTTPS MP4/WebM URL.');
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel p-4 rounded-2xl border border-white/5 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Host Video Controls</h3>
        </div>
        <button
          onClick={onForceSync}
          title="Force re-synchronize all connected participants to your current playback time"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Force Sync All</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => {
              setInputUrl(e.target.value);
              setError(null);
            }}
            placeholder="Paste YouTube video or direct HTTPS MP4 link..."
            className="flex-1 glass-input px-3.5 py-2.5 text-xs text-white placeholder-slate-400 rounded-xl focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading || !inputUrl.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 shrink-0"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Load Video</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-[11px] text-rose-300 bg-rose-950/40 border border-rose-500/20 px-3 py-1.5 rounded-lg mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </div>
  );
};
