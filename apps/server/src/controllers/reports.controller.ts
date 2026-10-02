import { Request, Response } from 'express';
import { Report } from '../models/Report.js';
import { CreateReportInput } from '@omeglea/shared';

export async function createReport(
  req: Request<{}, {}, CreateReportInput>,
  res: Response
): Promise<void> {
  const reporterId = req.user!.userId;
  const { reportedUserId, sessionId, category, description } = req.body;

  if (reporterId === reportedUserId) {
    res.status(400).json({ success: false, error: { message: 'Cannot report yourself' } });
    return;
  }

  const report = await Report.create({
    reporterId,
    reportedUserId,
    sessionId,
    category,
    description,
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Report submitted successfully. Our safety team will review it promptly.',
    data: {
      reportId: report._id.toString(),
    },
  });
}
