# ============================================================
# ElastiCache — Valkey (Redis-compatible) for live incident
# dashboard and map caching
# ============================================================

resource "aws_elasticache_cluster" "main" {
  cluster_id        = "${local.name}-cache"
  engine            = "valkey"  # AWS Valkey — open-source Redis fork, drop-in compatible
  node_type         = var.elasticache_node_type
  num_cache_nodes   = 1
  engine_version    = "7.2"
  port              = 6379

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.elasticache.id]

  # 1-day snapshot retention for cache warm-up on node replacement
  snapshot_retention_limit = 1
  snapshot_window          = "02:00-03:00"

  tags = local.tags
}
