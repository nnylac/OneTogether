# Organisations Module

The organisations module manages the registry of agencies and groups that can appear in OneTogether.

Organisations are not individual users. A user is a person using the system, while an organisation is the agency, relief group, responder team, or government body that person may belong to.

## Current Scope

This module currently handles:

- Listing organisations
- Searching organisations by name
- Getting one organisation by id
- Creating an organisation
- Updating an organisation name
- Checking for duplicate organisation names

This module does not currently handle incident assignment, external agency ticket sync, resource ownership, or organisation membership. Those flows should be added later from the relevant business domain, such as incidents or assignments, while using this module to validate that an organisation exists.

## API Routes

All routes are prefixed by the backend global prefix, so these are available under `/api`.

- `GET /api/organisations`
- `GET /api/organisations?search=SCDF`
- `GET /api/organisations?take=10&skip=0`
- `GET /api/organisations/:id`
- `POST /api/organisations`
- `PATCH /api/organisations/:id`

Example create request:

```json
{
  "orgName": "SCDF Central Division"
}
```

Example response:

```json
{
  "id": "10000000-0000-0000-0000-000000000001",
  "orgName": "SCDF Central Division"
}
```

## File Responsibilities

### `organisations.module.ts`

Registers the organisations controller, service, and repository with NestJS. It also exports `OrganisationsService` so future modules can reuse it for validation or lookup.

### `organisations.controller.ts`

Defines the HTTP endpoints for organisations. Controllers should stay thin: they receive request data, call the service, and return the service response.

### `organisations.service.ts`

Contains the application logic for the module. It validates organisation names, parses pagination query values, checks duplicates, handles not-found cases, and maps database models into response DTOs.

### `organisations.repository.ts`

Owns direct Prisma database calls for organisations. Keeping Prisma access here avoids spreading database queries across controllers and services.

### `dto/create-organisation.dto.ts`

Defines the request body for creating an organisation.

### `dto/update-organisation.dto.ts`

Defines the request body for updating an organisation.

### `dto/organisation-query.dto.ts`

Defines supported query parameters for listing organisations, such as `search`, `take`, and `skip`.

### `dto/organisation-response.dto.ts`

Defines the response shape returned to the frontend. It maps the database field `org_name` into the API-friendly field `orgName`.

### `organisations.controller.spec.ts`

Tests that the controller passes request data to the service correctly.

### `organisations.service.spec.ts`

Tests the module behavior, including mapping, pagination parsing, duplicate checks, and not-found errors.

## Database Mapping

The Prisma model currently uses the existing database table and field names:

- Table/model: `organisations`
- Database field: `org_name`
- API field: `orgName`

This keeps the API consistent with TypeScript naming conventions while still matching the database schema.

## Future Integration Notes

When incident assignment is implemented later, incidents should not be placed inside this module. The incidents or assignments domain should own that workflow.

For example, when SCDF assigns an incident to an external organisation, the incident assignment flow can call `OrganisationsService` to confirm the target organisation exists, then store the assignment in the relevant incident-related table.
