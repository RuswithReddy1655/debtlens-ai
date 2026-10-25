# Automated Verification Model — DebtLens AI (Phase 4)

## 1. Overview
A core requirement of Phase 4 is:
> **Prove that technical-debt analysis leads to measurable engineering improvement over time.**

Marking a ticket or PR as "Done" does NOT guarantee that technical debt was reduced. The **Verification Engine** compares objective telemetry before and after an engineering intervention to confirm whether complexity, nesting, and churn actually decreased.

---

## 2. Before / After Comparison Protocol

When a debt item enters the `RESOLVED` status, the system snapshots its baseline metrics:
- Baseline Cyclomatic Complexity ($C_0$)
- Baseline Nesting Depth ($N_0$)
- Baseline Churn ($H_0$)
- Baseline Hotspot Score ($S_0$)

Upon the next analysis of the repository:
1. The engine checks if the file/symbol still exists.
   - If the file was deleted as part of dead-code removal or refactoring: Verification Result = `VERIFIED` (100% improvement).
2. If the file exists, the engine computes current metrics:
   $$\Delta C = \frac{C_0 - C_1}{C_0} \times 100\%$$
   $$\Delta S = \frac{S_0 - S_1}{S_0} \times 100\%$$

---

## 3. Verification Classification

| Status | Quantitative Threshold | Outcome |
|:---|:---|:---|
| `VERIFIED` | Complexity or Hotspot Score reduced by $\ge 20\%$ | Debt item status transitions to `VERIFIED`. Modeled savings marked verified. |
| `PARTIALLY_VERIFIED` | Complexity or Hotspot Score reduced by $5\% \le \Delta < 20\%$ | Status remains `RESOLVED` with warning badge. |
| `NOT_VERIFIED` | Improvement $< 5\%$ or complexity increased ($\Delta \le 0\%$) | **Item is automatically moved to `REOPENED`** and an alert is dispatched. |
| `INSUFFICIENT_DATA`| File missing baseline telemetry or metrics unavailable | Displayed with audit note, pending further Git history. |

---

## 4. Principle 2: Verified Improvement $\neq$ Financial Savings

DebtLens AI enforces an unyielding conceptual distinction across the entire platform:

1. **Modeled Annual Exposure Reduction**:
   - What the financial equations estimate will be saved annually (e.g., *₹4.2L/year modeled reduction*).
   - Label: `MODELED`.
2. **Verified Technical Improvement**:
   - The verified, observed engineering facts (e.g., *Complexity reduced from 42 to 19, a 54.8% reduction*).
   - Label: `VERIFIED`.
3. **Realized Business Savings**:
   - The actual money retained on the company's ledger or payroll.
   - Strictly marked: `NOT VERIFIED` / `UNMEASURED` unless explicit financial accounting data is provided.
   - DebtLens AI never falsely claims *"The company saved ₹4.2L"* based solely on code changes.
