# Notifications Module

The notifications module stores alerts that should be shown to people, organisations, or groups of users in OneTogether.

It does not own the incident, broadcast, AI, or resource workflows. Those modules decide when something important happened. This module records the notification and tracks who it is for.

## Current Scope

This module currently handles:

- Creating notifications
- Targeting notifications to users, organisations, or roles
- Listing notifications by recipient filters
- Getting one notification
- Marking one notification recipient as read
- Marking all matching notification recipients as read

Real-time WebSocket delivery is prepared through `NotificationsGateway`, but the REST API is the main implemented surface for now.

## Recipient Model

Notifications are split into two database tables:

- `notifications`: stores the alert content once
- `notification_recipients`: stores who receives it and whether that recipient has read it

This lets the same notification be sent to:

- one citizen user
- one responder or relief organisation
- a role such as `government`, `moderator`, or `user`

## API Routes

All routes are prefixed by the backend global prefix, so these are available under `/api`.

- `GET /api/notifications`
- `GET /api/notifications?recipientType=organisation&recipientId=<uuid>`
- `GET /api/notifications?recipientType=role&recipientRole=government`
- `GET /api/notifications?isRead=false&take=10&skip=0`
- `GET /api/notifications/:id`
- `POST /api/notifications`
- `PATCH /api/notifications/recipients/:recipientId/read`
- `PATCH /api/notifications/read-all`

Example create request:

```json
{
  "title": "Incident assigned",
  "message": "A kitchen fire incident has been assigned to your organisation.",
  "notificationType": "incident_assigned",
  "referenceType": "incident",
  "referenceId": "20000000-0000-0000-0000-000000000001",
  "recipients": [
    {
      "recipientType": "organisation",
      "recipientId": "10000000-0000-0000-0000-000000000001"
    }
  ]
}
```

Example role recipient:

```json
{
  "recipientType": "role",
  "recipientRole": "government"
}
```

## File Responsibilities

### `notifications.module.ts`

Registers the controller, service, repository, and gateway. It exports `NotificationsService` so future modules can create notifications.

### `notifications.controller.ts`

Defines the HTTP routes for listing, creating, reading, and marking notifications.

### `notifications.service.ts`

Contains validation and application logic. It checks recipient targeting rules, parses query values, handles not-found cases, and maps database records into DTOs.

### `notifications.repository.ts`

Owns direct Prisma queries for notifications and notification recipients.

### `notifications.gateway.ts`

Future-ready WebSocket gateway for pushing notification events such as `notification.created`.

### DTO files

DTOs define request, query, recipient, mark-read, and response shapes. The response DTO maps database fields like `notification_type` into API fields like `notificationType`.

## Future Integration Notes

When incidents or broadcasts are implemented further, those modules should call `NotificationsService.create()` after their own business logic succeeds.

Example:

```ts
await this.notificationsService.create({
  title: 'Incident assigned',
  message: 'A kitchen fire incident has been assigned to your organisation.',
  notificationType: 'incident_assigned',
  referenceType: 'incident',
  referenceId: incident.id,
  recipients: [{ recipientType: 'organisation', recipientId: organisation.id }],
});
```
