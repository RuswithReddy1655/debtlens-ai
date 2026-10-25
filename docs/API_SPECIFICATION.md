# DebtLens AI — REST API Specification (Phase 1 & Phase 2)

Base Endpoint: `http://localhost:5001/api`

---

## Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Service and database status | No |
| `GET` | `/api/repositories` | List tracked repositories (with `isDemo` flags) | No |
| `POST` | `/api/repositories` | Register new repository (SSRF-protected) | Yes |
| `GET` | `/api/repositories/:id` | Get repository metadata | No |
| `POST` | `/api/analyses` | Trigger real analysis job or demo snapshot | Yes |
| `GET` | `/api/analyses/:id` | Analysis snapshot summary & health metrics | No |
| `GET` | `/api/analyses/:id/status` | Real-time analysis status & progress polling | No |
| `POST` | `/api/analyses/:id/cancel` | Cancel in-progress analysis job safely | Yes |
| `GET` | `/api/analyses/:id/hotspots` | Prioritized list of code hotspots | No |
| `GET` | `/api/analyses/:id/metrics` | File-level telemetry, AST complexity & churn | No |
| `GET` | `/api/analyses/:id/trends` | Historical telemetry timeline | No |
| `GET` | `/api/analyses/:id/recommendations` | ROI-prioritized refactoring proposals | No |
| `GET` | `/api/analyses/:id/cost` | 4-quadrant financial valuation & traces | No |

---

## Detailed Endpoint Schemas

### 1. Health Check
`GET /api/health`
**Response (200 OK):**
```json
{
  "success": true,
  "status": "healthy",
  "service": "DebtLens AI Intelligence Core",
  "version": "2.0.0",
  "demoMode": true,
  "database": {
    "isConnected": true,
    "status": "connected"
  }
}
```

### 2. Register Repository
`POST /api/repositories`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "name": "payment-orchestrator",
  "url": "https://github.com/enterprise-payments/payment-orchestrator.git",
  "defaultBranch": "main",
  "description": "Multi-rail payment authorization router"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Repository registered successfully.",
  "isDemoSource": false,
  "data": {
    "_id": "67b93a1f8e4b1029c9103fa2",
    "name": "payment-orchestrator",
    "owner": "enterprise-payments",
    "url": "https://github.com/enterprise-payments/payment-orchestrator.git",
    "isDemo": false,
    "status": "idle"
  }
}
```

### 3. Trigger Repository Analysis
`POST /api/analyses`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "repositoryId": "67b93a1f8e4b1029c9103fa2",
  "branch": "main"
}
```
**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Repository analysis job created and queued.",
  "isDemoSource": false,
  "data": {
    "analysisId": "67b93a1f8e4b1029c9103fa3",
    "repositoryId": "67b93a1f8e4b1029c9103fa2",
    "status": "QUEUED",
    "progress": 0,
    "currentStage": "Job queued for analysis",
    "createdAt": "2026-10-24T14:30:00.000Z"
  }
}
```

### 4. Poll Analysis Status
`GET /api/analyses/:id/status`
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "analysisId": "67b93a1f8e4b1029c9103fa3",
    "status": "ANALYZING",
    "progress": 50,
    "currentStage": "Analyzing source files (AST & complexity)",
    "startedAt": "2026-10-24T14:30:05.000Z",
    "completedAt": null,
    "error": null,
    "commitSha": "f8a91b2c",
    "filesDiscovered": 45,
    "filesAnalyzed": 22,
    "commitsAnalyzed": 150
  }
}
```

### 5. Cancel In-Progress Analysis
`POST /api/analyses/:id/cancel`
**Headers:** `Authorization: Bearer <token>`
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Analysis cancelled successfully."
}
```

### 6. File Metrics Telemetry
`GET /api/analyses/:id/metrics`
**Response (200 OK):**
```json
{
  "success": true,
  "analysisId": "67b93a1f8e4b1029c9103fa3",
  "count": 1,
  "isDemoSource": false,
  "data": [
    {
      "filePath": "src/services/paymentProcessor.ts",
      "language": "TypeScript",
      "linesOfCode": 320,
      "codeLines": 250,
      "commentLines": 40,
      "blankLines": 30,
      "cyclomaticComplexity": 24,
      "cognitiveComplexity": 19,
      "totalChurn": 1450,
      "changeCount": 38,
      "defectFixCommitCount": 12,
      "defectFixFrequency": 0.315,
      "ownershipPercentage": 0.68,
      "primaryContributor": "Alice Engineer",
      "contributorCount": 4,
      "debtScore": 86.4,
      "hotspotScore": 91.2,
      "analysisStatus": "COMPLETED"
    }
  ]
}
```

### 7. Financial Cost Breakdown
`GET /api/analyses/:id/cost?hourlyRate=110`
**Query Parameters:**
- `hourlyRate` (optional, integer): Override fully loaded engineering hourly rate (default 95).
**Response (200 OK):**
```json
{
  "success": true,
  "analysisId": "67b93a1f8e4b1029c9103fa3",
  "isDemoSource": false,
  "data": {
    "currency": "USD",
    "hourlyRate": 110,
    "estimatedRemediationInvestment": {
      "totalHours": 1240,
      "totalCost": 136400,
      "trace": {
        "formula": "RemediationCost = totalRemediationHours * engineeringHourlyRate",
        "result": 136400
      }
    },
    "historicalMaintenanceReworkBurden": {
      "totalCost": 89300
    },
    "estimatedFutureAvoidableCost": {
      "projectedAnnualCost": 68400
    },
    "potentialRefactoringBenefit": {
      "netSavings": 46900,
      "roiRatio": 4.28,
      "paybackMonths": 5.6
    },
    "disclaimer": "Model-based financial estimates are predictive indicators based on engineering economics heuristics..."
  }
}
```

---

## Phase 3: Financial Intelligence & Decision Support Endpoints

### 8. Financial Intelligence & Audit Traces
`GET /api/analyses/:id/financial-intelligence?currency=INR&hourlyRate=2000`

**Response (200 OK):**
```json
{
  "success": true,
  "isDemoSource": false,
  "data": {
    "analysisId": "67b93a1f8e4b1029c9103fa3",
    "repositoryId": "67b93a1f8e4b1029c9103fa2",
    "currency": "INR",
    "currencySymbol": "₹",
    "hourlyRate": 2000,
    "modelVersion": "Financial Model v1.0",
    "confidence": "HIGH",
    "summary": {
      "totalAnnualExposure": 1026000,
      "annualExposureRange": { "low": 872100, "expected": 1026000, "high": 1179900, "formatted": "₹8.7L – ₹11.8L" },
      "formattedAnnualExposure": "₹8.7L – ₹11.8L",
      "remediationInvestment": 320000,
      "investmentRange": { "low": 240000, "expected": 320000, "high": 432000, "formatted": "₹2.4L – ₹4.3L" },
      "formattedInvestment": "₹2.4L – ₹4.3L",
      "potentialAnnualSavings": 666900,
      "savingsRange": { "low": 566865, "expected": 666900, "high": 766935, "formatted": "₹5.7L – ₹7.7L" },
      "formattedSavings": "₹5.7L – ₹7.7L",
      "twoYearNetBenefit": 1013800,
      "roiPercentage": 317,
      "paybackPeriodMonths": 5.8
    },
    "fourQuadrants": { ... },
    "costDrivers": { ... },
    "traces": [ ... ],
    "disclaimer": "Financial estimates are model-based management indicators..."
  }
}
```

### 9. Multi-Signal Debt Prioritization
`GET /api/analyses/:id/priorities?currency=INR`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "analysisId": "67b93a1f8e4b1029c9103fa3",
    "totalItemsPrioritized": 14,
    "currency": "INR",
    "quadrantDistribution": {
      "quickWinsCount": 4,
      "strategicCount": 3,
      "opportunisticCount": 5,
      "deferCount": 2
    },
    "priorities": [
      {
        "rank": 1,
        "filePath": "src/services/paymentProcessor.ts",
        "priorityTier": "CRITICAL",
        "matrixQuadrant": "QUICK WINS",
        "priorityScore": 92,
        "estimatedFinancialImpact": 480000,
        "formattedFinancialImpact": "₹4.1L – ₹5.5L",
        "estimatedRefactoringEffort": {
          "lowHours": 12,
          "expectedHours": 16,
          "highHours": 22,
          "formattedRange": "12–22 hrs"
        },
        "suggestedAction": "Extract payment gateway subclasses and decouple validation.",
        "reason": "Top priority hotspot combining high AST complexity, aggressive churn, and recurring defect-fix commits."
      }
    ]
  }
}
```

### 10. Run What-If Scenario
`POST /api/analyses/:id/scenarios`

**Request Body:**
```json
{
  "scenarioName": "Sprint 42 Refactoring",
  "selectedFilePaths": [
    "src/services/paymentProcessor.ts",
    "src/controllers/orderController.ts"
  ],
  "hourlyRate": 2000,
  "remediationEffectiveness": 0.65,
  "effortMultiplier": 1.0
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "scenarioName": "Sprint 42 Refactoring",
    "selectedFilesCount": 2,
    "currency": "INR",
    "estimatedRefactoringHours": 28,
    "refactoringInvestment": 56000,
    "investmentRange": { "low": 42000, "expected": 56000, "high": 75600, "formatted": "₹42.0k – ₹75.6k" },
    "potentialAnnualSavings": 312000,
    "savingsRange": { "low": 265200, "expected": 312000, "high": 358800, "formatted": "₹2.7L – ₹3.6L" },
    "roiPercentage": 1014,
    "paybackPeriodMonths": 2.2,
    "projectedDebtScoreReduction": 18,
    "isViable": true,
    "explanation": "High viability: payback expected in 2.2 months."
  }
}
```

### 11. Presets Scenario Comparison Matrix
`GET /api/analyses/:id/scenarios/presets?currency=INR`

Compares Scenario A (Top 5 Quick Wins), Scenario B (Top 10 High-Impact), and Scenario C (Comprehensive Remediation) side-by-side.

### 12. Cross-Repository Portfolio View
`GET /api/portfolio?currency=INR`

Aggregates debt exposure, top risk services, and potential savings across all connected organization repositories.

### 13. Historical Debt Reduction Tracking
`POST /api/analyses/:id/compare`

**Request Body:**
```json
{
  "targetAnalysisId": "67b93a1f8e4b1029c9103fb9",
  "currency": "INR"
}
```
Calculates debt score reduction, hotspot reduction, churn delta, and modeled annual cost reduction between two analyses.

---

## Phase 4: Action, Continuous Intelligence & Verified Debt Reduction Endpoints

### 14. GitHub Authentication & Repositories
- `GET /api/github/connect` — Returns OAuth authorization URL and CSRF state nonce.
- `GET /api/github/callback?code=...&state=...` — Handles GitHub OAuth callback and token exchange.
- `GET /api/github/repositories` — Lists accessible repositories for the authenticated GitHub user.

### 15. Repository Connections & Continuous Scheduling
- `GET /api/connections` — Lists connected repositories with sync status and schedule.
- `POST /api/connections` — Connects a repository to continuous intelligence.
  - Body: `{ "repositoryName": "org/repo", "owner": "org", "defaultBranch": "main", "analysisFrequency": "DAILY" }`
- `POST /api/connections/:id/schedule` — Updates continuous analysis frequency (`MANUAL`, `DAILY`, `WEEKLY`, `AFTER_PUSH`, `AFTER_MERGE`).
- `POST /api/connections/:id/analyze` — Triggers an immediate asynchronous background analysis.
- `POST /api/connections/:id/disconnect` — Disconnects repository and halts active timers.

### 16. Analysis Snapshots & Historical Comparison
- `GET /api/repositories/:id/snapshots` — Chronological point-in-time analysis snapshots with complexity, churn, hotspots, and financial exposure.
- `GET /api/repositories/:id/comparison?previousAnalysisId=...&currentAnalysisId=...` — Granular delta comparisons with percent improvements and classification (`INCREASED`, `REDUCED`, `UNCHANGED`).

### 17. Technical Debt Lifecycle & Action Tracking
- `GET /api/debt?repositoryId=...&status=...&priority=...` — Filtered list of persistent technical debt items.
- `GET /api/debt/:id` — Detailed debt item view including calculation traces, baseline metrics, work links, and verification status.
- `PATCH /api/debt/:id/status` — State machine transition (`DETECTED` $\rightarrow$ `PRIORITIZED` $\rightarrow$ `PLANNED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED` $\rightarrow$ `VERIFIED`).
  - Body: `{ "status": "RESOLVED", "notes": "Refactored method" }`
- `PATCH /api/debt/:id/assignment` — Assign engineer and set target completion date.
  - Body: `{ "assignedTo": "alice@company.com", "targetDate": "2026-11-15" }`
- `POST /api/debt/:id/link` — Attach external Git artifacts (`commitSha`, `pullRequestUrl`, `branch`).
- `POST /api/debt/:id/verify` — Manually trigger verification check against an analysis snapshot.

### 18. Engineering Goals Management
- `GET /api/goals?repositoryId=...` — Retrieves active, achieved, missed, and paused engineering goals.
- `POST /api/goals` — Creates a new goal with metric target and starting baseline.
  - Body: `{ "repositoryId": "...", "title": "Reduce Critical Hotspots", "metric": "CRITICAL_HOTSPOTS", "startingValue": 14, "targetValue": 5, "unit": "hotspots", "targetDate": "2026-12-31" }`
- `GET /api/goals/:id` — Detailed goal progress and historical trajectory.
- `PATCH /api/goals/:id` — Update target value, status, or deadline.

### 19. Engineering Alerts
- `GET /api/alerts?repositoryId=...&status=UNREAD` — Retrieves prioritized alerts.
- `PATCH /api/alerts/:id` — Update alert status (`READ`, `DISMISSED`, `RESOLVED`).
- `POST /api/alerts/dismiss-all` — Mark all alerts as dismissed.

### 20. Audit Trail
- `GET /api/activity?repositoryId=...&limit=50` — Chronological immutable audit trail of engineering actions, lifecycle transitions, and analysis results.

### 21. Webhook Ingestion
- `POST /api/webhooks/github` — Processes GitHub `push` and `pull_request` events with HMAC-SHA256 signature validation via header `X-Hub-Signature-256`.

---

## Phase 5: Predictive Engineering Intelligence & Risk Forecasting Endpoints

### 22. Predictive Assessments & Horizon Forecasts
- `GET /api/predictive/repositories/:id?horizon=NEXT_ANALYSIS` — Retrieves latest cached or computed predictive assessment for the repository, including risk score, risk trend, confidence, financial drift, and top actions.
- `GET /api/predictive/repositories/:id/forecast?horizon=NEXT_ANALYSIS|SHORT_TERM|MEDIUM_TERM` — Returns multi-horizon forecast across technical debt score, financial exposure, and critical hotspots with uncertainty intervals (`LOW`, `EXPECTED`, `HIGH`).
- `GET /api/predictive/assessments/:id` — Fetches a specific historical predictive assessment by ID.
- `GET /api/predictive/assessments/:id/trace` — Inspects the complete calculation trace, input snapshot IDs, raw feature values, and normalized factor contributions.
- `POST /api/predictive/repositories/:id/refresh` — Forces a recalculation of predictive telemetry and clears memory caches.

### 23. Predictive Hotspots & File Risk Trajectory
- `GET /api/predictive/repositories/:id/hotspots?horizon=NEXT_ANALYSIS` — Ranked list of code hotspots forecasted to escalate in severity, complete with primary drivers, complexity momentum, and churn volatility.
- `GET /api/predictive/repositories/:id/risks` — File-level predictive risk matrix prioritizing files exhibiting high current risk combined with rapid deterioration.

### 24. Financial Exposure Forecast & Cost of Doing Nothing
- `GET /api/predictive/repositories/:id/exposure?horizon=SHORT_TERM` — Compares current annual maintenance friction against projected exposure, returning the modeled Cost of Doing Nothing and 3-point uncertainty ranges.

### 25. What-If Simulation & Capacity Planning
- `POST /api/predictive/scenarios` — Simulates counterfactual remediation programs (`DO_NOTHING`, `FIX_TOP_3`, `FIX_TOP_5`, `FIX_TOP_10`, `REDUCE_COMPLEXITY`, `REDUCE_CHURN`).
  - Body: `{ "repositoryId": "...", "analysisId": "..." }`
- `POST /api/predictive/capacity-planning` — Evaluates sprint developer capacity against candidate predictive debt items and outputs an optimized risk-reduction work package.
  - Body: `{ "repositoryId": "...", "availableCapacityHours": 80 }`

### 26. Next Best Action & Feedback
- `GET /api/predictive/repositories/:id/recommendations` — Prioritizes actionable next steps with estimated effort ranges, expected outcomes, and explainable driver breakdowns.
- `POST /api/predictive/recommendations/:id/feedback` — Submits user feedback (`HELPFUL`, `NOT_HELPFUL`, `NOT_APPLICABLE`).
  - Body: `{ "feedback": "HELPFUL", "notes": "Aligned with sprint plan" }`

### 27. Goal Forecasting & Prediction Accuracy Evaluation
- `GET /api/predictive/repositories/:id/goals` — Projects completion trajectories for all active engineering goals (`ON_TRACK`, `AT_RISK`, `LIKELY_TO_MISS`).
- `GET /api/predictive/repositories/:id/accuracy` — Evaluates retrospective forecast accuracy against subsequent actual analyses, reporting MAE, MAPE, directional accuracy, range coverage, and total sample count.

