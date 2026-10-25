# Predictive Engineering Intelligence Overview

## 1. Executive Summary

DebtLens AI Phase 5 transforms historical code analysis and Git telemetry into **Predictive Engineering Intelligence**. Rather than solely diagnosing existing technical debt, DebtLens forecasts debt trajectory, models financial exposure drift, detects risk acceleration, and recommends actionable preventative remediation before high-churn hotspots become catastrophic or cost-prohibitive.

```text
CONNECT → ANALYZE → IDENTIFY DEBT → ESTIMATE COST → PRIORITIZE → TAKE ACTION → RE-ANALYZE → VERIFY → MEASURE → FORECAST → RECOMMEND ↺
```

---

## 2. Core Principles & Non-Goals

1. **Telemetry Grounded:** Predictions are deterministically calculated from real Git telemetry, AST syntax metrics, snapshot trajectories, churn velocity, and verified debt history.
2. **No Black-Box ML / Hallucinations:** Predictive assessments do not rely on opaque generative chatbots or unexplainable models. All scoring weights, slopes, and drivers are auditable.
3. **No Autonomous Code Modification:** The platform provides decision intelligence (`PREDICT`, `EXPLAIN`, `RECOMMEND`, `PLAN`), not automated PR generation, commits, or code mutations.
4. **Confidence-Aware & Transparent Uncertainty:** Predictions explicitly distinguish between observed data, derived trends, estimated effort, and modeled financial exposure, presenting ranges instead of false precision.

---

## 3. Data Classification System

Every feature and output is categorized according to DebtLens data governance:

| Classification | Definition | Examples |
|---|---|---|
| **`OBSERVED`** | Directly measured from Git or filesystem AST. | Commit counts, line diffs, file churn, complexity tokens, analysis timestamps. |
| **`DERIVED`** | Mathematically computed from observed signals. | Cyclomatic complexity, historical slope, churn growth %, risk tiers, acceleration. |
| **`ESTIMATED`** | Engineering effort heuristics. | Remediation hours, refactoring investment ranges. |
| **`MODELED`** | Financial and predictive scenarios based on calibrated economic assumptions. | Forecasted annual exposure drift, Cost of Doing Nothing, scenario savings. |
| **`VERIFIED`** | Empirically confirmed through subsequent repository analyses. | Verification success rate, prediction evaluation, forecast accuracy. |
| **`UNAVAILABLE`** | Insufficient telemetry or missing historical snapshots. | Metrics with 0–1 snapshots. |

---

## 4. Minimum Data Requirements

Reliability of predictions scales with historical depth. DebtLens enforces explicit thresholds:

- **0–1 historical snapshots:** `INSUFFICIENT_DATA` — Trend calculations unavailable; confidence flagged as `INSUFFICIENT_DATA`.
- **2 historical snapshots:** `TREND_AVAILABLE` — Two-point delta available; confidence flagged as `LOW`.
- **3–4 historical snapshots:** `FORECAST_AVAILABLE` — Multi-point linear regression and acceleration detection available; confidence flagged as `MEDIUM`.
- **5+ historical snapshots:** `FULL_PREDICTIVE_HORIZON` — Long-term trend analysis, volatility dampening, and multi-horizon forecasts; confidence potentially `HIGH`.

---

## 5. Forecast Horizons

DebtLens models three distinct forward-looking horizons:

1. **`NEXT_ANALYSIS`**: Immediate projection for the subsequent repository scan.
2. **`SHORT_TERM`**: Multi-cycle outlook spanning approximately 3 analysis cycles.
3. **`MEDIUM_TERM`**: Broader outlook spanning approximately 6 analysis cycles.

> **Note:** Predictions represent analysis cycles rather than fixed calendar dates to accommodate variable commit cadences.
