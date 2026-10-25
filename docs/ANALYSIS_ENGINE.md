# DebtLens AI — Real Repository Ingestion & Analysis Engine

This document outlines the architecture, pipeline stages, execution flow, and orchestration lifecycle of the real Git repository ingestion engine introduced in **Phase 2**.

---

## 1. High-Level Engine Architecture

The DebtLens AI Analysis Engine operates as an asynchronous, staged pipeline designed for bounded memory usage, command injection prevention, and explainable multi-dimensional technical debt quantification.

```
+----------------------------------------------------------------------------+
|                         DEBTLENS AI INGESTION ENGINE                       |
+----------------------------------------------------------------------------+
                                      |
                      [User Enters Git HTTPS URL]
                                      v
                        RepositorySecurityService
                (SSRF / Protocol / Host / Injection Guards)
                                      |
                                      v
                          Repository Registration
                         (MongoDB / Offline Store)
                                      |
                                      v
                         AnalysisOrchestrator
                       (Async Worker Lifecycle)
                                      |
     +--------------------------------+--------------------------------+
     |                                                                 |
     v                                                                 v
[STAGE 1: CLONING]                                            [STAGE 2: METADATA]
RepositoryCloneService                                    RepositoryMetadataService
- simpleGit isolated clone                                - HEAD commit SHA, branch
- Timeout & storage limits                                - Contributors, dates
- .analysis-workspaces/analysis-{id}
     |                                                                 |
     +--------------------------------+--------------------------------+
                                      |
                                      v
                          [STAGE 3: GIT HISTORY]
                          RealGitHistoryAnalyzer
          - Commit log pagination & author attribution
          - Total churn: linesAdded + linesDeleted
          - Normalized change frequency (changes/month)
          - Code age: firstSeen, lastModified, dormancy
          - Heuristic defect-fix detection (fix, bug, crash, patch)
          - Shannon entropy ownership concentration
                                      |
                                      v
                          [STAGE 4: SOURCE ANALYSIS]
                           RealSourceCodeAnalyzer
          - Recursive discovery with exclusions (.git, node_modules, binaries)
          - Language detection & support classification
          - TypeScript/JavaScript AST parsing (ts.createSourceFile)
          - Cyclomatic & Cognitive complexity
          - Maximum control-flow nesting depth
          - Lines of code breakdown (code, comments, blanks)
          - Function, class, import, export extraction
                                      |
                                      v
                          [STAGE 5: RISK & SCORING]
              +-----------------------+-----------------------+
              |                       |                       |
              v                       v                       v
     RealLegacyAnalyzer      TechnicalDebtEngine        HotspotAnalyzer
     - Code decay            - Composite weighted       - Churn x Complexity
     - Abandoned code        - Explainable score        - Pareto prioritization
              |                       |                       |
              +-----------------------+-----------------------+
                                      |
                                      v
                          [STAGE 6: VALUE & PROPOSALS]
              +-----------------------+-----------------------+
              |                                               |
              v                                               v
    FinancialCostEngine                             RecommendationEngine
    - 4-quadrant valuation                          - ROI-ranked action proposals
    - Formula traceability                          - Target hotspots & effort
              |                                               |
              +-----------------------+-----------------------+
                                      |
                                      v
                         [STAGE 7: PERSISTENCE & CLEANUP]
         - MongoDB schema persistence (Analysis, FileMetric, Hotspot, etc.)
         - In-memory telemetry cache for real-time responsiveness
         - RepositoryCleanupService: safe workspace removal
                                      |
                                      v
                         [STAGE 8: DASHBOARD & API]
         - Real-time polling via GET /api/analyses/:id/status
         - Interactive Next.js Heatmap, Hotspots & Cost pages
```

---

## 2. Analysis Lifecycle States

Every repository analysis transitions through strict lifecycle states:

| Lifecycle State | Progress | Description |
| :--- | :--- | :--- |
| `QUEUED` | 5% | Analysis job created, URL validated, queued for workspace allocation. |
| `CLONING` | 15% | Secure git clone executing in isolated `.analysis-workspaces/analysis-{id}`. |
| `ANALYZING` | 40% | Git commit logs parsed, churn computed, AST generated, complexity measured. |
| `CALCULATING` | 75% | Hotspot ranking, debt scoring, financial modeling, and ROI proposals. |
| `PERSISTING` | 92% | Persisting telemetry documents into MongoDB and in-memory query cache. |
| `COMPLETED` | 100% | Pipeline finished successfully. Workspace cleaned up. |
| `FAILED` | 100% | Unhandled pipeline exception. Workspace cleaned up. Error sanitized. |
| `CANCELLED` | 100% | Analysis safely stopped upon user request. Workspace cleaned up. |

---

## 3. Asynchronous Execution & Real-Time Polling

1. **Job Dispatch**: When a user clicks **Analyze Repository**, `POST /api/analyses` responds immediately (`HTTP 202 Accepted`) with an initial job token (`{ id, status: 'queued', progress: 5 }`).
2. **Background Execution**: `AnalysisOrchestrator.runAnalysis()` coordinates all analyzers in the background, updating live progress and stages in the job registry.
3. **Frontend Polling**: The frontend polls `GET /api/analyses/:id/status` at 1.2-second intervals, displaying:
   - Animated progress bar
   - Current stage description
   - Counters for files discovered, files analyzed, and commits analyzed
   - Elapsed time counter
4. **Cancellation**: Users can abort analysis at any stage via `POST /api/analyses/:id/cancel`. Cancellation tokens stop execution between stages and trigger immediate workspace deletion.

---

## 4. Workspace Management & Storage Isolation

To prevent disk bloat, permission collisions, and code leakage:
- Cloned code is stored exclusively in `.analysis-workspaces/analysis-{analysisId}`.
- Workspaces are outside the source tree and ignored by `.gitignore`.
- After analysis (or upon failure/cancellation), `RepositoryCleanupService.cleanupWorkspace()` recursively unlocks files and deletes the workspace.
- Cloned source files are never committed, leaked to third parties, or retained permanently.
