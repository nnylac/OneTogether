/**
 * ProcessIncident Lambda
 *
 * Trigger: SQS queue (onetogether-production-incident-events)
 * What it does:
 *   1. Reads each incident record from the SQS message body
 *   2. Classifies severity based on keywords if not already set
 *   3. Enriches the record with a timestamp and unique ID
 *   4. Publishes a validated IncidentValidated event to EventBridge
 *      so DataIngestion and AIAdvisory Lambdas can react
 */

import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const eb = new EventBridgeClient({ region: process.env.AWS_REGION });

// Simple keyword-based severity classification
const SEVERITY_KEYWORDS = {
  Critical: ["earthquake", "tsunami", "explosion", "mass casualty", "flooding"],
  High:     ["fire", "collapsed", "injury", "flood", "chemical"],
  Medium:   ["accident", "disruption", "power outage"],
};

function classifySeverity(title = "", description = "") {
  const text = `${title} ${description}`.toLowerCase();
  for (const [level, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) return level;
  }
  return "Low";
}

export async function handler(event) {
  const results = await Promise.allSettled(
    event.Records.map(async (record) => {
      const body = JSON.parse(record.body);

      const incident = {
        ...body,
        id:          body.id ?? crypto.randomUUID(),
        severity:    body.severity ?? classifySeverity(body.title, body.description),
        processedAt: new Date().toISOString(),
        status:      body.status ?? "open",
      };

      // Publish to EventBridge so downstream Lambdas can react
      await eb.send(new PutEventsCommand({
        Entries: [{
          EventBusName: process.env.EVENTBRIDGE_BUS,
          Source:       "onetogether.incidents",
          DetailType:   "IncidentValidated",
          Detail:       JSON.stringify(incident),
          Time:         new Date(),
        }],
      }));

      console.log(`Processed incident ${incident.id} severity=${incident.severity}`);
      return incident.id;
    })
  );

  const failed = results.filter(r => r.status === "rejected");
  if (failed.length) {
    // Re-throw so SQS retries the batch (failed messages go to DLQ after 3 attempts)
    throw new Error(`${failed.length} records failed: ${failed.map(f => f.reason).join(", ")}`);
  }
}
