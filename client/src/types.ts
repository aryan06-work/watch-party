export type VideoType = 'youtube' | 'direct';

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'buffering';

export interface VideoSource {
  url: string;
  type: VideoType;
  title?: string;
}

export interface Participant {
  sessionToken: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
}

export interface PlaybackState {
  status: PlaybackStatus;
  currentTime: number;
  updatedAt: number;
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

export interface ReactionItem {
  id: string;
  emoji: string;
  senderName: string;
  timestamp: number;
  xOffset?: number;
}

export interface PublicRoomState {
  code: string;
  hostName: string;
  isCurrentUserHost: boolean;
  video: VideoSource | null;
  playback: PlaybackState;
  participants: Participant[];
  messages: ChatMessage[];
  maxParticipants: number;
  expiresAt: number;
}
