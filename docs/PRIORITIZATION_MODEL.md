# DebtLens AI — Technical Debt Prioritization & Impact/Effort Matrix Specification

## 1. Prioritization Philosophy

A common anti-pattern in engineering organizations is sorting technical debt purely by static analysis issue count or lines of code. This leads to wasting sprint capacity on stable, rarely modified utilities while high-risk, volatile core transaction engines continue to accumulate defects.

DebtLens AI answers the executive question:

> **"If our engineering team only has 40 hours of sprint capacity this month, where should we invest it first for maximum architectural stability and business return?"**

---

## 2. Multi-Signal Priority Score Formula

DebtLens AI computes a normalized **Priority Score** (0 to 100) combining 5 dimensions:

$$\text{PriorityScore} = \text{clamp}\left(0, 100, \sum w_i \cdot S_i\right)$$

### Dimension Weights ($w_i$)

| Dimension ($i$) | Weight ($w_i$) | Telemetry Signals | Purpose |
|---|:---:|---|---|
| **Technical Risk ($S_{\text{tech}}$)** | **30%** | AST Cyclomatic Complexity, Max Nesting Depth, File Size | Captures inherent code fragility and mental load. |
| **Financial Impact ($S_{\text{fin}}$)** | **25%** | Modeled annual friction cost contribution | Captures ongoing business and engineering salary drag. |
| **Change Frequency ($S_{\text{change}}$)** | **20%** | Total churn, commits per month | Measures how actively engineers touch this file. |
| **Defect Activity ($S_{\text{defect}}$)** | **15%** | Heuristic defect/fix commit frequency | Detects recurring bug remediation patterns. |
| **Telemetry Confidence ($S_{\text{conf}}$)** | **10%** | Commit density, AST parser coverage | Adjusts priority based on measurement certainty. |

### Normalized Signal Scales ($S_i \in [0, 100]$)

- **$S_{\text{tech}}$:**
  $$S_{\text{tech}} = \min(100, (\text{Complexity} \times 2.0) + (\text{NestingDepth} \times 5.0) + (\text{CodeLines} / 15))$$
- **$S_{\text{fin}}$:**
  $$S_{\text{fin}} = \min(100, \text{round}((\text{FileAnnualImpact} / \text{TopFileAnnualImpact}) \times 100))$$
- **$S_{\text{change}}$:**
  $$S_{\text{change}} = \min(100, (\text{ChangesPerMonth} \times 12) + (\text{TotalChurn} / 30))$$
- **$S_{\text{defect}}$:**
  $$S_{\text{defect}} = \min(100, \text{DefectFixCount} \times 20)$$
- **$S_{\text{conf}}$:**
  - `HIGH` $\rightarrow 100$
  - `MEDIUM` $\rightarrow 75$
  - `LOW` $\rightarrow 40$
  - `INSUFFICIENT DATA` $\rightarrow 10$

---

## 3. Priority Tiers

Every prioritized file is categorized into one of five executive tiers:

```text
┌──────────────┬────────────────────────────────────────────────────────────────────────┐
│ CRITICAL     │ Priority Score >= 80                                                   │
│              │ High technical risk + high financial impact + frequent sprint activity. │
├──────────────┼────────────────────────────────────────────────────────────────────────┤
│ HIGH         │ Priority Score 65–79                                                   │
│              │ Meaningful technical fragility with ongoing modification overhead.     │
├──────────────┼────────────────────────────────────────────────────────────────────────┤
│ MEDIUM       │ Priority Score 45–64                                                   │
│              │ Moderate complexity or moderate change frequency.                      │
├──────────────┼────────────────────────────────────────────────────────────────────────┤
│ LOW          │ Priority Score 25–44                                                   │
│              │ Low complexity or infrequently modified background component.          │
├──────────────┼────────────────────────────────────────────────────────────────────────┤
│ MONITOR      │ Priority Score < 25                                                    │
│              │ Stable, low-risk, or insufficient commit activity to warrant action.   │
└──────────────┴────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Impact vs Effort Prioritization Matrix

DebtLens AI maps all modules onto a two-dimensional executive prioritization quadrant:

- **X-Axis:** Estimated Refactoring Effort (Hours / Days)
- **Y-Axis:** Estimated Financial Impact (Annual Exposure Avoided)

```text
  Y (Impact)
    ▲
    │  ┌─────────────────────────┬─────────────────────────┐
    │  │       QUICK WINS        │        STRATEGIC        │
    │  │                         │                         │
    │  │ High Financial Impact   │ High Financial Impact   │
    │  │ Low Refactoring Effort  │ High Refactoring Effort │
    │  │ ➔ SPRINT IMMEDIATE      │ ➔ ARCHITECTURAL ROADMAP │
    │  ├─────────────────────────┼─────────────────────────┤
    │  │      OPPORTUNISTIC      │          DEFER          │
    │  │                         │                         │
    │  │ Low Financial Impact    │ Low Financial Impact    │
    │  │ Low Refactoring Effort  │ High Refactoring Effort │
    │  │ ➔ BOY SCOUT / ON TOUCH  │ ➔ DO NOT SPEND TIME     │
    │  └─────────────────────────┴─────────────────────────┘
    └──────────────────────────────────────────────────────► X (Effort)
```

### Quadrant Criteria & Prescriptions

| Quadrant | Impact | Effort | Prescribed Action |
|---|:---:|:---:|---|
| **`QUICK WINS`** | $\ge 50$ | $< 50$ | **Prioritize Immediately.** High leverage refactoring that yields immediate maintenance payback within 1–2 sprints. |
| **`STRATEGIC`** | $\ge 50$ | $\ge 50$ | **Quarterly Architectural Initiative.** Core payment or ledger engines requiring structural redesign, interface isolation, and comprehensive regression testing. |
| **`OPPORTUNISTIC`** | $< 50$ | $< 50$ | **Boy Scout Rule.** Refactor casually when already editing the file for feature tickets; do not schedule dedicated refactoring sprints. |
| **`DEFER`** | $< 50$ | $\ge 50$ | **Do Not Touch.** High effort with negligible financial returns (e.g. monolithic auto-generated parsers or legacy utilities that work reliably). |

---

## 5. Refactoring Effort Estimation Model

Refactoring effort is estimated using code structure, cognitive branching, and historical churn:

### Base Effort Formula

$$\text{EffortBaseHours} = \max\left(4, \text{round}\left(\frac{\text{CodeLines}}{60} \times \frac{\text{CyclomaticComplexity}}{12} \times \left(1.0 + \frac{\text{NestingDepthMax}}{10}\right)\right)\right)$$

### Uncertainty Range
To avoid false precision, refactoring effort is always expressed as a modeled range:

$$\text{LowHours} = \text{round}(\text{EffortBaseHours} \times 0.75)$$
$$\text{ExpectedHours} = \text{EffortBaseHours}$$
$$\text{HighHours} = \text{round}(\text{EffortBaseHours} \times 1.35)$$

---

## 6. Transparent Explainability Architecture

Every priority item provides an explicit, auditable **"Why Should I Fix This First?"** explanation:

### Example Decision Trace

```json
{
  "file": "PaymentProcessor.ts",
  "rank": 1,
  "priorityScore": 92,
  "priorityTier": "CRITICAL",
  "matrixQuadrant": "QUICK WINS",
  "signals": {
    "techRiskLevel": "HIGH",
    "financialImpactLevel": "HIGH",
    "changeFrequencyLevel": "HIGH",
    "defectActivityLevel": "MEDIUM"
  },
  "estimatedFinancialImpact": "₹4.8L – ₹6.4L / year",
  "estimatedRefactoringEffort": "12–22 hours",
  "potentialAnnualSavings": "₹3.8L / year",
  "suggestedAction": "Extract payment gateway subclasses, decouple validation, and establish unit test harness.",
  "reason": "Top priority hotspot combining high AST complexity (38), aggressive churn (842 lines), 6 defect-fix commits, and significant modeled maintenance exposure."
}
```
