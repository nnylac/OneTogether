# OneTogether External Simulation Environment

Local Docker Compose simulation for incident generation and external agency
systems. The model is intentionally built around separate agency-owned records:
one real-world incident can produce a police report, an SCDF case, a PUB case,
an NEA case, one or more hospital intake records, and optional transfer records.

## Run

From the repository root:

```bash
docker compose up --build scenario-engine
```

That starts the scenario engine plus its agency dependencies:

- `scenario-engine`
- `spf`
- `scdf`
- `singhealth`
- `nuhs`
- `towncouncil`
- `pub`
- `nea`

Incident classification and closed-incident reports are generated
deterministically inside the NestJS backend. No model download, API key, or
separate analyzer container is required.

To include the local database too:

```bash
docker compose up --build
```

To send simulator tickets/logs to your backend incident middleware:

```bash
MIDDLEWARE_URL=http://host.docker.internal:3001/api/incident-middleware docker compose up --build scenario-engine
```

On Windows PowerShell:

```powershell
$env:RANDOM_SEED="42"
$env:INTERVAL_SECONDS="60"
docker compose up --build scenario-engine
```

## Ports

| Service | Port | Simulated system | Purpose |
|---|---:|---|---|
| Scenario engine | 8100 | SCENARIO-ENGINE | Generates weighted incidents |
| SPF | 8101 | POLARIS | Police report simulator |
| SCDF | 8102 | FIREWATCH | Fire, rescue, hazmat, ambulance and hospital handoff simulator |
| SingHealth | 8103 | SHERMS | SGH, CGH, SKH, KKH hospital intake simulator |
| NUHS | 8104 | NUCLEUS | NUH, NTFGH hospital intake simulator |
| Town Council | 8105 | TCOMS | Municipal work order simulator |
| PUB | 8106 | WATERGRID | Flooding, drainage, pumps and water-level simulator |
| NEA | 8107 | ENVHEALTH | Disease, dengue and environmental health simulator |

The system names are fictitious. They are intentionally different to simulate
messy real-world integration across partner agencies.

## Useful Endpoints

All agency services expose:

```txt
GET  /health
GET  /tickets
GET  /active-incidents
POST /incident
```

SingHealth and NUHS also expose:

```txt
POST /handoff
```

The scenario engine exposes:

```txt
GET /
GET /health
GET /catalogue
GET /active-incidents
GET /automation
POST /automation/pause
POST /automation/resume
POST /generate
```

Open `http://localhost:8100/` for the scenario control page. Automatic random
generation remains enabled by default and runs without the page being open.
Pausing it stops only new random incidents; manual generation and already
running incident phases continue.

Examples:

```bash
curl http://localhost:8100/catalogue
curl http://localhost:8100/active-incidents
curl http://localhost:8102/tickets
curl http://localhost:8103/tickets
curl http://localhost:8104/tickets
curl http://localhost:8106/tickets
curl http://localhost:8107/tickets
```

## Event Flow

The main idea is: one incident, many separate agency records.

```txt
Scenario Engine
  -> INCIDENT.CREATED
  -> POST /incident to initial agencies

SPF
  -> creates POLARIS police report
  -> updates and closes its own ticket

SCDF
  -> creates FIREWATCH rescue/ambulance case
  -> decides whether patients need hospital conveyance
  -> POST /handoff to SingHealth or NUHS

SingHealth / NUHS
  -> creates its own hospital intake ticket
  -> logs parent SCDF handoff and ambulance refs
  -> updates capacity, intake, triage and clinical/ops notes
  -> may create internal or cross-cluster transfer

Receiving Hospital Cluster
  -> creates a second hospital intake ticket for the same incident
  -> keeps updating until resolved/closed

PUB / NEA / Town Council
  -> create their own operational records when relevant
```

If `MIDDLEWARE_URL` is set, services emit raw agency messages to:

```txt
POST {MIDDLEWARE_URL}/events
```

Each message carries sender metadata, the agency ticket/log payload, and the
shared external incident ID. The backend incident middleware is responsible for
normalising, matching, deduplicating, creating incidents, and appending logs.

## Healthcare Routing

SingHealth facilities:

- SGH: Singapore General Hospital
- CGH: Changi General Hospital
- SKH: Sengkang General Hospital
- KKH: KK Women's and Children's Hospital

NUHS facilities:

- NUH: National University Hospital
- NTFGH: Ng Teng Fong General Hospital

SCDF chooses a receiving hospital using a simple weighted routing model:

- nearby hospitals score better
- severe trauma prefers trauma-capable sites
- child cases prefer paediatric-capable sites
- maternity cases prefer KKH
- capacity pressure adds noise

Hospitals can then create transfer records. For example:

- SKH receives a child patient, then transfers to KKH
- CGH receives overflow, then transfers severe trauma to SGH
- NTFGH receives a severe west-side case, then transfers to NUH
- SingHealth and NUHS can transfer across clusters when capacity or specialty requires it

## Incident Weights

The scenario engine uses weighted random selection so rare incidents do not occur
as often as common incidents.

| Incident type | Weight |
|---|---:|
| Medical emergency | 28 |
| Traffic accident | 24 |
| Flooding | 13 |
| Missing person | 11 |
| Building fire | 10 |
| Gas leak | 5 |
| Disease outbreak | 4 |
| Building collapse | 2 |
| Haze | 3 |
| Civil disturbance | 3 |

These are simulation weights, not real-world statistics.

## Incident to Agency Mapping

| Incident type | Initial required agencies | Optional agencies | Downstream behavior |
|---|---|---|---|
| Traffic accident | SPF | SCDF | SCDF may hand injured patients to a hospital |
| Building fire | SCDF | SPF, Town Council | SCDF may hand injured patients to a hospital |
| Flooding | PUB | Town Council, SPF, SCDF, NEA | PUB handles drainage; Town Council handles estate ops |
| Medical emergency | SCDF | SPF | SCDF routes patient to hospital |
| Gas leak | SCDF, SPF | NEA, Town Council | SCDF may hand exposed/injured patients to hospital |
| Building collapse | SCDF, SPF | Town Council, NEA | SCDF usually routes casualties to hospital |
| Missing person | SPF | None | Police-owned search/report flow |
| Disease outbreak | NEA, SingHealth, NUHS | SPF, Town Council | Health clusters and NEA run parallel records |
| Haze | NEA | SingHealth, NUHS, Town Council | Air-quality advisory and health monitoring |
| Civil disturbance | SPF | SCDF | Crowd control with optional medical support |

## Realism Notes

The simulators intentionally create integration noise:

- Agencies use different ticket IDs and field names.
- Locations are represented differently across agencies.
- Initial coordinates are approximate and may later be corrected on scene.
- Some updates are delayed.
- Some updates are duplicated.
- Some optional fields are missing.
- Healthcare systems report capacity, triage and patient intake differently.
- SCDF handoff creates a parent-child relationship between agency records.
- Hospital transfer creates another local record rather than editing the first one.
- PUB and NEA may notify or imply follow-up by Town Council, SCDF or health clusters.
- Scenario-level phase events add cross-agency milestones alongside agency ticket lifecycles.

The goal is not perfect operational truth. The goal is realistic enough data
shape, timing and inconsistency to test incident normalization and coordination
logic.
