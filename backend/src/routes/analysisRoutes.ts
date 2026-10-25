import { Router } from 'express';
import {
  AnalysisController,
  createAnalysisSchema,
  costQuerySchema,
  financialQuerySchema,
  scenarioSchema,
  compareAnalysesSchema,
} from '../controllers/analysisController';
import { validateBody, validateQuery } from '../middleware/validate';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Trigger a new analysis
router.post('/', authenticate, validateBody(createAnalysisSchema), AnalysisController.create);

// Real-time analysis status and progress polling
router.get('/:id/status', AnalysisController.getStatus);

// Cancel a running analysis
router.post('/:id/cancel', authenticate, requireRole(['admin']), AnalysisController.cancel);

// Phase 3: Financial Intelligence & Decision Support
router.get('/:id/financial-intelligence', validateQuery(financialQuerySchema), AnalysisController.getFinancialIntelligence);
router.get('/:id/cost-drivers', validateQuery(financialQuerySchema), AnalysisController.getCostDrivers);
router.get('/:id/priorities', validateQuery(financialQuerySchema), AnalysisController.getPriorities);
router.get('/:id/savings', validateQuery(financialQuerySchema), AnalysisController.getSavings);
router.post('/:id/scenarios', validateBody(scenarioSchema), AnalysisController.runScenario);
router.get('/:id/scenarios/presets', validateQuery(financialQuerySchema), AnalysisController.comparePresets);
router.get('/:id/executive-report', validateQuery(financialQuerySchema), AnalysisController.getExecutiveReport);
router.post('/:id/compare', validateBody(compareAnalysesSchema), AnalysisController.compareAnalyses);
router.get('/:id/portfolio', validateQuery(financialQuerySchema), AnalysisController.getPortfolio);

// Get analysis summary by ID
router.get('/:id', AnalysisController.getById);

// Sub-resource endpoints
router.get('/:id/hotspots', AnalysisController.getHotspots);
router.get('/:id/metrics', AnalysisController.getMetrics);
router.get('/:id/trends', AnalysisController.getTrends);
router.get('/:id/recommendations', AnalysisController.getRecommendations);
router.get('/:id/cost', validateQuery(costQuerySchema), AnalysisController.getCost);

export default router;
