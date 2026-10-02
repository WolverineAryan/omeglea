import { Router } from 'express';
import {
  getMyProfile,
  updateMyProfile,
  getPublicProfile,
  deleteMyAccount,
} from '../controllers/users.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { updateProfileSchema } from '@omeglea/shared';

const router = Router();

router.get('/me', requireAuth, getMyProfile);
router.patch('/me', requireAuth, validateBody(updateProfileSchema), updateMyProfile);
router.delete('/me', requireAuth, deleteMyAccount);
router.get('/:id', requireAuth, getPublicProfile);

export default router;
