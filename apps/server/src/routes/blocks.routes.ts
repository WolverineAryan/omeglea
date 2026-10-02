import { Router } from 'express';
import { blockUser, listBlockedUsers, unblockUser } from '../controllers/blocks.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createBlockSchema } from '@omeglea/shared';

const router = Router();

router.post('/', requireAuth, validateBody(createBlockSchema), blockUser);
router.get('/', requireAuth, listBlockedUsers);
router.delete('/:userId', requireAuth, unblockUser);

export default router;
