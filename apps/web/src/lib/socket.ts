import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@omeglea/shared';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

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
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 4000,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected:', socketInstance?.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, reconnect manually
        socketInstance?.connect();
      }
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('🔌 Socket connection error:', err.message);
    });
  } else {
    // Ensure current token is refreshed in socket auth
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
