# ============================================================
# SQS — incident event queue consumed by ProcessIncident Lambda
# ============================================================

# Dead-letter queue: receives messages that fail processing 3 times
resource "aws_sqs_queue" "incident_events_dlq" {
  name                      = "${local.name}-incident-events-dlq"
  message_retention_seconds = 1209600  # 14 days — enough time to investigate failures

  tags = local.tags
}

resource "aws_sqs_queue" "incident_events" {
  name                       = "${local.name}-incident-events"
  message_retention_seconds  = 86400   # 24 hours
  visibility_timeout_seconds = 120     # Must exceed Lambda timeout (90s)
  receive_wait_time_seconds  = 20      # Long-polling reduces empty-receive costs

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.incident_events_dlq.arn
    maxReceiveCount     = 3  # After 3 failed processing attempts → DLQ
  })

  tags = local.tags
}

# Allow the EKS backend to send messages to the queue
resource "aws_sqs_queue_policy" "incident_events" {
  queue_url = aws_sqs_queue.incident_events.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = aws_iam_role.eks_nodes.arn }
      Action    = ["sqs:SendMessage"]
      Resource  = aws_sqs_queue.incident_events.arn
    }]
  })
}

# Wire ProcessIncident Lambda to consume from the queue
resource "aws_lambda_event_source_mapping" "process_incident_sqs" {
  event_source_arn = aws_sqs_queue.incident_events.arn
  function_name    = aws_lambda_function.process_incident.arn
  batch_size       = 10
  enabled          = true
}
