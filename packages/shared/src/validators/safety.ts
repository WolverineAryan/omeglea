import { z } from 'zod';

export const createReportSchema = z.object({
  reportedUserId: z.string().min(1, 'Reported user ID is required'),
  sessionId: z.string().optional(),
  category: z.enum([
    'inappropriate_behavior',
    'harassment',
    'suspected_underage',
    'spam',
    'scam',
    'impersonation',
    'explicit_content',
    'other',
  ]),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const createBlockSchema = z.object({
  blockedUserId: z.string().min(1, 'Target user ID is required'),
});

export type CreateBlockInput = z.infer<typeof createBlockSchema>;

export const updateReportStatusSchema = z.object({
  status: z.enum(['pending', 'under_review', 'resolved', 'rejected']),
  moderatorNotes: z.string().max(500).optional(),
  resolution: z.string().max(500).optional(),
});

export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;
