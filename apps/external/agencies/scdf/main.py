"""SCDF — Singapore Civil Defence Force simulator (FIREWATCH schema)"""
import asyncio
import logging
import os
import random
import sys

sys.path.insert(0, "/app/shared")
from base_agency import BaseAgencySimulator
from hospital_routing import route_hospital
from models import (
    AgencyID,
    EventType,
    IncidentTrigger,
    IncidentType,
    TicketStatus,
    new_id,
    utcnow,
)

log = logging.getLogger("scdf")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [SCDF] %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)

INCIDENT_TYPE_MAP = {
    "TRAFFIC_ACCIDENT":  "RESCUE",
    "BUILDING_FIRE":     "FIRE",
    "FLOODING":          "RESCUE",
    "MEDICAL_EMERGENCY": "MEDICAL",
    "GAS_LEAK":          "HAZMAT",
    "BUILDING_COLLAPSE": "RESCUE",
    "MISSING_PERSON":    "RESCUE",
    "DISEASE_OUTBREAK":  "MEDICAL",
}
STATIONS = ["CDS", "TOA", "JRG", "BDK", "WDL", "ANG", "CLM", "SGK"]
SPECIALISATIONS = ["Urban Search & Rescue", "Hazmat", "Water Rescue", "Height Rescue", "General"]
BUILDING_NAME_VARIANTS = [
    "Blk {n} {area}",
    "Block {n}, {area}",
    "{area} Blk {n}",
    "{n} {area} (HDB)",
]
HOSPITAL_CLUSTER_URLS = {
    AgencyID.SINGHEALTH: os.getenv("SINGHEALTH_URL", "http://singhealth:8000"),
    AgencyID.NUHS: os.getenv("NUHS_URL", "http://nuhs:8000"),
}
HOSPITAL_HANDOFF_TYPES = {
    IncidentType.TRAFFIC_ACCIDENT,
    IncidentType.BUILDING_FIRE,
    IncidentType.MEDICAL_EMERGENCY,
    IncidentType.GAS_LEAK,
    IncidentType.BUILDING_COLLAPSE,
}


class SCDFSimulator(BaseAgencySimulator):
    AGENCY_ID    = AgencyID.SCDF
    SYSTEM_ID    = "FIREWATCH"
    SERVICE_NAME = "scdf-simulator"

    def resource_outlets(self) -> list[dict]:
        return [
            {
                "externalOutletId": "SCDF-CENTRAL",
                "name": "Central Fire Station",
                "type": "fire_station",
                "region": "Central",
                "address": "62 Hill Street",
                "location": {"lat": 1.2926, "lng": 103.8487},
                "resources": [
                    self._resource("fire_engine", "Fire Engines", "vehicle", 8, 5, 2, 0, 1),
                    self._resource("ambulance", "Ambulances", "vehicle", 12, 8, 3, 0, 1),
                    self._resource("rescue_team", "Rescue Teams", "crew", 10, 6, 3, 1, 0),
                ],
            },
            {
                "externalOutletId": "SCDF-TOA",
                "name": "Toa Payoh Fire Station",
                "type": "fire_station",
                "region": "Central",
                "address": "25 Kim Keat Road",
                "location": {"lat": 1.3296, "lng": 103.8562},
                "resources": [
                    self._resource("fire_engine", "Fire Engines", "vehicle", 6, 4, 1, 0, 1),
                    self._resource("ambulance", "Ambulances", "vehicle", 9, 6, 2, 0, 1),
                    self._resource("hazmat_unit", "Hazmat Units", "specialist_unit", 3, 2, 1, 0, 0),
                ],
            },
            {
                "externalOutletId": "SCDF-JRG",
                "name": "Jurong Fire Station",
                "type": "fire_station",
                "region": "West",
                "address": "22 Jurong West Street 26",
                "location": {"lat": 1.3448, "lng": 103.7076},
                "resources": [
                    self._resource("fire_engine", "Fire Engines", "vehicle", 7, 4, 2, 0, 1),
                    self._resource("ambulance", "Ambulances", "vehicle", 10, 7, 2, 0, 1),
                    self._resource("water_rescue_team", "Water Rescue Teams", "crew", 4, 3, 1, 0, 0),
                ],
            },
            {
                "externalOutletId": "SCDF-BDK",
                "name": "Bedok Fire Station",
                "type": "fire_station",
                "region": "East",
                "address": "850 Bedok North Road",
                "location": {"lat": 1.3315, "lng": 103.9264},
                "resources": [
                    self._resource("fire_engine", "Fire Engines", "vehicle", 6, 5, 1, 0, 0),
                    self._resource("ambulance", "Ambulances", "vehicle", 11, 8, 2, 0, 1),
                    self._resource("rescue_team", "Rescue Teams", "crew", 8, 5, 2, 1, 0),
                ],
            },
        ]

    def _resource(self, resource_id: str, name: str, category: str, total: int, available: int, deployed: int, reserved: int, maintenance: int) -> dict:
        return {
            "externalResourceId": resource_id,
            "name": name,
            "category": category,
            "unit": "count",
            "total": total,
            "available": available,
            "deployed": deployed,
            "reserved": reserved,
            "maintenance": maintenance,
        }

    async def _handle_incident(self, trigger: IncidentTrigger):
        await super()._handle_incident(trigger)
        if self._should_handoff_to_hospital(trigger):
            ticket_id = f"{self.AGENCY_ID.value}-{trigger.incident_id[:8].upper()}"
            await self._handoff_to_hospital(trigger, ticket_id)

    def build_ticket_payload(self, trigger: IncidentTrigger, ticket_id: str) -> dict:
        station   = random.choice(STATIONS)
        unit_num  = random.randint(1, 40)
        blk       = random.randint(1, 500)
        bname_tpl = random.choice(BUILDING_NAME_VARIANTS)

        n_engines    = random.randint(1, 3) if "FIRE" in trigger.incident_type.value else 0
        n_ambulances = random.randint(1, 4) if trigger.severity >= 2 else 0
        n_teams      = random.randint(1, 2)

        return {
            # SCDF uses call_sign as primary ref
            "call_sign": f"SCDF-{station}-F{unit_num:02d}",
            "firewatch_ref": ticket_id,
            "incident_type": INCIDENT_TYPE_MAP.get(trigger.incident_type.value, "GENERAL"),
            "hazard_level": min(trigger.severity + random.randint(-1, 1), 5),
            "location": {
                # deliberate building-name noise
                "building_name": bname_tpl.format(n=blk, area=trigger.location.area),
                "postal_code": trigger.location.postal_code or f"{random.randint(100000,999999)}",
                "floor_level": random.randint(1, 20) if random.random() > 0.4 else None,
                "lat": trigger.location.lat,
                "lng": trigger.location.lng,
            },
            "resources_dispatched": {
                "fire_engines": [
                    {"unit_id": f"PE{random.randint(100,999)}", "station": station, "eta_minutes": random.randint(3, 12)}
                    for _ in range(n_engines)
                ],
                "rescue_teams": [
                    {"team_id": f"RT{random.randint(10,99)}", "specialisation": random.choice(SPECIALISATIONS)}
                    for _ in range(n_teams)
                ],
                "ambulances": [
                    {"amb_id": f"AM{random.randint(100,999)}", "paramedic_count": random.randint(2, 3)}
                    for _ in range(n_ambulances)
                ],
            },
            "casualties": {
                "injured": random.randint(0, trigger.severity * 3),
                "deceased": 0,
                "evacuated": random.randint(0, trigger.severity * 10),
            },
            "patient_conveyance": {
                "handoff_required": self._should_handoff_to_hospital(trigger),
                "ambulance_case_refs": [],
                "receiving_hospital": None,
            },
            "weather_conditions": random.choice(["Clear", "Light rain", "Heavy rain", None]),
            # station_log grows with updates
            "station_log": [
                {"ts": utcnow().isoformat(), "entry": f"Dispatch confirmed. {trigger.description}"}
            ],
        }

    def build_update_payload(self, ticket: dict, status: TicketStatus, note: str) -> dict:
        p = ticket["payload"].copy()
        p.setdefault("station_log", []).append({"ts": utcnow().isoformat(), "entry": note})
        # Casualties can evolve
        if status == TicketStatus.IN_PROGRESS:
            p["casualties"]["injured"] = max(0, p["casualties"]["injured"] + random.randint(-1, 3))
        return p

    def _should_handoff_to_hospital(self, trigger: IncidentTrigger) -> bool:
        if trigger.metadata.get("handoff"):
            return False
        if trigger.incident_type not in HOSPITAL_HANDOFF_TYPES:
            return False
        if trigger.incident_type == IncidentType.GAS_LEAK and trigger.severity < 3:
            return random.random() < 0.35
        return trigger.severity >= 2 or random.random() < 0.45

    async def _handoff_to_hospital(self, trigger: IncidentTrigger, scdf_ticket_id: str):
        await self._wait_for_http()
        patient_profile = self._patient_profile(trigger)
        patient_count = self._patient_count(trigger)
        hospital = route_hospital(
            location=trigger.location,
            incident_type=trigger.incident_type,
            severity=trigger.severity,
            patient_profile=patient_profile,
        )
        handoff_id = f"SCDF-HO-{new_id()[:8].upper()}"
        ambulance_refs = [
            f"AMB-{random.randint(100,999)}-{idx + 1}"
            for idx in range(max(1, min(patient_count, 4)))
        ]
        metadata = {
            **trigger.metadata,
            "handoff": {
                "handoff_id": handoff_id,
                "handoff_type": "AMBULANCE_CONVEYANCE",
                "from_agency": AgencyID.SCDF.value,
                "from_ticket_id": scdf_ticket_id,
                "receiving_cluster": hospital["cluster"].value,
                "receiving_hospital": hospital["code"],
                "receiving_hospital_name": hospital["name"],
                "patient_count": patient_count,
                "patient_profile": patient_profile,
                "triage": self._triage(trigger.severity, patient_count),
                "ambulance_refs": ambulance_refs,
                "handoff_created_at": utcnow().isoformat(),
            }
        }
        handoff_trigger = trigger.model_copy(
            update={
                "participating_agencies": [hospital["cluster"]],
                "span_id": new_id(),
                "metadata": metadata,
            }
        )

        await self._emit_patient_handoff(trigger, scdf_ticket_id, metadata["handoff"])

        cluster_url = HOSPITAL_CLUSTER_URLS[hospital["cluster"]]
        try:
            response = await self.http.post(
                f"{cluster_url}/handoff",
                json=handoff_trigger.model_dump(mode="json"),
                timeout=5,
            )
            log.info(
                "[scdf-simulator] handoff %s -> %s/%s %s",
                handoff_id,
                hospital["cluster"].value,
                hospital["code"],
                response.status_code,
            )
            self._record_handoff_on_ticket(scdf_ticket_id, hospital, metadata["handoff"])
        except Exception as exc:
            log.warning("[scdf-simulator] handoff %s failed: %s", handoff_id, exc)

    async def _emit_patient_handoff(self, trigger: IncidentTrigger, ticket_id: str, handoff: dict):
        if not self.middleware_url:
            return
        raw_message = {
            "message_kind": "agency_handoff",
            "sender": {
                "agency_id": self.AGENCY_ID.value,
                "org_id": self.AGENCY_ID.value,
                "system_id": self.SYSTEM_ID,
                "service_instance": os.getenv("HOSTNAME", "scdf"),
            },
            "external_incident_id": trigger.incident_id,
            "trace_id": trigger.trace_id,
            "parent_span_id": trigger.span_id,
            "incident": trigger.model_dump(mode="json"),
            "ticket": {
                "ticket_id": ticket_id,
                "status": self.tickets.get(ticket_id, {}).get("status", "OPEN"),
                "data": self.tickets.get(ticket_id, {}).get("payload", {}),
            },
            "logs": [],
            "handoff": handoff,
            "quality": {},
        }
        try:
            await self.http.post(
                f"{self.middleware_url}/events",
                json=raw_message,
                timeout=5,
            )
        except Exception as exc:
            log.warning("[scdf-simulator] handoff event emit failed: %s", exc)

    def _record_handoff_on_ticket(self, ticket_id: str, hospital: dict, handoff: dict):
        ticket = self.tickets.get(ticket_id)
        if not ticket:
            return
        payload = ticket["payload"]
        payload["patient_conveyance"] = {
            "handoff_required": True,
            "receiving_cluster": hospital["cluster"].value,
            "receiving_hospital": hospital["code"],
            "receiving_hospital_name": hospital["name"],
            "handoff_id": handoff["handoff_id"],
            "ambulance_case_refs": handoff["ambulance_refs"],
            "patient_count": handoff["patient_count"],
            "triage": handoff["triage"],
        }
        ticket["audit_log"].append({
            "ts": utcnow().isoformat(),
            "from": ticket["status"],
            "to": ticket["status"],
            "note": f"Patient handoff created for {hospital['code']}",
        })

    async def _wait_for_http(self):
        while self.http is None:
            await asyncio.sleep(0.05)

    def _patient_profile(self, trigger: IncidentTrigger) -> str:
        text = f"{trigger.description} {trigger.location.name}".lower()
        if "child" in text or "childcare" in text or "school" in text:
            return "child"
        if "pregnant" in text or "labour" in text or "maternity" in text:
            return "maternity"
        return random.choices(["adult", "elderly", "child"], weights=[0.72, 0.2, 0.08], k=1)[0]

    def _patient_count(self, trigger: IncidentTrigger) -> int:
        if trigger.incident_type == IncidentType.BUILDING_COLLAPSE:
            return random.randint(2, max(3, trigger.severity * 4))
        if trigger.incident_type == IncidentType.TRAFFIC_ACCIDENT:
            return random.randint(1, max(2, trigger.severity * 2))
        if trigger.incident_type == IncidentType.MEDICAL_EMERGENCY:
            return random.randint(1, max(1, trigger.severity))
        return random.randint(1, max(2, trigger.severity * 2))

    def _triage(self, severity: int, patient_count: int) -> dict:
        p1 = random.randint(0, max(0, severity - 3))
        p2 = random.randint(0, max(1, min(patient_count, severity)))
        p3 = max(0, patient_count - p1 - p2)
        return {"P1": p1, "P2": p2, "P3": p3}


simulator = SCDFSimulator()
app = simulator.create_app()
