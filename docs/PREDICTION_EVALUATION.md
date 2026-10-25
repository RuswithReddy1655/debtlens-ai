# Prediction Evaluation & Accuracy Verification

## 1. The Closed-Loop Verification Mandate

A predictive platform is only credible if it measures whether its past predictions were actually accurate.

In DebtLens AI Phase 5, whenever a new repository analysis completes, the system automatically triggers a retrospective evaluation:

```text
PREDICTION (Cycle t-1)
       ↓
ACTUAL ANALYSIS (Cycle t)
       ↓
ERROR CALCULATION & RANGE COVERAGE
       ↓
DIRECTIONAL ACCURACY EVALUATION
       ↓
ACCURACY METRICS DATABASE
       ↓
AUDITABLE EVALUATION RECORD
```

---

## 2. Evaluation Record Model (`PredictionEvaluation`)

Each historical prediction is audited against actual outcomes:

```typescript
export interface MetricEvaluation {
  metricName: string;
  predictedValue: number;
  predictedRange: { low: number; high: number };
  actualValue: number;
  absoluteError: number;
  percentageError: number;
  withinRange: boolean;
  directionPredicted: 'INCREASING' | 'DECREASING' | 'STABLE';
  directionActual: 'INCREASING' | 'DECREASING' | 'STABLE';
  directionalMatch: boolean;
}
```

---

## 3. Accuracy Metrics Formulation

To avoid statistical distortion from tiny integers (e.g. 1 vs 2 critical hotspots), DebtLens computes robust composite metrics:

### 1. Mean Absolute Error (MAE)
$$\text{MAE} = \frac{1}{N} \sum_{i=1}^N |y_i - \hat{y}_i|$$

### 2. Range Coverage
$$\text{Coverage} = \frac{\sum_{i=1}^N \mathbf{1}(y_i \in [\text{low}_i, \text{high}_i])}{N} \times 100\%$$

### 3. Directional Accuracy
$$\text{Directional Accuracy} = \frac{\sum_{i=1}^N \mathbf{1}(\text{sgn}(\Delta y_i) = \text{sgn}(\Delta \hat{y}_i))}{N} \times 100\%$$

### 4. Overall Forecast Accuracy %
A balanced composite metric:

$$\text{Accuracy}_{\text{overall}} = 0.40 \cdot \text{Coverage} + 0.40 \cdot \text{Directional Accuracy} + 0.20 \cdot \max(0, 100 - \text{MAPE}_{bounded})$$

---

## 4. Minimum Evaluation Sample Size

DebtLens does not display misleading accuracy statistics on insufficient data:
- **$< 3$ evaluated forecasts:** Flagged as `INSUFFICIENT_DATA`.
- **$3 - 9$ evaluated forecasts:** Flagged as `LOW_SAMPLE_SIZE` with preliminary indicator.
- **$\ge 10$ evaluated forecasts:** Full statistical tracking with high credibility.

---

## 5. Self-Improving Architecture (Phase 5 Foundation)

Phase 5 establishes the measurement foundation without introducing uncontrolled autonomous model mutation:

1. **Deterministic Evaluation:** Stores auditable differences between prediction and reality.
2. **Model Version Tagging:** Connects accuracy performance directly to `modelVersion` (e.g. `predictive-risk-v1`).
3. **Audit Trail:** Allows engineering teams to inspect prediction traces and verify why past forecasts succeeded or diverged.
