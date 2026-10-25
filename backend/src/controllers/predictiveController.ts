import { Request, Response } from 'express';
import { PredictiveOrchestrator } from '../services/predictive/PredictiveOrchestrator';
import { PredictiveRecommendationService } from '../services/predictive/PredictiveRecommendationService';
import { PredictionEvaluationService } from '../services/predictive/PredictionEvaluationService';
import { PredictiveAssessment, ForecastHorizon } from '../models/PredictiveAssessment';
import { getDatabaseStatus } from '../config/database';

export class PredictiveController {
  /**
   * GET /api/predictive/repositories/:id
   * Retrieves complete predictive assessment for a repository.
   */
  static async getAssessment(req: Request, res: Response) {
    try {
      const repositoryId = req.params.id;
      if (!repositoryId) {
        return res.status(400).json({ success: false, error: 'Repository ID is required.' });
      }

      const horizon = (req.query.horizon as ForecastHorizon) || 'NEXT_ANALYSIS';
      const assessment = await PredictiveOrchestrator.getLatestAssessment(repositoryId, horizon);

      return res.json({
        success: true,
        data: assessment,
      });
    } catch (err: any) {
      console.error('[PredictiveController] getAssessment error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/predictive/repositories/:id/forecast
   * Retrieves numeric and financial forecasts.
   */
  static async getForecast(req: Request, res: Response) {
    try {
      const repositoryId = req.params.id;
      const horizon = (req.query.horizon as ForecastHorizon) || 'NEXT_ANALYSIS';
      const assessment = await PredictiveOrchestrator.getLatestAssessment(repositoryId, horizon);

      return res.json({
        success: true,
        data: {
          forecastHorizon: assessment.forecastHorizon,
          predictedDebtScore: assessment.predictedDebtScore,
          predictedFinancialExposure: assessment.predictedFinancialExposure,
          predictedCriticalHotspots: assessment.predictedCriticalHotspots,
          costOfDoingNothing: assessment.costOfDoingNothing,
          confidence: assessment.confidence,
          confidenceFactors: assessment.confidenceFactors,
          generatedAt: assessment.generatedAt,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/predictive/repositories/:id/hotspots
   * Retrieves predicted hotspots and file-level risks.
   */
  static async getHotspots(req: Request, res: Response) {
    try {
      const repositoryId = req.params.id;
      const horizon = (req.query.horizon as ForecastHorizon) || 'NEXT_ANALYSIS';
      const assessment = await PredictiveOrchestrator.getLatestAssessment(repositoryId, horizon);

      return res.json({
        success: true,
        data: {
          predictedHotspots: assessment.predictedHotspots || [],
          fileLevelRiskForecasts: assessment.fileLevelRiskForecasts || [],
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/predictive/repositories/:id/risks
   * Retrieves predictive risk evaluation, tiers, and drivers.
   */
  static async getRisks(req: Request, res: Response) {
    try {
      const repositoryId = req.params.id;
      const assessment = await PredictiveOrchestrator.getLatestAssessment(repositoryId);

      return res.json({
        success: true,
        data: {
          riskScore: assessment.riskScore,
          riskLevel: assessment.riskLevel,
          riskTrend: assessment.riskTrend,
          confidence: assessment.confidence,
          predictionTrace: assessment.predictionTrace,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/predictive/repositories/:id/recommendations
   * Retrieves next best actions and recommendations.
   */
  static async getRecommendations(req: Request, res: Response) {
    try {
      const repositoryId = req.params.id;
      const assessment = await PredictiveOrchestrator.getLatestAssessment(repositoryId);

      return res.json({
        success: true,
        data: {
          recommendations: assessment.recommendedActions || [],
          feedbackStats: PredictiveRecommendationService.getFeedbackStats(),
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/predictive/repositories/:id/exposure
   * Retrieves financial exposure forecasts and cost of doing nothing.
   */
  static async getExposure(req: Request, res: Response) {
    try {
      const repositoryId = req.params.id;
      const assessment = await PredictiveOrchestrator.getLatestAssessment(repositoryId);

      return res.json({
        success: true,
        data: {
          currentFinancialExposure: assessment.currentFinancialExposure,
          predictedFinancialExposure: assessment.predictedFinancialExposure,
          costOfDoingNothing: assessment.costOfDoingNothing,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/predictive/repositories/:id/goals
   * Retrieves engineering goals forecasting.
   */
  static async getGoals(req: Request, res: Response) {
    try {
      const repositoryId = req.params.id;
      const assessment = await PredictiveOrchestrator.getLatestAssessment(repositoryId);

      return res.json({
        success: true,
        data: assessment.goalForecasts || [],
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/predictive/repositories/:id/refresh
   * Forces regeneration of predictive assessment.
   */
  static async refreshAssessment(req: Request, res: Response) {
    try {
      const repositoryId = req.params.id;
      const horizon = (req.body.horizon as ForecastHorizon) || 'NEXT_ANALYSIS';
      const currency = req.body.currency || 'INR';

      const assessment = await PredictiveOrchestrator.generateAssessment(repositoryId, undefined, {
        horizon,
        currency,
        forceRefresh: true,
      });

      return res.json({
        success: true,
        message: 'Predictive assessment refreshed successfully.',
        data: assessment,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/predictive/scenarios
   * Evaluates What-If scenarios for a repository.
   */
  static async getScenarios(req: Request, res: Response) {
    try {
      const { repositoryId, horizon } = req.body;
      if (!repositoryId) {
        return res.status(400).json({ success: false, error: 'Repository ID is required.' });
      }

      const assessment = await PredictiveOrchestrator.getLatestAssessment(
        repositoryId,
        horizon || 'NEXT_ANALYSIS'
      );

      return res.json({
        success: true,
        data: {
          baselineForecast: {
            exposure: assessment.predictedFinancialExposure.expected,
            formatted: assessment.predictedFinancialExposure.formattedRange,
            debtScore: assessment.predictedDebtScore.expected,
            riskLevel: assessment.riskLevel,
          },
          costOfDoingNothing: assessment.costOfDoingNothing,
          scenarios: assessment.whatIfScenarios || [],
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/predictive/capacity-plan
   * Runs engineering capacity planning simulation.
   */
  static async planCapacity(req: Request, res: Response) {
    try {
      const { repositoryId, sprintCapacityHours } = req.body;
      if (!repositoryId) {
        return res.status(400).json({ success: false, error: 'Repository ID is required.' });
      }

      const hours = Number(sprintCapacityHours) || 80;
      const assessment = await PredictiveOrchestrator.getLatestAssessment(repositoryId);
      const plan = PredictiveRecommendationService.planSprintCapacity(
        assessment.recommendedActions || [],
        hours
      );

      return res.json({
        success: true,
        data: plan,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/predictive/recommendations/:id/feedback
   * Submits user feedback on a recommendation.
   */
  static async submitFeedback(req: Request, res: Response) {
    try {
      const actionId = req.params.id;
      const { feedback, userId } = req.body;

      if (!feedback || !['HELPFUL', 'NOT_HELPFUL', 'NOT_APPLICABLE'].includes(feedback)) {
        return res.status(400).json({
          success: false,
          error: 'Feedback must be HELPFUL, NOT_HELPFUL, or NOT_APPLICABLE.',
        });
      }

      PredictiveRecommendationService.recordFeedback(actionId, feedback, userId);

      return res.json({
        success: true,
        message: 'Feedback recorded successfully.',
        data: { actionId, feedback },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/predictive/assessments/:id
   * Retrieves an assessment by ID.
   */
  static async getAssessmentById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const isDbConnected = getDatabaseStatus().isConnected;

      if (isDbConnected) {
        const doc = await PredictiveAssessment.findById(id);
        if (doc) return res.json({ success: true, data: doc });
      }

      return res.status(404).json({ success: false, error: 'Predictive assessment not found.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/predictive/assessments/:id/trace
   * Retrieves calculation trace and audit trail for an assessment.
   */
  static async getAssessmentTrace(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const isDbConnected = getDatabaseStatus().isConnected;

      if (isDbConnected) {
        const doc = await PredictiveAssessment.findById(id);
        if (doc) {
          return res.json({
            success: true,
            data: {
              assessmentId: id,
              trace: doc.predictionTrace,
              confidenceFactors: doc.confidenceFactors,
              featureSnapshot: doc.featureSnapshot,
            },
          });
        }
      }

      return res.status(404).json({ success: false, error: 'Assessment trace not found.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/predictive/repositories/:id/accuracy
   * Retrieves accuracy and evaluation metrics across historical predictions.
   */
  static async getAccuracy(req: Request, res: Response) {
    try {
      const repositoryId = req.params.id;
      const report = await PredictionEvaluationService.computeAccuracyReport(repositoryId);

      return res.json({
        success: true,
        data: report,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
