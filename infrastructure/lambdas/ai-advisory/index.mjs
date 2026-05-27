/**
 * AIAdvisory Lambda
 *
 * Trigger: EventBridge rule on Critical/High IncidentValidated events
 * What it does:
 *   1. Reads the enriched context from the S3 data lake
 *   2. Calls AWS Bedrock (Claude) to generate actionable response suggestions
 *   3. Stores the AI advisory in S3: incidents/{id}/advisory.json
 *   4. For Critical incidents, publishes an emergency SNS alert
 */

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const s3      = new S3Client({ region: process.env.AWS_REGION });
const sns     = new SNSClient({ region: process.env.AWS_REGION });

const BUCKET     = process.env.DATA_LAKE_BUCKET;
const MODEL_ID   = process.env.BEDROCK_MODEL_ID;
const TOPIC_ARN  = process.env.SNS_TOPIC_ARN;

async function readFromS3(key) {
  try {
    const res  = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const body = await res.Body.transformToString();
    return JSON.parse(body);
  } catch (err) {
    if (err.name === "NoSuchKey") return null;
    throw err;
  }
}

async function generateAdvisory(incident, context) {
  const prompt = `You are an emergency response coordinator for Singapore.
An incident has been reported. Generate concise, actionable response recommendations.

INCIDENT:
- ID: ${incident.id}
- Title: ${incident.title ?? "N/A"}
- Type: ${incident.type ?? "Unknown"}
- Severity: ${incident.severity}
- Status: ${incident.status}

CONTEXT:
- Weather: ${JSON.stringify(context?.weather ?? {})}
- Nearby hospitals: ${JSON.stringify(context?.hospitals ?? {})}

Respond with a JSON object with this exact structure:
{
  "immediateActions": ["action1", "action2"],
  "resourcesRequired": ["resource1", "resource2"],
  "estimatedDuration": "string",
  "riskFactors": ["risk1", "risk2"],
  "coordinationNotes": "string"
}`;

  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens:        1024,
    messages: [{
      role:    "user",
      content: prompt,
    }],
  });

  const res     = await bedrock.send(new InvokeModelCommand({ modelId: MODEL_ID, body }));
  const decoded = JSON.parse(Buffer.from(res.body).toString("utf-8"));
  const text    = decoded.content[0].text;

  // Extract JSON from the model response
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Model response did not contain JSON");
  return JSON.parse(match[0]);
}

export async function handler(event) {
  const incident = event.detail;

  if (!incident?.id) {
    console.warn("No incident ID in event", JSON.stringify(event));
    return;
  }

  console.log(`Generating advisory for incident ${incident.id} severity=${incident.severity}`);

  // Read enriched context from data lake (written by DataIngestion Lambda)
  const enriched = await readFromS3(`incidents/${incident.id}/context.json`);
  const context  = enriched?.context ?? {};

  // Generate AI advisory using Claude via Bedrock
  const advisory = await generateAdvisory(incident, context);

  const result = {
    incidentId:  incident.id,
    severity:    incident.severity,
    advisory,
    generatedAt: new Date().toISOString(),
    modelId:     MODEL_ID,
  };

  // Save advisory to data lake
  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         `incidents/${incident.id}/advisory.json`,
    Body:        JSON.stringify(result, null, 2),
    ContentType: "application/json",
  }));

  // Publish emergency SNS alert for Critical incidents
  if (incident.severity === "Critical") {
    const message = [
      `CRITICAL INCIDENT: ${incident.title ?? incident.id}`,
      `Type: ${incident.type ?? "Unknown"}`,
      `Immediate actions required:`,
      ...(advisory.immediateActions ?? []).map(a => `  - ${a}`),
      ``,
      `View details on OneTogether dashboard.`,
    ].join("\n");

    await sns.send(new PublishCommand({
      TopicArn: TOPIC_ARN,
      Subject:  `[OneTogether] CRITICAL: ${incident.title ?? incident.id}`,
      Message:  message,
    }));

    console.log("Emergency SNS alert sent");
  }

  console.log(`Advisory stored for incident ${incident.id}`);
  return result;
}
