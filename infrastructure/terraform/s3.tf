# ============================================================
# S3 buckets — frontend static site, data lake, Terraform state
# ============================================================

# --- Frontend static site bucket (served via CloudFront) --------------------
resource "aws_s3_bucket" "frontend" {
  bucket        = "${local.name}-frontend-${data.aws_caller_identity.current.account_id}"
  force_destroy = true  # allows terraform destroy to empty and delete the bucket
  tags          = local.tags
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  # Block all direct public access; CloudFront OAC handles access
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# --- Data Lake (incident reports, AI advisory history) ----------------------
resource "aws_s3_bucket" "data_lake" {
  bucket        = "${local.name}-data-lake-${data.aws_caller_identity.current.account_id}"
  force_destroy = true  # allows terraform destroy to empty and delete the bucket
  tags          = local.tags
}

resource "aws_s3_bucket_public_access_block" "data_lake" {
  bucket                  = aws_s3_bucket.data_lake.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "data_lake" {
  bucket = aws_s3_bucket.data_lake.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_lake" {
  bucket = aws_s3_bucket.data_lake.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle: move incident data older than 90 days to Glacier for cost saving
resource "aws_s3_bucket_lifecycle_configuration" "data_lake" {
  bucket = aws_s3_bucket.data_lake.id

  rule {
    id     = "archive-old-incidents"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 90
      storage_class = "GLACIER_IR"
    }
  }
}
