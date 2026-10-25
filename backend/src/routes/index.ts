import { Router } from 'express';
import healthRoutes from './healthRoutes';
import repositoryRoutes from './repositoryRoutes';
import analysisRoutes from './analysisRoutes';
import {
  githubRouter,
  connectionRouter,
  debtRouter,
  goalRouter,
  alertRouter,
  activityRouter,
  webhookRouter,
} from './phase4Routes';
import { AnalysisController, financialQuerySchema } from '../controllers/analysisController';
import { validateQuery } from '../middleware/validate';
import predictiveRoutes from './predictiveRoutes';

const router = Router();

router.use('/', healthRoutes);
router.use('/repositories', repositoryRoutes);
router.use('/analyses', analysisRoutes);

// Phase 4 Continuous Intelligence & Action Routers
router.use('/github', githubRouter);
router.use('/connections', connectionRouter);
router.use('/debt', debtRouter);
router.use('/goals', goalRouter);
router.use('/alerts', alertRouter);
router.use('/activity', activityRouter);
router.use('/webhooks', webhookRouter);

// Phase 5 Predictive Engineering Intelligence & Risk Forecasting
router.use('/predictive', predictiveRoutes);

// Organization-wide portfolio endpoint
router.get('/portfolio', validateQuery(financialQuerySchema), AnalysisController.getPortfolio);

export default router;
