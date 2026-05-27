# ============================================================
# EventBridge — custom event bus that routes incident events
# to DataIngestion and AIAdvisory Lambdas
# ============================================================

resource "aws_cloudwatch_event_bus" "main" {
  name = "${local.name}-events"
  tags = local.tags
}

# --- Rule: route validated incidents to DataIngestion Lambda ----------------
resource "aws_cloudwatch_event_rule" "data_ingestion" {
  name           = "${local.name}-trigger-data-ingestion"
  event_bus_name = aws_cloudwatch_event_bus.main.name
  description    = "Fires when a new incident is validated; triggers DataIngestion to fetch external data"

  # Match events published by the EKS backend when an incident is created/updated
  event_pattern = jsonencode({
    source      = ["onetogether.incidents"]
    detail-type = ["IncidentValidated"]
  })

  tags = local.tags
}

resource "aws_cloudwatch_event_target" "data_ingestion" {
  rule           = aws_cloudwatch_event_rule.data_ingestion.name
  event_bus_name = aws_cloudwatch_event_bus.main.name
  arn            = aws_lambda_function.data_ingestion.arn
  target_id      = "DataIngestionLambda"
}

resource "aws_lambda_permission" "eventbridge_data_ingestion" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_ingestion.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.data_ingestion.arn
}

# --- Rule: route critical incidents to AIAdvisory Lambda --------------------
resource "aws_cloudwatch_event_rule" "ai_advisory" {
  name           = "${local.name}-trigger-ai-advisory"
  event_bus_name = aws_cloudwatch_event_bus.main.name
  description    = "Fires on critical/high incidents; triggers AIAdvisory to generate response suggestions"

  event_pattern = jsonencode({
    source      = ["onetogether.incidents"]
    detail-type = ["IncidentValidated"]
    detail = {
      severity = ["Critical", "High"]
    }
  })

  tags = local.tags
}

resource "aws_cloudwatch_event_target" "ai_advisory" {
  rule           = aws_cloudwatch_event_rule.ai_advisory.name
  event_bus_name = aws_cloudwatch_event_bus.main.name
  arn            = aws_lambda_function.ai_advisory.arn
  target_id      = "AIAdvisoryLambda"
}

resource "aws_lambda_permission" "eventbridge_ai_advisory" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ai_advisory.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ai_advisory.arn
}
