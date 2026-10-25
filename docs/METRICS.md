# DebtLens AI — Technical Debt & Telemetry Metrics Reference

Every metric in DebtLens AI is explainable, traceable to concrete code inputs, and categorized by its factual nature:
- **`REAL`**: Deterministic measurements calculated directly from source code or Git history.
- **`HEURISTIC`**: Statistically grounded algorithmic inferences (e.g. commit message pattern matching).
- **`ESTIMATED`**: Financial and labor-hour models based on explicit engineering assumptions.
- **`UNAVAILABLE`**: Explicitly marked when language AST parser is not supported or history is insufficient.

---

## 1. Metrics Classification Table

| Metric | Category | Type | Formula / Method | Description |
| :--- | :--- | :--- | :--- | :--- |
| `linesOfCode` | Source Code | `REAL` | Total newline count (`\n`) | Complete physical lines in file. |
| `codeLines` | Source Code | `REAL` | Non-blank, non-comment lines | Executable statements and declarations. |
| `commentLines` | Source Code | `REAL` | Single-line (`//`, `#`) and multi-line (`/* */`) lines | Documented explanation lines. |
| `blankLines` | Source Code | `REAL` | Empty or whitespace-only lines | Visual line spacing. |
| `cyclomaticComplexity` | AST / Structure | `REAL` (TS/JS) / `HEURISTIC` (Other) | $1 + \sum(\text{branches, loops, switches, catches, ternary})$ | Linearly independent execution paths. |
| `nestingDepthMax` | AST / Structure | `REAL` | Maximum AST block depth | Deepest conditional or loop nest. |
| `functionCount` | AST / Structure | `REAL` | Function / method declarations | Number of callable procedures in file. |
| `classCount` | AST / Structure | `REAL` | Class / interface declarations | Object-oriented module boundaries. |
| `importCount` | AST / Structure | `REAL` | Import statements | Outward dependency connections. |
| `exportCount` | AST / Structure | `REAL` | Export statements | Public API surface of the module. |
| `commitCount` | Git History | `REAL` | Number of historical commits affecting file | Revision frequency. |
| `linesAdded` | Git History | `REAL` | Cumulative diff insertions | Total code additions over analyzed history. |
| `linesDeleted` | Git History | `REAL` | Cumulative diff deletions | Total code deletions over analyzed history. |
| `totalChurn` | Git History | `REAL` | $\text{linesAdded} + \text{linesDeleted}$ | Total volatility / code churn. |
| `changesPerMonth` | Git History | `REAL` | $\frac{\text{commitCount}}{\text{ageInMonths}}$ | Normalized revision velocity across repository lifespan. |
| `firstSeenAt` | Code Age | `REAL` | Timestamp of oldest commit modifying file | Inception date. |
| `lastModifiedAt` | Code Age | `REAL` | Timestamp of most recent commit modifying file | Last touch date. |
| `ageInDays` | Code Age | `REAL` | $\text{now} - \text{firstSeenAt}$ | Chronological age of the file. |
| `daysSinceLastChange` | Code Age | `REAL` | $\text{now} - \text{lastModifiedAt}$ | Dormancy duration in days. |
| `primaryContributor` | Ownership | `REAL` | Author with highest commit count for file | Dominant developer. |
| `contributorCount` | Ownership | `REAL` | Distinct commit authors modifying file | Developer participation breadth. |
| `ownershipPercentage` | Ownership | `REAL` | $\frac{\text{authorCommits}}{\text{totalFileCommits}} \times 100$ | Primary contributor change share. |
| `ownershipEntropy` | Ownership | `REAL` | $-\sum (p_i \log_2 p_i)$ normalized 0 to 1 | Shannon entropy representing knowledge diffusion. |
| `defectFixCommitCount` | Defect Signals | `HEURISTIC` | Commits matching regex `/(fix\|bug\|hotfix\|crash\|patch\|issue)/i` | Number of likely bug-fixing revisions. |
| `defectFixFrequency` | Defect Signals | `HEURISTIC` | $\frac{\text{defectFixCommitCount}}{\text{commitCount}}$ | Proportion of changes motivated by defects. |
| `isLegacy` | Legacy Decay | `HEURISTIC` | $\text{dormancy} > 6\,\text{mo} \land \text{complexity} > 15 \land \text{ownership} > 70\%$ | Dormant high-complexity code with abandoned knowledge. |
| `overallDebtScore` | Debt Engine | `REAL` | Composite weighted formula (0 - 100) | Multi-dimensional engineering risk score. |
| `hotspotScore` | Hotspot Engine | `REAL` | $0.5 \times \text{Complexity} + 0.5 \times \text{Churn}$ | High-change, high-complexity hotspot ranking. |
| `remediationCost` | Financial Engine | `ESTIMATED` | $\text{debtHours} \times \text{hourlyRate}$ | Estimated capital needed to refactor file. |
| `avoidableAnnualCost` | Financial Engine | `ESTIMATED` | $\sum (\text{dragHours}) \times \text{hourlyRate}$ | Modeled 12-month maintenance drag if unaddressed. |

---

## 2. Technical Debt Score Formula

The **DebtLens Composite Score** ($S \in [0, 100]$) integrates 5 risk dimensions:

$$S = 0.30 \cdot C_{\text{complexity}} + 0.25 \cdot C_{\text{churn}} + 0.20 \cdot C_{\text{defect}} + 0.15 \cdot C_{\text{ownership}} + 0.10 \cdot C_{\text{legacy}}$$

Where:
- **Complexity Component ($C_{\text{complexity}}$)**:
  $$0.5 \cdot \min(100, \frac{\text{Cyclomatic}}{40} \cdot 100) + 0.3 \cdot \min(100, \frac{\text{LoC}}{1000} \cdot 100) + 0.2 \cdot \min(100, \frac{\text{MaxNesting}}{6} \cdot 100)$$
- **Churn Component ($C_{\text{churn}}$)**:
  $$0.6 \cdot \min(100, \frac{\text{Commits}}{25} \cdot 100) + 0.4 \cdot \min(100, \frac{\text{ReworkCommits}}{10} \cdot 100)$$
- **Defect Component ($C_{\text{defect}}$)**:
  $$0.5 \cdot \min(100, \frac{\text{DefectCommits}}{8} \cdot 100) + 0.5 \cdot \min(100, \frac{\text{ReworkHours}}{30} \cdot 100)$$
- **Ownership Silo Component ($C_{\text{ownership}}$)**:
  $$0.6 \cdot \text{PrimaryOwnerPercentage} + 0.4 \cdot ((1 - \text{Entropy}) \cdot 100)$$
- **Legacy Decay Component ($C_{\text{legacy}}$)**:
  $$0.6 \cdot \min(100, \frac{\text{MonthsDormant}}{24} \cdot 100) + 0.4 \cdot \text{ComplexityFactor}$$

### Risk Severity Thresholds
- **Critical Risk**: $S \ge 75$
- **High Risk**: $50 \le S < 75$
- **Medium Risk**: $25 \le S < 50$
- **Low Risk**: $S < 25$

---

## 3. Hotspot Ranking Formula

A hotspot is code that is **both complex and frequently modified**:

$$\text{HotspotScore} = \text{ComplexityContribution} + \text{ChurnContribution} + \text{DefectActivityContribution}$$

Files are sorted descending by $\text{HotspotScore}$ and assigned Pareto ranks ($1 \dots N$).

---

## 4. Financial Modeling Formulas

All financial figures are presented with explicit assumptions and formula traces:

1. **Quadrant 1 — Remediation Investment**:
   $$\text{RemediationCost} = \sum \text{debtHours}_i \times \text{hourlyRate}$$
2. **Quadrant 2 — Historical Maintenance Rework**:
   $$\text{HistoricalReworkCost} = \sum \text{reworkHours}_i \times \text{hourlyRate}$$
3. **Quadrant 3 — Future Avoidable Cost (12-Month Drag)**:
   $$\text{AvoidableAnnualCost} = (\sum_{\text{critical}} 38\,\text{hrs} + \sum_{\text{high}} 18\,\text{hrs} + \sum_{\text{medium}} 6\,\text{hrs}) \times \text{hourlyRate}$$
4. **Quadrant 4 — Potential Refactoring Benefit**:
   $$\text{NetSavings} = (2 \times \text{AvoidableAnnualCost}) - \text{RemediationCost}$$
   $$\text{ROI Ratio} = \frac{\text{NetSavings}}{\text{RemediationCost}}$$
   $$\text{Payback Period (Months)} = \frac{\text{RemediationCost}}{\text{AvoidableAnnualCost}} \times 12$$

---

## 5. Phase 3 Decision Support & Prioritization Metrics

| Metric | Category | Type | Formula / Method | Description |
|---|---|---|---|---|
| `priorityScore` | Prioritization | `DERIVED` | $0.30 S_{\text{tech}} + 0.25 S_{\text{fin}} + 0.20 S_{\text{change}} + 0.15 S_{\text{defect}} + 0.10 S_{\text{conf}}$ | Normalized 0–100 multi-signal engineering priority score. |
| `priorityTier` | Prioritization | `DERIVED` | Score thresholds ($\ge 80$: CRITICAL, $\ge 65$: HIGH, $\ge 45$: MEDIUM, $\ge 25$: LOW, < 25: MONITOR) | Executive classification for sprint planning. |
| `matrixQuadrant` | Decision Matrix | `DERIVED` | Impact vs Effort ($X$: Refactoring Hours, $Y$: Annual Savings) | Categorization into QUICK WINS, STRATEGIC, OPPORTUNISTIC, or DEFER. |
| `maintenanceFriction` | Cost Drivers | `MODELED` | Hotspot count $\times$ maintenance hours $\times$ rate | Ongoing comprehension and reading friction. |
| `defectFixBurden` | Cost Drivers | `MODELED` | Defect commits $\times 6.0\,\text{hrs} \times \text{rate}$ | Heuristic maintenance burden from recurring patches. |
| `changeFriction` | Cost Drivers | `MODELED` | $(\text{TotalChurn} / 50) \times 1.25 \times \text{rate}$ | Sprint drag when editing volatile complex code. |
| `legacyRisk` | Cost Drivers | `MODELED` | Stagnant complex unowned files $\times 16\,\text{hrs} \times \text{rate}$ | Future risk from aging, abandoned code. |
| `potentialAnnualSavings` | Savings Engine | `MODELED` | $\text{TargetAnnualImpact} \times \text{RemediationEffectiveness}$ | Forecasted annual recovery at target effectiveness (e.g. 65%). |
| `twoYearNetSavings` | Savings Engine | `MODELED` | $(2 \times \text{PotentialAnnualSavings}) - \text{Investment}$ | 24-month net financial return on refactoring capital. |
| `roiPercentage` | ROI Calculator | `MODELED` | $\frac{\text{TwoYearNetSavings}}{\text{Investment}} \times 100$ | Modeled 2-year ROI percentage. |
| `paybackPeriodMonths` | ROI Calculator | `MODELED` | $\frac{\text{Investment}}{\text{AnnualSavings} / 12}$ | Time in months required to recoup sprint investment. |
| `confidence` | Data Quality | `DERIVED` | Evaluation of Git history density, AST coverage, defect signals, and assumptions | Assessment of estimate certainty (HIGH, MEDIUM, LOW, INSUFFICIENT DATA). |

---

## 6. Phase 4 Continuous Action, Verification & Lifecycle Metrics

### 6.1 Metric Classification System
DebtLens AI strictly categorizes every data point into one of six classes:

1. **OBSERVED**: Directly measured engineering telemetry from Git or AST.
   - Examples: `linesOfCode`, `commitCount`, `churn`, `cyclomaticComplexity`, `maxNestingDepth`, `commitSha`.
2. **DERIVED**: Deterministically calculated scores from observed data.
   - Examples: `technicalDebtScore`, `hotspotScore`, `priorityScore`, `goalProgressPercentage`, `deltaComplexity`.
3. **ESTIMATED**: Engineering work heuristics.
   - Examples: `estimatedRefactoringHours`, `maintenanceHours`.
4. **MODELED**: Economic and financial projections based on models and assumptions.
   - Examples: `totalAnnualExposure`, `modeledAnnualSavings`, `roiPercentage`, `paybackPeriodMonths`.
5. **VERIFIED**: Post-intervention telemetry confirming that code complexity or hotspot severity decreased.
   - Examples: `verifiedComplexityReduction`, `verifiedHotspotScoreDelta`, `verificationStatus: VERIFIED`.
6. **UNAVAILABLE / INSUFFICIENT DATA**: When telemetry is absent or insufficient to make a valid claim.

### 6.2 Phase 4 Specific Metrics

| Metric | Category | Type | Formula / Method | Description |
|---|---|---|---|---|
| `debtItemId` | Identity | `DERIVED` | $\text{SHA256}(\text{repoId} : \text{filePath} : \text{symbol} : \text{category})$ | Line-number-immune persistent identity. |
| `verificationStatus` | Verification | `DERIVED` / `VERIFIED` | $\Delta \text{Complexity} \ge 20\% \implies \text{VERIFIED}$; $\ge 5\% \implies \text{PARTIALLY}$; else $\text{NOT\_VERIFIED}$ | Automated evaluation of resolved debt. |
| `goalProgressPercentage` | Goals | `DERIVED` | $\frac{V_{\text{starting}} - V_{\text{current}}}{V_{\text{starting}} - V_{\text{target}}} \times 100\%$ (decreasing) | Clamped [0, 100]% progress toward target. |
| `snapshotDelta` | Trends | `DERIVED` | $V_{\text{current}} - V_{\text{previous}}$ | Point-in-time trajectory change. |
| `trendClassification` | Trends | `DERIVED` | $\Delta \text{DebtScore} \le -3 \implies \text{IMPROVING}$; $\ge +3 \implies \text{WORSENING}$; else $\text{STABLE}$ | Longitudinal repository health trend. |
| `realizedBusinessSavings` | Finance | `UNAVAILABLE` | Explicit enterprise ledger input required | Strictly NOT claimed without business payroll records. |

---

## 7. Phase 5 Predictive Engineering Intelligence Metrics

| Metric | Category | Type | Formula / Method | Description |
|---|---|---|---|---|
| `predictiveRiskScore` | Risk Scoring | `DERIVED` | Weighted composite ($0.25P + 0.20C_{mom} + 0.18Ch + 0.15D + 0.10H + 0.07F_{hist} + 0.05E + \text{Bonus}_{accel}$) | Forward-looking 0–100 risk score. |
| `riskTrend` | Trend Engine | `DERIVED` | Slope & acceleration detection across $\ge 2$ historical snapshots | `IMPROVING`, `STABLE`, `WORSENING`, `ACCELERATING`. |
| `predictedDebtScore` | Forecast Engine | `MODELED` | $\text{clamp}(S(t) + h \cdot \text{Slope} \cdot 0.92^h, 0, 100)$ | Projected debt score across 1, 3, or 6 cycles. |
| `forecastedExposure` | Financial Forecast | `MODELED` | Modeled annual exposure drift with 3-point uncertainty (`LOW`, `EXP`, `HIGH`) | Projected maintenance friction penalty. |
| `costOfDoingNothing` | Inaction Modeling | `MODELED` | $\text{Exposure}_{\text{Do Nothing}} - \text{Exposure}_{\text{Current}}$ | Modeled financial penalty of unmitigated debt. |
| `confidenceLevel` | Confidence Engine | `DERIVED` | 7-factor composite ($\ge 80\% \implies \text{HIGH}$; $\ge 60\% \implies \text{MED}$; else $\text{LOW}$) | Reliability indicator based on history depth. |
| `nextBestActionScore` | Recommendation | `DERIVED` | Weighted priority ($0.30P + 0.25R_{pred} + 0.20E_{fin} + 0.15\text{Effort}^{-1} + 0.10S_{hist}$) | Deterministic ranking for sprint planning. |
| `maePredictionError` | Prediction Audit | `VERIFIED` | $\frac{1}{N} \sum \|y_i - \hat{y}_i\|$ | Mean Absolute Error against actual subsequent analyses. |
| `rangeCoveragePercentage`| Prediction Audit | `VERIFIED` | $\frac{1}{N} \sum \mathbf{1}(y_i \in [\text{low}_i, \text{high}_i]) \times 100\%$ | Proportion of actual values falling within uncertainty interval. |
| `directionalAccuracyPercentage` | Prediction Audit | `VERIFIED` | $\frac{1}{N} \sum \mathbf{1}(\text{sgn}(\Delta y) = \text{sgn}(\Delta \hat{y})) \times 100\%$ | Proportion of forecasts predicting correct trajectory sign. |
| `overallAccuracyPercentage` | Prediction Audit | `VERIFIED` | $0.40 \cdot \text{Coverage} + 0.40 \cdot \text{Direction} + 0.20 \cdot \max(0, 100 - \text{MAPE})$ | Composite evaluated predictive accuracy. |

