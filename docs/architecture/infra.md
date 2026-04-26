# Infrastructure Reference

## Backend — `career-jump-aws` stack (`career-jump-aws-poc`)

All resources in `us-east-1`. Defined in `template.yaml` (AWS SAM), deployed via `sam deploy`.

### AWS Resources

| Resource | Name | Purpose |
|----------|------|---------|
| S3 | `FrontendBucket` | Hosts vanilla JS app assets |
| CloudFront | `FrontendDistribution` | HTTPS entrypoint for vanilla app; HTTP→HTTPS redirect |
| Cognito User Pool | `UserPool` | Single-user auth; admin-created-only |
| Cognito Client | `UserPoolClient` | OAuth2 PKCE browser flow |
| Cognito Domain | `UserPoolDomain` | Hosted login UI |
| Lambda | `career-jump-aws-poc-api` | HTTP handler (30s, 512MB, 20 reserved concurrency) |
| Lambda | `career-jump-aws-poc-run-orchestrator` | Fans out scans (60s, 256MB, 1 reserved) |
| Lambda | `career-jump-aws-poc-scan-company` | Per-company ATS fetch (180s, 256MB, 40 reserved) |
| Lambda | `career-jump-aws-poc-finalize-run` | Merges results, sends email (300s, 512MB, 1 reserved) |
| Lambda Function URL | `ApiFunctionUrl` | Direct HTTPS API endpoint (no API Gateway cost) |
| DynamoDB | `career-jump-aws-poc-state` | Single-table, all state (PAY_PER_REQUEST) |
| EventBridge Scheduler | Weekday schedules | Scans every 3 hrs, Mon–Fri, 6am–9pm ET |
| CloudWatch Logs | 4 log groups | One per Lambda, 1-day retention |
| AWS Budgets | Monthly budget | Alerts at 60% + 100% of $5/month |

### Services Intentionally Excluded

API Gateway, Step Functions, NAT Gateway, RDS, ALB, EC2, Fargate, OpenSearch, ElastiCache.

### Lambda Build

All Lambdas: Node.js 22.x, arm64, esbuild (CJS, es2022, minified).

---

## React Frontend — `career-jump-web-poc` stack (new, isolated)

> **Not yet deployed.** These are the planned resources.

### Naming Convention

All new resources use prefix `cj-web-*` to avoid collisions with the `career-jump-*` vanilla stack.

| Resource | Name |
|----------|------|
| S3 bucket | `cj-web-static-poc-<accountId>` |
| CloudFront | `cj-web-cdn-poc` |
| ACM cert | `cj-web-poc-cert` |
| Route53 record | `web.career-jump.app` (when domain added) |
| CFN stack | `career-jump-web-poc` |

### Tags on All New Resources

```
App=career-jump-web
Stack=react-rebuild
Environment=poc
Owner=dipak
```

### Deployment Flow (planned)

```
git push → GitHub Actions workflow
  → npm run build
    → dist/ uploaded to s3://cj-web-static-poc-<acct>/
      → CloudFront invalidation (/* paths)
```

### What Stays Shared

Both the vanilla app and the React app call the same API Lambda Function URL. No backend duplication. Same DynamoDB, same Cognito, same data.

---

## Local Development

```bash
cd ~/career-jump-web

# Dev server (mock mode auto-enabled at localhost)
npm run dev          # → http://localhost:5173

# Demo mode (explicit mock flag)
# Open http://localhost:5173/?demo=1

# Production build
npm run build        # → dist/

# Preview production build
npm run preview      # → http://localhost:4173
```

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_API_BASE_URL` | Real backend URL (set at build time for production) | Empty (uses mock) |
| `VITE_USE_MOCKS` | Force mock mode | `true` in dev |

---

## Cost

Backend stays within AWS free tier / under $5/month. React hosting:
- S3: < $0.01/month (static files, single user)
- CloudFront: free tier (first 1TB/month, 10M requests)
- Total additional cost: ~$0
