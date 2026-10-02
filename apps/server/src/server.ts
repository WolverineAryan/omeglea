import http from 'http';
import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initializeSocketIO } from './socket/index.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  // Connect to Database
  await connectDB();

  // Create Express App
  const app = createApp();

  // Create HTTP Server
  const httpServer = http.createServer(app);

  // Initialize Socket.IO
  const io = initializeSocketIO(httpServer);

  // Listen on Port
  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Omeglea Backend running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    logger.info(`📡 Health check available at: http://localhost:${env.PORT}/api/health`);
    logger.info(`🔌 Socket.IO initialized and listening for connections`);
  });

  // Graceful Shutdown
  const handleShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    httpServer.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDB();
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Forceful shutdown triggered after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));

  process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught Exception:', err);
    if (env.NODE_ENV === 'production') {
      // In production, log and attempt graceful restart
      handleShutdown('UNCAUGHT_EXCEPTION');
    }
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error:', err);
  process.exit(1);
});
