import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession } from '../models/ChatSession.js';
import { Message } from '../models/Message.js';

export async function listUserChatSessions(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const sessions = await ChatSession.find({
    participantIds: userId,
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('participantIds', 'displayName')
    .lean();

  res.status(200).json({
    success: true,
    data: sessions,
  });
}

export async function getSessionDetails(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const sessionId = req.params.sessionId;

  const session = await ChatSession.findOne({
    sessionId,
    participantIds: userId,
  }).populate('participantIds', 'displayName isPremium').lean();

  if (!session) {
    res.status(404).json({
      success: false,
      error: { message: 'Chat session not found or access denied' },
    });
    return;
  }

  const messages = await Message.find({ sessionId }).sort({ createdAt: 1 }).limit(100).lean();

  res.status(200).json({
    success: true,
    data: {
      session,
      messages,
    },
  });
}

export async function createPrivateSession(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const targetUserId = req.body.targetUserId;

  if (!targetUserId || targetUserId === userId) {
    res.status(400).json({
      success: false,
      error: { message: 'Invalid target user for private session' },
    });
    return;
  }

  const sessionId = uuidv4();

  const session = await ChatSession.create({
    sessionId,
    participantIds: [userId, targetUserId],
    sessionType: 'private',
    status: 'active',
    startedAt: new Date(),
  });

  res.status(201).json({
    success: true,
    data: session,
  });
}
