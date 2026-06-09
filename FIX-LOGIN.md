# Fixing Login on the Deployed Site

This runbook fixes the deployed app so you can log in with the demo accounts at
`https://d34fq0fyxyo5jn.cloudfront.net/`.

## Why login was broken (diagnosis)

The frontend calls the API **same-origin** at `/api/auth/login` (relative path —
see `apps/frontend/src/interfaces/auth/authApi.ts`). On the deployed site that
resolves to `https://<cloudfront>/api/auth/login`. Four things were wrong:

1. **CloudFront had only the S3 origin.** Any `/api/*` request was served from S3,
   missed, and the SPA fallback returned `index.html` (HTTP 200 HTML) — so the
   browser got a web page, not the login JSON. Login could never work.
2. **The backend had no public entry point.** The k8s Service is `ClusterIP`
   (internal only) and **no Ingress/ALB existed** — the deploy workflow skips
   `ingress.yaml` unless `DOMAIN_NAME` + `ACM_CERT_ARN` secrets are set, and that
   ingress also requires a domain you don't have. `aws elbv2 describe-load-balancers`
   returned nothing.
3. **The newest backend image crash-loops.** It throws an unhandled Prisma
   `SocketTimeout` from a background DB query, which kills the Node process
   (exit 1). Two older pods still serve, so the API works internally, but new
   rollouts never complete. Fixed in code with a global rejection guard
   (`apps/backend/src/main.ts`).
4. **The production RDS database is almost certainly not seeded**, so the demo
   accounts (`citizen` / `responder` / `gov`) don't exist yet.

The fix keeps everything **same-origin under the one CloudFront URL** (no CORS, no
mixed content): CloudFront terminates HTTPS for viewers and proxies `/api/*` and
`/socket.io/*` to an internet-facing backend ALB over HTTP.

```
Browser ─HTTPS─> CloudFront ─┬─ default ──> S3 (React app)
                             └─ /api/*, /socket.io/* ──HTTP──> ALB ──> backend pods ──> RDS
```

---

## Part A — Fix the GitHub Actions frontend build (already done in code)

The `Build and Deploy Frontend` job failed on TypeScript errors. These are fixed:

- `VolunteerTaskRow.tsx` — removed unused `Flex` import
- `GovernmentOrganisationsPage.tsx` — removed unused `Plus` import
- `IncidentRoomTabs.tsx` — removed unused `Sparkles` import
- `IncidentMap.tsx` — typed the Directions `result`/`point` params (local
  `DirectionsResultLike` type, since `@types/google.maps` isn't installed)

Verify locally:

```bash
cd apps/frontend
npm run build        # must print "✓ built" with no TS errors
```

---

## Part B — Create the backend ALB (public entry point)

You have no custom domain, so use the HTTP-only ingress (`ingress-http.yaml`,
added in this change) instead of `ingress.yaml`.

```bash
# Point kubectl at the cluster
aws eks update-kubeconfig --name onetogether-production --region ap-southeast-1

# Create the internet-facing ALB
kubectl apply -f infrastructure/k8s/backend/ingress-http.yaml

# Wait ~2-3 min for the ALB to provision, then grab its DNS name:
kubectl get ingress backend -n onetogether -w
# ... copy the ADDRESS, e.g. k8s-onetogeth-backend-abc123.ap-southeast-1.elb.amazonaws.com
```

Sanity-check the ALB is serving (after it shows healthy, ~2 min more):

```bash
curl http://<ALB_DNS>/api/health      # expect {"status":"ok",...}
```

---

## Part C — Point CloudFront at the backend ALB

`cloudfront.tf` now adds the ALB origin + `/api/*` and `/socket.io/*` behaviors
when `backend_alb_domain` is set.

```bash
cd infrastructure/terraform

# Pass the ALB DNS from Part B (or add it to terraform.tfvars)
terraform apply -var="backend_alb_domain=<ALB_DNS>"
```

CloudFront takes a few minutes to redeploy. Then test:

```bash
curl https://d34fq0fyxyo5jn.cloudfront.net/api/health   # expect JSON, not HTML
```

> Tip: add `backend_alb_domain = "<ALB_DNS>"` to `terraform.tfvars` so future
> `terraform apply` runs keep it.

---

## Part D — Migrate + seed the production database

RDS is **private** (not publicly accessible), so tunnel through the cluster with a
throwaway TCP proxy pod, then run Prisma from your local repo (which has the schema
and seed script).

```bash
# 1. Get the DB connection string the cluster uses
aws secretsmanager get-secret-value \
  --secret-id onetogether-production/database \
  --region ap-southeast-1 --query SecretString --output text
# -> note the url: postgresql://USER:PASS@onetogether-production-postgres...:5432/onetogether

# 2. Start a socat proxy pod to the RDS endpoint, forward it locally
kubectl run pg-proxy -n onetogether --image=alpine/socat --restart=Never -- \
  tcp-listen:5432,fork,reuseaddr \
  tcp-connect:onetogether-production-postgres.cbkkq88w85hf.ap-southeast-1.rds.amazonaws.com:5432

kubectl wait --for=condition=Ready pod/pg-proxy -n onetogether --timeout=60s
kubectl port-forward -n onetogether pod/pg-proxy 5432:5432   # leave running in its own terminal
```

In a second terminal, run the migration + seed against the tunnel (swap in the
real USER/PASS from step 1):

```bash
cd apps/backend
# PowerShell:
$env:DATABASE_URL="postgresql://USER:PASS@localhost:5432/onetogether"
npm run db:push        # create/sync tables
npm run db:seed        # create demo users (citizen/responder/gov, etc.)
```

Clean up the proxy when done:

```bash
kubectl delete pod pg-proxy -n onetogether
```

---

## Part E — Deploy the code fixes (crash guard + frontend build)

```bash
git add -A
git commit -m "fix: frontend TS build errors, backend crash guard, CloudFront API proxy"
git push origin <your-branch>     # then merge to main, OR push to main directly
```

Pushing to `main` triggers:
- **Deploy Frontend** — now builds clean, uploads to S3, invalidates CloudFront
- **Deploy Backend** — rebuilds the image; the crash guard lets new pods stay up

Watch the backend rollout:

```bash
kubectl rollout status deployment/backend -n onetogether --timeout=300s
kubectl get pods -n onetogether     # all pods should be 1/1 Running
```

---

## Verify

Open `https://d34fq0fyxyo5jn.cloudfront.net/`, log in with:

| Role      | Username    | Password    |
|-----------|-------------|-------------|
| Citizen   | `citizen`   | `citizen`   |
| Responder | `responder` | `responder` |
| Government | `gov`      | `gov`       |

If login still fails, check the browser Network tab on the `/api/auth/login`
request:
- Returns HTML → CloudFront `/api/*` behavior didn't deploy (re-check Part C)
- 502/504 → ALB can't reach healthy pods (check `kubectl get pods -n onetogether`)
- 401 "Invalid credentials" → DB reachable but not seeded (re-run Part D)

---

## Cost note

The internet-facing ALB (~US$16–20/mo) and the EKS cluster + RDS + ElastiCache are
the bulk of the spend. For a prototype you can tear the ALB down between demos:
`kubectl delete -f infrastructure/k8s/backend/ingress-http.yaml` (re-apply later and
re-run Part C with the new ALB DNS).
