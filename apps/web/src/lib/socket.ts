import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@omeglea/shared';

const rawSocketUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';

export const SOCKET_URL = rawSocketUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');

let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

function getStoredToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('omeglea_token') || '';
}

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  const token = getStoredToken();

  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      auth: (cb) => {
        cb({ token: getStoredToken() });
      },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 40,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected successfully');
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        socketInstance?.connect();
      }
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('🔌 Socket connection error:', err.message);
    });
  } else {
    socketInstance.auth = { token };
  }

  return socketInstance;
}

export function updateSocketAuthToken(token: string): void {
  const socket = getSocket();
  socket.auth = { token };
  if (socket.connected) {
    socket.disconnect().connect();
  }
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
