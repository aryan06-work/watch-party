import React, { useState, useEffect, useCallback } from 'react';
import { getSocket } from './services/socket';
import { PublicRoomState, ReactionItem, PlaybackStatus, ChatMessage } from './types';
import { Landing } from './components/Landing';
import { RoomView } from './components/RoomView';
import { JoinModal } from './components/JoinModal';
import { Toast, ToastMessage } from './components/Toast';
import { extractRoomCode, getSavedSessionToken, saveSessionToken } from './utils/format';

export const App: React.FC = () => {
  const [currentRoom, setCurrentRoom] = useState<PublicRoomState | null>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const [isJoiningLanding, setIsJoiningLanding] = useState<boolean>(false);
  const [landingJoinError, setLandingJoinError] = useState<string | null>(null);
  const [joinModal, setJoinModal] = useState<{
    open: boolean;
    roomCode: string;
    error: string | null;
    loading: boolean;
  }>({
    open: false,
    roomCode: '',
    error: null,
    loading: false,
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initialize socket and listeners
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('room:participants_updated', ({ participants }) => {
      setCurrentRoom((prev) => (prev ? { ...prev, participants } : null));
    });

    socket.on('video:changed', ({ video, playback }) => {
      setCurrentRoom((prev) => (prev ? { ...prev, video, playback } : null));
    });

    socket.on('playback:sync', ({ playback }) => {
      setCurrentRoom((prev) => (prev ? { ...prev, playback } : null));
    });

    socket.on('chat:message', (message: ChatMessage) => {
      setCurrentRoom((prev) => {
        if (!prev) return null;
        // Avoid duplicate messages
        if (prev.messages.some((m) => m.id === message.id)) return prev;
        return {
          ...prev,
          messages: [...prev.messages, message],
        };
      });
    });

    socket.on('reaction:broadcast', (reaction: ReactionItem) => {
      setReactions((prev) => [...prev.slice(-20), reaction]);
    });

    socket.on('host:updated', ({ hostName, hostSessionToken, participants }) => {
      setCurrentRoom((prev) => {
        if (!prev) return null;
        const isCurrentUserHost = prev ? sessionToken === hostSessionToken : false;
        return {
          ...prev,
          hostName,
          isCurrentUserHost,
          participants,
        };
      });
    });

    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:participants_updated');
      socket.off('video:changed');
      socket.off('playback:sync');
      socket.off('chat:message');
      socket.off('reaction:broadcast');
      socket.off('host:updated');
    };
  }, [sessionToken]);

  // Check URL query parameters for direct room link (e.g. ?room=tg-xxxx-xxxx)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !currentRoom) {
      const extracted = extractRoomCode(roomParam);
      setJoinModal({
        open: true,
        roomCode: extracted,
        error: null,
        loading: false,
      });
    }
  }, [currentRoom]);

  // Create Room action
  const handleCreateRoom = (hostName: string) => {
    setIsCreatingRoom(true);
    const socket = getSocket();

    const doCreate = () => {
      socket.emit(
        'room:create',
        { hostName },
        (response: { success: boolean; code?: string; sessionToken?: string; state?: PublicRoomState; error?: string }) => {
          setIsCreatingRoom(false);
          if (response.success && response.state && response.sessionToken) {
            setSessionToken(response.sessionToken);
            setCurrentRoom(response.state);
            saveSessionToken(response.state.code, response.sessionToken);
            window.history.pushState({}, '', `?room=${response.state.code}`);
            addToast(`Room ${response.state.code} created! You are the host.`, 'success');
          } else {
            addToast(response.error || 'Failed to create room.', 'error');
          }
        }
      );
    };

    if (socket.connected) {
      doCreate();
    } else {
      socket.connect();
      socket.once('connect', doCreate);
    }
  };

  // Join Room action
  const handleJoinRoom = (code: string, name: string) => {
    const cleanCode = extractRoomCode(code);
    if (!cleanCode) {
      setLandingJoinError('Please enter a valid room code or paste an invite link.');
      return;
    }

    setIsJoiningLanding(true);
    setLandingJoinError(null);
    setJoinModal((prev) => ({ ...prev, loading: true, error: null }));

    const socket = getSocket();
    const cachedToken = getSavedSessionToken(cleanCode);

    const doJoin = () => {
      socket.emit(
        'room:join',
        { code: cleanCode, name, sessionToken: cachedToken },
        (response: { success: boolean; sessionToken?: string; state?: PublicRoomState; error?: string }) => {
          setIsJoiningLanding(false);
          if (response.success && response.state && response.sessionToken) {
            setSessionToken(response.sessionToken);
            setCurrentRoom(response.state);
            saveSessionToken(response.state.code, response.sessionToken);
            setJoinModal({ open: false, roomCode: '', error: null, loading: false });
            setLandingJoinError(null);
            window.history.pushState({}, '', `?room=${response.state.code}`);
            addToast(`Joined room ${response.state.code}!`, 'success');
          } else {
            const errorMsg = response.error || 'Unable to join room. Verify the code and try again.';
            setLandingJoinError(errorMsg);
            setJoinModal((prev) => ({
              ...prev,
              loading: false,
              error: errorMsg,
            }));
            addToast(errorMsg, 'error');
          }
        }
      );
    };

    if (socket.connected) {
      doJoin();
    } else {
      socket.connect();
      socket.once('connect', doJoin);
    }
  };

  // Change video source (Host only)
  const handleSetVideo = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!currentRoom) return resolve(false);
      const socket = getSocket();

      socket.emit(
        'video:change',
        { code: currentRoom.code, sessionToken, url },
        (res: { success: boolean; error?: string }) => {
          if (res.success) {
            addToast('Video loaded successfully.', 'success');
            resolve(true);
          } else {
            addToast(res.error || 'Failed to load video.', 'error');
            resolve(false);
          }
        }
      );
    });
  };

  // Host playback update (play, pause, seek)
  const handlePlaybackChange = (status: PlaybackStatus, currentTime: number) => {
    if (!currentRoom || !currentRoom.isCurrentUserHost) return;
    const socket = getSocket();

    socket.emit('playback:update', {
      code: currentRoom.code,
      sessionToken,
      status,
      currentTime,
      speed: 1,
    });
  };

  // Force re-sync
  const handleForceSync = () => {
    if (!currentRoom || !currentRoom.isCurrentUserHost) return;
    const socket = getSocket();

    socket.emit('playback:update', {
      code: currentRoom.code,
      sessionToken,
      status: currentRoom.playback.status,
      currentTime: currentRoom.playback.currentTime,
      speed: currentRoom.playback.speed,
    });
    addToast('Playback state broadcasted to all participants.', 'info');
  };

  // Send Chat message
  const handleSendMessage = (text: string) => {
    if (!currentRoom) return;
    const socket = getSocket();

    socket.emit('chat:send', {
      code: currentRoom.code,
      sessionToken,
      text,
    });
  };

  // Send Emoji Reaction
  const handleSendReaction = (emoji: string) => {
    if (!currentRoom) return;
    const socket = getSocket();

    socket.emit('reaction:send', {
      code: currentRoom.code,
      sessionToken,
      emoji,
    });
  };

  // Transfer host role
  const handleTransferHost = (targetToken: string) => {
    if (!currentRoom) return;
    const socket = getSocket();

    socket.emit(
      'host:transfer',
      {
        code: currentRoom.code,
        sessionToken,
        targetSessionToken: targetToken,
      },
      (res: { success: boolean; error?: string }) => {
        if (res.success) {
          addToast('Host role transferred.', 'success');
        } else {
          addToast(res.error || 'Failed to transfer host role.', 'error');
        }
      }
    );
  };

  // Leave room
  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setSessionToken('');
    window.history.pushState({}, '', window.location.pathname);
    addToast('You left the room.', 'info');
  };

  return (
    <>
      {currentRoom ? (
        <RoomView
          roomState={currentRoom}
          currentUserToken={sessionToken}
          reactions={reactions}
          isConnected={isConnected}
          onLeaveRoom={handleLeaveRoom}
          onSetVideo={handleSetVideo}
          onPlaybackChange={handlePlaybackChange}
          onForceSync={handleForceSync}
          onSendMessage={handleSendMessage}
          onSendReaction={handleSendReaction}
          onTransferHost={handleTransferHost}
          onShowToast={addToast}
        />
      ) : (
        <Landing
          onCreateRoom={handleCreateRoom}
          onJoinRoom={(code, name) => handleJoinRoom(code, name)}
          isCreating={isCreatingRoom}
          joinError={landingJoinError}
          isJoining={isJoiningLanding}
        />
      )}

      {/* Direct Invite Join Modal */}
      <JoinModal
        roomCode={joinModal.roomCode}
        isOpen={joinModal.open}
        loading={joinModal.loading}
        error={joinModal.error}
        onJoin={(name) => handleJoinRoom(joinModal.roomCode, name)}
        onCancel={() => {
          setJoinModal({ open: false, roomCode: '', error: null, loading: false });
          window.history.pushState({}, '', window.location.pathname);
        }}
      />

      {/* Global Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};
