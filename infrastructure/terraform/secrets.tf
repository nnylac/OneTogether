# ============================================================
# Secrets Manager — store credentials Lambda and EKS can read
# ============================================================

# Database connection string consumed by the backend and ProcessIncident Lambda
resource "aws_secretsmanager_secret" "db" {
  name                    = "${local.name}/database"
  description             = "PostgreSQL connection credentials for OneTogether"
  recovery_window_in_days = 7  # 7-day safety window before permanent deletion

  tags = local.tags
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id

  # Store as JSON so the application can parse individual fields
  secret_string = jsonencode({
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    database = var.db_name
    username = var.db_username
    password = var.db_password
    url      = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.address}:${aws_db_instance.main.port}/${var.db_name}"
  })
}

# ElastiCache connection details
resource "aws_secretsmanager_secret" "cache" {
  name                    = "${local.name}/cache"
  description             = "Valkey/Redis connection details"
  recovery_window_in_days = 7

  tags = local.tags
}

resource "aws_secretsmanager_secret_version" "cache" {
  secret_id = aws_secretsmanager_secret.cache.id

  secret_string = jsonencode({
    host = aws_elasticache_cluster.main.cache_nodes[0].address
    port = aws_elasticache_cluster.main.cache_nodes[0].port
    url  = "redis://${aws_elasticache_cluster.main.cache_nodes[0].address}:${aws_elasticache_cluster.main.cache_nodes[0].port}"
  })
}

# Cognito app client details (used by the backend to verify tokens)
resource "aws_secretsmanager_secret" "cognito" {
  name                    = "${local.name}/cognito"
  description             = "Cognito user pool and client IDs"
  recovery_window_in_days = 7

  tags = local.tags
}

resource "aws_secretsmanager_secret_version" "cognito" {
  secret_id = aws_secretsmanager_secret.cognito.id

  secret_string = jsonencode({
    user_pool_id = aws_cognito_user_pool.main.id
    client_id    = aws_cognito_user_pool_client.frontend.id
    region       = var.aws_region
  })
}
