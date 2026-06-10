# OneTogether

Centralized Singapore emergency and disaster response prototype.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: NestJS + TypeScript modular API scaffold
- Infrastructure: AWS-oriented Terraform and Kubernetes manifests for later deployment

## Repository Layout

```txt
apps
  frontend    React role-based UI
  backend     NestJS API scaffold
  uploads     Local uploaded demo files

infrastructure
  terraform   AWS infrastructure definitions
  k8s         Kubernetes manifests
  lambdas     Event/data pipeline Lambda prototypes
```

## Backend Shape

The backend is a modular NestJS app. Public, responder, and government are treated as roles, while modules are split by business domain:

```txt
auth
users
organisations
incidents
incident-room
resources
broadcasts
volunteer
notifications
maps
ai
integrations
```

See [apps/backend/README.md](apps/backend/README.md) for the full backend structure and module responsibilities.

## Run Locally

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173

Backend API: http://localhost:3001/api

The frontend Vite dev server proxies `/api` requests to the backend during local development.

## Useful Commands

```bash
npm run dev:web
npm run dev:api
npm run build
npm run lint
```

## Demo Interfaces

The frontend currently has three role-based interface areas:

- Public/citizen: `/public`
- Responder/organisation: `/responder`
- Government: `/government`

Demo login flows may still be mock-driven until real authentication is wired into the new backend.

The government analytics page is available at `/government/analytics`. It uses
`GET /api/analytics/overview` for live multi-agency KPI, distribution and
organisation performance data, and `GET /api/analytics/forecast` for an
automatic seven-day simulation forecast. The dependency-free visuals include
switchable bar and doughnut charts, workload comparisons, resolution metrics
and recency-weighted incident projections with explicit uncertainty.
