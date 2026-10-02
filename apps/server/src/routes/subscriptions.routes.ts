import { Router } from 'express';
import {
  listSubscriptionPlans,
  getMySubscription,
  checkoutSubscription,
  cancelSubscription,
  verifyRazorpaySubscription,
  handleStripeWebhook,
} from '../controllers/subscriptions.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { checkoutSubscriptionSchema } from '@omeglea/shared';

const router = Router();

router.get('/plans', listSubscriptionPlans);
router.get('/me', requireAuth, getMySubscription);
router.post('/checkout', requireAuth, validateBody(checkoutSubscriptionSchema), checkoutSubscription);
router.post('/verify-razorpay', requireAuth, verifyRazorpaySubscription);
router.post('/webhook/stripe', handleStripeWebhook);
router.post('/cancel', requireAuth, cancelSubscription);

export default router;
