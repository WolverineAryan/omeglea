import { Server, Socket } from 'socket.io';
import { matchmakingService } from '../services/matchmaking.service.js';
import { matchingPreferencesSchema } from '@omeglea/shared';
import { logger } from '../utils/logger.js';

export function registerMatchingHandlers(io: Server, socket: Socket): void {
  const userId = socket.data.userId as string;
  const role = socket.data.role as string;
  const isPremium = Boolean(socket.data.isPremium);

  // Helper to execute matching and room assignments
  const attemptMatch = async (targetUserId: string) => {
    const match = await matchmakingService.findMatch(targetUserId);

    if (match) {
      const roomA = `user:${match.userA.userId}`;
      const roomB = `user:${match.userB.userId}`;

      // Join all sockets belonging to both users into the session room
      io.in(roomA).socketsJoin(match.sessionId);
      io.in(roomB).socketsJoin(match.sessionId);

      // Also join by explicit socket ID if available
      const socketA = io.sockets.sockets.get(match.userA.socketId);
      const socketB = io.sockets.sockets.get(match.userB.socketId);
      if (socketA) socketA.join(match.sessionId);
      if (socketB) socketB.join(match.sessionId);

      const payloadA = {
        sessionId: match.sessionId,
        peerId: match.userB.userId,
        peerDisplayName: match.userBProfile.displayName,
        peerAvatar: match.userBProfile.avatar,
        peerInterests: match.userBProfile.interests,
        peerCountry: match.userBProfile.country,
        sessionType: 'random' as const,
        initiator: true,
      };

      const payloadB = {
        sessionId: match.sessionId,
        peerId: match.userA.userId,
        peerDisplayName: match.userAProfile.displayName,
        peerAvatar: match.userAProfile.avatar,
        peerInterests: match.userAProfile.interests,
        peerCountry: match.userAProfile.country,
        sessionType: 'random' as const,
        initiator: false,
      };

      // Broadcast to both user rooms
      io.to(roomA).emit('matching:found', payloadA);
      io.to(roomB).emit('matching:found', payloadB);

      logger.info(
        `[MATCH CREATED] Session ${match.sessionId}: User ${match.userA.userId} matched with ${match.userB.userId}`
      );
    }
  };

  socket.on('matching:join', async (data: any) => {
    try {
      // Security: Enforce authentication for 18+ video chat matching
      if (!userId || role === 'guest' || userId.startsWith('guest_')) {
        socket.emit('error', {
          code: 'AUTH_REQUIRED',
          message: 'Login is required to start 18+ random video chat. Please log in or register.',
        });
        return;
      }

      const parsed = matchingPreferencesSchema.safeParse(data?.preferences || { mode: 'random' });
      const preferences = parsed.success ? parsed.data : { mode: 'random' as const };

      matchmakingService.addToQueue(userId, socket.id, preferences, isPremium);

      socket.emit('matching:waiting', {
        position: matchmakingService.getQueueSize(),
        estimatedWaitMs: 2000,
      });

      // Attempt to find match immediately
      await attemptMatch(userId);
    } catch (err: any) {
      logger.error('Error in matching:join socket handler:', err.message);
      socket.emit('error', { code: 'MATCHING_ERROR', message: 'Failed to join queue' });
    }
  });

  socket.on('matching:leave', () => {
    matchmakingService.removeFromQueue(userId);
    socket.emit('matching:left');
  });

  socket.on('disconnect', () => {
    matchmakingService.removeBySocketId(socket.id);
  });
}
