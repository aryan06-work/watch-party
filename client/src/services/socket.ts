import { io, Socket } from 'socket.io-client';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : window.location.origin);

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected with ID:', socketInstance?.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });
  }

  return socketInstance;
}
