import { Router } from 'express';
import { getMatchingStatus } from '../controllers/matching.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/status', optionalAuth, getMatchingStatus);

export default router;
