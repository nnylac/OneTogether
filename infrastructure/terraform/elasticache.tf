# ============================================================
# ElastiCache — Valkey (Redis-compatible) for live incident
# dashboard and map caching.
# Valkey requires aws_elasticache_replication_group, not
# aws_elasticache_cluster (which only supports Memcached/Redis).
# ============================================================

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${local.name}-cache"
  description          = "Valkey cache for incident dashboard and map caching"

  engine         = "valkey"
  engine_version = "7.2"
  node_type      = var.elasticache_node_type
  port           = 6379

  # Single node; increase num_cache_clusters to 2+ for primary+replica HA
  num_cache_clusters = 1

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.elasticache.id]

  at_rest_encryption_enabled = true

  snapshot_retention_limit = 1
  snapshot_window          = "02:00-03:00"

  tags = local.tags
}
