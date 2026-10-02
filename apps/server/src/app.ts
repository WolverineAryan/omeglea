import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOptions } from './config/cors.js';
import { globalLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import matchingRoutes from './routes/matching.routes.js';
import chatRoutes from './routes/chat.routes.js';
import discoverRoutes from './routes/discover.routes.js';
import blocksRoutes from './routes/blocks.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import subscriptionsRoutes from './routes/subscriptions.routes.js';
import creditsRoutes from './routes/credits.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { mediaRouter } from './routes/media.routes.js';

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allow Next.js / WebRTC connections
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS
  app.use(cors(corsOptions));

  // Body parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Global Rate Limiter
  app.use(globalLimiter);

  // Health Check Endpoint (For Render, Vercel, Uptime monitors)
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'omeglea-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // Mount API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/matching', matchingRoutes);
  app.use('/api/chats', chatRoutes);
  app.use('/api/discover', discoverRoutes);
  app.use('/api/blocks', blocksRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/subscriptions', subscriptionsRoutes);
  app.use('/api/credits', creditsRoutes);
  app.use('/api/media', mediaRouter);
  app.use('/api/admin', adminRoutes);

  // 404 Route Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.url} not found` },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
