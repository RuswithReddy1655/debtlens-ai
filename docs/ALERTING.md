# Engineering Alerting System — DebtLens AI (Phase 4)

## 1. Overview
The **Engineering Alerting System** provides real-time notifications when critical technical debt thresholds are violated or regression occurs. To prevent notification fatigue, the engine enforces strict threshold triggers and 24-hour duplicate suppression.

---

## 2. Alert Types & Severities

| Alert Type | Severity | Condition / Trigger |
|:---|:---|:---|
| `CRITICAL_HOTSPOT_INCREASED` | `CRITICAL` | Number of critical hotspots increased in latest snapshot |
| `DEBT_SCORE_INCREASED` | `HIGH` | Technical debt score worsened by $\ge 3$ points |
| `FINANCIAL_EXPOSURE_INCREASED` | `HIGH` | Modeled annual exposure increased in latest analysis |
| `NEW_CRITICAL_DEBT` | `CRITICAL` | A newly detected file enters the top 5% hotspot score |
| `DEBT_REOPENED` | `MEDIUM` | A resolved debt item failed automated verification ($<5\%$ improvement) |
| `GOAL_AT_RISK` | `HIGH` | $<30\%$ of deadline remains but progress is $<50\%$ |
| `GOAL_ACHIEVED` | `LOW` | Progress reaches $100\%$ |
| `ANALYSIS_FAILED` | `CRITICAL` | Repository analysis failed due to clone or parse error |
| `CONNECTION_EXPIRED` | `HIGH` | GitHub OAuth token revoked or expired |

---

## 3. Duplicate Suppression & Lifecycle
- **24-Hour Deduplication**: The system will not generate duplicate alerts for the same repository and alert type within 24 hours unless the severity escalates.
- **Statuses**:
  - `UNREAD`: Newly generated alert visible in top notification badges.
  - `READ`: Acknowledged by user.
  - `RESOLVED`: Underlying condition addressed (e.g., hotspots reduced or goal achieved).
  - `DISMISSED`: Dismissed manually by engineer or lead.
