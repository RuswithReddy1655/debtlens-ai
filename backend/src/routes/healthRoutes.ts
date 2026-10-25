import { Router, Request, Response } from 'express';
import { getDatabaseStatus } from '../config/database';
import { config } from '../config/env';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();
  const isProduction = config.nodeEnv === 'production';

  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'DebtLens AI Intelligence Core',
    version: '1.0.0',
    demoMode: config.demoMode,
    api: 'healthy',
    database: {
      isConnected: dbStatus.isConnected,
      readyState: dbStatus.readyState,
      status: dbStatus.isConnected ? 'connected' : 'disconnected (running in demo mode)',
      ...(isProduction
        ? {}
        : {
            host: dbStatus.host || 'local',
            name: dbStatus.name || 'debtlens_ai',
            error: dbStatus.error,
          }),
    },
    uptime: Math.round(process.uptime()),
    ...(isProduction ? {} : { memoryUsage: process.memoryUsage() }),
  });
});

export default router;
