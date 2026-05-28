# CLAUDE.md — Disaster Response Application

> This file gives Claude Code everything it needs to build this project from scratch.
> You do NOT need to show Claude Code the architecture image — all details are here.

---

## What This App Does

A disaster response platform for Singapore (AWS ap-southeast-1) with three types of users:

* **Citizens** — report incidents, join volunteer communities, access the system
* **Responders** — coordinate response, manage incidents
* **Government** — monitor analytics, broadcast emergency alerts

---

## Tech Stack

| Layer              | Technology                                             |
| ------------------ | ------------------------------------------------------ |
| Frontend           | React (TypeScript), hosted on S3 + CloudFront          |
| Backend API        | Node.js (Express), containerised, running on EKS       |
| Database           | PostgreSQL on RDS (primary AZ1 + standby AZ2)          |
| Cache              | ElastiCache Valkey (Redis-compatible)                  |
| Auth               | AWS Cognito (3 groups: citizen, responder, government) |
| Events             | EventBridge → SQS → Lambda                           |
| Notifications      | Amazon SNS (emergency broadcasts)                      |
| Storage            | S3 (3 buckets: frontend, data lake, terraform state)   |
| CDN                | CloudFront                                             |
| DNS + Security     | Route 53 + WAF                                         |
| Container Registry | ECR                                                    |
| GitOps             | ArgoCD inside EKS                                      |
| CI/CD              | GitHub Actions + Terraform                             |
| Monitoring         | Prometheus + Grafana + Better Uptime                   |
| Logging            | CloudWatch + CloudTrail                                |
| Secrets            | AWS Secrets Manager                                    |

---

## Architecture Flow (text description of the diagram)

```
Users / Responders / Government
        ↓
Route 53 (DNS) → WAF (security filter) → CloudFront (CDN)
        ↓                                       ↓
Internet Gateway                        S3 (Static React App)
        ↓
Application Load Balancer
        ↓
EKS Cluster (private subnets, 2 AZs)
  ├── EC2 Node Group (Auto Scaling, AZ1 + AZ2)
  └── ArgoCD namespace (GitOps deployments)
        ↓
EKS receives + validates disaster reports → publishes to EventBridge
        ↓
EventBridge → routes to multiple downstream systems:
  ├── SQS → ProcessIncident Lambda
  │         (classifies, enriches, stores to RDS)
  ├── DataIngestion Lambda
  │         (fetches external data, stores to S3 Data Lake)
  └── AIAdvisory Lambda
            (reads historical S3 reports, generates AI suggestions)
                    ↓
            Amazon SNS → emergency alert broadcast to users

RDS PostgreSQL (primary AZ1, standby AZ2) — stores incidents + status
ElastiCache Valkey — fast access for live dashboard and maps
S3 Data Lake — historical incident reports + AI suggestions
```

---

## Folder Structure to Create

```
disaster-response-app/
├── CLAUDE.md                          ← this file
├── .github/
│   └── workflows/
│       ├── deploy.yml                 ← main deploy pipeline
│       └── pr-check.yml               ← PR validation
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── providers.tf
│   └── modules/
│       ├── vpc/
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── outputs.tf
│       ├── eks/
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   ├── outputs.tf
│       │   └── iam.tf
│       ├── rds/
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── outputs.tf
│       ├── elasticache/
│       │   ├── main.tf
│       │   └── variables.tf
│       ├── s3/
│       │   ├── main.tf
│       │   └── outputs.tf
│       ├── cloudfront/
│       │   ├── main.tf
│       │   └── variables.tf
│       ├── waf/
│       │   └── main.tf
│       ├── cognito/
│       │   ├── main.tf
│       │   └── outputs.tf
│       ├── lambda/
│       │   ├── main.tf
│       │   ├── iam.tf
│       │   └── variables.tf
│       ├── eventbridge/
│       │   └── main.tf
│       ├── sqs/
│       │   └── main.tf
│       └── sns/
│           └── main.tf
├── backend/
│   ├── src/
│   │   ├── index.js                   ← Express app entry point
│   │   ├── controllers/
│   │   │   ├── incidentController.js
│   │   │   ├── userController.js
│   │   │   └── alertController.js
│   │   ├── routes/
│   │   │   ├── incidents.js
│   │   │   ├── users.js
│   │   │   └── alerts.js
│   │   ├── models/
│   │   │   ├── incident.js
│   │   │   └── user.js
│   │   ├── middleware/
│   │   │   ├── auth.js                ← Cognito JWT validation
│   │   │   └── roleCheck.js           ← citizen/responder/gov roles
│   │   ├── services/
│   │   │   ├── eventService.js        ← publishes to EventBridge
│   │   │   ├── cacheService.js        ← ElastiCache Valkey
│   │   │   └── notificationService.js ← SNS
│   │   └── db/
│   │       ├── connection.js          ← RDS PostgreSQL pool
│   │       └── schema.sql             ← initial schema
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   ├── components/
│   │   │   ├── IncidentMap.tsx        ← live map (citizens see this)
│   │   │   ├── IncidentForm.tsx       ← report an incident
│   │   │   ├── IncidentList.tsx
│   │   │   ├── Dashboard.tsx          ← responder/gov view
│   │   │   ├── AlertBanner.tsx        ← emergency broadcasts
│   │   │   └── Layout.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── ReportIncident.tsx
│   │   │   ├── ResponderDashboard.tsx
│   │   │   └── GovAnalytics.tsx
│   │   ├── auth/
│   │   │   └── cognito.ts             ← Cognito auth helpers
│   │   ├── services/
│   │   │   └── api.ts                 ← axios API client
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── lambdas/
│   ├── process-incident/
│   │   ├── index.js
│   │   └── package.json
│   ├── data-ingestion/
│   │   ├── index.js
│   │   └── package.json
│   └── ai-advisory/
│       ├── index.js
│       └── package.json
└── k8s/
    ├── argocd/
    │   └── application.yaml
    └── apps/
        ├── deployment.yaml
        ├── service.yaml
        ├── ingress.yaml
        └── hpa.yaml                   ← horizontal pod autoscaler
```

---

## Environment Variables

### Backend (set in Kubernetes secrets / Secrets Manager)

```env
# Database
DATABASE_URL=postgresql://disasteradmin:PASSWORD@RDS_ENDPOINT:5432/disasterdb
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=disasterdb
DB_USER=disasteradmin
DB_PASSWORD=<from-secrets-manager>

# Cache
REDIS_URL=redis://<elasticache-endpoint>:6379

# Auth
COGNITO_USER_POOL_ID=ap-southeast-1_XXXXXXX
COGNITO_CLIENT_ID=<client-id>
AWS_REGION=ap-southeast-1

# AWS Services
EVENTBRIDGE_BUS_NAME=disaster-response-bus
SNS_ALERT_TOPIC_ARN=arn:aws:sns:ap-southeast-1:ACCOUNT:disaster-emergency-alerts
DATA_LAKE_BUCKET=disaster-response-datalake-ACCOUNT_ID
PORT=3000
NODE_ENV=production
```

### Frontend (set as React env vars, prefix REACT_APP_)

```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_COGNITO_USER_POOL_ID=ap-southeast-1_XXXXXXX
REACT_APP_COGNITO_CLIENT_ID=<client-id>
REACT_APP_AWS_REGION=ap-southeast-1
REACT_APP_MAPBOX_TOKEN=<your-mapbox-token>    # for IncidentMap
```

---

## Database Schema

Create this in `backend/src/db/schema.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE incidents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  type          VARCHAR(50) NOT NULL,   -- flood, fire, earthquake, haze, accident, other
  severity      INTEGER DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  status        VARCHAR(50) DEFAULT 'open',  -- open, in_progress, resolved, closed
  location      JSONB NOT NULL,              -- { lat, lng, address, postal_code }
  reported_by   UUID,
  assigned_to   UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cognito_sub   VARCHAR(255) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255),
  role          VARCHAR(50) NOT NULL,   -- citizen, responder, government
  status        VARCHAR(50) DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE incident_updates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id   UUID REFERENCES incidents(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id),
  message       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE volunteer_signups (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id   UUID REFERENCES incidents(id),
  user_id       UUID REFERENCES users(id),
  skills        TEXT[],
  status        VARCHAR(50) DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_incidents_status   ON incidents(status);
CREATE INDEX idx_incidents_type     ON incidents(type);
CREATE INDEX idx_incidents_location ON incidents USING GIN(location);
CREATE INDEX idx_incidents_created  ON incidents(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Key Code Patterns to Implement

### 1. Backend API entry point (`backend/src/index.js`)

Express app with:

* CORS configured for frontend domain
* Cognito JWT middleware on all `/api` routes
* Routes: `/api/incidents`, `/api/users`, `/api/alerts`
* Health check at `/health` (no auth, used by ALB)
* Error handling middleware
* Connect to RDS on startup, fail fast if DB unavailable

### 2. Cognito JWT middleware (`backend/src/middleware/auth.js`)

* Fetch Cognito JWKS from: `https://cognito-idp.ap-southeast-1.amazonaws.com/${POOL_ID}/.well-known/jwks.json`
* Verify JWT signature on every request
* Extract `cognito:groups` claim → attach as `req.user.role`
* Cache JWKS (don't fetch on every request)

### 3. Role check middleware (`backend/src/middleware/roleCheck.js`)

```js
// Usage: router.post('/alert', requireRole('government'), handler)
// Usage: router.get('/dashboard', requireRole(['responder','government']), handler)
const requireRole = (roles) => (req, res, next) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};
```

### 4. Incident creation flow

When a POST `/api/incidents` comes in:

1. Validate body (title, type, location required)
2. Insert into RDS
3. Publish to EventBridge with `DetailType: 'IncidentCreated'`
4. Invalidate ElastiCache key `incidents:active`
5. Return created incident

### 5. EventBridge publisher (`backend/src/services/eventService.js`)

```js
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const client = new EventBridgeClient({ region: 'ap-southeast-1' });

async function publishEvent(detailType, detail) {
  return client.send(new PutEventsCommand({
    Entries: [{
      Source: 'disaster.response',
      DetailType: detailType,
      Detail: JSON.stringify(detail),
      EventBusName: process.env.EVENTBRIDGE_BUS_NAME
    }]
  }));
}
```

### 6. ProcessIncident Lambda (`lambdas/process-incident/index.js`)

Triggered by SQS (which receives from EventBridge).

* Parse incident from `event.Records[0].body`
* Classify severity: check description for keywords (flood, fire, explosion, earthquake → severity 4-5; injury, damage → 3; minor → 1-2)
* Enrich with weather data if type is flood/haze (call DataIngestion)
* Update incident record in RDS with classified severity + enrichment
* Log to CloudWatch

### 7. AIAdvisory Lambda (`lambdas/ai-advisory/index.js`)

* Triggered by EventBridge rule matching `IncidentCreated` with severity >= 3
* Read last 10 similar incidents from S3 Data Lake (`incidents/type=TYPE/`)
* Call Amazon Bedrock (Claude) or a simple rule-based engine to generate response suggestions
* Store suggestion JSON to S3: `suggestions/INCIDENT_ID.json`
* Return suggestion (also stored, so EKS can fetch it later)

### 8. ElastiCache cache service (`backend/src/services/cacheService.js`)

```js
const { createClient } = require('redis');
const client = createClient({ url: process.env.REDIS_URL });

// Cache active incidents for dashboard/map (30 second TTL for live feel)
async function getCachedIncidents() {
  const cached = await client.get('incidents:active');
  return cached ? JSON.parse(cached) : null;
}

async function setCachedIncidents(data) {
  await client.setEx('incidents:active', 30, JSON.stringify(data));
}
```

---

## Terraform Key Details

### AWS Region

Always `ap-southeast-1` (Singapore). Set in `variables.tf`.

### VPC Layout

```
VPC CIDR: 10.0.0.0/16

Public subnets (NAT gateways live here):
  AZ1 (ap-southeast-1a): 10.0.1.0/24
  AZ2 (ap-southeast-1b): 10.0.2.0/24

Private subnets (EKS nodes, RDS, Lambda live here):
  AZ1 (ap-southeast-1a): 10.0.11.0/24
  AZ2 (ap-southeast-1b): 10.0.12.0/24
```

### EKS Node Group

* Instance type: `t3.medium` (use `t3.small` for dev/testing to save cost)
* Min: 1, Desired: 2, Max: 6
* Nodes in private subnets only
* ArgoCD installed as a namespace inside the cluster

### RDS

* Engine: PostgreSQL 15
* Instance: `db.t3.medium`
* `multi_az = true` → automatically creates primary (AZ1) + standby (AZ2)
* Storage: 20GB gp2, encrypted
* Backups: 7 day retention
* NOT publicly accessible (private subnet only)

### Three S3 Buckets

1. `disaster-response-frontend-{account_id}` — React app, website hosting enabled
2. `disaster-response-datalake-{account_id}` — historical incidents + AI suggestions, versioning enabled
3. `disaster-response-terraform-state-{account_id}` — Terraform state (create this MANUALLY before running terraform)

### Lambda Runtime

All three Lambdas: `nodejs20.x`, timeout 30s, memory 256MB

---

## Kubernetes Manifests

### `k8s/apps/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: disaster-response-backend
  namespace: disaster-response
spec:
  replicas: 2
  selector:
    matchLabels:
      app: disaster-response-backend
  template:
    metadata:
      labels:
        app: disaster-response-backend
    spec:
      containers:
        - name: backend
          image: ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/disaster-response-backend:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```

### `k8s/apps/hpa.yaml` (auto-scaling)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: disaster-response-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

## GitHub Actions CI/CD (`.github/workflows/deploy.yml`)

Pipeline does these steps in order:

1. `terraform init + apply` (infrastructure changes)
2. Build Docker image for backend
3. Push image to ECR
4. `kubectl rollout restart deployment/backend` (ArgoCD picks up new image)
5. Build React frontend (`npm run build`)
6. Upload to S3 frontend bucket
7. Invalidate CloudFront cache

Required GitHub Secrets:

* `AWS_ACCESS_KEY_ID`
* `AWS_SECRET_ACCESS_KEY`
* `ECR_REGISTRY` = `ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com`
* `FRONTEND_BUCKET` = `disaster-response-frontend-ACCOUNT_ID`
* `TF_VAR_db_password` = your DB password

---

## API Endpoints to Build

### Incidents

```
POST   /api/incidents              → create incident (any authenticated user)
GET    /api/incidents              → list incidents (cached, all users)
GET    /api/incidents/:id          → get single incident
PATCH  /api/incidents/:id/status   → update status (responder/gov only)
POST   /api/incidents/:id/updates  → add update/note (responder/gov only)
GET    /api/incidents/:id/suggestion → get AI advisory (responder/gov only)
```

### Alerts

```
POST   /api/alerts                 → broadcast emergency alert via SNS (gov only)
GET    /api/alerts                 → list recent alerts
```

### Users / Volunteers

```
GET    /api/me                     → current user profile
POST   /api/incidents/:id/volunteer → sign up to volunteer (citizens)
GET    /api/incidents/:id/volunteers → list volunteers (responder/gov)
```

### Health

```
GET    /health                     → { status: 'ok', db: 'connected' } — no auth, for ALB
```

---

## Frontend Pages and What Each Shows

| Page                | Route              | Who sees it | What it does                                                   |
| ------------------- | ------------------ | ----------- | -------------------------------------------------------------- |
| Home                | `/`              | Everyone    | Map with live incidents, alert banner                          |
| Login               | `/login`         | Public      | Cognito hosted UI redirect                                     |
| Report Incident     | `/report`        | Citizens    | Form: title, type, description, location picker                |
| Incident Detail     | `/incidents/:id` | Everyone    | Incident info + updates feed + volunteer button                |
| Responder Dashboard | `/dashboard`     | Responders  | List of open incidents, assign/update status                   |
| Gov Analytics       | `/analytics`     | Government  | Charts: incidents by type/day/severity, broadcast alert button |

---

## Security Rules

* All RDS, ElastiCache, Lambda in **private subnets** — no public internet access
* EKS nodes in **private subnets** — only ALB is public-facing
* WAF rules: rate limiting (100 req/min per IP), SQL injection protection, XSS protection
* Cognito JWT required on all `/api/*` routes
* Government-only routes: creating alerts, viewing all analytics
* HTTPS only — CloudFront forces redirect from HTTP
* Secrets in AWS Secrets Manager, never in code or environment files checked into git

---

## Monitoring Setup

After deployment, install monitoring stack into EKS:

```bash
# Prometheus + Grafana via Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace

# Access Grafana
kubectl port-forward svc/prometheus-grafana 3001:80 -n monitoring
# Default login: admin / prom-operator
```

Key metrics to alert on:

* API response time p99 > 1s
* Error rate > 1%
* RDS CPU > 80%
* EKS node CPU > 85%
* Active incidents count (business metric)

---

## Common Commands Reference

```bash
# Connect kubectl to EKS
aws eks update-kubeconfig --name disaster-response-cluster --region ap-southeast-1

# View running pods
kubectl get pods -n disaster-response

# View logs
kubectl logs -f deployment/disaster-response-backend -n disaster-response

# Connect to RDS (run schema.sql)
psql -h RDS_ENDPOINT -U disasteradmin -d disasterdb

# Deploy Terraform
cd terraform && terraform init && terraform plan && terraform apply

# Build + push Docker image manually
docker build -t backend ./backend
docker tag backend:latest ECR_URI/disaster-response-backend:latest
docker push ECR_URI/disaster-response-backend:latest

# Deploy frontend manually
cd frontend && npm run build
aws s3 sync build/ s3://FRONTEND_BUCKET --delete
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

---

## Notes for Claude Code

1. **Start with Terraform** — run infrastructure first before writing application code
2. **Use AWS SDK v3** (`@aws-sdk/client-*`) not v2 in all Node.js code
3. **All AWS clients** should use the default credential chain (no hardcoded keys) — they'll pick up IAM roles automatically when running in EKS/Lambda
4. **PostgreSQL client** : use `pg` (node-postgres) with connection pooling via `pg-pool`
5. **Redis client** : use `redis` npm package v4+ (supports Valkey)
6. **The backend Dockerfile** must produce a minimal image — use `node:20-alpine`, not `node:20`
7. **Health check endpoint** `/health` must respond within 5 seconds or the ALB will mark the pod as unhealthy
8. **CORS** : frontend origin is the CloudFront domain. Allow it explicitly, not `*`
9. **Lambda functions** are zipped and uploaded via Terraform — no separate deploy step needed
10. **ArgoCD** watches the `k8s/apps/` folder in this repo — any change to YAML files there auto-deploys to EKS
