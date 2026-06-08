# Broadcasts Module

The broadcasts module manages official announcements sent to broad audiences in OneTogether.

Broadcasts are the announcement content. Notifications are the alerts that can later tell recipients that a broadcast exists.

## Current Scope

This module currently handles:

- Creating draft broadcasts
- Targeting broadcasts to public, role, organisation, or region audiences
- Listing and filtering broadcasts
- Getting one broadcast
- Updating draft broadcasts
- Publishing draft broadcasts
- Archiving published broadcasts
- Cancelling draft broadcasts

This module does not currently create notifications when a broadcast is published. That integration can be added later by calling `NotificationsService.create()` from `BroadcastsService.publish()`.

## Audience Model

Broadcasts are split into two database tables:

- `broadcasts`: stores the announcement content and lifecycle status
- `broadcast_audiences`: stores who the announcement is meant for

Supported audience types:

- `public`: everyone
- `role`: users with a role such as `user`, `responder`, or `admin`
- `organisation`: one organisation
- `region`: one named region

## API Routes

All routes are prefixed by the backend global prefix, so these are available under `/api`.

- `GET /api/broadcasts`
- `GET /api/broadcasts?status=published`
- `GET /api/broadcasts?severity=critical`
- `GET /api/broadcasts?broadcastType=weather_warning`
- `GET /api/broadcasts?audienceType=role&audienceRole=user`
- `GET /api/broadcasts?region=North`
- `GET /api/broadcasts/:id`
- `POST /api/broadcasts`
- `PATCH /api/broadcasts/:id`
- `PATCH /api/broadcasts/:id/publish`
- `PATCH /api/broadcasts/:id/archive`
- `PATCH /api/broadcasts/:id/cancel`

Example create request:

```json
{
  "title": "Flash flood warning",
  "message": "Avoid low-lying areas near Bishan until further notice.",
  "broadcastType": "weather_warning",
  "severity": "warning",
  "audiences": [
    {
      "audienceType": "region",
      "region": "North"
    }
  ]
}
```

## File Responsibilities

### `broadcasts.module.ts`

Registers the controller, service, and repository. It exports `BroadcastsService` so other modules can reuse broadcast behavior later.

### `broadcasts.controller.ts`

Defines the HTTP endpoints. Controllers should stay thin and delegate business rules to the service.

### `broadcasts.service.ts`

Contains broadcast rules, validation, status transitions, audience validation, and response mapping.

### `broadcasts.repository.ts`

Owns Prisma queries for broadcasts and broadcast audiences.

### DTO files

DTOs define request bodies, query parameters, audience targeting, and frontend-facing response shapes.

### Spec files

Controller specs verify route methods delegate correctly. Service specs verify validation, mapping, creation, updates, and lifecycle transitions.

## Future Integration Notes

When notifications are connected, publishing a broadcast can create one notification whose recipients are derived from the broadcast audiences.

Example:

```ts
await this.notificationsService.create({
  title: 'New broadcast available',
  message: broadcast.title,
  notificationType: 'broadcast_published',
  referenceType: 'broadcast',
  referenceId: broadcast.id,
  recipients: broadcast.audiences.map((audience) => ({
    recipientType: audience.audienceType,
    recipientId: audience.organisationId,
    recipientRole: audience.audienceRole,
  })),
});
```
