# DebtLens AI — Financial Intelligence & Decision Support Specification

## 1. Executive Summary & Philosophy

DebtLens AI transforms technical debt from an abstract, subjective code quality debate into a **quantifiable, auditable engineering decision-support system**.

Traditional static analysis tools report thousands of arbitrary "code smells" without business context. DebtLens AI bridges this divide by converting real Git repository telemetry into transparent financial ranges, ranking refactoring opportunities by net ROI, and empowering engineering executives (CTOs, VPs of Engineering, and Engineering Directors) to answer five critical governance questions:

```text
1. Where is our technical debt?
2. Which debt matters most?
3. What is the estimated financial impact?
4. What should engineering fix first?
5. What could we save by fixing it?
```

---

## 2. Important Financial Disclaimer & Governance

> [!IMPORTANT]
> **Financial Governance Notice:**
> Model-generated financial estimates are **management decision-support models**, NOT certified accounting losses or balance-sheet entries.
>
> **Rules of Product Presentation:**
> 1. Never present model estimates as exact single-point figures (e.g., do NOT state "Your technical debt costs exactly ₹47,82,000").
> 2. Present financial numbers as **uncertainty ranges** (e.g., "Estimated annual maintenance impact: ₹42L–₹54L" or "$45k–$55k").
> 3. Every financial estimate must be explicitly labeled: **Estimated**, **Modeled**, or **Assumption-Based**.
> 4. Financial claims must never imply guaranteed returns, guaranteed defect reduction, or guaranteed productivity multipliers.
> 5. Every output must carry a transparent, verifiable **Calculation Trace**.

---

## 3. Signal Classification Hierarchy

To ensure credibility with both engineering leaders and CFOs, all data in DebtLens AI is strictly categorized into one of five classification tiers:

| Tier | Definition | Examples |
|---|---|---|
| **`OBSERVED`** | Directly measured from Git history, commit graph, or file system. | Commits, churn count, lines of code, author count, days since last change. |
| **`DERIVED`** | Computed deterministically by AST parsers and mathematical formulas. | AST Cyclomatic complexity, max nesting depth, ownership entropy, change frequency per month. |
| **`ESTIMATED`** | Engineering effort predictions derived from normalized complexity heuristics. | Estimated refactoring hours range (12–18 hrs), maintenance hours per hotspot. |
| **`MODELED`** | Financial impact projections calculated using explicit, user-configurable assumptions. | Annual maintenance exposure, potential annual savings, 24-month ROI, payback horizon. |
| **`UNAVAILABLE`** | Omitted when telemetry or historical baselines are insufficient. | Historical trend deltas when only 1 analysis exists; defect signals without commit history. |

---

## 4. Multi-Currency Support & Notation

DebtLens AI supports 4 major international engineering currencies with native executive notation:

| Currency | Symbol | Default Loaded Engineering Rate | Display Format Example |
|---|:---:|:---:|---|
| **INR** | ₹ | ₹2,000 / hour | ₹42.0L – ₹54.0L (Indian Lakhs/Crores notation) |
| **USD** | $ | $95 / hour | $45k – $58k (Western notation) |
| **EUR** | € | €88 / hour | €40k – €52k (Western notation) |
| **GBP** | £ | £78 / hour | £35k – £46k (Western notation) |

Conversion assumptions are explicit and configurable. DebtLens AI never performs silent or fictitious currency conversions.

---

## 5. Four-Quadrant Financial Model

```text
┌──────────────────────────────────────────┬──────────────────────────────────────────┐
│ 1. Maintenance Friction Cost             │ 2. Defect/Fix Burden                     │
│                                          │                                          │
│ Estimated ongoing engineering drag       │ Estimated maintenance burden associated  │
│ caused by difficult-to-change, highly    │ with repeated heuristic defect-fix       │
│ complex modules.                         │ modifications over time.                 │
├──────────────────────────────────────────┼──────────────────────────────────────────┤
│ 3. Change Friction Cost                  │ 4. Legacy Risk Exposure                  │
│                                          │                                          │
│ Additional engineering overhead incurred │ Estimated friction from aging, stale, or │
│ each time high-churn risky code is       │ unowned code during emergency maintenance│
│ modified in active development sprints.  │ or breaking dependency upgrades.         │
└──────────────────────────────────────────┴──────────────────────────────────────────┘
```

---

## 6. Financial Formulas & Methodology

### Formula 1: Maintenance Friction Cost

- **Name:** Estimated Annual Maintenance Impact
- **Purpose:** Quantify the engineering capacity lost navigating, understanding, and working around complex modules.
- **Inputs:**
  - $N_{\text{critical}}$ = Count of critical hotspots
  - $N_{\text{medium}}$ = Count of non-critical analyzed files
  - $H_{\text{crit}}$ = Average annual maintenance hours per critical hotspot (Default: 40 hrs)
  - $H_{\text{med}}$ = Average annual maintenance hours per standard file (Default: 10 hrs)
  - $R$ = Loaded hourly engineering cost
- **Formula:**
  $$\text{MaintenanceHours} = (N_{\text{critical}} \times H_{\text{crit}}) + (N_{\text{medium}} \times H_{\text{med}})$$
  $$\text{MaintenanceCost} = \text{MaintenanceHours} \times R$$
- **Example:**
  - 4 critical hotspots @ 40 hrs = 160 hrs
  - 8 standard files @ 10 hrs = 80 hrs
  - Total Hours = 240 hrs
  - At ₹2,000/hr: $\text{Expected} = \text{₹4,80,000}$
  - Cost Range: $\text{Low} = \text{₹4.08L}$, $\text{Expected} = \text{₹4.80L}$, $\text{High} = \text{₹5.52L}$
- **Assumptions:** Critical hotspots demand approximately 4x more reading and debugging overhead than standard files.
- **Limitations:** Does not account for developer familiarity or whether a file is completely frozen.
- **Confidence:** Depends on AST parser coverage and hotspot density.

---

### Formula 2: Defect/Fix Burden

- **Name:** Heuristic Defect Remediation Impact
- **Purpose:** Estimate engineering hours consumed diagnosing and resolving issues in high-defect modules.
- **Inputs:**
  - $C_{\text{defect}}$ = Total commits matching defect/fix heuristic patterns (`fix:`, `bug:`, `patch:`, `resolve:`, `issue #`)
  - $H_{\text{defect}}$ = Average engineering investigation & fix hours (Default: 6.0 hrs)
  - $R$ = Loaded hourly engineering cost
- **Formula:**
  $$\text{DefectHours} = C_{\text{defect}} \times H_{\text{defect}}$$
  $$\text{DefectCost} = \text{DefectHours} \times R$$
- **Example:**
  - 28 defect-fix commits $\times$ 6.0 hrs = 168 engineering hours
  - At ₹2,000/hr: $\text{Expected} = \text{₹3,36,000}$
  - Cost Range: ₹2.86L – ₹3.86L
- **Assumptions:** Heuristic commit matching correlates with engineering triage time.
- **Limitations:** Heuristic keywords can include false positives (e.g. documentation typo fixes) or miss unreported bugs.
- **Confidence:** `MEDIUM` — requires explicit commit message clarity.

---

### Formula 3: Change Friction Cost

- **Name:** High-Churn Modification Overhead
- **Purpose:** Quantify the additional drag experienced by developers when repeatedly editing volatile, complex files.
- **Inputs:**
  - $\text{TotalChurn}$ = Total lines added + deleted across analyzed commit history
  - $M_{\text{churn}}$ = Churn normalization divisor (Default: 50 lines per review unit)
  - $F_{\text{friction}}$ = Change friction multiplier (Default: 1.25)
  - $R$ = Loaded hourly engineering cost
- **Formula:**
  $$\text{ChangeHours} = \text{round}\left(\frac{\text{TotalChurn}}{50} \times 1.25\right)$$
  $$\text{ChangeCost} = \text{ChangeHours} \times R$$
- **Example:**
  - 4,200 lines churned $\rightarrow (4200 / 50) \times 1.25 = 105$ hours
  - At ₹2,000/hr: $\text{Expected} = \text{₹2,10,000}$
  - Cost Range: ₹1.78L – ₹2.42L

---

### Formula 4: Legacy Risk Exposure

- **Name:** Aging Architecture Vulnerability
- **Purpose:** Model future friction and risk of developer departure in stagnant, complex, single-owner code.
- **Inputs:**
  - $N_{\text{legacy}}$ = Number of files flagged as legacy (Age > 180 days, changes per month < 0.8, complexity > 10, or single-author concentration > 80%)
  - $H_{\text{legacy}}$ = Average annual legacy investigation buffer (Default: 16 hrs)
  - $R$ = Loaded hourly engineering cost
- **Formula:**
  $$\text{LegacyHours} = N_{\text{legacy}} \times 16$$
  $$\text{LegacyCost} = \text{LegacyHours} \times R$$

---

## 7. Cost Driver Engine (100% Normalized Sum)

The Cost Driver Engine combines all 4 categories into a cohesive, normalized profile:

$$\text{TotalAnnualExposure} = \text{MaintenanceCost} + \text{DefectCost} + \text{ChangeCost} + \text{LegacyCost}$$

$$\text{DriverPercentage}_i = \text{round}\left(\frac{\text{Cost}_i}{\text{TotalAnnualExposure}} \times 100\right)$$

All four driver percentages are constrained to sum to precisely 100%.

---

## 8. Confidence Evaluation Model

DebtLens AI computes a composite confidence rating based on data completeness:

| Signal Requirement | Score Weight |
|---|:---:|
| Git History Density (>= 30 commits analyzed) | 25 pts |
| AST Supported Source Files (>= 80% parsed) | 25 pts |
| Defect-Fix Commit Evidence (>= 3 defect signals found) | 20 pts |
| Multi-Author Contributor Data (>= 2 authors) | 15 pts |
| Configured Non-Default Rate Assumptions | 15 pts |

### Confidence Tiers
- **`HIGH`** ($\ge 80$ pts): Comprehensive Git history, high AST coverage, rich commit signals.
- **`MEDIUM`** (50–79 pts): Standard Git history, partial defect signals or default rate assumptions.
- **`LOW`** (25–49 pts): Sparse Git history (< 15 commits) or single-author repository.
- **`INSUFFICIENT DATA`** (< 25 pts): Empty commit history, unsupported languages, or unparsed ASTs.

---

## 7. Phase 4 Distinction: Modeled vs Verified vs Realized Savings

A central tenet of DebtLens AI Phase 4 (Principle 2) is the inviolable separation between financial modeling and accounting reality:

### 1. Modeled Annual Exposure Reduction
- **Definition**: The theoretical annual engineering friction removed based on cost-driver models (maintenance, defect fix burden, change friction, and legacy risk).
- **Format**: *"Modeled annual exposure reduced by ₹4.2L"*
- **Status**: `MODELED`
- **Application**: Useful for engineering resource allocation and executive planning.

### 2. Verified Technical Improvement
- **Definition**: Directly measured physical code telemetry demonstrating that code complexity, nesting, and churn decreased between re-analyses.
- **Format**: *"Verified: Cyclomatic complexity reduced by 37.5% (40 → 25); Hotspot score reduced by 42%"*
- **Status**: `VERIFIED`
- **Application**: Concrete proof of engineering effectiveness.

### 3. Realized Business Savings
- **Definition**: Actual business currency retained by the enterprise (e.g., lower payroll outlays, cancelled contractor contracts, or measured reduction in customer churn).
- **Format**: *"Realized Business Savings: Not Measured / Insufficient Accounting Data"*
- **Status**: `UNAVAILABLE` / `NOT VERIFIED`
- **Application**: DebtLens AI explicitly refuses to claim realized business savings unless the enterprise connects internal general ledger (GL) accounting systems.

---

## 7. Phase 5 Predictive Financial Intelligence & "Cost of Doing Nothing"

Phase 5 extends financial modeling into forward-looking trajectory forecasting:

### 1. Forecasted Annual Exposure Drift
- **Classification**: `MODELED`
- **Methodology**: Multi-point slope extrapolation combined with churn pressure modeling over 1, 3, or 6 analysis cycles.
- **Uncertainty Bounds**: Low (0.85x), Expected (1.0x), High (1.20x).
- **Strict Rule**: Always labeled as *Forecasted Modeled Exposure*, never guaranteed loss.

### 2. "Cost of Doing Nothing" (Inaction Cost)
- **Definition**: Estimated increase in annual maintenance drag if identified high-risk hotspots remain unrefactored.
- **Formula**:
  $$\Delta \text{Cost}_{inaction} = \text{Forecasted Exposure}_{\text{Do Nothing}} - \text{Current Annual Exposure}$$
- **Example Statement**: *"If current volatility continues, modeled annual maintenance exposure is projected to expand from ₹18.4L to ₹22.7L (+₹4.3L / yr) over the next 3 analysis cycles."*

### 3. Counterfactual Scenario Comparison
Compares inaction against targeted intervention:
- **Baseline Inaction**: ₹22.8L / yr
- **Top-5 Targeted Remediation**: ₹14.8L / yr
- **Modeled Engineering Drag Avoided**: ₹8.0L / yr
