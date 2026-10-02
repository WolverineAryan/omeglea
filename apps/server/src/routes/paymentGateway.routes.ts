import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireMinRole } from '../middleware/role.middleware.js';
import {
  createUpiOrder,
  submitUpiUtr,
  createCryptoOrder,
  submitCryptoTxHash,
  redeemVoucherCode,
  listAdminPaymentOrders,
  approvePaymentOrder,
  rejectPaymentOrder,
  createAdminVoucher,
} from '../controllers/customPayment.controller.js';

const router = Router();

// Public / Authenticated User Routes (Direct UPI & Web3 Crypto)
router.post('/upi/create-order', requireAuth, createUpiOrder);
router.post('/upi/submit-utr', requireAuth, submitUpiUtr);
router.post('/crypto/create-order', requireAuth, createCryptoOrder);
router.post('/crypto/submit-tx', requireAuth, submitCryptoTxHash);
router.post('/vouchers/redeem', requireAuth, redeemVoucherCode);

// Admin Management Routes
router.get('/admin/orders', requireAuth, requireMinRole('admin'), listAdminPaymentOrders);
router.patch('/admin/orders/:id/approve', requireAuth, requireMinRole('admin'), approvePaymentOrder);
router.patch('/admin/orders/:id/reject', requireAuth, requireMinRole('admin'), rejectPaymentOrder);
router.post('/admin/vouchers', requireAuth, requireMinRole('admin'), createAdminVoucher);

export default router;
