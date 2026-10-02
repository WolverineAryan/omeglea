import { Router } from 'express';
import { uploadMedia, getUploadConfig } from '../controllers/media.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const mediaRouter = Router();

// Protected upload routes
mediaRouter.post('/upload', requireAuth, uploadMedia);
mediaRouter.get('/config', requireAuth, getUploadConfig);
