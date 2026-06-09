# ============================================================
# CloudFront CDN + ACM certificate for the React frontend
# ACM cert + DNS records are only created when domain_configured = true.
# Until then, CloudFront uses its default *.cloudfront.net certificate.
# ============================================================

# ACM certificate must be in us-east-1 for CloudFront
resource "aws_acm_certificate" "cloudfront" {
  count             = var.domain_configured ? 1 : 0
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = local.tags
}

# CNAME records Route 53 needs to validate the cert
resource "aws_route53_record" "cert_validation" {
  for_each = var.domain_configured ? {
    for dvo in aws_acm_certificate.cloudfront[0].domain_validation_options : dvo.domain_name => {
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

resource "aws_acm_certificate_validation" "cloudfront" {
  count                   = var.domain_configured ? 1 : 0
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cloudfront[0].arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# Origin Access Control: CloudFront gets exclusive read access to the S3 bucket
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${local.name}-frontend-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 bucket policy: only allow CloudFront OAC to read objects
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowCloudFrontOAC"
      Effect = "Allow"
      Principal = {
        Service = "cloudfront.amazonaws.com"
      }
      Action   = "s3:GetObject"
      Resource = "${aws_s3_bucket.frontend.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
        }
      }
    }]
  })
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  # Aliases require a custom cert — omit when using the default CloudFront cert
  aliases    = var.domain_configured ? [var.domain_name, "www.${var.domain_name}"] : []
  web_acl_id = var.enable_waf ? aws_wafv2_web_acl.cloudfront[0].arn : null
  price_class = "PriceClass_200"  # US, EU, Asia — covers Singapore

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.frontend.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # Backend API origin (the k8s-managed ALB). Only added when backend_alb_domain
  # is set. CloudFront talks to the ALB over plain HTTP; viewers still use HTTPS.
  dynamic "origin" {
    for_each = var.backend_alb_domain != "" ? [1] : []
    content {
      domain_name = var.backend_alb_domain
      origin_id   = "ALB-backend"
      custom_origin_config {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "http-only"
        origin_ssl_protocols   = ["TLSv1.2"]
      }
    }
  }

  # Proxy /api/* to the backend — no caching, forward everything (auth headers,
  # cookies, query string) so login and dynamic requests work.
  dynamic "ordered_cache_behavior" {
    for_each = var.backend_alb_domain != "" ? [1] : []
    content {
      path_pattern           = "/api/*"
      target_origin_id       = "ALB-backend"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
      cached_methods         = ["GET", "HEAD"]
      compress               = true
      # Managed-CachingDisabled + Managed-AllViewer (forwards all headers/cookies/qs)
      cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
      origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3"
    }
  }

  # Proxy WebSocket traffic for the incident room gateway.
  dynamic "ordered_cache_behavior" {
    for_each = var.backend_alb_domain != "" ? [1] : []
    content {
      path_pattern           = "/socket.io/*"
      target_origin_id       = "ALB-backend"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
      cached_methods         = ["GET", "HEAD"]
      compress               = false
      cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
      origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3"
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.frontend.id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    cache_policy_id          = "658327ea-f89d-4fab-a63d-7e88639e58f6"  # Managed-CachingOptimized
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"  # Managed-CORS-S3Origin
  }

  # React SPA: 404/403 responses should serve index.html for client-side routing
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    # When domain_configured = false: use the free *.cloudfront.net default cert.
    # When domain_configured = true: use the validated ACM cert with the custom domain.
    cloudfront_default_certificate = var.domain_configured ? null : true
    acm_certificate_arn            = var.domain_configured ? aws_acm_certificate_validation.cloudfront[0].certificate_arn : null
    ssl_support_method             = var.domain_configured ? "sni-only" : null
    minimum_protocol_version       = var.domain_configured ? "TLSv1.2_2021" : null
  }

  tags = local.tags
}
