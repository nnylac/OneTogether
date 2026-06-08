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
PHASE_TIME_SCALE = float(os.getenv("PHASE_TIME_SCALE", "0.1"))
MIDDLEWARE_URL = os.getenv("MIDDLEWARE_URL", "")
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
    Location(name="Tuas Industrial Estate", area="Tuas", lat=1.3295, lng=103.6480, postal_code="638501"),
    Location(name="Jurong Island Checkpoint", area="Jurong Island", lat=1.2659, lng=103.6954, postal_code="627606"),
    Location(name="Maxwell Food Centre", area="Outram", lat=1.2803, lng=103.8448, postal_code="069184"),
    Location(name="Old Airport Road Food Centre", area="Geylang", lat=1.3082, lng=103.8858, postal_code="390051"),
    Location(name="Dhoby Ghaut MRT", area="Museum", lat=1.2993, lng=103.8453, postal_code="238826"),
    Location(name="Paya Lebar MRT", area="Geylang", lat=1.3175, lng=103.8921, postal_code="409051"),
    Location(name="Beauty World MRT", area="Bukit Timah", lat=1.3416, lng=103.7758, postal_code="588216"),
    Location(name="Marine Parade MRT", area="Marine Parade", lat=1.3022, lng=103.9054, postal_code="449269"),
    Location(name="Woodlands North MRT", area="Woodlands", lat=1.4483, lng=103.7857, postal_code="737663"),
    Location(name="Nanyang Primary School", area="Bukit Timah", lat=1.3210, lng=103.8078, postal_code="268097"),
    Location(name="My First Skool Punggol", area="Punggol", lat=1.4014, lng=103.9063, postal_code="828761"),
    Location(name="ITE College Central", area="Ang Mo Kio", lat=1.3779, lng=103.8564, postal_code="567720"),
    Location(name="Tengah Construction Site", area="Tengah", lat=1.3621, lng=103.7297, postal_code="699010"),
    Location(name="Punggol Digital District Site", area="Punggol", lat=1.4142, lng=103.9118, postal_code="829913"),
    Location(name="Greater Southern Waterfront Site", area="Telok Blangah", lat=1.2712, lng=103.8095, postal_code="099253"),
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
    {
        "type": IncidentType.HAZE,
        "weight": 3,
        "severity_range": (1, 4),
        "descriptions": [
            "Elevated PSI readings reported across {count} monitoring points",
            "Dense haze affecting visibility near schools and transport hubs",
        ],
        "required": [AgencyID.NEA],
        "optional": [AgencyID.SINGHEALTH, AgencyID.NUHS, AgencyID.TOWN_COUNCIL],
        "optional_pick": (0, 2),
    },
    {
        "type": IncidentType.CIVIL_DISTURBANCE,
        "weight": 3,
        "severity_range": (1, 4),
        "descriptions": [
            "Large crowd blocking access road, public order support requested",
            "Unplanned gathering of {count} persons near transport interchange",
        ],
        "required": [AgencyID.SPF],
        "optional": [AgencyID.SCDF],
        "optional_pick": (0, 1),
        "medical_handoff_by": AgencyID.SCDF,
    },
]

active_incidents: dict[str, dict] = {}
phase_tasks: set[asyncio.Task] = set()


SCENARIO_PHASES: dict[str, list[dict]] = {
    "BUILDING_FIRE": [
        {"name": "initial_report", "agencies_active": [AgencyID.SCDF], "probability": 1.0, "delay_range_s": (0, 5), "note_templates": ["Smoke reported from {floor}F. Caller reports visible flames.", "Fire alarm activated. SCDF notified."]},
        {"name": "first_response", "agencies_active": [AgencyID.SCDF, AgencyID.SPF], "probability": 1.0, "delay_range_s": (60, 180), "note_templates": ["Fire engines on scene. {n} appliances deployed.", "First pump team arrived. Hose lines being laid."]},
        {"name": "casualty_assessment", "agencies_active": [AgencyID.SCDF], "probability": 0.75, "delay_range_s": (120, 300), "note_templates": ["{n} casualties identified. Ambulances requested.", "Residents evacuated. {n} persons unaccounted for."]},
        {"name": "hospital_activation", "agencies_active": [AgencyID.SCDF, AgencyID.SINGHEALTH, AgencyID.NUHS], "probability": 0.6, "delay_range_s": (180, 400), "note_templates": ["SCDF handoff to hospital cluster initiated.", "{n} patients en route to {hospital}."]},
        {"name": "containment", "agencies_active": [AgencyID.SCDF], "probability": 0.9, "delay_range_s": (300, 600), "note_templates": ["Fire contained to {floor}F. No further spread.", "Hose lines withdrawn. Fire extinguished."]},
        {"name": "close", "agencies_active": [AgencyID.SCDF], "probability": 1.0, "delay_range_s": (400, 900), "note_templates": ["Scene cleared. Units returning to base.", "Post-incident report filed. Ticket closed."]},
    ],
    "TRAFFIC_ACCIDENT": [
        {"name": "initial_report", "agencies_active": [AgencyID.SPF], "probability": 1.0, "delay_range_s": (0, 5), "note_templates": ["Multi-vehicle collision reported. {n} vehicles involved.", "Hit and run. Victim conscious at scene."]},
        {"name": "scene_control", "agencies_active": [AgencyID.SPF], "probability": 1.0, "delay_range_s": (60, 180), "note_templates": ["SPF officers on scene. Traffic diverted.", "{n} lanes closed. Diversions in place."]},
        {"name": "medical_response", "agencies_active": [AgencyID.SCDF], "probability": 0.7, "delay_range_s": (90, 240), "note_templates": ["SCDF ambulance on scene. {n} casualties being assessed.", "CPR administered. Patient stabilised."]},
        {"name": "hospital_transfer", "agencies_active": [AgencyID.SCDF, AgencyID.SINGHEALTH, AgencyID.NUHS], "probability": 0.55, "delay_range_s": (150, 360), "note_templates": ["{n} patients conveyed to {hospital}.", "Ambulance departed for {hospital}."]},
        {"name": "close", "agencies_active": [AgencyID.SPF], "probability": 1.0, "delay_range_s": (300, 700), "note_templates": ["Vehicles cleared. Road reopened.", "Scene clear. All units stood down."]},
    ],
    "FLOODING": [
        {"name": "initial_report", "agencies_active": [AgencyID.PUB], "probability": 1.0, "delay_range_s": (0, 5), "note_templates": ["Flash flood reported. Water level rising.", "Drain overflow at {location}. PUB notified."]},
        {"name": "pump_deployment", "agencies_active": [AgencyID.PUB], "probability": 0.9, "delay_range_s": (60, 200), "note_templates": ["PUB pump team on scene. {n} portable pumps deployed.", "Drainage crew arrived. Pumping commenced."]},
        {"name": "resident_advisory", "agencies_active": [AgencyID.TOWN_COUNCIL], "probability": 0.7, "delay_range_s": (90, 250), "note_templates": ["Town council advisory issued. Residents advised to avoid area.", "{n} households affected. Town council notified."]},
        {"name": "water_receding", "agencies_active": [AgencyID.PUB], "probability": 0.85, "delay_range_s": (300, 600), "note_templates": ["Water level receding. Pumping continues.", "Hydrology update: level down to {level}m."]},
        {"name": "close", "agencies_active": [AgencyID.PUB], "probability": 1.0, "delay_range_s": (500, 1000), "note_templates": ["Flood cleared. Drainage restored.", "Site inspected. No further action required."]},
    ],
    "MEDICAL_EMERGENCY": [
        {"name": "initial_report", "agencies_active": [AgencyID.SCDF], "probability": 1.0, "delay_range_s": (0, 5), "note_templates": ["Patient unresponsive. Caller performing CPR.", "Cardiac arrest reported. SCDF dispatched."]},
        {"name": "ambulance_dispatch", "agencies_active": [AgencyID.SCDF], "probability": 1.0, "delay_range_s": (30, 120), "note_templates": ["Ambulance on scene. Paramedics assessing patient.", "AED applied. Patient in VF."]},
        {"name": "stabilisation", "agencies_active": [AgencyID.SCDF], "probability": 0.8, "delay_range_s": (90, 240), "note_templates": ["Patient stabilised. ROSC achieved.", "Patient conscious. En route to hospital."]},
        {"name": "hospital_handoff", "agencies_active": [AgencyID.SCDF, AgencyID.SINGHEALTH, AgencyID.NUHS], "probability": 0.85, "delay_range_s": (120, 300), "note_templates": ["Patient conveyed to {hospital}. ED notified.", "Handoff to {hospital} ED. {n} paramedics attending."]},
        {"name": "close", "agencies_active": [AgencyID.SCDF], "probability": 1.0, "delay_range_s": (300, 600), "note_templates": ["Ambulance cleared. Unit returning to base.", "Case closed. Hospital confirmed patient received."]},
    ],
    "GAS_LEAK": [
        {"name": "initial_report", "agencies_active": [AgencyID.SCDF], "probability": 1.0, "delay_range_s": (0, 5), "note_templates": ["Gas smell reported. Residents self-evacuating.", "Pipeline rupture suspected. SCDF HAZMAT activated."]},
        {"name": "evacuation", "agencies_active": [AgencyID.SPF, AgencyID.SCDF], "probability": 0.9, "delay_range_s": (60, 180), "note_templates": ["Cordon established {n}m radius. {n} residents evacuated.", "SPF assisting with evacuation. Area secured."]},
        {"name": "hazmat_response", "agencies_active": [AgencyID.SCDF], "probability": 0.85, "delay_range_s": (90, 300), "note_templates": ["HAZMAT team on scene. Gas concentration being measured.", "Leak source identified. Isolation valve being shut."]},
        {"name": "clearance", "agencies_active": [AgencyID.SCDF, AgencyID.NEA], "probability": 0.9, "delay_range_s": (300, 700), "note_templates": ["Gas levels normalising. Area being ventilated.", "Leak sealed. Residents permitted to return."]},
        {"name": "close", "agencies_active": [AgencyID.SCDF], "probability": 1.0, "delay_range_s": (500, 1000), "note_templates": ["All clear issued. Incident closed.", "NEA environmental check completed. No further action."]},
    ],
    "BUILDING_COLLAPSE": [
        {"name": "initial_report", "agencies_active": [AgencyID.SCDF, AgencyID.SPF], "probability": 1.0, "delay_range_s": (0, 5), "note_templates": ["Partial structural collapse reported. Persons trapped.", "Retaining wall failure. Construction workers unaccounted for."]},
        {"name": "usar_deployment", "agencies_active": [AgencyID.SCDF], "probability": 1.0, "delay_range_s": (60, 180), "note_templates": ["USAR team on scene. Search commenced.", "{n} teams deployed. Search equipment active."]},
        {"name": "casualty_extraction", "agencies_active": [AgencyID.SCDF], "probability": 0.8, "delay_range_s": (200, 500), "note_templates": ["{n} casualties extracted. Ambulances on standby.", "Survivor located in debris. Extraction in progress."]},
        {"name": "structural_assessment", "agencies_active": [AgencyID.TOWN_COUNCIL], "probability": 0.7, "delay_range_s": (300, 600), "note_templates": ["Structural engineer on scene. Assessment ongoing.", "Building declared unsafe. Evacuation extended."]},
        {"name": "hospital_transfer", "agencies_active": [AgencyID.SCDF, AgencyID.SINGHEALTH, AgencyID.NUHS], "probability": 0.75, "delay_range_s": (350, 700), "note_templates": ["{n} patients en route to {hospital}.", "Critical patient transferred to {hospital} trauma unit."]},
        {"name": "close", "agencies_active": [AgencyID.SCDF, AgencyID.SPF], "probability": 1.0, "delay_range_s": (700, 1500), "note_templates": ["Search concluded. No further survivors expected.", "Site handed over for investigation. Incident closed."]},
    ],
    "MISSING_PERSON": [
        {"name": "initial_report", "agencies_active": [AgencyID.SPF], "probability": 1.0, "delay_range_s": (0, 5), "note_templates": ["Missing person report filed. Last seen at {location}.", "Vulnerable person missing. SPF search initiated."]},
        {"name": "search_operation", "agencies_active": [AgencyID.SPF], "probability": 1.0, "delay_range_s": (60, 200), "note_templates": ["{n} officers deployed. CCTV review requested.", "Search area expanded."]},
        {"name": "lead_identified", "agencies_active": [AgencyID.SPF], "probability": 0.65, "delay_range_s": (200, 500), "note_templates": ["CCTV footage reviewed. Subject spotted near {location}.", "Member of public reported sighting."]},
        {"name": "close", "agencies_active": [AgencyID.SPF], "probability": 1.0, "delay_range_s": (400, 1200), "note_templates": ["Subject located. Reunited with family.", "Person found safe. Case closed."]},
    ],
    "DISEASE_OUTBREAK": [
        {"name": "initial_report", "agencies_active": [AgencyID.NEA], "probability": 1.0, "delay_range_s": (0, 5), "note_templates": ["Cluster of {n} cases reported. MOH notified.", "Suspected outbreak at {location}. NEA investigation commenced."]},
        {"name": "field_investigation", "agencies_active": [AgencyID.NEA], "probability": 1.0, "delay_range_s": (60, 300), "note_templates": ["NEA vector control team on site. Samples collected.", "Environmental swabs taken. Lab results pending."]},
        {"name": "containment_measures", "agencies_active": [AgencyID.NEA], "probability": 0.8, "delay_range_s": (200, 500), "note_templates": ["Fogging conducted. {n} breeding sites destroyed.", "Affected premises closed pending inspection."]},
        {"name": "hospital_coordination", "agencies_active": [AgencyID.SINGHEALTH, AgencyID.NUHS], "probability": 0.6, "delay_range_s": (300, 600), "note_templates": ["{n} patients referred to hospital cluster.", "Hospital cluster placed on amber alert."]},
        {"name": "close", "agencies_active": [AgencyID.NEA], "probability": 1.0, "delay_range_s": (600, 1400), "note_templates": ["No new cases reported. Cluster declared closed.", "Post-outbreak inspection completed. Premises cleared."]},
    ],
    "HAZE": [
        {"name": "initial_report", "agencies_active": [AgencyID.NEA], "probability": 1.0, "delay_range_s": (0, 5), "note_templates": ["PSI readings elevated across {n} stations.", "Visibility reduced at {location}."]},
        {"name": "public_advisory", "agencies_active": [AgencyID.NEA, AgencyID.TOWN_COUNCIL], "probability": 0.9, "delay_range_s": (60, 180), "note_templates": ["Public advised to reduce prolonged outdoor activity.", "Schools reviewing outdoor activity plans."]},
        {"name": "health_monitoring", "agencies_active": [AgencyID.SINGHEALTH, AgencyID.NUHS], "probability": 0.65, "delay_range_s": (120, 300), "note_templates": ["Hospitals monitoring respiratory attendance.", "{n} haze-related cases assessed."]},
        {"name": "close", "agencies_active": [AgencyID.NEA], "probability": 1.0, "delay_range_s": (300, 700), "note_templates": ["Air quality returned to acceptable range.", "Haze advisory lifted."]},
    ],
    "CIVIL_DISTURBANCE": [
        {"name": "initial_report", "agencies_active": [AgencyID.SPF], "probability": 1.0, "delay_range_s": (0, 5), "note_templates": ["Crowd gathering reported at {location}.", "Public order incident reported. SPF notified."]},
        {"name": "scene_control", "agencies_active": [AgencyID.SPF], "probability": 1.0, "delay_range_s": (30, 120), "note_templates": ["Crowd control officers deployed.", "Access routes secured and diversions established."]},
        {"name": "medical_support", "agencies_active": [AgencyID.SCDF], "probability": 0.35, "delay_range_s": (90, 240), "note_templates": ["SCDF medical team on standby.", "{n} persons assessed for minor injuries."]},
        {"name": "close", "agencies_active": [AgencyID.SPF], "probability": 1.0, "delay_range_s": (240, 600), "note_templates": ["Crowd dispersed peacefully. Roads reopened.", "Public order operation concluded."]},
    ],
}


def fill_template(template: str) -> str:
    return template.format(
        floor=random.randint(3, 30),
        lanes=random.randint(1, 3),
        count=random.randint(5, 40),
    )


def fill_phase_note(template: str, trigger: IncidentTrigger) -> str:
    return template.format(
        floor=random.randint(2, 25),
        n=random.randint(1, 8),
        location=trigger.location.name,
        hospital=random.choice(["SGH", "NUH", "CGH", "NTFGH", "SKH"]),
        level=round(random.uniform(0.1, 0.6), 2),
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
        "current_phase": "dispatching",
        "phases_completed": [],
        "status": "active",
    }

    await notify_agencies(client, agencies, trigger)
    task = asyncio.create_task(run_scenario_phases(client, trigger))
    phase_tasks.add(task)
    task.add_done_callback(phase_tasks.discard)


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


async def run_scenario_phases(
    client: httpx.AsyncClient,
    trigger: IncidentTrigger,
):
    phases = SCENARIO_PHASES.get(trigger.incident_type.value, [])
    loop = asyncio.get_running_loop()
    started_at = loop.time()

    for phase in phases:
        if random.random() > phase["probability"]:
            continue

        target_delay = random.uniform(*phase["delay_range_s"]) * PHASE_TIME_SCALE
        await asyncio.sleep(max(0, target_delay - (loop.time() - started_at)))
        note = fill_phase_note(random.choice(phase["note_templates"]), trigger)
        incident_state = active_incidents.get(trigger.incident_id)
        if incident_state:
            incident_state["current_phase"] = phase["name"]

        active_agencies = [
            agency
            for agency in phase["agencies_active"]
            if agency in trigger.participating_agencies
        ]
        if not active_agencies:
            active_agencies = [AgencyID.SCENARIO_ENGINE]

        await asyncio.gather(
            *[
                _emit_phase_event(
                    client,
                    trigger,
                    agency,
                    phase["name"],
                    note,
                    phase["name"] == "close",
                )
                for agency in active_agencies
            ],
            return_exceptions=True,
        )

        if incident_state:
            incident_state["phases_completed"].append(phase["name"])

    incident_state = active_incidents.get(trigger.incident_id)
    if incident_state:
        incident_state["status"] = "closed"
        incident_state["current_phase"] = "closed"
    await asyncio.sleep(60)
    active_incidents.pop(trigger.incident_id, None)


async def _emit_phase_event(
    client: httpx.AsyncClient,
    trigger: IncidentTrigger,
    agency: AgencyID,
    phase_name: str,
    note: str,
    is_close: bool,
):
    if not MIDDLEWARE_URL:
        return

    raw_message = {
        "message_kind": "scenario_phase",
        "sender": {
            "agency_id": agency.value,
            "org_id": agency.value,
            "system_id": "SCENARIO_ENGINE",
            "service_instance": "scenario-engine",
        },
        "external_incident_id": trigger.incident_id,
        "trace_id": trigger.trace_id,
        "incident": trigger.model_dump(mode="json"),
        "ticket": {
            "ticket_id": f"PHASE-{agency.value}-{trigger.incident_id}",
            "status": "CLOSED" if is_close else "IN_PROGRESS",
            "data": {
                "scenario_phase": phase_name,
                "narrative": note,
            },
        },
        "logs": [{"ts": trigger.triggered_at.isoformat(), "note": note}],
        "quality": {},
    }
    try:
        await client.post(
            f"{MIDDLEWARE_URL}/events",
            json=raw_message,
            timeout=5,
        )
    except Exception as exc:
        log.warning("phase emit %s/%s failed: %s", agency.value, phase_name, exc)


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
    for phase_task in list(phase_tasks):
        phase_task.cancel()


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
