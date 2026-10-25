# Predictive Alerting & Early Warning System

## 1. Overview

DebtLens AI Phase 5 extends the Phase 4 Alert Engine with early-warning predictive signals. Instead of only notifying teams after debt thresholds have been breached, the platform warns engineering leads when code trajectory indicates imminent risk escalation.

---

## 2. Predictive Alert Types

| Alert Type | Severity | Trigger Condition |
|---|---|---|
| **`PREDICTED_CRITICAL_HOTSPOT`** | `CRITICAL` | Module predicted to escalate to `CRITICAL` tier within next 1–3 cycles. |
| **`ACCELERATING_DEBT`** | `HIGH` | Technical debt score deterioration rate ($\Delta$) increasing over consecutive cycles. |
| **`FORECASTED_EXPOSURE_INCREASE`** | `MEDIUM` / `HIGH` | Modeled annual exposure projected to increase by $\ge 15\%$ over 3 cycles. |
| **`GOAL_AT_RISK`** | `MEDIUM` | Current velocity indicates projected shortfall ($\ge 10\%$) against target reduction goal. |
| **`PREDICTED_GOAL_MISS`** | `HIGH` | Extrapolated trajectory indicates active engineering goal will be missed by deadline. |
| **`RISK_ESCALATION`** | `CRITICAL` | File transitioning from `MEDIUM` or `HIGH` to `CRITICAL` predictive risk tier. |

---

## 3. Duplicate Suppression & Noise Prevention

To avoid developer fatigue and alert spam:
- **24-Hour Cooldown:** Identical alerts for the same file, metric, and alert type are suppressed for 24 hours unless severity escalates.
- **Deduplication Key:** Hash composed of `repositoryId:alertType:targetIdentifier`.
- **Severity Escalation Bypass:** If a previously reported `HIGH` alert escalates to `CRITICAL`, suppression is bypassed immediately.

---

## 4. Alert Payload Example

```json
{
  "type": "PREDICTED_CRITICAL_HOTSPOT",
  "severity": "CRITICAL",
  "title": "Predictive Hotspot Alert: PaymentService.ts",
  "message": "PaymentService.ts is projected to escalate from HIGH to CRITICAL risk within the next analysis cycle.",
  "metadata": {
    "filePath": "src/payment/PaymentService.ts",
    "currentRisk": "HIGH",
    "predictedRisk": "CRITICAL",
    "riskTrend": "ACCELERATING",
    "confidence": "HIGH",
    "primaryDrivers": ["Complexity +18%", "Churn +31%", "Repeated defect commits"],
    "recommendedAction": "Decompose monolithic payment workflow within the next sprint."
  }
}
```
