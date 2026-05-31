# OneTogether — Work Plan & Feature Status

## What's Built

| Area | Status |
|---|---|
| Three-role app (Citizen / Organisation / Government) | Done |
| Incident list & filtering (Org + Gov) | Done |
| Incident Room (chat, timeline, phase stepper, AI advisory, resources, uploads, reports) | Done |
| Real-time WebSocket collaboration in incident room | Done |
| AI Advisory (Gemini) per incident | Done |
| AI Chat assistant inside incident room | Done |
| Collaborative report editor | Done |
| Government dashboard (map, stats, thresholds, broadcasts CRUD) | Done |
| Organisation dashboard (map, unit board, hospital status) | Done |
| Citizen app (alerts, volunteer tasks, communities, contact) | Done |
| Backend: NestJS + Prisma + SQLite, AI service, chat, uploads | Done |
| Hospital bed / unit status tracking | Done |

---

## What's Not Done / Needs Improvement

### Priority 1 — Core Gaps (breaks main flows)

| Feature | Problem | Notes |
|---|---|---|
| **Map is fake** | Static PNG with hardcoded markers — not linked to real incidents | Replace with Leaflet + real incident coords |
| **Government has no Incident Room** | Gov role can't open an incident room (route missing) | Add `/government/incidents/:id` → `IncidentRoomPage` |
| **Create Incident** | No working "New Incident" form that saves to DB | Need form → `POST /api/incidents` |
| **Real authentication** | Auth controller exists but login is mock; no session/JWT enforcement | Hook up real auth guard on API routes |
| **Broadcasts don't persist** | Gov creates broadcasts but they may not save to DB or push to citizens live | Wire broadcast `POST` → DB → WebSocket push |

### Priority 2 — Feature Incomplete

| Feature | Problem | Notes |
|---|---|---|
| **Volunteer sign-up** | Tasks shown in Citizen app but no actual sign-up action that works | `POST /api/volunteer-tasks/:id/signup` |
| **Resource assignment persistence** | Resources tab UI works locally but changes may not save to DB | Ensure `PATCH /api/incidents/:id/resources` persists |
| **Notifications** | Hardcoded mock list; no real-time push | WebSocket event → frontend notification bell |
| **Report export** | Collaborative editor exists but no PDF/download export | Add print/export button |
| **Upload file persistence** | Files uploaded in UploadsPanel may not survive page refresh | Check multer + Prisma linkage |

### Priority 3 — Polish & UX

| Feature | Problem | Notes |
|---|---|---|
| **OrgSettings** | Stub only — no backend for auto-publication rules | Wire checkboxes to backend |
| **GovAnalytics** | Page exists, uses mock numbers | Connect to real aggregated DB queries |
| **ICS Command Structure** | Types support ICSSection but no UI to assign/change commanders | Add editable ICS panel in incident room |
| **Confidence score** | Field in data model but not shown in UI anywhere | Show on incident header/information tab |
| **Real-time list updates** | Incident lists don't refresh when other users change status | WebSocket broadcast on status change → refetch list |

---

## Suggested Work Split (4 people)

### Person A — Map & Geospatial
- Replace static PNG map with **Leaflet.js** (or react-leaflet)
- Plot incidents as real markers from DB (lat/lng field needed on incident model)
- Marker click → opens incident detail
- Filter by severity/type on map
- Both Gov and Org map pages

### Person B — Incident Lifecycle & Auth
- Create Incident form (Gov + Org) → saves to DB
- Real JWT auth (NestJS guard + frontend token storage)
- Government Incident Room route
- Real-time list refresh when incident status changes
- Broadcasts saved to DB + pushed via WebSocket

### Person C — Citizen & Volunteer
- Volunteer sign-up flow (join task, see confirmation)
- Citizen alerts: real data from DB `broadcasts` table (not mock)
- Community programmes CRUD (Gov side creates, Citizen sees)
- Push notifications (or polling) when new broadcast is issued

### Person D — Reports, Analytics & Polish
- Report PDF export from collaborative editor
- Gov Analytics page connected to real DB aggregates
- Upload persistence verification + file preview
- ICS command panel in incident room (assign commander, ops, logistics)
- Confidence score display on incident header
- OrgSettings backend (auto-publication rules persisted)

---

## How to Run Locally

```bash
# From repo root
npm run dev

# Backend runs on http://localhost:3001
# Frontend runs on http://localhost:5173
```

Set `GEMINI_API_KEY` in `apps/backend/.env` for AI features.

---

## Key Files to Know

| File | What it does |
|---|---|
| `apps/frontend/src/types.ts` | All shared TypeScript types |
| `apps/frontend/src/state/DataContext.tsx` | Global state + API calls |
| `apps/frontend/src/components/incident-room/` | All incident room tab panels |
| `apps/backend/src/incidents/` | Incident CRUD API |
| `apps/backend/src/ai/ai.service.ts` | Gemini wrapper |
| `apps/backend/src/incident-room/incident-room.gateway.ts` | WebSocket gateway |
| `apps/backend/prisma/` | DB schema + seed |
