# OneTogether — AWS Deployment Guide

This guide walks you through deploying OneTogether to AWS exactly as shown in
the architecture diagram: EKS (backend), S3+CloudFront (frontend), RDS, ElastiCache,
EventBridge, SQS, Lambda, SNS, Cognito, WAF, and Route 53 in ap-southeast-1.

---

## Table of Contents

1. [What You Need Installed](#1-what-you-need-installed)
2. [AWS Account Setup](#2-aws-account-setup)
3. [Bootstrap Terraform State](#3-bootstrap-terraform-state)
4. [Configure Variables](#4-configure-variables)
5. [Configure GitHub Secrets](#5-configure-github-secrets)
6. [Deploy Infrastructure with Terraform](#6-deploy-infrastructure-with-terraform)
7. [Configure kubectl for EKS](#7-configure-kubectl-for-eks)
8. [Configure ArgoCD](#8-configure-argocd)
9. [First Docker Build and Push](#9-first-docker-build-and-push)
10. [Configure ArgoCD Application](#10-configure-argocd-application)
11. [Deploy Frontend to S3](#11-deploy-frontend-to-s3)
12. [Configure Route 53 / DNS](#12-configure-route-53--dns)
13. [GitHub Actions — Ongoing CI/CD](#13-github-actions--ongoing-cicd)
14. [Verify the Deployment](#14-verify-the-deployment)
15. [Cost Estimate](#15-cost-estimate)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. What You Need Installed

Install these tools on your local machine before starting.

### Windows (your machine)

```powershell
# Install Chocolatey package manager (if not already installed)
# Run this in an admin PowerShell:
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install all tools in one command
choco install -y `
  awscli `
  terraform `
  kubernetes-helm `
  kubernetes-cli `
  git `
  docker-desktop `
  nodejs

# Verify installations
aws --version          # Should show: aws-cli/2.x.x
terraform --version    # Should show: Terraform v1.6+
helm version           # Should show: v3.x.x
kubectl version        # Should show: Client Version: v1.x.x
docker --version       # Should show: Docker version 24+
node --version         # Should show: v20.x.x
```

**Docker Desktop** must be running before you build images.

---

## 2. AWS Account Setup

### 2a. Create an IAM User for local development

1. Go to **AWS Console → IAM → Users → Create User**
2. Name: `onetogether-deploy`
3. Attach policy: `AdministratorAccess` (you can restrict this later)
4. Create Access Key → **Command Line Interface (CLI)**
5. Save the Access Key ID and Secret Access Key

### 2b. Configure AWS CLI

```powershell
# This stores credentials in ~/.aws/credentials
aws configure

# Enter when prompted:
# AWS Access Key ID:     AKIA...
# AWS Secret Access Key: xxxxxxxx
# Default region:        ap-southeast-1
# Default output format: json

# Verify you are authenticated
aws sts get-caller-identity
# Should return your account ID, user ID, and ARN
```

### 2c. Enable AWS Bedrock model access (for AIAdvisory Lambda)

1. Go to **AWS Console → Bedrock → Model access** (make sure you are in ap-southeast-1)
2. Click **Manage model access**
3. Enable: **Anthropic Claude 3.5 Sonnet v2**
4. Submit the request — approval is usually instant

---

## 3. Bootstrap Terraform State

Terraform stores its state file in S3. You must create the S3 bucket and DynamoDB
table BEFORE running `terraform init`. The bootstrap script does this for you.

```powershell
# From the project root — run in an admin PowerShell:
.\infrastructure\bootstrap\init-backend.ps1

# What this script does:
# 1. Gets your AWS account ID
# 2. Creates S3 bucket: onetogether-tfstate-<account-id>
#    - Versioning enabled (recover from accidental deletes)
#    - AES-256 encryption enabled
#    - All public access blocked
# 3. Creates DynamoDB table: onetogether-tfstate-lock
#    - Used to prevent two Terraform runs at the same time

# Expected output:
# Bootstrap complete!
# S3 bucket: onetogether-tfstate-123456789012
# DynamoDB table: onetogether-tfstate-lock
```

---

## 4. Configure Variables

```powershell
# Create backend.hcl (tells Terraform where to store state)
cd infrastructure/terraform
Copy-Item backend.hcl.example backend.hcl

# Edit backend.hcl — replace YOUR_ACCOUNT_ID with your actual AWS account ID
# Get it with: aws sts get-caller-identity --query Account --output text
notepad backend.hcl
```

`backend.hcl` should look like:
```hcl
bucket         = "onetogether-tfstate-123456789012"
key            = "onetogether/production/terraform.tfstate"
region         = "ap-southeast-1"
dynamodb_table = "onetogether-tfstate-lock"
encrypt        = true
```

```powershell
# Create terraform.tfvars (your deployment-specific values)
Copy-Item terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
notepad terraform.tfvars
```

`terraform.tfvars` must contain:
```hcl
domain_name = "your-domain.sg"         # Your actual domain
db_password = "YourStr0ngP@ssword!2024" # Min 16 chars, mixed case + symbols
alert_email = "alerts@your-domain.sg"  # Receives emergency SNS alerts
```

> **Note:** `terraform.tfvars` and `backend.hcl` are in `.gitignore` — they will
> never be committed to Git. Keep them safe locally.

---

## 5. Configure GitHub Secrets

In your GitHub repository: **Settings → Secrets and variables → Actions → New repository secret**

Add ALL of these secrets:

| Secret Name | How to get the value |
|---|---|
| `AWS_ROLE_ARN` | Set AFTER step 6 (Terraform creates this role). Run: `cd infrastructure/terraform && terraform output github_actions_role_arn` |
| `TF_STATE_BUCKET` | `onetogether-tfstate-YOUR_ACCOUNT_ID` |
| `TF_STATE_LOCK_TABLE` | `onetogether-tfstate-lock` |
| `DOMAIN_NAME` | Your domain, e.g. `onetogether.sg` |
| `DB_PASSWORD` | Same password as in `terraform.tfvars` |
| `ALERT_EMAIL` | Your alert email |
| `COGNITO_USER_POOL_ID` | Set AFTER step 6: `terraform output cognito_user_pool_id` |
| `COGNITO_CLIENT_ID` | Set AFTER step 6: `terraform output cognito_client_id` |
| `FRONTEND_BUCKET_NAME` | Set AFTER step 6: `terraform output frontend_bucket_name` |
| `CLOUDFRONT_DISTRIBUTION_ID` | Set AFTER step 6: `terraform output cloudfront_distribution_id` |
| `VITE_API_BASE_URL` | `https://api.your-domain.sg` |

---

## 6. Deploy Infrastructure with Terraform

```powershell
# From infrastructure/terraform/
cd infrastructure/terraform

# STEP 1: Initialise — downloads providers, connects to S3 backend
terraform init -backend-config=backend.hcl
# What it does: downloads AWS/Kubernetes/Helm providers (~200 MB),
# connects to your S3 bucket for state storage

# STEP 2: Preview what Terraform will create (READ THIS!)
terraform plan \
  -var="domain_name=your-domain.sg" \
  -var="db_password=YourStr0ngP@ssword!2024" \
  -var="alert_email=alerts@your-domain.sg"
# What it does: shows every AWS resource that will be created.
# Expect ~80-100 resources. Read through it before applying.

# STEP 3: Apply — creates all AWS resources
# This takes 20-30 minutes (EKS cluster is the slowest part)
terraform apply \
  -var="domain_name=your-domain.sg" \
  -var="db_password=YourStr0ngP@ssword!2024" \
  -var="alert_email=alerts@your-domain.sg"
# Type 'yes' when prompted
# What it does: creates VPC, EKS cluster, RDS, ElastiCache, all Lambda
# functions, S3 buckets, CloudFront, WAF, Cognito, SQS, EventBridge, SNS

# STEP 4: Save the outputs — you need these values
terraform output
# Copy the output values and add them to GitHub Secrets (see step 5)
```

**Key outputs you need:**
```
eks_cluster_name               = "onetogether-production"
ecr_backend_url                = "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/onetogether-production-backend"
frontend_bucket_name           = "onetogether-production-frontend-123456789012"
cloudfront_distribution_id     = "E1ABCDEF12345"
cloudfront_domain              = "d1234abcd.cloudfront.net"
cognito_user_pool_id           = "ap-southeast-1_AbCdEfGhI"
cognito_client_id              = "1abc2defgh3ijk4lm5nopq6r"
github_actions_role_arn        = "arn:aws:iam::123456789012:role/onetogether-production-github-actions-role"
route53_name_servers           = ["ns-123.awsdns-12.com", ...]
```

---

## 7. Configure kubectl for EKS

```powershell
# Download and configure kubeconfig for the EKS cluster
aws eks update-kubeconfig \
  --name onetogether-production \
  --region ap-southeast-1
# What it does: adds an entry to ~/.kube/config so kubectl knows how to
# authenticate to your EKS cluster using your AWS credentials

# Verify connection to the cluster
kubectl get nodes
# Expected output: 2 nodes with status Ready
# NAME                                         STATUS   ROLES    AGE
# ip-10-0-10-xxx.ap-southeast-1.compute.internal   Ready    <none>   5m
# ip-10-0-11-xxx.ap-southeast-1.compute.internal   Ready    <none>   5m

# Create the application namespace
kubectl apply -f infrastructure/k8s/namespace.yaml
# What it does: creates the 'onetogether' namespace where all app resources live
```

---

## 8. Configure ArgoCD

ArgoCD was installed by Terraform into the `argocd` namespace.

```powershell
# Get the initial ArgoCD admin password
$ARGOCD_PASSWORD = kubectl get secret argocd-initial-admin-secret `
  -n argocd `
  -o jsonpath="{.data.password}" | `
  [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_))
Write-Host "ArgoCD admin password: $ARGOCD_PASSWORD"

# Access ArgoCD UI via port-forward (it has no public endpoint by default)
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Then open: https://localhost:8080
# Username: admin
# Password: (the value above)
# NOTE: Accept the self-signed certificate warning

# Install the ArgoCD CLI (optional but useful)
choco install argocd-cli -y

# Login via CLI
argocd login localhost:8080 `
  --username admin `
  --password $ARGOCD_PASSWORD `
  --insecure

# Change the admin password
argocd account update-password
```

---

## 9. First Docker Build and Push

Before ArgoCD can deploy, you must push the first Docker image to ECR.

```powershell
# Get your ECR URL from Terraform output
$ECR_URL = terraform -chdir=infrastructure/terraform output -raw ecr_backend_url
# Example: 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/onetogether-production-backend

# Log Docker into ECR
aws ecr get-login-password --region ap-southeast-1 | `
  docker login --username AWS --password-stdin $ECR_URL.Split('/')[0]
# What it does: gets a temporary 12-hour ECR auth token and logs Docker in

# Build the backend Docker image (from the project root)
docker build `
  -f apps/backend/Dockerfile `
  -t "${ECR_URL}:latest" `
  .
# What it does: runs the multi-stage build — compiles TypeScript in stage 1,
# creates a lean production image in stage 2

# Push the image to ECR
docker push "${ECR_URL}:latest"
# What it does: uploads the image layers to your private ECR registry

# Update the Deployment manifest to reference your ECR URL
# Open infrastructure/k8s/backend/deployment.yaml and replace:
# ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/onetogether-production-backend
# with your actual ECR URL
$accountId = aws sts get-caller-identity --query Account --output text
(Get-Content infrastructure/k8s/backend/deployment.yaml) `
  -replace "ACCOUNT_ID", $accountId | `
  Set-Content infrastructure/k8s/backend/deployment.yaml
```

---

## 10. Configure ArgoCD Application

```powershell
# Edit the ArgoCD Application manifest with your GitHub repo URL
notepad infrastructure/k8s/argocd/application.yaml
# Replace: https://github.com/YOUR_GITHUB_ORG/OneTogether.git
# With:    your actual GitHub repo URL

# Apply the ArgoCD Application (this tells ArgoCD what to watch)
kubectl apply -f infrastructure/k8s/argocd/application.yaml
# What it does: creates an ArgoCD Application resource that watches
# infrastructure/k8s/backend/ in your repo and syncs to EKS

# Create the K8s secrets (DB password, Redis URL, Cognito IDs)
# The CI/CD pipeline does this automatically on each deploy, but for the first
# time run these commands manually:

$TF = "infrastructure/terraform"

# Get DB URL from Secrets Manager
$DB_SECRET = aws secretsmanager get-secret-value `
  --secret-id onetogether-production/database `
  --query SecretString --output text | ConvertFrom-Json
$DB_URL = $DB_SECRET.url

# Get Redis URL from Secrets Manager
$CACHE_SECRET = aws secretsmanager get-secret-value `
  --secret-id onetogether-production/cache `
  --query SecretString --output text | ConvertFrom-Json
$REDIS_URL = $CACHE_SECRET.url

# Get Cognito values
$COGNITO_POOL = terraform -chdir=$TF output -raw cognito_user_pool_id
$COGNITO_CLIENT = terraform -chdir=$TF output -raw cognito_client_id

# Create the K8s Secret
kubectl create secret generic onetogether-secrets `
  --namespace onetogether `
  --from-literal=DATABASE_URL="$DB_URL" `
  --from-literal=REDIS_URL="$REDIS_URL" `
  --from-literal=COGNITO_USER_POOL_ID="$COGNITO_POOL" `
  --from-literal=COGNITO_CLIENT_ID="$COGNITO_CLIENT" `
  --save-config --dry-run=client -o yaml | kubectl apply -f -

# Get the runtime config values
$SQS_URL = aws sqs get-queue-url `
  --queue-name onetogether-production-incident-events `
  --query QueueUrl --output text
$SNS_ARN = terraform -chdir=$TF output -raw sns_emergency_alerts_arn
$EB_BUS  = terraform -chdir=$TF output -raw eventbridge_bus_name

# Create the K8s ConfigMap
kubectl create configmap onetogether-config `
  --namespace onetogether `
  --from-literal=SQS_INCIDENT_QUEUE_URL="$SQS_URL" `
  --from-literal=EVENTBRIDGE_BUS_NAME="$EB_BUS" `
  --from-literal=SNS_ALERTS_TOPIC_ARN="$SNS_ARN" `
  --from-literal=AWS_REGION="ap-southeast-1" `
  --save-config --dry-run=client -o yaml | kubectl apply -f -

# Trigger the first ArgoCD sync
argocd app sync onetogether-backend
# What it does: applies all manifests in infrastructure/k8s/backend/ to EKS

# Watch the rollout
kubectl rollout status deployment/backend -n onetogether
# Expected: successfully rolled out
```

---

## 11. Deploy Frontend to S3

```powershell
# Get the S3 bucket name from Terraform
$BUCKET = terraform -chdir=infrastructure/terraform output -raw frontend_bucket_name
$CF_ID  = terraform -chdir=infrastructure/terraform output -raw cloudfront_distribution_id

# Build the frontend
cd apps/frontend
$env:VITE_API_BASE_URL = "https://api.your-domain.sg"
$env:VITE_COGNITO_CLIENT_ID = (terraform -chdir=../../infrastructure/terraform output -raw cognito_client_id)
$env:VITE_COGNITO_USER_POOL_ID = (terraform -chdir=../../infrastructure/terraform output -raw cognito_user_pool_id)
$env:VITE_AWS_REGION = "ap-southeast-1"
npm run build
cd ../..
# What it does: compiles React + TypeScript into a production bundle in apps/frontend/dist/

# Upload to S3 (static assets with aggressive caching)
aws s3 sync apps/frontend/dist/ "s3://$BUCKET/" `
  --delete `
  --cache-control "public,max-age=31536000,immutable" `
  --exclude "index.html"
# What it does: uploads all hashed JS/CSS/image files with 1-year browser cache

# Upload index.html separately with no-cache
aws s3 cp apps/frontend/dist/index.html "s3://$BUCKET/index.html" `
  --cache-control "no-store,no-cache,must-revalidate"
# What it does: ensures users always get the latest index.html

# Invalidate CloudFront cache so the new version is served globally within ~30 seconds
aws cloudfront create-invalidation `
  --distribution-id $CF_ID `
  --paths "/*"
# What it does: tells all CloudFront edge locations to drop their cached copies
```

---

## 12. Configure Route 53 / DNS

After Terraform creates the Route 53 hosted zone, you need to point your domain to it.

```powershell
# Get your Route 53 nameservers
terraform -chdir=infrastructure/terraform output route53_name_servers
# Returns 4 nameservers like:
# ns-123.awsdns-12.com
# ns-456.awsdns-34.net
# ns-789.awsdns-56.co.uk
# ns-012.awsdns-78.org
```

**Update your domain registrar:**
1. Go to your domain registrar (GoDaddy, Namecheap, AWS Route 53 Domain Registration, etc.)
2. Find **DNS / Nameservers** settings for your domain
3. Replace the existing nameservers with the 4 AWS nameservers above
4. Wait 5-48 hours for DNS propagation

**Verify DNS propagation:**
```powershell
# Check if your domain resolves to CloudFront
nslookup your-domain.sg
# Should return the CloudFront IP address

# Check if the ACM certificate is active
aws acm list-certificates --region us-east-1 --query "CertificateSummaryList[?DomainName=='your-domain.sg']"
# Status should be: ISSUED
```

---

## 13. GitHub Actions — Ongoing CI/CD

After the initial setup, all deployments are automated:

| Workflow | Triggers | What it does |
|---|---|---|
| `deploy-infra.yml` | Push to `main` changing `infrastructure/terraform/**` | Runs `terraform plan` (PR) or `terraform apply` (push to main) |
| `deploy-backend.yml` | Push to `main` changing `apps/backend/**` | Builds Docker image → ECR → updates K8s Deployment |
| `deploy-frontend.yml` | Push to `main` changing `apps/frontend/**` | Builds React → S3 → CloudFront invalidation |

**To update the GitHub Actions IAM role (first time only):**
```powershell
# Get the role ARN from Terraform
terraform -chdir=infrastructure/terraform output github_actions_role_arn
# Copy this value to GitHub secret: AWS_ROLE_ARN
```

**To also update iam.tf with your actual GitHub org/repo (important!):**
Edit [infrastructure/terraform/iam.tf](infrastructure/terraform/iam.tf) and find:
```hcl
"token.actions.githubusercontent.com:sub" = "repo:YOUR_GITHUB_ORG/${var.project}:*"
```
Replace `YOUR_GITHUB_ORG` with your actual GitHub username or organisation name,
then run `terraform apply` again.

---

## 14. Verify the Deployment

```powershell
# 1. Check all pods are running
kubectl get pods -n onetogether
# Expected: 2 backend pods with status Running

# 2. Check services and ingress
kubectl get svc,ingress -n onetogether
# The ingress ADDRESS column shows the ALB DNS name

# 3. Test the backend API via the ALB
$ALB = kubectl get ingress backend -n onetogether -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
curl "http://$ALB/api/incidents"
# Expected: JSON array of incidents

# 4. Test the frontend
# Open your domain in a browser: https://your-domain.sg
# You should see the OneTogether login page

# 5. Check Lambda functions
aws lambda invoke --function-name onetogether-production-process-incident `
  --payload '{"Records":[{"body":"{\"title\":\"Test\",\"type\":\"Flood\"}"}]}' `
  --cli-binary-format raw-in-base64-out `
  response.json
cat response.json

# 6. Monitor EKS logs
kubectl logs -l app=backend -n onetogether --follow

# 7. Check CloudWatch logs for Lambda
aws logs tail /aws/lambda/onetogether-production-process-incident --follow
```

---

## 15. Cost Estimate

Approximate monthly costs in ap-southeast-1 (Singapore):

| Service | Spec | Est. Cost/month |
|---|---|---|
| EKS Cluster | Control plane | ~$73 |
| EC2 Nodes | 2x t3.medium (auto-scale) | ~$60 |
| RDS PostgreSQL | db.t3.medium Multi-AZ | ~$100 |
| ElastiCache | cache.t3.micro | ~$18 |
| NAT Gateways | 2x (one per AZ) | ~$65 |
| Application Load Balancer | 1x | ~$20 |
| CloudFront | First 1TB free, minimal for prototype | ~$5 |
| Route 53 | 1 hosted zone | ~$0.50 |
| S3 | Frontend + data lake (~10 GB) | ~$2 |
| Lambda | Millions of free invocations | ~$1 |
| ECR | ~5 GB storage | ~$0.50 |
| WAF | Per-rule + per-request pricing | ~$10 |
| Secrets Manager | 3 secrets | ~$1.50 |
| **Total** | | **~$357/month** |

> To reduce costs for development/testing: use `t3.small` nodes, single-AZ RDS,
> and set `eks_desired_nodes = 1`. Do NOT use `db.t3.micro` for RDS — it lacks
> enough RAM for PostgreSQL under any real load.

---

## 16. Troubleshooting

### Terraform init fails: "No valid credential sources found"
```powershell
aws configure  # Re-enter your credentials
aws sts get-caller-identity  # Verify it works
```

### EKS nodes not joining the cluster
```powershell
# Check node group status
aws eks describe-nodegroup --cluster-name onetogether-production --nodegroup-name onetogether-production-nodes
# Look for: status = ACTIVE and health issues
```

### Backend pods in CrashLoopBackOff
```powershell
# See the crash reason
kubectl describe pod -l app=backend -n onetogether
kubectl logs -l app=backend -n onetogether --previous
# Common cause: missing K8s secrets. Re-run step 10 to create them.
```

### Lambda can not reach RDS
The Lambda security group allows all outbound traffic. Check:
1. RDS security group allows inbound port 5432 from the Lambda security group
2. Lambda is in the same VPC as RDS (private subnets)
3. Database credentials in Secrets Manager are correct

### CloudFront returns 403
The S3 bucket policy was not applied. Run:
```powershell
terraform -chdir=infrastructure/terraform apply -target=aws_s3_bucket_policy.frontend
```

### ACM certificate stuck in PENDING_VALIDATION
The Route 53 CNAME validation records were not created. Run:
```powershell
terraform -chdir=infrastructure/terraform apply -target=aws_route53_record.cert_validation
```
Then wait up to 5 minutes for AWS to validate the certificate.

### ArgoCD app is OutOfSync
```powershell
argocd app sync onetogether-backend --force
kubectl rollout status deployment/backend -n onetogether
```

### Docker push to ECR fails: "no basic auth credentials"
```powershell
# Re-authenticate Docker to ECR (tokens expire after 12 hours)
aws ecr get-login-password --region ap-southeast-1 | `
  docker login --username AWS --password-stdin `
  (aws sts get-caller-identity --query Account --output text) + ".dkr.ecr.ap-southeast-1.amazonaws.com"
```

---

## Summary of All Commands

```powershell
# 1. Install tools (admin PowerShell)
choco install -y awscli terraform kubernetes-helm kubernetes-cli docker-desktop nodejs

# 2. Configure AWS
aws configure

# 3. Bootstrap state backend
.\infrastructure\bootstrap\init-backend.ps1

# 4. Configure variables
cd infrastructure/terraform
Copy-Item backend.hcl.example backend.hcl     # Edit: set bucket name
Copy-Item terraform.tfvars.example terraform.tfvars  # Edit: domain, password, email

# 5. Deploy infrastructure (20-30 min)
terraform init -backend-config=backend.hcl
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars

# 6. Configure kubectl
aws eks update-kubeconfig --name onetogether-production --region ap-southeast-1

# 7. Push first Docker image
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin (terraform output -raw ecr_backend_url).Split("/")[0]
docker build -f apps/backend/Dockerfile -t "$(terraform output -raw ecr_backend_url):latest" .
docker push "$(terraform output -raw ecr_backend_url):latest"

# 8. Apply K8s manifests + ArgoCD
kubectl apply -f infrastructure/k8s/namespace.yaml
kubectl apply -f infrastructure/k8s/argocd/application.yaml

# 9. Deploy frontend
npm run build --workspace=apps/frontend
aws s3 sync apps/frontend/dist/ "s3://$(terraform output -raw frontend_bucket_name)/" --delete
aws cloudfront create-invalidation --distribution-id (terraform output -raw cloudfront_distribution_id) --paths "/*"

# 10. Point your domain registrar to the Route 53 nameservers
terraform output route53_name_servers
```
