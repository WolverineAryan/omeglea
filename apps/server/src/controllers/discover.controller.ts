import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { UserProfile } from '../models/UserProfile.js';
import { BlockedUser } from '../models/BlockedUser.js';
import { Connection } from '../models/Connection.js';
import { PublicUserProfile } from '@omeglea/shared';

export async function discoverProfiles(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 12, 50);
  const interest = req.query.interest as string;
  const language = req.query.language as string;

  // Find all blocked users
  const blocks = await BlockedUser.find({
    $or: [{ blockerId: userId }, { blockedUserId: userId }],
  }).lean();

  const excludedIds = [userId, ...blocks.map((b) => (b.blockerId.toString() === userId ? b.blockedUserId.toString() : b.blockerId.toString()))];

  const profileQuery: any = {
    userId: { $nin: excludedIds },
    discoveryEnabled: true,
  };

  if (interest) {
    profileQuery.interests = { $in: [interest] };
  }

  if (language) {
    profileQuery.languages = { $in: [language] };
  }

  const profiles = await UserProfile.find(profileQuery)
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId', 'displayName isPremium role lastActiveAt accountStatus')
    .lean();

  const publicProfiles: PublicUserProfile[] = profiles
    .filter((p: any) => p.userId && p.userId.accountStatus === 'active')
    .map((p: any) => ({
      id: p.userId._id.toString(),
      displayName: p.userId.displayName,
      avatar: p.avatar,
      biography: p.biography,
      interests: p.visibilitySettings?.showInterests !== false ? p.interests || [] : [],
      languages: p.languages || ['English'],
      country: p.visibilitySettings?.showCountry !== false ? p.country : undefined,
      gender: p.visibilitySettings?.showGender !== false ? p.gender : undefined,
      isPremium: Boolean(p.userId.isPremium),
      role: p.userId.role,
      lastActiveAt: p.userId.lastActiveAt?.toISOString() || new Date().toISOString(),
    }));

  const total = await UserProfile.countDocuments(profileQuery);

  res.status(200).json({
    success: true,
    data: {
      profiles: publicProfiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}

export async function sendConnectionRequest(req: Request, res: Response): Promise<void> {
  const requesterId = req.user!.userId;
  const recipientId = req.body.recipientId;

  if (!recipientId || recipientId === requesterId) {
    res.status(400).json({ success: false, error: { message: 'Invalid recipient ID' } });
    return;
  }

  const isBlocked = await BlockedUser.findOne({
    $or: [
      { blockerId: requesterId, blockedUserId: recipientId },
      { blockerId: recipientId, blockedUserId: requesterId },
    ],
  });

  if (isBlocked) {
    res.status(403).json({
      success: false,
      error: { message: 'Cannot connect with this user' },
    });
    return;
  }

  const existing = await Connection.findOne({
    $or: [
      { requesterId, recipientId },
      { requesterId: recipientId, recipientId: requesterId },
    ],
  });

  if (existing) {
    res.status(409).json({
      success: false,
      error: { message: 'Connection request already exists between users' },
    });
    return;
  }

  const connection = await Connection.create({
    requesterId,
    recipientId,
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    data: connection,
  });
}

export async function updateConnectionStatus(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const connectionId = req.params.id;
  const status = req.body.status;

  if (!['accepted', 'rejected'].includes(status)) {
    res.status(400).json({ success: false, error: { message: 'Invalid status' } });
    return;
  }

  const connection = await Connection.findOneAndUpdate(
    { _id: connectionId, recipientId: userId, status: 'pending' },
    { $set: { status } },
    { new: true }
  );

  if (!connection) {
    res.status(404).json({
      success: false,
      error: { message: 'Pending connection request not found' },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: connection,
  });
}

export async function listConnections(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const connections = await Connection.find({
    $or: [{ requesterId: userId }, { recipientId: userId }],
    status: 'accepted',
  })
    .populate('requesterId', 'displayName isPremium')
    .populate('recipientId', 'displayName isPremium')
    .lean();

  res.status(200).json({
    success: true,
    data: connections,
  });
}
