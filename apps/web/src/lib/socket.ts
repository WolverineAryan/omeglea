import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@omeglea/shared';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socketInstance) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('omeglea_token') || '' : '';

    socketInstance = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected:', socketInstance?.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('🔌 Socket connection error:', err.message);
    });
  }

  return socketInstance;
}

export function updateSocketAuthToken(token: string): void {
  if (socketInstance) {
    socketInstance.auth = { token };
    if (socketInstance.connected) {
      socketInstance.disconnect().connect();
    }
  }
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
