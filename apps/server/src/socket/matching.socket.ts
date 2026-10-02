import { Server, Socket } from 'socket.io';
import { matchmakingService } from '../services/matchmaking.service.js';
import { matchingPreferencesSchema } from '@omeglea/shared';
import { checkCallQuota, consumeCallQuota } from '../services/callQuota.service.js';
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

      // Consume quota / credit for both users upon connecting
      const quotaA = await consumeCallQuota(match.userA.userId, match.sessionId);
      const quotaB = await consumeCallQuota(match.userB.userId, match.sessionId);

      const payloadA = {
        sessionId: match.sessionId,
        peerId: match.userB.userId,
        peerDisplayName: match.userBProfile.displayName,
        peerAvatar: match.userBProfile.avatar,
        peerInterests: match.userBProfile.interests,
        peerCountry: match.userBProfile.country,
        peerTier: match.userBProfile.tier,
        peerRole: match.userBProfile.role,
        sessionType: 'random' as const,
        initiator: true,
        quotaInfo: quotaA,
      };

      const payloadB = {
        sessionId: match.sessionId,
        peerId: match.userA.userId,
        peerDisplayName: match.userAProfile.displayName,
        peerAvatar: match.userAProfile.avatar,
        peerInterests: match.userAProfile.interests,
        peerCountry: match.userAProfile.country,
        peerTier: match.userAProfile.tier,
        peerRole: match.userAProfile.role,
        sessionType: 'random' as const,
        initiator: false,
        quotaInfo: quotaB,
      };

      // Broadcast to both user rooms
      io.to(roomA).emit('matching:found', payloadA);
      io.to(roomB).emit('matching:found', payloadB);

      logger.info(
        `[MATCH CREATED] Session ${match.sessionId}: User ${match.userA.userId} (${match.userAProfile.tier}) matched with ${match.userB.userId} (${match.userBProfile.tier})`
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

      // Check daily call quota / credit availability (10 free / 100 pro / 500 vip / 1 credit per call)
      const quota = await checkCallQuota(userId);
      if (!quota.allowed) {
        socket.emit('error', {
          code: quota.code || 'DAILY_LIMIT_REACHED',
          message: quota.message || 'Daily call limit reached.',
          dailyCallsUsed: quota.dailyCallsUsed,
          dailyCallsLimit: quota.dailyCallsLimit,
          creditBalance: quota.creditBalance,
        });
        return;
      }

      const parsed = matchingPreferencesSchema.safeParse(data?.preferences || { mode: 'random' });
      const preferences = parsed.success ? parsed.data : { mode: 'random' as const };

      matchmakingService.addToQueue(userId, socket.id, preferences, isPremium);

      socket.emit('matching:waiting', {
        position: matchmakingService.getQueueSize(),
        estimatedWaitMs: 2000,
        quotaInfo: {
          remainingDailyCalls: quota.remainingDailyCalls,
          dailyCallsLimit: quota.dailyCallsLimit,
          creditBalance: quota.creditBalance,
          willUseCredit: quota.willUseCredit,
        },
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
