# Continuous Analysis & Job Scheduling — DebtLens AI (Phase 4)

## 1. Overview
Phase 4 transforms DebtLens AI from a point-in-time auditor into a continuous intelligence engine. Rather than requiring one-off manual scans, repositories can be analyzed automatically on recurring cadences or immediately following Git push events.

---

## 2. Supported Trigger Frequencies

| Frequency | Description | Execution Mechanism |
|:---|:---|:---|
| `MANUAL` | Analysis triggered on demand via the UI or API | Express controller $\rightarrow$ `AnalysisOrchestrator.runAnalysis()` |
| `DAILY` | Runs once every 24 hours (default at 02:00 UTC) | In-memory `NodeJS.Timeout` / Timer Scheduler |
| `WEEKLY` | Runs once every 7 days (default Sundays 03:00 UTC) | In-memory timer with timestamp delta checking |
| `AFTER_PUSH` | Triggers whenever commits are pushed to default branch | GitHub Webhook (`push` event) with HMAC validation |
| `AFTER_MERGE`| Triggers when pull requests are merged into base branch | GitHub Webhook (`pull_request.closed` & `merged == true`) |

---

## 3. Analysis Job Lifecycle State Machine

To prevent duplicate expensive Git clones or concurrent AST parsing of the same repository, every job transitions through explicit lifecycle states:

```text
[QUEUED]
   ↓
[CLONING]
   ↓
[ANALYZING] (Git churn + AST parsing + nesting depth)
   ↓
[CALCULATING] (Financial exposure + priority scores)
   ↓
[PERSISTING] (Saving analysis report + snapshot)
   ↓
[COMPARING] (Generating delta vs previous snapshot)
   ↓
[VERIFYING] (Automated check of RESOLVED debt items)
   ↓
[COMPLETED]
```

If an error occurs at any stage, the status transitions to `FAILED` with a user-sanitized error summary. In-flight jobs can be marked `CANCELLED`.

---

## 4. Concurrency & Debouncing

1. **Duplicate Prevention**: If a repository already has an active job in `QUEUED`, `CLONING`, `ANALYZING`, or `CALCULATING`, new trigger requests are rejected or debounced.
2. **Webhook Debouncing**: Rapid push bursts (e.g., automated release commits or branch rebases) within a 60-second window are debounced into a single scheduled analysis execution.
3. **Resource Isolation**: Scratch Git directories are dynamically provisioned in isolated runtime paths and pruned immediately upon analysis completion to eliminate disk leaks.
