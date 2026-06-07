"""Scenario engine for external agency simulation."""
from __future__ import annotations

import asyncio
import logging
import os
import random
import sys
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI

sys.path.insert(0, "/app/shared")
from models import (
    AgencyID,
    HealthResponse,
    IncidentTrigger,
    IncidentType,
    Location,
    new_id,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [SCENARIO-ENGINE] %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
log = logging.getLogger(__name__)

DEFAULT_INTERVAL_SECONDS = 60
INTERVAL = float(os.getenv("INTERVAL_SECONDS", str(DEFAULT_INTERVAL_SECONDS)))
SEED = os.getenv("RANDOM_SEED")
if SEED:
    random.seed(int(SEED))

AGENCY_URLS: dict[AgencyID, str] = {
    AgencyID.SPF: os.getenv("SPF_URL", "http://spf:8000"),
    AgencyID.SCDF: os.getenv("SCDF_URL", "http://scdf:8000"),
    AgencyID.SINGHEALTH: os.getenv("SINGHEALTH_URL", "http://singhealth:8000"),
    AgencyID.NUHS: os.getenv("NUHS_URL", "http://nuhs:8000"),
    AgencyID.TOWN_COUNCIL: os.getenv("TOWNCOUNCIL_URL", "http://towncouncil:8000"),
    AgencyID.PUB: os.getenv("PUB_URL", "http://pub:8000"),
    AgencyID.NEA: os.getenv("NEA_URL", "http://nea:8000"),
}

LOCATIONS: list[Location] = [
    Location(name="Orchard Road", area="Central", lat=1.3048, lng=103.8318, postal_code="238823"),
    Location(name="Toa Payoh Hub", area="Toa Payoh", lat=1.3329, lng=103.8480, postal_code="310480"),
    Location(name="Jurong East MRT", area="Jurong East", lat=1.3331, lng=103.7421, postal_code="609731"),
    Location(name="Tampines Mall", area="Tampines", lat=1.3527, lng=103.9453, postal_code="529284"),
    Location(name="Woodlands Checkpoint", area="Woodlands", lat=1.4474, lng=103.7670, postal_code="738000"),
    Location(name="Bedok Interchange", area="Bedok", lat=1.3240, lng=103.9300, postal_code="460001"),
    Location(name="Ang Mo Kio Ave 3", area="Ang Mo Kio", lat=1.3691, lng=103.8454, postal_code="569933"),
    Location(name="Buona Vista", area="West Coast", lat=1.3070, lng=103.7900, postal_code="139965"),
    Location(name="Geylang Serai", area="Geylang", lat=1.3153, lng=103.8990, postal_code="402001"),
    Location(name="Clementi Town Centre", area="Clementi", lat=1.3150, lng=103.7650, postal_code="120440"),
    Location(name="Sengkang General Hospital", area="Sengkang", lat=1.3950, lng=103.8940, postal_code="544886"),
    Location(name="Punggol Waterway", area="Punggol", lat=1.4040, lng=103.9020, postal_code="828761"),
    Location(name="Yishun Ring Road", area="Yishun", lat=1.4304, lng=103.8354, postal_code="760001"),
    Location(name="Bukit Timah Road", area="Bukit Timah", lat=1.3411, lng=103.7800, postal_code="259693"),
    Location(name="Pasir Ris Beach", area="Pasir Ris", lat=1.3815, lng=103.9530, postal_code="519000"),
    Location(name="Harbourfront Centre", area="Telok Blangah", lat=1.2654, lng=103.8218, postal_code="098585"),
    Location(name="Sembawang Hot Spring", area="Sembawang", lat=1.4406, lng=103.8188, postal_code="758468"),
    Location(name="Serangoon Gardens", area="Serangoon", lat=1.3627, lng=103.8663, postal_code="556083"),
    Location(name="Kallang Leisure Park", area="Kallang", lat=1.3108, lng=103.8728, postal_code="397293"),
    Location(name="Boon Lay MRT", area="Boon Lay", lat=1.3388, lng=103.7060, postal_code="649930"),
]

INCIDENT_CATALOGUE = [
    {
        "type": IncidentType.TRAFFIC_ACCIDENT,
        "weight": 24,
        "severity_range": (1, 4),
        "descriptions": [
            "Multi-vehicle collision blocking {lanes} lanes",
            "Lorry overturned at junction, debris on road",
            "Bus collided with car, passengers injured",
            "Hit-and-run incident, victim on road",
        ],
        "required": [AgencyID.SPF],
        "optional": [AgencyID.SCDF],
        "optional_pick": (0, 1),
        "medical_handoff_by": AgencyID.SCDF,
    },
    {
        "type": IncidentType.BUILDING_FIRE,
        "weight": 10,
        "severity_range": (2, 5),
        "descriptions": [
            "Smoke reported from {floor}th floor of HDB block",
            "Kitchen fire spreading to adjacent units",
            "Commercial shophouse fire, occupants evacuating",
            "Electrical fire in carpark, vehicles involved",
        ],
        "required": [AgencyID.SCDF],
        "optional": [AgencyID.SPF, AgencyID.TOWN_COUNCIL],
        "optional_pick": (1, 2),
        "medical_handoff_by": AgencyID.SCDF,
    },
    {
        "type": IncidentType.FLOODING,
        "weight": 13,
        "severity_range": (1, 4),
        "descriptions": [
            "Flash flood at underpass, vehicles stranded",
            "Drain overflow affecting {count} units",
            "Low-lying carpark flooded, pump required",
            "Pathway flooded, elderly residents trapped",
        ],
        "required": [AgencyID.PUB],
        "optional": [AgencyID.TOWN_COUNCIL, AgencyID.SPF, AgencyID.SCDF, AgencyID.NEA],
        "optional_pick": (0, 2),
    },
    {
        "type": IncidentType.MEDICAL_EMERGENCY,
        "weight": 28,
        "severity_range": (1, 5),
        "descriptions": [
            "Elderly resident unresponsive at void deck",
            "Cardiac arrest at MRT station",
            "Mass food poisoning, {count} persons affected",
            "Pregnant woman in labour, ambulance requested",
        ],
        "required": [AgencyID.SCDF],
        "optional": [AgencyID.SPF],
        "optional_pick": (0, 1),
        "medical_handoff_by": AgencyID.SCDF,
    },
    {
        "type": IncidentType.GAS_LEAK,
        "weight": 5,
        "severity_range": (2, 5),
        "descriptions": [
            "Gas smell reported in {floor} residential units",
            "Pipeline rupture at construction site",
            "Commercial kitchen gas leak, evacuation ongoing",
        ],
        "required": [AgencyID.SCDF, AgencyID.SPF],
        "optional": [AgencyID.NEA, AgencyID.TOWN_COUNCIL],
        "optional_pick": (0, 2),
        "medical_handoff_by": AgencyID.SCDF,
    },
    {
        "type": IncidentType.BUILDING_COLLAPSE,
        "weight": 2,
        "severity_range": (3, 5),
        "descriptions": [
            "Partial structural collapse at construction site",
            "Old shophouse wall collapsed onto footpath",
            "Retaining wall failure, {count} workers trapped",
        ],
        "required": [AgencyID.SCDF, AgencyID.SPF],
        "optional": [AgencyID.TOWN_COUNCIL, AgencyID.NEA],
        "optional_pick": (1, 2),
        "medical_handoff_by": AgencyID.SCDF,
    },
    {
        "type": IncidentType.MISSING_PERSON,
        "weight": 11,
        "severity_range": (1, 3),
        "descriptions": [
            "Elderly dementia patient missing since morning",
            "Child reported missing at shopping mall",
            "Missing teenager, last seen near MRT",
        ],
        "required": [AgencyID.SPF],
        "optional": [],
        "optional_pick": (0, 0),
    },
    {
        "type": IncidentType.DISEASE_OUTBREAK,
        "weight": 4,
        "severity_range": (2, 5),
        "descriptions": [
            "Suspected gastroenteritis cluster at childcare centre",
            "Multiple cases of dengue fever reported in cluster",
            "Unidentified respiratory illness affecting {count} residents",
        ],
        "required": [AgencyID.NEA, AgencyID.SINGHEALTH, AgencyID.NUHS],
        "optional": [AgencyID.SPF, AgencyID.TOWN_COUNCIL],
        "optional_pick": (0, 2),
    },
]

active_incidents: dict[str, dict] = {}


def fill_template(template: str) -> str:
    return template.format(
        floor=random.randint(3, 30),
        lanes=random.randint(1, 3),
        count=random.randint(5, 40),
    )


async def generate_incident(client: httpx.AsyncClient):
    catalogue_entry = random.choices(
        INCIDENT_CATALOGUE,
        weights=[entry["weight"] for entry in INCIDENT_CATALOGUE],
        k=1,
    )[0]
    location = random.choice(LOCATIONS)
    severity = random.randint(*catalogue_entry["severity_range"])
    description = fill_template(random.choice(catalogue_entry["descriptions"]))
    agencies = resolve_agencies(catalogue_entry, severity)

    trigger = IncidentTrigger(
        incident_type=catalogue_entry["type"],
        severity=severity,
        location=location,
        description=description,
        participating_agencies=agencies,
        trace_id=new_id(),
        span_id=new_id(),
        metadata={
            "generation": {
                "selection_weight": catalogue_entry["weight"],
                "medical_handoff_by": (
                    catalogue_entry["medical_handoff_by"].value
                    if catalogue_entry.get("medical_handoff_by")
                    else None
                ),
            }
        },
    )

    log.info(
        "[INC] %s | %s | %s | sev=%s | agencies=%s",
        trigger.incident_id[:8],
        trigger.incident_type.value,
        location.name,
        severity,
        [agency.value for agency in agencies],
    )

    active_incidents[trigger.incident_id] = {
        "incident_id": trigger.incident_id,
        "type": trigger.incident_type.value,
        "location": location.name,
        "severity": severity,
        "agencies": [agency.value for agency in agencies],
        "selection_weight": catalogue_entry["weight"],
        "triggered_at": trigger.triggered_at.isoformat(),
    }

    await notify_agencies(client, agencies, trigger)


def resolve_agencies(catalogue_entry: dict, severity: int) -> list[AgencyID]:
    required = list(catalogue_entry["required"])
    optional = list(catalogue_entry["optional"])
    n_optional = random.randint(*catalogue_entry["optional_pick"])
    chosen_optional = random.sample(optional, min(n_optional, len(optional)))
    agencies = list(dict.fromkeys(required + chosen_optional))

    if catalogue_entry.get("medical_handoff_by") == AgencyID.SCDF and AgencyID.SCDF not in agencies:
        if severity >= 3 or catalogue_entry["type"] == IncidentType.MEDICAL_EMERGENCY:
            agencies.append(AgencyID.SCDF)

    return agencies


async def notify_agencies(client: httpx.AsyncClient, agencies: list[AgencyID], trigger: IncidentTrigger):
    tasks = []
    for agency in agencies:
        url = AGENCY_URLS.get(agency)
        if not url:
            continue
        tasks.append(_notify_agency(client, url, agency, trigger, random.uniform(0, 0.8)))
    await asyncio.gather(*tasks, return_exceptions=True)


async def _notify_agency(
    client: httpx.AsyncClient,
    url: str,
    agency: AgencyID,
    trigger: IncidentTrigger,
    delay: float,
):
    await asyncio.sleep(delay)
    try:
        response = await client.post(f"{url}/incident", json=trigger.model_dump(mode="json"), timeout=5)
        log.info("  -> %s %s", agency.value, response.status_code)
    except Exception as exc:
        log.warning("  -> %s FAILED: %s", agency.value, exc)


async def scenario_loop():
    async with httpx.AsyncClient() as client:
        log.info("Scenario loop started (interval=%ss)", INTERVAL)
        while True:
            try:
                await generate_incident(client)
            except Exception as exc:
                log.error("Loop error: %s", exc)
            await asyncio.sleep(INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(scenario_loop())
    yield
    task.cancel()


app = FastAPI(title="Scenario Engine", lifespan=lifespan)


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(service="scenario-engine", active_incidents=len(active_incidents))


@app.get("/active-incidents")
async def get_active_incidents():
    return {"incidents": list(active_incidents.values()), "total": len(active_incidents)}


@app.get("/catalogue")
async def get_catalogue():
    return {
        "incident_types": [entry["type"].value for entry in INCIDENT_CATALOGUE],
        "incident_weights": {entry["type"].value: entry["weight"] for entry in INCIDENT_CATALOGUE},
        "locations": [location.model_dump() for location in LOCATIONS],
        "total_locations": len(LOCATIONS),
    }
