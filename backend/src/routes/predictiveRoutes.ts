import { Router } from 'express';
import { PredictiveController } from '../controllers/predictiveController';

const router = Router();

// Repository Predictive Intelligence
router.get('/repositories/:id', PredictiveController.getAssessment);
router.get('/repositories/:id/forecast', PredictiveController.getForecast);
router.get('/repositories/:id/hotspots', PredictiveController.getHotspots);
router.get('/repositories/:id/risks', PredictiveController.getRisks);
router.get('/repositories/:id/recommendations', PredictiveController.getRecommendations);
router.get('/repositories/:id/exposure', PredictiveController.getExposure);
router.get('/repositories/:id/goals', PredictiveController.getGoals);
router.get('/repositories/:id/accuracy', PredictiveController.getAccuracy);
router.post('/repositories/:id/refresh', PredictiveController.refreshAssessment);

// Simulation & Planning
router.post('/scenarios', PredictiveController.getScenarios);
router.post('/capacity-plan', PredictiveController.planCapacity);
router.post('/recommendations/:id/feedback', PredictiveController.submitFeedback);

// Assessments & Trace
router.get('/assessments/:id', PredictiveController.getAssessmentById);
router.get('/assessments/:id/trace', PredictiveController.getAssessmentTrace);

export default router;
