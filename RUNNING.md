# Running OneTogether

Two ways to run the app. For day-to-day development use **Option A** — it's faster.
Use **Option B** only when you want to test the exact Docker build before pushing.

---

## What is what

| Thing | What it is | Local port |
|---|---|---|
| Frontend | React + Vite app (the UI) | 5173 (dev) / 3000 (Docker) |
| Backend | NestJS API server | 3001 |

---

## Option A — Run locally with Node (for development)

This is the normal way. No Docker needed.

### Prerequisites
- [Node.js 20](https://nodejs.org/) — check with `node -v`

### Steps

```bash
# 1. Install all dependencies (run once, or when package.json changes)
npm install

# 2. Start both frontend + backend together
npm run dev
```

That's it. Open your browser:
- **Frontend (the app):** http://localhost:5173
- **Backend (the API):** http://localhost:3001

The frontend dev server automatically proxies `/api` requests to the backend, so you don't need to configure anything.

### Useful individual commands

```bash
# Run only the frontend
npm run dev:web

# Run only the backend
npm run dev:api

# Type-check everything
npm run lint
```

---

## Option B — Run with Docker (test the prod build locally)

Use this when you want to check that the Docker images build correctly, or to
test the production nginx setup before pushing. You need Docker Desktop installed.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — check with `docker -v`

### Steps

```bash
# 1. Build both images and start both containers
docker compose up --build

# To stop:
docker compose down
```

Open your browser:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001

> The frontend container uses `nginx.local.conf` (not `nginx.conf`) so that
> `/api` calls are proxied to the backend container. In production, CloudFront
> handles this routing instead.

### Rebuild a single service

```bash
# Only rebuild the frontend image
docker compose up --build frontend

# Only rebuild the backend image
docker compose up --build backend
```

### View logs

```bash
docker compose logs -f           # all services
docker compose logs -f frontend  # just frontend
docker compose logs -f backend   # just backend
```

---

## Do I need Docker for AWS?

Short answer: **frontend — no. Backend — yes.**

Here is why:

### Frontend → S3 + CloudFront (no Docker)

The React app is just HTML, JavaScript, and CSS files after `npm run build`.
GitHub Actions runs the build and uploads the output directly to an S3 bucket.
CloudFront serves those files globally. No container is ever involved.

```
Your code → GitHub Actions → npm run build → S3 → CloudFront → users
```

The `apps/frontend/Dockerfile` exists so you can test the nginx + built app
locally (Option B above), but it is **not** used in production.

### Backend → ECR + EKS (Docker required)

The NestJS server needs to keep running permanently as a process. AWS runs it
inside Kubernetes (EKS). Kubernetes only runs Docker containers. So the backend
**must** be packaged as a Docker image.

```
Your code → GitHub Actions → docker build → push to ECR → EKS pulls it → running pod
```

ECR is AWS's private Docker image registry (like Docker Hub but private).
EKS is AWS managed Kubernetes — it pulls the image from ECR and runs it.

### The full picture

```
Push to main
  │
  ├── apps/frontend/** changed
  │     └── GitHub Actions: npm run build → upload to S3 → invalidate CloudFront
  │
  └── apps/backend/** changed
        └── GitHub Actions: docker build → push to ECR → kubectl update image → EKS rolls out
```

---

## Dockerfiles explained

Both Dockerfiles live next to their app and use a **multi-stage build**:

### `apps/frontend/Dockerfile`

| Stage | What it does |
|---|---|
| `builder` | Runs `npm run build` inside Node 20 to produce the `dist/` folder |
| `runner` | Copies `dist/` into an nginx image — no Node.js in the final image |

Final image only contains nginx + static files. Small and fast.

### `apps/backend/Dockerfile`

| Stage | What it does |
|---|---|
| `builder` | Installs all deps (including dev) and compiles TypeScript → `dist/` |
| `runner` | Copies only `dist/` + prod deps into a fresh Node image, runs as non-root |

Final image has no TypeScript compiler or dev dependencies in it.

---

## Common problems

**`npm install` fails**
Make sure you are running it from the repo root (where the root `package.json` is),
not from inside `apps/frontend` or `apps/backend`.

**Port 5173 / 3001 already in use**
Something else is using that port. Find and stop it:
```bash
# Windows (PowerShell)
netstat -ano | findstr :5173

# Mac/Linux
lsof -i :5173
```

**Docker build fails with EACCES / permission denied on `node_modules`**
The backend Dockerfile runs `npm install` as a non-root user (`appuser`). If the
`/app` directory is owned by root the install will fail with exit code 243. The fix
is already in the Dockerfile (`RUN chown appuser:appgroup /app` before `USER appuser`).
If you see this error after editing the Dockerfile, make sure that line is present.

**Docker build fails with "no such file"**
Docker builds must be run from the repo root (same folder as `docker-compose.yml`),
not from inside an `apps/` folder. The Dockerfiles use paths like
`apps/frontend/package.json` that only resolve from the root.

**Changes not showing in Docker**
Docker bakes your source code into the image at build time. After editing source
files you must rebuild: `docker compose up --build`.
For active development use Option A (Node) instead — it has hot reload.
