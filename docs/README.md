# Career Jump Web — Documentation

New to the project? Start here.

---

## What Is This?

`career-jump-web` is a React rebuild of the Career Jump job-tracking UI. It targets the same AWS backend (`career-jump-aws`) as the existing vanilla app. The goal is a richer, more maintainable frontend — deployed in isolation for A/B testing before a full cutover.

**The backend is not being rebuilt.** All Lambda/DynamoDB/ATS scraping work stays in `career-jump-aws`.

---

## Quick Navigation

| Doc | What it covers |
|-----|---------------|
| [Architecture Overview](architecture/overview.md) | System diagram, three repos, AWS infra, ATS adapters, tech stack |
| [API Flows](architecture/api-flows.md) | Every `/api/*` endpoint, request/response shape |
| [Infrastructure](architecture/infra.md) | AWS resources, naming conventions, isolation strategy, local dev |
| [Feature Logic](architecture/features.md) | How each major feature works — drawer, notes, kanban, split pane |
| [Roadmap](roadmap/README.md) | What was built (waves 1–3), what's next (wave 4), what's pending for production |
| [Decision Log](decisions/log.md) | Architectural decisions, rationale, alternatives considered |
| [Deploy Guide](DEPLOY.md) | Build, version, deploy to AWS, A/B switch |
| [Release Runbook](RELEASE_RUNBOOK.md) | Step-by-step release checklist for Dipak |

---

## State of the Project

```
career-jump (Cloudflare)  ──────  Live production MVP. DO NOT TOUCH.
career-jump-aws           ──────  Backend. Active, deployed, API is live.
career-jump-web (this)    ──────  React UI rebuild. Mock-only. Not yet deployed.
```

The React app runs entirely on mock data today. To go live, it needs:
1. `VITE_API_BASE_URL` set to the Lambda Function URL
2. Cognito auth wired up (login redirect, token refresh)
3. Deployed to `cj-web-static-poc-<acct>` S3 + `cj-web-cdn-poc` CloudFront
4. Error handling for real API failures

---

## Why No ATS Files Here?

ATS scraping (Greenhouse, Lever, Ashby, Workday, etc.) is a **backend concern**. The ATS adapters live in `career-jump-aws/src/ats/`. The React app never touches ATS logic — it consumes the normalized job data the backend produces via `/api/jobs`. The 16+ ATS adapters are invisible to the frontend.

---

## Getting Started (Local Dev)

```bash
cd ~/career-jump-web
npm install
npm run dev
# Open http://localhost:5173/?demo=1
```

Everything works in mock mode — no backend required.
