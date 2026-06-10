# Deploying a New Gemini Feature to Production (Government Summary)

> **Scenario.** You're adding a **new, standalone Gemini-powered "summary" feature** for the government
> interface — *separate from* the existing AIAdvisory/Lambda pipeline. This guide answers: **do I need to change
> CI/CD?**, **where does the new `GEMINI_API_KEY` go?**, **does the pipeline handle everything or are there
> manual steps?**, and gives the **full end-to-end flow to get it live in production.**

**Short answer:**
- **Code** (the new NestJS endpoint + Gemini call) → **fully handled by CI/CD** once merged to `main`.
- **The new secret (`GEMINI_API_KEY`)** → **NOT auto-discovered.** You add it **once** to the pipeline's secret
  flow (a GitHub repo secret + 2 small file edits). After that, every future deploy is automatic.
- **Networking** → **no change.** Outbound HTTPS to Gemini already works via the existing NAT Gateway.
- **Frontend `.env` / VITE vars** → **no change** (keep the key server-side; the browser never sees it).

---

## 0. Architectural placement (do this server-side)

Put the Gemini call in the **backend** `ai` (or a new `government-summary`) module and expose an endpoint the
government UI calls. **Never** call Gemini from the React app — that would ship the API key to the browser.

```
  Gov UI (role=admin) ──GET /api/government/summary──▶ CloudFront ─▶ ALB ─▶ EKS NestJS
                                                                       │  read GEMINI_API_KEY from pod env
                                                                       │  HTTPS ──NAT GW──▶ Gemini API
                                                                       ◀── summary text ──┘
                                                                       ▼ (optional) cache in RDS / return JSON
  Gov UI ◀────────────────────── summary JSON ──────────────────────────┘
```

This reuses the egress path already documented in `ARCHITECTURE.md` §15b. It's independent of AIAdvisory/SQS/SNS.

---

## 1. Code changes (CI/CD handles deployment of these automatically)

These are normal code commits under `apps/backend/**`, so merging to `main` triggers `deploy-backend.yml` and
they ship with no extra steps.

1. **Add the SDK:** `cd apps/backend && npm i @google/generative-ai` (commit the `package.json`/lockfile).
2. **New service** that reads the key from env and calls Gemini, e.g.:
   ```ts
   // apps/backend/src/<module>/government-summary.service.ts
   const apiKey = process.env.GEMINI_API_KEY;          // injected by K8s (see §2)
   // ... call gemini-1.5/2.x, return summary; add a short timeout + try/catch fallback
   ```
3. **New endpoint**, government-only, e.g. `GET /api/government/summary` in a controller.
   - Guard it to `admin` role. (Note: per `ARCHITECTURE.md` §4 there is currently **no global JWT guard** —
     add/route through one so this gov endpoint isn't public.)
4. **Fail safe:** if `GEMINI_API_KEY` is missing or Gemini errors, return a graceful fallback — never let an AI
   outage 500 the government dashboard.

> Everything in §1 is built into the Docker image and rolled out by CI. The *only* thing CI can't invent is the
> **secret value** — that's §2.

---

## 2. The secret: `GEMINI_API_KEY` (the one part that needs setup)

Your pipeline injects backend env two ways. Pick **Option A** (fastest, mirrors `COGNITO_*`) unless you want the
key centralized in AWS (**Option B**, mirrors `DATABASE_URL`).

### Option A — GitHub Actions secret → K8s Secret  ✅ recommended

**Step A1 — add the GitHub repo secret (one-time, manual, in the GitHub UI):**
`Repo → Settings → Secrets and variables → Actions → New repository secret`
→ Name `GEMINI_API_KEY`, value = your key.

**Step A2 — edit `.github/workflows/deploy-backend.yml`** (step 8, "Create K8s secrets…"). Add the env var and
one `--from-literal` line:

```yaml
      - name: Create K8s secrets from AWS Secrets Manager
        env:
          COGNITO_USER_POOL_ID: ${{ secrets.COGNITO_USER_POOL_ID }}
          COGNITO_CLIENT_ID:    ${{ secrets.COGNITO_CLIENT_ID }}
          GEMINI_API_KEY:       ${{ secrets.GEMINI_API_KEY }}      # << ADD
        run: |
          ...
          kubectl create secret generic onetogether-secrets \
            --namespace onetogether \
            --from-literal=DATABASE_URL="$DB_URL" \
            --from-literal=REDIS_URL="$REDIS_URL" \
            --from-literal=COGNITO_USER_POOL_ID="$COGNITO_USER_POOL_ID" \
            --from-literal=COGNITO_CLIENT_ID="$COGNITO_CLIENT_ID" \
            --from-literal=GEMINI_API_KEY="$GEMINI_API_KEY" \       # << ADD
            --save-config --dry-run=client -o yaml | kubectl apply -f -
```

**Step A3 — edit `infrastructure/k8s/backend/deployment.yaml`** (the `env:` list) so the pod receives it:

```yaml
            - name: GEMINI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: onetogether-secrets
                  key: GEMINI_API_KEY
```

Both A2 and A3 are committed files → applied automatically by CI on the next merge.

### Option B — AWS Secrets Manager (centralized, audited)

1. **Terraform** (`infrastructure/terraform/secrets.tf`): add an `aws_secretsmanager_secret` +
   `..._version` named e.g. `onetogether-production/gemini` holding `{"api_key":"..."}`. Merge → `deploy-infra.yml`
   creates it. (Put the real value in via console/CLI, not in Terraform code.)
2. **`deploy-backend.yml`** step 8: fetch it like the DB/cache secrets and add the `--from-literal` line:
   ```bash
   GEMINI_SECRET=$(aws secretsmanager get-secret-value --secret-id onetogether-production/gemini --query SecretString --output text)
   GEMINI_API_KEY=$(echo $GEMINI_SECRET | python3 -c "import sys,json; print(json.load(sys.stdin)['api_key'])")
   # ...add --from-literal=GEMINI_API_KEY="$GEMINI_API_KEY" to the kubectl create secret block
   ```
3. **`deployment.yaml`**: same `secretKeyRef` env block as A3.

> **Which to choose?** Option A for speed/simplicity (a prototype). Option B if you want one place for all
> secrets, rotation, and audit. Both end with `GEMINI_API_KEY` in the `onetogether-secrets` K8s Secret.

---

## 3. Full deploy flow — what's automatic vs. manual

| # | Action | Who does it |
|---|---|---|
| 1 | Add GitHub repo secret `GEMINI_API_KEY` (Option A) *or* create the Secrets Manager secret (Option B) | **You — one time, manual** |
| 2 | Edit `deploy-backend.yml` + `deployment.yaml` per §2 | **You — code commit** |
| 3 | Write the Gemini service + gov endpoint (§1) | **You — code commit** |
| 4 | Open PR → merge to `main` | **You** |
| 5 | `deploy-backend.yml` fires (paths `apps/backend/**` + `infrastructure/k8s/backend/**`) | **CI/CD** |
| 6 | Build image → push to ECR (SHA + latest) | **CI/CD** |
| 7 | Recreate `onetogether-secrets` (now incl. `GEMINI_API_KEY`) + ConfigMap | **CI/CD** |
| 8 | Apply manifests → `kubectl set image` → rolling restart (zero-downtime) | **CI/CD** |
| 9 | New pods boot with `GEMINI_API_KEY` in env; `/api/government/summary` live | **CI/CD** |

**So: CI/CD handles everything *except* creating the secret value and wiring it into the two files (steps 1–2),
which are one-time.** After that first setup, future changes to the feature are just normal merges to `main`.

> **Gotcha — adding only the secret, no code change.** If you set up the secret but make *no* `apps/backend/**`
> change, the workflow won't auto-run. Trigger it manually: GitHub → Actions → **Deploy Backend** →
> **Run workflow** (`workflow_dispatch` is enabled). That recreates the K8s Secret and rolls the pods so they
> pick up the new env var.

---

## 4. Verify it's live in production

```bash
# Point kubectl at the cluster
aws eks update-kubeconfig --name onetogether-production --region ap-southeast-1

# Rollout finished?
kubectl rollout status deployment/backend -n onetogether

# Is the key actually in the pod? (presence check — value is masked by K8s)
kubectl exec deploy/backend -n onetogether -- printenv | grep GEMINI_API_KEY

# Hit the new endpoint through the public edge (add auth header once the gov guard is in)
curl -s https://d34fq0fyxyo5jn.cloudfront.net/api/government/summary | head

# If something's off, read logs
kubectl logs deploy/backend -n onetogether --tail=100
```

Expected: the endpoint returns a Gemini-generated summary (or your graceful fallback if the key/quotas fail).

---

## 5. Rollback & local dev

- **Rollback:** `kubectl rollout undo deployment/backend -n onetogether` (reverts to the previous image while
  you fix forward). To pull the key, remove the `--from-literal`/`secretKeyRef` lines and redeploy.
- **Local dev:** add `GEMINI_API_KEY=...` to `apps/backend/.env` for `npm run dev:api`. **`.env` is local-only**
  — production does **not** read it; prod env comes from the K8s Secret. Keep `.env` in `.gitignore` (never
  commit the key).

---

## 6. Summary

- **CI/CD auto-handles**: building, pushing, rolling out your code, and re-injecting all secrets/config on every
  merge to `main`.
- **You do once**: create `GEMINI_API_KEY` (GitHub secret or Secrets Manager) and add it in `deploy-backend.yml`
  + `deployment.yaml` (3 small edits total).
- **No change needed**: networking (NAT egress exists), frontend env, the AIAdvisory/SQS/SNS pipeline — your new
  feature is fully independent of them.
- **Don't forget**: keep the key server-side, guard the endpoint to `admin`, and add a fallback so Gemini
  failures never break the government dashboard.
