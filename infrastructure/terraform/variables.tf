variable "project" {
  description = "Short project name used as a prefix for all AWS resource names"
  type        = string
  default     = "onetogether"
}

variable "environment" {
  description = "Deployment environment (staging | production)"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region where most resources are deployed"
  type        = string
  default     = "ap-southeast-1"
}

variable "domain_name" {
  description = "Primary domain name, e.g. onetogether.sg. Used for Route 53, ACM, and CloudFront. Leave empty string when domain_configured = false."
  type        = string
  default     = ""
}

variable "enable_waf" {
  description = "Set to true to attach a WAFv2 WebACL to CloudFront. Disable if CreateWebACL fails on a new account (WAFv2 CLOUDFRONT scope may need a one-time manual activation via the console)."
  type        = bool
  default     = false
}

variable "domain_configured" {
  description = "Set to true only after you own the domain and have pointed its nameservers at the Route 53 hosted zone. Until then, CloudFront uses its default *.cloudfront.net certificate and no DNS records are created."
  type        = bool
  default     = false
}

variable "backend_alb_domain" {
  description = "Public DNS name of the backend ALB created by the k8s ingress (e.g. k8s-onetogeth-backend-xxxx.ap-southeast-1.elb.amazonaws.com). When set, CloudFront proxies /api/* and /socket.io/* to it so the SPA can reach the API same-origin. Get it with: kubectl get ingress backend -n onetogether. Leave empty to disable API proxying."
  type        = string
  default     = ""
}

# ---------------------------------------------------------------------------
# EKS
# ---------------------------------------------------------------------------
variable "eks_kubernetes_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.30"
}

variable "eks_node_instance_type" {
  description = "EC2 instance type for EKS worker nodes"
  type        = string
  default     = "t3.medium"
}

variable "eks_desired_nodes" {
  type    = number
  default = 2
}

variable "eks_min_nodes" {
  type    = number
  default = 2
}

variable "eks_max_nodes" {
  type    = number
  default = 6
}

# ---------------------------------------------------------------------------
# RDS
# ---------------------------------------------------------------------------
variable "db_instance_class" {
  type    = string
  default = "db.t3.medium"
}

variable "db_allocated_storage" {
  type    = number
  default = 100
}

variable "db_name" {
  type    = string
  default = "onetogether"
}

variable "db_username" {
  type    = string
  default = "onetogether_admin"
}

variable "db_password" {
  description = "Master password for RDS PostgreSQL — never commit; supply via TF_VAR_db_password or GitHub Secret"
  type        = string
  sensitive   = true
}

# ---------------------------------------------------------------------------
# ElastiCache
# ---------------------------------------------------------------------------
variable "elasticache_node_type" {
  type    = string
  default = "cache.t3.micro"
}

# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------
variable "alert_email" {
  description = "Email address subscribed to the SNS emergency-alert topic"
  type        = string
}
