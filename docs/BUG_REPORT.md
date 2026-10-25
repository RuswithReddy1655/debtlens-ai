# DebtLens AI — Formal QA Bug Reports

**Product:** DebtLens AI  
**Audit Period:** October 2026  
**QA Lead:** Senior Software QA Lead & Release Validation Engineer  
**Status:** All reported P0 and P1 defects have been verified, reproduced, minimally resolved, and confirmed passing under regression test suites.

---

## Bug Report Index

| Bug ID | Title | Severity | Status | Route / Component |
|---|---|---|---|---|
| **DL-001** | Cryptographic Bypass in JWT Authentication Middleware | P0 — Critical | **RESOLVED** | `backend/src/middleware/auth.ts` |
| **DL-002** | Missing RBAC Enforcement on Critical Administrative Endpoints | P1 — High | **RESOLVED** | `backend/src/routes/analysisRoutes.ts`, `phase4Routes.ts` |
| **DL-003** | Missing Length Boundary Validation on Repository URL Parameter | P2 — Medium | **RESOLVED** | `backend/src/services/repository/RepositorySecurityService.ts` |
| **DL-004** | Economic Disclaimer Schema Field Divergence & Text Standardization | P2 — Medium | **RESOLVED** | `backend/src/services/financial/FinancialIntelligenceEngine.ts` |

---

## Detailed Bug Reports

### BUG ID: DL-001
**Title:** Cryptographic Bypass in JWT Authentication Middleware  
**Severity:** P0 — Critical  
**Environment:** Development / Staging / Production  
**Route/API:** All protected endpoints under `/api/*` using `authMiddleware`  

#### Preconditions
Backend server initialized with `JWT_SECRET` configured in environment.

#### Steps to Reproduce
1. Launch the backend API server.
2. Send an HTTP request to any protected endpoint (e.g., `GET /api/repositories`) with the header:
   ```http
   Authorization: Bearer any-unauthenticated-string-that-is-16-chars-long
   ```
3. Alternatively, supply a dummy three-part string `a.b.c` without a valid HMAC signature.
4. Observe the HTTP response code and authenticated user context.

#### Expected Result
The request must be rejected with HTTP **401 Unauthorized**:
```json
{
  "success": false,
  "error": "Invalid token"
}
```

#### Actual Result
The request was accepted with HTTP **200 OK**. The previous middleware had a fallback logic accepting any token of length $\ge 16$ or matching a loose regex `^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?...`, assigning `req.user = { id: 'demo-user', role: 'admin' }`, completely bypassing authentication and granting admin privileges to unauthenticated callers.

#### Evidence
```text
FAIL: Unauthenticated caller provided arbitrary string "random-token-12345"
Expected HTTP 401 Unauthorized
Received HTTP 200 OK with req.user.role = "admin"
```

#### Root Cause
Development stub logic in `backend/src/middleware/auth.ts` permitted arbitrary strings and regex tokens to authenticate callers as administrative users without cryptographic HMAC verification.

#### Recommended Fix
Implement standard HMAC-SHA256 token verification with `crypto.createHmac` and `crypto.timingSafeEqual`:
1. Reject missing or malformed `Authorization` headers.
2. Decode header, payload, and signature components.
3. Compute expected signature over `header.payload` using `JWT_SECRET`.
4. Validate signature using constant-time comparison `crypto.timingSafeEqual`.
5. Verify token expiration timestamp `exp > Date.now() / 1000`.
6. Extract caller role (`admin`, `engineer`, `viewer`) strictly from verified payload.

#### Regression Test
Automated tests `AUTH-006`, `AUTH-007`, `AUTH-008` in `backend/tests/qaFullSystemAudit.test.ts`.

---

### BUG ID: DL-002
**Title:** Missing RBAC Enforcement on Critical Administrative Endpoints  
**Severity:** P1 — High  
**Environment:** Development / Staging / Production  
**Route/API:**
- `POST /api/analysis/:id/cancel`
- `POST /api/repositories/:id/disconnect`
- `DELETE /api/goals/:id`
- `POST /api/alerts/dismiss-all`

#### Preconditions
Caller authenticated with a valid JWT carrying role `engineer` or `viewer`.

#### Steps to Reproduce
1. Generate a valid JWT with payload `{ id: "user-1", role: "viewer" }`.
2. Issue a cancellation request `POST /api/analysis/650000000000000000000001/cancel` with the viewer token.
3. Issue a repository disconnect request `POST /api/repositories/650000000000000000000001/disconnect` with the viewer token.
4. Issue a bulk dismissal `POST /api/alerts/dismiss-all` with the viewer token.

#### Expected Result
All requests must be rejected with HTTP **403 Forbidden**:
```json
{
  "success": false,
  "error": "Forbidden: Requires one of [admin] role"
}
```

#### Actual Result
The requests were accepted and processed because the routes were protected only with `authMiddleware` without chaining `requireRole(['admin'])`. Non-admin users were able to cancel active pipeline jobs, disconnect repositories, and dismiss organization-wide alerts.

#### Evidence
```text
POST /api/analysis/650000000000000000000001/cancel with Viewer JWT:
Returned 200 / 404 (Passed through to controller) instead of 403 Forbidden.
```

#### Root Cause
Route definitions in `backend/src/routes/analysisRoutes.ts` and `backend/src/routes/phase4Routes.ts` lacked role-based access control middleware guards.

#### Recommended Fix
Chain `requireRole(['admin'])` on all administrative state-mutating operations:
```typescript
router.post('/:id/cancel', authMiddleware, requireRole(['admin']), analysisController.cancelAnalysis);
router.post('/repositories/:id/disconnect', authMiddleware, requireRole(['admin']), repositoryController.disconnectRepository);
router.delete('/goals/:id', authMiddleware, requireRole(['admin']), goalController.deleteGoal);
router.post('/alerts/dismiss-all', authMiddleware, requireRole(['admin']), alertController.dismissAllAlerts);
```

#### Regression Test
Automated tests `RBAC-003`, `RBAC-004`, `RBAC-005`, `RBAC-006` in `backend/tests/qaFullSystemAudit.test.ts`.

---

### BUG ID: DL-003
**Title:** Missing Length Boundary Validation on Repository URL Parameter  
**Severity:** P2 — Medium  
**Environment:** Development / Staging / Production  
**Route/API:** `POST /api/repositories`  

#### Preconditions
Authenticated caller submitting repository registration.

#### Steps to Reproduce
1. Prepare a payload with an excessively long URL string (> 2,048 characters):
   ```json
   {
     "url": "https://github.com/org/repo-aaaaaaaa...[repeat 5000 chars]"
   }
   ```
2. Submit `POST /api/repositories`.

#### Expected Result
Request rejected at the boundary with HTTP **400 Bad Request**:
```json
{
  "success": false,
  "error": "Repository URL exceeds maximum allowable length of 2048 characters"
}
```

#### Actual Result
The oversized string was passed directly to regular expression engines in `RepositorySecurityService`, consuming CPU cycles and exposing the system to potential Regular Expression Denial of Service (ReDoS) or memory bloat.

#### Evidence
```text
POST /api/repositories with length = 10,000 chars
Evaluated regexes across 10,000 characters without early length gating.
```

#### Root Cause
`RepositorySecurityService.validateUrl` did not perform early length gating prior to protocol and domain regex parsing.

#### Recommended Fix
Add immediate length constraint in `RepositorySecurityService.validateUrl`:
```typescript
if (!url || typeof url !== 'string' || url.length > 2048) {
  return {
    valid: false,
    error: 'Repository URL is required and must not exceed 2048 characters'
  };
}
```

#### Regression Test
Automated test `REPO-010` in `backend/tests/qaFullSystemAudit.test.ts`.

---

### BUG ID: DL-004
**Title:** Economic Disclaimer Schema Field Divergence & Text Standardization  
**Severity:** P2 — Medium  
**Environment:** Development / Staging / Production  
**Route/API:** `GET /api/financial/:repositoryId`, `FinancialIntelligenceEngine`  

#### Preconditions
Authenticated caller requesting financial intelligence exposure calculations.

#### Steps to Reproduce
1. Trigger financial exposure computation via `FinancialIntelligenceEngine.calculateTotalExposure`.
2. Inspect the resulting JSON output keys and disclaimer content.

#### Expected Result
Output contains both `disclaimer` and `economicDisclaimer` keys stating:
> "Modeled annual exposure and modeled savings are estimates based on codebase complexity, churn metrics, and industry engineering cost averages (MODELED ≠ REALIZED). They do not represent realized accounting losses or cash outflows."

#### Actual Result
The calculation returned `disclaimer` without the `economicDisclaimer` alias and lacked explicit `(MODELED ≠ REALIZED)` capital notation required by Section 12 & 29 compliance specifications.

#### Evidence
```text
Response JSON inspected:
"disclaimer": "Modeled annual exposure is an estimation..."
Missing key: "economicDisclaimer"
Missing explicit label: "MODELED ≠ REALIZED"
```

#### Root Cause
Naming divergence between internal formula property and client specification contract.

#### Recommended Fix
Update `calculateTotalExposure` in `FinancialIntelligenceEngine.ts` to include standardized wording and export both `disclaimer` and `economicDisclaimer` fields:
```typescript
const standardDisclaimer = 'Modeled annual exposure and modeled savings are estimates based on codebase complexity, churn metrics, and industry engineering cost averages (MODELED ≠ REALIZED). They do not represent realized accounting losses or cash outflows.';

return {
  ...exposureResult,
  disclaimer: standardDisclaimer,
  economicDisclaimer: standardDisclaimer
};
```

#### Regression Test
Automated test `FIN-006` in `backend/tests/qaFullSystemAudit.test.ts`.
