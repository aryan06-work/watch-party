export type VideoType = 'youtube' | 'direct';

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'buffering';

export interface VideoSource {
  url: string;
  type: VideoType;
  title?: string;
}

export interface Participant {
  id: string; // Socket ID
  sessionToken: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
  lastSeenAt: number;
}

export interface PlaybackState {
  status: PlaybackStatus;
  currentTime: number; // in seconds
  updatedAt: number; // epoch ms when currentTime was recorded
  speed: number;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderSessionToken: string;
  isHost: boolean;
  isSystem: boolean;
  text: string;
  timestamp: number;
}

export interface Reaction {
  id: string;
  emoji: string;
  senderName: string;
  timestamp: number;
}

export interface Room {
  code: string;
  hostSessionToken: string;
  hostName: string;
  video: VideoSource | null;
  playback: PlaybackState;
  participants: Map<string, Participant>; // key: sessionToken
  messages: ChatMessage[];
  createdAt: number;
  expiresAt: number;
  maxParticipants: number;
}

export interface PublicRoomState {
  code: string;
  hostName: string;
  isCurrentUserHost: boolean;
  video: VideoSource | null;
  playback: PlaybackState;
  participants: Array<{
    sessionToken: string;
    name: string;
    isHost: boolean;
    joinedAt: number;
  }>;
  messages: ChatMessage[];
  maxParticipants: number;
  expiresAt: number;
}
