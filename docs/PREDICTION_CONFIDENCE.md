# Prediction Confidence Model

## 1. Overview & Transparency Mandate

Prediction confidence measures the statistical reliability of generated forecasts. Under no circumstances does DebtLens present a prediction as highly reliable without sufficient historical telemetry and AST code coverage.

Confidence is evaluated by `PredictionConfidenceService` and categorized into:
- **`HIGH`** ($\ge 80\%$)
- **`MEDIUM`** ($60\% - 79\%$)
- **`LOW`** ($< 60\%$)
- **`INSUFFICIENT_DATA`** (Fewer than 2 snapshots)

---

## 2. Confidence Evaluation Factors

Confidence score $C \in [0, 100]$ is computed across seven dimensions:

| Dimension | Weight | Criteria |
|---|---|---|
| **Snapshot Depth** | $0.25$ | Number of historical analyses ($\ge 5$ snapshots required for full score) |
| **Trend Consistency** | $0.20$ | Monotonic direction of historical deltas without wild reversals |
| **Metric Stability** | $0.15$ | Low coefficient of variation ($\sigma / \mu$) in base measurements |
| **Data Completeness** | $0.15$ | Absence of missing metrics or zero-value placeholders |
| **Analysis Cadence** | $0.10$ | Regular interval between analysis runs (low timestamp jitter) |
| **AST Parse Coverage** | $0.10$ | Percentage of source files cleanly parsed into AST without syntax fallbacks |
| **Git Telemetry Quality** | $0.05$ | Multi-contributor activity with informative commit messages |

---

## 3. Threshold Configuration & Tier Mapping

```typescript
if (snapshotCount < 2) {
  return { level: 'INSUFFICIENT_DATA', score: 0 };
} else if (score >= 80 && snapshotCount >= 4) {
  return { level: 'HIGH', score };
} else if (score >= 60 && snapshotCount >= 2) {
  return { level: 'MEDIUM', score };
} else {
  return { level: 'LOW', score };
}
```

---

## 4. Range Generation (Uncertainty Intervals)

For all predicted numeric metrics, the confidence level directly governs the width of the uncertainty interval:

| Confidence Level | Low Bound | High Bound | Interval Spread |
|---|---|---|---|
| **`HIGH`** | $0.92 \times \hat{y}$ | $1.08 \times \hat{y}$ | $\pm 8\%$ |
| **`MEDIUM`** | $0.85 \times \hat{y}$ | $1.15 \times \hat{y}$ | $\pm 15\%$ |
| **`LOW`** | $0.75 \times \hat{y}$ | $1.30 \times \hat{y}$ | $\pm 25–30\%$ |
| **`INSUFFICIENT_DATA`** | $\hat{y}$ | $\hat{y}$ | N/A (Flagged as unavailable) |

This prevents engineering leaders from making budgeting decisions based on false precision.
