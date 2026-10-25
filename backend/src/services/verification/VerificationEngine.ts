import { IDebtItem, VerificationResultStatus } from '../../models/DebtItem';
import { DebtIdentityService } from '../debt/DebtIdentityService';
import { AuditTrailService } from '../audit/AuditTrailService';
import { AlertEngine } from '../alerts/AlertEngine';
import { getDatabaseStatus } from '../../config/database';

export interface VerificationResult {
  debtItemId: string;
  filePath: string;
  verificationStatus: VerificationResultStatus;
  complexityBefore: number;
  complexityAfter: number;
  complexityDelta: number;
  complexityReductionPct: number;
  hotspotScoreBefore: number;
  hotspotScoreAfter: number;
  hotspotScoreDelta: number;
  verifiedTechnicalImprovement: string;
  modeledAnnualExposureReduction: number;
  realizedBusinessSavings: string; // Always 'NOT VERIFIED' unless accounting data supplied
  message: string;
}

export class VerificationEngine {
  /**
   * Verifies an individual resolved debt item against latest file telemetry.
   */
  static verifyItem(
    item: IDebtItem,
    latestFileMetric: any | null,
    latestHotspot: any | null,
    analysisId?: string
  ): VerificationResult {
    const baseComplexity = item.baselineMetrics?.complexity ?? 20;
    const baseHotspot = item.baselineMetrics?.debtScore ?? item.priorityScore ?? 60;

    // If file was deleted/removed cleanly as part of refactoring
    if (!latestFileMetric && !latestHotspot) {
      const result: VerificationResult = {
        debtItemId: item.debtItemId,
        filePath: item.filePath,
        verificationStatus: 'VERIFIED',
        complexityBefore: baseComplexity,
        complexityAfter: 0,
        complexityDelta: baseComplexity,
        complexityReductionPct: 100,
        hotspotScoreBefore: baseHotspot,
        hotspotScoreAfter: 0,
        hotspotScoreDelta: baseHotspot,
        verifiedTechnicalImprovement: `File removed/decoupled from codebase (100% complexity eliminated).`,
        modeledAnnualExposureReduction: item.financialImpact,
        realizedBusinessSavings: 'NOT VERIFIED (Model estimate only)',
        message: 'Verified: Monolithic module eliminated/decoupled from repository.',
      };
      return result;
    }

    const currentComplexity = latestFileMetric?.cyclomaticComplexity ?? baseComplexity;
    const currentHotspot = latestFileMetric?.debtScore ?? latestHotspot?.debtScore ?? baseHotspot;

    const complexityDelta = baseComplexity - currentComplexity;
    const hotspotScoreDelta = baseHotspot - currentHotspot;

    const complexityReductionPct =
      baseComplexity > 0
        ? Math.round(((baseComplexity - currentComplexity) / baseComplexity) * 1000) / 10
        : 0;
    const hotspotReductionPct =
      baseHotspot > 0
        ? Math.round(((baseHotspot - currentHotspot) / baseHotspot) * 1000) / 10
        : 0;

    let verificationStatus: VerificationResultStatus = 'NOT_VERIFIED';
    let message = '';

    if (complexityReductionPct >= 20 || hotspotReductionPct >= 25) {
      verificationStatus = 'VERIFIED';
      message = `Verified: Complexity reduced by ${complexityReductionPct}%, risk reduced by ${hotspotReductionPct}%.`;
    } else if (complexityReductionPct >= 5 || hotspotReductionPct >= 10) {
      verificationStatus = 'PARTIALLY_VERIFIED';
      message = `Partially Verified: Moderate improvement (Complexity -${complexityReductionPct}%, Hotspot -${hotspotReductionPct}%).`;
    } else {
      verificationStatus = 'NOT_VERIFIED';
      message = `Not Verified: Telemetry did not show meaningful debt reduction after resolution commit (Complexity Δ: ${complexityDelta}).`;
    }

    // Modeled reduction (never guaranteed accounting cash)
    const modeledReduction = Math.round(item.financialImpact * (Math.max(0, complexityReductionPct) / 100));

    return {
      debtItemId: item.debtItemId,
      filePath: item.filePath,
      verificationStatus,
      complexityBefore: baseComplexity,
      complexityAfter: currentComplexity,
      complexityDelta,
      complexityReductionPct,
      hotspotScoreBefore: baseHotspot,
      hotspotScoreAfter: currentHotspot,
      hotspotScoreDelta,
      verifiedTechnicalImprovement: `Complexity reduced from ${baseComplexity} to ${currentComplexity} (${complexityReductionPct}% reduction).`,
      modeledAnnualExposureReduction: modeledReduction,
      realizedBusinessSavings: 'NOT VERIFIED (Model estimate only)',
      message,
    };
  }

  /**
   * Scans all resolved debt items for a repository and runs automated verification
   * against the newest analysis snapshot.
   */
  static async verifyRepositoryResolvedItems(
    repositoryId: string,
    fileMetrics: any[],
    hotspots: any[],
    analysisId: string
  ): Promise<VerificationResult[]> {
    const debtItems = await DebtIdentityService.getDebtItems(repositoryId);
    const resolvedItems = debtItems.filter(
      (item) => item.currentStatus === 'RESOLVED' || item.currentStatus === 'VERIFIED'
    );

    const results: VerificationResult[] = [];
    const isDbConnected = getDatabaseStatus().isConnected;

    for (const item of resolvedItems) {
      const metric = fileMetrics.find((f) => f.filePath === item.filePath) || null;
      const hotspot = hotspots.find((h) => h.filePath === item.filePath) || null;

      const vResult = this.verifyItem(item, metric, hotspot, analysisId);
      results.push(vResult);

      // Update DebtItem fields
      item.verificationStatus = vResult.verificationStatus;
      item.verificationAnalysisId = analysisId;
      item.verificationDetails = {
        complexityReductionPct: vResult.complexityReductionPct,
        hotspotScoreDelta: vResult.hotspotScoreDelta,
        message: vResult.message,
      };

      if (vResult.verificationStatus === 'VERIFIED') {
        item.currentStatus = 'VERIFIED';
        await AuditTrailService.logEvent({
          repositoryId,
          action: 'DEBT_VERIFIED',
          targetId: item.debtItemId,
          targetType: 'DEBT_ITEM',
          description: `Verified debt reduction on ${item.filePath}: ${vResult.verifiedTechnicalImprovement}`,
          metadata: vResult,
        });
      } else if (vResult.verificationStatus === 'NOT_VERIFIED' && item.currentStatus === 'RESOLVED') {
        // Automatically suggest reopening when verification fails
        item.currentStatus = 'REOPENED';
        await AuditTrailService.logEvent({
          repositoryId,
          action: 'DEBT_REOPENED',
          targetId: item.debtItemId,
          targetType: 'DEBT_ITEM',
          description: `Debt item ${item.filePath} reopened: Verification failed (${vResult.message})`,
          metadata: vResult,
        });

        // Trigger Alert
        await AlertEngine.createAlert({
          repositoryId,
          type: 'DEBT_REOPENED',
          severity: 'HIGH',
          title: `Debt Item Reopened: ${item.filePath}`,
          message: `Attempted refactoring on ${item.filePath} failed verification. Complexity did not improve.`,
          metric: 'complexity',
          currentValue: vResult.complexityAfter,
          previousValue: vResult.complexityBefore,
        });
      }

      if (isDbConnected && typeof (item as any).save === 'function') {
        await (item as any).save();
      } else {
        DebtIdentityService.setMemoryItem(item);
      }
    }

    return results;
  }
}
