import { IAnalysisSnapshot } from '../../models/AnalysisSnapshot';
import { IDebtItem } from '../../models/DebtItem';
import { IEngineeringGoal } from '../../models/EngineeringGoal';

export type SignalClassification =
  | 'OBSERVED'
  | 'DERIVED'
  | 'ESTIMATED'
  | 'MODELED'
  | 'VERIFIED'
  | 'UNAVAILABLE';

export interface ClassifiedFeature<T = number | string | boolean> {
  name: string;
  value: T;
  classification: SignalClassification;
  description: string;
}

export interface ExtractedFeatureSet {
  repositoryFeatures: {
    commitFrequency: ClassifiedFeature<number>;
    commitVelocity: ClassifiedFeature<number>;
    changeFrequency: ClassifiedFeature<number>;
    repositoryActivity: ClassifiedFeature<string>;
  };
  codeFeatures: {
    linesOfCode: ClassifiedFeature<number>;
    complexity: ClassifiedFeature<number>;
    averageComplexity: ClassifiedFeature<number>;
    maxComplexity: ClassifiedFeature<number>;
    nestingDepth: ClassifiedFeature<number>;
  };
  debtFeatures: {
    technicalDebtScore: ClassifiedFeature<number>;
    hotspotCount: ClassifiedFeature<number>;
    criticalHotspotCount: ClassifiedFeature<number>;
    highPriorityDebt: ClassifiedFeature<number>;
    debtAgeDays: ClassifiedFeature<number>;
    reopenedDebtCount: ClassifiedFeature<number>;
    resolvedDebtCount: ClassifiedFeature<number>;
    verificationSuccessRate: ClassifiedFeature<number>;
  };
  gitFeatures: {
    totalChurn: ClassifiedFeature<number>;
    fileChurnAverage: ClassifiedFeature<number>;
    commitConcentration: ClassifiedFeature<number>;
    defectFixActivity: ClassifiedFeature<number>;
  };
  financialFeatures: {
    annualExposure: ClassifiedFeature<number>;
    maintenanceFriction: ClassifiedFeature<number>;
    defectBurden: ClassifiedFeature<number>;
    changeFriction: ClassifiedFeature<number>;
    legacyRisk: ClassifiedFeature<number>;
  };
  processFeatures: {
    resolutionVelocity: ClassifiedFeature<number>;
    verificationVelocity: ClassifiedFeature<number>;
    goalAchievementRate: ClassifiedFeature<number>;
    activeGoalCount: ClassifiedFeature<number>;
  };
  historySummary: {
    snapshotCount: ClassifiedFeature<number>;
    dataCompletenessRatio: ClassifiedFeature<number>;
    windowSpanDays: ClassifiedFeature<number>;
  };
}

export class PredictiveFeatureService {
  /**
   * Extracts typed, classified features from a sequence of historical snapshots,
   * tracked debt items, and engineering goals.
   * Snapshots are expected in chronological order or newest-first. We sort them chronologically.
   */
  static extractFeatures(
    snapshots: IAnalysisSnapshot[],
    debtItems: IDebtItem[] = [],
    goals: IEngineeringGoal[] = []
  ): ExtractedFeatureSet {
    // Sort chronologically ascending (oldest to newest)
    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const latest = sorted[sorted.length - 1];
    const previous = sorted.length > 1 ? sorted[sorted.length - 2] : undefined;
    const count = sorted.length;

    // Time window calculation
    let windowSpanDays = 0;
    if (count >= 2) {
      const firstTime = new Date(sorted[0].timestamp).getTime();
      const lastTime = new Date(latest.timestamp).getTime();
      windowSpanDays = Math.max(1, Math.round((lastTime - firstTime) / (1000 * 60 * 60 * 24)));
    }

    // Repository features
    const latestCommitCount = latest?.commitCount || 0;
    const prevCommitCount = previous?.commitCount || 0;
    const commitDiff = Math.max(0, latestCommitCount - prevCommitCount);
    const commitFrequency = count > 1 ? Math.round(commitDiff / Math.max(1, count - 1)) : latestCommitCount;

    // Code features
    const linesOfCode = latest?.linesOfCode || 0;
    const complexity = latest?.complexity || 0;
    const maxNesting = latest?.maxNesting || 0;

    // Debt features
    const debtScore = latest?.technicalDebtScore || 0;
    const hotspotCount = latest?.hotspotCount || 0;
    const criticalHotspotCount = latest?.criticalHotspotCount || 0;
    const highPriorityDebt = (latest?.priorityDistribution?.critical || 0) + (latest?.priorityDistribution?.high || 0);

    // Debt items lifecycle metrics
    const resolvedItems = debtItems.filter(
      (d) => d.currentStatus === 'RESOLVED' || d.currentStatus === 'VERIFIED'
    );
    const reopenedItems = debtItems.filter((d) => d.currentStatus === 'REOPENED');
    const verifiedItems = debtItems.filter((d) => d.verificationStatus === 'VERIFIED');
    const totalAttemptedVerification = debtItems.filter(
      (d) => d.verificationStatus === 'VERIFIED' || d.verificationStatus === 'NOT_VERIFIED'
    );

    const verificationSuccessRate =
      totalAttemptedVerification.length > 0
        ? Math.round((verifiedItems.length / totalAttemptedVerification.length) * 100)
        : 100;

    // Debt age in days
    let avgDebtAgeDays = 0;
    if (debtItems.length > 0) {
      const now = Date.now();
      const totalAgeDays = debtItems.reduce((acc, item) => {
        const itemCreated = new Date(item.firstDetectedAt || item.createdAt || now).getTime();
        return acc + Math.max(0, Math.round((now - itemCreated) / (1000 * 60 * 60 * 24)));
      }, 0);
      avgDebtAgeDays = Math.round(totalAgeDays / debtItems.length);
    } else if (latest?.codeAge) {
      avgDebtAgeDays = latest.codeAge;
    }

    // Git features
    const totalChurn = latest?.totalChurn || 0;
    const fileChurnAverage = hotspotCount > 0 ? Math.round(totalChurn / hotspotCount) : 0;
    const defectFixActivity = latest?.defectFixBurden ? Math.round(latest.defectFixBurden / 2500) : 0;

    // Financial features
    const annualExposure = latest?.financialExposure || 0;
    const maintenanceFriction = latest?.maintenanceFriction || 0;
    const defectBurden = latest?.defectFixBurden || 0;
    const changeFriction = latest?.changeFriction || 0;
    const legacyRisk = latest?.legacyRisk || 0;

    // Goals features
    const activeGoals = goals.filter((g) => g.status === 'ACTIVE');
    const achievedGoals = goals.filter((g) => g.status === 'ACHIEVED');
    const totalFinishedGoals = goals.filter((g) => g.status === 'ACHIEVED' || g.status === 'MISSED');
    const goalAchievementRate =
      totalFinishedGoals.length > 0
        ? Math.round((achievedGoals.length / totalFinishedGoals.length) * 100)
        : activeGoals.length > 0
        ? 50
        : 100;

    // Data completeness
    const completenessFields = [
      linesOfCode > 0,
      complexity > 0,
      totalChurn > 0,
      hotspotCount >= 0,
      annualExposure > 0,
    ];
    const completenessRatio = completenessFields.filter(Boolean).length / completenessFields.length;

    return {
      repositoryFeatures: {
        commitFrequency: {
          name: 'Commit Frequency',
          value: commitFrequency,
          classification: 'OBSERVED',
          description: 'Observed commits per analysis cycle',
        },
        commitVelocity: {
          name: 'Commit Velocity',
          value: commitDiff,
          classification: 'DERIVED',
          description: 'Delta commits between recent analyses',
        },
        changeFrequency: {
          name: 'Change Frequency',
          value: Math.min(100, Math.round((commitFrequency / 10) * 100)),
          classification: 'DERIVED',
          description: 'Normalized modification cadence index (0-100)',
        },
        repositoryActivity: {
          name: 'Repository Activity Tier',
          value: commitDiff > 20 ? 'HIGH' : commitDiff > 5 ? 'MODERATE' : 'LOW',
          classification: 'DERIVED',
          description: 'Categorical activity level from recent git commits',
        },
      },
      codeFeatures: {
        linesOfCode: {
          name: 'Lines of Code',
          value: linesOfCode,
          classification: 'OBSERVED',
          description: 'Observed total lines of code in analyzed scope',
        },
        complexity: {
          name: 'Total Cyclomatic Complexity',
          value: complexity,
          classification: 'OBSERVED',
          description: 'Observed AST cyclomatic branch points',
        },
        averageComplexity: {
          name: 'Average Complexity Per Hotspot',
          value: hotspotCount > 0 ? Math.round((complexity / hotspotCount) * 10) / 10 : complexity,
          classification: 'DERIVED',
          description: 'Derived average complexity per tracked hotspot',
        },
        maxComplexity: {
          name: 'Maximum Complexity Node',
          value: Math.round(complexity * 0.4),
          classification: 'DERIVED',
          description: 'Derived peak complexity concentration',
        },
        nestingDepth: {
          name: 'Maximum Nesting Depth',
          value: maxNesting,
          classification: 'OBSERVED',
          description: 'Observed deepest control flow nesting',
        },
      },
      debtFeatures: {
        technicalDebtScore: {
          name: 'Technical Debt Score',
          value: debtScore,
          classification: 'DERIVED',
          description: 'Normalized composite debt score (0-100)',
        },
        hotspotCount: {
          name: 'Hotspots Count',
          value: hotspotCount,
          classification: 'DERIVED',
          description: 'Identified hotspot files meeting risk thresholds',
        },
        criticalHotspotCount: {
          name: 'Critical Hotspot Count',
          value: criticalHotspotCount,
          classification: 'DERIVED',
          description: 'High-churn, high-complexity critical hotspots',
        },
        highPriorityDebt: {
          name: 'High Priority Debt Items',
          value: highPriorityDebt,
          classification: 'DERIVED',
          description: 'Count of debt items classified Critical or High',
        },
        debtAgeDays: {
          name: 'Debt Age (Days)',
          value: avgDebtAgeDays,
          classification: 'DERIVED',
          description: 'Average days elapsed since first detection',
        },
        reopenedDebtCount: {
          name: 'Reopened Debt Count',
          value: reopenedItems.length,
          classification: 'OBSERVED',
          description: 'Tracked debt items reverted to reopened status',
        },
        resolvedDebtCount: {
          name: 'Resolved Debt Count',
          value: resolvedItems.length,
          classification: 'VERIFIED',
          description: 'Debt items marked as resolved or verified',
        },
        verificationSuccessRate: {
          name: 'Verification Success Rate (%)',
          value: verificationSuccessRate,
          classification: totalAttemptedVerification.length > 0 ? 'VERIFIED' : 'UNAVAILABLE',
          description: 'Percentage of resolved debt that passed post-refactor verification',
        },
      },
      gitFeatures: {
        totalChurn: {
          name: 'Total Churn (Lines Changed)',
          value: totalChurn,
          classification: 'OBSERVED',
          description: 'Observed lines added and deleted across commits',
        },
        fileChurnAverage: {
          name: 'Average File Churn',
          value: fileChurnAverage,
          classification: 'DERIVED',
          description: 'Average churn distributed across hotspots',
        },
        commitConcentration: {
          name: 'Commit Concentration Index',
          value: count > 0 ? Math.min(100, Math.round((totalChurn / (latestCommitCount || 1)) * 5)) : 0,
          classification: 'DERIVED',
          description: 'Derived metric of churn concentration per commit',
        },
        defectFixActivity: {
          name: 'Defect Fix Activity Count',
          value: defectFixActivity,
          classification: 'DERIVED',
          description: 'Heuristic defect-fix commit count from message patterns',
        },
      },
      financialFeatures: {
        annualExposure: {
          name: 'Modeled Annual Financial Exposure',
          value: annualExposure,
          classification: 'MODELED',
          description: 'Modeled annual engineering capacity friction cost',
        },
        maintenanceFriction: {
          name: 'Maintenance Friction Cost',
          value: maintenanceFriction,
          classification: 'MODELED',
          description: 'Modeled cognitive overhead navigating complex code',
        },
        defectBurden: {
          name: 'Defect/Fix Burden Cost',
          value: defectBurden,
          classification: 'MODELED',
          description: 'Modeled cost of recurring bug patches',
        },
        changeFriction: {
          name: 'Change Friction Cost',
          value: changeFriction,
          classification: 'MODELED',
          description: 'Modeled merge and regression friction in volatile files',
        },
        legacyRisk: {
          name: 'Legacy Staleness Risk Cost',
          value: legacyRisk,
          classification: 'MODELED',
          description: 'Modeled risk from dormant unmaintained modules',
        },
      },
      processFeatures: {
        resolutionVelocity: {
          name: 'Resolution Velocity',
          value: resolvedItems.length,
          classification: 'OBSERVED',
          description: 'Resolved debt items over tracking lifecycle',
        },
        verificationVelocity: {
          name: 'Verification Velocity',
          value: verifiedItems.length,
          classification: 'VERIFIED',
          description: 'Verified debt items validated by follow-up analysis',
        },
        goalAchievementRate: {
          name: 'Goal Achievement Rate (%)',
          value: goalAchievementRate,
          classification: 'DERIVED',
          description: 'Percentage of engineering goals completed successfully',
        },
        activeGoalCount: {
          name: 'Active Engineering Goals',
          value: activeGoals.length,
          classification: 'OBSERVED',
          description: 'Currently tracked active engineering goals',
        },
      },
      historySummary: {
        snapshotCount: {
          name: 'Historical Snapshots Count',
          value: count,
          classification: 'OBSERVED',
          description: 'Total sequential analysis snapshots available',
        },
        dataCompletenessRatio: {
          name: 'Data Completeness Ratio',
          value: Math.round(completenessRatio * 100),
          classification: 'DERIVED',
          description: 'Percentage of core telemetry signals populated',
        },
        windowSpanDays: {
          name: 'Telemetry Window Span (Days)',
          value: windowSpanDays,
          classification: 'DERIVED',
          description: 'Days between earliest and latest historical analysis',
        },
      },
    };
  }
}
