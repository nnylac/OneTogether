# ============================================================
# Lambda functions — all three are VPC-attached so they can
# reach RDS and ElastiCache in the private subnets
# ============================================================

# Zip the local Lambda source code for deployment
data "archive_file" "process_incident" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/process-incident"
  output_path = "${path.module}/../../.tmp/process-incident.zip"
}

data "archive_file" "data_ingestion" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/data-ingestion"
  output_path = "${path.module}/../../.tmp/data-ingestion.zip"
}

data "archive_file" "ai_advisory" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/ai-advisory"
  output_path = "${path.module}/../../.tmp/ai-advisory.zip"
}

# --- ProcessIncident: classify, enrich incidents; triggered by SQS ----------
resource "aws_lambda_function" "process_incident" {
  function_name    = "${local.name}-process-incident"
  role             = aws_iam_role.lambda_process_incident.arn
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  filename         = data.archive_file.process_incident.output_path
  source_code_hash = data.archive_file.process_incident.output_base64sha256
  timeout          = 90   # SQS visibility timeout must be greater than this
  memory_size      = 512

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_SECRET_ARN    = aws_secretsmanager_secret.db.arn
      EVENTBRIDGE_BUS  = aws_cloudwatch_event_bus.main.name
      AWS_REGION_NAME  = var.aws_region
    }
  }

  tags = local.tags
}

# --- DataIngestion: fetch external data when an incident is validated -------
resource "aws_lambda_function" "data_ingestion" {
  function_name    = "${local.name}-data-ingestion"
  role             = aws_iam_role.lambda_data_ingestion.arn
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  filename         = data.archive_file.data_ingestion.output_path
  source_code_hash = data.archive_file.data_ingestion.output_base64sha256
  timeout          = 60
  memory_size      = 256

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DATA_LAKE_BUCKET = aws_s3_bucket.data_lake.id
      AWS_REGION_NAME  = var.aws_region
    }
  }

  tags = local.tags
}

# --- AIAdvisory: generate response suggestions using Bedrock Claude ---------
resource "aws_lambda_function" "ai_advisory" {
  function_name    = "${local.name}-ai-advisory"
  role             = aws_iam_role.lambda_ai_advisory.arn
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  filename         = data.archive_file.ai_advisory.output_path
  source_code_hash = data.archive_file.ai_advisory.output_base64sha256
  timeout          = 120   # Bedrock calls can take up to 30s
  memory_size      = 512

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DATA_LAKE_BUCKET     = aws_s3_bucket.data_lake.id
      SNS_TOPIC_ARN        = aws_sns_topic.emergency_alerts.arn
      BEDROCK_MODEL_ID     = "anthropic.claude-3-5-sonnet-20241022-v2:0"
      AWS_REGION_NAME      = var.aws_region
    }
  }

  tags = local.tags
}

# CloudWatch log groups with 30-day retention (instead of unlimited)
resource "aws_cloudwatch_log_group" "process_incident" {
  name              = "/aws/lambda/${aws_lambda_function.process_incident.function_name}"
  retention_in_days = 30
  tags              = local.tags
}

resource "aws_cloudwatch_log_group" "data_ingestion" {
  name              = "/aws/lambda/${aws_lambda_function.data_ingestion.function_name}"
  retention_in_days = 30
  tags              = local.tags
}

resource "aws_cloudwatch_log_group" "ai_advisory" {
  name              = "/aws/lambda/${aws_lambda_function.ai_advisory.function_name}"
  retention_in_days = 30
  tags              = local.tags
}
