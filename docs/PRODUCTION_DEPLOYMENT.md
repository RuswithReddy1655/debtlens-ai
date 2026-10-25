# DebtLens AI — Production Deployment Guide

This document defines the production deployment procedures, architecture constraints, operational checklists, and rollback mechanisms for **DebtLens AI — Premium Engineering Intelligence Platform**.

---

## 1. Prerequisites

### Host Environment
- **Node.js**: v20.x or v22.x LTS (x64 / arm64)
- **Git**: 2.30+ installed and available on host system `$PATH`
- **Memory**: Minimum 2 GB RAM (4 GB recommended for AST parsing and commit diffing)
- **Disk**: Minimum 10 GB SSD for isolated analysis workspaces
- **Database**: MongoDB 6.0+ (MongoDB Atlas or self-hosted replica set with TLS enabled)
- **Process Manager**: PM2, systemd, or container runtime (Docker / ECS / Kubernetes)
- **Reverse Proxy**: Nginx, Cloudflare, or AWS ALB for SSL termination and HTTP/2

---

## 2. Environment Variables Specification

All production secrets must be provided via secure environment configuration or a vault manager (e.g., AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager).

| Variable | Required | Default | Production Value Description |
|---|---|---|---|
| `PORT` | Optional | `5001` | Backend HTTP listening port |
| `NODE_ENV` | **Required** | `development` | Set to `production` |
| `API_PREFIX` | Optional | `/api` | Root REST API prefix |
| `CORS_ORIGIN` | **Required** | - | Explicit allowed origin (e.g. `https://app.debtlens.ai`) |
| `MONGODB_URI` | **Required** | - | Production MongoDB connection URI with authentication & TLS |
| `MONGODB_DEBUG` | Optional | `false` | Must remain `false` in production |
| `JWT_SECRET` | **Required** | - | High-entropy secret (minimum 32 characters) |
| `JWT_EXPIRES_IN` | Optional | `7d` | Token expiration window |
| `RATE_LIMIT_WINDOW_MS` | Optional | `900000` | Rate limiting sliding window in ms (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Optional | `1000` | Max requests per IP per window |
| `DEMO_MODE` | **Required** | `true` | Set to `false` for live enterprise analysis only |
| `GITHUB_CLIENT_ID` | Optional | - | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | Optional | - | GitHub OAuth App Client Secret |
| `GITHUB_WEBHOOK_SECRET` | Optional | - | Shared secret for HMAC-SHA256 webhook validation |
| `MAX_REPOSITORY_SIZE_MB`| Optional | `250` | Maximum cloneable repo disk footprint (MB) |
| `MAX_ANALYSIS_FILES` | Optional | `5000` | Maximum source files analyzed per run |
| `MAX_FILE_SIZE_MB` | Optional | `2` | Maximum individual source file size (MB) |
| `MAX_COMMITS` | Optional | `1000` | Git commit history depth limit |
| `GIT_CLONE_TIMEOUT_MS` | Optional | `60000` | Clone timeout in ms (60 seconds) |
| `ANALYSIS_TIMEOUT_MS` | Optional | `180000` | Total analysis timeout in ms (3 minutes) |
| `ANALYSIS_WORKSPACE_DIR`| Optional | `./.analysis-workspaces` | Directory for ephemeral Git workspaces |
| `NEXT_PUBLIC_API_URL` | **Required** | - | Public URL for backend API (e.g. `https://api.debtlens.ai/api`) |
| `NEXT_PUBLIC_APP_NAME`| Optional | `DebtLens AI` | Brand platform title |
| `NEXT_PUBLIC_DEMO_MODE`| Optional | `false` | Frontend demo mode flag |

---

## 3. MongoDB Configuration & Readiness

### Connection Pooling & Resilience
The backend is pre-configured with production connection pooling and automatic retries in `backend/src/config/database.ts`:
- `serverSelectionTimeoutMS`: `5000`
- `connectTimeoutMS`: `5000`
- `maxPoolSize`: `10`
- `minPoolSize`: `2`
- `retryWrites`: `true`

### Verified Database Indexes
Confirm the following indexes exist in production MongoDB:

```javascript
// Repository
db.repositories.createIndex({ owner: 1, name: 1 }, { unique: true });
db.repositories.createIndex({ status: 1 });
db.repositories.createIndex({ isDemo: 1 });

// Analysis
db.analyses.createIndex({ repositoryId: 1, createdAt: -1 });
db.analyses.createIndex({ status: 1 });
db.analyses.createIndex({ isDemo: 1 });

// FileMetric
db.filemetrics.createIndex({ analysisId: 1, debtScore: -1 });
db.filemetrics.createIndex({ analysisId: 1, filePath: 1 });
db.filemetrics.createIndex({ analysisId: 1, riskCategory: 1 });

// Hotspot
db.hotspots.createIndex({ analysisId: 1, rank: 1 });
db.hotspots.createIndex({ analysisId: 1, riskLevel: 1 });

// DebtItem
db.debtitems.createIndex({ repositoryId: 1, debtItemId: 1 }, { unique: true });
db.debtitems.createIndex({ repositoryId: 1, currentStatus: 1 });
db.debtitems.createIndex({ repositoryId: 1, priority: 1 });

// EngineeringAlert
db.engineeringalerts.createIndex({ repositoryId: 1, status: 1, createdAt: -1 });

// PredictiveAssessment
db.predictiveassessments.createIndex({ repositoryId: 1, generatedAt: -1 });
db.predictiveassessments.createIndex({ repositoryId: 1, analysisId: 1 });

// RepositoryConnection
db.repositoryconnections.createIndex({ provider: 1, providerRepositoryId: 1 }, { unique: true });
db.repositoryconnections.createIndex({ repositoryId: 1 });
```

---

## 4. Backend Deployment Procedure

### Build Step
```bash
cd backend
npm ci --omit=dev
npm run build
```

### Process Management with PM2
Create or update `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'debtlens-backend',
      script: './dist/app.js',
      cwd: './backend',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
      max_memory_restart: '1G',
      kill_timeout: 5000,
      listen_timeout: 8000,
    },
  ],
};
```

Launch:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
```

---

## 5. Frontend Deployment Procedure

### Build Step
```bash
cd frontend
npm ci
npm run build
```

### Production Execution with Next.js Standalone / PM2
```bash
npm run start -- -p 3000
```
Or with PM2:
```javascript
{
  name: 'debtlens-frontend',
  script: 'node_modules/next/dist/bin/next',
  args: 'start -p 3000',
  cwd: './frontend',
  instances: 2,
  exec_mode: 'cluster',
  env_production: {
    NODE_ENV: 'production',
  },
}
```

---

## 6. GitHub Integration & Webhook Security

### OAuth App Registration
1. In GitHub Organization Settings → Developer Settings → OAuth Apps:
   - **Application Name**: `DebtLens AI`
   - **Homepage URL**: `https://app.debtlens.ai`
   - **Authorization callback URL**: `https://api.debtlens.ai/api/github/callback`
2. Obtain `Client ID` and generate `Client Secret`.
3. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in backend production environment.

### Webhook Configuration
1. In target GitHub Repositories → Settings → Webhooks:
   - **Payload URL**: `https://api.debtlens.ai/api/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: Copy from `GITHUB_WEBHOOK_SECRET`
   - **Events**: Select `Pushes`, `Pull requests`, and `Releases`.
2. All incoming webhooks are validated with `crypto.timingSafeEqual` over HMAC-SHA256 signatures before processing.

---

## 7. Network Security & Reverse Proxy

### CORS Enforcement
- Production backend will ONLY accept requests matching `CORS_ORIGIN`.
- Never use wildcard `*` with credentials.
- Pre-flight `OPTIONS` requests are answered with cached headers (`max-age: 86400`).

### Nginx Example Configuration
```nginx
# Backend Reverse Proxy
server {
    server_name api.debtlens.ai;
    listen 443 ssl http2;

    ssl_certificate /etc/letsencrypt/live/api.debtlens.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.debtlens.ai/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

---

## 8. Health Check Verification

Test backend availability and database connectivity:
```bash
curl -f https://api.debtlens.ai/health
```

Expected response (`HTTP 200`):
```json
{
  "success": true,
  "status": "healthy",
  "service": "DebtLens AI Intelligence Core",
  "version": "1.0.0",
  "demoMode": false,
  "api": "healthy",
  "database": {
    "isConnected": true,
    "status": "connected"
  },
  "uptime": 120
}
```

---

## 9. Rollback Procedure

If a critical fault or degradation is detected post-deployment:

### 1. Identify Last Known Good Build
```bash
git log -n 5 --oneline
```

### 2. Roll Back Backend
```bash
git checkout <PREVIOUS_STABLE_COMMIT>
npm --prefix backend ci --omit=dev
npm --prefix backend run build
pm2 restart debtlens-backend
```

### 3. Roll Back Frontend
```bash
npm --prefix frontend ci
npm --prefix frontend run build
pm2 restart debtlens-frontend
```

### 4. Database Migrations / Schema Compatibility
DebtLens AI schemas are backward-compatible and additive. Rolling back code does not require dropping MongoDB collections.

---

## 10. Common Production Failure Modes & Triage

| Symptom | Root Cause | Immediate Action |
|---|---|---|
| `504 Gateway Timeout` during analysis | Repository exceeds clone or analysis timeout | Check `GIT_CLONE_TIMEOUT_MS` and `ANALYSIS_TIMEOUT_MS`. Verify repository size is < 250MB. |
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB daemon stopped or unreachable | Check MongoDB Atlas IP whitelist or systemd status (`systemctl status mongod`). |
| `CORS_FORBIDDEN` | Frontend origin does not match `CORS_ORIGIN` | Update backend `CORS_ORIGIN` to match exact frontend scheme, hostname, and port. |
| `INVALID_URL` | User entered localhost or internal IP | Valid security rejection (SSRF protection). Instruct user to provide public HTTPS Git URL. |
| Memory spike / OOM | Extremely large commit diffs | Verify `MAX_COMMITS=1000` is active in environment. |

---

## 11. Post-Deployment Monitoring Checklist
- [ ] Uptime monitoring configured on `/health` endpoint
- [ ] Error logs monitored for unhandled exceptions
- [ ] Disk usage monitored on `.analysis-workspaces`
- [ ] MongoDB connection pool monitored (< 80% saturation)
- [ ] HTTP response latency p95 < 250ms for telemetry endpoints
