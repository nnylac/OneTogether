# OneTogether Backend

NestJS API scaffold for the OneTogether emergency response platform.

This backend is intentionally structured as a modular monolith: one deployable NestJS app, split into domain modules that can later integrate with AWS services or external agency systems. Public, responder, and government are treated as roles/access levels, not as separate backends.

## Current Status

The backend is an active NestJS modular monolith with implemented
authentication, incidents, incident middleware, incident rooms, resources,
broadcasts, volunteer opportunities, maps, deterministic incident analysis and
government analytics. The app starts on port `3001` by default and exposes
routes under the `/api` prefix.

```txt
Local backend: http://localhost:3001/api
Swagger UI:    http://localhost:3001/api/docs
```

## Commands

From the repository root:

```bash
npm install
npm run dev:api
npm run build
npm run lint
```

From `apps/backend`:

```bash
npm run start:dev
npm run build
npm run test
npm run test:e2e
```

## API Documentation

Swagger is enabled for the backend through `@nestjs/swagger` and `swagger-ui-express`.

Start the backend first:

```bash
npm run start:dev
```

Then open:

```txt
Swagger UI:   http://localhost:3001/api/docs
Swagger JSON: http://localhost:3001/api/docs-json
```

The Swagger setup lives in `src/main.ts`. The route is configured as `api/docs` so it sits under the same `/api` prefix as the rest of the backend.

When adding real endpoints, use Nest Swagger decorators so the generated docs are useful:

```ts
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('incidents')
@ApiBearerAuth()
@Controller('incidents')
export class IncidentsController {
  @Get()
  @ApiOperation({ summary: 'List incidents' })
  findAll() {
    return [];
  }
}
```

For request bodies, create DTO classes and decorate fields with `@ApiProperty()`. Avoid using loose `any` bodies if the route is meant to be documented.

Example DTO:

```ts
import { ApiProperty } from '@nestjs/swagger';

export class CreateIncidentDto {
  @ApiProperty({ example: 'Kitchen fire at Toa Payoh block' })
  title: string;

  @ApiProperty({ example: 'Fire' })
  incidentType: string;
}
```

If an endpoint needs authentication later, add `@ApiBearerAuth()` to the controller or route so Swagger shows the bearer token input.

## Folder Structure

```txt
apps/backend
  src
    main.ts
    app.module.ts
    app.controller.ts
    app.service.ts

    ai
    analytics
    auth
    broadcasts
    incident-room
    incidents
    integrations
    maps
    notifications
    organisations
    resources
    users
    volunteer

  test
  package.json
  nest-cli.json
  tsconfig.json
  tsconfig.build.json
```

## Entry Files

`src/main.ts`

Starts the NestJS application. It sets the global API prefix to `/api` and listens on `process.env.PORT` or `3001`.

`src/app.module.ts`

The root module. It imports all feature modules so Nest can wire controllers, services, and gateways together.

`src/app.controller.ts`

Provides app-level routes. Currently exposes `GET /api/health` for local checks and Kubernetes probes.

`src/app.service.ts`

Provides app-level service logic. Currently returns the backend health payload used by `AppController`.

## Module Responsibilities

### `auth`

Handles authentication and session concerns.

Designed for:

- Login/logout
- JWT or session validation
- Refresh tokens
- Role guards
- Later AWS Cognito integration

Example future routes:

```txt
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

### `users`

Handles individual people using the system.

Designed for:

- Citizen users
- Responder users
- Government officers
- Profile and contact details
- User role and account status

Users are people. Organisations are the agencies or groups those people belong to.

### `organisations`

Handles agencies, departments, hospitals, and partner groups.

Designed for:

- SCDF, SPF, NEA, PUB, hospitals, relief groups, volunteer groups
- Organisation profile and type
- Organisation members
- Region or coverage area
- Capabilities/resources owned by the organisation

This module is important because incidents and resources are usually assigned to an agency/team, not only to one user.

### `incidents`

Handles the core incident lifecycle.

Designed for:

- Creating incident reports
- Listing and filtering incidents
- Verifying incidents
- Updating severity/status
- Assigning organisations
- Making incidents public
- Closing/resolving incidents

This is the main business module for emergency cases.

Canonical incidents use the coordination stages `reported`, `triage`,
`responding`, `on_scene`, `stabilising`, `monitoring`, `resolved` and `closed`.
Agency assignments remain compatible with the database values `DISPATCHED`,
`ON SCENE` and `COMPLETED`, while richer agency stages are retained in timeline
logs.

### `incident-room`

Handles collaboration inside one incident.

Designed for:

- Incident room overview
- Discussion/chat messages
- Timeline/log entries
- Collaborative incident report
- Real-time room updates through WebSockets
- Incident-specific map context

Use this when the feature is about working inside a specific incident, not the general incident list.

Message creation uses Socket.IO. Failed sends now return the backend reason to
the frontend, and the draft is cleared only after the message is stored and
broadcast successfully.

### `analytics`

Handles aggregated government reporting across all responding organisations.

Implemented:

```txt
GET /api/analytics/overview
```

The overview supports date, incident type, severity, status, organisation and
derived-region filters. It returns national KPIs, incident distributions,
resolution timing and comparable organisation workload/response indicators.
Log-derived agency timing is explicitly labelled as inferred.

See `src/analytics/README.md` for metric definitions and data-quality rules.

### `resources`

Handles deployable resources and operational assets.

Designed for:

- Ambulances
- Fire trucks
- Medical teams
- Shelters
- Relief supplies
- Equipment
- Availability and capacity
- Assignment to incidents

Resources should usually link back to an organisation.

### `broadcasts`

Handles public and internal announcements.

Designed for:

- Government broadcasts
- Emergency public alerts
- Draft and publish flows
- Region-targeted messages
- Later SNS/EventBridge notification integration

### `volunteer`

Handles volunteer and community participation.

This module intentionally includes the old "community" idea to keep the MVP smaller.

Designed for:

- Volunteer tasks
- Volunteer efforts
- Workshops
- Community programmes
- Citizen signups
- Capacity tracking

### `notifications`

Handles in-app notifications and live notification delivery.

Designed for:

- Notification list
- Read/unread state
- Incident update notifications
- Broadcast notifications
- Volunteer signup confirmations
- WebSocket notification gateway

### `maps`

Handles map-facing API views.

Designed for:

- All incident markers for government maps
- Assigned incident markers for responder maps
- Incident-room map context
- Nearby resources
- Zones/regions
- Location-based filtering

The map is a frontend feature, but backend map data usually comes from `incidents`, `resources`, `organisations`, and this module.

### `analysis`

Runs deterministic incident analysis without an external model or API.

It classifies incidents from weighted timeline evidence, updates severity and
confidence, extracts operational entities, and builds editable closed-incident
summary and response paragraphs.

### `integrations`

Contains internal services for AWS and external systems.

Designed for future services such as:

```txt
integrations/aws/s3.service.ts
integrations/aws/sns.service.ts
integrations/aws/sqs.service.ts
integrations/aws/eventbridge.service.ts
integrations/aws/cognito.service.ts

integrations/agencies/scdf.service.ts
integrations/agencies/spf.service.ts
integrations/agencies/hospitals.service.ts
integrations/agencies/nea.service.ts
integrations/agencies/pub.service.ts
```

Most integration services should not expose controllers directly. Domain modules should call them internally.

## What The Nest Files Do

Each generated feature module usually has these files:

`*.module.ts`

Defines a Nest module boundary. It declares which controllers, services, gateways, imports, and exports belong to that module.

`*.controller.ts`

Defines HTTP routes. Controllers should stay thin: receive requests, validate DTOs, call services, and return responses.

`*.controller.spec.ts`

Unit tests for the controller. These should verify route-level behavior, such as whether the controller calls the correct service method.

`*.service.ts`

Contains business logic. Services decide what should happen: validation, state changes, calls to repositories, calls to integrations, and event publishing.

`*.service.spec.ts`

Unit tests for service behavior. These are usually more important than controller tests because most business rules should live in services.

`*.gateway.ts`

Defines WebSocket behavior for real-time features. Current gateways exist for:

```txt
incident-room/incident-room.gateway.ts
notifications/notifications.gateway.ts
```

`*.gateway.spec.ts`

Unit tests for gateway behavior, such as join-room events, broadcasting, and notification emission.

## How To Add A New Feature

1. Decide whether it belongs in an existing domain module.
2. Add DTOs for request/response shapes if the endpoint accepts body/query input.
3. Add or update controller routes.
4. Put business rules in the service.
5. Add repository/storage code only when persistence is needed.
6. Add tests beside the file being tested.
7. Import/export providers through the module if another module needs them.

Prefer this shape:

```txt
controller -> service -> repository/integration
```

Avoid putting business logic directly in controllers.

## Data And Persistence

Prisma has been implemented, when initialising the entity to making changes to the sql or database, compose up the database, then create a .env file in apps/backend 
DATABASE_URL= {database_url}
cd apps/backend
npx prisma db pull
npx prisma generate (this generates the entities under prisma/generated)

Prisma commands can now be used in the backend. For documentation on prisma refer to 
https://docs.nestjs.com/recipes/prisma 

When persistence is added, use whichever database approach the team chooses and hide it behind repositories/services.

Possible future shape:

```txt
incidents/incidents.repository.ts
resources/resources.repository.ts
broadcasts/broadcasts.repository.ts
volunteer/volunteer.repository.ts
```

This keeps controllers and services from depending directly on a specific database library.

## Infrastructure Integration

The repo already contains infrastructure plans for AWS services such as EKS, S3, SNS, SQS, EventBridge, Cognito, RDS, and Redis. The backend should integrate with these later through the `integrations` module.

Example flow:

```txt
Incident created
  -> incidents.service stores the incident
  -> integrations/eventbridge publishes IncidentCreated
  -> notifications.service creates in-app notifications
  -> broadcasts or SNS can alert the public if needed
```

## Team Notes

- Keep public/responder/government as roles, not separate backend folders.
- Keep modules domain-based, not page-based.
- Use `maps` for map API views, but keep source data ownership in `incidents`, `resources`, and `organisations`.
- Keep generated `dist`, `node_modules`, `.env`, and coverage files out of Git.
- Update this README whenever a module gains real endpoints or important business rules.
