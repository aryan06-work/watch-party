/**
 * Extract clean room code from various user inputs:
 * e.g. "http://localhost:5173/?room=yykq-3r5u" -> "yykq-3r5u"
 * e.g. "?room=yykq-3r5u" -> "yykq-3r5u"
 * e.g. "yykq-3r5u" -> "yykq-3r5u"
 * e.g. "  YYKQ-3R5U  " -> "yykq-3r5u"
 */
export function extractRoomCode(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();

  // Check for ?room= or &room=
  const paramMatch = trimmed.match(/[?&]room=([a-zA-Z0-9_-]+)/i);
  if (paramMatch && paramMatch[1]) {
    return paramMatch[1].toLowerCase();
  }

  // Check for URL or path containing a slug like xxxx-xxxx
  const slugMatch = trimmed.match(/([a-zA-Z0-9]{4}-[a-zA-Z0-9]{4})/);
  if (slugMatch && slugMatch[1]) {
    return slugMatch[1].toLowerCase();
  }

  return trimmed.toLowerCase();
}

/**
 * Generate or get a unique ID for the current browser tab window.
 * This ensures two tabs in the same browser session (e.g. for testing locally)
 * don't overwrite each other's session tokens or roles.
 */
let tabInstanceId: string | null = null;

export function getTabInstanceId(): string {
  if (tabInstanceId) return tabInstanceId;
  tabInstanceId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  return tabInstanceId;
}

export function getSavedSessionToken(roomCode: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const tabId = getTabInstanceId();
  return sessionStorage.getItem(`together_token_${roomCode}_${tabId}`) || undefined;
}

export function saveSessionToken(roomCode: string, token: string): void {
  if (typeof window === 'undefined') return;
  const tabId = getTabInstanceId();
  sessionStorage.setItem(`together_token_${roomCode}_${tabId}`, token);
}
