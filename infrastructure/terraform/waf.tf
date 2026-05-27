# ============================================================
# WAF — Web Application Firewall in front of CloudFront
# Must be created in us-east-1 (AWS requirement for CloudFront WAF)
# ============================================================

resource "aws_wafv2_web_acl" "cloudfront" {
  provider    = aws.us_east_1
  name        = "${local.name}-cloudfront-waf"
  scope       = "CLOUDFRONT"
  description = "WAF protecting OneTogether CloudFront distribution"

  default_action {
    allow {}
  }

  # --- AWS Managed Rules: Core Rule Set (blocks OWASP Top 10) ---------------
  rule {
    name     = "AWSManagedRulesCoreRuleSet"
    priority = 1

    override_action { none {} }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCoreRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CoreRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # --- AWS Managed Rules: Known Bad Inputs -----------------------------------
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action { none {} }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputs"
      sampled_requests_enabled   = true
    }
  }

  # --- Rate limiting: 2000 requests per 5 min per IP -------------------------
  rule {
    name     = "RateLimit"
    priority = 3

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name}-waf"
    sampled_requests_enabled   = true
  }

  tags = local.tags
}
