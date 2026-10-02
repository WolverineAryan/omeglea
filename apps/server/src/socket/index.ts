import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { corsOptions } from '../config/cors.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { registerMatchingHandlers } from './matching.socket.js';
import { registerCallHandlers } from './call.socket.js';
import { registerChatHandlers } from './chat.socket.js';
import { logger } from '../utils/logger.js';
import { ServerToClientEvents, ClientToServerEvents } from '@omeglea/shared';

export function initializeSocketIO(
  httpServer: HttpServer
): Server<ClientToServerEvents, ServerToClientEvents> {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: corsOptions,
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ['websocket', 'polling'],
  });

  // Authentication Middleware for Handshake
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1] ||
        socket.handshake.query?.token;

      if (!token || typeof token !== 'string') {
        // Fallback for guest or anonymous user
        const guestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
        socket.data.userId = guestId;
        socket.data.role = 'guest';
        socket.data.isPremium = false;
        return next();
      }

      const payload = verifyAccessToken(token);
      if (!payload) {
        return next(new Error('Authentication error: invalid token'));
      }

      const user = await User.findById(payload.userId).select('role accountStatus isPremium').lean();
      if (user?.accountStatus === 'banned') {
        return next(new Error('Authentication error: account is banned'));
      }

      socket.data.userId = payload.userId;
      socket.data.role = user?.role || 'free';
      socket.data.isPremium = Boolean(user?.isPremium);

      next();
    } catch (err: any) {
      logger.error('Socket authentication handshake error:', err.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    logger.info(`Socket client connected: ${socket.id} (user: ${userId})`);

    // Join user's personal room for individual notifications & calls
    socket.join(`user:${userId}`);

    // Register all event sub-modules
    registerMatchingHandlers(io, socket);
    registerCallHandlers(io, socket);
    registerChatHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket client disconnected: ${socket.id} (reason: ${reason})`);
    });
  });

  return io;
}
