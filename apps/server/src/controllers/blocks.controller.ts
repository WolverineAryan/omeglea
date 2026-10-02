import { Request, Response } from 'express';
import { BlockedUser } from '../models/BlockedUser.js';
import { User } from '../models/User.js';
import { CreateBlockInput, IBlockedUser } from '@omeglea/shared';

export async function blockUser(
  req: Request<{}, {}, CreateBlockInput>,
  res: Response
): Promise<void> {
  const blockerId = req.user!.userId;
  const { blockedUserId } = req.body;

  if (blockerId === blockedUserId) {
    res.status(400).json({ success: false, error: { message: 'Cannot block yourself' } });
    return;
  }

  const existing = await BlockedUser.findOne({ blockerId, blockedUserId });
  if (existing) {
    res.status(200).json({ success: true, message: 'User already blocked' });
    return;
  }

  await BlockedUser.create({ blockerId, blockedUserId });

  res.status(201).json({
    success: true,
    message: 'User blocked successfully',
  });
}

export async function listBlockedUsers(req: Request, res: Response): Promise<void> {
  const blockerId = req.user!.userId;

  const blocks = await BlockedUser.find({ blockerId })
    .populate('blockedUserId', 'displayName')
    .sort({ createdAt: -1 })
    .lean();

  const formatted: IBlockedUser[] = blocks.map((b: any) => ({
    id: b._id.toString(),
    blockerId: b.blockerId.toString(),
    blockedUserId: b.blockedUserId?._id?.toString() || b.blockedUserId?.toString(),
    blockedUserName: b.blockedUserId?.displayName || 'Unknown User',
    createdAt: b.createdAt.toISOString(),
  }));

  res.status(200).json({
    success: true,
    data: formatted,
  });
}

export async function unblockUser(req: Request, res: Response): Promise<void> {
  const blockerId = req.user!.userId;
  const targetUserId = req.params.userId;

  await BlockedUser.findOneAndDelete({ blockerId, blockedUserId: targetUserId });

  res.status(200).json({
    success: true,
    message: 'User unblocked successfully',
  });
}
