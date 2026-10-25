# Engineering Capacity & Risk-Reduction Planning

## 1. Overview

Unlimited technical debt remediation is an unrealistic engineering assumption. The `CapacityPlanningEngine` allows engineering managers and tech leads to specify available engineering sprint capacity and automatically generates a realistic, high-impact **Risk Reduction Work Package**.

---

## 2. Knapsack Optimization Formulation

Given an available capacity budget $B_{hours}$ (e.g., $80$ hours per sprint) and candidate predictive debt recommendations with effort $e_i$ and predictive action score $S_i$:

$$\max \sum_{i \in \text{Selected}} S_i \quad \text{subject to} \quad \sum_{i \in \text{Selected}} e_i \le B_{hours}$$

The engine utilizes greedy priority density optimization ($S_i / e_i$) to maximize risk reduction per allocated developer hour while honoring sprint buffers.

---

## 3. Work Package Structure

```typescript
export interface CapacityPlanResult {
  availableCapacityHours: number;
  allocatedEffortHours: number;
  remainingCapacityHours: number;
  recommendedWorkPackage: Array<{
    rank: number;
    filePath: string;
    action: string;
    effortHours: number;
    predictiveRiskLevel: string;
    modeledSavings: number;
  }>;
  expectedModeledRiskReduction: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW';
  modeledTotalAnnualSavings: number;
}
```

### Example Plan Output
```text
Available Sprint Capacity:   80 hours
Allocated Refactoring:       54 hours (3 high-impact items)
Buffer Remaining:            26 hours (feature delivery / contingency)

Recommended Work Package:
1. PaymentService.ts        18h  [CRITICAL Risk]
2. OrderValidator.ts        16h  [HIGH Risk]
3. LegacyParser.ts          20h  [HIGH Financial Drag]

Expected Modeled Reduction:  HIGH
Modeled Annual Savings:      ₹7.8L
```

---

## 4. Realistic Constraints & Caveats

- **No False Certainty:** Modeled risk reduction indicates expected directional relief rather than guaranteed absolute score drops.
- **Buffer Safety:** The engine reserves at least $15–20\%$ capacity buffer to prevent sprint spillover.
- **Capacity Slider:** Teams can adjust sprint capacity interactively in the `/forecast-scenarios` dashboard.
