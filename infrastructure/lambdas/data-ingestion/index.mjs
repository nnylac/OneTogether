/**
 * DataIngestion Lambda
 *
 * Trigger: EventBridge rule on IncidentValidated events
 * What it does:
 *   1. Receives a validated incident from EventBridge
 *   2. Fetches contextual data from external APIs
 *      (weather, traffic, hospital capacity — simulated here)
 *   3. Stores the enriched dataset in the S3 data lake under
 *      incidents/{incidentId}/context.json
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.DATA_LAKE_BUCKET;

/**
 * Simulates fetching weather data for an incident location.
 * Replace this with real API calls (NEA Weather API, OneMap, etc.)
 */
async function fetchWeatherContext(incident) {
  return {
    source:      "nea-simulated",
    temperature: 31,
    humidity:    85,
    rainfall_mm: incident.type === "Flood" ? 48.2 : 0,
    condition:   incident.type === "Flood" ? "Heavy rain" : "Partly cloudy",
    fetchedAt:   new Date().toISOString(),
  };
}

/**
 * Simulates fetching nearby hospital bed availability.
 * Replace with real HealthHub / MOH API calls.
 */
async function fetchHospitalContext(incident) {
  return {
    source:    "moh-simulated",
    hospitals: [
      { name: "SGH", availableBeds: 42, icuAvailable: 5 },
      { name: "NUH", availableBeds: 67, icuAvailable: 8 },
    ],
    fetchedAt: new Date().toISOString(),
  };
}

export async function handler(event) {
  const incident = event.detail;

  if (!incident?.id) {
    console.warn("Received event with no incident ID, skipping", JSON.stringify(event));
    return;
  }

  console.log(`Ingesting data for incident ${incident.id} type=${incident.type}`);

  // Fetch external data in parallel
  const [weather, hospitals] = await Promise.all([
    fetchWeatherContext(incident),
    fetchHospitalContext(incident),
  ]);

  const enrichedContext = {
    incidentId: incident.id,
    incident,
    context: { weather, hospitals },
    enrichedAt: new Date().toISOString(),
  };

  // Store in data lake: incidents/{incidentId}/context.json
  const key = `incidents/${incident.id}/context.json`;
  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        JSON.stringify(enrichedContext, null, 2),
    ContentType: "application/json",
  }));

  console.log(`Stored context at s3://${BUCKET}/${key}`);
  return { incidentId: incident.id, key };
}
