import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireMinRole } from '../middleware/role.middleware.js';
import {
  createUpiOrder,
  submitUpiUtr,
  redeemVoucherCode,
  listAdminPaymentOrders,
  approvePaymentOrder,
  rejectPaymentOrder,
  createAdminVoucher,
} from '../controllers/customPayment.controller.js';

const router = Router();

// Public / Authenticated User Routes
router.post('/upi/create-order', requireAuth, createUpiOrder);
router.post('/upi/submit-utr', requireAuth, submitUpiUtr);
router.post('/vouchers/redeem', requireAuth, redeemVoucherCode);

// Admin Management Routes
router.get('/admin/orders', requireAuth, requireMinRole('admin'), listAdminPaymentOrders);
router.patch('/admin/orders/:id/approve', requireAuth, requireMinRole('admin'), approvePaymentOrder);
router.patch('/admin/orders/:id/reject', requireAuth, requireMinRole('admin'), rejectPaymentOrder);
router.post('/admin/vouchers', requireAuth, requireMinRole('admin'), createAdminVoucher);

export default router;
