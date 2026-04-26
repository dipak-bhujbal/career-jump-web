# Release & Deployment Guide

> **Who deploys:** Dipak handles all git pushes, tagging, and AWS deploys manually. No automated CI yet.

---

## Current State

| App | Hosting | Status |
|-----|---------|--------|
| Vanilla JS app | S3 + CloudFront (`career-jump-aws-poc` stack) | Live |
| React app (`career-jump-web`) | Local only | Not yet deployed |

---

## Local Pre-Deploy Checklist

Run before every push:

```bash
cd ~/career-jump-web

# 1. Type-check + production build
npm run build

# 2. Smoke test production bundle
npm run preview      # http://localhost:4173/?demo=1
```

Manual checks to run in the preview:
- Open Add Widget → search, category/type filters work
- Click a job row → split pane opens, drawer shows correctly
- Add a note → note appears instantly
- Drag a Kanban card to Offered → confetti fires
- First visit (clear `cj_onboarded` from localStorage) → command palette auto-opens

---

## Versioning

```bash
# Bump package.json version (e.g. 0.1.0 → 0.2.0)
npm version minor   # or patch / major

# Creates a git commit + tag automatically
git push origin main --follow-tags
```

---

## AWS Deploy — React Frontend (First Time)

> One-time setup. Requires AWS CLI + SAM CLI configured.

### 1. Add React infra to `career-jump-aws/template.yaml`

Add isolated S3 + CloudFront resources with `cj-web-*` naming under a condition or as a separate parameter-gated section. Logical names must not collide with existing `FrontendBucket` / `FrontendDistribution`.

### 2. Deploy as a separate stack

```bash
cd ~/career-jump-aws

sam build
sam deploy \
  --stack-name career-jump-web-poc \
  --capabilities CAPABILITY_IAM \
  --tags App=career-jump-web Stack=react-rebuild Environment=poc Owner=dipak \
  --parameter-overrides ReactSiteEnabled=true \
  --resolve-s3 \
  --no-confirm-changeset
```

### 3. Get the S3 bucket name and CloudFront domain

```bash
aws cloudformation describe-stacks \
  --stack-name career-jump-web-poc \
  --query "Stacks[0].Outputs"
```

### 4. Build React app with real API URL

```bash
cd ~/career-jump-web
VITE_API_BASE_URL=<lambda-function-url> npm run build
```

### 5. Sync to S3

```bash
aws s3 sync dist/ s3://cj-web-static-poc-<accountId>/ \
  --delete \
  --cache-control "max-age=31536000,immutable" \
  --exclude "index.html"

# index.html must not be long-cached
aws s3 cp dist/index.html s3://cj-web-static-poc-<accountId>/index.html \
  --cache-control "no-cache"
```

### 6. Invalidate CloudFront

```bash
aws cloudfront create-invalidation \
  --distribution-id <dist-id> \
  --paths "/*"
```

---

## AWS Deploy — Subsequent Releases

```bash
cd ~/career-jump-web
VITE_API_BASE_URL=<lambda-function-url> npm run build

aws s3 sync dist/ s3://cj-web-static-poc-<accountId>/ \
  --delete \
  --cache-control "max-age=31536000,immutable" \
  --exclude "index.html"

aws s3 cp dist/index.html s3://cj-web-static-poc-<accountId>/index.html \
  --cache-control "no-cache"

aws cloudfront create-invalidation \
  --distribution-id <dist-id> \
  --paths "/*"
```

---

## GitHub Actions (Planned)

A future `deploy.yml` workflow will automate the sync + invalidation on push to `main`. Until then, the manual commands above are the deploy path.

Planned workflow steps:
1. Checkout
2. `npm ci`
3. `npm run build` (with `VITE_API_BASE_URL` from Actions secret)
4. `aws s3 sync dist/ s3://...`
5. `aws cloudfront create-invalidation`

---

## A/B Testing — Switching Between Vanilla and React

Both apps are live simultaneously at different URLs:

| App | URL |
|-----|-----|
| Vanilla | Current CloudFront URL (unchanged) |
| React | `cj-web-cdn-poc` CloudFront URL |

To cut over: update Route53 to point `career-jump.app` (or your domain) to the React CloudFront distribution. Vanilla stays as fallback.
