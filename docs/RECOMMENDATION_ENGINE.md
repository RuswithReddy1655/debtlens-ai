# Predictive Recommendation Engine & Next Best Action

## 1. Overview

The `PredictiveRecommendationService` answers the critical engineering leadership question:

> **"What should engineering fix next, why, and what is the expected outcome before the problem becomes expensive?"**

Rather than treating all technical debt equally, the engine ranks candidate refactoring items by their **Predictive Action Score**.

---

## 2. Predictive Action Score Formulation

$$\text{ActionScore} = 0.30 \cdot P_{current} + 0.25 \cdot R_{pred} + 0.20 \cdot E_{financial} + 0.15 \cdot \frac{1}{\text{Effort}_{norm}} + 0.10 \cdot S_{historical}$$

Where:
- $P_{current}$: Phase 3 current priority score $[0, 100]$
- $R_{pred}$: Phase 5 predictive risk score $[0, 100]$
- $E_{financial}$: Modeled annual financial exposure percentage $[0, 100]$
- $\text{Effort}_{norm}$: Normalized remediation hours (lower effort produces higher score)
- $S_{historical}$: Historical verification success rate on similar modules

---

## 3. Next Best Action Structure

Each top-ranked recommendation includes concrete decision-support details:

```typescript
export interface NextBestAction {
  id: string;
  filePath: string;
  actionTitle: string;
  recommendationText: string;
  rationale: string[];
  urgency: 'IMMEDIATE' | 'NEXT_SPRINT' | 'STRATEGIC_BACKLOG';
  estimatedEffortHours: { low: number; expected: number; high: number };
  modeledFinancialExposure: number;
  expectedOutcome: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  drivers: Array<{
    factor: string;
    value: string;
    weight: number;
    contribution: number;
    direction: 'UP' | 'DOWN' | 'NEUTRAL';
  }>;
}
```

### Example Output
```text
File:           src/payment/service.ts
Action:         Decompose monolithic payment workflow
Urgency:        NEXT_SPRINT
Why:            Critical priority, accelerating churn, repeated defect commits, ₹2.4L annual exposure
Effort:         12–22 hours (expected 16h)
Outcome:        Reduce predicted risk from CRITICAL → MEDIUM/HIGH
Confidence:     HIGH
```

---

## 4. Recommendation Explainability & Auditability

Every recommendation exposes the exact weights and feature contributions that led to its selection. Users can click any action card to inspect:
- Base complexity and recent churn deltas
- Defect commit counts
- Modeled annual drag
- Weight contribution breakdown

---

## 5. User Feedback Mechanism

Engineering teams can record feedback on generated recommendations:
- **`HELPFUL`**
- **`NOT_HELPFUL`**
- **`NOT_APPLICABLE`**

Feedback is persisted alongside `recommendationId`, `userId`, optional feedback notes, and timestamp for longitudinal calibration analysis.
