# Forecasting Model & What-If Simulations

## 1. Overview & Mathematical Methodology

The DebtLens Forecasting Engine projects key engineering and financial metrics across `NEXT_ANALYSIS`, `SHORT_TERM` (3 cycles), and `MEDIUM_TERM` (6 cycles) horizons.

Rather than relying on uninterpretable neural networks, the engine employs multi-point weighted least-squares regression combined with momentum decay:

$$\hat{y}(t + h) = y(t) + h \cdot \text{Slope}_{recent} \cdot \delta^{h}$$

Where:
- $h$ is the forecast horizon multiplier ($1$ for `NEXT_ANALYSIS`, $3$ for `SHORT_TERM`, $6$ for `MEDIUM_TERM`).
- $\text{Slope}_{recent}$ is the slope across the most recent historical analysis snapshots.
- $\delta \in (0, 1]$ is a momentum dampening factor ($0.92$) preventing unrealistic runaway extrapolations over longer horizons.

---

## 2. Forecasted Financial Exposure

Financial forecasting applies the Phase 3 cost model across future projected maintenance friction:

$$\text{Exposure}_{forecast} = \text{Exposure}_{current} \cdot \left(1 + \frac{\Delta \text{DebtScore}}{100} \cdot \alpha_{churn}\right)$$

Where $\alpha_{churn}$ reflects active development pressure.

### Uncertainty Intervals (Avoidance of False Precision)

Forecasted financials are never presented as single exact integers. DebtLens always computes a 3-point interval:

- **`LOW` (Optimistic):** $0.85 \times \text{Forecast}$
- **`EXPECTED` (Base Modeled):** $1.00 \times \text{Forecast}$
- **`HIGH` (Pessimistic/Accelerating):** $1.20 \times \text{Forecast}$

All financial values are explicitly tagged as `MODELED` and formatted in localized currency notations (e.g., `₹22.7L / yr` in INR or `$272K / yr` in USD).

---

## 3. "Cost of Doing Nothing" Engine

The **Cost of Doing Nothing** quantifies the modeled financial penalty of inaction if high-risk debt hotspots remain unaddressed:

$$\Delta \text{Cost}_{inaction} = \text{Forecasted Exposure}_{\text{Do Nothing}} - \text{Current Annual Exposure}$$

Example modeled output:
```text
Current Modeled Exposure:       ₹18.4L / year
Forecasted Exposure (3 cycles): ₹22.7L / year
Potential Modeled Drift:        +₹4.3L / year (+23.4%)
```

---

## 4. What-If Scenario Simulations

The scenario engine projects the delta between inaction and targeted refactoring investments:

1. **`DO_NOTHING` (Baseline):** Unmitigated trend extrapolation.
2. **`FIX_TOP_3`:** Models immediate resolution of the top 3 critical predictive hotspots, recovering an estimated $22\%$ of annual friction.
3. **`FIX_TOP_5`:** Models resolution of the top 5 hotspots, recovering an estimated $35\%$ of annual friction.
4. **`FIX_TOP_10`:** Strategic sprint refactoring recovering up to $55\%$ of annual maintenance drag.
5. **`REDUCE_COMPLEXITY`:** Targeted structural refactoring reducing cognitive load and branching by $30\%$.
6. **`REDUCE_CHURN`:** Architecture stabilization and test automation dampening merge frequency and volatility.

### Scenario Comparison Table

| Scenario | Modeled Score | Modeled Exposure | Potential Savings | ROI % |
|---|---|---|---|---|
| **Do Nothing** | $76$ | ₹22.8L | ₹0.0L | $0\%$ |
| **Fix Top 3** | $64$ | ₹17.8L | ₹5.0L | $+240\%$ |
| **Fix Top 5** | $58$ | ₹14.8L | ₹8.0L | $+310\%$ |
| **Fix Top 10** | $48$ | ₹10.3L | ₹12.5L | $+420\%$ |

---

## 5. Strict Language Governance

To maintain integrity and trust with executive leadership:
- **Approved Terminology:** `Forecasted`, `Predicted`, `Modeled`, `Estimated`, `Expected`, `Potential`, `Confidence Range`.
- **Prohibited Terminology:** `Guaranteed`, `Certain`, `Exact Loss`, `Guaranteed Savings`, `Guaranteed Failure`.
