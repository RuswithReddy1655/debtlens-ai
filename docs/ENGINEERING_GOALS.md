# Engineering Goals & Progress Engine — DebtLens AI (Phase 4)

## 1. Overview
Engineering leaders require high-level targets to steer refactoring initiatives and quantify progress across sprints, quarters, or release cycles. The **Engineering Goals Engine** tracks progress against measurable technical debt metrics using verified analysis snapshots.

---

## 2. Supported Metrics

| Metric Enum | Direction | Typical Target Example |
|:---|:---|:---|
| `CRITICAL_HOTSPOTS` | Decreasing | "Reduce critical hotspots from 12 to 5" |
| `TECHNICAL_DEBT_SCORE` | Decreasing | "Lower repository debt score below 60" |
| `ANNUAL_EXPOSURE` | Decreasing | "Reduce modeled annual exposure by ₹10L" |
| `HIGH_PRIORITY_DEBT` | Decreasing | "Reduce high priority debt items by 30%" |
| `AVERAGE_COMPLEXITY` | Decreasing | "Lower average hotspot complexity to under 25" |

---

## 3. Progress Calculation Logic (`GoalProgressEngine`)

Goals handle both decreasing and increasing targets safely without zero-division or negative unbounded percentages.

### 3.1 Decreasing Metrics (Debt Reduction)
For targets where lower is better ($V_{\text{target}} < V_{\text{starting}}$):
$$\text{Progress} = \frac{V_{\text{starting}} - V_{\text{current}}}{V_{\text{starting}} - V_{\text{target}}} \times 100\%$$

- **Clamped Range**: Progress is clamped to $[0\%, 100\%]$.
- **Zero-Span Safety**: If $V_{\text{starting}} == V_{\text{target}}$, progress is $100\%$ if $V_{\text{current}} \le V_{\text{target}}$, otherwise $0\%$.

### 3.2 Increasing Metrics
For targets where higher is better ($V_{\text{target}} > V_{\text{starting}}$):
$$\text{Progress} = \frac{V_{\text{current}} - V_{\text{starting}}}{V_{\text{target}} - V_{\text{starting}}} \times 100\%$$

---

## 4. Goal Lifecycle States

- `ACTIVE`: The goal is currently being tracked against incoming snapshots.
- `ACHIEVED`: $V_{\text{current}}$ has met or exceeded $V_{\text{target}}$ ($\text{Progress} \ge 100\%$).
- `MISSED`: The target deadline has passed without achieving $V_{\text{target}}$.
- `PAUSED`: Temporarily suspended from active tracking.
- `CANCELLED`: Decommissioned.
