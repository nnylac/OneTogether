# ============================================================
# RDS PostgreSQL — Multi-AZ primary + standby
# ============================================================

resource "aws_db_instance" "main" {
  identifier = "${local.name}-postgres"

  engine               = "postgres"
  engine_version       = "16"
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  max_allocated_storage = 500  # Autoscaling ceiling in GB

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password  # Pulled from TF_VAR_db_password env var in CI/CD

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false  # Only accessible from within the VPC

  # Single-AZ for dev/prototype — set to true when going to production
  multi_az = false

  # Storage
  storage_type      = "gp3"
  storage_encrypted = true  # Encrypt at rest with AWS-managed key

  # Backups: 7-day retention window with a maintenance window at low-traffic time
  backup_retention_period = 7
  backup_window           = "03:00-04:00"  # 3-4 AM SGT (UTC+8), low traffic
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Set deletion_protection = true and skip_final_snapshot = false before going to production
  deletion_protection       = false
  skip_final_snapshot       = true

  # Ship slow-query and error logs to CloudWatch
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = local.tags
}
