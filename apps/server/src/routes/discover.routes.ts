import { Router } from 'express';
import {
  discoverProfiles,
  sendConnectionRequest,
  updateConnectionStatus,
  listConnections,
} from '../controllers/discover.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, discoverProfiles);
router.post('/connections', requireAuth, sendConnectionRequest);
router.patch('/connections/:id', requireAuth, updateConnectionStatus);
router.get('/connections', requireAuth, listConnections);

export default router;
