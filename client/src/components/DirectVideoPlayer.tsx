import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PlaybackState, PlaybackStatus } from '../types';
import { VolumeX, Volume2, AlertCircle, Lock } from 'lucide-react';

interface DirectVideoPlayerProps {
  url: string;
  isHost: boolean;
  playback: PlaybackState;
  onPlaybackChange: (status: PlaybackStatus, currentTime: number) => void;
}

export const DirectVideoPlayer: React.FC<DirectVideoPlayerProps> = ({
  url,
  isHost,
  playback,
  onPlaybackChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isSyncingFromRemote = useRef(false);
  const [hasAutoplayBlocked, setHasAutoplayBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Sync from remote playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let targetTime = playback.currentTime;
    if (playback.status === 'playing') {
      const elapsed = (Date.now() - playback.updatedAt) / 1000;
      targetTime += elapsed * (playback.speed || 1);
    }

    const drift = Math.abs(video.currentTime - targetTime);
    isSyncingFromRemote.current = true;

    if (drift > 1.5) {
      video.currentTime = targetTime;
    }

    if (playback.status === 'playing') {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Browser prevented autoplay without interaction
          setHasAutoplayBlocked(true);
        });
      }
    } else if (playback.status === 'paused' && !video.paused) {
      video.pause();
    }

    const timer = setTimeout(() => {
      isSyncingFromRemote.current = false;
    }, 300);

    return () => clearTimeout(timer);
  }, [playback]);

  const handlePlay = useCallback(() => {
    if (!isHost || isSyncingFromRemote.current || !videoRef.current) return;
    onPlaybackChange('playing', videoRef.current.currentTime);
  }, [isHost, onPlaybackChange]);

  const handlePause = useCallback(() => {
    if (!isHost || isSyncingFromRemote.current || !videoRef.current) return;
    onPlaybackChange('paused', videoRef.current.currentTime);
  }, [isHost, onPlaybackChange]);

  const handleSeeked = useCallback(() => {
    if (!isHost || isSyncingFromRemote.current || !videoRef.current) return;
    const status: PlaybackStatus = videoRef.current.paused ? 'paused' : 'playing';
    onPlaybackChange(status, videoRef.current.currentTime);
  }, [isHost, onPlaybackChange]);

  const handleUnmuteAndPlay = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = false;
    setIsMuted(false);
    videoRef.current.play().then(() => {
      setHasAutoplayBlocked(false);
    }).catch(() => {
      // Fallback
    });
  };

  if (loadError) {
    return (
      <div className="w-full aspect-video bg-dark-surface rounded-2xl border border-rose-500/30 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mb-3" />
        <h3 className="text-lg font-semibold text-rose-200 mb-1">Direct Video Error</h3>
        <p className="text-sm text-slate-400 max-w-md">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/5 group">
      <video
        ref={videoRef}
        src={url}
        playsInline
        controls={isHost}
        onPlay={handlePlay}
        onPause={handlePause}
        onSeeked={handleSeeked}
        onError={() =>
          setLoadError(
            'Failed to load video file. Please verify that the HTTPS direct link is accessible and formatted as MP4 or WebM.'
          )
        }
        className="w-full h-full object-contain"
      />

      {/* Guest Lock Indicator */}
      {!isHost && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-xs font-medium text-slate-300 border border-white/10 pointer-events-none select-none">
          <Lock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Synchronized with Host</span>
        </div>
      )}

      {/* Autoplay blocked banner for guest interaction */}
      {hasAutoplayBlocked && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
          <VolumeX className="w-12 h-12 text-amber-400 mb-3 animate-bounce" />
          <h4 className="text-lg font-semibold text-white mb-2">Click to Join Audio & Sync</h4>
          <p className="text-xs text-slate-300 max-w-xs mb-4">
            Your browser requires an initial click before allowing synchronized audio playback.
          </p>
          <button
            onClick={handleUnmuteAndPlay}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-600/30"
          >
            Start Watching
          </button>
        </div>
      )}
    </div>
  );
};
