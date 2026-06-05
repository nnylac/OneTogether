# Running OneTogether

Use local Node development for the current repo state. Docker/Kubernetes infrastructure exists as deployment planning, but local Docker Compose is not ready until app Dockerfiles are added.

## What Is What

| Thing | What it is | Local port |
|---|---|---|
| Frontend | React + Vite app | 5173 |
| Backend | NestJS API server | 3001 |

## Run Locally With Node

### Prerequisites

- Node.js 20 or newer
- npm

### Steps

```bash
npm install
npm run dev
```

Open:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:3001/api
```

The frontend Vite server proxies `/api` requests to `http://localhost:3001`.

## Useful Commands

```bash
# Run only the frontend
npm run dev:web

# Run only the backend
npm run dev:api

# Build frontend and backend
npm run build

# Lint frontend and backend
npm run lint
```

Backend-only commands can also be run from `apps/backend`:

```bash
npm run start:dev
npm run build
npm run test
npm run test:e2e
```

## Docker Status

`docker-compose.yml` is still present as a deployment/local-container placeholder, but these files are not currently in the repo:

```txt
apps/backend/Dockerfile
apps/frontend/Dockerfile
apps/frontend/nginx.local.conf
```

Until those are added, use the Node workflow above.

## AWS Deployment Direction

The intended production direction is still:

```txt
Frontend build -> S3 + CloudFront
Backend image  -> ECR + EKS
Events/data    -> SQS, SNS, EventBridge, Lambda, S3
Auth later     -> Cognito
```

The backend should connect to infrastructure through the `apps/backend/src/integrations` module as features are implemented.

## Common Problems

**`npm install` fails**

Run it from the repository root, not from inside `apps/frontend` or `apps/backend`.

**Port 5173 or 3001 is already in use**

On Windows PowerShell:

```powershell
netstat -ano | findstr :5173
netstat -ano | findstr :3001
```

Stop the conflicting process or change the app port.

**Backend starts on the wrong port**

The backend defaults to `3001`. If `PORT` is set in your shell or `.env`, that value takes priority.
