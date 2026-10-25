# DebtLens AI — What-If Scenario Simulator & ROI Model Specification

## 1. Scenario Philosophy

Engineering teams frequently encounter leadership pushback when proposing refactoring initiatives:
> *"How much developer time will this take, and what is the return on investment?"*

The DebtLens AI What-If Scenario Engine simulates alternative sprint allocations before spending a single hour of engineering effort. It allows engineering leaders to test hypotheses, compare remediation scopes, and present credible, quantified business cases to executives.

---

## 2. Core Scenario Parameters

Every simulation accepts both predefined scopes and granular custom overrides:

| Parameter | Type | Default | Valid Range | Business Impact |
|---|:---:|:---:|:---:|---|
| **`selectedFilePaths`** | Array | Top 5 Hotspots | Any valid repo files | Defines the exact scope of refactoring targets. |
| **`hourlyRate`** | Number | Currency Default (₹2,000 / $95) | ₹500 – ₹10,000 | Configures fully-loaded engineering salary rate. |
| **`remediationEffectiveness`** | Float | 0.65 (65%) | 0.40 – 0.90 (40%–90%) | Models residual friction after refactoring. |
| **`effortMultiplier`** | Float | 1.0x | 0.7x – 1.5x | Adjusts for team familiarity or legacy opacity. |

---

## 3. Remediation Effectiveness & Residual Friction

DebtLens AI strictly rejects the unrealistic assumption that refactoring eradicates 100% of technical debt forever. Codebases evolve, dependencies update, and domain logic changes.

Instead, the model calculates:

$$\text{PotentialAnnualSavings} = \text{TargetAnnualImpact} \times \text{RemediationEffectiveness}$$

$$\text{ResidualAnnualImpact} = \text{TargetAnnualImpact} \times (1.0 - \text{RemediationEffectiveness})$$

### Recommended Guidelines
- **65% (Recommended):** Standard, sustainable refactoring that extracts clean interfaces, decouples sub-modules, and introduces thorough unit tests.
- **50% (Conservative):** Minimal tactical refactoring or team unfamiliar with legacy patterns.
- **85% (Aggressive):** Complete architectural rewrite and total test harness replacement.

---

## 4. Financial ROI & Payback Period Modeling

### Refactoring Investment

$$\text{RefactoringInvestment} = \text{TotalRefactoringHours} \times \text{LoadedHourlyRate}$$

### Gross & Net 24-Month Benefit

$$\text{GrossBenefit}_{24\text{mo}} = \text{PotentialAnnualSavings} \times 2.0$$

$$\text{NetSavings}_{24\text{mo}} = \text{GrossBenefit}_{24\text{mo}} - \text{RefactoringInvestment}$$

### 24-Month Return on Investment (ROI)

$$\text{ROI} (\%) = \text{round}\left(\frac{\text{NetSavings}_{24\text{mo}}}{\text{RefactoringInvestment}} \times 100\right)$$

*Safe Edge Case:* If $\text{RefactoringInvestment} \le 0$, $\text{ROI} = 0\%$ (no division by zero).

### Payback Period Horizon (Months)

$$\text{MonthlySavings} = \frac{\text{PotentialAnnualSavings}}{12}$$

$$\text{PaybackMonths} = \text{round}\left(\frac{\text{RefactoringInvestment}}{\text{MonthlySavings}} \times 10\right) / 10$$

*Safe Edge Case:* If $\text{MonthlySavings} \le 0$ or investment cannot be recovered, $\text{PaybackPeriodMonths} = \text{null}$ (displayed as `N/A`).

---

## 5. Strategic Preset Comparison Matrix

DebtLens AI automatically provides a 3-way comparative matrix alongside any custom scenario:

| Scenario | Definition | Typical Scope | Strategic Advantage |
|---|---|:---:|---|
| **Scenario A: Quick Wins** | Top 5 files in Quick Wins matrix quadrant. | 5 files | Lowest investment, rapid payback (< 3 months), fastest developer satisfaction. |
| **Scenario B: Strategic Hotspots** | Top 10 high-impact files by overall priority score. | 10 files | Major reduction in systemic architectural risk across core services. |
| **Scenario C: Comprehensive** | All identified repository hotspots. | 15–30 files | Broadest long-term debt reduction, suitable for dedicated refactoring quarters. |

### Comparative Matrix Table Format

| Scenario | Scope | Investment | Annual Savings | 2-Year Net | ROI | Payback | Residual Drag | Viability |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Scenario A (Top 5)** | 5 files | ₹1.8L–₹2.4L | ₹5.2L–₹6.8L | ₹8.6L–₹11.2L | +340% | 2.8 mos | ₹1.2L | **Recommended** |
| **Scenario B (Top 10)**| 10 files | ₹4.2L–₹5.6L | ₹9.4L–₹12.1L| ₹14.6L–₹18.6L| +220% | 4.3 mos | ₹2.8L | **Recommended** |
| **Scenario C (All)** | 18 files | ₹8.6L–₹11.4L| ₹14.2L–₹18.5L| ₹19.8L–₹25.6L| +145% | 6.8 mos | ₹4.9L | **Viable** |
