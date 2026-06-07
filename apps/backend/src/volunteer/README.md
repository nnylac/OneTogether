# Volunteer Module

The volunteer module stores opportunities synced from verified external volunteer websites.

OneTogether does not process volunteer signups. Citizens browse opportunities in OneTogether, then the frontend opens the external `signupUrl` when they choose to sign up.

## Current Scope

This module currently handles:

- Managing verified volunteer sources
- Storing synced volunteer opportunities
- Updating the same opportunity when an external source changes it
- Listing opportunities for citizens
- Filtering by source, region, type, status, and search text
- Returning external signup URLs

This module does not currently handle:

- Internal event creation by government or organisations
- Volunteer signup processing
- Cancellation or attendance tracking
- Capacity management as a source of truth

## Data Model

### `volunteer_sources`

Stores verified external websites that OneTogether can sync from.

### `volunteer_opportunities`

Stores opportunities pulled from those sources. The pair `source_id + external_id` is unique so repeated syncs update the same row.

## API Routes

All routes are prefixed by the backend global prefix, so these are available under `/api`.

- `GET /api/volunteer/opportunities`
- `GET /api/volunteer/opportunities?region=East`
- `GET /api/volunteer/opportunities?opportunityType=flood_relief`
- `GET /api/volunteer/opportunities?status=open`
- `GET /api/volunteer/opportunities?search=cleanup`
- `GET /api/volunteer/opportunities/:id`
- `POST /api/volunteer/opportunities/upsert`
- `GET /api/volunteer/sources`
- `POST /api/volunteer/sources`
- `PATCH /api/volunteer/sources/:id`

Example opportunity response:

```json
{
  "id": "70000000-0000-0000-0000-000000000001",
  "sourceId": "60000000-0000-0000-0000-000000000001",
  "externalId": "external-event-123",
  "title": "Flood Relief Packing Support",
  "signupUrl": "https://volunteer.example.sg/events/123",
  "status": "open"
}
```

## Important Frontend Behavior

The sign-up button should not call OneTogether to register the user.

It should redirect to:

```txt
opportunity.signupUrl
```

## How Volunteer Organisations Fit

Volunteer organisations still belong in the `organisations` module. They can receive incident tickets through the incident assignment flow.

When a volunteer organisation needs public help, it creates an event on its own external website. OneTogether later syncs that opportunity into this module for citizen browsing.
