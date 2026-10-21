import React from 'react';
import { VideoSource, PlaybackState, PlaybackStatus, ReactionItem } from '../types';
import { YouTubePlayer } from './YouTubePlayer';
import { DirectVideoPlayer } from './DirectVideoPlayer';
import { ReactionOverlay } from './ReactionOverlay';
import { Film, PlayCircle, Sparkles, Clock } from 'lucide-react';

interface VideoPlayerProps {
  video: VideoSource | null;
  isHost: boolean;
  playback: PlaybackState;
  reactions: ReactionItem[];
  onPlaybackChange: (status: PlaybackStatus, currentTime: number) => void;
  onSelectPreset?: (url: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  isHost,
  playback,
  reactions,
  onPlaybackChange,
  onSelectPreset,
}) => {
  const PRESET_VIDEOS = [
    {
      title: 'Big Buck Bunny (MP4)',
      type: 'Direct MP4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    {
      title: 'Elephants Dream (MP4)',
      type: 'Direct MP4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    },
    {
      title: 'Blender Open Movie',
      type: 'YouTube',
      url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    },
  ];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-dark-surface border border-white/5 shadow-2xl">
      {video ? (
        <div className="relative w-full">
          {video.type === 'youtube' ? (
            <YouTubePlayer
              url={video.url}
              isHost={isHost}
              playback={playback}
              onPlaybackChange={onPlaybackChange}
            />
          ) : (
            <DirectVideoPlayer
              url={video.url}
              isHost={isHost}
              playback={playback}
              onPlaybackChange={onPlaybackChange}
            />
          )}

          {/* Floating reactions over video */}
          <ReactionOverlay reactions={reactions} />
        </div>
      ) : (
        <div className="w-full aspect-video flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-dark-surface to-dark-bg">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
            <Film className="w-8 h-8 animate-pulse-subtle" />
          </div>

          {isHost ? (
            <div className="max-w-md flex flex-col items-center">
              <h3 className="text-xl font-bold text-white mb-2">No Video Loaded Yet</h3>
              <p className="text-sm text-slate-400 mb-6">
                Enter a YouTube URL or direct HTTPS MP4 link below, or choose one of our quick presets to begin watching with your friends.
              </p>

              {onSelectPreset && (
                <div className="w-full flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Test Presets</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {PRESET_VIDEOS.map((preset) => (
                      <button
                        key={preset.title}
                        onClick={() => onSelectPreset(preset.url)}
                        className="px-3 py-2.5 rounded-xl bg-dark-card hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/40 text-left transition-all group"
                      >
                        <div className="text-xs font-medium text-slate-200 group-hover:text-indigo-300 truncate">
                          {preset.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{preset.type}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-sm flex flex-col items-center">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-3">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Waiting for Host</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Grab Some Popcorn!</h3>
              <p className="text-xs text-slate-400">
                The host is currently picking a video for the room. Playback will begin automatically once chosen.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
