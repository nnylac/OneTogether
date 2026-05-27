# ============================================================
# SNS — emergency alert broadcast to citizens via email/SMS
# ============================================================

resource "aws_sns_topic" "emergency_alerts" {
  name         = "${local.name}-emergency-alerts"
  display_name = "OneTogether Emergency Alerts"
  tags         = local.tags
}

# Email subscription — the alert_email variable owner confirms via email
resource "aws_sns_topic_subscription" "alert_email" {
  topic_arn = aws_sns_topic.emergency_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Allow the EKS backend (government role) to publish emergency broadcasts
resource "aws_sns_topic_policy" "emergency_alerts" {
  arn = aws_sns_topic.emergency_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEKSPublish"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.eks_nodes.arn
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.emergency_alerts.arn
      },
      {
        Sid    = "AllowAIAdvisoryPublish"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.lambda_ai_advisory.arn
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.emergency_alerts.arn
      }
    ]
  })
}
