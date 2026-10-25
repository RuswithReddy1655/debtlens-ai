import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { DemoDataService } from '../services/demoDataService';
import {
  Analysis,
  Repository,
  Hotspot,
  FileMetric,
  Recommendation,
  TrendPoint,
} from '../models';
import { getDatabaseStatus } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AnalysisOrchestrator } from '../services/analysis/AnalysisOrchestrator';
import { RepositoryController } from './repositoryController';

export const createAnalysisSchema = z.object({
  repositoryId: z.string().min(1, 'Repository ID is required'),
  branch: z.string().default('main'),
  commitHash: z.string().optional().default('HEAD'),
  isDemo: z.boolean().optional().default(false),
  hourlyRate: z.number().positive().optional().default(95),
});

export const costQuerySchema = z.object({
  hourlyRate: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const financialQuerySchema = z.object({
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).optional(),
  hourlyRate: z.string().regex(/^\d+$/).transform(Number).optional(),
  repoName: z.string().optional(),
});

export const scenarioSchema = z.object({
  scenarioName: z.string().min(1, 'Scenario name is required').default('Custom What-If Scenario'),
  selectedFilePaths: z.array(z.string()).default([]),
  hourlyRate: z.number().positive().optional(),
  remediationEffectiveness: z.number().min(0.05).max(1.0).optional().default(0.65),
  effortMultiplier: z.number().min(0.2).max(5.0).optional().default(1.0),
});

export const compareAnalysesSchema = z.object({
  targetAnalysisId: z.string().min(1, 'Target analysis ID is required'),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).optional(),
});

export class AnalysisController {
  /**
   * Triggers a new repository analysis job (real Git clone & intelligence or benchmark demo).
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = req.body as z.infer<typeof createAnalysisSchema>;
      const dbStatus = getDatabaseStatus();

      // 1. Locate repository
      let repo: any = null;

      if (dbStatus.isConnected && Types.ObjectId.isValid(validated.repositoryId)) {
        repo = await Repository.findById(validated.repositoryId).lean();
      }

      if (!repo) {
        repo = RepositoryController.getOfflineRepository(validated.repositoryId);
      }

      if (!repo) {
        repo = DemoDataService.getRepositoryById(validated.repositoryId);
      }

      if (!repo) {
        throw new AppError(
          `Repository with ID '${validated.repositoryId}' not found.`,
          404,
          'REPOSITORY_NOT_FOUND'
        );
      }

      // 2. If repository is marked Demo or explicitly requested as demo, return Phase 1 benchmark
      if (repo.isDemo || validated.isDemo) {
        if (dbStatus.isConnected && Types.ObjectId.isValid(validated.repositoryId)) {
          const demoAnalysis = DemoDataService.getAnalysisById('analysis-demo-fintech-01');
          const newAnalysis = await Analysis.create({
            repositoryId: validated.repositoryId,
            branch: validated.branch,
            commitHash: validated.commitHash || 'a1b2c3d',
            status: 'completed',
            progress: 100,
            currentStage: 'Completed',
            isDemo: true,
            summary: demoAnalysis?.summary,
            completedAt: new Date(),
          });

          res.status(201).json({
            success: true,
            message: 'Analysis initiated successfully (Phase 1 Benchmark Pipeline).',
            isDemoSource: true,
            data: newAnalysis,
          });
          return;
        }

        const mockAnalysis = {
          _id: `analysis-${Date.now()}`,
          id: `analysis-${Date.now()}`,
          repositoryId: validated.repositoryId,
          branch: validated.branch,
          commitHash: validated.commitHash || '8f2a1b9',
          status: 'completed',
          progress: 100,
          currentStage: 'Completed',
          isDemo: true,
          summary: DemoDataService.getAnalysisById('analysis-demo-fintech-01')?.summary,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        res.status(201).json({
          success: true,
          message: 'Analysis completed using Phase 1 benchmark baseline.',
          isDemoSource: true,
          data: mockAnalysis,
        });
        return;
      }

      // 3. REAL REPOSITORY INGESTION & ANALYSIS
      const analysisId = (dbStatus.isConnected && Types.ObjectId.isValid(repo._id || repo.id))
        ? new Types.ObjectId().toString()
        : `analysis-real-${Date.now()}`;

      const initialRecord = {
        _id: analysisId,
        id: analysisId,
        repositoryId: repo._id?.toString() || repo.id || validated.repositoryId,
        branch: validated.branch || repo.defaultBranch || 'main',
        commitHash: validated.commitHash || 'HEAD',
        status: 'queued' as const,
        progress: 5,
        currentStage: 'Queued for secure clone',
        filesDiscovered: 0,
        filesAnalyzed: 0,
        commitsAnalyzed: 0,
        isDemo: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (dbStatus.isConnected && Types.ObjectId.isValid(analysisId)) {
        await Analysis.create({
          _id: new Types.ObjectId(analysisId),
          repositoryId: repo._id,
          branch: initialRecord.branch,
          commitHash: initialRecord.commitHash,
          status: 'queued',
          progress: 5,
          currentStage: 'Queued for secure clone',
          filesDiscovered: 0,
          filesAnalyzed: 0,
          commitsAnalyzed: 0,
          isDemo: false,
        });
      }

      // Launch orchestrator asynchronously
      AnalysisOrchestrator.runAnalysis({
        analysisId,
        repositoryId: repo._id?.toString() || repo.id || validated.repositoryId,
        repoUrl: repo.url,
        branch: validated.branch || repo.defaultBranch,
        hourlyRate: validated.hourlyRate,
      }).catch((err) => {
        console.error(`[AnalysisController] Async analysis error: ${err.message}`);
      });

      res.status(202).json({
        success: true,
        message: 'Real repository analysis job initiated.',
        isDemoSource: false,
        data: initialRecord,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Real-time polling endpoint to get live job stage, progress, and file counters.
   */
  static async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // 1. Check live in-memory active jobs
      const activeJob = AnalysisOrchestrator.getJobStatus(id);
      if (activeJob) {
        res.json({
          success: true,
          isDemoSource: activeJob.isDemo,
          data: activeJob,
        });
        return;
      }

      // 2. Check completed in-memory cache
      const completed = AnalysisOrchestrator.getCompletedData(id);
      if (completed) {
        res.json({
          success: true,
          isDemoSource: false,
          data: {
            analysisId: id,
            repositoryId: completed.analysis.repositoryId,
            status: completed.analysis.status,
            progress: completed.analysis.progress,
            currentStage: completed.analysis.currentStage,
            startedAt: completed.analysis.startedAt,
            completedAt: completed.analysis.completedAt,
            commitSha: completed.analysis.commitHash,
            filesDiscovered: completed.analysis.filesDiscovered,
            filesAnalyzed: completed.analysis.filesAnalyzed,
            commitsAnalyzed: completed.analysis.commitsAnalyzed,
            isDemo: false,
          },
        });
        return;
      }

      // 3. Check MongoDB
      const dbStatus = getDatabaseStatus();
      if (dbStatus.isConnected && Types.ObjectId.isValid(id)) {
        const analysis = await Analysis.findById(id).lean();
        if (analysis) {
          res.json({
            success: true,
            isDemoSource: analysis.isDemo,
            data: {
              analysisId: analysis._id.toString(),
              repositoryId: analysis.repositoryId.toString(),
              status: analysis.status,
              progress: analysis.progress,
              currentStage: analysis.currentStage || 'Completed',
              startedAt: analysis.createdAt,
              completedAt: analysis.completedAt,
              commitSha: analysis.commitHash,
              filesDiscovered: analysis.filesDiscovered || 0,
              filesAnalyzed: analysis.filesAnalyzed || 0,
              commitsAnalyzed: analysis.commitsAnalyzed || 0,
              isDemo: analysis.isDemo,
              error: analysis.error,
            },
          });
          return;
        }
      }

      // 4. Check Demo analyses
      const demo = DemoDataService.getAnalysisById(id);
      if (demo) {
        res.json({
          success: true,
          isDemoSource: true,
          data: {
            analysisId: id,
            repositoryId: demo.repositoryId,
            status: 'completed',
            progress: 100,
            currentStage: 'Completed',
            commitSha: demo.commitHash,
            filesDiscovered: 42,
            filesAnalyzed: 42,
            commitsAnalyzed: 350,
            isDemo: true,
          },
        });
        return;
      }

      throw new AppError(`Analysis with ID '${id}' not found.`, 404, 'ANALYSIS_NOT_FOUND');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancels a running analysis job safely.
   */
  static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const cancelled = AnalysisOrchestrator.cancelAnalysis(id);

      if (cancelled) {
        res.json({
          success: true,
          message: `Analysis job '${id}' has been cancelled.`,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: `Analysis job '${id}' is not currently active or cannot be cancelled.`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves summary details of an analysis by ID.
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dbStatus = getDatabaseStatus();

      // Check MongoDB
      if (dbStatus.isConnected && Types.ObjectId.isValid(id)) {
        const analysis = await Analysis.findById(id).populate('repositoryId', 'name owner url').lean();
        if (analysis) {
          res.json({ success: true, isDemoSource: analysis.isDemo, data: analysis });
          return;
        }
      }

      // Check in-memory completed cache
      const completed = AnalysisOrchestrator.getCompletedData(id);
      if (completed) {
        res.json({ success: true, isDemoSource: false, data: completed.analysis });
        return;
      }

      // Check Demo store
      const demoAnalysis = DemoDataService.getAnalysisById(id);
      if (demoAnalysis) {
        res.json({
          success: true,
          isDemoSource: true,
          disclaimer: 'Benchmark demo analysis provided for architecture and UI validation.',
          data: demoAnalysis,
        });
        return;
      }

      throw new AppError(`Analysis with ID '${id}' not found.`, 404, 'ANALYSIS_NOT_FOUND');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves real ranked hotspots for an analysis.
   */
  static async getHotspots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dbStatus = getDatabaseStatus();

      // Check MongoDB
      if (dbStatus.isConnected && Types.ObjectId.isValid(id)) {
        const realHotspots = await Hotspot.find({ analysisId: new Types.ObjectId(id) })
          .sort({ hotspotScore: -1 })
          .lean();
        if (realHotspots.length > 0) {
          res.json({
            success: true,
            analysisId: id,
            count: realHotspots.length,
            isDemoSource: false,
            data: realHotspots,
          });
          return;
        }
      }

      // Check in-memory cache
      const cachedHotspots = AnalysisOrchestrator.getHotspots(id);
      if (cachedHotspots !== null) {
        res.json({
          success: true,
          analysisId: id,
          count: cachedHotspots.length,
          isDemoSource: false,
          data: cachedHotspots,
        });
        return;
      }

      // Fall back to Demo data if analysis is a demo ID
      const demoAnalysis = DemoDataService.getAnalysisById(id);
      if (demoAnalysis || id.includes('demo')) {
        const hotspots = DemoDataService.getHotspots(id);
        res.json({
          success: true,
          analysisId: id,
          count: hotspots.length,
          isDemoSource: true,
          disclaimer: 'Benchmark hotspot calculations based on multi-dimensional complexity and churn formulas.',
          data: hotspots,
        });
        return;
      }

      // Real analysis exists but produced zero hotspots
      res.json({
        success: true,
        analysisId: id,
        count: 0,
        isDemoSource: false,
        data: [],
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves file-level metrics for an analysis.
   */
  static async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dbStatus = getDatabaseStatus();

      // Check MongoDB
      if (dbStatus.isConnected && Types.ObjectId.isValid(id)) {
        const realMetrics = await FileMetric.find({ analysisId: new Types.ObjectId(id) })
          .sort({ debtScore: -1 })
          .lean();
        if (realMetrics.length > 0) {
          res.json({
            success: true,
            analysisId: id,
            count: realMetrics.length,
            isDemoSource: false,
            data: realMetrics,
          });
          return;
        }
      }

      // Check in-memory cache
      const cachedMetrics = AnalysisOrchestrator.getFileMetrics(id);
      if (cachedMetrics !== null) {
        res.json({
          success: true,
          analysisId: id,
          count: cachedMetrics.length,
          isDemoSource: false,
          data: cachedMetrics,
        });
        return;
      }

      // Fall back to Demo data if demo ID
      const demoAnalysis = DemoDataService.getAnalysisById(id);
      if (demoAnalysis || id.includes('demo')) {
        const metrics = DemoDataService.getFileMetrics(id);
        res.json({
          success: true,
          analysisId: id,
          count: metrics.length,
          isDemoSource: true,
          disclaimer: 'File-level metrics generated from benchmark code repository parsing.',
          data: metrics,
        });
        return;
      }

      // Real analysis with 0 files
      res.json({
        success: true,
        analysisId: id,
        count: 0,
        isDemoSource: false,
        data: [],
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves historical trend trajectory.
   */
  static async getTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dbStatus = getDatabaseStatus();

      // Check MongoDB
      if (dbStatus.isConnected && Types.ObjectId.isValid(id)) {
        const targetId = new Types.ObjectId(id);
        const realTrends = await TrendPoint.find({
          $or: [{ repositoryId: targetId }, { analysisId: targetId }],
        })
          .sort({ date: 1 })
          .lean();

        if (realTrends.length > 0) {
          res.json({
            success: true,
            repositoryId: id,
            count: realTrends.length,
            isDemoSource: false,
            data: realTrends,
          });
          return;
        }
      }

      // Check in-memory cache
      const cachedTrends = AnalysisOrchestrator.getTrends(id);
      if (cachedTrends !== null && cachedTrends.length > 0) {
        res.json({
          success: true,
          repositoryId: id,
          count: cachedTrends.length,
          isDemoSource: false,
          data: cachedTrends,
        });
        return;
      }

      // Check demo trends
      if (id.includes('demo') || DemoDataService.getRepositoryById(id)) {
        const trends = DemoDataService.getTrends(id);
        res.json({
          success: true,
          repositoryId: id,
          count: trends.length,
          isDemoSource: true,
          disclaimer: 'Historical trend timeline tracking technical debt growth and health score trajectories.',
          data: trends,
        });
        return;
      }

      // Insufficient history for newly ingested repo
      res.json({
        success: true,
        repositoryId: id,
        count: 0,
        isDemoSource: false,
        disclaimer: 'Insufficient repository history for this trend.',
        data: [],
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves refactoring and ROI recommendations.
   */
  static async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dbStatus = getDatabaseStatus();

      // Check MongoDB
      if (dbStatus.isConnected && Types.ObjectId.isValid(id)) {
        const realRecs = await Recommendation.find({ analysisId: new Types.ObjectId(id) })
          .sort({ roiRatio: -1 })
          .lean();
        if (realRecs.length > 0) {
          res.json({
            success: true,
            analysisId: id,
            count: realRecs.length,
            isDemoSource: false,
            data: realRecs,
          });
          return;
        }
      }

      // Check in-memory cache
      const cachedRecs = AnalysisOrchestrator.getRecommendations(id);
      if (cachedRecs !== null) {
        res.json({
          success: true,
          analysisId: id,
          count: cachedRecs.length,
          isDemoSource: false,
          data: cachedRecs,
        });
        return;
      }

      // Fall back to Demo data if demo ID
      if (id.includes('demo') || DemoDataService.getAnalysisById(id)) {
        const recommendations = DemoDataService.getRecommendations(id);
        res.json({
          success: true,
          analysisId: id,
          count: recommendations.length,
          isDemoSource: true,
          disclaimer: 'Algorithmic refactoring and architectural recommendations with ROI prioritization.',
          data: recommendations,
        });
        return;
      }

      // Real analysis with no recommendations
      res.json({
        success: true,
        analysisId: id,
        count: 0,
        isDemoSource: false,
        data: [],
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves financial cost and ROI valuation based on real code metrics.
   */
  static async getCost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const hourlyRate = req.query.hourlyRate ? parseInt(req.query.hourlyRate as string, 10) : 95;

      // Check in-memory real valuation
      const realValuation = await AnalysisOrchestrator.getValuation(id, hourlyRate);
      if (realValuation) {
        res.json({
          success: true,
          analysisId: id,
          isDemoSource: false,
          data: realValuation,
        });
        return;
      }

      // Check MongoDB if analysis was completed
      const dbStatus = getDatabaseStatus();
      if (dbStatus.isConnected && Types.ObjectId.isValid(id)) {
        const analysis = await Analysis.findById(id).lean();
        if (analysis && analysis.summary && !analysis.isDemo) {
          // Reconstruct valuation from real summary metrics
          const summary = analysis.summary as any;
          const totalHours = summary.totalDebtHours || 0;
          const reworkCost = summary.historicalReworkCost || totalHours * hourlyRate * 0.4;
          const annualCost = summary.annualAvoidableCost || totalHours * hourlyRate * 0.35;
          const remediationCost = summary.estimatedRemediationCost || totalHours * hourlyRate;
          const netBenefit = summary.potentialRefactoringBenefit || remediationCost * 1.5;

          res.json({
            success: true,
            analysisId: id,
            isDemoSource: false,
            data: {
              currency: 'USD',
              hourlyRate,
              historicalMaintenanceReworkBurden: {
                totalHours: Math.round(reworkCost / hourlyRate),
                totalCost: reworkCost,
                formulaTrace: 'Defect-fix commits * average fix effort (hours) * blended engineering hourly rate',
                trace: {
                  input: { reworkHours: Math.round(reworkCost / hourlyRate), hourlyRate },
                  formula: 'HistoricalBurden = reworkHours * hourlyRate',
                  result: reworkCost,
                  explanation: 'Historical engineering expenditure lost to bug fixes and maintenance rework.',
                },
              },
              estimatedFutureAvoidableCost: {
                projectedAnnualCost: annualCost,
                confidenceInterval: { low: Math.round(annualCost * 0.8), high: Math.round(annualCost * 1.25) },
                formulaTrace: 'Projected churn * risk factor * engineering hourly rate',
                trace: {
                  input: { annualCost, hourlyRate },
                  formula: 'AvoidableAnnualCost = annualHoursWasted * hourlyRate',
                  result: annualCost,
                  explanation: 'Avoidable maintenance drag and regression friction projected over 12 months.',
                },
              },
              estimatedRemediationInvestment: {
                totalHours,
                totalCost: remediationCost,
                formulaTrace: 'Debt hours * blended engineering hourly rate',
                trace: {
                  input: { totalHours, hourlyRate },
                  formula: 'RemediationCost = totalHours * hourlyRate',
                  result: remediationCost,
                  explanation: 'Total engineering capital required to eliminate high and critical debt.',
                },
              },
              potentialRefactoringBenefit: {
                netSavings: netBenefit,
                roiMultiple: Number((netBenefit / Math.max(remediationCost, 1)).toFixed(1)),
                paybackPeriodMonths: Math.round((remediationCost / Math.max(annualCost, 1)) * 12),
                paybackMonths: Math.round((remediationCost / Math.max(annualCost, 1)) * 12),
                formulaTrace: 'Estimated 3-year avoidable cost reduction minus remediation cost',
                trace: {
                  input: { netSavings: netBenefit, remediationCost },
                  formula: 'NetSavings = (3yr Avoidable Drag) - RemediationCost',
                  result: netBenefit,
                  explanation: 'Net financial return realized over 3 years from proactively addressing hotspots.',
                },
              },
              disclaimer: 'Assumption-based financial model estimating maintenance impact. Values are projected ranges.',
            },
          });
          return;
        }
      }

      // Fall back to demo cost valuation
      const costValuation = DemoDataService.getFinancialCost(id, hourlyRate);
      res.json({
        success: true,
        analysisId: id,
        isDemoSource: true,
        data: costValuation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analyses/:id/financial-intelligence
   * Comprehensive financial intelligence summary with 4 quadrants, traces, ranges, and confidence.
   */
  static async getFinancialIntelligence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const currency = req.query.currency as any;
      const hourlyRate = req.query.hourlyRate ? Number(req.query.hourlyRate) : undefined;

      const intel = AnalysisOrchestrator.getFinancialIntelligence(id, { currency, hourlyRate });
      if (!intel) {
        throw new AppError(`Analysis with ID '${id}' not found.`, 404, 'ANALYSIS_NOT_FOUND');
      }

      const isDemo = intel.confidence === 'MEDIUM' && (id === 'analysis-demo-fintech-01' || id.startsWith('analysis-demo'));

      res.json({
        success: true,
        analysisId: id,
        isDemoSource: isDemo,
        data: intel,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analyses/:id/cost-drivers
   * Detailed breakdown of the 4 cost drivers and top cost-driver files.
   */
  static async getCostDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const currency = req.query.currency as any;
      const hourlyRate = req.query.hourlyRate ? Number(req.query.hourlyRate) : undefined;

      const drivers = AnalysisOrchestrator.getCostDrivers(id, { currency, hourlyRate });
      if (!drivers) {
        throw new AppError(`Analysis with ID '${id}' not found.`, 404, 'ANALYSIS_NOT_FOUND');
      }

      res.json({
        success: true,
        analysisId: id,
        isDemoSource: id.includes('demo'),
        data: drivers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analyses/:id/priorities
   * Prioritized list of code debt items with Impact vs Effort matrix categorization.
   */
  static async getPriorities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const currency = req.query.currency as any;
      const hourlyRate = req.query.hourlyRate ? Number(req.query.hourlyRate) : undefined;

      const priorities = AnalysisOrchestrator.getPriorities(id, { currency, hourlyRate });
      if (!priorities) {
        throw new AppError(`Analysis with ID '${id}' not found.`, 404, 'ANALYSIS_NOT_FOUND');
      }

      res.json({
        success: true,
        analysisId: id,
        isDemoSource: id.includes('demo'),
        data: priorities,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analyses/:id/savings
   * Modeled annual savings and residual impact.
   */
  static async getSavings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const currency = req.query.currency as any;
      const hourlyRate = req.query.hourlyRate ? Number(req.query.hourlyRate) : undefined;

      const intel = AnalysisOrchestrator.getFinancialIntelligence(id, { currency, hourlyRate });
      if (!intel) {
        throw new AppError(`Analysis with ID '${id}' not found.`, 404, 'ANALYSIS_NOT_FOUND');
      }

      res.json({
        success: true,
        analysisId: id,
        isDemoSource: id.includes('demo'),
        data: {
          currentAnnualImpact: intel.summary.totalAnnualExposure,
          annualExposureRange: intel.summary.annualExposureRange,
          potentialAnnualSavings: intel.summary.potentialAnnualSavings,
          savingsRange: intel.summary.savingsRange,
          twoYearNetBenefit: intel.summary.twoYearNetBenefit,
          netBenefitRange: intel.summary.netBenefitRange,
          roiPercentage: intel.summary.roiPercentage,
          paybackPeriodMonths: intel.summary.paybackPeriodMonths,
          currency: intel.currency,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/analyses/:id/scenarios
   * Evaluates custom what-if scenario.
   */
  static async runScenario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = req.body;

      const result = await AnalysisOrchestrator.evaluateScenario(id, validated);
      if (!result) {
        throw new AppError(`Analysis with ID '${id}' not found.`, 404, 'ANALYSIS_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        analysisId: id,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analyses/:id/scenarios/presets
   * Generates comparative scenario matrix (Top 5 Quick Wins vs Top 10 vs All Hotspots).
   */
  static async comparePresets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const currency = req.query.currency as any;
      const hourlyRate = req.query.hourlyRate ? Number(req.query.hourlyRate) : undefined;

      const comparison = AnalysisOrchestrator.comparePresets(id, { currency, hourlyRate });
      if (!comparison) {
        throw new AppError(`Analysis with ID '${id}' not found.`, 404, 'ANALYSIS_NOT_FOUND');
      }

      res.json({
        success: true,
        analysisId: id,
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analyses/:id/executive-report
   * Generates structured executive briefing document.
   */
  static async getExecutiveReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const repoName = req.query.repoName as string | undefined;
      const currency = req.query.currency as any;
      const hourlyRate = req.query.hourlyRate ? Number(req.query.hourlyRate) : undefined;

      const report = AnalysisOrchestrator.getExecutiveReport(id, repoName, { currency, hourlyRate });
      if (!report) {
        throw new AppError(`Analysis with ID '${id}' not found.`, 404, 'ANALYSIS_NOT_FOUND');
      }

      res.json({
        success: true,
        analysisId: id,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/analyses/:id/compare
   * Compares two analyses for debt reduction delta.
   */
  static async compareAnalyses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const baselineId = req.params.id;
      const { targetAnalysisId, currency } = req.body;

      const comparison = AnalysisOrchestrator.compareAnalyses(baselineId, targetAnalysisId, currency);
      if (!comparison) {
        throw new AppError(`Analyses could not be compared. Ensure both IDs are valid.`, 400, 'COMPARISON_FAILED');
      }

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/portfolio
   * Aggregates financial exposure across all repositories.
   */
  static async getPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currency = req.query.currency as string | undefined;
      const hourlyRate = req.query.hourlyRate ? Number(req.query.hourlyRate) : undefined;

      const portfolio = await AnalysisOrchestrator.getPortfolio(currency, hourlyRate);
      res.json({
        success: true,
        data: portfolio,
      });
    } catch (error) {
      next(error);
    }
  }
}
