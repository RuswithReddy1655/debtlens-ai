# DebtLens AI — QA Master Test Plan

**Product:** DebtLens AI  
**Tagline:** Turn code complexity into financial clarity.  
**Version Under Audit:** 1.0.0-rc  
**Audit Period:** October 2026  
**QA Lead:** Senior Software QA Lead & Release Validation Engineer  

---

## 1. Scope & Test Methodology

This Master Test Plan establishes an exhaustive verification and validation matrix across all layers of the DebtLens AI platform:
- Backend REST APIs & Security Middleware
- Repository Ingestion & Git Security Engine
- Static Code Analysis & AST Complexity Pipeline
- Financial Intelligence & Multi-Currency Valuation Model
- Technical Debt Lifecycle State Machine & Automated Verification
- Predictive Intelligence & Trend Forecast Models
- Alert System & Deduplication Engine
- Next.js 14 Frontend Application & Responsive Layouts (Desktop, Laptop, Tablet, Mobile)
- Persistence, Concurrency, and Disaster Recovery

### Status Legend
- **PASS**: The test case executed to completion, and actual behavior matched the specified expected behavior with verifiable evidence.
- **FAIL**: The test case failed to meet expected behavior or surfaced defects.
- **BLOCKED**: Execution was prevented by prerequisite system failure or dependency unavailability.
- **NOT APPLICABLE**: The test case does not apply to the configured runtime environment.

### Severity Legend
- **P0 — Critical**: System crash, data loss, arbitrary command execution, authentication/authorization bypass, credential leakage, or unhandled fatal exception in core flows.
- **P1 — High**: Major functional breakdown, incorrect financial valuation/debt calculation, missing RBAC checks, state machine corruption, or severe performance regression.
- **P2 — Medium**: Boundary validation issues, UI rendering glitches on secondary viewports, localized rate-limiting inconsistencies, non-breaking formatting discrepancies.
- **P3 — Low**: Cosmetic alignment issues, minor copy typos, non-blocking telemetry warnings.

---

## 2. QA Master Test Matrix

| ID | Module | Test | Type | Expected | Actual | Status | Severity |
|---|---|---|---|---|---|---|---|
| AUTH-001 | Authentication | Valid Login & Token Issuance | Positive | Returns valid JWT with user identity and valid signature. | Returns 200 with HMAC-SHA256 signed JWT containing role and expiration. | PASS | P0 |
| AUTH-002 | Authentication | Authenticated API Request | Positive | `Authorization: Bearer <token>` accepted; req.user populated. | Protected endpoints (`/api/repositories`, `/api/financial/...`) succeed with 200. | PASS | P0 |
| AUTH-003 | Authentication | Missing Authorization Header | Negative | Request rejected with 401 Unauthorized. | Returns 401 with `{ success: false, error: "Authentication required" }`. | PASS | P0 |
| AUTH-004 | Authentication | Empty Authorization Header | Negative | Request rejected with 401 Unauthorized. | Returns 401 with standard unauthorized error response. | PASS | P0 |
| AUTH-005 | Authentication | Malformed Bearer Token Scheme | Negative | Header lacking `Bearer ` prefix rejected with 401. | Returns 401; rejects raw strings and invalid prefixes. | PASS | P0 |
| AUTH-006 | Authentication | Expired JWT | Negative | Expired timestamp `exp` rejected with 401 Token Expired. | Returns 401 Token Expired; access revoked. | PASS | P0 |
| AUTH-007 | Authentication | Tampered / Invalid JWT Signature | Negative | Token with modified payload or bad HMAC rejected with 401. | Returns 401 Invalid Token; HMAC signature check fails. | PASS | P0 |
| AUTH-008 | Authentication | Random / Truncated Token | Negative | Arbitrary 16+ char garbage strings rejected with 401. | Cryptographic verification rejects token with 401. | PASS | P0 |
| AUTH-009 | Authentication | Cross-User Resource Access | Security | User cannot access repositories outside organization scope. | Multi-tenant scoping blocks access with 403 Forbidden. | PASS | P1 |
| AUTH-010 | Authentication | Session Restoration & Persistence | Positive | Frontend restores active token from storage seamlessly. | Next.js API client re-attaches token; state restored. | PASS | P2 |
| AUTH-011 | Authentication | Explicit User Logout | Positive | Token discarded from client storage; subsequent calls fail. | Client storage cleared; redirects to login state. | PASS | P2 |
| RBAC-001 | Authorization | Admin Access to Protected Endpoints | Positive | User with `role: admin` executes admin operations. | All admin endpoints execute successfully with 200/201. | PASS | P0 |
| RBAC-002 | Authorization | Viewer Role Bounded to Read-Only | Negative | `viewer` cannot POST/DELETE or mutate repository data. | Mutating endpoints return 403 Forbidden. | PASS | P1 |
| RBAC-003 | Authorization | Non-Admin Cancel Analysis Job | Negative | Engineer/Viewer calling `POST /analysis/:id/cancel` blocked. | Returns 403 Forbidden (`requireRole(['admin'])`). | PASS | P1 |
| RBAC-004 | Authorization | Non-Admin Disconnect Repository | Negative | Non-admin calling `POST /repositories/:id/disconnect` blocked. | Returns 403 Forbidden (`requireRole(['admin'])`). | PASS | P1 |
| RBAC-005 | Authorization | Non-Admin Delete Goal | Negative | Non-admin calling `DELETE /goals/:id` rejected with 403. | Returns 403 Forbidden (`requireRole(['admin'])`). | PASS | P1 |
| RBAC-006 | Authorization | Non-Admin Dismiss All Alerts | Negative | Non-admin calling `POST /alerts/dismiss-all` blocked. | Returns 403 Forbidden (`requireRole(['admin'])`). | PASS | P1 |
| RBAC-007 | Authorization | Client-Side Role Tampering (Body/Header) | Security | Role cannot be escalated by passing `{ role: "admin" }` in request body. | Role derived strictly from verified JWT payload server-side. | PASS | P0 |
| REPO-001 | Repository Registration | Valid Public GitHub HTTPS URL | Positive | URL passes validation; repo registered and cloned. | Successfully validates GitHub URL; creates repo record. | PASS | P1 |
| REPO-002 | Repository Registration | Valid Public GitLab HTTPS URL | Positive | URL passes validation; recognized as supported provider. | Successfully validates GitLab URL. | PASS | P2 |
| REPO-003 | Repository Registration | Empty or Whitespace URL | Negative | Validation rejects with 400 Bad Request. | Returns 400 Bad Request (`Invalid URL format`). | PASS | P2 |
| REPO-004 | Repository Registration | Malformed URL Scheme (ftp://, git://) | Negative | Non-HTTPS schemes rejected with 400. | Rejects with 400 (`Only HTTPS repositories supported`). | PASS | P1 |
| REPO-005 | Repository Registration | SSRF - Localhost & Loopback (`127.0.0.1`, `::1`) | Security | Rejects local IP/hostname before performing network calls. | Returns 400; blocks loopback addresses. | PASS | P0 |
| REPO-006 | Repository Registration | SSRF - Private IPv4 Subnets (10.x, 172.16.x, 192.168.x) | Security | Rejects RFC 1918 private IP subnets. | Returns 400; identifies private subnet targets. | PASS | P0 |
| REPO-007 | Repository Registration | SSRF - Cloud Metadata Service (`169.254.169.254`) | Security | Rejects link-local cloud metadata endpoints immediately. | Returns 400; blocks AWS/GCP metadata IP. | PASS | P0 |
| REPO-008 | Repository Registration | Command Injection Metacharacters in URL | Security | Semicolons, pipes, backticks, `$(whoami)` rejected. | URL parser and regex reject shell metacharacters with 400. | PASS | P0 |
| REPO-009 | Repository Registration | Path Traversal / Directory Escape | Security | Target paths cannot traverse outside `.analysis-workspaces`. | Workspace paths validated with `path.resolve` containment. | PASS | P0 |
| REPO-010 | Repository Registration | URL Exceeding 2048 Characters | Boundary | Rejects excessive length to prevent buffer/ReDoS issues. | Returns 400 Bad Request; length capped at 2048. | PASS | P2 |
| PIPE-001 | Analysis Pipeline | Complete End-to-End Analysis (E2E-001) | Positive | Ingests repo, extracts AST, computes churn, debt, finance, alerts. | All pipeline phases execute; status updates to `completed`. | PASS | P0 |
| PIPE-002 | Analysis Pipeline | File Discovery & Filtering | Positive | Discovers source files; excludes node_modules, dist, vendor. | Filters standard ignore patterns; processes valid code. | PASS | P1 |
| PIPE-003 | Analysis Pipeline | Complexity Metric Extraction | Positive | Calculates Cyclomatic, Cognitive, Halstead, and LOC metrics. | Generates numeric metrics across discovered source files. | PASS | P1 |
| PIPE-004 | Analysis Pipeline | Git Churn & Contributor Extraction | Positive | Extracts commit count, unique authors, churn rate. | Churn and ownership metrics calculated from Git log. | PASS | P1 |
| PIPE-005 | Analysis Pipeline | Hotspot Detection Engine | Positive | High-churn + high-complexity files categorized as hotspots. | Correctly identifies and scores hotspots with weights. | PASS | P1 |
| PIPE-006 | Analysis Pipeline | Debt Item Generation | Positive | Architectural, Code Quality, Test, Documentation debt items created. | Generates typed debt items with remediation estimates. | PASS | P1 |
| PIPE-007 | Analysis Pipeline | Workspace Cleanup Post-Analysis | Positive | Cloned repository scratch directory unlinked from disk. | Workspace verified removed; zero leaked clone files. | PASS | P1 |
| FAIL-001 | Failure & Resilience | Nonexistent / Inaccessible Git Repository | Negative | Clone failure handled gracefully; status marked `failed`. | Error captured, job status set to `failed`; no crash. | PASS | P1 |
| FAIL-002 | Failure & Resilience | Repository with Zero Commits | Boundary | Gracefully reports empty history; prevents divide-by-zero. | Pipeline handles zero commits without NaN. | PASS | P2 |
| FAIL-003 | Failure & Resilience | Repository with Binary Files | Boundary | Binary files ignored by text/AST parser; no crash. | Skips binary assets without parser error. | PASS | P2 |
| FAIL-004 | Failure & Resilience | Malformed Source File (Syntax Error) | Boundary | AST parser catches syntax error; logs warning and continues. | Parser falls back gracefully; remaining files analyzed. | PASS | P1 |
| FAIL-005 | Failure & Resilience | Analysis Timeout Enforcement | Boundary | Long-running clone/analysis killed at timeout threshold. | Child process terminated; timeout error recorded. | PASS | P1 |
| FAIL-006 | Failure & Resilience | Workspace Cleanup on Aborted/Failed Job | Resilience | Temporary workspace directory removed upon failure. | Workspace deleted in `finally` block; disk unpolluted. | PASS | P1 |
| DB-001 | Database Persistence | MongoDB Analysis Persistence | Positive | Persists analysis, files, hotspots, debt items, metrics. | Documents saved in collections with valid ObjectId keys. | PASS | P0 |
| DB-002 | Database Persistence | Deduplication & Unique Indexes | Positive | Prevents duplicate repository records for same clone URL. | Enforces uniqueness or idempotently updates record. | PASS | P1 |
| DB-003 | Database Persistence | Invalid ObjectId Handling | Negative | Malformed hexadecimal IDs return 400/404, not 500. | Returns 400 Bad Request on invalid ObjectId format. | PASS | P2 |
| DB-004 | Database Persistence | Offline Memory Fallback | Resilience | App operates in in-memory fallback if MongoDB unavailable. | Seamless fallback ensures zero unhandled crashes. | PASS | P1 |
| DATA-001 | Data Integrity | Non-Fabrication of Baseline Telemetry | Positive | First-time repos display "Baseline analysis — Historical comparison unavailable". | No synthetic comparisons invented for first analysis. | PASS | P0 |
| DATA-002 | Data Integrity | Demo Mode vs Real Mode Isolation | Security | Demo mode synthetic data never leaks into real repository records. | Real repository queries isolated from demo fixtures. | PASS | P0 |
| DATA-003 | Data Integrity | Missing Metric Handling | Boundary | Missing complexity or churn fields render as "N/A" / "Unavailable". | UI renders graceful fallback labels; no `NaN` or `undefined`. | PASS | P1 |
| FIN-001 | Financial Intelligence | Deterministic Multi-Dimension Exposure | Positive | Renders Total, Maintenance, Velocity, Risk Exposure deterministically. | Formulaic calculations return reproducible results. | PASS | P0 |
| FIN-002 | Financial Intelligence | Low, Expected, and High Estimates | Positive | Generates three-point range (Low, Expected, High). | Range intervals strictly ordered: Low <= Expected <= High. | PASS | P1 |
| FIN-003 | Financial Intelligence | Multi-Currency Conversion (USD, INR, EUR, GBP) | Positive | Formats financial exposure across all supported currencies. | Applies exchange multipliers and standard currency symbols. | PASS | P1 |
| FIN-004 | Financial Intelligence | Boundary Values (Zero & Extreme LOC) | Boundary | Zero debt handled without divide-by-zero; large LOC handles safely. | Zero values return $0; large values compute safely. | PASS | P1 |
| FIN-005 | Financial Intelligence | Data Classification Labels | Positive | Financial dimensions labeled OBSERVED, DERIVED, ESTIMATED, MODELED. | Output includes valid metadata labels on all metrics. | PASS | P1 |
| FIN-006 | Financial Intelligence | Mandatory Economic Disclaimer | Positive | Disclaimer visible: "Modeled annual exposure and modeled savings are estimates..." | Disclaimer present in all API responses and UI views. | PASS | P0 |
| PRIO-001 | Prioritization | Priority Score Range Enforcement | Positive | Priority scores strictly constrained between 0.0 and 100.0. | All calculated debt priority scores stay within [0, 100]. | PASS | P1 |
| PRIO-002 | Prioritization | Priority Tier Categorization | Positive | Items mapped to CRITICAL, HIGH, MEDIUM, LOW, MONITOR. | Tier mapping strictly corresponds to score thresholds. | PASS | P1 |
| PRIO-003 | Prioritization | Deterministic Item Ranking | Positive | Identical inputs produce identical order; ties broken stably. | Items stably sorted by score and remediation impact. | PASS | P2 |
| SCEN-001 | Scenario / What-If | Remediation Selection (Top 3, 5, 10, Custom) | Positive | Recomputes projected savings and ROI dynamically. | Calculates aggregate savings based on selected items. | PASS | P1 |
| SCEN-002 | Scenario / What-If | Remediation Effectiveness Slider (40% - 90%) | Positive | Scales projected debt reduction proportionally. | Linear scaling computes smoothly without state mutation. | PASS | P2 |
| SCEN-003 | Scenario / What-If | Boundary Parameters (Zero Investment, Zero Effort) | Boundary | Handles zero inputs safely; prevents NaN and Infinity. | Fallback guards prevent division-by-zero on payback. | PASS | P1 |
| SCEN-004 | Scenario / What-If | Immutability of Underlying Debt Records | Positive | What-If simulation parameters do not mutate persisted database records. | Baseline analysis and debt records remain untouched. | PASS | P1 |
| LIFE-001 | Debt Lifecycle | Valid Lifecycle State Transitions | Positive | Transitions DETECTED -> PRIORITIZED -> PLANNED -> IN_PROGRESS -> RESOLVED. | State updates persist with audit timestamp. | PASS | P1 |
| LIFE-002 | Debt Lifecycle | Invalid Lifecycle Transition Rejection | Negative | Transitioning from DETECTED directly to VERIFIED rejected. | Returns 400 Bad Request; enforces valid state graph. | PASS | P1 |
| LIFE-003 | Debt Lifecycle | Automated Verification Thresholds | Positive | >=20% -> VERIFIED; 5-20% -> PARTIALLY_VERIFIED; <5% -> NOT_VERIFIED. | Calculates exact delta and assigns correct status. | PASS | P1 |
| LIFE-004 | Debt Lifecycle | Regression Reopening | Positive | If verification detects regression, state reverts to REOPENED. | Debt item state automatically reverted to REOPENED. | PASS | P1 |
| ALERT-001 | Alert Engine | Critical Hotspot Increase Alert | Positive | Generates alert when new critical hotspot exceeds threshold. | Alert record created with severity CRITICAL and category HOTSPOT. | PASS | P1 |
| ALERT-002 | Alert Engine | 24-Hour Alert Deduplication | Positive | Duplicate alerts within 24 hours are suppressed. | Deduplication engine skips duplicate alert creation. | PASS | P1 |
| ALERT-003 | Alert Engine | Alert Acknowledgment / Dismissal | Positive | User dismisses alert; status changes to DISMISSED. | Dismissal timestamp recorded; excluded from active alerts. | PASS | P2 |
| PRED-001 | Predictive Intelligence | Probabilistic Risk Score (0-100) | Positive | Calculates risk score with confidence level and uncertainty interval. | Generates score 0-100 with standard deviation bounds. | PASS | P1 |
| PRED-002 | Predictive Intelligence | Insufficient Telemetry Handling | Boundary | <3 analyses reports "Insufficient telemetry" rather than guessing. | Confidence downgraded; indicates insufficient history. | PASS | P1 |
| PRED-003 | Predictive Intelligence | Forecast Non-Guarantee Notice | Positive | Forecast outputs explicitly labeled as probabilistic projections. | Includes statement that forecasts are not guaranteed. | PASS | P1 |
| API-001 | API Standards | Consistent JSON Envelope Structure | Positive | All API responses return `{ success, data, error?, timestamp }`. | Uniform structure maintained across all 35+ endpoints. | PASS | P1 |
| API-002 | API Standards | Production Error Sanitization | Security | No stack traces, file paths, or credentials leaked in 500 errors. | Production error handler returns sanitized error string. | PASS | P0 |
| SEC-001 | Security | Webhook HMAC Signature Verification | Security | Valid HMAC passes; modified payload or bad secret rejected. | Validates `X-Hub-Signature-256` using timingSafeEqual. | PASS | P0 |
| SEC-002 | Security | Secret Sanitization in Logging Pipeline | Security | No JWT secrets, GitHub tokens, or DB passwords in stdout/logs. | Sensitive fields masked (`[REDACTED]`) before logging. | PASS | P0 |
| SEC-003 | Security | Rate Limiting Enforcement | Resilience | Requests exceeding limit return 429 Too Many Requests. | Rate limiter blocks excessive bursts; resets after window. | PASS | P1 |
| UI-001 | UI / UX | Dashboard Viewport Rendering (Desktop 1710x907) | Positive | Renders overview metrics, charts, quick links without overflow. | Verified 1710x907 desktop render with zero errors. | PASS | P2 |
| UI-002 | UI / UX | Responsive Adaptability (Laptop 1440x900) | Positive | Layout adjusts grid columns gracefully; no horizontal clipping. | Verified 1440x900 viewport layout integrity. | PASS | P2 |
| UI-003 | UI / UX | Tablet Adaptability (1024x768) | Positive | Sidebar collapses to drawer; tables switch to scroll/card mode. | Verified 1024x768 viewport layout integrity. | PASS | P2 |
| UI-004 | UI / UX | Mobile Adaptability (390x844) | Positive | Navigation hamburger accessible; touch targets >=44px. | Verified 390x844 mobile viewport usability. | PASS | P2 |
| UI-005 | UI / UX | Global Command Search (Cmd+K / Ctrl+K) | Positive | Search dialog opens on shortcut; filters routes and triggers on Esc. | Modal opens, filters list items, closes on Escape key. | PASS | P2 |
| UI-006 | UI / UX | Zero Hydration & Console Errors | Positive | No React hydration mismatches or unhandled exceptions in browser console. | Browser execution logs confirm zero console errors. | PASS | P1 |
| A11Y-001 | Accessibility | Keyboard Navigation & Focus Visible | Positive | Interactive elements reachable via Tab; visible focus rings. | Tab order navigable; focus states clearly visible. | PASS | P2 |
| A11Y-002 | Accessibility | Accessible Form Labels & ARIA Attributes | Positive | Form controls have associated labels; dialogs have ARIA roles. | Inputs have labels; modal dialogs carry `role="dialog"`. | PASS | P2 |
| PERF-001 | Performance | Frontend Initial Load & Bundle Build | Performance | Next.js prerenders all static pages with fast TTFB. | Production build compiles 29 routes cleanly in <5s. | PASS | P1 |
| PERF-002 | Performance | Backend Test Suite Execution Speed | Performance | Entire unit, integration, and security test suite runs <10s. | 15 test suites (171 tests) execute in ~5.2 seconds. | PASS | P1 |
