import { Room, Participant, PlaybackStatus, VideoSource, ChatMessage, PublicRoomState } from './types.js';
import { generateRoomCode, generateSessionToken } from './utils.js';

class RoomStore {
  private rooms: Map<string, Room> = new Map();
  private socketToRoomMap: Map<string, { roomCode: string; sessionToken: string }> = new Map();

  constructor() {
    // Periodically clean up expired rooms (every 10 minutes)
    setInterval(() => this.cleanupExpiredRooms(), 10 * 60 * 1000);
  }

  /**
   * Create a new room with host
   */
  public createRoom(hostName: string): { room: Room; hostSessionToken: string } {
    let code = generateRoomCode();
    while (this.rooms.has(code)) {
      code = generateRoomCode();
    }

    const hostSessionToken = generateSessionToken();
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

    const room: Room = {
      code,
      hostSessionToken,
      hostName,
      video: null,
      playback: {
        status: 'idle',
        currentTime: 0,
        updatedAt: now,
        speed: 1,
      },
      participants: new Map(),
      messages: [],
      createdAt: now,
      expiresAt,
      maxParticipants: 5,
    };

    this.rooms.set(code, room);
    return { room, hostSessionToken };
  }

  /**
   * Get room by code
   */
  public getRoom(code: string): Room | null {
    const room = this.rooms.get(code.toLowerCase());
    if (!room) return null;

    if (Date.now() > room.expiresAt) {
      this.rooms.delete(code.toLowerCase());
      return null;
    }

    return room;
  }

  /**
   * Join room
   */
  public joinRoom(
    code: string,
    existingSessionToken: string | undefined,
    name: string,
    socketId: string
  ): {
    success: boolean;
    error?: string;
    room?: Room;
    participant?: Participant;
    sessionToken?: string;
    isReconnect?: boolean;
    wasPromotedHost?: boolean;
  } {
    const cleanCode = code.toLowerCase().trim();
    const room = this.getRoom(cleanCode);

    if (!room) {
      return { success: false, error: 'Room not found or has expired.' };
    }

    const cleanName = (name || 'Anonymous').trim().slice(0, 32);

    // Reconnection check
    if (existingSessionToken && room.participants.has(existingSessionToken)) {
      const participant = room.participants.get(existingSessionToken)!;
      participant.id = socketId;
      participant.lastSeenAt = Date.now();
      participant.name = cleanName || participant.name;

      this.socketToRoomMap.set(socketId, { roomCode: cleanCode, sessionToken: existingSessionToken });

      return {
        success: true,
        room,
        participant,
        sessionToken: existingSessionToken,
        isReconnect: true,
      };
    }

    // Capacity check
    if (room.participants.size >= room.maxParticipants) {
      return {
        success: false,
        error: `This room is full (maximum ${room.maxParticipants} participants reached).`,
      };
    }

    const isHost = existingSessionToken === room.hostSessionToken || room.participants.size === 0;
    const sessionToken = existingSessionToken || generateSessionToken();

    const participant: Participant = {
      id: socketId,
      sessionToken,
      name: cleanName,
      isHost,
      joinedAt: Date.now(),
      lastSeenAt: Date.now(),
    };

    if (isHost) {
      room.hostSessionToken = sessionToken;
      room.hostName = cleanName;
    }

    room.participants.set(sessionToken, participant);
    this.socketToRoomMap.set(socketId, { roomCode: cleanCode, sessionToken });

    return {
      success: true,
      room,
      participant,
      sessionToken,
      isReconnect: false,
    };
  }

  /**
   * Remove participant by socket ID
   */
  public removeParticipant(socketId: string): {
    room: Room | null;
    removedParticipant: Participant | null;
    newHost: Participant | null;
  } {
    const entry = this.socketToRoomMap.get(socketId);
    if (!entry) return { room: null, removedParticipant: null, newHost: null };

    this.socketToRoomMap.delete(socketId);
    const room = this.rooms.get(entry.roomCode);
    if (!room) return { room: null, removedParticipant: null, newHost: null };

    const participant = room.participants.get(entry.sessionToken);
    if (!participant) return { room, removedParticipant: null, newHost: null };

    room.participants.delete(entry.sessionToken);

    let newHost: Participant | null = null;
    // If the host disconnected and others remain, migrate host status
    if (participant.isHost && room.participants.size > 0) {
      const remaining = Array.from(room.participants.values()).sort(
        (a, b) => a.joinedAt - b.joinedAt
      );
      newHost = remaining[0];
      newHost.isHost = true;
      room.hostSessionToken = newHost.sessionToken;
      room.hostName = newHost.name;
    }

    return { room, removedParticipant: participant, newHost };
  }

  /**
   * Set video source (Host only)
   */
  public setVideo(
    code: string,
    sessionToken: string,
    source: VideoSource
  ): { success: boolean; error?: string; room?: Room } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found.' };

    if (room.hostSessionToken !== sessionToken) {
      return { success: false, error: 'Only the room host can change the video.' };
    }

    const now = Date.now();
    room.video = source;
    room.playback = {
      status: 'paused',
      currentTime: 0,
      updatedAt: now,
      speed: 1,
    };

    return { success: true, room };
  }

  /**
   * Update playback state (Host only)
   */
  public updatePlayback(
    code: string,
    sessionToken: string,
    status: PlaybackStatus,
    currentTime: number,
    speed = 1
  ): { success: boolean; error?: string; room?: Room } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found.' };

    if (room.hostSessionToken !== sessionToken) {
      return { success: false, error: 'Only the room host can control playback.' };
    }

    const now = Date.now();
    room.playback = {
      status,
      currentTime: Math.max(0, currentTime),
      updatedAt: now,
      speed,
    };

    return { success: true, room };
  }

  /**
   * Transfer host role
   */
  public transferHost(
    code: string,
    currentHostToken: string,
    targetSessionToken: string
  ): { success: boolean; error?: string; room?: Room; newHost?: Participant } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found.' };

    if (room.hostSessionToken !== currentHostToken) {
      return { success: false, error: 'Only current host can transfer host status.' };
    }

    const target = room.participants.get(targetSessionToken);
    if (!target) return { success: false, error: 'Target participant not found in room.' };

    const oldHost = room.participants.get(currentHostToken);
    if (oldHost) oldHost.isHost = false;

    target.isHost = true;
    room.hostSessionToken = target.sessionToken;
    room.hostName = target.name;

    return { success: true, room, newHost: target };
  }

  /**
   * Add chat message (capped at 200)
   */
  public addChatMessage(code: string, message: ChatMessage): void {
    const room = this.getRoom(code);
    if (!room) return;

    room.messages.push(message);
    if (room.messages.length > 200) {
      room.messages.shift();
    }
  }

  /**
   * Format room state for client consumption
   */
  public getPublicState(room: Room, currentSessionToken: string): PublicRoomState {
    const isCurrentUserHost = room.hostSessionToken === currentSessionToken;

    return {
      code: room.code,
      hostName: room.hostName,
      isCurrentUserHost,
      video: room.video,
      playback: room.playback,
      participants: Array.from(room.participants.values()).map((p) => ({
        sessionToken: p.sessionToken,
        name: p.name,
        isHost: p.isHost,
        joinedAt: p.joinedAt,
      })),
      messages: room.messages,
      maxParticipants: room.maxParticipants,
      expiresAt: room.expiresAt,
    };
  }

  /**
   * Periodic expiration cleanup
   */
  private cleanupExpiredRooms(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      if (now > room.expiresAt) {
        this.rooms.delete(code);
      }
    }
  }
}

export const store = new RoomStore();
