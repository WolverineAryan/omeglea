import { Router } from 'express';
import {
  getAdminDashboardStats,
  listAdminUsers,
  updateUserStatus,
  listAdminReports,
  updateReportStatus,
  getPlatformSettings,
  updatePlatformSettings,
  listAdminAuditLogs,
} from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireMinRole } from '../middleware/role.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { updateReportStatusSchema } from '@omeglea/shared';

const router = Router();

// Moderator and Admin accessible
router.get('/reports', requireAuth, requireMinRole('moderator'), listAdminReports);
router.patch(
  '/reports/:id',
  requireAuth,
  requireMinRole('moderator'),
  validateBody(updateReportStatusSchema),
  updateReportStatus
);

// Admin only accessible
router.get('/dashboard', requireAuth, requireMinRole('admin'), getAdminDashboardStats);
router.get('/users', requireAuth, requireMinRole('admin'), listAdminUsers);
router.patch('/users/:id/status', requireAuth, requireMinRole('admin'), updateUserStatus);
router.get('/settings', requireAuth, requireMinRole('admin'), getPlatformSettings);
router.patch('/settings', requireAuth, requireMinRole('admin'), updatePlatformSettings);
router.get('/logs', requireAuth, requireMinRole('admin'), listAdminAuditLogs);

export default router;
