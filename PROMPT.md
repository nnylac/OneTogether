# Incident Aggregator — Refactor Plan

A step-by-step plan for Codex. Work through each section in order.
Each section is independent enough to be tasked separately.

---

## Section 1 — Fix the Duplicate Incident Race Condition

**File:** `incident-middleware.service.ts` + DB migration

**Problem:**
When two agencies (e.g. SPF + SCDF) respond to the same incident, they both
POST to middleware with the same `external_incident_id`. Both messages can
arrive before either DB write commits, so `findLikelyIncident` finds no
existing source and both create new incidents.

**Fix:**

### 1A — DB migration
Add a unique index on `incident_sources.external_ticket_id` if not already
present. More importantly, add a unique index on a new column
`incident_sources.external_incident_id` (separate from ticket id).

```sql
ALTER TABLE incident_sources
  ADD COLUMN IF NOT EXISTS external_incident_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_incident_sources_ext_incident
  ON incident_sources (external_incident_id)
  WHERE external_incident_id IS NOT NULL;
```

### 1B — Service change
In `IncidentMiddlewareService.ingest()`, before calling `analyzer.findLikelyIncident`,
attempt an upsert on `incident_sources` keyed by `external_incident_id`.
If that upsert returns an existing row, skip incident creation and go straight
to update. This makes the first writer win atomically.

```ts
// Pseudo-code — adapt to your Prisma schema
const existingSource = await this.prisma.incident_sources.findFirst({
  where: { external_incident_id: normalized.externalIncidentId },
  include: { incidents: true },
});
if (existingSource) {
  // skip creation, go to update path
}
```

### 1C — SemanticIncidentAnalyzerService
In `findLikelyIncident`, the existing exact-source check queries
`external_ticket_id IN [externalTicketId, externalIncidentId]`. Split this
into two separate queries — one for ticket id, one for incident id — so the
logic is unambiguous and easier to debug.

---

## Section 2 — Location Fuzzing + Agency Discovery Log

**Files:** `models.py`, `base_agency.py`, each agency `main.py`

**Goal:** Agencies should initially report an approximate location, then log
a corrected pinpoint during their lifecycle.

### 2A — models.py
Add an optional `reported_accuracy` field to `Location`:

```python
class Location(BaseModel):
    name: str
    area: str
    lat: float
    lng: float
    postal_code: Optional[str] = None
    reported_accuracy: Optional[str] = None  # "APPROXIMATE" | "PINPOINT"
```

### 2B — base_agency.py
Add a helper to the base class that fuzzes a location slightly:

```python
import random

def _fuzz_location(self, location: Location) -> Location:
    """Return a copy with lat/lng nudged by up to ~200m."""
    return location.model_copy(update={
        "lat": location.lat + random.uniform(-0.0018, 0.0018),
        "lng": location.lng + random.uniform(-0.0018, 0.0018),
        "reported_accuracy": "APPROXIMATE",
    })

def _pinpoint_location(self, location: Location) -> Location:
    """Return a copy with a tighter correction — simulates GPS confirmation."""
    return location.model_copy(update={
        "lat": location.lat + random.uniform(-0.0004, 0.0004),
        "lng": location.lng + random.uniform(-0.0004, 0.0004),
        "reported_accuracy": "PINPOINT",
    })
```

### 2C — base_agency.py `build_ticket_payload`
Each agency's `build_ticket_payload` should call `self._fuzz_location(trigger.location)`
when building the location block, instead of using `trigger.location` directly.

### 2D — base_agency.py `_run_lifecycle`
During the lifecycle, on the first `IN_PROGRESS` update, inject a location
correction log entry. Add this to the update note selection:

```python
if next_status == TicketStatus.IN_PROGRESS and random.random() < 0.7:
    pinpoint = self._pinpoint_location(trigger.location)
    note = (
        f"Location confirmed on scene. "
        f"Coordinates updated to ({pinpoint.lat:.5f}, {pinpoint.lng:.5f}). "
        f"Accuracy: PINPOINT."
    )
    # Also store the pinpoint on the ticket for later emission
    ticket["confirmed_location"] = pinpoint.model_dump()
```

### 2E — Each agency main.py
Where each agency builds its location block (in `build_ticket_payload`),
call `self._fuzz_location(trigger.location)` and use those coordinates.
Do NOT use `trigger.location.lat` and `trigger.location.lng` directly.

---

## Section 3 — Noisier, More Realistic Agency Tickets

**Files:** Each agency `main.py`

**Goal:** Tickets should sometimes be incomplete, vague, or missing fields —
like real agency reports. This feeds the AI pipeline with realistic input.

### 3A — Introduce a noise probability per agency
Add a constant at the top of each agency `main.py`:

```python
FIELD_OMIT_CHANCE = 0.25  # 25% chance to omit optional enrichment fields
```

### 3B — SPF (POLARIS)
- `priority_flag`: omit 20% of the time (use `None`)
- `deployment.shift_ic`: omit 30% of the time
- `narrative`: sometimes shorten to just the first sentence (split on `.` and take first)
- Do NOT omit `report_number` or `incident_classification` — those are always present

### 3C — SCDF (FIREWATCH)
- `hazard_level`: omit 15% of the time
- `casualties`: sometimes set all to 0 even when severity is high (15% chance)
  — simulates early report before casualties counted
- `weather_conditions`: already nullable, keep as is
- `resources_dispatched.ambulances`: can be empty list even at severity 3

### 3D — NEA (ENVHEALTH)
- `risk_assessment.food_or_sanitation_risk`: already nullable, keep
- `field_action.inspection_eta_mins`: omit 20% of the time
- `risk_assessment.mosquito_breeding_risk`: omit 25% of the time

### 3E — PUB (WATERGRID)
- `hydrology.tide_risk`: omit 20% of the time
- `field_response.drainage_crew_eta_mins`: omit 20% of the time

### 3F — Town Council (TCOMS)
- `contractor_assigned`: already nullable, keep
- `advisory_text`: already nullable, keep
- `completion_checklist`: sometimes send an empty list (15% chance, simulates
  ticket opened before checklist created)

### 3G — Hospital clusters (SingHealth, NUHS)
These already have some noise (`clinical_notes` randomly popped). Extend:
- `capacity_snapshot`: omit 20% of the time (hospital hasn't reported yet)
- `staff_mobilised` / `staffing`: omit 15% of the time
- `operational_status` (NUHS): sometimes send `"UNKNOWN"` (10%)

---

## Section 4 — Richer Scenario Lifecycles (Scenario Tree)

**File:** Scenario engine `main.py`

**Goal:** Each scenario type has a defined sequence of phases.
Phases drive what agencies do and what logs they generate.
Some paths are taken, some are skipped — randomised but realistic.

### 4A — Define a phase system in the scenario engine

Add a `SCENARIO_PHASES` dict mapping incident type to an ordered list of phases.
Each phase has:
- `name`: string label
- `agencies_active`: which agencies should log during this phase
- `note_templates`: list of log strings to pick from
- `probability`: chance this phase occurs (1.0 = always)
- `delay_range_s`: (min, max) seconds before this phase triggers

```python
SCENARIO_PHASES = {
    "BUILDING_FIRE": [
        {
            "name": "initial_report",
            "probability": 1.0,
            "delay_range_s": (0, 5),
            "note_templates": [
                "Smoke reported from {floor}F. Caller reports visible flames.",
                "Fire alarm activated. SCDF notified.",
            ],
        },
        {
            "name": "first_response",
            "probability": 1.0,
            "delay_range_s": (60, 180),
            "note_templates": [
                "Fire engines on scene. {n} appliances deployed.",
                "First pump team arrived. Hose lines being laid.",
            ],
        },
        {
            "name": "casualty_assessment",
            "probability": 0.75,
            "delay_range_s": (120, 300),
            "note_templates": [
                "{n} casualties identified. Ambulances requested.",
                "Residents evacuated. {n} persons unaccounted for.",
            ],
        },
        {
            "name": "hospital_activation",
            "probability": 0.6,
            "delay_range_s": (180, 400),
            "note_templates": [
                "SCDF handoff to hospital cluster initiated.",
                "{n} patients en route to {hospital}.",
            ],
        },
        {
            "name": "containment",
            "probability": 0.9,
            "delay_range_s": (300, 600),
            "note_templates": [
                "Fire contained to {floor}F. No further spread.",
                "Hose lines withdrawn. Fire extinguished.",
            ],
        },
        {
            "name": "close",
            "probability": 1.0,
            "delay_range_s": (400, 900),
            "note_templates": [
                "Scene cleared. Units returning to base.",
                "Post-incident report filed. Ticket closed.",
            ],
        },
    ],
    "TRAFFIC_ACCIDENT": [
        {
            "name": "initial_report",
            "probability": 1.0,
            "delay_range_s": (0, 5),
            "note_templates": [
                "Multi-vehicle collision reported. {n} vehicles involved.",
                "Hit and run. Victim conscious at scene.",
            ],
        },
        {
            "name": "scene_control",
            "probability": 1.0,
            "delay_range_s": (60, 180),
            "note_templates": [
                "SPF officers on scene. Traffic diverted.",
                "{n} lanes closed. Diversions in place.",
            ],
        },
        {
            "name": "medical_response",
            "probability": 0.7,
            "delay_range_s": (90, 240),
            "note_templates": [
                "SCDF ambulance on scene. {n} casualties being assessed.",
                "CPR administered. Patient stabilised.",
            ],
        },
        {
            "name": "hospital_transfer",
            "probability": 0.55,
            "delay_range_s": (150, 360),
            "note_templates": [
                "{n} patients conveyed to {hospital}.",
                "Ambulance departed for {hospital}.",
            ],
        },
        {
            "name": "scene_clearance",
            "probability": 1.0,
            "delay_range_s": (300, 700),
            "note_templates": [
                "Vehicles cleared. Road reopened.",
                "Scene clear. All units stood down.",
            ],
        },
    ],
    "FLOODING": [
        {
            "name": "initial_report",
            "probability": 1.0,
            "delay_range_s": (0, 5),
            "note_templates": [
                "Flash flood reported. Water level rising.",
                "Drain overflow at {location}. PUB notified.",
            ],
        },
        {
            "name": "pump_deployment",
            "probability": 0.9,
            "delay_range_s": (60, 200),
            "note_templates": [
                "PUB pump team on scene. {n} portable pumps deployed.",
                "Drainage crew arrived. Pumping commenced.",
            ],
        },
        {
            "name": "resident_advisory",
            "probability": 0.7,
            "delay_range_s": (90, 250),
            "note_templates": [
                "Town council advisory issued. Residents advised to avoid area.",
                "{n} households affected. Town council notified.",
            ],
        },
        {
            "name": "water_receding",
            "probability": 0.85,
            "delay_range_s": (300, 600),
            "note_templates": [
                "Water level receding. Pumping continues.",
                "Hydrology update: level down to {level}m.",
            ],
        },
        {
            "name": "close",
            "probability": 1.0,
            "delay_range_s": (500, 1000),
            "note_templates": [
                "Flood cleared. Drainage restored.",
                "Site inspected. No further action required.",
            ],
        },
    ],
    "MEDICAL_EMERGENCY": [
        {
            "name": "initial_report",
            "probability": 1.0,
            "delay_range_s": (0, 5),
            "note_templates": [
                "Patient unresponsive. Caller performing CPR.",
                "Cardiac arrest reported. SCDF dispatched.",
            ],
        },
        {
            "name": "ambulance_dispatch",
            "probability": 1.0,
            "delay_range_s": (30, 120),
            "note_templates": [
                "Ambulance on scene. Paramedics assessing patient.",
                "AED applied. Patient in VF.",
            ],
        },
        {
            "name": "stabilisation",
            "probability": 0.8,
            "delay_range_s": (90, 240),
            "note_templates": [
                "Patient stabilised. ROSC achieved.",
                "Patient conscious. En route to hospital.",
            ],
        },
        {
            "name": "hospital_handoff",
            "probability": 0.85,
            "delay_range_s": (120, 300),
            "note_templates": [
                "Patient conveyed to {hospital}. ED notified.",
                "Handoff to {hospital} ED. {n} paramedics attending.",
            ],
        },
        {
            "name": "close",
            "probability": 1.0,
            "delay_range_s": (300, 600),
            "note_templates": [
                "Ambulance cleared. Unit returning to base.",
                "Case closed. Hospital confirmed patient received.",
            ],
        },
    ],
    "GAS_LEAK": [
        {
            "name": "initial_report",
            "probability": 1.0,
            "delay_range_s": (0, 5),
            "note_templates": [
                "Gas smell reported. Residents self-evacuating.",
                "Pipeline rupture suspected. SCDF HAZMAT activated.",
            ],
        },
        {
            "name": "evacuation",
            "probability": 0.9,
            "delay_range_s": (60, 180),
            "note_templates": [
                "Cordon established {n}m radius. {n} residents evacuated.",
                "SPF assisting with evacuation. Area secured.",
            ],
        },
        {
            "name": "hazmat_response",
            "probability": 0.85,
            "delay_range_s": (90, 300),
            "note_templates": [
                "HAZMAT team on scene. Gas concentration being measured.",
                "Leak source identified. Isolation valve being shut.",
            ],
        },
        {
            "name": "clearance",
            "probability": 0.9,
            "delay_range_s": (300, 700),
            "note_templates": [
                "Gas levels normalising. Area being ventilated.",
                "Leak sealed. Residents permitted to return.",
            ],
        },
        {
            "name": "close",
            "probability": 1.0,
            "delay_range_s": (500, 1000),
            "note_templates": [
                "All clear issued. Incident closed.",
                "NEA environmental check completed. No further action.",
            ],
        },
    ],
    "BUILDING_COLLAPSE": [
        {
            "name": "initial_report",
            "probability": 1.0,
            "delay_range_s": (0, 5),
            "note_templates": [
                "Partial structural collapse reported. Persons trapped.",
                "Retaining wall failure. Construction workers unaccounted for.",
            ],
        },
        {
            "name": "usar_deployment",
            "probability": 1.0,
            "delay_range_s": (60, 180),
            "note_templates": [
                "USAR team on scene. Search commenced.",
                "{n} teams deployed. Dogs and sonar equipment active.",
            ],
        },
        {
            "name": "casualty_extraction",
            "probability": 0.8,
            "delay_range_s": (200, 500),
            "note_templates": [
                "{n} casualties extracted. Ambulances on standby.",
                "Survivor located in debris. Extraction in progress.",
            ],
        },
        {
            "name": "structural_assessment",
            "probability": 0.7,
            "delay_range_s": (300, 600),
            "note_templates": [
                "BCA structural engineer on scene. Assessment ongoing.",
                "Building declared unsafe. Evacuation extended.",
            ],
        },
        {
            "name": "hospital_transfer",
            "probability": 0.75,
            "delay_range_s": (350, 700),
            "note_templates": [
                "{n} patients en route to {hospital}.",
                "Critical patient flown to {hospital} trauma unit.",
            ],
        },
        {
            "name": "close",
            "probability": 1.0,
            "delay_range_s": (700, 1500),
            "note_templates": [
                "Search concluded. No further survivors expected.",
                "Site handed to BCA and SPF. Incident closed.",
            ],
        },
    ],
    "MISSING_PERSON": [
        {
            "name": "initial_report",
            "probability": 1.0,
            "delay_range_s": (0, 5),
            "note_templates": [
                "Missing person report filed. Last seen at {location}.",
                "Vulnerable person missing. SPF search initiated.",
            ],
        },
        {
            "name": "search_operation",
            "probability": 1.0,
            "delay_range_s": (60, 200),
            "note_templates": [
                "{n} officers deployed. CCTV review requested.",
                "Dog unit activated. Search area expanded.",
            ],
        },
        {
            "name": "lead_identified",
            "probability": 0.65,
            "delay_range_s": (200, 500),
            "note_templates": [
                "CCTV footage reviewed. Subject spotted near {location}.",
                "Member of public reported sighting.",
            ],
        },
        {
            "name": "close",
            "probability": 1.0,
            "delay_range_s": (400, 1200),
            "note_templates": [
                "Subject located. Reunited with family.",
                "Person found safe. Case closed.",
            ],
        },
    ],
    "DISEASE_OUTBREAK": [
        {
            "name": "initial_report",
            "probability": 1.0,
            "delay_range_s": (0, 5),
            "note_templates": [
                "Cluster of {n} cases reported. MOH notified.",
                "Suspected outbreak at {location}. NEA investigation commenced.",
            ],
        },
        {
            "name": "field_investigation",
            "probability": 1.0,
            "delay_range_s": (60, 300),
            "note_templates": [
                "NEA vector control team on site. Samples collected.",
                "Environmental swabs taken. Lab results pending.",
            ],
        },
        {
            "name": "containment_measures",
            "probability": 0.8,
            "delay_range_s": (200, 500),
            "note_templates": [
                "Fogging conducted. {n} breeding sites destroyed.",
                "Affected premises closed pending inspection.",
            ],
        },
        {
            "name": "hospital_coordination",
            "probability": 0.6,
            "delay_range_s": (300, 600),
            "note_templates": [
                "{n} patients referred to hospital cluster.",
                "Hospital cluster placed on amber alert.",
            ],
        },
        {
            "name": "close",
            "probability": 1.0,
            "delay_range_s": (600, 1400),
            "note_templates": [
                "No new cases in 48 hours. Cluster declared closed.",
                "Post-outbreak inspection completed. Premises cleared.",
            ],
        },
    ],
}
```

### 4B — Template filler helper
Add a helper to the scenario engine that fills phase note templates:

```python
def fill_phase_note(template: str, trigger: IncidentTrigger) -> str:
    return template.format(
        floor=random.randint(2, 25),
        n=random.randint(1, 8),
        location=trigger.location.name,
        hospital=random.choice(["SGH", "NUH", "CGH", "NTFGH", "SKH"]),
        level=round(random.uniform(0.1, 0.6), 2),
    )
```

### 4C — Emit phase events from scenario engine
The scenario engine currently fires once and forgets. Add a background task
per incident that walks through the phase list and emits phase update events
to the middleware directly (not through agencies):

```python
async def run_scenario_phases(
    client: httpx.AsyncClient,
    trigger: IncidentTrigger,
    incident_type: str,
):
    phases = SCENARIO_PHASES.get(incident_type, [])
    for phase in phases:
        if random.random() > phase["probability"]:
            continue
        delay_s = random.uniform(*phase["delay_range_s"])
        await asyncio.sleep(delay_s)
        note = fill_phase_note(random.choice(phase["note_templates"]), trigger)
        # Post a phase event directly to middleware
        await _emit_phase_event(client, trigger, phase["name"], note)
```

### 4D — Scenario engine active_incidents
Track active incidents with phase state so `/active-incidents` shows current phase:

```python
active_incidents[trigger.incident_id] = {
    ...existing fields...,
    "current_phase": "initial_report",
    "phases_completed": [],
}
```

---

## Section 5 — AI Analysis Module (BERT/BART)

**New service:** `ai-incident-analyzer` (Python, FastAPI)

**Goal:** The middleware sends a normalized ticket to this service.
The service runs inference and returns category, severity estimate, urgency,
and duplicate likelihood. Middleware writes these back to the incident.

### 5A — New service structure

```
ai-incident-analyzer/
  main.py          ← FastAPI app
  analyzer.py      ← model logic
  requirements.txt
  Dockerfile
```

### 5B — Model choice
Use `facebook/bart-large-mnli` for zero-shot classification (no training needed,
works out of the box for a hackathon). It can classify free text against a set
of candidate labels.

```
pip install transformers torch
```

### 5C — analyzer.py

```python
from transformers import pipeline

# Load once at startup
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

INCIDENT_CATEGORIES = [
    "fire", "flood", "medical emergency", "traffic accident",
    "gas leak", "building collapse", "missing person", "disease outbreak",
]

URGENCY_LABELS = ["critical", "high", "medium", "low"]

def analyze_text(text: str) -> dict:
    category_result = classifier(text, INCIDENT_CATEGORIES)
    urgency_result = classifier(text, URGENCY_LABELS)

    top_category = category_result["labels"][0]
    top_urgency = urgency_result["labels"][0]
    urgency_score = urgency_result["scores"][0]

    severity_estimate = {
        "critical": 5,
        "high": 4,
        "medium": 2,
        "low": 1,
    }.get(top_urgency, 2)

    return {
        "category": top_category,
        "urgency": top_urgency,
        "severity_estimate": severity_estimate,
        "confidence": round(category_result["scores"][0], 3),
    }
```

### 5D — main.py (FastAPI app)

```python
from fastapi import FastAPI
from pydantic import BaseModel
from analyzer import analyze_text

app = FastAPI(title="ai-incident-analyzer")

class AnalyzeRequest(BaseModel):
    incident_id: str
    text: str          # concatenated logs + description
    agency_id: str

class AnalyzeResponse(BaseModel):
    incident_id: str
    category: str
    urgency: str
    severity_estimate: int
    confidence: float

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    result = analyze_text(req.text)
    return AnalyzeResponse(incident_id=req.incident_id, **result)

@app.get("/health")
def health():
    return {"status": "ok"}
```

### 5E — Wire middleware to AI module

In `incident-middleware.service.ts`, after writing to DB, fire-and-forget a
call to the AI module:

```ts
// In ingest(), after DB writes:
this.callAiAnalyzer(incident.id, normalized).catch(() => {});
```

```ts
private async callAiAnalyzer(incidentId: string, normalized: NormalizedIncidentTicket) {
  const text = [
    normalized.description,
    normalized.title,
    normalized.location,
  ].filter(Boolean).join('. ');

  const response = await fetch(`${process.env.AI_ANALYZER_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      incident_id: incidentId,
      text,
      agency_id: normalized.agencyId,
    }),
  });

  if (!response.ok) return;

  const result = await response.json();

  await this.prisma.incidents.update({
    where: { id: incidentId },
    data: {
      ai_category: result.category,
      ai_urgency: result.urgency,
      ai_severity_estimate: result.severity_estimate,
      ai_confidence: result.confidence,
    },
  });
}
```

Add a DB migration to add the four `ai_*` columns to `incidents`.

### 5F — Docker Compose
Add `ai-incident-analyzer` as a service. It needs access to the backend network.
Set `AI_ANALYZER_URL=http://ai-incident-analyzer:8000` in the backend env.

Note: `bart-large-mnli` is ~1.6GB. For a hackathon demo, consider
`cross-encoder/nli-MiniLM2-L6-H768` (~100MB) as a drop-in replacement —
same zero-shot API, much faster cold start.

---

## Section 6 — Improved Duplicate Detection in Middleware

**File:** `semantic-incident-analyzer.service.ts`

**Problem:** Token overlap alone misses cases where two tickets describe the
same incident in different words. Add a time-window guard and a location
proximity check to reduce false negatives.

### 6A — Add time-window filter
Only consider candidates created within the last N minutes:

```ts
const windowMinutes = 30;
const since = new Date(Date.now() - windowMinutes * 60 * 1000);

const recentCandidates = await this.prisma.incidents.findMany({
  where: {
    incident_type: ticket.incidentType,
    inc_status: { not: 'CLOSED' },
    created_at: { gte: since },
  },
  ...
});
```

### 6B — Add location proximity score
If the normalized ticket has lat/lng available, compute distance and add it
as a scoring factor:

```ts
private locationDistance(a: { lat?: number; lng?: number }, b: { lat?: number; lng?: number }) {
  if (!a?.lat || !b?.lat) return null;
  const dlat = a.lat - b.lat;
  const dlng = a.lng - b.lng;
  return Math.sqrt(dlat * dlat + dlng * dlng); // rough Euclidean, fine for SG scale
}
```

If distance < 0.005 (roughly 500m in SG), boost the similarity score by +0.2.

### 6C — Store lat/lng on incidents
Add `lat` and `lng` columns to `incidents` table. Populate them in
`IncidentMiddlewareService` from `normalized.rawMessage.incident.location`.

---

## Section 7 — Miscellaneous Cleanups

### 7A — Scenario engine: add more locations
The current list has 20 locations. Pad it to ~35, including:
- Industrial estates (Tuas, Jurong Island)
- Hawker centres (Maxwell, Old Airport Road)
- MRT stations across all lines
- School/childcare areas (simulates child/maternity patient profiles more often)
- Construction sites (feeds BUILDING_COLLAPSE naturally)

### 7B — base_agency.py: `_run_lifecycle` wait times
Current wait between updates is `random.uniform(8, 30)` seconds. For a richer
demo, make this incident-severity dependent:

```python
wait = random.uniform(
    max(4, 20 - trigger.severity * 3),
    max(10, 45 - trigger.severity * 4),
)
```

Higher severity → faster updates. Severity 5 incidents update every ~4-10s.
Severity 1 incidents update every ~14-30s.

### 7C — models.py: add `HAZE` and `CIVIL_DISTURBANCE` to `IncidentType`
Two more incident types to give the scenario engine more variety:
- `HAZE`: NEA + MOH-adjacent, involves PSI readings, school closures
- `CIVIL_DISTURBANCE`: SPF-heavy, crowd control, low casualty potential

Add matching entries to the scenario engine's `INCIDENT_CATALOGUE` with
appropriate agency assignments and `SCENARIO_PHASES` entries.

### 7D — Remove `@app.on_event` deprecation warnings
Replace `@app.on_event("startup")` and `@app.on_event("shutdown")` in
`base_agency.py` with the `lifespan` context manager pattern (same as the
scenario engine already uses).

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    self.http = httpx.AsyncClient()
    log.info(f"[{self.SERVICE_NAME}] started")
    yield
    if self.http:
        await self.http.aclose()

app = FastAPI(title=self.SERVICE_NAME, lifespan=lifespan)
```

---

## Task Order for Codex

Do these in order. Each is independently testable.

1. **Section 1** — Fix duplicate race condition (DB + service)
2. **Section 2** — Location fuzzing in agencies
3. **Section 3** — Noisier agency tickets
4. **Section 6** — Improved duplicate detection (time window + location)
5. **Section 4** — Scenario phase tree in scenario engine
6. **Section 5** — AI analyzer microservice
7. **Section 7** — Misc cleanups (do last, lowest risk)

---

## Notes for Codex

- All Python files use Pydantic v2 (`model_copy`, `model_dump(mode="json")`)
- The shared `models.py` and `base_agency.py` are in `/app/shared` inside Docker
- TypeScript files are NestJS with Prisma ORM
- Do not change the `RawAgencyMessage` shape — agencies depend on it
- The `_emit` method in `base_agency.py` is the single egress point — do not bypass it
- For Section 5, load the model at module level (not per-request) or cold starts will time out