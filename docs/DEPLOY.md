# Release & Deployment Guide

> **Who deploys:** Dipak handles all git pushes, tagging, and AWS deploys manually. No automated CI yet.

---

## Current State

| App | Hosting | Status |
|-----|---------|--------|
| Vanilla JS app | S3 + CloudFront (`career-jump-aws-poc` stack) | Live |
| React app (`career-jump-web`) | S3 + CloudFront (`career-jump-web-poc` stack) | Live |

Current React frontend resources:
- Bucket: `cj-web-static-poc-561303652551`
- Distribution ID: `E2J6YDTMOQ1AQB`
- URL: `https://d3azoqpjm8hivh.cloudfront.net/`

---

## Local Pre-Deploy Checklist

Run before every push:

```bash
cd ~/career-jump-web

# 1. Type-check + production build
npm run build

# 2. Smoke test production bundle
npm run preview      # http://localhost:4173/
```

Manual checks to run in the preview:
- Open signup and login pages with real env vars and confirm no console errors.
- Confirm the dashboard loads after authentication.
- Verify the browser is not blocked by CSP on Cognito or Lambda requests.

---

## Versioning

```bash
# Bump package.json version when cutting a release
npm version patch   # or minor / major

# Creates a git commit + tag automatically
git push origin main --follow-tags
```

---

## AWS Deploy — Frontend Stack Updates

Use this flow whenever `infra/frontend-site.yaml` changes. CloudFront response
headers policy updates, CSP fixes, and other stack-level changes do not go live
from an S3 sync alone.

```bash
cd ~/career-jump-web

AWS_PROFILE=career-jump-personal-deployer aws cloudformation deploy \
  --stack-name career-jump-web-poc \
  --template-file infra/frontend-site.yaml \
  --parameter-overrides AppName=cj-web Stage=poc \
  --tags App=career-jump-web Stack=react-rebuild Env=poc
```

---

## AWS Deploy — Frontend Assets

Use real backend and Cognito values for production builds:

```bash
cd ~/career-jump-web

VITE_AWS_REGION=us-east-1 \
VITE_COGNITO_USER_POOL_ID=<user-pool-id> \
VITE_COGNITO_APP_CLIENT_ID=<app-client-id> \
VITE_COGNITO_DOMAIN=<cognito-domain-hostname> \
VITE_API_BASE_URL=<lambda-function-url> \
VITE_USE_MOCKS=false \
npm run build

AWS_PROFILE=career-jump-personal-deployer aws s3 sync dist/ s3://cj-web-static-poc-561303652551/ \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html"

AWS_PROFILE=career-jump-personal-deployer aws s3 cp dist/index.html s3://cj-web-static-poc-561303652551/index.html \
  --cache-control "public,max-age=0,must-revalidate"

AWS_PROFILE=career-jump-personal-deployer aws cloudfront create-invalidation \
  --distribution-id E2J6YDTMOQ1AQB \
  --paths "/index.html"
```

---

## CSP Troubleshooting

If Cognito signup or login fails in the browser with a generic network error,
check the DevTools Console before changing app code.

Example signal:
- `Refused to connect to https://cognito-idp.us-east-1.amazonaws.com/`

That means the frontend stack needs a CloudFront policy deploy, not just a fresh
asset sync.

---

## GitHub Actions (Planned)

A future `deploy.yml` workflow can automate the stack deploy, asset sync, and
CloudFront invalidation on push to `main`. Until then, the manual commands above
are the deploy path.
