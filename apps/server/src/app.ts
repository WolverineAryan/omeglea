import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { corsOptions } from './config/cors.js';
import { globalLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { getDBHealth } from './config/db.js';
import { env } from './config/env.js';

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
import paymentGatewayRoutes from './routes/paymentGateway.routes.js';
import { mediaRouter } from './routes/media.routes.js';

export function createApp(): Express {
  const app = express();

  // Reverse Proxy / Load Balancer Configuration (Cloudflare, Render, AWS, Vercel)
  if (env.TRUST_PROXY) {
    app.set('trust proxy', 1);
  }

  // Response Compression for High Throughput & Low Latency
  app.use(
    compression({
      threshold: 1024, // Compress responses over 1KB
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
    })
  );

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
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Global Rate Limiter
  app.use(globalLimiter);

  // Production-Grade Health Check (Database status, memory, uptime, environment)
  app.get(['/api/health', '/health'], (req: Request, res: Response) => {
    const dbHealth = getDBHealth();
    const memUsage = process.memoryUsage();

    const isHealthy = dbHealth.isConnected || env.NODE_ENV !== 'production';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'omeglea-api',
      environment: env.NODE_ENV,
      paymentMode: env.PAYMENT_MODE,
      database: dbHealth,
      memory: {
        rssMB: Math.round(memUsage.rss / 1024 / 1024),
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
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
  app.use('/api/payments', paymentGatewayRoutes);
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
