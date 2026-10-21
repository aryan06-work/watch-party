import React, { useState } from 'react';
import { PublicRoomState, ReactionItem, PlaybackStatus } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { HostControls } from './HostControls';
import { ChatPanel } from './ChatPanel';
import { ParticipantsList } from './ParticipantsList';
import { InviteModal } from './InviteModal';
import { Film, Share2, LogOut, Wifi, WifiOff, MessageSquare, Users, Copy, Check } from 'lucide-react';

interface RoomViewProps {
  roomState: PublicRoomState;
  currentUserToken: string;
  reactions: ReactionItem[];
  isConnected: boolean;
  onLeaveRoom: () => void;
  onSetVideo: (url: string) => Promise<boolean>;
  onPlaybackChange: (status: PlaybackStatus, currentTime: number) => void;
  onForceSync: () => void;
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  onTransferHost: (targetToken: string) => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const RoomView: React.FC<RoomViewProps> = ({
  roomState,
  currentUserToken,
  reactions,
  isConnected,
  onLeaveRoom,
  onSetVideo,
  onPlaybackChange,
  onForceSync,
  onSendMessage,
  onSendReaction,
  onTransferHost,
  onShowToast,
}) => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [mobileSidebarTab, setMobileSidebarTab] = useState<'chat' | 'participants'>('chat');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.code);
    setCopiedCode(true);
    onShowToast(`Room code ${roomState.code} copied!`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col text-slate-100">
      {/* Top Navbar */}
      <header className="h-16 border-b border-white/5 px-4 sm:px-6 flex items-center justify-between glass-panel sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-600/30">
            <Film className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-base tracking-tight hidden sm:inline">
            Together
          </span>

          {/* Room Code Badge */}
          <div className="flex items-center gap-1.5 ml-2 bg-dark-card px-2.5 py-1 rounded-xl border border-white/5">
            <span className="text-[11px] text-slate-400">Room:</span>
            <button
              onClick={handleCopyCode}
              className="font-mono text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              title="Click to copy room code"
            >
              <span>{roomState.code}</span>
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection Status Indicator */}
          <div
            className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
            }`}
          >
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3 animate-pulse" />}
            <span className="hidden sm:inline">{isConnected ? 'Live' : 'Connecting'}</span>
          </div>

          {/* Invite Button */}
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>

          {/* Leave Button */}
          <button
            onClick={onLeaveRoom}
            title="Leave Room"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/5 hover:border-rose-500/30 text-xs font-medium flex items-center gap-1 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-5 flex flex-col lg:flex-row gap-4">
        {/* Left Column: Video Player Stage & Controls */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Video Player */}
          <VideoPlayer
            video={roomState.video}
            isHost={roomState.isCurrentUserHost}
            playback={roomState.playback}
            reactions={reactions}
            onPlaybackChange={onPlaybackChange}
            onSelectPreset={roomState.isCurrentUserHost ? (url) => onSetVideo(url) : undefined}
          />

          {/* Host Controls Panel (Host Only) */}
          {roomState.isCurrentUserHost && (
            <HostControls
              currentUrl={roomState.video?.url}
              onSetVideo={onSetVideo}
              onForceSync={onForceSync}
            />
          )}

          {/* Video Title & Info Bar */}
          {roomState.video && (
            <div className="glass-panel p-3.5 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="truncate">
                <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-400 mr-2">
                  Now Playing
                </span>
                <span className="text-xs font-medium text-white">
                  {roomState.video.title || roomState.video.url}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 shrink-0">
                Host: <strong className="text-slate-200">{roomState.hostName}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Chat & Participants Sidebar */}
        <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-3 shrink-0">
          {/* Tab selector for mobile/small desktop view */}
          <div className="flex lg:hidden p-1 rounded-xl bg-dark-card border border-white/5">
            <button
              onClick={() => setMobileSidebarTab('chat')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                mobileSidebarTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setMobileSidebarTab('participants')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                mobileSidebarTab === 'participants'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Participants ({roomState.participants.length})</span>
            </button>
          </div>

          {/* Desktop: Participants on top, Chat on bottom */}
          <div className="hidden lg:block">
            <ParticipantsList
              participants={roomState.participants}
              currentUserToken={currentUserToken}
              isCurrentUserHost={roomState.isCurrentUserHost}
              maxParticipants={roomState.maxParticipants}
              onTransferHost={onTransferHost}
            />
          </div>

          <div className={`flex-1 flex flex-col ${mobileSidebarTab === 'chat' ? 'block' : 'hidden lg:flex'}`}>
            <ChatPanel
              messages={roomState.messages}
              currentUserToken={currentUserToken}
              onSendMessage={onSendMessage}
              onSendReaction={onSendReaction}
            />
          </div>

          <div className={`lg:hidden ${mobileSidebarTab === 'participants' ? 'block' : 'hidden'}`}>
            <ParticipantsList
              participants={roomState.participants}
              currentUserToken={currentUserToken}
              isCurrentUserHost={roomState.isCurrentUserHost}
              maxParticipants={roomState.maxParticipants}
              onTransferHost={onTransferHost}
            />
          </div>
        </div>
      </main>

      {/* Invite Modal */}
      <InviteModal
        roomCode={roomState.code}
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onShowToast={onShowToast}
      />
    </div>
  );
};
