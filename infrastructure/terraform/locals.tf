# Shared local values used across all Terraform files in this directory.
locals {
  name   = "${var.project}-${var.environment}"
  region = var.aws_region

  # 2 AZs in Singapore for high availability
  vpc_cidr         = "10.0.0.0/16"
  azs              = ["${var.aws_region}a", "${var.aws_region}b"]
  public_subnets   = ["10.0.0.0/24", "10.0.1.0/24"]   # NAT Gateways + ALB
  private_subnets  = ["10.0.10.0/24", "10.0.11.0/24"] # EKS nodes + Lambda
  database_subnets = ["10.0.20.0/24", "10.0.21.0/24"] # RDS + ElastiCache

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
