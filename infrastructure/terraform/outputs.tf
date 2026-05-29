# ============================================================
# Outputs — values you need after `terraform apply`
# ============================================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "eks_cluster_name" {
  description = "EKS cluster name — use in: aws eks update-kubeconfig --name <value>"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "EKS API server endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "ecr_backend_url" {
  description = "ECR repository URL for the backend Docker image"
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_bucket_name" {
  description = "S3 bucket name for deploying the built React app"
  value       = aws_s3_bucket.frontend.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID — needed for cache invalidation after frontend deploy"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain" {
  description = "CloudFront domain (before DNS is configured)"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.main.address
  sensitive   = true
}

output "elasticache_endpoint" {
  description = "ElastiCache Valkey primary endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "Cognito App Client ID — add to the frontend VITE_COGNITO_CLIENT_ID"
  value       = aws_cognito_user_pool_client.frontend.id
}

output "cognito_hosted_ui_domain" {
  description = "Cognito Hosted UI domain for OAuth flows"
  value       = "${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "sqs_incident_queue_url" {
  description = "SQS queue URL for incident events"
  value       = aws_sqs_queue.incident_events.url
}

output "eventbridge_bus_name" {
  description = "EventBridge custom bus name"
  value       = aws_cloudwatch_event_bus.main.name
}

output "sns_emergency_alerts_arn" {
  description = "SNS topic ARN for emergency broadcasts"
  value       = aws_sns_topic.emergency_alerts.arn
}

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC — paste into GitHub secret AWS_ROLE_ARN"
  value       = aws_iam_role.github_actions.arn
}

output "route53_name_servers" {
  description = "Copy these 4 NS records to your domain registrar, then set domain_configured = true and re-apply"
  value       = var.domain_configured ? aws_route53_zone.main[0].name_servers : ["set domain_configured = true to create the hosted zone"]
}

output "db_secret_arn" {
  description = "Secrets Manager ARN containing the database credentials"
  value       = aws_secretsmanager_secret.db.arn
}
