# ============================================================
# ECR — private container registry for the NestJS backend
# ============================================================

resource "aws_ecr_repository" "backend" {
  name                 = "${local.name}-backend"
  image_tag_mutability = "MUTABLE"  # Allows the 'latest' tag to be updated on each deploy
  force_delete         = true       # allows terraform destroy even when images exist

  # Scan images for known CVEs on push
  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.tags
}

# Lifecycle policy: keep only the 10 most recent images to control storage cost
resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}
