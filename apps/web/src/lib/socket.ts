import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@omeglea/shared';
import { getCleanBackendUrl } from './api';

let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

function getStoredToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('omeglea_token') || '';
}

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  const token = getStoredToken();
  const currentUrl = getCleanBackendUrl();

  if (!socketInstance) {
    socketInstance = io(currentUrl, {
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
      console.log('🔌 Socket connected successfully to:', currentUrl);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        socketInstance?.connect();
      }
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('🔌 Socket connection error to', currentUrl, ':', err.message);
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

export function reconnectSocketWithUrl(newUrl: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('omeglea_backend_url', newUrl);
  }
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
  const newSocket = getSocket();
  newSocket.connect();
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
