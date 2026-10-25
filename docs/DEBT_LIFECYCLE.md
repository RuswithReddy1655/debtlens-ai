# Technical Debt Identity & Lifecycle State Machine — DebtLens AI (Phase 4)

## 1. The Core Problem: Hotspot Ephemerality
In traditional code scanners, every re-analysis yields an isolated set of warnings. If line numbers shift due to an unrelated commit at the top of a file, the scanner treats the hotspot as a "new" bug and silently closes the old one. This makes long-term tracking, sprint planning, and resolution verification impossible.

---

## 2. Resilient Debt Identity Engine (`DebtIdentityService`)

DebtLens AI solves this through deterministic identity synthesis:
```typescript
debtItemId = SHA256(repositoryId:normalizedFilePath:symbolName:debtCategory)
```

### 2.1 Identity Properties:
- **Line Number Immune**: Shifts in line offsets due to code changes do not alter `debtItemId`.
- **Symbol & File Grounded**: Uses normalized file paths (case-insensitive, forward-slash unified) and symbol names (classes, methods, functions).
- **Fallback Category**: If a hotspot spans an entire file without a single symbol, `ROOT` or `FILE_LEVEL` is used.

---

## 3. Debt Lifecycle State Machine

Debt items follow a validated finite state machine. Arbitrary transitions are strictly rejected by the backend.

```text
               ┌───────────────┐
               │   DETECTED    │
               └───────┬───────┘
                       │
                       ▼
               ┌───────────────┐
               │  PRIORITIZED  │ ◄─────────────────────────┐
               └───────┬───────┘                           │
                       │                                   │
                       ▼                                   │
               ┌───────────────┐                           │
               │    PLANNED    │                           │
               └───────┬───────┘                           │
                       │                                   │
                       ▼                                   │
               ┌───────────────┐                           │
               │  IN_PROGRESS  │                           │
               └───────┬───────┘                           │
                       │                                   │
                       ▼                                   │
               ┌───────────────┐                           │
               │   RESOLVED    │                           │
               └───────┬───────┘                           │
                       │                                   │
         (Automated Verification in Next Analysis)         │
                       │                                   │
            ┌──────────┴──────────┐                        │
            ▼                     ▼                        │
   ┌────────────────┐    ┌─────────────────┐               │
   │    VERIFIED    │    │    REOPENED     ├───────────────┘
   └────────────────┘    └─────────────────┘
```

### 3.1 Terminal & Exception States
- `WONT_FIX`: Engineering leadership explicitly marks the debt item as deferred indefinitely.
- `ACCEPTED_RISK`: The architectural or complexity burden is acknowledged and accepted due to business trade-offs.
- `REOPENED`: Occurs automatically if a previously `RESOLVED` or `VERIFIED` hotspot regresses, or if an automated verification reveals $<5\%$ improvement.

### 3.2 Valid State Transitions Table

| Current State | Allowed Next States | Trigger / Condition |
|:---|:---|:---|
| `DETECTED` | `PRIORITIZED`, `WONT_FIX`, `ACCEPTED_RISK` | Automatic priority calculation or triage |
| `PRIORITIZED` | `PLANNED`, `DETECTED`, `WONT_FIX`, `ACCEPTED_RISK`| Sprint grooming / task creation |
| `PLANNED` | `IN_PROGRESS`, `PRIORITIZED`, `WONT_FIX` | Engineering work starts |
| `IN_PROGRESS` | `RESOLVED`, `PLANNED`, `WONT_FIX` | Code submitted / PR opened |
| `RESOLVED` | `VERIFIED`, `REOPENED`, `IN_PROGRESS` | Re-analysis execution / verification engine |
| `VERIFIED` | `REOPENED` | Metric regression detected in subsequent analysis |
| `REOPENED` | `PRIORITIZED`, `IN_PROGRESS`, `WONT_FIX` | Triage of re-emerged hotspot |
| `WONT_FIX` | `PRIORITIZED`, `DETECTED` | Re-evaluation of backlog |
| `ACCEPTED_RISK`| `PRIORITIZED`, `DETECTED` | Periodic risk audit |
