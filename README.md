# DebtLens AI — Technical Debt Financial Intelligence & Predictive Engineering Platform

DebtLens AI is an enterprise-grade platform designed to translate software maintainability telemetry into quantifiable financial capital metrics, actionable engineering priorities, and forward-looking risk forecasts. It enables engineering leadership (CTOs, VPs of Engineering) to answer: **What technical debt exists, what does it cost, what should we prioritize, what action was taken, did it actually improve the code, WHAT IS LIKELY TO HAPPEN NEXT, and WHAT SHOULD ENGINEERING DO BEFORE THE PROBLEM BECOMES EXPENSIVE?**

**Phase 5 Complete**: **Predictive Engineering Intelligence & Risk Forecasting** is fully operational. DebtLens AI has evolved into a forward-looking predictive engineering loop:
```text
CONNECT → ANALYZE → IDENTIFY DEBT → ESTIMATE COST → PRIORITIZE → TAKE ACTION → RE-ANALYZE → VERIFY → MEASURE → FORECAST → RECOMMEND ↺
```
Key capabilities include:
- **Predictive Risk Score (0–100) & Tiers**: Momentum-based forward risk model distinguishing current importance from likelihood of future deterioration.
- **Multi-Horizon Forecasting**: Statistical projections across `NEXT_ANALYSIS`, `SHORT_TERM` (3 cycles), and `MEDIUM_TERM` (6 cycles) with momentum dampening.
- **Uncertainty Intervals (No False Precision)**: 3-point range modeling (`LOW`, `EXPECTED`, `HIGH`) for all forecasted metrics.
- **Cost of Doing Nothing Engine**: Quantification of modeled financial penalty if high-risk hotspots remain unaddressed.
- **What-If Scenario Simulation**: Counterfactual refactoring modeling (`DO_NOTHING`, `FIX_TOP_3`, `FIX_TOP_5`, `FIX_TOP_10`, `REDUCE_COMPLEXITY`, `REDUCE_CHURN`).
- **Next Best Action Recommendation Engine**: Weighted action scoring with explainable drivers, estimated effort ranges, and user feedback loops.
- **Engineering Capacity Planning**: Knapsack work package optimizer allocating sprint developer hours against candidate debt items.
- **Goal Completion Trajectory Forecasting**: Pacing and probability projections for active engineering goals (`ON_TRACK`, `AT_RISK`, `LIKELY_TO_MISS`).
- **Predictive Early-Warning Alerting**: Imminent risk escalation alerts with 24-hour duplicate suppression.
- **Closed-Loop Forecast Accuracy Evaluation**: Automated verification against actual subsequent analyses measuring MAE, MAPE, directional accuracy, and range coverage.
- **Enterprise UI Experience**: 4 dedicated predictive pages (`/predictive-intelligence`, `/predictive-hotspots`, `/forecasts`, `/forecast-scenarios`) plus enriched portfolio and executive report outlooks.

---

## 1. Mandatory Technology Stack

This project strictly adheres to the organization's standardized architecture:

| Tier | Mandatory Technology |
|---|---|
| **Frontend** | **Next.js 16** (App Router), **React 19**, **TypeScript** (Strict), **Tailwind CSS**, **Recharts**, **Lucide Icons** |
| **Backend** | **Node.js**, **Express.js** REST API (`/api`), **TypeScript** (Strict), **Zod**, **Helmet**, **Rate Limiter**, **simple-git**, **TypeScript Compiler AST** |
| **Database** | **MongoDB** & **Mongoose ODM** (17 domain collections, compound indexes, zero credential storage, offline caching) |
| **Architecture** | **Next.js $\longrightarrow$ Express.js $\longrightarrow$ MongoDB** |

> [!NOTE]
> Prohibited technologies (FastAPI, Flask, Django, PostgreSQL, Firebase, Supabase, or Python primary backends) are strictly excluded in compliance with organizational stack governance.

---

## 2. Continuous Engineering Loop Architecture (Phase 4)

```text
GitHub / Git Repository
        ↓
[RepositoryConnection]       (OAuth 2.0 / Webhook ingestion with HMAC-SHA256 validation)
        ↓
[ScheduledAnalysisService]   (Manual, Daily, Weekly, After-Push cadence with debouncing)
        ↓
[AnalysisOrchestrator]       (Cloning, AST complexity, Git churn, cost drivers, scoring)
        ↓
[AnalysisSnapshotService]    (Immutable point-in-time snapshot with exposure and metrics)
        ↓
[DebtIdentityService]        (Deterministic SHA-256 hash immune to line-number shifts)
        ↓
[DebtLifecycleService]       (Enforces legal state transitions: DETECTED → ... → VERIFIED)
        ↓
[VerificationEngine]         (Before/After evaluation: ≥20% VERIFIED, <5% REOPENED)
        ↓
[GoalProgressEngine]         (Evaluates active goals with zero-span safety)
        ↓
[AlertEngine]                (Fires threshold alerts with 24h deduplication)
        ↓
[AuditTrailService]          (Records chronological engineering action log)
        ↓
[Next.js App Router UI]      (Continuous health dashboard, debt tracker, goals, alerts)
```

---

## 3. Project Structure

```
technical-debt-intelligence/
├── frontend/
│   ├── app/                      # Next.js App Router (25 routes)
│   │   ├── dashboard/            # Executive KPI & Continuous Debt Health scorecard
│   │   ├── connections/          # Phase 4: GitHub connect, repos, and scheduling
│   │   ├── debt/                 # Phase 4: Central debt lifecycle tracker & filters
│   │   │   └── [id]/             # Phase 4: Detailed debt item view, work links, traces
│   │   ├── goals/                # Phase 4: Engineering Goals dashboard & progress
│   │   ├── verification/         # Phase 4: Before/After verification center
│   │   ├── alerts/               # Phase 4: Engineering alerts with severity badges
│   │   ├── activity/             # Phase 4: Immutable audit timeline
│   │   ├── financial-intelligence/ # 4 quadrants, ranges, cost drivers, calculation traces
│   │   ├── priorities/           # Multi-signal ranking & Impact vs Effort Matrix
│   │   ├── scenarios/            # Interactive What-If simulator & ROI comparison
│   │   ├── portfolio/            # Cross-repository organizational portfolio view
│   │   ├── executive-report/     # Executive briefing & Markdown brief export
│   │   ├── heatmap/              # Multi-dimensional code heatmap
│   │   ├── hotspots/             # Prioritized hotspot table with churn & defects
│   │   ├── repository/           # Repository registry, real Git ingestion & live progress UI
│   │   ├── files/                # Full telemetry file explorer with deep AST metrics
│   │   ├── cost/                 # 4-quadrant financial engine & formula traces
│   │   ├── recommendations/      # Actionable proposals & ROI
│   │   ├── trends/               # Historical trajectory charts from real commits
│   │   ├── settings/             # Financial assumptions configuration
│   │   ├── layout.tsx            # Root shell, Navbar, Sidebar, dynamic DemoBanner
│   │   └── page.tsx              # Home / Architecture landing
│   ├── components/               # Reusable UI components
│   ├── hooks/                    # Global React state context (useRepository)
│   ├── services/                 # Typed API client with Phase 4 endpoints
│   └── types/                    # Domain data contracts (extended with Phase 4 types)
│
├── backend/
│   ├── src/
│   │   ├── config/               # Environment & MongoDB Mongoose connection
│   │   ├── controllers/          # phase4Controller, repositoryController, analysisController
│   │   ├── models/               # 17 Mongoose schemas (RepositoryConnection, DebtItem, Goal, Alert, etc.)
│   │   ├── routes/               # Express routers (phase4Routes, repositoryRoutes, analysisRoutes)
│   │   ├── services/
│   │   │   ├── github/           # GitHubIntegrationService
│   │   │   ├── scheduler/        # ScheduledAnalysisService
│   │   │   ├── lifecycle/        # DebtIdentityService, DebtLifecycleService
│   │   │   ├── verification/     # VerificationEngine
│   │   │   ├── goals/            # GoalProgressEngine
│   │   │   ├── alerts/           # AlertEngine
│   │   │   ├── audit/            # AuditTrailService
│   │   │   ├── financial/        # FinancialIntelligenceEngine, CostDriverEngine, ScenarioEngine
│   │   │   ├── prioritization/   # DebtPrioritizationEngine, PortfolioPrioritizationService
│   │   │   ├── reporting/        # AnalysisSnapshotService, SnapshotComparisonEngine, ExecutiveReportService
│   │   │   └── analysis/         # AnalysisOrchestrator
│   └── tests/                    # 83 passing Jest tests across 11 suites (100% pass)
│       ├── phase4DebtLifecycle.test.ts # Identity resilience, state machine, verification, goals
│       ├── phase4EndToEnd.test.ts      # Complete deterministic closed loop E2E test
│       ├── security.test.ts            # SSRF, path traversal, injection safeguards
│       ├── realIngestionPipeline.test.ts # End-to-end clone & orchestrator execution
│       ├── phase3FinancialIntelligence.test.ts # 4 quadrants, ranges, cost drivers
│       └── phase3Prioritization.test.ts # Multi-signal scoring, matrix, presets
│
├── docs/                         # Architecture, Financial Model, API specifications
│   ├── GITHUB_INTEGRATION.md     # Phase 4: OAuth 2.0, Webhook HMAC, and Work Linking
│   ├── CONTINUOUS_ANALYSIS.md    # Phase 4: Job scheduling, frequencies, and lifecycle
│   ├── DEBT_LIFECYCLE.md         # Phase 4: Deterministic identity & state machine
│   ├── VERIFICATION_MODEL.md     # Phase 4: Before/After verification math & thresholds
│   ├── ENGINEERING_GOALS.md      # Phase 4: Goal metrics, progress formulas, and states
│   ├── ALERTING.md               # Phase 4: Thresholds, severities, and deduplication
│   ├── FINANCIAL_INTELLIGENCE.md # Four quadrants, cost drivers, Modeled vs Verified savings
│   ├── PRIORITIZATION_MODEL.md   # Multi-signal scoring, tiers, Impact vs Effort Matrix
│   ├── SCENARIO_MODEL.md         # What-If simulation, effectiveness, payback horizon
│   ├── ANALYSIS_ENGINE.md        # Orchestration pipeline, stages, and lifecycle
│   ├── GIT_SECURITY.md           # SSRF protection, command injection, limits
│   ├── METRICS.md                # Metric classifications, formulas, and inputs
│   ├── ARCHITECTURE.md           # High-level system architecture
│   ├── API_SPECIFICATION.md      # Complete REST API specifications
│   └── FINANCIAL_MODEL.md        # 4-quadrant engineering economics model
├── PHASE-4-DELIVERY-REPORT.md    # Comprehensive Phase 4 delivery report
└── package.json                  # Root monorepo manager
```

---

## 4. Quick Start & Execution Commands

### Prerequisites
- Node.js $\ge$ 18 (Tested on Node v25.4.0)
- npm $\ge$ 10
- Git $\ge$ 2.30
- MongoDB $\ge$ 6.0 (Optional — resilient in-memory fallback enabled for offline testing)

### Step 1: Environment Setup
Copy `.env.example` into `.env`:
```bash
cp .env.example .env
```

Key environment configuration variables:
```bash
PORT=5001
MONGODB_URI=mongodb://localhost:27017/debtsense
MAX_REPOSITORY_SIZE_MB=250
MAX_ANALYSIS_FILES=2000
MAX_FILE_SIZE_MB=2
MAX_COMMITS=500
GIT_CLONE_TIMEOUT_MS=60000
ANALYSIS_TIMEOUT_MS=120000
ANALYSIS_WORKSPACE_DIR=./.analysis-workspaces
```

### Step 2: Install Dependencies
From the repository root:
```bash
# Backend dependencies
cd backend && npm install && cd ..

# Frontend dependencies
cd frontend && npm install && cd ..
```

### Step 3: Run the Backend & Frontend

#### Terminal 1 — Start Express.js Backend:
```bash
npm run dev:backend
# API available at: http://localhost:5001/api
# Health check: http://localhost:5001/api/health
```

#### Terminal 2 — Start Next.js Frontend:
```bash
npm run dev:frontend
# Web application available at: http://localhost:3000
```

---

## 5. REST API Endpoints (`/api`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Health diagnostic (MongoDB status, demoMode flag, uptime) | No |
| `GET` | `/api/repositories` | List tracked repositories (with `isDemo` flags) | No |
| `POST` | `/api/repositories` | Register new git repository (SSRF-protected) | Yes |
| `GET` | `/api/repositories/:id` | Get single repository metadata | No |
| `POST` | `/api/analyses` | Trigger real analysis job or demo snapshot | Yes |
| `GET` | `/api/analyses/:id` | Analysis snapshot summary & health score | No |
| `GET` | `/api/analyses/:id/status` | Real-time analysis lifecycle status & progress | No |
| `POST` | `/api/analyses/:id/cancel` | Cancel in-progress analysis job safely | Yes |
| `GET` | `/api/analyses/:id/hotspots` | Prioritized list of code hotspots | No |
| `GET` | `/api/analyses/:id/metrics` | File-level AST complexity, churn, and coverage metrics | No |
| `GET` | `/api/analyses/:id/trends` | Historical telemetry trajectory from actual commits | No |
| `GET` | `/api/analyses/:id/recommendations` | Actionable refactoring proposals with ROI | No |
| `GET` | `/api/analyses/:id/cost` | 4-quadrant financial valuation with formula traces | No |

---

## 6. Testing & Quality Validation

Run backend unit and integration test suite:
```bash
npm run test:backend
```
**Test Results**: **120 passing tests** across 14 test suites (100% pass):
- `tests/predictiveEngine.test.ts` (14 unit tests: features, trends, risk, confidence, forecast, recommendations, what-if, capacity, alerts, evaluation)
- `tests/predictiveApi.test.ts` (10 API integration tests: assessments, forecast, hotspots, risks, scenarios, capacity, accuracy)
- `tests/predictiveE2E.test.ts` (1 closed-loop end-to-end predictive lifecycle test)
- `tests/phase4DebtLifecycle.test.ts` (12 tests: identity, state machine, verification, goals, alerts)
- `tests/phase4EndToEnd.test.ts` (1 continuous closed-loop continuous intelligence test)
- `tests/phase3FinancialIntelligence.test.ts` (7 tests: cost model, drivers, savings, ROI)
- `tests/phase3Prioritization.test.ts` (5 tests: prioritization engine, scenarios, portfolio, reports)
- `tests/security.test.ts` (13 tests: SSRF, localhost, IPv6, AWS/GCP metadata, injection, path traversal, expired token rejection, malformed token rejection, production auth enforcement, role guards, HMAC-SHA256 webhook validation, secret exposure prevention)
- `tests/analyzers.test.ts` (8 tests: AST parsing, complexity, Git history diffs, churn, defects, legacy)
- `tests/realIngestionPipeline.test.ts` (2 tests: end-to-end clone & orchestrator execution)
- `tests/analysisApi.test.ts` (7 tests: progress polling, real metrics endpoints, cancellation)
- `tests/api.test.ts` (12 tests: health, repositories, analyses, hotspots, trends, cost)
- `tests/financialEngine.test.ts` (7 tests: 4-quadrant formula verification and rate sensitivity)
- `tests/realWorkflow.test.ts` (1 test: multi-step workflow simulation)

Run linting across all packages:
```bash
npm run lint
```

Build production artifacts:
```bash
npm run build:backend
npm run build:frontend
```

---

## 7. Health Check Diagnostics

DebtLens provides root-level and API-level health check diagnostics:
- `GET /health`
- `GET /api/health`

**Safe Response Payload:**
```json
{
  "success": true,
  "status": "healthy",
  "service": "DebtLens AI Intelligence Core",
  "version": "1.0.0",
  "demoMode": true,
  "api": "healthy",
  "database": {
    "isConnected": true,
    "status": "connected"
  },
  "uptime": 3600
}
```
In production (`NODE_ENV=production`), internal database hostnames, connection strings, credentials, and memory heaps are strictly hidden to prevent information disclosure.

---

## 8. Real vs Demo Mode Transparency

DebtLens AI strictly distinguishes synthetic demo benchmarks from real Git repository intelligence:
- **DEMO DATA**: When viewing demo repositories (e.g. `repo-demo-fintech-01`), the top banner displays an amber badge clearly marked `DEMO DATA — SYNTHETIC BENCHMARK`.
- **REAL REPOSITORY ANALYSIS**: When analyzing an ingested Git repository, the top banner updates to an emerald badge marked `REAL REPOSITORY ANALYSIS — ACTIVE TELEMETRY`.
- **No Metric Fabrication**: If a metric cannot be calculated from repository history or AST parsing, it is marked as `N/A`, `Insufficient data`, or `UNSUPPORTED`. No random or synthetic numbers are substituted into real repository results.

---

## 9. Financial Model & Savings Disclaimer

> [!IMPORTANT]
> **Modeled Annual Exposure and Realized Savings Disclaimer**:
> Modeled annual exposure and savings are financial estimates derived from engineering telemetry and assumptions. They are not accounting ledger losses or realized savings unless independently verified with external business data. All formulas provide transparent, formula-traceable bounds for strategic prioritization, not GAAP or financial accounting statements.

