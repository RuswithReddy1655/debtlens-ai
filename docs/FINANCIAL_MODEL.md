# DebtLens AI — Algorithmic Financial Model Specification

DebtLens AI translates code maintainability metrics into concrete financial liability indicators using transparent engineering economics heuristics.

---

## 1. Grounding Principles & Non-Negotiable Rules

> [!IMPORTANT]
> **Grounding Rule**: Model-based financial estimates are predictive indicators based on engineering heuristics and historical repository metrics, not exact balance sheet accounting losses. Every financial output MUST be transparently traceable from **Input $\longrightarrow$ Formula $\longrightarrow$ Result**.
> In **Phase 2**, financial valuation is directly derived from **real AST cyclomatic complexity, actual Git commit churn, and detected defect-fix commits**, avoiding arbitrary or fabricated constants.

---

## 2. The Four Financial Quadrants

The platform strictly categorizes technical debt economics into four separate quadrants:

```
┌───────────────────────────────────────────────────┬───────────────────────────────────────────────────┐
│ 1. Estimated Remediation Investment               │ 2. Historical Maintenance & Rework Burden         │
│ Direct capital required to refactor hotspots now. │ Sunk capital consumed by past regression fixes.   │
├───────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ 3. Estimated Future Avoidable Cost                │ 4. Potential Refactoring Benefit & ROI            │
│ 12-month projected friction loss if neglected.    │ Net 24-month return on refactoring investment.    │
        │
└───────────────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

### Quadrant 1: Estimated Remediation Investment
- **Concept**: The immediate capital required to refactor accumulated code debt across identified files to standard maintainability thresholds.
- **Formula**:
  $$\text{RemediationCost} = \sum_{f \in \text{Hotspots}} \text{DebtHours}(f) \times R_{\text{eng}}$$
  where:
  - $\text{DebtHours}(f) = \left(\frac{\text{LoC}(f)}{80}\right) \times \left(\frac{\text{Cyclomatic}(f)}{15}\right) \times \left(\frac{\text{DebtScore}(f)}{50}\right)$
  - $\text{LoC}(f)$ is real physical code lines excluding comments and blank lines.
  - $\text{Cyclomatic}(f)$ is derived directly from the TypeScript AST analyzer.
  - $R_{\text{eng}}$ is the fully loaded engineering hourly rate (default: $\$95/\text{hr}$).

### Quadrant 2: Historical Maintenance & Rework Burden
- **Concept**: Engineering capital already expended over previous sprint cycles on preventable bug triage, regression patches, and high-friction code modifications.
- **Formula**:
  $$\text{HistoricalBurden} = \sum_{f \in \text{Files}} \left(\text{DebtHours}(f) \times 1.4 \times \left(0.5 \cdot \text{NormalizedChurn}(f) + 0.5 \cdot \text{DefectScore}(f)\right)\right) \times R_{\text{eng}}$$
  where:
  - $\text{NormalizedChurn}(f) = \min(1.0, \frac{\text{TotalChurn}(f)}{500})$
  - $\text{DefectScore}(f) = \min(1.0, \frac{\text{DefectFixCommitCount}(f)}{5})$

### Quadrant 3: Estimated Future Avoidable Cost (12-Month Projection)
- **Concept**: The projected financial drag over the next 12 months resulting from slowed feature delivery, onboarding cognitive overhead, and preventable patch cycles if debt remains unaddressed.
- **Formula**:
  $$\text{AvoidableAnnualCost} = \left(\sum_{f \in \text{CriticalHotspots}} 38\,\text{hrs} + \sum_{f \in \text{MediumRiskFiles}} 6\,\text{hrs}\right) \times R_{\text{eng}}$$
  where critical hotspot files incur an estimated 38 hours of avoidable triage drag per year, and medium-risk files incur 6 hours of avoidable drag per year.

### Quadrant 4: Potential Refactoring Benefit & ROI
- **Concept**: Net savings and return on investment realized across a 2-year operational lifecycle following targeted remediation of critical hotspots.
- **Formulas**:
  $$\text{NetSavings} = \left(\text{AvoidableAnnualCost} \times 2\right) - \text{RemediationCost}$$
  $$\text{ROI Ratio} = \frac{\text{AvoidableAnnualCost} \times 2}{\text{RemediationCost}}$$
  $$\text{Payback Period (Months)} = \frac{\text{RemediationCost}}{\text{AvoidableAnnualCost} / 12}$$

---

## 3. Dynamic Sensitivity Simulation

The system provides an interactive sensitivity slider on `/cost` and `/dashboard` allowing engineering leaders to dynamically adjust the fully loaded compensation rate $R_{\text{eng}}$ from $\$50/\text{hr}$ to $\$250/\text{hr}$, immediately recalculating all four quadrants and updating payback timelines.

---

## 4. Formula Trace Response Structure

All financial API responses (`GET /api/analyses/:id/cost`) return explicit formula traces:

```json
{
  "estimatedRemediationInvestment": {
    "totalHours": 1240,
    "totalCost": 117800,
    "trace": {
      "input": {
        "totalRemediationHours": 1240,
        "engineeringHourlyRate": 95,
        "hotspotsIdentified": 14
      },
      "formula": "RemediationCost = totalRemediationHours * engineeringHourlyRate",
      "result": 117800,
      "explanation": "Direct capital cost required to refactor 14 identified hotspot modules down to maintainable thresholds."
    }
  }
}
```

---

## 5. Phase 3 Financial Intelligence Extensions

In **Phase 3**, the financial model is significantly augmented with:
1. **Multi-Currency Support**: Native modeling for INR (`₹`, default), USD (`$`), EUR (`€`), and GBP (`£`).
2. **Four Concrete Cost Drivers**: Maintenance Friction, Defect/Fix Burden, Change Friction, and Legacy Risk (summing to 100%).
3. **Uncertainty Cost Ranges**: Modeling low/expected/high boundaries (e.g. ₹42L–₹54L) to prevent false accounting precision.
4. **Transparent Audit Traces**: Full inputs, formulas, confidence levels, and human explanations per metric.
5. **Interactive What-If Simulator**: Remediation effectiveness sensitivity (40%–90%) and refactoring effort multipliers.

For complete mathematical definitions and signal classifications, see [`docs/FINANCIAL_INTELLIGENCE.md`](./FINANCIAL_INTELLIGENCE.md).

