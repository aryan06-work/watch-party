import crypto from 'crypto';
import { VideoSource } from './types.js';

/**
 * Generate a cryptographically random, URL-friendly room code.
 * Format: 8-character alphanumeric string, e.g. 'tg-7x9k-2m4p'
 */
export function generateRoomCode(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // Crockford-style base32 (no ambiguous 0, O, 1, l, I)
  const bytes = crypto.randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * Generate a secure participant session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Supported & Unsupported video patterns
 */
const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const DIRECT_VIDEO_REGEX = /^https:\/\/[^\s]+\.(mp4|webm|ogv|mov)(\?[^\s]*)?$/i;
const UNSUPPORTED_DRM_REGEX = /(netflix\.com|disneyplus\.com|primevideo\.com|hulu\.com|hbomax\.com|max\.com|apple\.com\/tv)/i;

export interface VideoValidationResult {
  valid: boolean;
  source?: VideoSource;
  error?: string;
}

/**
 * Validate and classify input video URLs
 */
export function parseAndValidateVideoUrl(rawUrl: string): VideoValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Please provide a valid URL.' };
  }

  const cleanUrl = rawUrl.trim();

  // Check for DRM / subscription services
  if (UNSUPPORTED_DRM_REGEX.test(cleanUrl)) {
    return {
      valid: false,
      error: 'DRM-protected services (like Netflix, Disney+, Prime Video) cannot be embedded or synchronized due to legal and technical restrictions.',
    };
  }

  // Check YouTube
  const ytMatch = cleanUrl.match(YOUTUBE_REGEX);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      valid: true,
      source: {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title: `YouTube (${videoId})`,
        type: 'youtube',
      },
    };
  }

  // Check direct HTTPS video
  if (DIRECT_VIDEO_REGEX.test(cleanUrl)) {
    if (!cleanUrl.startsWith('https://')) {
      return {
        valid: false,
        error: 'Only secure HTTPS direct video links are supported to prevent browser mixed-content security blocks.',
      };
    }
    const filename = cleanUrl.split('?')[0].split('/').pop() || 'Direct Video';
    return {
      valid: true,
      source: {
        url: cleanUrl,
        title: decodeURIComponent(filename),
        type: 'direct',
      },
    };
  }

  return {
    valid: false,
    error: 'Unsupported video format. Please provide a public YouTube link or a direct HTTPS link to an MP4/WebM video file.',
  };
}

/**
 * Sanitize text input to prevent XSS
 */
export function sanitizeText(text: string, maxLength = 500): string {
  if (!text) return '';
  return text
    .trim()
    .slice(0, maxLength)
    .replace(/[&<>"']/g, (match) => {
      switch (match) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return match;
      }
    });
}
