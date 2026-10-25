# Predictive Risk Model

## 1. Predictive Risk vs Priority Score

DebtLens maintains a fundamental separation between its Phase 3 Priority Score and its Phase 5 Predictive Risk Score:

- **Phase 3 Priority Score (Current Importance):** Answers *"How critical is this technical debt right now?"* based on current complexity, recent defect fixes, and existing maintenance friction.
- **Phase 5 Predictive Risk Score (Trajectory & Emergence):** Answers *"How likely is this technical debt or module to deteriorate into an expensive bottleneck in future cycles?"* based on momentum, churn volatility, complexity velocity, and resolution failure history.

---

## 2. Risk Score Formulation (0–100)

The Predictive Risk Score $R_{pred} \in [0, 100]$ is computed as a weighted composite of seven normalized factor scores:

$$R_{pred} = \text{clamp}\left( \sum_{i} w_i \cdot F_i + \text{Bonus}_{accel}, \ 0, \ 100 \right)$$

### Factor Weights and Definitions

| Factor ($F_i$) | Weight ($w_i$) | Description | Metric Classification |
|---|---|---|---|
| **Current Priority Risk** | $0.25$ | Base severity from current technical debt and complexity | `DERIVED` |
| **Complexity Momentum** | $0.20$ | Growth rate in AST cyclomatic complexity and nesting depth | `DERIVED` |
| **Churn Volatility** | $0.18$ | Frequency of modifications, commit churn, and code volatility | `OBSERVED` |
| **Defect Activity Growth** | $0.15$ | Recurrent bug patches and defect-fix commit occurrences | `OBSERVED` |
| **Hotspot Deterioration** | $0.10$ | Upward drift in module hotspot scores and file risk | `DERIVED` |
| **Resolution Failure History** | $0.07$ | Track record of failed verifications or reopened debt items | `VERIFIED` |
| **Financial Exposure Drift** | $0.05$ | Velocity of annual maintenance friction increase | `MODELED` |

---

## 3. Acceleration Detection & Penalty

When deterioration is accelerating across consecutive analysis cycles (e.g., Debt Score delta increasing from $+5 \to +8 \to +12$), a non-linear acceleration bonus is added:

$$\text{Bonus}_{accel} = \begin{cases} +10 & \text{if trend} = \text{ACCELERATING} \\ 0 & \text{otherwise} \end{cases}$$

This ensures that files rapidly spinning out of engineering control surface immediately in executive and sprint planning views.

---

## 4. Predictive Risk Tiers

Predictive Risk Scores map deterministically to standardized tiers:

| Tier | Score Range | Default Trend Association | Action Expectation |
|---|---|---|---|
| **`CRITICAL`** | $75 - 100$ | `ACCELERATING` / `WORSENING` | Immediate sprint allocation; refactor before next release |
| **`HIGH`** | $60 - 74$ | `WORSENING` / `STABLE` | Plan remediation in upcoming 1–2 sprints |
| **`MEDIUM`** | $40 - 59$ | `STABLE` | Monitor churn and complexity in PR checks |
| **`LOW`** | $1 - 39$ | `STABLE` / `IMPROVING` | Healthy codebase; no intervention required |
| **`STABLE`** | $0$ | `STABLE` | Inert or decaying code with negligible change |
| **`INSUFFICIENT_DATA`** | N/A | `INSUFFICIENT_DATA` | Fewer than 2 snapshots available |

---

## 5. Explainable Risk Drivers

Every risk score calculation returns an auditable set of drivers detailing feature name, observed value, normalized contribution, and direction:

```json
{
  "drivers": [
    { "factor": "Complexity Growth", "value": "+18%", "weight": 0.20, "contribution": 16.5, "direction": "UP" },
    { "factor": "Churn Velocity", "value": "+31%", "weight": 0.18, "contribution": 14.2, "direction": "UP" },
    { "factor": "Defect Commits", "value": "4 patches", "weight": 0.15, "contribution": 11.0, "direction": "UP" },
    { "factor": "Hotspot Drift", "value": "Worsening", "weight": 0.10, "contribution": 8.5, "direction": "UP" }
  ]
}
```
