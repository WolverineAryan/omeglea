import { Router } from 'express';
import { createReport } from '../controllers/reports.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { reportLimiter } from '../middleware/rateLimit.middleware.js';
import { createReportSchema } from '@omeglea/shared';

const router = Router();

router.post('/', requireAuth, reportLimiter, validateBody(createReportSchema), createReport);

export default router;
