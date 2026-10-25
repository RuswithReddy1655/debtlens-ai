#!/usr/bin/env bash

# DebtLens AI - Health Check Utility
echo "===================================================="
echo "DebtLens AI - Service Health Verifier"
echo "===================================================="

BACKEND_URL="${API_URL:-http://localhost:5001/api/health}"
FRONTEND_URL="${APP_URL:-http://localhost:3000}"

echo -n "[Backend API] Checking $BACKEND_URL ... "
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL" || echo "FAILED")

if [ "$BACKEND_STATUS" = "200" ]; then
  echo "ONLINE (HTTP 200)"
  curl -s "$BACKEND_URL" | grep -o '"status":"healthy"' || true
else
  echo "OFFLINE or STARTING (Status: $BACKEND_STATUS)"
fi

echo -n "[Frontend Next.js] Checking $FRONTEND_URL ... "
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" || echo "FAILED")

if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "ONLINE (HTTP 200)"
else
  echo "OFFLINE or STARTING (Status: $FRONTEND_STATUS)"
fi

echo "===================================================="
