import { Router } from 'express';
import {
  listCreditPackages,
  getCreditBalance,
  listCreditTransactions,
  checkoutCredits,
} from '../controllers/credits.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { checkoutCreditsSchema } from '@omeglea/shared';

const router = Router();

router.get('/packages', listCreditPackages);
router.get('/balance', requireAuth, getCreditBalance);
router.get('/transactions', requireAuth, listCreditTransactions);
router.post('/checkout', requireAuth, validateBody(checkoutCreditsSchema), checkoutCredits);

export default router;
