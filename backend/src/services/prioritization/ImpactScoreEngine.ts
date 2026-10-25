export interface EffortRange {
  lowHours: number;
  expectedHours: number;
  highHours: number;
  formattedRange: string;
}

export interface FileImpactAndEffort {
  filePath: string;
  language: string;
  estimatedFinancialImpact: number;
  estimatedRefactoringEffort: EffortRange;
  impactScoreNormalized: number; // 0 to 100
  effortScoreNormalized: number; // 0 to 100
  keyFactors: string[];
}

export class ImpactScoreEngine {
  /**
   * Estimates refactoring effort in engineering hours based on AST and size signals.
   */
  static estimateRefactoringEffort(
    codeLines: number,
    complexity: number,
    nestingDepth: number = 2
  ): EffortRange {
    // Formula: (LoC / 80) * (Complexity / 15) * (NestingDepth / 2) * baseline
    const baseHours = Math.max(
      4,
      Math.round((codeLines / 80) * (complexity / 15) * Math.max(1, nestingDepth / 2) * 8)
    );

    const lowHours = Math.max(2, Math.round(baseHours * 0.75));
    const expectedHours = baseHours;
    const highHours = Math.round(baseHours * 1.35);

    return {
      lowHours,
      expectedHours,
      highHours,
      formattedRange: `${lowHours}–${highHours} hrs`,
    };
  }

  /**
   * Computes normalized impact (0-100) and effort (0-100) for matrix plotting.
   */
  static evaluateFile(
    fileMetric: any,
    annualImpact: number,
    maxImpact: number,
    hourlyRate: number = 2000
  ): FileImpactAndEffort {
    const codeLines = fileMetric.codeLines ?? fileMetric.linesOfCode ?? 100;
    const complexity = fileMetric.cyclomaticComplexity ?? 5;
    const nestingDepth = fileMetric.nestingDepth ?? 2;

    const effort = this.estimateRefactoringEffort(codeLines, complexity, nestingDepth);

    // Normalize impact 0-100 relative to highest file impact in codebase
    const impactScoreNormalized = maxImpact > 0
      ? Math.min(100, Math.round((annualImpact / maxImpact) * 100))
      : 30;

    // Normalize effort 0-100 (assuming 80 hours as high upper bound for single file)
    const effortScoreNormalized = Math.min(100, Math.round((effort.expectedHours / 60) * 100));

    const keyFactors: string[] = [];
    if (complexity >= 15) keyFactors.push(`AST complexity ${complexity}`);
    if (codeLines >= 200) keyFactors.push(`${codeLines} lines of code`);
    if (nestingDepth >= 4) keyFactors.push(`nesting depth ${nestingDepth}`);
    if ((fileMetric.totalChurn ?? 0) >= 200) keyFactors.push(`churn ${fileMetric.totalChurn}`);

    return {
      filePath: fileMetric.filePath,
      language: fileMetric.language || 'TypeScript',
      estimatedFinancialImpact: annualImpact,
      estimatedRefactoringEffort: effort,
      impactScoreNormalized,
      effortScoreNormalized,
      keyFactors,
    };
  }
}
