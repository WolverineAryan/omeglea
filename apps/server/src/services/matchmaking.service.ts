import { v4 as uuidv4 } from 'uuid';
import { MatchingPreferences, MatchingQueueEntry } from '@omeglea/shared';
import { BlockedUser } from '../models/BlockedUser.js';
import { ChatSession } from '../models/ChatSession.js';
import { User } from '../models/User.js';
import { UserProfile } from '../models/UserProfile.js';
import { logger } from '../utils/logger.js';

class MatchmakingService {
  private queue: Map<string, MatchingQueueEntry> = new Map();
  private userToSocket: Map<string, string> = new Map();
  private socketToUser: Map<string, string> = new Map();

  public addToQueue(
    userId: string,
    socketId: string,
    preferences: MatchingPreferences,
    isPremium: boolean
  ): void {
    // Remove previous queue entry if any
    this.removeFromQueue(userId);

    const entry: MatchingQueueEntry = {
      userId,
      socketId,
      preferences,
      isPremium,
      joinedAt: Date.now(),
    };

    this.queue.set(userId, entry);
    this.userToSocket.set(userId, socketId);
    this.socketToUser.set(socketId, userId);

    logger.debug(`User ${userId} joined matchmaking queue. Current queue size: ${this.queue.size}`);
  }

  public removeFromQueue(userId: string): void {
    const entry = this.queue.get(userId);
    if (entry) {
      this.socketToUser.delete(entry.socketId);
      this.userToSocket.delete(userId);
      this.queue.delete(userId);
      logger.debug(`User ${userId} removed from matchmaking queue. Current queue size: ${this.queue.size}`);
    }
  }

  public removeBySocketId(socketId: string): string | null {
    const userId = this.socketToUser.get(socketId);
    if (userId) {
      this.removeFromQueue(userId);
      return userId;
    }
    return null;
  }

  public async findMatch(
    userId: string
  ): Promise<{
    userA: MatchingQueueEntry;
    userB: MatchingQueueEntry;
    sessionId: string;
    userAProfile: any;
    userBProfile: any;
  } | null> {
    const currentEntry = this.queue.get(userId);
    if (!currentEntry) return null;

    // Get list of users blocked by or who blocked the current user
    const blocks = await BlockedUser.find({
      $or: [{ blockerId: userId }, { blockedUserId: userId }],
    }).lean();

    const blockedUserIds = new Set(
      blocks.map((b) =>
        b.blockerId.toString() === userId
          ? b.blockedUserId.toString()
          : b.blockerId.toString()
      )
    );

    let bestMatch: MatchingQueueEntry | null = null;
    let highestScore = -1;

    // Prioritize candidates based on queue wait time, premium status, and shared interests
    for (const [candidateId, candidateEntry] of this.queue.entries()) {
      if (candidateId === userId) continue; // Prevent self-match
      if (blockedUserIds.has(candidateId)) continue; // Skip blocked users

      let score = 0;

      // Base score: time in queue
      const waitTimeBonus = Math.min((Date.now() - candidateEntry.joinedAt) / 1000, 30);
      score += waitTimeBonus;

      // Premium priority bonus
      if (candidateEntry.isPremium || currentEntry.isPremium) {
        score += 20;
      }

      // Shared interests matching bonus
      if (
        currentEntry.preferences.interests?.length &&
        candidateEntry.preferences.interests?.length
      ) {
        const sharedInterests = currentEntry.preferences.interests.filter((i) =>
          candidateEntry.preferences.interests?.includes(i)
        );
        score += sharedInterests.length * 15;
      }

      // Shared language matching bonus
      if (
        currentEntry.preferences.preferredLanguages?.length &&
        candidateEntry.preferences.preferredLanguages?.length
      ) {
        const sharedLangs = currentEntry.preferences.preferredLanguages.filter((l) =>
          candidateEntry.preferences.preferredLanguages?.includes(l)
        );
        score += sharedLangs.length * 10;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = candidateEntry;
      }
    }

    if (!bestMatch) {
      return null;
    }

    // Both users matched! Remove both from queue
    this.removeFromQueue(userId);
    this.removeFromQueue(bestMatch.userId);

    const sessionId = uuidv4();

    // Create active ChatSession in MongoDB
    try {
      await ChatSession.create({
        sessionId,
        participantIds: [userId, bestMatch.userId],
        sessionType: 'random',
        status: 'active',
        startedAt: new Date(),
      });
    } catch (err: any) {
      logger.error('Failed to create ChatSession record in DB:', err.message);
    }

    // Fetch public profile info for both participants
    const [userADoc, userBDoc, profileADoc, profileBDoc] = await Promise.all([
      User.findById(userId).select('displayName isPremium role').lean(),
      User.findById(bestMatch.userId).select('displayName isPremium role').lean(),
      UserProfile.findOne({ userId }).lean(),
      UserProfile.findOne({ userId: bestMatch.userId }).lean(),
    ]);

    return {
      userA: currentEntry,
      userB: bestMatch,
      sessionId,
      userAProfile: {
        id: userId,
        displayName: userADoc?.displayName || 'User',
        avatar: profileADoc?.avatar,
        interests: profileADoc?.interests || [],
        country: profileADoc?.country,
      },
      userBProfile: {
        id: bestMatch.userId,
        displayName: userBDoc?.displayName || 'User',
        avatar: profileBDoc?.avatar,
        interests: profileBDoc?.interests || [],
        country: profileBDoc?.country,
      },
    };
  }

  public getQueueSize(): number {
    return this.queue.size;
  }
}

export const matchmakingService = new MatchmakingService();
