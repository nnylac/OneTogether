# OneTogether Work Plan

This file tracks the current development direction after resetting the backend to a fresh NestJS modular scaffold.

## Current State

| Area | Status |
|---|---|
| Frontend role areas: public, responder, government | Present |
| Backend NestJS scaffold | Present |
| Backend modules | Generated |
| Backend business logic | Mostly not implemented |
| Backend persistence | Not selected yet |
| Prisma | Not part of the current plan |
| AWS infrastructure manifests | Present for later integration |

## Backend Module Plan

The backend modules are domain-based:

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

See `apps/backend/README.md` for detailed module responsibilities.

## Priority 1 - Backend Foundations

| Feature | Goal | Notes |
|---|---|---|
| Health endpoint | Provide a stable backend health route | Done: `GET /api/health` |
| Auth baseline | Define role model and guards | Public, responder, government |
| Users model | Define basic user shape | Keep separate from organisations |
| Organisations model | Define agencies/partners | SCDF, SPF, hospitals, NEA, PUB, relief groups |
| Incident model | Define core incident DTOs | Status, severity, location, assigned organisations |
| API contracts | Match frontend data needs | Start with mock/in-memory service if DB is not ready |

## Priority 2 - Core Workflows

| Feature | Goal | Notes |
|---|---|---|
| Create incident | Public/responder/government can submit incidents | `POST /api/incidents` |
| List incidents | Role-filtered incident lists | Government all, responder assigned/public |
| Incident room | Discussion, logs, report scaffold | Add WebSocket events once HTTP flow works |
| Resource assignment | Assign resources to incidents | Resources should link to organisations |
| Broadcasts | Create and publish emergency messages | Later connect to notifications/SNS |
| Volunteer/community | Tasks, workshops, signups | Merged into `volunteer` module |

## Priority 3 - Maps And Real-Time

| Feature | Goal | Notes |
|---|---|---|
| Maps API | Provide marker data for UI maps | `maps` reads from incidents/resources |
| Incident room map | Show context for one incident | Nearby resources, assigned units, location |
| Government map | Show all incidents | Role guard required |
| Responder map | Show assigned/relevant incidents | Role-filtered |
| Notifications gateway | Real-time in-app notifications | Can start with simple WebSocket events |
| Incident room gateway | Real-time collaboration | Join by incident room |

## Priority 4 - Later Features

| Feature | Goal | Notes |
|---|---|---|
| Analytics | Government dashboard aggregates | Implement after persistence is stable |
| Uploads | Incident images/evidence | Implement later with S3 integration |
| External agency integrations | SCDF/SPF/hospital/NEA/PUB adapters | Put under `integrations` |
| Event pipeline | Publish backend events to AWS | SQS/SNS/EventBridge later |
| AI features | Advisory, sitrep, broadcast drafts | Keep provider-specific code isolated |

## Suggested Work Split

| Person | Area |
|---|---|
| A | Auth, users, organisations |
| B | Incidents and incident room |
| C | Resources, volunteer, broadcasts |
| D | Maps, notifications, integrations/AI |

## Key Files

| File | What it does |
|---|---|
| `README.md` | Top-level repo overview |
| `RUNNING.md` | Local run instructions |
| `apps/backend/README.md` | Backend structure and module guide |
| `apps/backend/src/app.module.ts` | Imports backend modules |
| `apps/backend/src/main.ts` | Starts Nest on `/api`, port `3001` |
| `apps/frontend/src/App.tsx` | Frontend route layout |
| `infrastructure/terraform/` | AWS infrastructure definitions |
| `infrastructure/k8s/` | Kubernetes deployment manifests |

## Notes For The Team

- Do not split backend code into `public`, `responder`, and `government` folders. Use roles and guards.
- Keep modules domain-based, not page-based.
- Do not add Prisma unless the team explicitly chooses it later.
- Add repositories only when storage logic starts becoming real.
- Keep AWS/external system code inside `integrations`.
