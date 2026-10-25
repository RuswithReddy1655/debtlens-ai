import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config, validateProductionConfig } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import apiRoutes from './routes';
import healthRoutes from './routes/healthRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export const createApp = (): Application => {
  const app = express();

  // Security HTTP headers
  app.use(helmet());

  const allowedOrigins =
    config.nodeEnv === 'production'
      ? config.corsOrigin.split(',').map((o) => o.trim()).filter(Boolean)
      : [config.corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'];

  // CORS configuration
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin) return callback(null, true);
        if (allowedOrigins.includes(requestOrigin) || (config.nodeEnv !== 'production' && allowedOrigins.includes('*'))) {
          return callback(null, true);
        }
        return callback(new Error(`CORS error: Origin ${requestOrigin} not permitted.`));
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    })
  );

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP. Please try again later.',
      },
    },
  });
  app.use(limiter);

  // Request Logging
  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // Request Body Parsers
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Mount lightweight root health check (/health)
  app.use('/', healthRoutes);

  // Mount API Router
  app.use(config.apiPrefix, apiRoutes);

  // Fallback 404 handler
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();

// Start server if executed directly
if (process.env.NODE_ENV !== 'test') {
  const startServer = async () => {
    validateProductionConfig();
    await connectDatabase();

    const server = app.listen(config.port, () => {
      console.log('====================================================');
      console.log(`[DebtLens AI] Server running on http://localhost:${config.port}`);
      console.log(`[DebtLens AI] API Endpoint: http://localhost:${config.port}${config.apiPrefix}`);
      console.log(`[DebtLens AI] Demo Mode: ${config.demoMode ? 'ENABLED (Phase 1 Baseline)' : 'DISABLED'}`);
      console.log('====================================================');
    });

    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Gracefully closing HTTP server and DB connections...`);
      server.close(async () => {
        await disconnectDatabase();
        console.log('[Server] Process terminated cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  };

  startServer();
}

export default app;
