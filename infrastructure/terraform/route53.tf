# ============================================================
# Route 53 — DNS for onetogether.sg
# All resources are gated on var.domain_configured = true.
# Set that flag only after you own the domain and have pointed
# its nameservers at the Route 53 hosted zone (see outputs).
# ============================================================

resource "aws_route53_zone" "main" {
  count = var.domain_configured ? 1 : 0
  name  = var.domain_name
  tags  = local.tags
}

# Apex domain → CloudFront
resource "aws_route53_record" "apex" {
  count   = var.domain_configured ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}

# www → CloudFront
resource "aws_route53_record" "www" {
  count   = var.domain_configured ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}

# ACM certificate in ap-southeast-1 for the ALB (backend API)
resource "aws_acm_certificate" "alb" {
  count             = var.domain_configured ? 1 : 0
  domain_name       = "api.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = local.tags
}

resource "aws_route53_record" "alb_cert_validation" {
  for_each = var.domain_configured ? {
    for dvo in aws_acm_certificate.alb[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  } : {}

  zone_id = aws_route53_zone.main[0].zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "alb" {
  count                   = var.domain_configured ? 1 : 0
  certificate_arn         = aws_acm_certificate.alb[0].arn
  validation_record_fqdns = [for r in aws_route53_record.alb_cert_validation : r.fqdn]
}
