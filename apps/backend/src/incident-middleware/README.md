# Incident Middleware

The incident middleware is the backend ingestion layer for simulated external
agency systems. It receives raw agency tickets/logs, normalises them into the
OneTogether incident model, decides whether the message belongs to an existing
incident, and writes frontend-readable incident/log data to the database.

This module is intentionally separate from `integrations`. Use this module for
incident/ticket ingestion from external agencies.

## Endpoint

The backend global prefix is `api`, so the full local endpoint is:

```txt
POST http://localhost:3001/api/incident-middleware/events
```

Docker containers reach the host backend with:

```txt
http://host.docker.internal:3001/api/incident-middleware
```

The top-level `docker-compose.yml` sets this as the default `MIDDLEWARE_URL`.
The simulators append `/events`, so start them with:

```powershell
docker compose up -d --build scenario-engine
```

## Flow

```txt
Scenario engine
  -> sends IncidentTrigger to agencies

Agency simulator
  -> creates its own local ticket/log/handoff
  -> POSTs raw agency message to incident middleware

Incident middleware
  -> normalises messy agency shape
  -> checks existing incident_sources
  -> falls back to simple rule-based similarity
  -> creates or updates incidents
  -> links incident_sources
  -> creates assigned_orgs
  -> writes readable logs.content

Frontend
  -> reads incidents/logs from normal backend APIs
```

## Raw Agency Message Shape

Agencies should send raw facts, not a pre-decided internal event type.

```ts
type RawAgencyMessage = {
  message_kind?: string;
  sender?: {
    agency_id?: string;
    org_id?: string;
    system_id?: string;
    service_instance?: string;
  };
  external_incident_id?: string;
  trace_id?: string;
  incident?: {
    incident_id?: string;
    incident_type?: string;
    severity?: number;
    location?: {
      name?: string;
      area?: string;
      lat?: number;
      lng?: number;
      postal_code?: string;
    };
    description?: string;
    triggered_at?: string;
  };
  ticket?: {
    ticket_id?: string;
    status?: string;
    data?: Record<string, unknown>;
  };
  logs?: unknown[];
  handoff?: Record<string, unknown>;
  quality?: Record<string, unknown>;
};
```

Important fields:

- `sender.agency_id`: who sent the message, for example `SCDF`, `SPF`, `PUB`.
- `sender.org_id`: organisation to assign to the incident. Usually same as `agency_id`.
- `external_incident_id`: shared incident key from the external simulation.
- `ticket.ticket_id`: agency-local ticket reference.
- `ticket.status`: agency-local ticket status.
- `ticket.data`: raw agency-specific payload.
- `logs`: agency audit/update entries.
- `handoff`: optional SCDF/hospital transfer payload.
- `quality`: optional duplicate/incomplete/delay flags.

## Example: SPF Ticket

```json
{
  "message_kind": "agency_ticket",
  "sender": {
    "agency_id": "SPF",
    "org_id": "SPF",
    "system_id": "POLARIS",
    "service_instance": "spf"
  },
  "external_incident_id": "ext-traffic-001",
  "trace_id": "trace-001",
  "incident": {
    "incident_id": "ext-traffic-001",
    "incident_type": "TRAFFIC_ACCIDENT",
    "severity": 3,
    "description": "Multi-vehicle collision blocking 2 lanes",
    "location": {
      "name": "Orchard Road",
      "area": "Central",
      "lat": 1.3048,
      "lng": 103.8318,
      "postal_code": "238823"
    }
  },
  "ticket": {
    "ticket_id": "SPF-TRAFFIC-001",
    "status": "OPEN",
    "data": {
      "report_number": "RPT-20260607-1001",
      "polaris_ref": "SPF-TRAFFIC-001",
      "incident_classification": {
        "category": "TRAFFIC",
        "penal_code_ref": null
      },
      "location": {
        "beat_sector": "NP-D1-B4",
        "address_verbatim": "Blk 12 Central",
        "lat": 1.3048,
        "lng": 103.8318
      },
      "narrative": "Multi-vehicle collision blocking 2 lanes",
      "priority_flag": "P2"
    }
  },
  "logs": [],
  "quality": {}
}
```

## Example: SCDF Handoff

```json
{
  "message_kind": "agency_handoff",
  "sender": {
    "agency_id": "SCDF",
    "org_id": "SCDF",
    "system_id": "FIREWATCH",
    "service_instance": "scdf"
  },
  "external_incident_id": "ext-medical-001",
  "trace_id": "trace-002",
  "incident": {
    "incident_id": "ext-medical-001",
    "incident_type": "MEDICAL_EMERGENCY",
    "severity": 4,
    "description": "Cardiac arrest at MRT station",
    "location": {
      "name": "Jurong East MRT",
      "area": "Jurong East",
      "lat": 1.3331,
      "lng": 103.7421
    }
  },
  "ticket": {
    "ticket_id": "SCDF-MED-001",
    "status": "OPEN",
    "data": {
      "call_sign": "SCDF-JRG-F12",
      "firewatch_ref": "SCDF-MED-001",
      "incident_type": "MEDICAL",
      "hazard_level": 4
    }
  },
  "handoff": {
    "handoff_id": "SCDF-HO-1234ABCD",
    "handoff_type": "AMBULANCE_CONVEYANCE",
    "from_agency": "SCDF",
    "from_ticket_id": "SCDF-MED-001",
    "receiving_cluster": "NUHS",
    "receiving_hospital": "NUH",
    "patient_count": 1,
    "patient_profile": "adult",
    "triage": {
      "P1": 1,
      "P2": 0,
      "P3": 0
    },
    "ambulance_refs": ["AMB-123-1"]
  },
  "quality": {}
}
```

## What Happens On Receive

The ingest service performs these steps:

1. Normalise raw agency data into a `NormalizedIncidentTicket`.
2. Look for an existing `incident_sources` match by `externalTicketId` or `externalIncidentId`.
3. If no exact source match exists, compare recent open incidents using simple token similarity.
4. If matched, update the existing incident status, severity, and confidence score.
5. If unmatched, create a new row in `incidents`.
6. Upsert source links in `incident_sources`.
7. Upsert the sender organisation and assign it in `assigned_orgs`.
8. Create a readable timeline entry in `logs.content`.

The response looks like:

```json
{
  "accepted": true,
  "action": "created_incident",
  "matchReason": null,
  "incidentId": "57f6df16-0d6f-46df-bdf6-4e477763763b",
  "incidentCode": "EXTQ3JE1TL",
  "externalIncidentId": "ext-traffic-001",
  "externalTicketId": "SPF-TRAFFIC-001"
}
```

For an existing incident:

```json
{
  "accepted": true,
  "action": "updated_existing_incident",
  "matchReason": "external_source_match",
  "incidentId": "57f6df16-0d6f-46df-bdf6-4e477763763b",
  "incidentCode": "EXTQ3JE1TL",
  "externalIncidentId": "ext-traffic-001",
  "externalTicketId": "SPF-TRAFFIC-001"
}
```

## Database Writes

The module writes to:

- `incidents`: canonical OneTogether incident.
- `incident_sources`: links external tickets/incident IDs to the canonical incident.
- `logs`: frontend-readable timeline text.
- `organisations`: sender organisation if it does not already exist.
- `assigned_orgs`: assigns the sender organisation to the incident.

Readable log example:

```txt
SPF created a new incident from ticket SPF-TRAFFIC-001. Status: OPEN. Priority: P2. Update: Multi-vehicle collision blocking 2 lanes.
```

Handoff log example:

```txt
SCDF linked an update to ticket SCDF-MED-001. Status: OPEN. Priority: P1. Update: Cardiac arrest at MRT station. Handoff recorded for 1 patient(s) to NUH (NUHS).
```

## Run Locally

Start the backend:

```powershell
cd apps/backend
npm run start:dev
```

Start the simulator stack:

```powershell
cd C:\OneTogether
docker compose up -d --build scenario-engine
```

The default simulator interval is 240 seconds. To override it:

```powershell
$env:INTERVAL_SECONDS="240"
docker compose up -d --build scenario-engine
```

To target a non-local backend, override the Compose default:

```powershell
$env:MIDDLEWARE_URL="https://example.com/api/incident-middleware"
docker compose up -d --build scenario-engine
```

## Manual Test

PowerShell:

```powershell
$body = @{
  message_kind = "agency_ticket"
  sender = @{
    agency_id = "SPF"
    org_id = "SPF"
    system_id = "POLARIS"
    service_instance = "manual-test"
  }
  external_incident_id = "manual-ext-001"
  incident = @{
    incident_id = "manual-ext-001"
    incident_type = "TRAFFIC_ACCIDENT"
    severity = 3
    description = "Manual middleware test traffic accident"
    location = @{
      name = "Test Road"
      area = "Central"
      lat = 1.3
      lng = 103.8
    }
  }
  ticket = @{
    ticket_id = "SPF-MANUAL-001"
    status = "OPEN"
    data = @{
      narrative = "Manual middleware test traffic accident"
      priority_flag = "P2"
      incident_classification = @{
        category = "TRAFFIC"
      }
      location = @{
        address_verbatim = "Test Road Central"
        lat = 1.3
        lng = 103.8
      }
    }
  }
  logs = @()
  quality = @{}
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
  -Uri "http://localhost:3001/api/incident-middleware/events" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

Check the DB:

```powershell
docker compose exec db psql -U admin -d one_together -c "select code, title, incident_type, inc_status, created_at from incidents order by created_at desc limit 5;"
```

Check readable logs:

```powershell
docker compose exec db psql -U admin -d one_together -c "select content, created_at from logs order by created_at desc limit 5;"
```

## Troubleshooting

If agencies are creating tickets but nothing appears in the DB, check the
container environment:

```powershell
docker compose exec spf python -c "import os; print(os.getenv('MIDDLEWARE_URL'))"
```

It should print:

```txt
http://host.docker.internal:3001/api/incident-middleware
```

If it prints a different URL, recreate the simulator stack after correcting or
clearing `MIDDLEWARE_URL`.

If the simulator logs show connection failures, confirm the backend is running:

```powershell
Invoke-RestMethod http://localhost:3001/api/docs
```

If the backend accepts manual test messages but simulator messages do not
arrive, the problem is usually Docker environment configuration rather than the
middleware code.
