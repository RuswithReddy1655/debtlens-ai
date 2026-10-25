# DebtLens AI — Git Security & Safeguards Architecture

Cloning and parsing user-supplied Git repositories introduces security challenges including Server-Side Request Forgery (SSRF), command injection, denial of service via oversized repositories, and data leakage. This document details the security controls implemented in **Phase 2**.

---

## 1. Threat Model & Safeguards Matrix

| Threat Vector | Attack Scenario | Mitigation in DebtLens AI |
| :--- | :--- | :--- |
| **SSRF (Internal Network Scanning)** | User enters `https://127.0.0.1`, `https://192.168.1.1`, or `https://10.0.0.1` to probe local services. | **SSRF Host Validator**: IP pattern matching blocks RFC 1918, RFC 5735, loopbacks, and link-local ranges before network connection. |
| **Cloud Metadata Theft** | User enters `https://169.254.169.254` or `metadata.google.internal` to steal IAM credentials or tokens. | **Metadata Endpoint Guard**: 169.254.169.254 and cloud provider metadata hostnames are hard-blocked. |
| **Command Injection** | Attacker passes `https://github.com/org/repo.git; rm -rf /` or backticks to execute shell commands. | **Strict Argument Passing**: Node `simple-git` API passes arguments as typed array parameters, never using raw shell `exec()`. Shell metacharacters (`;&|`$><"'\n\r\t`) are rejected at validation. |
| **Arbitrary Filesystem Access** | User passes `file:///etc/passwd` or `ftp://` to read host files. | **Protocol Restriction**: Only HTTPS (`https://`) URLs are permitted in production. |
| **Directory Traversal** | Malicious commit or path names escape workspace (e.g. `../../etc/cron.d`). | **Safe Path Containment**: `RepositorySecurityService.isPathSafe()` checks that all file paths resolve strictly inside the isolated workspace. |
| **Disk Exhaustion (Zip Bombs)** | Enormous repositories (>500MB) or millions of commits crash the host. | **Resource Constraints**: Configurable limits on repo size (`MAX_REPOSITORY_SIZE_MB`), file count (`MAX_ANALYSIS_FILES`), commit depth (`MAX_COMMITS`), and clone timeout (`GIT_CLONE_TIMEOUT_MS`). |
| **Workspace Leakage** | Repository code remains indefinitely on the server. | **Ephemeral Isolation & Cleanup**: Each analysis is cloned into an isolated `.analysis-workspaces/analysis-{id}/` directory and purged immediately after completion or failure. |
| **Third-Party AI Exposure** | Proprietary source code sent to external LLM APIs. | **Strict Zero-Exfiltration Policy**: AST parsing, complexity evaluation, and churn modeling run entirely locally in Node.js. No source code is ever sent to external LLMs. |

---

## 2. SSRF Protection Details

`RepositorySecurityService.validateUrl()` implements strict pre-flight URL validation:

### Blocked Host Patterns
- **Loopback**: `localhost`, `127.0.0.0/8`, `0.0.0.0`, `::1`
- **Private Subnets (RFC 1918)**:
  - `10.0.0.0/8` (`10.*.*.*`)
  - `172.16.0.0/12` (`172.16.*.*` to `172.31.*.*`)
  - `192.168.0.0/16` (`192.168.*.*`)
- **Link-Local & Cloud Metadata**:
  - `169.254.0.0/16` (`169.254.169.254`)
  - `metadata.google.internal`
  - `instance-data`
- **IPv6 Private**: `fc00::/7` (Unique Local), `fe80::/10` (Link Local)

### Port Restrictions
Only standard HTTPS port (443) or default HTTPS port is permitted. Custom non-standard ports (e.g. `:8080`, `:22`, `:5000`) are blocked to prevent internal port scanning.

---

## 3. Command Injection Elimination

Shell interpolation is completely prohibited across the ingestion stack:

1. **Regex Filter**:
   ```typescript
   private static readonly UNSAFE_CHARS = /[;&|`$><"'\n\r\t]/;
   ```
   Any URL matching this regex is rejected with an HTTP 400 validation error before reaching git.

2. **Parameter Array Execution**:
   Cloning uses `simple-git` which executes git via `child_process.spawn()` with structured argument arrays:
   ```typescript
   // SAFE: Arguments passed as discrete array items, no shell parsing
   await git.clone(sanitizedUrl, targetDirectory, [
     '--depth', String(maxCommits),
     '--single-branch',
     '--branch', branch,
     '--no-tags',
   ]);
   ```

---

## 4. Resource Limits & Configuration

All resource limits are externalized in environment variables with safe defaults:

```bash
# Maximum repository cloned size on disk in Megabytes
MAX_REPOSITORY_SIZE_MB=500

# Maximum files to parse in a single analysis run
MAX_ANALYSIS_FILES=5000

# Maximum file size to analyze (larger files are skipped)
MAX_FILE_SIZE_MB=2

# Maximum commits to parse in git history
MAX_COMMITS=1000

# Maximum git clone duration in milliseconds (default: 60s)
GIT_CLONE_TIMEOUT_MS=60000

# Maximum total analysis duration in milliseconds (default: 300s)
ANALYSIS_TIMEOUT_MS=300000

# Dedicated workspace directory for temporary clones
ANALYSIS_WORKSPACE_DIR=.analysis-workspaces
```

---

## 5. Ephemeral Workspace Lifecycle

1. **Isolation**: When an analysis job starts, a unique directory is created:
   `.analysis-workspaces/analysis-{analysisId}/`
2. **Execution**: Git clone, history extraction, and AST analysis run against this local directory.
3. **Persistence**: Telemetry metrics, hotspots, recommendations, and financial valuations are stored in MongoDB.
4. **Mandatory Purge**: In the `finally` block of `AnalysisOrchestrator`, `RepositoryCleanupService.cleanupWorkspace()` is invoked:
   - Recursively grants write permissions to unlock read-only git packfiles
   - Removes the directory using `fs.rmSync({ recursive: true, force: true })`
   - Logs cleanup confirmation
