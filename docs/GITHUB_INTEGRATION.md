# GitHub Integration Specification — DebtLens AI (Phase 4)

## 1. Overview
DebtLens AI Phase 4 incorporates secure GitHub authentication and continuous repository tracking. The system enables engineering organizations to connect their GitHub accounts/organizations, discover accessible repositories, configure continuous analysis triggers, and establish bi-directional traceability with commits and pull requests.

---

## 2. Authentication Flow & Security Architecture

### 2.1 OAuth 2.0 Web Application Flow
The authentication flow follows industry-standard OAuth 2.0 best practices:
1. **Initiation**: Frontend requests `/api/github/connect`. The backend generates a cryptographically secure random `state` nonce (stored with a 10-minute expiration) and redirects the user to `https://github.com/login/oauth/authorize` requesting minimal scopes (`repo:status`, `read:user`, `repo`).
2. **Callback**: GitHub redirects to `/api/github/callback?code=...&state=...`. The backend strictly validates:
   - State parameter match against the session nonce (preventing CSRF).
   - Authorization code exchange for an access token via secure HTTPS POST.
3. **Token Management & Security Principles**:
   - Raw GitHub access tokens are NEVER stored in plaintext. Tokens are encrypted using AES-256-GCM before persistence or kept in ephemeral server session storage.
   - Tokens, refresh tokens, and OAuth client secrets are NEVER exposed to the frontend or included in JSON responses.
   - When OAuth credentials are not configured in local development, the backend automatically enters a deterministic authenticated mock/benchmark mode (`token: "mock-gh-token-demo"`).

---

## 3. Webhook Architecture & HMAC Validation

### 3.1 Webhook Verification
DebtLens AI processes continuous repository events (e.g., `push`, `pull_request`, `installation`) delivered via GitHub Webhooks.

```text
GitHub Push Event
       ↓
POST /api/webhooks/github
       ↓
HMAC-SHA256 Signature Validation (X-Hub-Signature-256)
       ↓
Repository Resolution by Provider ID
       ↓
Debounced Analysis Queueing
       ↓
Existing Phase 2 Analysis Engine Execution
       ↓
Point-in-Time Snapshot Creation
       ↓
Before/After Comparison & Debt Item Matching
       ↓
Goal Evaluation & Alert Dispatch
```

### 3.2 Signature Verification
Every inbound webhook payload is validated against the repository or organization webhook secret:
```typescript
const computedSignature = 'sha256=' + crypto
  .createHmac('sha256', webhookSecret)
  .update(rawPayload)
  .digest('hex');

const isValid = crypto.timingSafeEqual(
  Buffer.from(signatureHeader),
  Buffer.from(computedSignature)
);
```
Unsigned or invalidly signed webhooks are rejected with `401 Unauthorized` without executing any Git or analysis operations.

---

## 4. Work Linking & Traceability

### 4.1 Commit & Pull Request Association
When engineering teams resolve technical debt items, DebtLens AI links the item to concrete engineering artifacts:
- **Commit SHA**: e.g., `d4f8a12`
- **Pull Request URL**: e.g., `https://github.com/org/repo/pull/184`
- **Branch**: e.g., `refactor/payment-service-hotspot`

### 4.2 Non-Fabrication Rule (Principle 1)
DebtLens AI NEVER fabricates or guesses that a commit resolved a hotspot. Associations are created explicitly by engineering teams through the Debt Management UI or API, or verified through Git commit message refs (e.g., `Fixes debtItemId: d8f1...`).
