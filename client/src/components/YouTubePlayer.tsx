import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PlaybackState, PlaybackStatus } from '../types';
import { ShieldAlert, Lock } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  url: string;
  isHost: boolean;
  playback: PlaybackState;
  onPlaybackChange: (status: PlaybackStatus, currentTime: number) => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  url,
  isHost,
  playback,
  onPlaybackChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isSyncingFromRemote = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [embedError, setEmbedError] = useState<string | null>(null);

  // Extract video ID from URL
  const getVideoId = (rawUrl: string): string | null => {
    const match = rawUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const videoId = getVideoId(url);

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (!videoId) return;

    const loadApi = () => {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
          initPlayer(videoId);
        };
      } else {
        initPlayer(videoId);
      }
    };

    const initPlayer = (id: string) => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore destroy error
        }
      }

      if (!containerRef.current) return;

      const playerDiv = document.createElement('div');
      playerDiv.id = `yt-player-${Date.now()}`;
      playerDiv.className = 'w-full h-full absolute inset-0';
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(playerDiv);

      playerRef.current = new window.YT.Player(playerDiv.id, {
        width: '100%',
        height: '100%',
        videoId: id,
        playerVars: {
          autoplay: 0,
          controls: isHost ? 1 : 0, // Disable controls for guests to guarantee sync
          disablekb: isHost ? 0 : 1,
          fs: 1,
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            setIsReady(true);
            setEmbedError(null);
          },
          onStateChange: handleStateChange,
          onError: (e: any) => {
            if (e.data === 101 || e.data === 150) {
              setEmbedError(
                'This YouTube video cannot be embedded because the video owner has disabled third-party player embedding. Please choose another public video.'
              );
            } else {
              setEmbedError('Unable to load this YouTube video. It might be private or removed.');
            }
          },
        },
      });
    };

    loadApi();

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore
        }
      }
    };
  }, [videoId, isHost]);

  // Handle local state changes (when host plays/pauses)
  const handleStateChange = useCallback(
    (event: any) => {
      if (!isHost || isSyncingFromRemote.current || !playerRef.current) return;

      const state = event.data;
      const currentTime = playerRef.current.getCurrentTime ? playerRef.current.getCurrentTime() : 0;

      if (state === window.YT.PlayerState.PLAYING) {
        onPlaybackChange('playing', currentTime);
      } else if (state === window.YT.PlayerState.PAUSED) {
        onPlaybackChange('paused', currentTime);
      } else if (state === window.YT.PlayerState.BUFFERING) {
        onPlaybackChange('buffering', currentTime);
      }
    },
    [isHost, onPlaybackChange]
  );

  // Sync with remote playback state
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    // Calculate expected target time based on server timestamp
    let targetTime = playback.currentTime;
    if (playback.status === 'playing') {
      const elapsed = (Date.now() - playback.updatedAt) / 1000;
      targetTime += elapsed * (playback.speed || 1);
    }

    try {
      const currentTime = playerRef.current.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
      const playerState = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : -1;
      const drift = Math.abs(currentTime - targetTime);

      isSyncingFromRemote.current = true;

      // Adjust seek time if drift exceeds 1.5 seconds
      if (drift > 1.5) {
        playerRef.current.seekTo(targetTime, true);
      }

      // Sync play/pause
      if (playback.status === 'playing' && playerState !== window.YT.PlayerState.PLAYING) {
        playerRef.current.playVideo();
      } else if (playback.status === 'paused' && playerState !== window.YT.PlayerState.PAUSED) {
        playerRef.current.pauseVideo();
      }
    } catch {
      // Ignored
    } finally {
      setTimeout(() => {
        isSyncingFromRemote.current = false;
      }, 300);
    }
  }, [isReady, playback]);

  if (embedError) {
    return (
      <div className="w-full aspect-video bg-dark-surface rounded-2xl border border-rose-500/30 flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-400 mb-3" />
        <h3 className="text-lg font-semibold text-rose-200 mb-1">Playback Restricted</h3>
        <p className="text-sm text-slate-400 max-w-md">{embedError}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/5">
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:border-0"
      />

      {/* Guest Lock Overlay to show sync indicator */}
      {!isHost && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-xs font-medium text-slate-300 border border-white/10 pointer-events-none select-none">
          <Lock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Synchronized with Host</span>
        </div>
      )}
    </div>
  );
};
