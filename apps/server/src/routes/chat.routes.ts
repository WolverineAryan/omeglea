import { Router } from 'express';
import {
  listUserChatSessions,
  getSessionDetails,
  createPrivateSession,
} from '../controllers/chat.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, listUserChatSessions);
router.get('/:sessionId', requireAuth, getSessionDetails);
router.post('/private', requireAuth, createPrivateSession);

export default router;
