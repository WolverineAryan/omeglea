import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Report } from '../models/Report.js';
import { ChatSession } from '../models/ChatSession.js';
import { Subscription } from '../models/Subscription.js';
import { CreditTransaction } from '../models/CreditTransaction.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { PlatformSettings } from '../models/PlatformSettings.js';
import { AdminDashboardStats, UpdateReportStatusInput } from '@omeglea/shared';

export async function getAdminDashboardStats(req: Request, res: Response): Promise<void> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsersToday,
    newUsersLast7Days,
    activeChatSessions,
    premiumSubscribers,
    creditStats,
    pendingReports,
    suspendedAccounts,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastActiveAt: { $gte: oneDayAgo } }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ChatSession.countDocuments({ status: 'active' }),
    Subscription.countDocuments({ status: 'active' }),
    CreditTransaction.aggregate([
      { $match: { status: 'completed', transactionType: 'purchase' } },
      { $group: { _id: null, total: { $sum: '$creditAmount' } } },
    ]),
    Report.countDocuments({ status: 'pending' }),
    User.countDocuments({ accountStatus: { $in: ['suspended', 'banned'] } }),
  ]);

  const stats: AdminDashboardStats = {
    totalUsers,
    activeUsersToday,
    newUsersLast7Days,
    activeChatSessions,
    premiumSubscribers,
    totalCreditsSold: creditStats[0]?.total || 0,
    pendingReports,
    suspendedAccounts,
  };

  res.status(200).json({
    success: true,
    data: stats,
  });
}

export async function listAdminUsers(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
  const search = req.query.search as string;
  const status = req.query.status as string;
  const role = req.query.role as string;

  const query: any = {};
  if (search) {
    query.$or = [
      { displayName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (status) query.accountStatus = status;
  if (role) query.role = role;

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('-passwordHash -emailVerifyToken -passwordResetToken')
    .lean();

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  const adminId = req.user!.userId;
  const adminEmail = req.user!.email;
  const targetUserId = req.params.id;
  const { status, reason } = req.body;

  if (!['active', 'suspended', 'banned'].includes(status)) {
    res.status(400).json({ success: false, error: { message: 'Invalid status' } });
    return;
  }

  const updatedUser = await User.findByIdAndUpdate(
    targetUserId,
    { $set: { accountStatus: status } },
    { new: true }
  ).select('-passwordHash');

  if (!updatedUser) {
    res.status(404).json({ success: false, error: { message: 'User not found' } });
    return;
  }

  // Record Audit Log
  await AdminAuditLog.create({
    adminId,
    adminEmail,
    action: `USER_STATUS_CHANGE_TO_${status.toUpperCase()}`,
    targetType: 'user',
    targetId: targetUserId,
    details: { reason, previousStatus: updatedUser.accountStatus },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: `User status changed to ${status}`,
    data: updatedUser,
  });
}

export async function listAdminReports(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 50);
  const status = req.query.status as string;

  const query: any = {};
  if (status) query.status = status;

  const reports = await Report.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('reporterId', 'displayName email')
    .populate('reportedUserId', 'displayName email accountStatus')
    .populate('moderatorId', 'displayName')
    .lean();

  const total = await Report.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}

export async function updateReportStatus(
  req: Request<{ id: string }, {}, UpdateReportStatusInput>,
  res: Response
): Promise<void> {
  const adminId = req.user!.userId;
  const adminEmail = req.user!.email;
  const reportId = req.params.id;
  const { status, moderatorNotes, resolution } = req.body;

  const report = await Report.findByIdAndUpdate(
    reportId,
    {
      $set: {
        status,
        moderatorId: adminId,
        moderatorNotes,
        resolution,
        resolvedAt: ['resolved', 'rejected'].includes(status) ? new Date() : undefined,
      },
    },
    { new: true }
  );

  if (!report) {
    res.status(404).json({ success: false, error: { message: 'Report not found' } });
    return;
  }

  // Record Audit Log
  await AdminAuditLog.create({
    adminId,
    adminEmail,
    action: `REPORT_STATUS_CHANGE_TO_${status.toUpperCase()}`,
    targetType: 'report',
    targetId: reportId,
    details: { status, resolution },
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    data: report,
  });
}

export async function getPlatformSettings(req: Request, res: Response): Promise<void> {
  let settings = await PlatformSettings.findOne();
  if (!settings) {
    settings = await PlatformSettings.create({});
  }

  res.status(200).json({
    success: true,
    data: settings,
  });
}

export async function updatePlatformSettings(req: Request, res: Response): Promise<void> {
  const adminId = req.user!.userId;
  const adminEmail = req.user!.email;

  const updated = await PlatformSettings.findOneAndUpdate(
    {},
    { $set: { ...req.body, updatedBy: adminId } },
    { new: true, upsert: true }
  );

  await AdminAuditLog.create({
    adminId,
    adminEmail,
    action: 'UPDATE_PLATFORM_SETTINGS',
    targetType: 'settings',
    targetId: 'global',
    details: req.body,
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    data: updated,
  });
}

export async function listAdminAuditLogs(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);

  const logs = await AdminAuditLog.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await AdminAuditLog.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}
