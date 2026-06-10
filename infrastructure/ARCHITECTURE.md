# OneTogether — Corrected AWS Architecture

> **Purpose.** This document reconciles the older `ShihTzu10.0.drawio` architecture diagram against the
> **actual deployed implementation**. The original diagram describes a maximal "everything-on" AWS design.
> In reality a large part of it is *declared in Terraform but never wired into the running request/data path*.
> This document is the authoritative source of truth for what is **actually used**, what is **orphaned**, the
> **real authentication flow**, end-to-end **request flows**, and **what to add or remove**.

- **Live URL:** `https://d34fq0fyxyo5jn.cloudfront.net/`
- **AWS account:** `461802173878` · **Region:** `ap-southeast-1` (Singapore)
- **Repo shape:** monorepo — `apps/frontend` (React 19 + Vite, Chakra UI), `apps/backend` (NestJS + Prisma +
  Socket.IO), `apps/external` (incident/agency simulators), `infrastructure/` (Terraform + K8s + Lambdas + CI/CD).

---

## 1. TL;DR — what's real vs. what's decoration

**The live system is deliberately simple:**

```
Browser → CloudFront → ( S3 static SPA ) + ( /api,/socket.io → internet-facing ALB → EKS NestJS pods → RDS )
                                                                              └→ ElastiCache (Redis) for Socket.IO fan-out
Incidents are pushed in by apps/external simulators → POST /api/incident-middleware/events → RDS.
```

**Everything else on the old diagram — Cognito, the SQS→Lambda→EventBridge→Bedrock→SNS pipeline, the S3 data
lake, Route53/ACM custom domain, WAF, and the Prometheus/Grafana stack — is declared or scaffolded but NOT in
the live path.** Auth is a **self-hosted JWT** implementation; **Singpass and Cognito are not implemented**.

---

## 2. Service-by-service reality check

Legend: ✅ used in live path · ⚠️ partially used / conditional · ❌ declared but orphaned / disabled.

| AWS service | Declared | Live? | Verdict & why |
|---|:---:|:---:|---|
| **VPC** (`10.0.0.0/16`, 2 AZ, public/private/db tiers) | ✅ | ✅ | **USED** — foundation for everything. |
| **NAT Gateway** ×2 (1/AZ, +2 EIPs) | ✅ | ✅ | **USED** — egress for private-subnet EKS nodes & RDS. *Keep even after Lambda removal.* |
| **Internet Gateway** | ✅ | ✅ | **USED** — public subnet ingress/egress. |
| **EKS** (v1.30, managed nodegroup t3.medium, 2→6) | ✅ | ✅ | **USED** — runs the NestJS backend. |
| **ECR** | ✅ | ✅ | **USED** — backend container image registry. |
| **RDS PostgreSQL 16** (Multi-AZ, private, encrypted) | ✅ | ✅ | **USED** — single source of truth via Prisma. **Requires TLS** (`?sslmode=no-verify`) or every query 500s. |
| **ALB** (created by AWS LB Controller) | ✅ | ✅ | **USED** — internet-facing; serves `/api/*` and `/socket.io/*`. *Live listener is HTTP (see Route53/ACM).* |
| **CloudFront** | ✅ | ✅ | **USED** — serves the SPA from S3 (OAC) and proxies `/api/*` + `/socket.io/*` to the ALB origin. |
| **S3 — frontend bucket** | ✅ | ✅ | **USED** — static SPA hosting behind CloudFront OAC. |
| **ElastiCache (Valkey/Redis)** | ✅ | ✅ | **USED** — Socket.IO Redis adapter for cross-pod broadcast (`REDIS_URL`). Falls back to in-memory if unset. |
| **Secrets Manager** | ✅ | ⚠️ | **PARTIAL** — `database` + `cache` secrets are consumed by CI→K8s. The **`cognito` secret is never read**. |
| **CloudWatch** | ✅ | ⚠️ | **LOGS ONLY** — EKS control-plane / Lambda / RDS log groups. **No alarms, no dashboards, no app metrics.** |
| **S3 — data lake** | ✅ | ❌ | **ORPHANED** — only read/written by the Lambda chain, which never fires. |
| **SQS** (queue + DLQ) | ✅ | ❌ | **ORPHANED — no producer.** The backend writes incidents **straight to RDS**; nothing calls SQS `SendMessage`. |
| **Lambda — ProcessIncident** | ✅ | ❌ | **ORPHANED** — SQS-triggered, but the queue is always empty. |
| **Lambda — DataIngestion** | ✅ | ❌ | **ORPHANED** — only fired by ProcessIncident's EventBridge event (never emitted). |
| **Lambda — AIAdvisory** (Bedrock Claude) | ✅ | ❌ | **ORPHANED** — same dead chain; Bedrock + SNS never invoked in practice. |
| **EventBridge** (custom bus + 2 rules) | ✅ | ❌ | **DEAD UPSTREAM** — wired Lambda→Lambda, but the only publisher (ProcessIncident) never runs. |
| **SNS** (alerts topic + email sub) | ✅ | ❌ | **ORPHANED** — only publisher is AIAdvisory Lambda (dead chain). Backend never publishes. |
| **Route53** (zone + A records) | ✅ | ❌ | **DISABLED** — gated on `domain_configured` (**default false**). Live host is `*.cloudfront.net`. |
| **ACM** (CloudFront cert + ALB cert) | ✅ | ❌ | **NOT ACTIVE** — only used with a custom domain. Live uses the default CloudFront cert; CloudFront→ALB is **HTTP**. |
| **WAF** (CloudFront WebACL) | ✅ | ❌ | **OFF** — gated on `enable_waf` (**default false**). |
| **Cognito** (user pool, client, 3 groups, hosted UI) | ✅ | ❌ | **ORPHANED — zero code references.** Auth is self-hosted JWT (see §4). |
| **Prometheus / Grafana / Alertmanager** | ⚠️ (values file) | ❌ | **MANUAL-INSTALL ONLY** — a `helm` values file with an install comment; no CI deploys it, and its Grafana ingress needs the disabled domain. |
| **SES** | ❌ | ❌ | **NOT DECLARED** — diagram-only. The only "email" is the SNS topic's email subscription. |
| **Singpass / sgID / MyInfo** | ❌ | ❌ | **NOT IMPLEMENTED** — a dead login button only. |

---

## 3. Corrected architecture diagram

```
                                  ┌────────────────────────────────────────────┐
   Citizens / Responders / Gov    │                  Internet                   │
            (browser)  ───────────▶                                            │
                                  └───────────────┬──────────────┬─────────────┘
                                                  │ HTTPS        │ HTTPS
                                       static SPA │              │ /api/*  /socket.io/*
                                                  ▼              ▼
                                         ┌─────────────────────────────────┐
                                         │          CloudFront (CDN)        │
                                         │  default *.cloudfront.net cert   │
                                         │  WAF: OFF    Route53/ACM: OFF    │
                                         └───────┬──────────────────┬───────┘
                                 S3 origin (OAC) │                  │ ALB origin (HTTP today)
                                                 ▼                  ▼
                                       ┌──────────────────┐   ┌───────────────────────────┐
                                       │  S3 (frontend)   │   │  Internet-facing ALB       │
                                       │  React SPA       │   │  (k8s ingress-http.yaml)   │
                                       └──────────────────┘   └─────────────┬─────────────┘
                                                                            │  HTTP :3001
   ───────────────────────── VPC 10.0.0.0/16 (ap-southeast-1, 2 AZ) ───────┼───────────────────
   public  subnets: ALB + NAT GW ×2                                        ▼
   private subnets: ┌─────────────────────────── EKS (1.30) ───────────────────────────┐
                    │  NestJS backend pods :3001   (HPA 2→10)                           │
                    │   /api/auth/*  /api/incidents  /api/resources  /api/broadcasts    │
                    │   /api/incident-middleware/events   Socket.IO (incident-room)     │
                    └───────┬───────────────────────────┬──────────────────────┬───────┘
                            │ Prisma (TLS)               │ Redis adapter        │ Secrets at boot
                            ▼                            ▼                      ▼
   db subnets:    ┌──────────────────┐        ┌──────────────────┐    ┌──────────────────┐
                  │ RDS PostgreSQL16 │        │ ElastiCache      │    │ Secrets Manager  │
                  │ Multi-AZ private │        │ Valkey (Redis)   │    │ db + cache (used)│
                  └──────────────────┘        │ Socket.IO fanout │    │ cognito (UNUSED) │
                                              └──────────────────┘    └──────────────────┘

   External systems (apps/external: scdf, spf, singhealth, nuhs, towncouncil, pub, nea + scenario-engine):
     ► INCIDENTS  = PUSH (webhook).  sims ──HTTP POST──▶ CloudFront ──▶ ALB ──▶ /api/incident-middleware/events ──▶ RDS
     ► RESOURCES  = POLL (outbound). backend EKS pods ──HTTP GET (setInterval)──▶ sims *_RESOURCES_URL
                    [DISABLED in prod: RESOURCE_SYNC_ENABLED=false → resources are static-seeded]

   ┌──────────────── ORPHANED / NOT IN LIVE PATH (declared in Terraform, never invoked) ────────────────┐
   │  SQS (no producer) ─▶ λ ProcessIncident ─▶ EventBridge ─▶ λ DataIngestion ─▶ S3 data lake          │
   │                                                        └▶ λ AIAdvisory ─▶ Bedrock(Claude) ─▶ SNS    │
   │  Cognito (pool + groups + hosted UI)    WAF    Route53    ACM    custom-domain HTTPS                │
   │  Prometheus / Grafana / Alertmanager (manual helm, not deployed)                                   │
   └────────────────────────────────────────────────────────────────────────────────────────────────-─┘

   Observability today: CloudWatch Logs (EKS / Lambda / RDS) — NO alarms, NO dashboards, NO app metrics.
   CI/CD: GitHub Actions (OIDC, no static keys):
          deploy-infra (terraform apply) | deploy-backend (build→ECR→EKS rollout) | deploy-frontend (build→S3→CF invalidate)
```

**How to read it:** solid boxes above the orphaned panel are the real, exercised request/data path. The boxed
"ORPHANED" panel is infrastructure that exists in Terraform and costs money but is never touched at runtime.

---

## 4. Authentication — the real flow, and the Cognito question

### Is Cognito required? **No. As built today, Cognito is unnecessary and removable.**

The backend implements its **own** JWT auth; there is **zero** Cognito/Singpass code in `apps/backend/src` or
`apps/frontend/src` (the only hits are a README note and a non-functional login button).

### Current login flow (end to end)

```
1.  User submits identifier (username|email) + password           apps/frontend .../auth/pages/LoginPage.tsx
2.  POST /api/auth/login                                           apps/frontend .../auth/authApi.ts
3.  CloudFront → ALB → EKS NestJS                                  auth.controller.ts  (POST /auth/login)
4.  Look up user; verify password with PBKDF2-SHA256 (210k iters, timing-safe)   auth.service.ts
5.  Issue tokens (hand-rolled HS256, NOT the jsonwebtoken lib):
        access  token — 15 min — { sub, accountId, role, typ:'access' }
        refresh token —  7 day — { sub, accountId, typ:'refresh' }   (SHA-256 hash stored in refresh_tokens)
6.  Response { accessToken, refreshToken, user{…role…} }
7.  Frontend stores both tokens + user in localStorage            authStorage.ts
8.  Role-based redirect:  admin → /government · responder → /responder · user → /citizen   ProtectedRoute.tsx
```

Auth tables (Prisma): `users` → `accounts` (`password_hash`) → `refresh_tokens` (hash, expiry, revoked_at).

### ⚠️ The real security gap (not "missing Cognito")

Protected API routes are **not currently guarded** — there is no global `AuthGuard`, so endpoints like
`GET /api/incidents` accept unauthenticated requests, and the frontend does **not** attach the
`Authorization` header on data calls. **Fixing this is higher priority than any IdP decision.**

### Decision: pick ONE end-state for identity

- **Option A — Remove Cognito (recommended if Singpass isn't imminent).** Keep the self-hosted JWT, delete
  `cognito.tf`, the Secrets-Manager `cognito` secret, and the `COGNITO_*` CI/env vars. Add a global JWT guard.
  *Simplest; matches reality; removes dead config and attack surface.*
- **Option B — Adopt Cognito as the IdP and federate Singpass into it.** This is the **only** good reason to
  keep Cognito: Cognito (as an OIDC relying party to Singpass/`sgID`) brokers Singpass login + MFA + token
  issuance, and you delete the hand-rolled crypto. Backend then validates Cognito-issued JWTs (JWKS) instead of
  signing its own. *More moving parts; justified only if Singpass is actually on the roadmap.*

Today you carry **Option B's cost and attack surface with Option A's functionality** — the worst of both. Choose.

---

## 5. Step-by-step request flows

### 5a. Login
`Browser → CloudFront(/api/auth/login) → ALB → EKS NestJS → RDS (user/account lookup) → tokens → Browser(localStorage)`
See §4. No Cognito, no Lambda involved.

### 5b. Incident ingestion (how incidents actually appear)
```
apps/external simulators (scenario-engine + agency sims: spf, scdf, singhealth, nuhs, towncouncil, pub, nea)
   └─ HTTP POST → CloudFront → ALB → EKS  POST /api/incident-middleware/events   (public, no auth)
        └─ dedup + state reconciliation in NestJS → Prisma → RDS (incidents, logs, …)
             └─ Socket.IO broadcast (via Redis adapter) → connected incident-room clients
```
**Not seeded, not via SQS.** An empty Incidents tab means nothing is POSTing to that endpoint. SQS / the
Lambda chain play no part here.

### 5c. Incident list & map (read)
`Browser GET /api/incidents (and /api/maps/incidents/:id) → CloudFront → ALB → EKS → Prisma → RDS → JSON`.
Incidents carry `lat`/`lng`; the responder Operations Overview and Google-Maps markers render from this.

### 5d. Resources
`Browser GET /api/resources/summary | /api/resources/outlets → … → RDS`. Resource rows are **seeded static
data** (`seed-job.yaml`) with `RESOURCE_SYNC_ENABLED=false`; live feeds would require the 8 simulators running
in-cluster.

### 5e. Admin / government operations (broadcasts, dashboard, analytics)
`Browser (role=admin) → /government/* UI → GET/POST /api/broadcasts, dashboard/analytics reads → … → RDS`.
Authorization is **client-side role routing only** today (see §4 gap).

### 5f. WebSocket incident-room (live collaboration)
```
Browser  ws  /socket.io  → CloudFront → ALB (cookie stickiness) → one EKS pod (forced transport: websocket)
   ├─ join incident room, discussion messages, log updates
   └─ cross-pod fan-out via ElastiCache Redis adapter (so a message on pod A reaches a client pinned to pod B)
```
Stickiness + the Redis adapter together are why ElastiCache is genuinely required at 2+ replicas.

---

## 6. Networking

- **VPC** `10.0.0.0/16`, two AZs (`ap-southeast-1a/1b`), three subnet tiers:
  - **Public** — ALB + **2 NAT Gateways** (one per AZ, each with an EIP) + Internet Gateway.
  - **Private** — EKS worker nodes (and the orphaned Lambdas). Egress via NAT.
  - **Database** — RDS + ElastiCache; no internet route.
- **Security groups** gate tier-to-tier traffic: ALB→pods (3001), pods→RDS (5432), pods→Redis (6379).
- **Edge → origin:** CloudFront → ALB. **Today the origin listener is plain HTTP** because the custom domain is
  off (`domain_configured=false`), so the HTTPS/ACM ingress (`ingress.yaml`) is skipped by CI and the
  HTTP ingress (`ingress-http.yaml`) is applied manually. *Recommendation: finish the domain/ACM path and make
  CloudFront→ALB HTTPS.*

---

## 7. Kubernetes

- **Namespace:** `onetogether`.
- **Deployment** (`backend/deployment.yaml`): NestJS image from ECR (`…/onetogether-production-backend`), port
  3001; env from **ConfigMap** `onetogether-config` (region, and the unused SQS/EventBridge/SNS ARNs) +
  **Secret** `onetogether-secrets` (`DATABASE_URL`, `REDIS_URL`, and the unused `COGNITO_*`). `RESOURCE_SYNC_ENABLED=false`.
- **Service** (`backend/service.yaml`): ClusterIP → 3001.
- **HPA** (`backend/hpa.yaml`): min **2**, max **10**, targets CPU 70% / memory 80%.
- **Ingress:** two manifests —
  - `ingress.yaml` — internet-facing ALB, **HTTPS/ACM**, host `api.${DOMAIN_NAME}`, cookie stickiness. Applied
    by CI **only if** `DOMAIN_NAME` + `ACM_CERT_ARN` are set.
  - `ingress-http.yaml` — internet-facing ALB, **HTTP**, no host. **This is what's live**, applied manually;
    stickiness added for Socket.IO.
- **Seed job** (`backend/seed-job.yaml`): `prisma db push` + seeds orgs, demo users, and static resource rows.
- **ArgoCD** (`argocd/application.yaml`): watches `infrastructure/k8s/backend/` for GitOps sync.
- **Helm add-ons via Terraform:** cert-manager, AWS Load Balancer Controller, ArgoCD.

---

## 8. Database

- **RDS PostgreSQL 16**, Multi-AZ, private, encrypted at rest, 7-day backups, deletion-protected; `gp3`
  100→500 GB autoscale.
- **TLS is mandatory** (`rds.force_ssl`). The Prisma `pg` adapter must connect with SSL or every query fails
  (`P1010/28000 "no encryption"`) → login 500s and the pod crash-loops. Connection string uses
  **`?sslmode=no-verify`** (encrypted, skips CA verification — Amazon RDS CA isn't in Node's trust store);
  `prisma db push` (engine path) uses `?sslmode=require`.
- **Access from a private RDS:** migrate/seed locally through a `pg-proxy` (socat) pod + `kubectl port-forward`.
- **Incidents are event-driven, not seeded** — they arrive from `apps/external` simulators (§5b).

---

## 9. Monitoring & observability

- **Today:** CloudWatch **Logs** only — EKS control-plane logs, the three Lambda log groups (30-day retention),
  and RDS log exports. **No CloudWatch alarms, no dashboards, no application/business metrics.**
- **Prometheus/Grafana/Alertmanager:** a `kube-prometheus-stack` **values file exists** but is **manual
  `helm install`** (documented in a comment); **no CI deploys it**, and its Grafana ingress targets
  `grafana.internal.onetogether.sg`, which depends on the disabled custom domain. Treat as not-yet-deployed.
- **Gap:** no alerting on RDS CPU/connections/free-storage, ALB 5xx/latency/unhealthy-targets, or pod restarts.

---

## 10. CI/CD

Three GitHub Actions workflows, all using **OIDC role assumption (no static AWS keys)**:

- **`deploy-infra.yml`** — on `infrastructure/terraform/**` push to `main`: `terraform init` (S3 remote state +
  DynamoDB lock) → `validate` → `plan` (PR comment) → `apply` on `main`.
- **`deploy-backend.yml`** — on `apps/backend/**` or `infrastructure/k8s/backend/**`: build image →
  push to ECR (SHA + `latest`) → fetch Terraform outputs → create/refresh K8s **Secret** (DB + cache from
  Secrets Manager; `COGNITO_*` from Actions secrets) and **ConfigMap** → apply namespace/deployment/service/
  hpa/configmap → conditionally apply `ingress.yaml` (domain-gated) → set image tag → wait for rollout.
- **`deploy-frontend.yml`** — on `apps/frontend/**`: `vite build` (bakes `VITE_*` incl. Google Maps key &
  unused `VITE_COGNITO_*`) → `aws s3 sync` (immutable cache for hashed assets, no-store for `index.html`) →
  CloudFront invalidation.

---

## 11. The orphaned async pipeline — decide: wire it or delete it

```
(NOTHING) ──X──▶ SQS ─▶ λ ProcessIncident ─▶ EventBridge ─┬─▶ λ DataIngestion ─▶ S3 data lake (context.json)
                                                          └─▶ λ AIAdvisory ─▶ Bedrock(Claude) ─▶ S3 (advisory.json) ─▶ SNS
```

The Lambda→Lambda wiring is internally correct, but the **first hop is dead**: no code publishes to SQS, so the
whole chain — plus its S3 data lake, EventBridge bus, Bedrock advisory, and SNS alert — never executes.

Two coherent resolutions (don't keep it half-built):

- **Wire it.** Have `incident-middleware` publish validated incidents to SQS (`@aws-sdk/client-sqs`
  `SendMessage`) after the RDS write. The pipeline then produces AI advisories in S3 and SNS alerts for
  Critical incidents. Cost: real async infra to operate + monitor.
- **Delete it.** Remove `sqs.tf`, `lambda.tf`, `eventbridge.tf`, `sns.tf`, the data-lake bucket, and the
  Lambda IAM, and keep AI advisory **inline** in the NestJS `ai` module (synchronous, Bedrock or Anthropic SDK).
  Cost: less elasticity for bursty AI workloads, but far less to maintain for a prototype.

---

## 12. Recommendations (add / remove / decide)

### Remove or gate off (paying for cost + attack surface with no benefit today)
1. **Cognito** — pool/client/groups/hosted-UI + its Secrets-Manager secret + `COGNITO_*` CI/env vars — *unless*
   you commit to Option B (Cognito-fronts-Singpass) in §4.
2. **The entire async Lambda chain** (SQS, 3 Lambdas, EventBridge bus, SNS, S3 data lake) — per §11, unless wired.
3. Keep **NAT Gateways** — still required for EKS/RDS egress even after the Lambdas go.

### Add (real gaps)
4. **Enforce JWT on protected API routes** — a global `AuthGuard` + frontend `Authorization` header. *Highest priority.*
5. **CloudWatch alarms + a dashboard** — RDS (CPU/connections/free-storage), ALB (5xx/latency/unhealthy targets),
   EKS pod restarts, and Lambda errors (if the chain is kept). Or actually deploy the Prometheus stack via CI.
6. **Turn on WAF** (`enable_waf=true`) — it's already authored on the CloudFront WebACL.
7. **Finish the custom-domain/ACM path** (`domain_configured=true`) and make **CloudFront→ALB origin HTTPS** so
   the live edge isn't HTTP to origin; this also lets CI apply `ingress.yaml` instead of the manual HTTP ingress.

### Decide (one, not both)
8. **Identity:** Option A (remove Cognito, keep JWT) **or** Option B (Cognito + Singpass federation) — §4.
9. **Async/AI:** wire the SQS→Lambda→Bedrock→SNS pipeline **or** delete it and do AI advisory inline — §11.

---

## 13. External systems & data-ingestion direction

The `apps/external` package is the **simulation engine** standing in for real agency systems — **SCDF, SPF,
SingHealth, NUHS, Town Council, PUB, NEA** — plus a `scenario-engine` that orchestrates them. Traffic between
these systems and the backend flows in **two opposite directions**, and it matters operationally:

```
   ┌──────────────────────── apps/external (simulated agency systems) ───────────────────────┐
   │  scenario-engine ──drives──▶ scdf · spf · singhealth · nuhs · towncouncil · pub · nea    │
   └───────────────┬───────────────────────────────────────────────────────▲─────────────────┘
                   │ (1) INCIDENTS — PUSH / webhook                         │ (2) RESOURCES — POLL
                   │     HTTP POST  {MIDDLEWARE_URL}/events                  │     HTTP GET  *_RESOURCES_URL
                   ▼                                                        │     (backend initiates)
        CloudFront ─▶ ALB ─▶ EKS  POST /api/incident-middleware/events      │
                   (no auth, public webhook)                                │
                        │ dedup + reconcile → Prisma → RDS                  │
                        └─ Socket.IO broadcast (Redis) ─▶ incident-room     │
                                                                            │
        EKS backend resources.service.ts  ── setInterval GET ──────────────┘
                        (DISABLED in prod: RESOURCE_SYNC_ENABLED=false)
```

**(1) Incidents — PUSH, through the ALB (webhook).** Each agency sim emits raw messages with
`self.http.post(f"{MIDDLEWARE_URL}/events")` (`apps/external/shared/base_agency.py:512`). In production
`MIDDLEWARE_URL` points at `https://<cloudfront>/api/incident-middleware`, so the call traverses
**CloudFront → ALB → EKS** and lands on `POST /api/incident-middleware/events` (public, no auth). The backend
deduplicates, reconciles state, writes to RDS, and broadcasts over Socket.IO. **This is the only way incidents
enter the system** — they are *not* seeded and do *not* go through SQS. An empty Incidents tab means nothing is
POSTing to that endpoint.

**(2) Resources — POLL, initiated by the backend (outbound).** `resources.service.ts` runs a `setInterval`
loop (`:81`) that does `fetch()` against per-agency `*_RESOURCES_URL` endpoints (e.g.
`SCDF_RESOURCES_URL`, default `http://localhost:8102/resources`, `:504-516`). Here the **backend is the
client** pulling from the sims — the reverse direction of incidents. **This poller is OFF in production**
(`RESOURCE_SYNC_ENABLED=false`, `:528`); resource rows are static-seeded by the seed job. Live resource feeds
would require deploying the 8 sims in-cluster with cluster-DNS `*_RESOURCES_URL` values.

> **Summary:** incident data **enters through the ALB as inbound HTTP POST webhooks**; resource data is
> **polled outbound by backend pods** (currently disabled). Nothing about this ingestion path uses SQS,
> Lambda, or Cognito.

## 14. Scalability — Horizontal Pod Autoscaling (HPA)

### What is autoscaled

Only the **NestJS backend Deployment** (`onetogether-backend`, namespace `onetogether`) is under an HPA. The
frontend is static (S3 + CloudFront — scales globally at the edge by default), and RDS/ElastiCache scale
vertically/by node config, not by HPA.

| Workload | Scaling mechanism | Range |
|---|---|---|
| Backend pods (EKS) | **HPA** on CPU 70% / memory 80% | **min 2 → max 10** replicas |
| EKS worker nodes | Managed nodegroup desired/min/max | 2 → 6 nodes (t3.medium) |
| Frontend | CloudFront edge (no pods) | n/a |

The two layers cooperate: HPA adds **pods**; if pods can't be scheduled for lack of capacity, the **nodegroup**
provides more nodes (raise `max` or add the Cluster Autoscaler/Karpenter to automate node scaling on `Pending` pods).

### How HPA works here (traffic ↑ → pods ↑ → EKS absorbs load)

```
  Traffic rises (more incident POSTs / API reads / Socket.IO clients)
        │
        ▼
  Backend pod CPU/memory climbs above target (CPU 70% / mem 80%)
        │  metrics-server reports pod usage every ~15s
        ▼
  HPA controller recomputes desired replicas:
        desiredReplicas = ceil( currentReplicas × currentMetric / targetMetric )
        │  e.g. 2 pods at 140% CPU vs 70% target → ceil(2 × 140/70) = 4 pods
        ▼
  Deployment scales 2 → 4 → … (capped at max 10); new pods Ready in seconds
        │  ALB target group registers the new pods; load spreads across them
        ▼
  Per-pod CPU drops back toward 70% → HPA stabilises
        │
        ▼
  Traffic falls → metrics drop → HPA scales back down (after stabilisation window) toward min 2
```

Two AZs + `min 2` guarantee one pod per AZ for availability. Socket.IO works across the extra pods because of
**ALB cookie stickiness** (client pinned to one pod) plus the **ElastiCache Redis adapter** (cross-pod
broadcast), so scaling out never drops live incident-room messages.

### Presentation / demo commands

```bash
# Show the HPA, its targets, and current vs. desired replicas
kubectl get hpa -n onetogether
kubectl describe hpa onetogether-backend -n onetogether   # events: "scaled up replica set ... to N"

# Watch pods scale in real time (leave running during a load test)
kubectl get pods -n onetogether -w

# Live CPU/memory per pod (needs metrics-server — the same source HPA reads)
kubectl top pods -n onetogether

# Optional: confirm the controller's view and node capacity during a demo
kubectl get deploy onetogether-backend -n onetogether          # READY/UP-TO-DATE replica count
kubectl get nodes                                              # node count if the nodegroup also scales
kubectl get events -n onetogether --sort-by=.lastTimestamp     # scale-up/down events timeline
```

**Demo tip:** in one pane run `kubectl get pods -w` and in another `kubectl get hpa -w`, then drive load at the
API (e.g. a quick `hey`/`ab`/`k6` against `/api/incidents` or a burst of `/api/incident-middleware/events`
POSTs). You'll watch CPU cross 70%, the HPA bump desired replicas, and new pods appear and go `Ready` — the
visual "traffic ↑ → pods ↑ → EKS handles the load" story.

## 15. Production integrations — Singpass & future AI providers (Gemini, etc.)

This section is **forward-looking guidance** for real production (neither is wired today). It shows *where each
fits and which way the arrows point*.

### 15a. Singpass — where it fits

Singpass is an **OIDC identity provider**. The user authenticates *at Singpass*, and your system trades an
authorization code for an ID token (a **server-to-server** call that egresses via the **NAT Gateway**). There
are two production-grade placements:

**Pattern B — direct OIDC in the NestJS `auth` module (recommended; least friction with what exists).**
Keep the current self-hosted session JWT; add Singpass as a login source. Cognito is **not** needed.

```
  Browser ──"Login with Singpass"──▶ EKS /api/auth/singpass/login
        │                                   │ (1) 302 redirect ▼
        ◀───────────────────────────────────┘
        │ (2) user authenticates at Singpass (NDI)            ┌─────────────────────────┐
        └──────────────────────────────────────────────────▶ │  Singpass / sgID (OIDC) │
        ◀── (3) 302 callback w/ auth code ───────────────────┤  authorize + token + JWKS│
        │                                                     └────────────▲────────────┘
        ▼  GET /api/auth/singpass/callback?code=…                          │ (4) code→token exchange
  CloudFront ─▶ ALB ─▶ EKS auth.service                                    │     (server→server, signed
        │  (4) exchange code for ID token  ──── egress via NAT GW ─────────┘     client_assertion / JWKS)
        │  (5) validate ID token (Singpass JWKS), read sub / MyInfo claims
        │  (6) upsert user in RDS, issue YOUR OWN access+refresh JWT (existing flow §4)
        ▼
  Browser stores session tokens → role-based routing as today
```

Arrows: **browser ⇄ Singpass** (interactive, front-channel redirects) and **EKS → Singpass** (back-channel
token/JWKS, **outbound through NAT GW**). Store the Singpass client ID + signing private key in **Secrets
Manager**; inject via the K8s Secret like `DATABASE_URL`.

**Pattern A — Cognito as the broker, Singpass federated behind it.** Only worth it if you also want Cognito's
managed MFA/social/hosted-UI. Here Singpass sits *behind* the (currently orphaned) Cognito pool:

```
  Browser ─▶ Cognito Hosted UI ─▶ (federated OIDC) ─▶ Singpass
        ◀── Cognito-issued JWT ──┘
  EKS backend validates the Cognito JWT (Cognito JWKS) instead of signing its own.
```

This is the **one scenario that justifies keeping Cognito** (see §4 Option B). Pick A *or* B — not both.

> **Net:** Singpass slots in at the **`auth` module / login edge**, not in the data path. Incidents, resources,
> maps, broadcasts are unchanged; only how a *session* is established changes.

### 15b. Gemini / future AI services — where they connect

AI providers are **outbound HTTPS dependencies**. From private-subnet EKS pods, every call to Gemini
(`generativelanguage.googleapis.com`), Anthropic, or Bedrock leaves via the **NAT Gateway → IGW → Internet**.
The clean way to add Gemini is an **AI-provider abstraction in the NestJS `ai` module** so providers are
swappable behind one interface.

```
  ┌────────────── EKS backend (NestJS) ──────────────┐
  │  ai.module → AiAdvisoryService                    │
  │     └─ AiProvider (interface)                     │
  │          ├─ BedrockProvider   (current/orphaned)  │
  │          ├─ GeminiProvider    ◀── NEW             │
  │          └─ AnthropicProvider (optional)          │
  └───────────────┬───────────────────────────────────┘
                  │ HTTPS (API key from Secrets Manager)
                  ▼  outbound egress
            NAT Gateway ─▶ Internet Gateway ─▶  Gemini API (generativelanguage.googleapis.com)
                  ▲                                   │
                  └──────── response (advice JSON) ───┘
                  │
                  ▼ persist to RDS (ai_advisory) + Socket.IO push to incident-room
```

Two placement choices (mirror the §11 sync-vs-async decision):

- **Inline (recommended for the prototype).** `AiAdvisoryService` calls `GeminiProvider` synchronously when an
  incident is created/escalated, stores the result in RDS, and pushes it over Socket.IO. Simple, one egress path,
  no extra infra. Add `GEMINI_API_KEY` to **Secrets Manager** → K8s Secret → pod env; set a short timeout +
  fallback so an AI outage never blocks incident creation.
- **Async (if AI calls are heavy/bursty).** Reuse the §11 pipeline but swap the model: the `AIAdvisory` Lambda
  calls **Gemini instead of Bedrock** (same NAT egress), writes advisory to S3, and SNS-alerts on Critical.
  Only do this if you commit to wiring the SQS producer (§11).

**Adding any future AI provider** then means: implement one more `AiProvider`, add its key to Secrets Manager,
and select it via an env var (e.g. `AI_PROVIDER=gemini|bedrock|anthropic`) — **no networking or topology
change**, because the egress path (pods → NAT GW → Internet) is already there.

> **Net:** AI providers attach at the **`ai` module**, always as **outbound HTTPS via the NAT Gateway**; keys
> live in **Secrets Manager**. Use the provider interface so Gemini/Bedrock/Anthropic are config swaps, not
> rewrites.

---

*Verified against the repository on 2026-06-10: Terraform under `infrastructure/terraform/`, K8s under
`infrastructure/k8s/`, CI under `.github/workflows/`, and application code under `apps/`. "Orphaned" verdicts
were confirmed by the absence of any consuming reference in `apps/backend/src` / `apps/frontend/src` (no
`cognito`, `singpass`, SQS/SNS, or AWS-SDK publisher calls).*
