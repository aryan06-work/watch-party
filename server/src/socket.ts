import { Server, Socket } from 'socket.io';
import { store } from './store.js';
import { parseAndValidateVideoUrl, sanitizeText } from './utils.js';
import { PlaybackStatus } from './types.js';
import crypto from 'crypto';

const ALLOWED_EMOJIS = new Set(['❤️', '😂', '🔥', '😮', '👏', '🎉', '🍿', '😱']);

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {

    /**
     * Create a new room
     */
    socket.on('room:create', (payload: { hostName: string }, callback) => {
      try {
        const hostName = sanitizeText(payload?.hostName || 'Host', 32);
        const { room, hostSessionToken } = store.createRoom(hostName);

        const joinResult = store.joinRoom(room.code, hostSessionToken, hostName, socket.id);
        if (!joinResult.success) {
          return callback?.({ success: false, error: joinResult.error });
        }

        socket.join(room.code);
        const publicState = store.getPublicState(room, hostSessionToken);

        callback?.({
          success: true,
          code: room.code,
          sessionToken: hostSessionToken,
          state: publicState,
        });
      } catch (err: any) {
        callback?.({ success: false, error: err?.message || 'Failed to create room.' });
      }
    });

    /**
     * Join an existing room
     */
    socket.on('room:join', (payload: { code: string; name: string; sessionToken?: string }, callback) => {
      try {
        const { code, name, sessionToken } = payload || {};
        if (!code) {
          return callback?.({ success: false, error: 'Room code is required.' });
        }

        const sanitizedName = sanitizeText(name || 'Guest', 32);
        const result = store.joinRoom(code, sessionToken, sanitizedName, socket.id);

        if (!result.success || !result.room || !result.participant) {
          return callback?.({ success: false, error: result.error || 'Unable to join room.' });
        }

        const room = result.room;
        const participant = result.participant;
        const userSessionToken = result.sessionToken!;

        socket.join(room.code);

        // Add system message if not a reconnect
        if (!result.isReconnect) {
          const sysMsg = {
            id: crypto.randomUUID(),
            senderName: 'System',
            senderSessionToken: 'system',
            isHost: false,
            isSystem: true,
            text: `${participant.name} joined the room.`,
            timestamp: Date.now(),
          };
          store.addChatMessage(room.code, sysMsg);
          io.to(room.code).emit('chat:message', sysMsg);
        }

        // Notify room of participant update
        io.to(room.code).emit('room:participants_updated', {
          participants: Array.from(room.participants.values()).map((p) => ({
            sessionToken: p.sessionToken,
            name: p.name,
            isHost: p.isHost,
            joinedAt: p.joinedAt,
          })),
        });

        const publicState = store.getPublicState(room, userSessionToken);

        callback?.({
          success: true,
          sessionToken: userSessionToken,
          state: publicState,
        });
      } catch (err: any) {
        callback?.({ success: false, error: err?.message || 'Failed to join room.' });
      }
    });

    /**
     * Video change (Host only)
     */
    socket.on('video:change', (payload: { code: string; sessionToken: string; url: string }, callback) => {
      try {
        const { code, sessionToken, url } = payload || {};
        const validation = parseAndValidateVideoUrl(url);

        if (!validation.valid || !validation.source) {
          return callback?.({ success: false, error: validation.error || 'Invalid video link.' });
        }

        const result = store.setVideo(code, sessionToken, validation.source);
        if (!result.success || !result.room) {
          return callback?.({ success: false, error: result.error });
        }

        const room = result.room;

        // Broadcast new video and reset playback
        io.to(room.code).emit('video:changed', {
          video: room.video,
          playback: room.playback,
        });

        // Add system chat message
        const sysMsg = {
          id: crypto.randomUUID(),
          senderName: 'System',
          senderSessionToken: 'system',
          isHost: false,
          isSystem: true,
          text: `Host loaded video: ${validation.source.title || validation.source.url}`,
          timestamp: Date.now(),
        };
        store.addChatMessage(room.code, sysMsg);
        io.to(room.code).emit('chat:message', sysMsg);

        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err?.message || 'Failed to change video.' });
      }
    });

    /**
     * Playback update: play, pause, seek (Host only)
     */
    socket.on(
      'playback:update',
      (payload: {
        code: string;
        sessionToken: string;
        status: PlaybackStatus;
        currentTime: number;
        speed?: number;
      }, callback) => {
        try {
          const { code, sessionToken, status, currentTime, speed = 1 } = payload || {};
          const result = store.updatePlayback(code, sessionToken, status, currentTime, speed);

          if (!result.success || !result.room) {
            return callback?.({ success: false, error: result.error });
          }

          const room = result.room;

          // Broadcast state to all other participants
          socket.to(room.code).emit('playback:sync', {
            playback: room.playback,
            serverTimestamp: Date.now(),
          });

          callback?.({ success: true });
        } catch (err: any) {
          callback?.({ success: false, error: err?.message || 'Failed to update playback.' });
        }
      }
    );

    /**
     * Request accurate server playback state (drift recovery)
     */
    socket.on('playback:request_sync', (payload: { code: string }, callback) => {
      try {
        const { code } = payload || {};
        const room = store.getRoom(code);
        if (!room) {
          return callback?.({ success: false, error: 'Room not found.' });
        }

        let calculatedTime = room.playback.currentTime;
        if (room.playback.status === 'playing') {
          const elapsed = (Date.now() - room.playback.updatedAt) / 1000;
          calculatedTime += elapsed * (room.playback.speed || 1);
        }

        callback?.({
          success: true,
          playback: {
            ...room.playback,
            currentTime: calculatedTime,
          },
          serverTimestamp: Date.now(),
        });
      } catch (err: any) {
        callback?.({ success: false, error: err?.message || 'Failed to sync playback.' });
      }
    });

    /**
     * Chat message
     */
    socket.on('chat:send', (payload: { code: string; sessionToken: string; text: string }, callback) => {
      try {
        const { code, sessionToken, text } = payload || {};
        const cleanText = sanitizeText(text, 500);
        if (!cleanText) {
          return callback?.({ success: false, error: 'Message cannot be empty.' });
        }

        const room = store.getRoom(code);
        if (!room) {
          return callback?.({ success: false, error: 'Room not found.' });
        }

        const participant = room.participants.get(sessionToken);
        if (!participant) {
          return callback?.({ success: false, error: 'Participant not in room.' });
        }

        const message = {
          id: crypto.randomUUID(),
          senderName: participant.name,
          senderSessionToken: sessionToken,
          isHost: participant.isHost,
          isSystem: false,
          text: cleanText,
          timestamp: Date.now(),
        };

        store.addChatMessage(room.code, message);
        io.to(room.code).emit('chat:message', message);

        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err?.message || 'Failed to send message.' });
      }
    });

    /**
     * Emoji reaction
     */
    socket.on('reaction:send', (payload: { code: string; sessionToken: string; emoji: string }) => {
      try {
        const { code, sessionToken, emoji } = payload || {};
        if (!ALLOWED_EMOJIS.has(emoji)) return;

        const room = store.getRoom(code);
        if (!room) return;

        const participant = room.participants.get(sessionToken);
        const senderName = participant ? participant.name : 'Someone';

        io.to(room.code).emit('reaction:broadcast', {
          id: crypto.randomUUID(),
          emoji,
          senderName,
          timestamp: Date.now(),
        });
      } catch {
        // Silent fail for non-critical reactions
      }
    });

    /**
     * Transfer host role
     */
    socket.on(
      'host:transfer',
      (payload: { code: string; sessionToken: string; targetSessionToken: string }, callback) => {
        try {
          const { code, sessionToken, targetSessionToken } = payload || {};
          const result = store.transferHost(code, sessionToken, targetSessionToken);

          if (!result.success || !result.room || !result.newHost) {
            return callback?.({ success: false, error: result.error });
          }

          const room = result.room;
          const newHost = result.newHost;

          const sysMsg = {
            id: crypto.randomUUID(),
            senderName: 'System',
            senderSessionToken: 'system',
            isHost: false,
            isSystem: true,
            text: `${newHost.name} is now the room host.`,
            timestamp: Date.now(),
          };
          store.addChatMessage(room.code, sysMsg);

          io.to(room.code).emit('host:updated', {
            hostName: newHost.name,
            hostSessionToken: newHost.sessionToken,
            participants: Array.from(room.participants.values()).map((p) => ({
              sessionToken: p.sessionToken,
              name: p.name,
              isHost: p.isHost,
              joinedAt: p.joinedAt,
            })),
          });
          io.to(room.code).emit('chat:message', sysMsg);

          callback?.({ success: true });
        } catch (err: any) {
          callback?.({ success: false, error: err?.message || 'Failed to transfer host.' });
        }
      }
    );

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      try {
        const { room, removedParticipant, newHost } = store.removeParticipant(socket.id);
        if (!room || !removedParticipant) return;

        // Broadcast participant departure
        io.to(room.code).emit('room:participants_updated', {
          participants: Array.from(room.participants.values()).map((p) => ({
            sessionToken: p.sessionToken,
            name: p.name,
            isHost: p.isHost,
            joinedAt: p.joinedAt,
          })),
        });

        const leaveMsg = {
          id: crypto.randomUUID(),
          senderName: 'System',
          senderSessionToken: 'system',
          isHost: false,
          isSystem: true,
          text: `${removedParticipant.name} left the room.`,
          timestamp: Date.now(),
        };
        store.addChatMessage(room.code, leaveMsg);
        io.to(room.code).emit('chat:message', leaveMsg);

        // If a new host was chosen due to disconnect
        if (newHost) {
          const promoMsg = {
            id: crypto.randomUUID(),
            senderName: 'System',
            senderSessionToken: 'system',
            isHost: false,
            isSystem: true,
            text: `${newHost.name} has been promoted to host.`,
            timestamp: Date.now(),
          };
          store.addChatMessage(room.code, promoMsg);

          io.to(room.code).emit('host:updated', {
            hostName: newHost.name,
            hostSessionToken: newHost.sessionToken,
            participants: Array.from(room.participants.values()).map((p) => ({
              sessionToken: p.sessionToken,
              name: p.name,
              isHost: p.isHost,
              joinedAt: p.joinedAt,
            })),
          });
          io.to(room.code).emit('chat:message', promoMsg);
        }
      } catch {
        // Disconnect safety
      }
    });
  });
}
